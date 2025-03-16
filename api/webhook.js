// api/webhook.js
import { subscriptionManager } from '../lib/firebase-admin';
import { createHash, timingSafeEqual } from 'crypto';

// Plan ID mapping for different payment options
const PLAN_MAPPING = {
  'premium_monthly': 'premium-monthly',
  'premium_yearly': 'premium-yearly',
  'ultimate_monthly': 'ultimate-monthly',
  'ultimate_yearly': 'ultimate-yearly',
  'membership': 'premium-monthly', // Default BMC membership to premium monthly
  'extras': 'genre-pack'           // BMC extras to genre pack
};

/**
 * Verify BMC webhook signature to ensure the request is legitimate
 * @param {Object} req - The request object
 * @returns {boolean} Whether the signature is valid
 */
function verifyBmcSignature(req) {
  const hmacHeader = req.headers['x-bmc-signature'];
  const timestamp = req.headers['x-bmc-timestamp'];
  
  if (!hmacHeader || !timestamp) {
    return false;
  }
  
  // Verify that request isn't too old (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - parseInt(timestamp) > 300) { // 5 minute window
    return false;
  }
  
  // Recreate the expected signature
  const secret = process.env.BMC_WEBHOOK_SECRET;
  const payload = JSON.stringify(req.body);
  const message = `${timestamp}.${payload}`;
  
  const computedHmac = createHash('sha256')
    .update(`${secret}${message}`)
    .digest('hex');
    
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(hmacHeader), 
      Buffer.from(computedHmac)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Handler for webhook requests from payment providers
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Determine which payment provider sent the webhook
  const provider = req.query.provider || 'bmc'; // Default to Buy Me a Coffee
  
  try {
    switch (provider) {
      case 'bmc': // Buy Me a Coffee
        return await handleBmcWebhook(req, res);
      
      case 'stripe': // Stripe (future implementation)
        return await handleStripeWebhook(req, res);
      
      default:
        return res.status(400).json({ error: 'Unsupported payment provider' });
    }
  } catch (error) {
    console.error(`Error processing ${provider} webhook:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle Buy Me a Coffee webhooks
 */
async function handleBmcWebhook(req, res) {
  // Verify the webhook signature
  if (!verifyBmcSignature(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  const { event_type, event_data } = req.body;
  
  // Extract data based on event type
  switch (event_type) {
    case 'subscription_created':
    case 'membership_created': {
      const { supporter_email, support_type, support_coffees, support_note } = event_data;
      
      // Map BMC support type to our internal plan ID
      const planType = support_type === 'monthly' ? 'premium_monthly' : 'premium_yearly';
      const planId = PLAN_MAPPING[planType] || 'premium-monthly';
      
      // Upgrade to ultimate based on coffee quantity if applicable
      const upgradedPlanId = support_coffees >= 3 
        ? planId.replace('premium', 'ultimate')
        : planId;
      
      // Create the subscription record
      const subscription = await subscriptionManager.createSubscription(
        supporter_email,
        upgradedPlanId,
        'buymeacoffee',
        {
          bmcEventType: event_type,
          coffees: support_coffees,
          note: support_note,
          timestamp: new Date().toISOString()
        }
      );
      
      // Return the feed URL with token for the user
      return res.status(200).json({
        success: true,
        message: 'Subscription created successfully',
        feedUrl: `https://${req.headers.host}/api/rss/${subscription.token}`
      });
    }
    
    case 'subscription_updated': {
      // Handle subscription updates (e.g., tier changes)
      const { supporter_email, subscription_id } = event_data;
      
      // For now, just acknowledge the update
      return res.status(200).json({
        success: true,
        message: 'Subscription update acknowledged'
      });
    }
    
    case 'subscription_cancelled': {
      // Cancel the subscription
      const { supporter_email, subscription_id } = event_data;
      
      // Find and cancel the subscription by BMC ID in metadata
      // This would require a query to find the subscription with this BMC ID
      // For simplicity, we'll just acknowledge for now
      
      return res.status(200).json({
        success: true,
        message: 'Subscription cancellation acknowledged'
      });
    }
    
    case 'support_created': {
      // One-time support/purchase
      const { supporter_email, support_coffees, support_note } = event_data;
      
      // Determine what was purchased based on coffees/note
      const isGenrePack = support_note?.toLowerCase().includes('genre') || false;
      const planId = isGenrePack ? 'genre-pack' : 'one-time-support';
      
      // Create a subscription record with appropriate expiration
      const subscription = await subscriptionManager.createSubscription(
        supporter_email,
        planId,
        'buymeacoffee',
        {
          bmcEventType: 'support_created',
          coffees: support_coffees,
          note: support_note,
          timestamp: new Date().toISOString()
        }
      );
      
      return res.status(200).json({
        success: true,
        message: 'One-time support recorded',
        feedUrl: isGenrePack 
          ? `https://${req.headers.host}/api/rss/${subscription.token}`
          : null
      });
    }
    
    default:
      // Acknowledge other event types
      return res.status(200).json({
        success: true,
        message: `Unhandled event type: ${event_type}`
      });
  }
}

/**
 * Handle Stripe webhooks (future implementation)
 */
async function handleStripeWebhook(req, res) {
  // Placeholder for future Stripe integration
  return res.status(501).json({ error: 'Stripe webhooks not yet implemented' });
}
