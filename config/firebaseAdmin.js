// api/webhook.js
import db from "../firebaseAdmin";

export default async function handler(req, res) {
  // Example Firestore write operation
  await db.collection("purchases").add({
    email: "sampleuser@example.com",
    product_id: "list1",
    token: "uniqueToken",
    createdAt: new Date(),
  });

  res.status(200).json({ success: true });
}
