// api/rss-daily-discovery.js
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { format } = require('date-fns');

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
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

// Function to fetch movie details from TMDB
async function fetchMovieDetails(tmdb_id, api_key) {
  const url = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${api_key}&language=en-US&append_to_response=credits,keywords,recommendations,watch/providers`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract director(s)
    const directors = data.credits?.crew
      ?.filter(person => person.job === 'Director')
      .map(director => director.name) || [];
    
    // Extract main cast (top 5)
    const cast = data.credits?.cast
      ?.slice(0, 5)
      .map(actor => actor.name) || [];
    
    // Extract genres
    const genres = data.genres?.map(genre => genre.name) || [];
    
    // Extract keywords
    const keywords = data.keywords?.keywords
      ?.map(keyword => keyword.name) || [];
    
    // Check if streaming info is available (US region)
    const streamingProviders = data['watch/providers']?.results?.US?.flatrate || [];
    
    return {
      title: data.title,
      original_title: data.original_title,
      overview: data.overview || "Description not available.",
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      directors,
      cast,
      genres,
      keywords,
      imdb_id: data.imdb_id,
      streaming_providers: streamingProviders,
      budget: data.budget,
      revenue: data.revenue,
      tagline: data.tagline,
      recommendations: data.recommendations?.results?.slice(0, 5) || []
    };
  } catch (error) {
    console.error(`Error fetching details for TMDB ID ${tmdb_id}:`, error);
    return {
      overview: "Description not available.",
      directors: [],
      cast: [],
      genres: [],
      keywords: []
    };
  }
}

// Create a rich HTML description for RSS
function createRichDescription(movieDetails) {
  const streamingInfo = movieDetails.streaming_providers?.length > 0 
    ? `
      <p><strong>Available on:</strong> ${movieDetails.streaming_providers.map(provider => provider.provider_name).join(', ')}</p>
    ` 
    : '';
  
  const recommendations = movieDetails.recommendations?.length > 0
    ? `
      <div style="margin-top: 15px;">
        <p><strong>You might also like:</strong></p>
        <ul>
          ${movieDetails.recommendations.map(movie => `<li>${movie.title} (${movie.release_date?.split('-')[0] || 'N/A'})</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px;">
      <div style="display: flex; margin-bottom: 20px;">
        ${movieDetails.poster_path ? `<img src="${movieDetails.poster_path}" alt="${movieDetails.title}" style="width: 150px; margin-right: 20px;">` : ''}
        <div>
          <h2 style="margin-top: 0;">${movieDetails.title} ${movieDetails.release_date ? `(${movieDetails.release_date.split('-')[0]})` : ''}</h2>
          ${movieDetails.tagline ? `<p style="font-style: italic;">${movieDetails.tagline}</p>` : ''}
          <p>${movieDetails.overview}</p>
          
          ${movieDetails.directors?.length > 0 ? `<p><strong>Director:</strong> ${movieDetails.directors.join(', ')}</p>` : ''}
          ${movieDetails.cast?.length > 0 ? `<p><strong>Cast:</strong> ${movieDetails.cast.join(', ')}</p>` : ''}
          ${movieDetails.genres?.length > 0 ? `<p><strong>Genres:</strong> ${movieDetails.genres.join(', ')}</p>` : ''}
          ${movieDetails.runtime ? `<p><strong>Runtime:</strong> ${Math.floor(movieDetails.runtime / 60)}h ${movieDetails.runtime % 60}m</p>` : ''}
          ${movieDetails.vote_average ? `<p><strong>Rating:</strong> ${movieDetails.vote_average.toFixed(1)}/10</p>` : ''}
          ${streamingInfo}
        </div>
      </div>
      ${recommendations}
    </div>
  `;
}

module.exports = async (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '../movies', 'daily_discovery.csv');
    const api_key = process.env.TMDB_API_KEY;
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');

    if (!fs.existsSync(csvFilePath)) {
      return res.status(404).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Error</title><description>No movie data found</description></channel></rss>");
    }

    // Get user's parameter preferences if any
    const genre = req.query.genre;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;
    const maxAge = req.query.maxAge ? parseInt(req.query.maxAge) : null; // Age in years
    
    // Parse CSV file and process movies
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
            released: row.released || new Date().toISOString().split('T')[0],
            url: row.url || `https://www.themoviedb.org/movie/${row.tmdb_id}`
          });
        }
      })
      .on('end', async () => {
        if (movies.length > 0) {
          // Get server info for the RSS feed title and description
          const host = req.headers.host || 'thatmovieguy.vercel.app';
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const fullUrl = `${protocol}://${host}${req.url}`;
          
          // Start building the RSS feed
          let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Daily Movie Discovery${genre ? ` - ${genre} Movies` : ''}</title>
    <link>${protocol}://${host}/</link>
    <description>Daily movie recommendations${genre ? ` in the ${genre} genre` : ''}, streamlined for Radarr. No contracts. No costs. Ever.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(fullUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${protocol}://${host}/logo.png</url>
      <title>Daily Movie Discovery</title>
      <link>${protocol}://${host}/</link>
    </image>`;

          // Process each movie and add to the feed
          for (const movie of movies) {
            // Fetch detailed movie info from TMDB
            const movieDetails = await fetchMovieDetails(movie.tmdb_id, api_key);
            
            // Apply filters if specified in query parameters
            if (genre && !movieDetails.genres?.some(g => g.toLowerCase() === genre.toLowerCase())) {
              continue; // Skip this movie if it doesn't match the requested genre
            }
            
            if (minRating > 0 && (!movieDetails.vote_average || movieDetails.vote_average < minRating)) {
              continue; // Skip if rating is below requested minimum
            }
            
            if (maxAge && movieDetails.release_date) {
              const releaseYear = parseInt(movieDetails.release_date.split('-')[0]);
              const currentYear = new Date().getFullYear();
              if (currentYear - releaseYear > maxAge) {
                continue; // Skip if the movie is older than requested
              }
            }
            
            // Create rich HTML description
            const richDescription = createRichDescription(movieDetails);
            
            // Format the release date for RSS pubDate
            const releaseDate = new Date(movie.released);
            const pubDate = !isNaN(releaseDate.getTime()) ? releaseDate.toUTCString() : new Date().toUTCString();
            
            // Add the item to the RSS feed
            rssFeed += `
    <item>
      <title>${escapeXml(movie.title)} (${movie.year})</title>
      <link>${escapeXml(movie.url)}</link>
      <guid isPermaLink="false">movie-${movie.tmdb_id}-${format(new Date(), 'yyyy-MM-dd')}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(movieDetails.overview || "Description not available.")}</description>
      <content:encoded><![CDATA[${richDescription}]]></content:encoded>
      ${movieDetails.poster_path ? `<enclosure url="${escapeXml(movieDetails.poster_path)}" type="image/jpeg" />` : ''}
      ${movieDetails.genres?.map(genre => `<category>${escapeXml(genre)}</category>`).join('\n      ') || ''}
    </item>`;
          }

          // Close the RSS feed
          rssFeed += `
  </channel>
</rss>`;

          res.send(rssFeed.trim());
        } else {
          res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Error</title><description>No movies found</description></channel></rss>");
        }
      })
      .on('error', (err) => {
        console.error("Error reading CSV file:", err);
        res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Error</title><description>Error reading movie data</description></channel></rss>");
      });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Error</title><description>Server error</description></channel></rss>");
  }
};
