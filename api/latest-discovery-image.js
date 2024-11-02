import { createCanvas, registerFont, loadImage } from 'canvas';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import path from 'path';

// Register the custom font with error handling
try {
  registerFont(path.join(__dirname, '../fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
  console.log("Custom font registered successfully");
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

export default async (req, res) => {
  try {
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    const rssFeed = await response.text();

    console.log("RSS feed fetched:", rssFeed.slice(0, 200));

    // Parse RSS feed
    let parsedFeed;
    try {
      parsedFeed = await parseStringPromise(rssFeed);
      console.log("Parsed feed structure:", JSON.stringify(parsedFeed).slice(0, 200));
    } catch (parseError) {
      console.error("Error parsing feed:", parseError);
      throw parseError;
    }

    // Extract feed items and fetch posters
    const feedItems = await Promise.all(
      parsedFeed.rss?.channel[0]?.item?.slice(0, 5).map(async (item) => {
        const tmdbId = item.link[0].split('/').pop(); // Assumes TMDB ID is at the end of the URL
        const posterUrl = await fetchMoviePosterUrl(tmdbId); // Fetch poster URL
        return {
          title: item.title[0].replace(/[^\x20-\x7E]/g, ''),
          year: new Date(item.pubDate[0]).getFullYear().toString(),
          description: item.description[0].replace(/[^\x20-\x7E]/g, ''),
          pubDate: item.pubDate[0],
          posterUrl,
        };
      })
    );

    console.log("Feed items parsed for rendering:", feedItems);

    // Set up dynamic height calculation
    const margin = 40;
    const lineHeight = 25;
    const titleHeight = 30;
    const itemSpacing = 80; // Increased spacing for poster
    const posterWidth = 100;
    const posterHeight = posterWidth * 1.5; // Keep aspect ratio
    const posterMargin = 20;
    let estimatedHeight = margin;

    // Create a temporary canvas context to measure text height
    const tempCanvas = createCanvas(800, 100);
    const tempContext = tempCanvas.getContext('2d');
    tempContext.font = '16px Roboto';

    // Estimate required height based on text and poster
    estimatedHeight += 40; // Space for the header
    feedItems.forEach(item => {
      estimatedHeight += posterHeight + itemSpacing; // Poster height and space between items
    });

    // Generate the image with dynamic height
    const canvas = createCanvas(800, estimatedHeight);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    context.fillStyle = '#333333';
    context.font = 'bold 20px Roboto';

    // Render header
    let y = margin;
    context.fillText("Free Daily Discovery", 20, y);
    y += 40;

    // Render feed items with aligned titles
    for (const item of feedItems) {
      let posterY = y; // Fixed starting position for each item

      // Load the poster image if available
      if (item.posterUrl) {
        try {
          const poster = await loadImage(item.posterUrl);
          context.drawImage(poster, 20, posterY, posterWidth, posterHeight); // Draw poster
        } catch (err) {
          console.error(`Error loading poster for ${item.title}:`, err);
        }
      }

      // Title and year beside the poster, aligned with the top of the poster
      const textX = 20 + posterWidth + posterMargin;  // Position text beside the poster
      context.font = 'bold 18px Roboto';
      context.fillStyle = '#000000';
      context.fillText(`${item.title}`, textX, posterY + 20); // Align title with top of poster
      context.font = '16px Roboto';
      context.fillStyle = '#555555';
      context.fillText(`(${item.year})`, textX, posterY + 50); // Year positioned slightly below title

      // Description beside the poster, wrapped and aligned beneath the title and year
      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      context.fillStyle = '#333333';
      y = wrapText(context, `${description}`, textX, posterY + 80, 760 - posterWidth - posterMargin, 20); // Description starts below year

      y += itemSpacing; // Move y down for the next item
    }

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
