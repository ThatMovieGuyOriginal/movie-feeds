import { createCanvas, registerFont } from 'canvas';
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

    const feedItems = parsedFeed.rss?.channel[0]?.item?.slice(0, 5).map(item => ({
      title: item.title[0].replace(/[^\x20-\x7E]/g, ''),  // ASCII-only
      year: new Date(item.pubDate[0]).getFullYear().toString(),
      description: item.description[0].replace(/[^\x20-\x7E]/g, ''),  // ASCII-only
      pubDate: item.pubDate[0],
    }));

    console.log("Feed items parsed for rendering:", feedItems);

    // Generate the image
    const canvas = createCanvas(800, 1200);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    context.fillStyle = '#333333'; // Dark text color
    context.font = 'bold 20px Roboto';  // Bold font for headers

    // Render header
    let y = 40;
    context.fillText("Free Daily Discovery", 20, y);
    y += 40;

    // Render feed items
    feedItems.forEach((item, index) => {
      // Title in bold
      context.font = 'bold 18px Roboto';
      context.fillStyle = '#000000';
      context.fillText(`${item.title}`, 20, y);
      y += 30;

      // Year and pubDate in regular font
      context.font = '16px Roboto';
      context.fillStyle = '#555555';
      context.fillText(`(${item.year})`, 20, y);
      y += 25;

      // Description, truncated if too long
      const description = item.description.length > 150 ? item.description.slice(0, 150) + '...' : item.description;
      context.fillStyle = '#333333';
      y = wrapText(context, `${description}`, 20, y, 760, 20);

      // Add spacing between items
      y += 40;
    });

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
    context.font = '24px Arial';  // Use fallback font in the error message
    context.fillText('Error generating image:', 20, 20);
    context.fillText(error.toString(), 20, 60);
    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  }
};
