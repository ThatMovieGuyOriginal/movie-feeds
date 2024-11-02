// api/rss/[token].js
import db from '../../config/firebaseAdmin';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }[c];
  });
}

// Function to fetch description from TMDB
async function fetchMovieDescription(tmdb_id, api_key) {
  const url = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${api_key}&language=en-US`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.overview || "Description not available."; // Fallback if no description is provided
  } catch (error) {
    console.error(`Error fetching description for TMDB ID ${tmdb_id}:`, error);
    return "Description not available."; // Fallback on error
  }
}

// Function to generate RSS feed from a CSV file
async function generateRssFeedFromCsv(csvFilePath, api_key) {
  return new Promise((resolve, reject) => {
    const movies = [];

    if (!fs.existsSync(csvFilePath)) {
      return reject("CSV file not found");
    }

    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ quote: '"', escape: '"', relax: true }))
      .on('data', (row) => {
        if (row.title && row.tmdb_id) {
          movies.push({
            title: row.title,
            year: row.year || "Unknown Year",
            imdb_id: row.imdb_id,
            tmdb_id: row.tmdb_id,
            released: row.released || "Release date unknown",
            url: row.url
          });
        }
      })
      .on('end', async () => {
        if (movies.length === 0) {
          return reject("No movies found in CSV");
        }

        let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <title>Custom Movie List</title>
              <description>Movies based on your purchased list.</description>`;

        for (const movie of movies) {
          const releaseDate = new Date(movie.released);
          const pubDate = isNaN(releaseDate.getTime()) ? "Unknown Date" : releaseDate.toUTCString();

          const description = await fetchMovieDescription(movie.tmdb_id, api_key);

          rssFeed += `
            <item>
              <title>${escapeXml(movie.title)}</title>
              <link>${escapeXml(movie.url || `https://www.themoviedb.org/movie/${movie.tmdb_id}`)}</link>
              <pubDate>${pubDate}</pubDate>
              <description>${escapeXml(description)}</description>
            </item>`;
        }

        rssFeed += `
            </channel>
          </rss>`;

        resolve(rssFeed);
      })
      .on('error', (err) => {
        console.error("Error reading CSV file:", err);
        reject("Error reading CSV file");
      });
  });
}

export default async function handler(req, res) {
  const { token } = req.query;

  try {
    // Retrieve the purchase record from Firestore using the token
    const snapshot = await db.collection('purchases').where('token', '==', token).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const purchase = snapshot.docs[0].data();
    const { product_id, type } = purchase;

    // Check if the token has expired (optional)
    if (purchase.expirationDate && new Date() > purchase.expirationDate.toDate()) {
      return res.status(403).json({ error: 'Token expired' });
    }

    // Retrieve the feed metadata from Firestore based on product_id
    const feedSnapshot = await db.collection('feeds').doc(product_id).get();

    if (!feedSnapshot.exists) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    const { csv_file_path, title, description } = feedSnapshot.data();
    const api_key = process.env.TMDB_API_KEY; // TMDB API key stored in environment variables

    // Generate RSS feed content from the CSV
    const rssContent = await generateRssFeedFromCsv(csv_file_path, api_key);

    // Set content type for RSS and return the RSS feed
    res.setHeader('Content-Type', 'application/rss+xml');
    res.status(200).send(rssContent);

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send("Error generating RSS feed");
  }
}
