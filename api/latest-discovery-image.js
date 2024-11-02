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
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));

    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#333';
    context.font = '24px Arial';
    context.fillText('Daily Movie Recommendations', 20, 40);

    let y = 80;
    context.font = '16px Arial';

    feedItems.forEach(item => {
      context.fillText(item.title, 20, y);
      y += 20;
      context.fillText(item.description, 20, y);
      y += 20;
      context.fillText(item.pubDate, 20, y);
      y += 40;
    });

    const imageBuffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send('Error generating image');
  }
};
