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
      year: new Date(item.pubDate[0]).getFullYear().toString(), // Extracting the year from pubDate
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));

    // Set up canvas
    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');

    // Background and text styling
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#333';
    context.font = '24px Arial';
    context.fillText('Daily Movie Recommendations', 20, 40);

    // Adjust starting position for movie items
    let y = 80;
    context.font = '16px Arial';

    // Loop through the feed items and add each to the canvas
    feedItems.forEach(item => {
      // Title
      context.fillStyle = '#000000';
      context.font = 'bold 18px Arial';
      context.fillText(item.title, 20, y);
      y += 24;

      // Year
      context.fillStyle = '#555555';
      context.font = 'italic 14px Arial';
      context.fillText(`Year: ${item.year}`, 20, y);
      y += 20;

      // Description
      context.fillStyle = '#333333';
      context.font = '16px Arial';
      const description = item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description;
      context.fillText(description, 20, y);
      y += 20;

      // Publication Date
      context.fillStyle = '#666666';
      context.font = 'italic 14px Arial';
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
