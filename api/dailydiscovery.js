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
    // Read file asynchronously
    const csvData = await fs.promises.readFile(csvFilePath, 'utf8');
    
    csvData.split('\n').slice(1).forEach((line) => {
      const row = line.split(','); // Adjust according to CSV structure
      if (row[0] && row[3]) { // Check essential fields exist
        movies.push({
          title: row[0],
          year: row[1] || "Unknown Year",
          imdb_id: row[2],
          tmdb_id: row[3],
          released: row[4] || "Release date unknown",
          url: row[5]
        });
      }
    });

    if (movies.length > 0) {
      const rssFeed = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<rss version="2.0">`,
        `  <channel>`,
        `    <title>Daily Movie Discovery</title>`,
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
        `    <title>Daily Movie Discovery</title>`,
        `    <description>Daily movie recommendations, streamlined for Radarr. No contracts. No costs. Ever.</description>`,
        `    <item>`,
        `      <title>No Movies Available</title>`,
        `      <description>No movies available for today. Please check back later!</description>`,
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
