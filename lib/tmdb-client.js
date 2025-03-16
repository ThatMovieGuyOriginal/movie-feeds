// lib/tmdb-client.js
const fetch = require('node-fetch');

// API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Make a request to the TMDB API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Response data
 */
async function tmdbApiRequest(endpoint, params = {}) {
  // Add API key to params
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params
  }).toString();
  
  const url = `${TMDB_API_BASE_URL}${endpoint}?${queryParams}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in TMDB API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get full movie details including credits, keywords, etc.
 * @param {number|string} movieId - TMDB movie ID
 * @returns {Promise<Object>} Detailed movie information
 */
async function getMovieDetails(movieId) {
  return tmdbApiRequest(`/movie/${movieId}`, {
    append_to_response: 'credits,keywords,release_dates,recommendations,similar,videos,watch/providers'
  });
}

/**
 * Discover movies by genre
 * @param {string} genreName - Genre name (or ID if string of numbers)
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>} List of movies in the genre
 */
async function fetchMoviesByGenre(genreName, options = {}) {
  // Default options
  const {
    minRating = 0,
    maxAge = null,
    limit = 10,
    page = 1
  } = options;
  
  // Check if genreName is an ID or name
  let genreId;
  
  if (/^\d+$/.test(genreName)) {
    // If it's all digits, assume it's already an ID
    genreId = genreName;
  } else {
    // Look up genre ID by name
    const genres = await fetchGenres();
    const genre = genres.find(g => g.name.toLowerCase() === genreName.toLowerCase());
    
    if (!genre) {
      throw new Error(`Genre not found: ${genreName}`);
    }
    
    genreId = genre.id;
  }
  
  // Build discover query parameters
  const discoverParams = {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    'vote_average.gte': minRating,
    'vote_count.gte': 100, // Ensure movies have enough votes
    page
  };
  
  // Add year filter if maxAge is specified
  if (maxAge !== null) {
    const currentYear = new Date().getFullYear();
    discoverParams['primary_release_date.gte'] = `${currentYear - maxAge}-01-01`;
  }
  
  const response = await tmdbApiRequest('/discover/movie', discoverParams);
  
  // Process and return results with limit applied
  return processMovieResults(response.results, limit);
}

/**
 * Fetch trending movies
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} List of trending movies
 */
async function fetchTrendingMovies(options = {}) {
  const {
    timeWindow = 'week', // 'day' or 'week'
    minRating = 0,
    limit = 10,
    page = 1
  } = options;
  
  const response = await tmdbApiRequest(`/trending/movie/${timeWindow}`, { page });
  
  // Filter by rating if needed
  let results = response.results;
  
  if (minRating > 0) {
    results = results.filter(movie => movie.vote_average >= minRating);
  }
  
  // Get full details for each movie
  return processMovieResults(results, limit);
}

/**
 * Fetch top-rated movies
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} List of top-rated movies
 */
async function fetchTopRatedMovies(options = {}) {
  const {
    minRating = 0,
    limit = 10,
    page = 1
  } = options;
  
  const response = await tmdbApiRequest('/movie/top_rated', { page });
  
  // Filter by rating if needed
  let results = response.results;
  
  if (minRating > 0) {
    results = results.filter(movie => movie.vote_average >= minRating);
  }
  
  // Get full details for each movie
  return processMovieResults(results, limit);
}

/**
 * Fetch upcoming movie releases
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} List of upcoming movies
 */
async function fetchUpcomingMovies(options = {}) {
  const {
    limit = 10,
    page = 1
  } = options;
  
  const response = await tmdbApiRequest('/movie/upcoming', { page });
  
  // Get full details for each movie
  return processMovieResults(response.results, limit);
}

/**
 * Search for movies by title or keywords
 * @param {string} query - Search query
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Search results
 */
async function searchMovies(query, options = {}) {
  const {
    limit = 10,
    page = 1,
    year = null
  } = options;
  
  const searchParams = {
    query,
    page
  };
  
  if (year) {
    searchParams.year = year;
  }
  
  const response = await tmdbApiRequest('/search/movie', searchParams);
  
  // Get full details for each movie
  return processMovieResults(response.results, limit);
}

/**
 * Fetch all available movie genres
 * @returns {Promise<Array>} List of genres
 */
async function fetchGenres() {
  const response = await tmdbApiRequest('/genre/movie/list');
  return response.genres;
}

/**
 * Process movie results to get full details and apply limit
 * @param {Array} movies - Basic movie data
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} Processed movie data
 */
async function processMovieResults(movies, limit) {
  // Apply limit first to avoid unnecessary API calls
  const limitedMovies = movies.slice(0, limit);
  
  // Get full details for each movie (could be optimized with batching)
  const detailedMovies = await Promise.all(
    limitedMovies.map(async (movie) => {
      try {
        return await getMovieDetails(movie.id);
      } catch (error) {
        console.error(`Error fetching details for movie ID ${movie.id}:`, error);
        return movie; // Fall back to basic movie data
      }
    })
  );
  
  return detailedMovies;
}

/**
 * Get watch provider information for a movie
 * @param {number|string} movieId - TMDB movie ID
 * @param {string} region - Region code (e.g., 'US')
 * @returns {Promise<Object>} Streaming provider information
 */
async function getWatchProviders(movieId, region = 'US') {
  const response = await tmdbApiRequest(`/movie/${movieId}/watch/providers`);
  return response.results?.[region] || null;
}

/**
 * Get movie recommendations based on a movie
 * @param {number|string} movieId - TMDB movie ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Recommended movies
 */
async function getMovieRecommendations(movieId, options = {}) {
  const {
    limit = 5,
    page = 1
  } = options;
  
  const response = await tmdbApiRequest(`/movie/${movieId}/recommendations`, { page });
  
  // Get full details for recommendations
  return processMovieResults(response.results, limit);
}

module.exports = {
  tmdbApiRequest,
  getMovieDetails,
  fetchMoviesByGenre,
  fetchTrendingMovies,
  fetchTopRatedMovies,
  fetchUpcomingMovies,
  searchMovies,
  fetchGenres,
  getWatchProviders,
  getMovieRecommendations
};
