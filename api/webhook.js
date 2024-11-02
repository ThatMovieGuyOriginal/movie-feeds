// api/webhook.js
import db from '../../config/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

const SECRET_TOKEN = process.env.WEBHOOK_SECRET; // Secure secret

export default async function handler(req, res) {
  if (req.query.secret !== SECRET_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, product_id, event_type } = req.body; // Assuming BMC sends these fields

  // Generate a unique token for the user
  const token = uuidv4();
  let type, expirationDate = null;

  try {
    if (event_type === 'Extras purchased') {
      type = 'genre';
    } else if (event_type === 'Support created') {
      type = 'support';
    } else if (event_type === 'Membership started') {
      type = 'membership';
      expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days, adjust if needed
    }

    // Save the purchase data in Firestore
    await db.collection('purchases').add({
      email,
      product_id,
      type,
      token,
      createdAt: new Date(),
      expirationDate,
    });

    res.status(200).json({ success: true, url: `/api/rss/${token}` });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
