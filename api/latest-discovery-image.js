import { ImageResponse } from '@vercel/og';
import { parseStringPromise } from 'xml2js';

export const config = {
  runtime: 'experimental-edge',
};

export default async (req) => {
  try {
    // Fetch and parse RSS feed
    const feedUrl = 'https://thatmovieguy.vercel.app/api/dailydiscovery';
    const response = await fetch(feedUrl);
    const rssFeed = await response.text();
    const parsedFeed = await parseStringPromise(rssFeed);
    const feedItems = parsedFeed.rss.channel[0].item.slice(0, 5).map(item => ({
      title: item.title[0],
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));

    // Generate the image
    return new ImageResponse(
      (
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            color: 'black',
            background: 'white',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
          }}
        >
          <h1>Daily Movie Recommendations</h1>
          {feedItems.map((item, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{item.pubDate}</small>
            </div>
          ))}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
};
