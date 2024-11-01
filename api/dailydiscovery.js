const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

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

module.exports = async (req, res) => {
  try {
    const csvFilePath = path.resolve(__dirname, '../movies/daily_discovery.csv');
    console.log("Resolved CSV File Path:", csvFilePath); // Log the file path for debugging

    const fileTimestamp = new Date().getTime(); // Cache-busting timestamp

    if (!fs.existsSync(csvFilePath)) {
      res.status(404).send("No movie data found");
      return;
    }

    // Update headers to control caching in Vercel environments
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    const movies = [];
    fs.createReadStream(${csvFilePath}?t=${fileTimestamp}) // Adds timestamp parameter
      .pipe(csvParser())
      .on('data', (row) => {
        // Validate and push each row into movies array if it has essential fields
        if (row.title && row.tmdb_id) {
          movies.push({
            title: row.title,
            year: row.year || "Unknown Year", // Fallback for missing year
            imdb_id: row.imdb_id,
            tmdb_id: row.tmdb_id,
            released: row.released || new Date().toISOString(), // Default to current date if missing
            url: row.url
        });
      }
    });

    if (movies.length > 0) {
      const rssFeed = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<rss version="2.0">`,
        `  <channel>`,
        `    <title>Daily Discovery</title>`,
        `    <description>Daily movie recommendations, streamlined for Radarr. No contracts. No costs. Ever.</description>`
      ];

      movies.forEach(movie => {
        rssFeed.push(`
          <item>
            <title>${escapeXml(movie.title)}</title>
            <link>${escapeXml(movie.url || `https://www.themoviedb.org/movie/${movie.tmdb_id}`)}</link>
            <pubDate>${new Date(movie.released).toUTCString()}</pubDate>
            <description>${escapeXml(`Released in ${movie.year}.`)}</description>
          </item>`);
      });

      rssFeed.push(`  </channel>`, `</rss>`);
      res.setHeader('Content-Type', 'application/rss+xml');
      res.send(rssFeed.join('\n'));
    } else {
      // Graceful fallback message if no movies found
      const fallbackFeed = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<rss version="2.0">`,
        `  <channel>`,
        `    <title>Daily Discovery</title>`,
        `    <description>Daily movie recommendations, streamlined for Radarr. No contracts. No costs. Ever.</description>`,
        `    <item>`,
        `      <title>No Movies Available</title>`,
        `      <description>We're having some technical difficulties, but working hard to get it resolved. Please check back later!</description>`,
        `    </item>`,
        `  </channel>`,
        `</rss>`
      ];
      res.setHeader('Content-Type', 'application/rss+xml');
      res.send(fallbackFeed.join('\n'));
    }

  } catch (err) {
    console.error("Server error:", err.message); // Enhanced error logging
    res.status(500).send(`Server error: ${err.message}`);
  }
};
