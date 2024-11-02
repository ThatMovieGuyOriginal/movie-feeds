import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { parseStringPromise } from 'xml2js';

export default async (req, res) => {
  try {
    // Fetch RSS feed
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl);
    const rssFeed = await response.text();
    console.log("RSS Feed fetched successfully.");

    // Parse RSS feed using xml2js
    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed.rss.channel[0].item.slice(0, 5).map(item => ({
      title: item.title[0],
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));
    console.log("Feed items extracted:", feedItems);

    // Launch Puppeteer using @sparticuz/chromium for Vercel environment
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    console.log("Puppeteer launched.");

    const page = await browser.newPage();

    // Generate HTML content for rendering
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; }
            p { font-size: 16px; color: #333; }
            .item { margin-bottom: 20px; }
            .title { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Daily Movie Recommendations</h1>
          ${feedItems.map(item => `
            <div class="item">
              <p class="title">${item.title}</p>
              <p>${item.description}</p>
              <p><em>${item.pubDate}</em></p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    await page.setContent(htmlContent);
    console.log("HTML content set in Puppeteer.");

    // Capture screenshot
    const imageBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    console.log("Screenshot captured successfully.");

    // Send the image buffer as the response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(imageBuffer);

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send('Error generating image');
  }
};
