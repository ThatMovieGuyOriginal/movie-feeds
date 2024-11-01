const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '../movies', 'daily_discovery.csv');

    if (!fs.existsSync(csvFilePath)) {
      res.status(404).send("No movie data found");
      return;
    }

    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-store');

    const movies = [];
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        movies.push(row);
      })
      .on('end', () => {
        if (movies.length > 0) {
          // Generate RSS feed content without extra whitespace at the start
          let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Daily Movie Discovery</title>
    <description>Daily movie recommendations, streamlined for Radarr. No cost. Ever.!</description>`;

          movies.forEach(movie => {
            rssFeed += `
    <item>
      <title>${movie.title}</title>
      <link>${movie.url || `https://www.themoviedb.org/movie/${movie.tmdb_id}`}</link>
      <pubDate>${new Date(movie.released).toUTCString()}</pubDate>
      <description>${movie.year ? `Released in ${movie.year}.` : 'No additional details available.'}</description>
    </item>`;
          });

          rssFeed += `
  </channel>
</rss>`;

          res.setHeader('Content-Type', 'application/rss+xml');
          res.send(rssFeed.trim()); // Ensure no extra whitespace
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
