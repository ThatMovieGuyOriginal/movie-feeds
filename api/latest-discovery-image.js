import { createCanvas } from 'canvas';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export default async (req, res) => {
  try {
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    const rssFeed = await response.text();

    // Set up canvas
    const canvas = createCanvas(800, 1200); // Increased height for debug info
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Debug: Display raw RSS data (ASCII only)
    context.fillStyle = '#ff0000';
    context.font = '12px sans-serif';
    context.fillText('Debug Info: Raw RSS Data (ASCII only, truncated):', 20, 20);
    const asciiRssFeed = rssFeed.replace(/[^\x20-\x7E]/g, ''); // ASCII-only version of the feed
    context.fillText(asciiRssFeed.slice(0, 200) + '...', 20, 40);

    // Parse RSS feed
    let parsedFeed;
    try {
      parsedFeed = await parseStringPromise(rssFeed);
    } catch (parseError) {
      context.fillText('Parsing Error:', 20, 60);
      context.fillText(parseError.toString(), 20, 80);
      const imageBuffer = canvas.toBuffer('image/png');
      res.setHeader('Content-Type', 'image/png');
      return res.send(imageBuffer);
    }

    // Debug: Display parsed JSON structure (ASCII only)
    context.fillText('Parsed JSON structure (ASCII only, truncated):', 20, 100);
    const asciiParsedFeed = JSON.stringify(parsedFeed).replace(/[^\x20-\x7E]/g, ''); // ASCII-only
    context.fillText(asciiParsedFeed.slice(0, 200) + '...', 20, 120);

    const feedItems = parsedFeed.rss?.channel[0]?.item?.slice(0, 5).map(item => ({
      title: item.title[0].replace(/[^\x20-\x7E]/g, ''),  // ASCII-only
      year: new Date(item.pubDate[0]).getFullYear().toString(),
      description: item.description[0].replace(/[^\x20-\x7E]/g, ''),  // ASCII-only
      pubDate: item.pubDate[0],
    }));

    // Debug: Display first item data if available
    if (feedItems && feedItems.length > 0) {
      const firstItem = feedItems[0];
      context.fillText('First Parsed Item (ASCII only):', 20, 140);
      context.fillText(`Title: ${firstItem.title}`, 20, 160);
      context.fillText(`Year: ${firstItem.year}`, 20, 180);
      context.fillText(`PubDate: ${firstItem.pubDate}`, 20, 200);
      context.fillText(`Description: ${firstItem.description.slice(0, 50)}...`, 20, 220);
    } else {
      context.fillText('No valid feed items found.', 20, 140);
    }

    // Normal rendering for verified data with ASCII text only
    let y = 260;
    context.font = '24px sans-serif';
    context.fillStyle = '#333';
    context.fillText('Daily Movie Recommendations', 20, y);

    y += 40;
    context.font = '16px sans-serif';

    // Helper function to wrap ASCII-only text
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

    // Render feed items (ASCII-only data)
    feedItems.forEach(item => {
      context.fillStyle = '#000000';
      context.font = 'bold 18px sans-serif';
      wrapText(context, item.title, 20, y, 760, 24);
      y += 30;

      context.fillStyle = '#555555';
      context.font = 'italic 14px sans-serif';
      context.fillText(`Year: ${item.year}`, 20, y);
      y += 20;

      context.fillStyle = '#333333';
      context.font = '16px sans-serif';
      const description = item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description;
      y = wrapText(context, description, 20, y, 760, 20);

      context.fillStyle = '#666666';
      context.font = 'italic 14px sans-serif';
      context.fillText(item.pubDate, 20, y);
      y += 40;
    });

    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ff0000';
    context.font = '16px sans-serif';
    context.fillText('Error generating image:', 20, 20);
    context.fillText(error.toString(), 20, 40);
    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  }
};
