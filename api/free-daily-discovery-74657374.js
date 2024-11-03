const { createCanvas, registerFont, loadImage } = require('canvas');
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');
const path = require('path');

// Constants
const CANVAS_WIDTH = 800;
const MARGIN = 40;
const HEADER_HEIGHT = 40;
const POSTER_WIDTH = 100;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;
const POSTER_MARGIN = 20;
const VERTICAL_SPACING = 45;
const BOTTOM_MARGIN = 40;

// Register font once
try {
  registerFont(path.join(__dirname, '../fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
} catch (err) {
  console.error("Error registering font:", err);
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

async function fetchMoviePosterUrl(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
  const response = await fetch(url);
  const data = await response.json();
  return data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null;
}

module.exports = async (req, res) => {
  try {
    const feedUrl = 'https://thatmovieguy.vercel.app/api/rss-daily-discovery-74657374';
    const response = await fetch(feedUrl, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    const rssFeed = await response.text();
    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed?.rss?.channel[0]?.item?.slice(0, 5) || [];

    const itemsWithPosters = await Promise.all(feedItems.map(async (item) => {
      const tmdbId = item.link[0].split('/').pop();
      const posterUrl = await fetchMoviePosterUrl(tmdbId);
      return {
        title: item.title[0].replace(/[^\x20-\x7E]/g, ''),
        year: new Date(item.pubDate[0]).getFullYear().toString(),
        description: item.description[0].replace(/[^\x20-\x7E]/g, ''),
        pubDate: item.pubDate[0],
        posterUrl,
      };
    }));

    // Step 1: Create a temporary canvas for height calculation
    const tempCanvas = createCanvas(CANVAS_WIDTH, 1000);
    const tempContext = tempCanvas.getContext('2d');
    tempContext.fillStyle = '#ffffff';
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    let currentY = MARGIN + HEADER_HEIGHT;
    itemsWithPosters.forEach(item => {
      // Render Title, Year, and Description on temporary canvas for height measurement
      const textX = MARGIN + POSTER_WIDTH + POSTER_MARGIN;
      tempContext.font = 'bold 18px Roboto';
      tempContext.fillStyle = '#000000';
      tempContext.fillText(item.title, textX, currentY + 20);
      tempContext.font = '16px Roboto';
      tempContext.fillStyle = '#555555';
      tempContext.fillText(`(${item.year})`, textX, currentY + 50);

      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      currentY = wrapText(tempContext, description, textX, currentY + 80, CANVAS_WIDTH - MARGIN - POSTER_WIDTH - POSTER_MARGIN, 20);
      currentY += VERTICAL_SPACING;
    });
    currentY += BOTTOM_MARGIN;

    // Step 2: Create final canvas and render content
    const canvas = createCanvas(CANVAS_WIDTH, currentY);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 20px Roboto';
    context.fillStyle = '#000000';
    context.fillText("Free Daily Discovery", MARGIN, MARGIN + 20);
    
    let contentY = MARGIN + HEADER_HEIGHT;
    itemsWithPosters.forEach(item => {
      // Render posters, titles, and descriptions on final canvas
      const textX = MARGIN + POSTER_WIDTH + POSTER_MARGIN;
      context.font = 'bold 18px Roboto';
      context.fillStyle = '#000000';
      context.fillText(item.title, textX, contentY + 20);
      context.font = '16px Roboto';
      context.fillStyle = '#555555';
      context.fillText(`(${item.year})`, textX, contentY + 50);
      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      contentY = wrapText(context, description, textX, contentY + 80, CANVAS_WIDTH - MARGIN - POSTER_WIDTH - POSTER_MARGIN, 20);
      contentY += VERTICAL_SPACING;
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  } catch (error) {
    console.error("Error generating image:", error);
  }
};

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + word + ' ';
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  return y + lineHeight;
}
