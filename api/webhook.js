// api/webhook.js
import db from '../../config/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

const SECRET_TOKEN = process.env.WEBHOOK_SECRET; // Set this in your Vercel environment variables

export default async function handler(req, res) {
  // Verify the secret token
  if (req.query.secret !== SECRET_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract necessary data from the request payload
  const { email, product_id } = req.body; // Assume BMC sends these fields in the webhook payload

  // Generate a unique token for the user
  const token = uuidv4();

  try {
    // Save the purchase data in Firestore
    await db.collection('purchases').add({
      email,
      product_id,
      token,
      createdAt: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Send back a success response with the unique RSS feed URL
    res.status(200).json({ success: true, url: `/api/rss/${token}` });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
