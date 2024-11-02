import { createCanvas } from 'canvas';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

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

    context.font = '16px Arial';  // Use Arial or another well-supported font

    // Render the parsed data on canvas
    let y = 40;
    context.fillText("Debug Info: Feed Items", 20, y);
    feedItems.forEach((item, index) => {
      y += 20;
      context.fillText(`Item ${index + 1}: Title - ${item.title}`, 20, y);
      y += 20;
      context.fillText(`Year - ${item.year}, PubDate - ${item.pubDate}`, 20, y);
      y += 40;
    });

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
    context.font = '16px Arial';  // Use a specific, common font
    context.fillText('Error generating image:', 20, 20);
    context.fillText(error.toString(), 20, 40);
    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  }
};
