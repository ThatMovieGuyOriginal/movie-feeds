// api/rss/[token].js
import { subscriptionManager, analytics } from '../../lib/firebase-admin';
import { fetchMoviesByGenre, fetchTrendingMovies, fetchTopRatedMovies } from '../../lib/tmdb-client';
import { createRichDescription, escapeXml } from '../../lib/rss-helpers';

/**
 * Handle premium RSS feed requests with a subscription token
 */
export default async function handler(req, res) {
  const { token } = req.query;
  
  // Validate subscription token
  try {
    const subscription = await subscriptionManager.validateSubscriptionToken(token);
    
    if (!subscription) {
      return res.status(401).json({ 
        error: 'Invalid or expired subscription token',
        info: 'Please visit https://thatmovieguy.vercel.app to purchase a premium subscription'
      });
    }
    
    // Get user's preferences/parameters
    const { 
      genre = null,
      minRating = 6,
      maxAge = null,
      count = 10,
      sort = 'recommended'
    } = req.query;
    
    // For analytics
    const metadata = {
      subscriptionId: subscription.id,
      planId: subscription.planId,
      genre,
      minRating,
      maxAge,
      count,
      sort,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // Track this feed access
    await analytics.trackFeedAccess(
      subscription.planId.includes('genre') ? 'genre' : 'premium',
      metadata
    );
    
    // Fetch movies based on subscription and parameters
    let movies = [];
    
    if (genre && subscription.planId.includes('genre')) {
      // Fetch movies by genre for genre pack subscriptions
      movies = await fetchMoviesByGenre(genre, {
        minRating: parseFloat(minRating),
        maxAge: maxAge ? parseInt(maxAge) : null,
        limit: parseInt(count)
      });
    } else if (subscription.planId.includes('ultimate')) {
      // For ultimate subscribers, provide more personalized recommendations
      // This could integrate with a recommendation engine in the future
      movies = await fetchTrendingMovies({
        timeWindow: 'week', 
        limit: parseInt(count),
        minRating: parseFloat(minRating)
      });
    } else {
      // For regular premium subscribers
      movies = await fetchTopRatedMovies({
        limit: parseInt(count),
        minRating: parseFloat(minRating)
      });
    }
    
    // Generate the RSS feed
    const host = req.headers.host || 'thatmovieguy.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const feedUrl = `${protocol}://${host}${req.url}`;
    
    // Feed title and description based on subscription type
    let feedTitle = 'Premium Movie Discoveries';
    let feedDescription = 'Curated premium movie recommendations for your collection';
    
    if (genre) {
      feedTitle = `${genre} Movie Discoveries`;
      feedDescription = `Curated ${genre} movie recommendations for your collection`;
    } else if (subscription.planId.includes('ultimate')) {
      feedTitle = 'Ultimate Movie Discoveries';
      feedDescription = 'Personalized movie recommendations tailored to your preferences';
    }
    
    // Start building the RSS feed
    let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${protocol}://${host}/</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${protocol}://${host}/logo.png</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${protocol}://${host}/</link>
    </image>`;
    
    // Add items to the feed
    for (const movie of movies) {
      // Create rich HTML description with movie details
      const richDescription = createRichDescription(movie);
      
      // Format the release date for RSS pubDate
      const releaseDate = new Date(movie.release_date);
      const pubDate = !isNaN(releaseDate.getTime()) 
        ? releaseDate.toUTCString() 
        : new Date().toUTCString();
      
      rssFeed += `
    <item>
      <title>${escapeXml(movie.title)} (${movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown'})</title>
      <link>https://www.themoviedb.org/movie/${movie.id}</link>
      <guid isPermaLink="false">movie-${movie.id}-${subscription.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(movie.overview || "No description available.")}</description>
      <content:encoded><![CDATA[${richDescription}]]></content:encoded>
      ${movie.poster_path ? `<enclosure url="https://image.tmdb.org/t/p/w500${movie.poster_path}" type="image/jpeg" />` : ''}
      ${movie.genres?.map(genre => `<category>${escapeXml(genre.name)}</category>`).join('\n      ') || ''}
    </item>`;
    }
    
    // Close the RSS feed
    rssFeed += `
  </channel>
</rss>`;
    
    // Set headers and send the feed
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour, but private
    res.send(rssFeed.trim());
    
  } catch (error) {
    console.error('Error generating premium RSS feed:', error);
    
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Error generating feed: ${escapeXml(error.message)}</description>
  </channel>
</rss>`);
  }
}
