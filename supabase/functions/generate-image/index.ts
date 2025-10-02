// Import Deno server for Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Gemini API integration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// Use the correct image preview model (same as frontend)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateImageRequest {
  instruction: string;
  base64Images: string[];
  templateIds: string[]; // 添加模板IDs
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { instruction, base64Images, templateIds }: GenerateImageRequest = await req.json();
    
    // ⚡ 性能优化：并行处理模板查询和其他操作
    const templatePromise = templateIds && templateIds.length > 0 
      ? supabaseClient
          .from('prompt_templates')
          .select('prompt, name')
          .in('template_id', templateIds)
          .eq('is_active', true)
      : Promise.resolve({ data: null, error: null });

    // 🔒 安全措施：从数据库获取模板的提示词，而不是从前端传递
    let fullInstruction = instruction;

    if (!instruction || !base64Images || base64Images.length === 0) {
      throw new Error('Missing required parameters: instruction and base64Images');
    }

    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('credits, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    const CREDITS_REQUIRED = 1;

    if (profile.credits < CREDITS_REQUIRED) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          credits_required: CREDITS_REQUIRED,
          credits_available: profile.credits,
        }),
        {
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⚡ 性能优化：并行处理数据库操作
    const [templateResult, generationResult] = await Promise.all([
      templatePromise,
      // 创建generation记录
      supabaseClient
        .from('generations')
        .insert({
          user_id: user.id,
          type: 'free_canvas', // You can make this dynamic based on request
          prompt: fullInstruction, // 使用完整的指令（包含模板提示词）
          status: 'processing',
          credits_used: CREDITS_REQUIRED,
        })
        .select()
        .single()
    ]);

    // 处理模板查询结果
    const { data: templates, error: templateError } = templateResult;
    if (templateError) {
      console.error('Error fetching templates:', templateError);
    } else if (templates && templates.length > 0) {
      // 组合所有模板的提示词
      const templatePrompts = templates.map(t => t.prompt).join(' ');
      fullInstruction = `${templatePrompts}\n\nAdditional instructions: ${instruction}`;
      
      console.log(`Using ${templates.length} template(s):`, templates.map(t => t.name).join(', '));
    }

    // 处理generation创建结果
    const { data: generation, error: genError } = generationResult;
    if (genError) {
      throw new Error('Failed to create generation record');
    }

    // ⚡ 异步扣除积分，不阻塞API调用
    const deductCreditsAsync = async () => {
      const { data: deductResult, error: deductError } = await supabaseClient.rpc(
        'deduct_credits',
        {
          user_id_param: user.id,
          credits_amount: CREDITS_REQUIRED,
          transaction_type: 'generation',
          transaction_description: `AI Image Generation: ${instruction.substring(0, 50)}...`,
          generation_id_param: generation.id,
        }
      );

      if (deductError || !deductResult) {
        console.error('Failed to deduct credits:', deductError);
        // 异步标记为失败
        await supabaseClient
          .from('generations')
          .update({ status: 'failed', error_message: 'Failed to deduct credits' })
          .eq('id', generation.id);
        throw new Error('Failed to deduct credits');
      }
      return deductResult;
    };

    // 启动异步积分扣除，但不等待
    const creditsPromise = deductCreditsAsync();

    // Prepare Gemini API request
    const imageParts = base64Images.map((img) => ({
      inline_data: {
        mime_type: 'image/png',
        data: img,
      },
    }));

      const geminiRequest = {
        contents: [
          {
            parts: [
              ...imageParts,
              { text: fullInstruction }, // 使用完整的指令（包含模板提示词）
            ],
          },
        ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    // Call Gemini API (wrapped in try-catch for rollback)
    let geminiResponse;
    let geminiData;
    
    try {
      geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      geminiData = await geminiResponse.json();

      // Log the full response for debugging
      console.log('Gemini API Response:', JSON.stringify(geminiData, null, 2));

      // Extract image from response
      const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inline_data || p.inlineData
      );

      if (!imagePart) {
        console.error('No image part found. Full response:', geminiData);
        throw new Error(`No image data in Gemini API response`);
      }

      // Handle both inline_data and inlineData formats
      const imageData = imagePart.inline_data || imagePart.inlineData;
      
      if (!imageData) {
        throw new Error('Image part found but no data');
      }

      const base64Data = imageData.data;
      const imageDataUrl = `data:image/png;base64,${base64Data}`;

      // Update generation record as completed
      await supabaseClient
        .from('generations')
        .update({
          status: 'completed',
          output_image_url: imageDataUrl,
        })
        .eq('id', generation.id);

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: imageDataUrl,
          generation_id: generation.id,
          credits_used: CREDITS_REQUIRED,
          credits_remaining: profile.credits - CREDITS_REQUIRED,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (generationError) {
      // CRITICAL: Rollback credits on failure
      console.error('Generation failed, rolling back credits:', generationError);
      
      // Refund credits
      await supabaseClient.rpc('add_credits', {
        user_id_param: user.id,
        credits_amount: CREDITS_REQUIRED,
        transaction_type: 'refund',
        transaction_description: `Refund for failed generation: ${generationError.message}`,
      });

      // Update generation record as failed
      await supabaseClient
        .from('generations')
        .update({
          status: 'failed',
          error_message: generationError instanceof Error ? generationError.message : String(generationError),
        })
        .eq('id', generation.id);

      // Return error response
      return new Response(
        JSON.stringify({
          error: generationError instanceof Error ? generationError.message : 'Generation failed',
          credits_refunded: true,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-image function:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

