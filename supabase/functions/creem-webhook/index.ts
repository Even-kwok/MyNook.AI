// Creem Webhook Handler
// Handles payment events from Creem and updates user subscriptions and credits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Creem Webhook Secret (from environment variable)
const CREEM_WEBHOOK_SECRET = Deno.env.get("CREEM_WEBHOOK_SECRET");

// Supabase client with service role (can bypass RLS)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Product ID to tier mapping
const PRODUCT_TO_TIER: Record<string, { tier: string; billing: string; credits: number }> = {
  // Pro subscriptions
  "prod_2JlRhCPx3dJVaQUNLRgo6D": { tier: "pro", billing: "monthly", credits: 200 },
  "prod_43bA82tdR38NzQksz6fHxH": { tier: "pro", billing: "yearly", credits: 200 },
  // Premium subscriptions
  "prod_3wRnKHJa6LSF5afsd1QjEG": { tier: "premium", billing: "monthly", credits: 600 },
  "prod_18rfRuIGJVtWPeIIfZpLWA": { tier: "premium", billing: "yearly", credits: 600 },
  // Business subscriptions
  "prod_wMGy2WQe6Kv5PmTZLjcsn": { tier: "business", billing: "monthly", credits: 2000 },
  "prod_6065m1QjyimGZ8lg15pqB5": { tier: "business", billing: "yearly", credits: 2000 },
};

// Credit bundles
const CREDIT_BUNDLES: Record<string, number> = {
  "prod_22tEVFxJtOQU8cm5H10bZc": 100,
  "prod_3E171a5TGDhmBhtYM0Gbk3": 300,
  "prod_MmthQ5RlRKNalU3rEsowB": 1000,
};

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!CREEM_WEBHOOK_SECRET) {
    console.error("❌ CREEM_WEBHOOK_SECRET not configured");
    return false;
  }
  
  // TODO: Implement actual signature verification
  // Creem should provide documentation on how to verify signatures
  // For now, we'll accept all requests if secret is configured
  return true;
}

// Handle subscription events
async function handleSubscription(event: any) {
  console.log("📦 Processing subscription event:", event.type);
  
  const { data: eventData } = event;
  const productId = eventData.product_id;
  const userId = eventData.metadata?.user_id || eventData.customer_id;
  
  if (!userId) {
    console.error("❌ No user_id in event data");
    return { error: "Missing user_id" };
  }
  
  const tierInfo = PRODUCT_TO_TIER[productId];
  if (!tierInfo) {
    console.error("❌ Unknown product ID:", productId);
    return { error: "Unknown product" };
  }
  
  const { tier, billing, credits } = tierInfo;
  
  // Calculate expiry date
  const now = new Date();
  const expiryDate = new Date(now);
  if (billing === "monthly") {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }
  
  try {
    // Update user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        subscription_tier: tier,
        credits: supabase.rpc("increment", { x: credits }), // Add credits
      })
      .eq("id", userId);
    
    if (profileError) {
      console.error("❌ Error updating user profile:", profileError);
      return { error: profileError.message };
    }
    
    // Create or update subscription record
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        tier,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: expiryDate.toISOString(),
        cancel_at_period_end: false,
      });
    
    if (subscriptionError) {
      console.error("❌ Error creating subscription:", subscriptionError);
      return { error: subscriptionError.message };
    }
    
    // Log credit transaction
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: credits,
        transaction_type: "subscription",
        description: `${tier} subscription (${billing})`,
      });
    
    if (transactionError) {
      console.error("❌ Error logging transaction:", transactionError);
      // Non-critical, continue
    }
    
    console.log(`✅ Subscription activated: ${tier} (${billing}) for user ${userId}`);
    return { success: true, tier, credits };
  } catch (error) {
    console.error("❌ Error handling subscription:", error);
    return { error: error.message };
  }
}

// Handle one-time payment (credit bundles)
async function handlePayment(event: any) {
  console.log("💳 Processing payment event:", event.type);
  
  const { data: eventData } = event;
  const productId = eventData.product_id;
  const userId = eventData.metadata?.user_id || eventData.customer_id;
  
  if (!userId) {
    console.error("❌ No user_id in event data");
    return { error: "Missing user_id" };
  }
  
  const credits = CREDIT_BUNDLES[productId];
  if (!credits) {
    console.error("❌ Unknown credit bundle:", productId);
    return { error: "Unknown credit bundle" };
  }
  
  try {
    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    
    if (fetchError) {
      console.error("❌ Error fetching user profile:", fetchError);
      return { error: fetchError.message };
    }
    
    const newCredits = (profile.credits || 0) + credits;
    
    // Update user credits
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ credits: newCredits })
      .eq("id", userId);
    
    if (updateError) {
      console.error("❌ Error updating credits:", updateError);
      return { error: updateError.message };
    }
    
    // Log credit transaction
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: credits,
        transaction_type: "purchase",
        description: `Purchased ${credits} credits`,
      });
    
    if (transactionError) {
      console.error("❌ Error logging transaction:", transactionError);
      // Non-critical, continue
    }
    
    console.log(`✅ Credits added: ${credits} for user ${userId} (total: ${newCredits})`);
    return { success: true, credits, total: newCredits };
  } catch (error) {
    console.error("❌ Error handling payment:", error);
    return { error: error.message };
  }
}

// Handle subscription cancellation
async function handleCancellation(event: any) {
  console.log("❌ Processing cancellation event");
  
  const { data: eventData } = event;
  const userId = eventData.metadata?.user_id || eventData.customer_id;
  
  if (!userId) {
    console.error("❌ No user_id in event data");
    return { error: "Missing user_id" };
  }
  
  try {
    // Update subscription to cancelled
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancel_at_period_end: true,
      })
      .eq("user_id", userId);
    
    if (subscriptionError) {
      console.error("❌ Error cancelling subscription:", subscriptionError);
      return { error: subscriptionError.message };
    }
    
    // Note: We don't immediately downgrade the user to 'free'
    // They keep their tier until current_period_end
    // A separate cron job should handle expiration
    
    console.log(`✅ Subscription cancelled for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error handling cancellation:", error);
    return { error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get webhook signature from headers
    const signature = req.headers.get("creem-signature") || req.headers.get("x-creem-signature");
    
    // Read request body
    const body = await req.text();
    
    // Verify signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error("❌ Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse event
    const event = JSON.parse(body);
    console.log("📨 Received webhook event:", event.type);
    
    let result;
    
    // Handle different event types
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.renewed":
        result = await handleSubscription(event);
        break;
      
      case "charge.succeeded":
      case "payment.succeeded":
        // Check if it's a credit bundle purchase
        const productId = event.data?.product_id;
        if (CREDIT_BUNDLES[productId]) {
          result = await handlePayment(event);
        } else {
          // It's a subscription payment, already handled by subscription events
          result = { success: true, message: "Subscription payment recorded" };
        }
        break;
      
      case "subscription.cancelled":
      case "subscription.expired":
        result = await handleCancellation(event);
        break;
      
      default:
        console.log("⚠️ Unhandled event type:", event.type);
        result = { success: true, message: "Event acknowledged but not processed" };
    }
    
    // Return success response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});



