// lib/rss-helpers.js

/**
 * Escape XML special characters in a string
 * @param {string} unsafe - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  
  return unsafe.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return match;
    }
  });
}

/**
 * Format runtime in hours and minutes
 * @param {number} minutes - Runtime in minutes
 * @returns {string} Formatted runtime
 */
function formatRuntime(minutes) {
  if (!minutes) return 'Unknown runtime';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format a date string in a readable format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Create a rich HTML description for a movie in RSS feed
 * @param {Object} movie - Movie details
 * @returns {string} HTML-formatted description
 */
function createRichDescription(movie) {
  // Extract director(s)
  const directors = movie.credits?.crew
    ?.filter(person => person.job === 'Director')
    .map(director => director.name) || [];
  
  // Extract main cast (top 5)
  const cast = movie.credits?.cast
    ?.slice(0, 5)
    .map(actor => actor.name) || [];
  
  // Extract genres
  const genres = movie.genres?.map(genre => genre.name) || [];
  
  // Check if streaming info is available (US region)
  const streamingProviders = movie['watch/providers']?.results?.US?.flatrate || [];
  
  // Format release date
  const releaseDate = formatDate(movie.release_date);
  
  // Build trailer section if available
  let trailerSection = '';
  if (movie.videos?.results?.length > 0) {
    const trailer = movie.videos.results.find(video => 
      video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    if (trailer) {
      trailerSection = `
        <div style="margin-top: 15px;">
          <p><strong>Trailer:</strong></p>
          <p><a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank">Watch on YouTube</a></p>
        </div>
      `;
    }
  }
  
  // Build recommendations section
  const recommendations = movie.recommendations?.results?.slice(0, 3) || [];
  let recommendationsSection = '';
  
  if (recommendations.length > 0) {
    recommendationsSection = `
      <div style="margin-top: 15px;">
        <p><strong>You might also like:</strong></p>
        <ul>
          ${recommendations.map(rec => `
            <li><strong>${rec.title}</strong> (${rec.release_date?.split('-')[0] || 'N/A'}) - 
            ${rec.vote_average ? `${rec.vote_average.toFixed(1)}/10` : 'No rating'}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  
  // Build streaming providers section
  let streamingSection = '';
  if (streamingProviders?.length > 0) {
    streamingSection = `
      <div style="margin-top: 15px;">
        <p><strong>Available on:</strong> ${streamingProviders.map(provider => provider.provider_name).join(', ')}</p>
      </div>
    `;
  }
  
  // Main HTML template
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px;">
      <div style="display: flex; margin-bottom: 20px;">
        ${movie.poster_path 
          ? `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" style="width: 180px; margin-right: 20px;">` 
          : ''}
        <div>
          <h2 style="margin-top: 0;">${movie.title} ${movie.release_date ? `(${movie.release_date.split('-')[0]})` : ''}</h2>
          ${movie.tagline ? `<p style="font-style: italic;">${movie.tagline}</p>` : ''}
          <p>${movie.overview || 'No description available.'}</p>
          
          <div style="margin-top: 15px;">
            ${directors.length > 0 ? `<p><strong>Director:</strong> ${directors.join(', ')}</p>` : ''}
            ${cast.length > 0 ? `<p><strong>Cast:</strong> ${cast.join(', ')}</p>` : ''}
            ${genres.length > 0 ? `<p><strong>Genres:</strong> ${genres.join(', ')}</p>` : ''}
            ${movie.runtime ? `<p><strong>Runtime:</strong> ${formatRuntime(movie.runtime)}</p>` : ''}
            ${movie.vote_average ? `<p><strong>Rating:</strong> ${movie.vote_average.toFixed(1)}/10</p>` : ''}
            <p><strong>Release Date:</strong> ${releaseDate}</p>
          </div>
        </div>
      </div>
      
      ${streamingSection}
      ${trailerSection}
      ${recommendationsSection}
      
      <div style="margin-top: 20px; font-size: 12px; color: #777; text-align: center;">
        <p>Provided by Daily Movie Discovery - Premium Service</p>
        <p>Data from <a href="https://www.themoviedb.org/movie/${movie.id}" style="color: #0066cc;">TMDB</a></p>
      </div>
    </div>
  `;
}

/**
 * Generate a permalink-safe string from a movie title
 * @param {string} title - Movie title
 * @returns {string} URL-safe string
 */
function slugify(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Remove consecutive hyphens
    .trim();
}

module.exports = {
  escapeXml,
  formatRuntime,
  formatDate,
  createRichDescription,
  slugify
};
