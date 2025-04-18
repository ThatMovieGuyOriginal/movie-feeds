const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

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

// Initialize Firebase (if needed for storage)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://your-firebase-database-url.firebaseio.com" // Replace with your Firebase URL
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

module.exports = async (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '../movies', 'daily_discovery.csv');
    const api_key = process.env.TMDB_API_KEY; // Assume TMDB API key is stored in environment variables
    const fileTimestamp = new Date().getTime(); // Cache-busting timestamp

    if (!fs.existsSync(csvFilePath)) {
      res.status(404).send("No movie data found");
      return;
    }

    // Retrieve or generate a unique user code
    let userCode = req.query.userCode;
    if (!userCode) {
      userCode = crypto.randomBytes(4).toString('hex'); // Generate a random 8-character code
    }
    
    // Store or retrieve user code in Firebase if tracking users
    if (req.query.userCode) {
      const db = admin.database();
      const userRef = db.ref(`users/${userCode}`);
      const userData = await userRef.once('value');
      if (!userData.exists()) {
        await userRef.set({ createdAt: new Date().toISOString() });
      }
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    const movies = [];
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
        if (movies.length > 0) {
          let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <title>Daily Discovery - User Code: ${userCode}</title>
              <description>Daily movie recommendations personalized for User ${userCode}</description>`;

          // Use for...of loop to support async/await within the loop
          for (const movie of movies) {
            const releaseDate = new Date(movie.released);
            const pubDate = isNaN(releaseDate.getTime()) ? "Unknown Date" : releaseDate.toUTCString();
            
            // Fetch the description using TMDB API
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

          res.setHeader('Content-Type', 'application/rss+xml');
          res.send(rssFeed.trim());
        } else {
          res.status(500).send("Error generating RSS feed: No movies found");
        }
      })
      .on('error', (err) => {
        console.error("Error reading CSV file:", err);
        res.status(500).send("Error reading CSV file");
      });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server error");
  }
};
