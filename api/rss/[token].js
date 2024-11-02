// api/rss/[token].js
import db from '../../config/firebaseAdmin'; // Import Firestore config if using Firebase

// Placeholder function to retrieve static RSS content
async function getStaticRssFeedContent() {
  // Here, return the static RSS feed content. 
  // You could load this from a file, a database, or a hardcoded string.
  return `
    <rss version="2.0">
      <channel>
        <title>Your Custom Feed</title>
        <link>https://yourdomain.vercel.app</link>
        <description>This is a static RSS feed for all valid users.</description>
        <item>
          <title>Movie 1</title>
          <link>https://link-to-movie-1</link>
          <description>Movie 1 description</description>
        </item>
        <item>
          <title>Movie 2</title>
          <link>https://link-to-movie-2</link>
          <description>Movie 2 description</description>
        </item>
        <!-- Add more items as needed -->
      </channel>
    </rss>
  `;
}

export default async function handler(req, res) {
  const { token } = req.query;

  try {
    // Validate the token by checking it against Firestore
    const snapshot = await db.collection('purchases').where('token', '==', token).get();

    if (snapshot.empty) {
      // Token is invalid if no match found in Firestore
      return res.status(404).json({ error: 'Invalid token' });
    }

    const purchase = snapshot.docs[0].data();

    // Check if the token has expired (optional)
    if (purchase.expirationDate && new Date() > purchase.expirationDate.toDate()) {
      return res.status(403).json({ error: 'Token expired' });
    }

    // If token is valid, get the static RSS feed content
    const rssContent = await getStaticRssFeedContent();

    // Set content type for RSS and return the static content
    res.setHeader('Content-Type', 'application/rss+xml');
    res.status(200).send(rssContent);

  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
