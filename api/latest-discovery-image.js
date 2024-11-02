import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async (req, res) => {
  try {
    // Fetch the RSS feed
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl);
    const rssFeed = await response.text();

    // Parse the RSS feed (a simple way to extract data here; adapt as needed)
    // For a real-world application, you'd use a proper XML parser, but for simplicity:
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssFeed, "text/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5); // Limit to 5 items

    const feedItems = items.map(item => ({
      title: item.querySelector("title").textContent,
      description: item.querySelector("description").textContent,
      link: item.querySelector("link").textContent,
      pubDate: item.querySelector("pubDate").textContent
    }));

    // Launch Puppeteer to render the HTML
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });
    const page = await browser.newPage();

    // Generate HTML for the feed items
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
    const imageBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    // Send the image buffer as the response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store'); // Prevent caching to ensure it's always fresh
    res.send(imageBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating image');
  }
};
