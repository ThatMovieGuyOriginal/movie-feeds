const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');

// API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Function to fetch movie details from TMDB
async function fetchMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,release_dates`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Get director
    let director = "";
    if (data.credits && data.credits.crew) {
      const directorInfo = data.credits.crew.find(person => person.job === 'Director');
      director = directorInfo ? directorInfo.name : "";
    }
    
    // Get genres as comma-separated string
    const genres = data.genres ? data.genres.map(g => g.name).join(', ') : "";
    
    return {
      title: data.title,
      tagline: data.tagline || "",
      overview: data.overview || "No description available.",
      releaseDate: data.release_date,
      voteAverage: data.vote_average || 0,
      runtime: data.runtime || 0,
      genres,
      director
    };
  } catch (err) {
    console.error(`Error fetching movie details for TMDB ID ${tmdbId}:`, err);
    return null;
  }
}

// Format runtime in hours and minutes
function formatRuntime(minutes) {
  if (!minutes) return 'Unknown runtime';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Main API handler
module.exports = async (req, res) => {
  try {
    // Fetch RSS feed
    const feedUrl = 'https://thatmovieguy.vercel.app/api/rss-daily-discovery';
    const response = await fetch(feedUrl, { 
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      cache: 'no-store'
    });
    
    const rssFeed = await response.text();
    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed?.rss?.channel[0]?.item?.slice(0, 5) || [];
    
    if (feedItems.length === 0) {
      return res.status(404).send("No items found in the RSS feed");
    }

    // Fetch movie details for each feed item
    const moviesWithDetails = await Promise.all(feedItems.map(async (item) => {
      const tmdbId = item.link[0].split('/').pop();
      const details = await fetchMovieDetails(tmdbId);
      
      return {
        title: item.title[0].replace(/[^\x20-\x7E]/g, '').replace(/\(\d{4}\)$/, '').trim(),
        year: item.title[0].match(/\((\d{4})\)$/) 
          ? item.title[0].match(/\((\d{4})\)$/)[1] 
          : new Date(item.pubDate[0]).getFullYear().toString(),
        description: item.description ? item.description[0].replace(/[^\x20-\x7E]/g, '') : "",
        pubDate: item.pubDate ? item.pubDate[0] : "",
        tmdbId,
        details
      };
    }));

    // Generate text response
    let textResponse = "# Daily Movie Discovery\n\n";
    textResponse += `Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    
    moviesWithDetails.forEach((movie, index) => {
      if (!movie.details) return;
      
      textResponse += `## ${index + 1}. ${movie.title} (${movie.year})\n\n`;
      
      if (movie.details.tagline) {
        textResponse += `*${movie.details.tagline}*\n\n`;
      }
      
      textResponse += `${movie.details.overview}\n\n`;
      
      textResponse += "**Details:**\n";
      if (movie.details.director) {
        textResponse += `- Director: ${movie.details.director}\n`;
      }
      if (movie.details.genres) {
        textResponse += `- Genres: ${movie.details.genres}\n`;
      }
      if (movie.details.runtime) {
        textResponse += `- Runtime: ${formatRuntime(movie.details.runtime)}\n`;
      }
      if (movie.details.voteAverage) {
        textResponse += `- Rating: ${movie.details.voteAverage.toFixed(1)}/10\n`;
      }
      if (movie.details.releaseDate) {
        textResponse += `- Release Date: ${new Date(movie.details.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      }
      
      textResponse += `- TMDB Link: https://www.themoviedb.org/movie/${movie.tmdbId}\n\n`;
      
      // Add separator between movies except for the last one
      if (index < moviesWithDetails.length - 1) {
        textResponse += "---\n\n";
      }
    });
    
    textResponse += "\n\nGet these recommendations in your Radarr daily at: https://thatmovieguy.vercel.app\n";
    textResponse += "Free forever. No signup required.";
    
    // Send response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(textResponse);
    
  } catch (error) {
    console.error("Error generating text response:", error);
    res.status(500).send("Error generating Daily Discovery text");
  }
};
