const { createCanvas, registerFont, loadImage } = require('canvas');
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');
const path = require('path');

// Register the custom font with error handling
try {
  registerFont(path.join(__dirname, '../fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
} catch (err) {
  console.error("Error registering font:", err);
}

// TMDB API details
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

    let parsedFeed = await parseStringPromise(rssFeed);

    const feedItems = await Promise.all(
      parsedFeed.rss?.channel[0]?.item?.slice(0, 5).map(async (item) => {
        const tmdbId = item.link[0].split('/').pop();
        const posterUrl = await fetchMoviePosterUrl(tmdbId);
        return {
          title: item.title[0].replace(/[^\x20-\x7E]/g, ''),
          year: new Date(item.pubDate[0]).getFullYear().toString(),
          description: item.description[0].replace(/[^\x20-\x7E]/g, ''),
          pubDate: item.pubDate[0],
          posterUrl,
        };
      })
    );

    // Step 1: Create a temporary canvas for measuring height
    const tempCanvas = createCanvas(800, 1000); // Temporary large canvas
    const tempContext = tempCanvas.getContext('2d');
    tempContext.fillStyle = '#ffffff';
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempContext.font = '16px Roboto';

    const margin = 40;
    const bottomMargin = 40;
    const posterWidth = 100;
    const posterHeight = posterWidth * 1.5;
    const posterMargin = 20;
    const verticalSpacing = 45;

    // Render to the temporary canvas to get the required height
    let y = margin + 40; // Initial y position after header
    for (const item of feedItems) {
      const posterY = y;

      if (item.posterUrl) {
        try {
          const poster = await loadImage(item.posterUrl);
          tempContext.drawImage(poster, 20, posterY, posterWidth, posterHeight);
        } catch (err) {
          console.error(`Error loading poster for ${item.title}:`, err);
        }
      }

      const textX = 20 + posterWidth + posterMargin;
      tempContext.font = 'bold 18px Roboto';
      tempContext.fillStyle = '#000000';
      tempContext.fillText(`${item.title}`, textX, posterY + 20);
      tempContext.font = '16px Roboto';
      tempContext.fillStyle = '#555555';
      tempContext.fillText(`(${item.year})`, textX, posterY + 50);

      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      tempContext.fillStyle = '#333333';
      y = wrapText(tempContext, description, textX, posterY + 80, 760 - posterWidth - posterMargin, 20);

      y += verticalSpacing;
    }

    y += bottomMargin;

    // Step 2: Create the final canvas with calculated height
    const canvas = createCanvas(800, y);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Step 3: Render content again to the final canvas
    context.font = 'bold 20px Roboto';
    let yFinal = margin;
    context.fillText("Free Daily Discovery", 20, yFinal);
    yFinal += 40;

    for (const item of feedItems) {
      const posterY = yFinal;

      if (item.posterUrl) {
        try {
          const poster = await loadImage(item.posterUrl);
          context.drawImage(poster, 20, posterY, posterWidth, posterHeight);
        } catch (err) {
          console.error(`Error loading poster for ${item.title}:`, err);
        }
      }

      const textX = 20 + posterWidth + posterMargin;
      context.font = 'bold 18px Roboto';
      context.fillStyle = '#000000';
      context.fillText(`${item.title}`, textX, posterY + 20);
      context.font = '16px Roboto';
      context.fillStyle = '#555555';
      context.fillText(`(${item.year})`, textX, posterY + 50);

      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      context.fillStyle = '#333333';
      yFinal = wrapText(context, description, textX, posterY + 80, 760 - posterWidth - posterMargin, 20);

      yFinal += verticalSpacing;
    }

    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    console.error("Error generating image:", error);
    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ff0000';
    context.font = '24px Arial';
    context.fillText('Error generating image:', 20, 20);
    context.fillText(error.toString(), 20, 60);
    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  }
};

// Helper function to wrap text
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  return y + lineHeight;
}
