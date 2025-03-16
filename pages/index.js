// pages/index.js
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Head>
        <title>Daily Movie Discovery | Free Movie Recommendations for Radarr</title>
        <meta name="description" content="Get daily movie recommendations directly in your Radarr instance via RSS. Free forever, with premium options." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="Daily Movie Discovery Logo" width={40} height={40} />
            <span className="ml-2 text-xl font-bold">Daily Movie Discovery</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <Link href="/#features" className="hover:text-blue-400 transition">Features</Link>
            <Link href="/#pricing" className="hover:text-blue-400 transition">Pricing</Link>
            <Link href="/faq" className="hover:text-blue-400 transition">FAQ</Link>
          </div>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
            Dashboard
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Discover Great Movies Daily in Your Radarr</h1>
            <p className="text-xl mb-8 text-gray-300">
              Curated movie recommendations delivered via RSS. No contracts. No costs. Ever.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="#get-started" className="bg-blue-600 hover:bg-blue-700 text-center px-6 py-3 rounded-lg text-lg font-medium transition">
                Get Started Free
              </Link>
              <Link href="#how-it-works" className="border border-white hover:bg-white hover:text-black text-center px-6 py-3 rounded-lg text-lg font-medium transition">
                How It Works
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <Image 
              src="/hero-image.png" 
              alt="Daily movie recommendations in Radarr" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-2xl"
            />
          </div>
        </section>

        {/* Today's Picks Section */}
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Today's Free Picks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Movie cards would be dynamically generated here */}
              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg transition transform hover:scale-105">
                <Image src="https://image.tmdb.org/t/p/w500/sample-poster.jpg" alt="Movie Title" width={300} height={450} className="w-full" />
                <div className="p-4">
                  <h3 className="font-bold mb-1">Green Lantern: First Flight</h3>
                  <p className="text-gray-400 text-sm mb-2">2009</p>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-500">★★★☆☆</span>
                    <Link href="https://www.themoviedb.org/movie/17445" className="text-blue-400 hover:text-blue-300 text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              {/* More movie cards... */}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Copy the RSS Feed URL</h3>
              <p className="text-gray-300">Get your personal RSS feed URL that updates with fresh movies daily</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Add to Radarr</h3>
              <p className="text-gray-300">Add the feed to your Radarr instance in just a few clicks</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Enjoy Daily Discoveries</h3>
              <p className="text-gray-300">Get new movie recommendations every day, automatically in your Radarr</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center">Why Choose Our Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Free Forever</h3>
                <p className="text-gray-300">Our core service is completely free and will stay that way. No hidden fees or surprise charges.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">No Account Required</h3>
                <p className="text-gray-300">Get started instantly without creating an account or providing personal information.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Curated Content</h3>
                <p className="text-gray-300">Our algorithm selects diverse, quality movies across various genres and eras.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Updates</h3>
                <p className="text-gray-300">Fresh recommendations every day to keep your movie collection growing.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Seamless Radarr Integration</h3>
                <p className="text-gray-300">Works perfectly with Radarr's RSS import feature with no extra configuration.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="text-blue-500 text-3xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Premium Options</h3>
                <p className="text-gray-300">Optional paid tiers with genre-specific feeds and personalized recommendations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section id="get-started" className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Get Your Free RSS Feed</h2>
            <p className="text-xl mb-8 text-gray-300">
              Copy this URL and add it to your Radarr instance as an RSS feed:
            </p>
            <div className="bg-gray-800 p-4 rounded-lg flex items-center mb-8">
              <input
                type="text"
                value="https://thatmovieguy.vercel.app/api/rss-daily-discovery"
                readOnly
                className="bg-transparent flex-1 outline-none"
              />
              <button 
                className="ml-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                onClick={() => {
                  navigator.clipboard.writeText("https://thatmovieguy.vercel.app/api/rss-daily-discovery");
                  alert("URL copied to clipboard!");
                }}
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Want Personalized Recommendations?</h3>
              <p className="mb-6">Subscribe to get genre-specific feeds and personalized movie recommendations.</p>
              <form className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center">Pricing Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 bg-gray-800">
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal">/forever</span></p>
                  <p className="text-gray-300">Basic movie discovery feed</p>
                </div>
                <div className="p-6">
                  <ul className="mb-6 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      5 daily movie recommendations
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Radarr RSS integration
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      TMDB metadata
                    </li>
                    <li className="flex items-center text-gray-500">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Genre-specific feeds
                    </li>
                    <li className="flex items-center text-gray-500">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Personalized recommendations
                    </li>
                  </ul>
                  <Link href="/api/rss-daily-discovery" className="block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                    Get Started
                  </Link>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden transform scale-105 border-2 border-blue-500">
                <div className="p-6 bg-blue-600">
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <p className="text-4xl font-bold mb-6">$5<span className="text-lg font-normal">/month</span></p>
                  <p className="text-white">Enhanced movie discovery experience</p>
                </div>
                <div className="p-6">
                  <ul className="mb-6 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      10 daily movie recommendations
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Radarr RSS integration
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      TMDB metadata
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Genre-specific feeds
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Basic personalization
                    </li>
                  </ul>
                  <a href="https://www.buymeacoffee.com/thatmovieguy/membership" className="block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                    Subscribe Now
                  </a>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 bg-gray-800">
                  <h3 className="text-2xl font-bold mb-2">Ultimate</h3>
                  <p className="text-4xl font-bold mb-6">$10<span className="text-lg font-normal">/month</span></p>
                  <p className="text-gray-300">Fully personalized experience</p>
                </div>
                <div className="p-6">
                  <ul className="mb-6 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      20 daily movie recommendations
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Radarr RSS integration
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Enhanced metadata
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Multiple genre-specific feeds
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Advanced AI personalization
                    </li>
                  </ul>
                  <a href="https://www.buymeacoffee.com/thatmovieguy/membership" className="block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                    Subscribe Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-16 text-center">What Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">J</span>
                </div>
                <div>
                  <h3 className="font-bold">John Smith</h3>
                  <p className="text-gray-400 text-sm">Radarr Enthusiast</p>
                </div>
              </div>
              <p className="text-gray-300">"This service has completely transformed how I discover movies. The recommendations are surprisingly good and the RSS integration with Radarr is seamless."</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">A</span>
                </div>
                <div>
                  <h3 className="font-bold">Alice Johnson</h3>
                  <p className="text-gray-400 text-sm">Movie Collector</p>
                </div>
              </div>
              <p className="text-gray-300">"I love that it's completely free with no strings attached. The daily recommendations have helped me discover so many hidden gems I would have missed otherwise."</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">M</span>
                </div>
                <div>
                  <h3 className="font-bold">Michael Brown</h3>
                  <p className="text-gray-400 text-sm">Premium Subscriber</p>
                </div>
              </div>
              <p className="text-gray-300">"The premium subscription is absolutely worth it. The genre-specific feeds and personalized recommendations have helped me curate a much better movie collection."</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-3">How do I add the RSS feed to Radarr?</h3>
                <p className="text-gray-300">In Radarr, go to Settings > Indexers > Add > RSS List. Add the URL from our site and save. Radarr will automatically check for new movies based on your sync schedule.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-3">Is this service really free?</h3>
                <p className="text-gray-300">Yes! The basic service with 5 daily movie recommendations is completely free and will always remain free. We offer premium tiers for users who want more personalized recommendations and features.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-3">How are the movies selected?</h3>
                <p className="text-gray-300">Our algorithm selects movies from a diverse database, ensuring you get a good mix of genres, eras, and styles. We emphasize quality films with good ratings while avoiding movies you've likely already seen.</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-3">What if I need help?</h3>
                <p className="text-gray-300">Feel free to reach out via email at support@thatmovieguy.com or check our detailed setup guides in the documentation section.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Discover Amazing Movies?</h2>
            <p className="text-xl mb-8 text-gray-300">
              Start getting daily movie recommendations in your Radarr today. No signup required!
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/api/rss-daily-discovery" className="bg-blue-600 hover:bg-blue-700 text-center px-8 py-4 rounded-lg text-lg font-medium transition">
                Get Free RSS Feed
              </Link>
              <a href="https://www.buymeacoffee.com/thatmovieguy/membership" className="border border-white hover:bg-white hover:text-black text-center px-8 py-4 rounded-lg text-lg font-medium transition">
                Go Premium
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <Image src="/logo.svg" alt="Daily Movie Discovery Logo" width={30} height={30} />
                <span className="ml-2 text-lg font-bold">Daily Movie Discovery</span>
              </div>
              <p className="text-gray-400 mt-2">Free movie recommendations for Radarr users</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link href="https://github.com/ThatMovieGuyOriginal/movie-feeds" className="text-gray-400 hover:text-white">GitHub</Link>
              <a href="mailto:contact@thatmovieguy.com" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Daily Movie Discovery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
