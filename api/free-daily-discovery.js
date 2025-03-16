// api/free-daily-discovery.js
const { createCanvas, registerFont, loadImage } = require('canvas');
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');
const path = require('path');
const fs = require('fs');

// Constants for image generation
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;
const MARGIN = 50;
const HEADER_HEIGHT = 120;
const POSTER_WIDTH = 180;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;
const POSTER_MARGIN = 30;
const VERTICAL_SPACING = 60;
const RATING_STAR_SIZE = 18;
const BOTTOM_MARGIN = 80;

// Register fonts with proper error handling
try {
  // Register multiple fonts for rich typography
  const fontsPath = path.join(__dirname, '../fonts');
  
  if (fs.existsSync(path.join(fontsPath, 'Montserrat-Bold.ttf'))) {
    registerFont(path.join(fontsPath, 'Montserrat-Bold.ttf'), { family: 'Montserrat', weight: 'bold' });
  } else {
    registerFont(path.join(fontsPath, 'Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });
  }
  
  if (fs.existsSync(path.join(fontsPath, 'Montserrat-Regular.ttf'))) {
    registerFont(path.join(fontsPath, 'Montserrat-Regular.ttf'), { family: 'Montserrat', weight: 'normal' });
  } else {
    registerFont(path.join(fontsPath, 'Roboto-Regular.ttf'), { family: 'Roboto', weight: 'normal' });
  }
  
  if (fs.existsSync(path.join(fontsPath, 'OpenSans-Regular.ttf'))) {
    registerFont(path.join(fontsPath, 'OpenSans-Regular.ttf'), { family: 'Open Sans', weight: 'normal' });
  }
} catch (err) {
  console.error("Error registering fonts:", err);
}

// API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Function to fetch movie poster and details
async function fetchMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,release_dates`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Get US certification if available
    let certification = "";
    if (data.release_dates && data.release_dates.results) {
      const usReleases = data.release_dates.results.find(country => country.iso_3166_1 === 'US');
      if (usReleases && usReleases.release_dates.length > 0) {
        certification = usReleases.release_dates[0].certification || "";
      }
    }
    
    // Get director
    let director = "";
    if (data.credits && data.credits.crew) {
      const directorInfo = data.credits.crew.find(person => person.job === 'Director');
      director = directorInfo ? directorInfo.name : "";
    }
    
    // Get genres as comma-separated string
    const genres = data.genres ? data.genres.map(g => g.name).join(', ') : "";
    
    return {
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
      backdropPath: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      title: data.title,
      tagline: data.tagline || "",
      overview: data.overview || "No description available.",
      releaseDate: data.release_date,
      voteAverage: data.vote_average || 0,
      runtime: data.runtime || 0,
      genres: genres,
      director: director,
      certification: certification
    };
  } catch (err) {
    console.error(`Error fetching movie details for TMDB ID ${tmdbId}:`, err);
    return null;
  }
}

// Function to draw rating stars
function drawRatingStars(context, rating, x, y, starSize = RATING_STAR_SIZE) {
  const totalStars = 5;
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 >= 1;
  
  // Draw empty stars first
  context.fillStyle = '#DDD';
  for (let i = 0; i < totalStars; i++) {
    drawStar(context, x + (i * (starSize + 5)), y, starSize);
  }
  
  // Draw filled stars
  context.fillStyle = '#FFD700'; // Gold color
  for (let i = 0; i < fullStars; i++) {
    drawStar(context, x + (i * (starSize + 5)), y, starSize);
  }
  
  // Draw half star if needed
  if (halfStar) {
    drawHalfStar(context, x + (fullStars * (starSize + 5)), y, starSize);
  }
}

// Function to draw a star shape
function drawStar(context, x, y, size) {
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius / 2;
  
  context.beginPath();
  context.moveTo(x + outerRadius, y);
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / spikes;
    context.lineTo(
      x + radius * Math.cos(angle - Math.PI / 2),
      y + radius * Math.sin(angle - Math.PI / 2)
    );
  }
  
  context.closePath();
  context.fill();
}

// Function to draw a half star
function drawHalfStar(context, x, y, size) {
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius / 2;
  
  context.beginPath();
  context.moveTo(x, y - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    // Outer point
    const outerAngle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
    context.lineTo(
      x + outerRadius * Math.cos(outerAngle),
      y + outerRadius * Math.sin(outerAngle)
    );
    
    // Inner point
    const innerAngle = (Math.PI * 2 * (i + 0.5)) / (spikes * 2) - Math.PI / 2;
    context.lineTo(
      x + innerRadius * Math.cos(innerAngle),
      y + innerRadius * Math.sin(innerAngle)
    );
  }
  
  context.closePath();
  context.clip();
  
  // Draw only the left half
  context.fillRect(x - outerRadius, y - outerRadius, outerRadius, outerRadius * 2);
}

// Function to wrap text with improved word wrapping
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  
  const words = text.split(' ');
  let line = '';
  let testLine = '';
  let currentY = y;
  
  for (let i = 0; i < words.length; i++) {
    testLine = line + words[i] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && i > 0) {
      context.fillText(line, x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

// Main API handler
module.exports = async (req, res) => {
  try {
    // Determine which RSS feed URL to use based on query parameters
    const testMode = req.query.test === 'true';
    const feedUrl = testMode 
      ? 'https://thatmovieguy.vercel.app/api/rss-daily-discovery-74657374'
      : 'https://thatmovieguy.vercel.app/api/rss-daily-discovery';
    
    // Fetch and parse RSS feed
    const response = await fetch(feedUrl, { 
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      // Add a cache-busting parameter to avoid stale data
      cache: 'no-store'
    });
    
    const rssFeed = await response.text();
    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed?.rss?.channel[0]?.item?.slice(0, 5) || [];
    
    if (feedItems.length === 0) {
      throw new Error("No items found in the RSS feed");
    }

    // Fetch movie details for each feed item
    const moviesWithDetails = await Promise.all(feedItems.map(async (item) => {
      const tmdbId = item.link[0].split('/').pop();
      const details = await fetchMovieDetails(tmdbId);
      
      return {
        title: item.title[0].replace(/[^\x20-\x7E]/g, '').replace(/\(\d{4}\)$/, '').trim(), // Remove year from title if present
        year: item.title[0].match(/\((\d{4})\)$/) 
          ? item.title[0].match(/\((\d{4})\)$/)[1] 
          : new Date(item.pubDate[0]).getFullYear().toString(),
        description: item.description ? item.description[0].replace(/[^\x20-\x7E]/g, '') : "",
        pubDate: item.pubDate ? item.pubDate[0] : "",
        tmdbId,
        details
      };
    }));

    // Create canvas with dynamic height based on content
    const tempCanvas = createCanvas(CANVAS_WIDTH, 500);
    const tempContext = tempCanvas.getContext('2d');
    tempContext.textBaseline = 'top';
    
    let totalHeight = HEADER_HEIGHT + MARGIN;
    
    // Calculate required height based on content
    for (const movie of moviesWithDetails) {
      if (!movie.details) continue;
      
      const itemHeight = Math.max(
        POSTER_HEIGHT + 20, // Minimum height for poster
        VERTICAL_SPACING * 3 // Minimum spacing for text
      );
      
      totalHeight += itemHeight + VERTICAL_SPACING;
    }
    
    totalHeight += BOTTOM_MARGIN;
    
    // Create final canvas with calculated height
    const canvas = createCanvas(CANVAS_WIDTH, totalHeight);
    const context = canvas.getContext('2d');
    context.textBaseline = 'top';
    
    // Draw background gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw header with logo/title
    context.fillStyle = '#ffffff';
    context.font = 'bold 36px Montserrat, Roboto, sans-serif';
    context.fillText("Daily Movie Discovery", MARGIN, MARGIN);
    
    // Draw current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    context.font = '18px "Open Sans", Roboto, sans-serif';
    context.fillStyle = '#cccccc';
    context.fillText(currentDate, MARGIN, MARGIN + 50);
    
    // Draw horizontal divider line
    context.strokeStyle = '#3a506b';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(MARGIN, HEADER_HEIGHT + MARGIN - 10);
    context.lineTo(canvas.width - MARGIN, HEADER_HEIGHT + MARGIN - 10);
    context.stroke();
    
    // Draw each movie
    let currentY = HEADER_HEIGHT + MARGIN + 20;
    
    for (const movie of moviesWithDetails) {
      if (!movie.details) continue;
      
      const posterX = MARGIN;
      const posterY = currentY;
      const textX = MARGIN + POSTER_WIDTH + POSTER_MARGIN;
      const textMaxWidth = CANVAS_WIDTH - textX - MARGIN;
      
      // Draw movie number badge
      const movieIndex = moviesWithDetails.indexOf(movie) + 1;
      context.fillStyle = '#0f3460';
      context.beginPath();
      context.arc(posterX - 15, posterY + 20, 25, 0, Math.PI * 2);
      context.fill();
      
      context.fillStyle = '#ffffff';
      context.font = 'bold 20px Montserrat, Roboto, sans-serif';
      context.textAlign = 'center';
      context.fillText(movieIndex.toString(), posterX - 15, posterY + 12);
      context.textAlign = 'left';
      
      // Draw poster image placeholder if no poster available
      if (!movie.details.posterPath) {
        context.fillStyle = '#2c3e50';
        context.fillRect(posterX, posterY, POSTER_WIDTH, POSTER_HEIGHT);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 16px Montserrat, Roboto, sans-serif';
        context.textAlign = 'center';
        context.fillText('No Poster', posterX + POSTER_WIDTH / 2, posterY + POSTER_HEIGHT / 2 - 10);
        context.textAlign = 'left';
      }
      
      // Draw poster image if available
      try {
        if (movie.details.posterPath) {
          const poster = await loadImage(movie.details.posterPath);
          context.drawImage(poster, posterX, posterY, POSTER_WIDTH, POSTER_HEIGHT);
          
          // Add poster shadow effect
          context.shadowColor = 'rgba(0, 0, 0, 0.5)';
          context.shadowBlur = 10;
          context.shadowOffsetX = 5;
          context.shadowOffsetY = 5;
          context.lineWidth = 1;
          context.strokeStyle = '#ffffff';
          context.strokeRect(posterX, posterY, POSTER_WIDTH, POSTER_HEIGHT);
          context.shadowColor = 'transparent';
        }
      } catch (err) {
        console.error(`Error loading poster for ${movie.title}:`, err);
        
        // Draw fallback when poster loading fails
        context.fillStyle = '#2c3e50';
        context.fillRect(posterX, posterY, POSTER_WIDTH, POSTER_HEIGHT);
        
        context.fillStyle = '#ffffff';
        context.font = '16px "Open Sans", Roboto, sans-serif';
        context.textAlign = 'center';
        context.fillText('Poster', posterX + POSTER_WIDTH / 2, posterY + POSTER_HEIGHT / 2 - 10);
        context.fillText('Not Available', posterX + POSTER_WIDTH / 2, posterY + POSTER_HEIGHT / 2 + 10);
        context.textAlign = 'left';
      }
      
      // Draw movie certification badge if available
      if (movie.details.certification) {
        const certX = posterX + 10;
        const certY = posterY + POSTER_HEIGHT - 30;
        
        // Draw certification badge
        context.fillStyle = '#ffffff';
        context.fillRect(certX, certY, 30, 20);
        
        context.fillStyle = '#000000';
        context.font = 'bold 14px Montserrat, Roboto, sans-serif';
        context.textAlign = 'center';
        context.fillText(movie.details.certification, certX + 15, certY + 3);
        context.textAlign = 'left';
      }
      
      // Draw movie title
      context.fillStyle = '#ffffff';
      context.font = 'bold 24px Montserrat, Roboto, sans-serif';
      wrapText(context, movie.title, textX, posterY, textMaxWidth, 30);
      
      // Draw year, runtime, and director info
      let infoY = posterY + 40;
      context.fillStyle = '#e94560';
      context.font = 'bold 18px "Open Sans", Roboto, sans-serif';
      
      // Year display
      if (movie.year) {
        context.fillText(movie.year, textX, infoY);
        infoY += 25;
      }
      
      // Runtime display
      if (movie.details.runtime) {
        const hours = Math.floor(movie.details.runtime / 60);
        const minutes = movie.details.runtime % 60;
        const runtimeText = hours > 0 
          ? `${hours}h ${minutes}m` 
          : `${minutes}m`;
        
        context.fillText(runtimeText, textX + (movie.year ? 70 : 0), posterY + 40);
      }
      
      // Director display
      if (movie.details.director) {
        context.fillStyle = '#cccccc';
        context.font = '16px "Open Sans", Roboto, sans-serif';
        context.fillText(`Director: ${movie.details.director}`, textX, infoY);
        infoY += 25;
      }
      
      // Genres display
      if (movie.details.genres) {
        context.fillStyle = '#cccccc';
        context.font = '16px "Open Sans", Roboto, sans-serif';
        wrapText(context, movie.details.genres, textX, infoY, textMaxWidth, 20);
        infoY += 25;
      }
      
      // Rating stars
      if (movie.details.voteAverage) {
        drawRatingStars(context, movie.details.voteAverage, textX, infoY, 20);
        context.fillStyle = '#cccccc';
        context.font = '16px "Open Sans", Roboto, sans-serif';
        context.fillText(`${movie.details.voteAverage.toFixed(1)}/10`, textX + 140, infoY + 4);
        infoY += 35;
      }
      
      // Draw description
      if (movie.details.overview) {
        context.fillStyle = '#ffffff';
        context.font = '16px "Open Sans", Roboto, sans-serif';
        
        // Truncate overview if too long
        let overview = movie.details.overview;
        if (overview.length > 300) {
          overview = overview.substring(0, 297) + '...';
        }
        
        const descY = wrapText(context, overview, textX, infoY, textMaxWidth, 22);
        currentY = Math.max(posterY + POSTER_HEIGHT, descY) + 20;
      } else {
        currentY = posterY + POSTER_HEIGHT + 20;
      }
      
      // Draw divider line between movies
      context.strokeStyle = '#3a506b';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(MARGIN, currentY + VERTICAL_SPACING / 2);
      context.lineTo(canvas.width - MARGIN, currentY + VERTICAL_SPACING / 2);
      context.stroke();
      
      currentY += VERTICAL_SPACING;
    }
    
    // Draw footer with URL and info
    const footerY = canvas.height - BOTTOM_MARGIN;
    
    context.fillStyle = '#cccccc';
    context.font = '16px "Open Sans", Roboto, sans-serif';
    context.textAlign = 'center';
    context.fillText('Get these recommendations in your Radarr daily at:', canvas.width / 2, footerY);
    
    context.fillStyle = '#e94560';
    context.font = 'bold 18px Montserrat, Roboto, sans-serif';
    context.fillText('https://thatmovieguy.vercel.app', canvas.width / 2, footerY + 25);
    
    context.fillStyle = '#cccccc';
    context.font = '14px "Open Sans", Roboto, sans-serif';
    context.fillText('Free forever. No signup required.', canvas.width / 2, footerY + 50);
    
    // Send the generated image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(canvas.toBuffer('image/png'));
    
  } catch (error) {
    console.error("Error generating image:", error);
    
    // Create an error image
    const errorCanvas = createCanvas(800, 400);
    const errorContext = errorCanvas.getContext('2d');
    
    // Fill background
    errorContext.fillStyle = '#1a1a2e';
    errorContext.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
    
    // Draw error message
    errorContext.fillStyle = '#ffffff';
    errorContext.font = 'bold 24px Montserrat, Roboto, sans-serif';
    errorContext.textAlign = 'center';
    errorContext.fillText('Error Generating Daily Discovery Image', errorCanvas.width / 2, 150);
    
    errorContext.fillStyle = '#cccccc';
    errorContext.font = '18px "Open Sans", Roboto, sans-serif';
    errorContext.fillText('Please try again later or contact support', errorCanvas.width / 2, 200);
    errorContext.fillText('Visit: https://thatmovieguy.vercel.app', errorCanvas.width / 2, 250);
    
    res.setHeader('Content-Type', 'image/png');
    res.status(500).send(errorCanvas.toBuffer('image/png'));
  }
};
