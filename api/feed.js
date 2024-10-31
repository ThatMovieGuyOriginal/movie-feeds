const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const csvFilePath = path.join(__dirname, '../movies', 'daily_discovery.csv');

  // Check if the file exists
  if (!fs.existsSync(csvFilePath)) {
    res.status(404).send("No movie data found");
    return;
  }

  // Read the entries from daily_discovery.csv
  const movies = [];
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
      movies.push(row); // Add each row (movie) to the movies array
    })
    .on('end', () => {
      if (movies.length > 0) {
        // Generate RSS feed content
        let rssFeed = `
          <?xml version="1.0" encoding="UTF-8" ?>
          <rss version="2.0">
            <channel>
              <title>Daily Movie Discovery</title>
              <description>Enjoy two new movie recommendations every 12 hours!</description>`;

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
        res.send(rssFeed);
      } else {
        res.status(500).send("Error generating RSS feed");
      }
    });
};
