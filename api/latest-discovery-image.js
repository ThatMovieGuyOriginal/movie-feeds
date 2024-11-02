import { createCanvas } from 'canvas';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export default async (req, res) => {
  try {
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl);
    const rssFeed = await response.text();

    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed.rss.channel[0].item.slice(0, 5).map(item => ({
      title: item.title[0],
      year: new Date(item.pubDate[0]).getFullYear().toString(),
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));

    // Set up canvas
    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');

    // Background and text styling
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Title for the entire image
    context.fillStyle = '#333';
    context.font = '24px Arial, sans-serif';
    context.fillText('Daily Movie Recommendations', 20, 40);

    // Adjust starting position for movie items
    let y = 80;

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

    // Loop through the feed items and add each to the canvas
    feedItems.forEach(item => {
      // Title
      context.fillStyle = '#000000';
      context.font = 'bold 18px Arial, sans-serif';
      wrapText(context, item.title, 20, y, 760, 24);
      y += 30;

      // Year
      context.fillStyle = '#555555';
      context.font = 'italic 14px Arial, sans-serif';
      context.fillText(`Year: ${item.year}`, 20, y);
      y += 20;

      // Description
      context.fillStyle = '#333333';
      context.font = '16px Arial, sans-serif';
      const description = item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description;
      y = wrapText(context, description, 20, y, 760, 20);

      // Publication Date
      context.fillStyle = '#666666';
      context.font = 'italic 14px Arial, sans-serif';
      context.fillText(item.pubDate, 20, y);
      y += 40;  // Add spacing before the next item
    });

    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send('Error generating image');
  }
};
