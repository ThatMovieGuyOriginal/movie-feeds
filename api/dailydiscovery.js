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
    const csvFilePath = path.join(__dirname, '../movies', 'daily_discovery.csv');
    const fileTimestamp = new Date().getTime(); // Cache-busting timestamp

    if (!fs.existsSync(csvFilePath)) {
      res.status(404).send("No movie data found");
      return;
    }

    // Update headers to prevent caching and force refresh in Vercel environments
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
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
            released: row.released || "Release date unknown",
            url: row.url
          });
        }
      })
      .on('end', () => {
        if (movies.length > 0) {
          let rssFeed = <?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Daily Discovery</title>
    <description>Daily movie recommendations, streamlined for Radarr. No contracts. No costs. Ever.</description>;

          movies.forEach(movie => {
            rssFeed += 
    <item>
      <title>${escapeXml(movie.title)}</title>
      <link>${escapeXml(movie.url || https://www.themoviedb.org/movie/${movie.tmdb_id})}</link>
      <pubDate>${new Date(movie.released).toUTCString()}</pubDate>
      <description>${escapeXml(Released in ${movie.year}.)}</description>
    </item>;
          });

          rssFeed += 
  </channel>
</rss>;

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
