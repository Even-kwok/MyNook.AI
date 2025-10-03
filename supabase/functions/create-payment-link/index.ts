// Secure Payment Link Creation API
// 安全的支付链接创建API - 所有敏感信息都在后端处理

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 从环境变量获取配置（安全存储在Supabase Secrets中）
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CREEM_API_KEY = Deno.env.get('CREEM_API_KEY')! // 存储在Supabase Secrets中

// Creem 产品配置（后端安全存储）
const CREEM_PRODUCTS = {
  subscriptions: {
    pro: {
      monthly: 'prod_2JlRhCPx3dJVaQUNLRgo6D',
      yearly: 'prod_43bA82tdR38NzQksz6fHxH',
    },
    premium: {
      monthly: 'prod_3wRnKHJa6LSF5afsd1QjEG',
      yearly: 'prod_18rfRuIGJVtWPeIIfZpLWA',
    },
    business: {
      monthly: 'prod_wMGy2WQe6Kv5PmTZLjcsn',
      yearly: 'prod_6065m1QjyimGZ8lg15pqB5',
    },
  },
  credits: {
    small: 'prod_22tEVFxJtOQU8cm5H10bZc',
    medium: 'prod_3E171a5TGDhmBhtYM0Gbk3',
    large: 'prod_MmthQ5RlRKNalU3rEsowB',
  },
} as const;

const CREEM_PAYMENT_BASE_URL = 'https://www.creem.io/payment';

interface PaymentRequest {
  type: 'subscription' | 'credits';
  tier?: 'pro' | 'premium' | 'business';
  billingCycle?: 'monthly' | 'yearly';
  creditSize?: 'small' | 'medium' | 'large';
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 验证请求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取授权token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 初始化Supabase客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 验证用户token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 解析请求体
    const paymentRequest: PaymentRequest = await req.json()
    
    console.log('🔒 Secure payment request:', {
      userId: user.id,
      userEmail: user.email,
      request: paymentRequest
    })

    // 验证请求参数
    if (!paymentRequest.type) {
      return new Response(
        JSON.stringify({ error: 'Payment type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let productId: string
    let successUrl: string
    let metadata: Record<string, string> = {
      user_id: user.id,
      user_email: user.email || '',
    }

    // 根据支付类型获取产品ID
    if (paymentRequest.type === 'subscription') {
      if (!paymentRequest.tier || !paymentRequest.billingCycle) {
        return new Response(
          JSON.stringify({ error: 'Tier and billing cycle are required for subscriptions' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      productId = CREEM_PRODUCTS.subscriptions[paymentRequest.tier][paymentRequest.billingCycle]
      successUrl = `${req.headers.get('origin') || 'https://my-nook.ai'}/?payment=success&type=subscription&tier=${paymentRequest.tier}&billing=${paymentRequest.billingCycle}`
      
      metadata.type = 'subscription'
      metadata.tier = paymentRequest.tier
      metadata.billing_cycle = paymentRequest.billingCycle

    } else if (paymentRequest.type === 'credits') {
      if (!paymentRequest.creditSize) {
        return new Response(
          JSON.stringify({ error: 'Credit size is required for credit purchases' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      productId = CREEM_PRODUCTS.credits[paymentRequest.creditSize]
      successUrl = `${req.headers.get('origin') || 'https://my-nook.ai'}/?payment=success&type=credits&size=${paymentRequest.creditSize}`
      
      metadata.type = 'credit_purchase'
      metadata.pack_size = paymentRequest.creditSize

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid payment type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 构建安全的支付链接
    const cancelUrl = `${req.headers.get('origin') || 'https://my-nook.ai'}/?payment=cancelled`
    
    const params = new URLSearchParams({
      client_reference_id: user.id,
      prefilled_email: user.email || '',
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    // 添加metadata
    Object.entries(metadata).forEach(([key, value]) => {
      params.set(`metadata[${key}]`, value)
    })

    const paymentLink = `${CREEM_PAYMENT_BASE_URL}/${productId}?${params.toString()}`

    // 记录支付请求（审计日志）
    const { error: logError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        payment_type: paymentRequest.type,
        product_id: productId,
        metadata: metadata,
        created_at: new Date().toISOString(),
      })

    if (logError) {
      console.warn('⚠️ Failed to log payment request:', logError)
      // 不阻塞支付流程，但记录警告
    }

    console.log('✅ Secure payment link created:', {
      userId: user.id,
      productId,
      type: paymentRequest.type
    })

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink,
        productId,
        metadata
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error creating payment link:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
