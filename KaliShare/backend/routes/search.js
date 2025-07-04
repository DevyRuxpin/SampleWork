const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const resourceGenerator = require('../services/resourceGenerator');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Simple cache for search results (in production, use Redis)
const searchCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Enhanced cache with better structure
const enhancedSearchCache = new Map();
const ENHANCED_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Helper function to search a single platform
async function searchPlatform(platform, query) {
  try {
    const response = await axios.get(`${platform.searchUrl}${encodeURIComponent(query)}`, {
      timeout: 4000, // Reduced timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const platformResults = platform.parseFunction(response.data, query, platform.name, platform.icon);
    return { platform: platform.name, results: platformResults, success: true };
  } catch (error) {
    console.error(`${platform.name} search error:`, error.message);
    return { platform: platform.name, results: [], success: false, error: error.message };
  }
}

// Get RSS feed results
async function getRSSResults(query) {
  const results = [];
  
  // Enhanced RSS feed sources for broader coverage
  const rssFeeds = [
    {
      name: 'Dev.to',
      url: 'https://dev.to/feed',
      icon: '📝'
    },
    {
      name: 'freeCodeCamp',
      url: 'https://www.freecodecamp.org/news/rss/',
      icon: '🎓'
    },
    {
      name: 'CSS-Tricks',
      url: 'https://css-tricks.com/feed/',
      icon: '🎨'
    },
    {
      name: 'Smashing Magazine',
      url: 'https://www.smashingmagazine.com/feed/',
      icon: '💡'
    },
    {
      name: 'SitePoint',
      url: 'https://www.sitepoint.com/feed/',
      icon: '🌐'
    },
    {
      name: 'A List Apart',
      url: 'https://alistapart.com/main/feed/',
      icon: '📋'
    },
    {
      name: 'Web Design Weekly',
      url: 'https://webdesignweekly.com/feed/',
      icon: '📰'
    },
    {
      name: 'JavaScript Weekly',
      url: 'https://javascriptweekly.com/rss/',
      icon: '⚡'
    },
    {
      name: 'Node Weekly',
      url: 'https://nodeweekly.com/rss/',
      icon: '🟢'
    },
    {
      name: 'React Status',
      url: 'https://react.statuscode.com/rss/',
      icon: '⚛️'
    }
  ];

  try {
    const rssPromises = rssFeeds.map(feed => 
      axios.get(feed.url, { 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
        .then(response => {
          const feedResults = [];
          const queryLower = query.toLowerCase();
          
          // Parse RSS XML content
          const items = response.data.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
          
          if (items) {
            items.slice(0, 10).forEach(item => {
              const titleMatch = item.match(/<title[^>]*>([^<]*)<\/title>/);
              const linkMatch = item.match(/<link[^>]*>([^<]*)<\/link>/);
              const descriptionMatch = item.match(/<description[^>]*>([^<]*)<\/description>/);
              
              if (titleMatch && linkMatch) {
                const title = titleMatch[1].replace(/<\!\[CDATA\[(.*?)\]\]>/, '$1').trim();
                const link = linkMatch[1].trim();
                const description = descriptionMatch ? 
                  descriptionMatch[1].replace(/<\!\[CDATA\[(.*?)\]\]>/, '$1').replace(/<[^>]*>/g, '').trim() : '';
                
                // Check if title or description contains the search query
                if (title.toLowerCase().includes(queryLower) || 
                    description.toLowerCase().includes(queryLower)) {
                  if (!isCodingCampOrSchool(title)) {
                    feedResults.push({
                      title: title,
                      link: link,
                      snippet: `${feed.icon} ${feed.name}: ${description.substring(0, 150)}...`,
                      type: 'blog-post',
                      difficulty: 'intermediate',
                      free: true,
                      verified: true,
                      source: feed.name,
                      category: 'general'
                    });
                  }
                }
              }
            });
          }
          
          return feedResults;
        })
        .catch(error => {
          console.error(`${feed.name} RSS error:`, error.message);
          return [];
        })
    );

    const rssResults = await Promise.allSettled(rssPromises);
    rssResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });

    console.log(`RSS feeds found ${results.length} relevant results for "${query}"`);
  } catch (error) {
    console.error('RSS search error:', error);
  }
  
  return results;
}

// Get all categories with real-time resources
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const resourceDatabase = await resourceGenerator.getCurrentResources();
    
    const categories = Object.keys(resourceDatabase).map(key => ({
      name: resourceDatabase[key].name,
      key: key,
      description: resourceDatabase[key].description,
      lastUpdated: resourceDatabase[key].lastUpdated,
      resourceCount: resourceDatabase[key].resources.length
    }));

    // Get resources for each category
    const results = {};
    Object.keys(resourceDatabase).forEach(key => {
      results[key] = resourceDatabase[key].resources.map(resource => ({
        title: resource.title,
        link: resource.link,
        snippet: resource.snippet,
        type: resource.type,
        difficulty: resource.difficulty,
        free: resource.free,
        verified: resource.verified,
        source: resource.source,
        stars: resource.stars,
        language: resource.language,
        channel: resource.channel,
        publishedAt: resource.publishedAt
      }));
    });

    res.json({
      categories,
      results,
      generationStatus: resourceGenerator.getStatus()
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Search educational resources by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { q, difficulty, type, free, source } = req.query;

    const resourceDatabase = await resourceGenerator.getCurrentResources();

    // Check if category exists in our database
    if (!resourceDatabase[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let resources = resourceDatabase[category].resources;

    // Apply filters
    if (difficulty) {
      resources = resources.filter(r => r.difficulty === difficulty);
    }
    if (type) {
      resources = resources.filter(r => r.type === type);
    }
    if (free === 'true') {
      resources = resources.filter(r => r.free === true);
    }
    if (source) {
      resources = resources.filter(r => r.source && r.source.toLowerCase().includes(source.toLowerCase()));
    }

    // Search within resources if query provided
    if (q) {
      const query = q.toLowerCase();
      resources = resources.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.snippet.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query) ||
        (r.source && r.source.toLowerCase().includes(query))
      );
    }

    // If we have less than 10 results, perform web search to find more resources
    if (resources.length < 10 && q) {
      try {
        const webResults = await performWebSearch(q, category);
        resources = [...resources, ...webResults];
      } catch (webError) {
        console.error('Web search error:', webError);
        // Continue with existing results if web search fails
      }
    }

    // Check cache first
    const cacheKey = `${category}:${q || 'all'}:${difficulty || 'all'}:${type || 'all'}:${free || 'all'}:${source || 'all'}`;
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      return res.json(cachedResult.data);
    }

    // Cache the results
    searchCache.set(cacheKey, {
      data: {
        category,
        query: q || 'all',
        results: resources,
        filters: { difficulty, type, free, source },
        lastUpdated: resourceDatabase[category].lastUpdated
      },
      timestamp: Date.now()
    });

    res.json({
      category,
      query: q || 'all',
      results: resources,
      filters: { difficulty, type, free, source },
      lastUpdated: resourceDatabase[category].lastUpdated
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search by keyword across all categories
router.get('/keyword', authenticateToken, async (req, res) => {
  try {
    const { q, difficulty, type, free, category, source, page = 1 } = req.query;
    const pageNum = parseInt(page) || 1;
    const resultsPerPage = 10;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Check cache first
    const cacheKey = `keyword:${q}:${difficulty || 'all'}:${type || 'all'}:${free || 'all'}:${category || 'all'}:${source || 'all'}`;
    const cachedResult = searchCache.get(cacheKey);
    
    let allResults = [];
    let webResultsCount = 0;
    let localResultsCount = 0;

    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      // Use cached results
      allResults = cachedResult.data.allResults || [];
      webResultsCount = cachedResult.data.webResultsCount || 0;
      localResultsCount = cachedResult.data.localResultsCount || 0;
    } else {
      // Perform fresh search
      const resourceDatabase = await resourceGenerator.getCurrentResources();

      // Search across all categories
      const allResources = [];
      Object.keys(resourceDatabase).forEach(cat => {
        resourceDatabase[cat].resources.forEach(resource => {
          allResources.push({
            ...resource,
            category: cat
          });
        });
      });

      let localResults = allResources.filter(r => 
        r.title.toLowerCase().includes(q.toLowerCase()) ||
        r.snippet.toLowerCase().includes(q.toLowerCase()) ||
        r.type.toLowerCase().includes(q.toLowerCase()) ||
        (r.source && r.source.toLowerCase().includes(q.toLowerCase()))
      );

      // Apply filters
      if (category) {
        localResults = localResults.filter(r => r.category === category);
      }
      if (source) {
        localResults = localResults.filter(r => r.source && r.source.toLowerCase().includes(source.toLowerCase()));
      }
      if (difficulty) {
        localResults = localResults.filter(r => r.difficulty === difficulty);
      }
      if (type) {
        localResults = localResults.filter(r => r.type === type);
      }
      if (free === 'true') {
        localResults = localResults.filter(r => r.free === true);
      }

      // Always perform web search for term-specific results
      let webResults = [];
      try {
        console.log(`Performing web search for: "${q}"`);
        webResults = await performWebSearch(q, category);
        console.log(`Found ${webResults.length} web results for "${q}"`);
      } catch (webError) {
        console.error('Web search error:', webError);
      }

      // Combine results: web results first (more specific), then local results
      const combinedResults = [...webResults, ...localResults];

      // Remove duplicates based on URL
      allResults = combinedResults.filter((result, index, self) => 
        index === self.findIndex(r => r.link === result.link)
      );

      // Sort by relevance (exact title matches first, then partial matches)
      allResults = allResults.sort((a, b) => {
        const queryLower = q.toLowerCase();
        const aTitleLower = a.title.toLowerCase();
        const bTitleLower = b.title.toLowerCase();
        
        // Exact title match gets highest priority
        if (aTitleLower === queryLower && bTitleLower !== queryLower) return -1;
        if (bTitleLower === queryLower && aTitleLower !== queryLower) return 1;
        
        // Title starts with query gets second priority
        if (aTitleLower.startsWith(queryLower) && !bTitleLower.startsWith(queryLower)) return -1;
        if (bTitleLower.startsWith(queryLower) && !aTitleLower.startsWith(queryLower)) return 1;
        
        // Title contains query gets third priority
        if (aTitleLower.includes(queryLower) && !bTitleLower.includes(queryLower)) return -1;
        if (bTitleLower.includes(queryLower) && !aTitleLower.includes(queryLower)) return 1;
        
        return 0;
      });

      webResultsCount = webResults.length;
      localResultsCount = localResults.length;

      // Cache all results for pagination
      searchCache.set(cacheKey, {
        data: {
          query: q,
          allResults: allResults,
          filters: { difficulty, type, free, category, source },
          totalFound: allResults.length,
          webResultsCount: webResultsCount,
          localResultsCount: localResultsCount
        },
        timestamp: Date.now()
      });
    }

    // Calculate pagination
    const totalResults = allResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (pageNum - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = allResults.slice(startIndex, endIndex);

    res.json({
      query: q,
      results: paginatedResults,
      filters: { difficulty, type, free, category, source },
      totalFound: totalResults,
      webResultsCount: webResultsCount,
      localResultsCount: localResultsCount,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        resultsPerPage: resultsPerPage,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// DuckDuckGo-only search (most reliable, no rate limits)
router.get('/duckduckgo', authenticateToken, async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    const pageNum = parseInt(page) || 1;
    const resultsPerPage = 10;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`Performing DuckDuckGo search for: "${q}"`);
    const duckDuckGoResults = await getDuckDuckGoResults(q);
    
    // Filter out coding camps and schools
    const filteredResults = duckDuckGoResults.filter(result => !isCodingCampOrSchool(result.title));
    
    // Calculate pagination
    const totalResults = filteredResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (pageNum - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    res.json({
      query: q,
      results: paginatedResults,
      totalFound: totalResults,
      source: 'DuckDuckGo',
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        resultsPerPage: resultsPerPage,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    res.status(500).json({ error: 'DuckDuckGo search failed' });
  }
});

// Get DuckDuckGo search results
async function getDuckDuckGoResults(query) {
  const results = [];
  let foundAny = false;
  try {
    // Create multiple search variations for broader results
    const searchVariations = [
      `${query} tutorial`,
      `${query} guide`,
      `${query} documentation`,
      `${query} examples`,
      `${query} best practices`,
      query // fallback to plain query
    ];
    
    const duckDuckGoPromises = searchVariations.map(searchTerm => 
      axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&no_html=1&skip_disambig=1`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
        .then(response => {
          const searchResults = [];
          const data = response.data;
          // Log raw response for debugging
          if (process.env.NODE_ENV !== 'production') {
            console.log('DuckDuckGo raw response:', JSON.stringify(data).slice(0, 500));
          }
          // Process Abstract (main result)
          if (data.Abstract && data.AbstractURL && !isCodingCampOrSchool(data.Abstract)) {
            searchResults.push({
              title: data.Heading || data.Abstract,
              link: data.AbstractURL,
              snippet: `🔍 ${data.AbstractSource}: ${data.AbstractText || data.Abstract}`,
              type: 'documentation',
              difficulty: 'intermediate',
              free: true,
              verified: true,
              source: 'DuckDuckGo',
              category: 'general'
            });
          }
          // Process Results (if available)
          if (data.Results && Array.isArray(data.Results)) {
            data.Results.forEach(result => {
              if (result.Title && result.FirstURL && !isCodingCampOrSchool(result.Title)) {
                searchResults.push({
                  title: result.Title,
                  link: result.FirstURL,
                  snippet: `📄 ${result.Text || 'Web resource about ' + query}`,
                  type: 'web-resource',
                  difficulty: 'intermediate',
                  free: true,
                  verified: true,
                  source: 'DuckDuckGo',
                  category: 'general'
                });
              }
            });
          }
          // Process Related Topics (including nested topics)
          function extractRelatedTopics(topics) {
            topics.forEach(topic => {
              if (topic.Topics) {
                extractRelatedTopics(topic.Topics);
              } else if (topic.Text && topic.FirstURL && !isCodingCampOrSchool(topic.Text)) {
                searchResults.push({
                  title: topic.Text,
                  link: topic.FirstURL,
                  snippet: `🔗 Related: ${topic.Text}`,
                  type: 'resource',
                  difficulty: 'beginner',
                  free: true,
                  verified: true,
                  source: 'DuckDuckGo',
                  category: 'general'
                });
              }
            });
          }
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            extractRelatedTopics(data.RelatedTopics);
          }
          if (searchResults.length > 0) foundAny = true;
          return searchResults;
        })
        .catch(error => {
          console.error('DuckDuckGo search error:', error.message);
          return [];
        })
    );

    const duckDuckGoResults = await Promise.allSettled(duckDuckGoPromises);
    duckDuckGoResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });

    // If still no results, try a plain query as a last fallback
    if (!foundAny && results.length === 0) {
      try {
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const data = response.data;
        if (process.env.NODE_ENV !== 'production') {
          console.log('DuckDuckGo plain query fallback response:', JSON.stringify(data).slice(0, 500));
        }
        if (data.Abstract && data.AbstractURL && !isCodingCampOrSchool(data.Abstract)) {
          results.push({
            title: data.Heading || data.Abstract,
            link: data.AbstractURL,
            snippet: `🔍 ${data.AbstractSource}: ${data.AbstractText || data.Abstract}`,
            type: 'documentation',
            difficulty: 'intermediate',
            free: true,
            verified: true,
            source: 'DuckDuckGo',
            category: 'general'
          });
        }
        if (data.Results && Array.isArray(data.Results)) {
          data.Results.forEach(result => {
            if (result.Title && result.FirstURL && !isCodingCampOrSchool(result.Title)) {
              results.push({
                title: result.Title,
                link: result.FirstURL,
                snippet: `📄 ${result.Text || 'Web resource about ' + query}`,
                type: 'web-resource',
                difficulty: 'intermediate',
                free: true,
                verified: true,
                source: 'DuckDuckGo',
                category: 'general'
              });
            }
          });
        }
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
          extractRelatedTopics(data.RelatedTopics);
        }
      } catch (error) {
        console.error('DuckDuckGo plain query fallback error:', error.message);
      }
    }
    console.log(`DuckDuckGo found ${results.length} results for "${query}"`);
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
  }
  return results;
}

// Perform web search for educational resources
async function performWebSearch(query, category = '') {
  // Check enhanced cache first
  const cacheKey = `enhanced:${query}:${category || 'all'}`;
  const cachedResult = enhancedSearchCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < ENHANCED_CACHE_DURATION) {
    console.log(`Using cached results for: "${query}"`);
    return cachedResult.data;
  }

  const results = [];
  
  try {
    console.log(`Performing enhanced web search for: "${query}"`);
    
    // Create multiple search variations for broader results
    const searchVariations = [
      `${query} tutorial`,
      `${query} guide`,
      `${query} documentation`,
      `${query} examples`,
      `${query} best practices`,
      `${query} how to`,
      `${query} getting started`,
      `${query} learn`,
      `${query} course`,
      `${query} workshop`
    ];
    
    // Search multiple educational platforms in parallel
    const searchPromises = [];
    
    // 1. DuckDuckGo Search (most reliable, no rate limits)
    searchPromises.push(getDuckDuckGoResults(query));
    
    // 2. RSS Feed Aggregation (fastest and most reliable)
    searchPromises.push(getRSSResults(query));
    
    // 3. YouTube Video Search
    searchPromises.push(getVideoResults(query));
    
    // 4. GitHub Repository Search
    searchPromises.push(getGitHubResults(query));
    
    // 5. Stack Overflow Q&A Search
    searchPromises.push(getStackOverflowResults(query));
    
    // 6. Documentation Sites Search
    searchPromises.push(getDocumentationResults(query));
    
    // 7. Blog Platform Search
    searchPromises.push(getBlogResults(query));
    
    // Execute all searches in parallel
    console.log(`Executing ${searchPromises.length} parallel searches...`);
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Collect results from successful searches
    searchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });

    // If we have very few results, try DuckDuckGo as a fallback with different queries
    if (results.length < 5) {
      console.log(`Few results found (${results.length}), trying DuckDuckGo fallback...`);
      try {
        const fallbackResults = await getDuckDuckGoResults(query);
        results.push(...fallbackResults);
      } catch (fallbackError) {
        console.error('DuckDuckGo fallback error:', fallbackError);
      }
    }

    // Filter out duplicates and coding camps/schools
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.link === result.link) && !isCodingCampOrSchool(result.title)
    );

    // Sort by relevance
    const sortedResults = uniqueResults.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aTitleLower = a.title.toLowerCase();
      const bTitleLower = b.title.toLowerCase();
      
      // Exact title match gets highest priority
      if (aTitleLower === queryLower && bTitleLower !== queryLower) return -1;
      if (bTitleLower === queryLower && aTitleLower !== queryLower) return 1;
      
      // Title starts with query gets second priority
      if (aTitleLower.startsWith(queryLower) && !bTitleLower.startsWith(queryLower)) return -1;
      if (bTitleLower.startsWith(queryLower) && !aTitleLower.startsWith(queryLower)) return 1;
      
      // Title contains query gets third priority
      if (aTitleLower.includes(queryLower) && !bTitleLower.includes(queryLower)) return -1;
      if (bTitleLower.includes(queryLower) && !aTitleLower.includes(queryLower)) return 1;
      
      return 0;
    });

    // Cache the results
    enhancedSearchCache.set(cacheKey, {
      data: sortedResults,
      timestamp: Date.now()
    });

    console.log(`Found ${sortedResults.length} enhanced results for "${query}"`);
    return sortedResults;
  } catch (error) {
    console.error('Enhanced web search error:', error);
    
    // Final fallback: try DuckDuckGo only
    try {
      console.log('All searches failed, trying DuckDuckGo only...');
      const duckDuckGoResults = await getDuckDuckGoResults(query);
      return duckDuckGoResults.filter(result => !isCodingCampOrSchool(result.title));
    } catch (fallbackError) {
      console.error('Final DuckDuckGo fallback error:', fallbackError);
      return [];
    }
  }
}

// Get video results from YouTube
async function getVideoResults(query) {
  const results = [];
  try {
    // Search YouTube for educational videos
    const searchTerms = [
      `${query} tutorial`,
      `${query} course`,
      `${query} guide`,
      `${query} how to`,
      `${query} learn`
    ];
    const videoPromises = searchTerms.slice(0, 2).map(async searchTerm => {
      try {
        const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`, {
          timeout: 4000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const videoResults = [];
        // Try to extract initialData JSON
        const initialDataMatch = response.data.match(/var ytInitialData = (\{.*?\});<\/script>/s);
        let initialData = null;
        if (initialDataMatch) {
          try {
            initialData = JSON.parse(initialDataMatch[1]);
          } catch (e) {
            console.error('YouTube initialData JSON parse error:', e.message);
          }
        }
        if (initialData) {
          // Traverse initialData for videoRenderer objects
          const videoItems = [];
          function findVideos(obj) {
            if (typeof obj !== 'object' || !obj) return;
            if (obj.videoRenderer) videoItems.push(obj.videoRenderer);
            for (const key in obj) {
              if (typeof obj[key] === 'object') findVideos(obj[key]);
            }
          }
          findVideos(initialData);
          videoItems.slice(0, 3).forEach(v => {
            const title = v.title && v.title.runs && v.title.runs[0]?.text;
            const videoId = v.videoId;
            if (title && videoId && !isCodingCampOrSchool(title)) {
              videoResults.push({
                title: title,
                link: `https://www.youtube.com/watch?v=${videoId}`,
                snippet: `🎥 YouTube tutorial about ${query}`,
                type: 'video',
                difficulty: 'beginner',
                free: true,
                verified: true,
                source: 'YouTube',
                category: 'general'
              });
            }
          });
        } else {
          // Fallback to regex extraction (legacy)
          const videoMatches = response.data.match(/"videoRenderer":\s*\{[^}]*"title":\s*\{[^}]*"runs":\s*\[[^}]*"text":\s*"([^"]*)"[^}]*"videoId":\s*"([^"]*)"/g);
          if (videoMatches) {
            videoMatches.slice(0, 3).forEach(match => {
              const titleMatch = match.match(/"text":\s*"([^"]*)"/);
              const videoIdMatch = match.match(/"videoId":\s*"([^"]*)"/);
              if (titleMatch && videoIdMatch) {
                const title = titleMatch[1].replace(/\\"/g, '"').trim();
                const videoId = videoIdMatch[1];
                if (title && videoId && !isCodingCampOrSchool(title)) {
                  videoResults.push({
                    title: title,
                    link: `https://www.youtube.com/watch?v=${videoId}`,
                    snippet: `🎥 YouTube tutorial about ${query}`,
                    type: 'video',
                    difficulty: 'beginner',
                    free: true,
                    verified: true,
                    source: 'YouTube',
                    category: 'general'
                  });
                }
              }
            });
          }
        }
        return videoResults;
      } catch (error) {
        console.error('YouTube search error:', error.message);
        return [];
      }
    });
    const videoResults = await Promise.allSettled(videoPromises);
    videoResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });
    console.log(`Video search found ${results.length} results for "${query}"`);
  } catch (error) {
    console.error('Video search error:', error);
  }
  return results;
}

// Get GitHub repository results
async function getGitHubResults(query) {
  const results = [];
  try {
    const response = await axios.get(`https://github.com/search?q=${encodeURIComponent(query + ' tutorial guide')}&type=repositories`, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const repoMatches = response.data.match(/<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
    
    if (repoMatches) {
      repoMatches.slice(0, 5).forEach(match => {
        const hrefMatch = match.match(/href="([^"]*)"/);
        const titleMatch = match.match(/>([^<]*)</);
        if (hrefMatch && titleMatch) {
          const title = titleMatch[1].trim();
          if (!isCodingCampOrSchool(title)) {
            results.push({
              title: title,
              link: hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://github.com${hrefMatch[1]}`,
              snippet: `🐙 GitHub repository about ${query}`,
              type: 'repository',
              difficulty: 'intermediate',
              free: true,
              verified: true,
              source: 'GitHub',
              category: 'general'
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('GitHub search error:', error.message);
  }
  
  return results;
}

// Get Stack Overflow Q&A results
async function getStackOverflowResults(query) {
  const results = [];
  try {
    const response = await axios.get(`https://stackoverflow.com/search?q=${encodeURIComponent(query + ' tutorial')}`, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const questionMatches = response.data.match(/<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
    
    if (questionMatches) {
      questionMatches.slice(0, 5).forEach(match => {
        const hrefMatch = match.match(/href="([^"]*)"/);
        const titleMatch = match.match(/>([^<]*)</);
        if (hrefMatch && titleMatch) {
          const title = titleMatch[1].trim();
          if (!isCodingCampOrSchool(title)) {
            results.push({
              title: title,
              link: hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://stackoverflow.com${hrefMatch[1]}`,
              snippet: `💬 Stack Overflow Q&A about ${query}`,
              type: 'q&a',
              difficulty: 'intermediate',
              free: true,
              verified: true,
              source: 'Stack Overflow',
              category: 'general'
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('Stack Overflow search error:', error.message);
  }
  
  return results;
}

// Get documentation site results
async function getDocumentationResults(query) {
  const results = [];
  const docSites = [
    {
      name: 'MDN',
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
      icon: '📚'
    },
    {
      name: 'Read the Docs',
      url: `https://readthedocs.org/search/?q=${encodeURIComponent(query)}`,
      icon: '📖'
    }
  ];

  try {
    const docPromises = docSites.map(site => 
      axios.get(site.url, { timeout: 3000 })
        .then(response => {
          const titleMatches = response.data.match(/<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
          const siteResults = [];
          
          if (titleMatches) {
            titleMatches.slice(0, 3).forEach(match => {
              const hrefMatch = match.match(/href="([^"]*)"/);
              const titleMatch = match.match(/>([^<]*)</);
              if (hrefMatch && titleMatch) {
                const title = titleMatch[1].trim();
                if (!isCodingCampOrSchool(title)) {
                  siteResults.push({
                    title: title,
                    link: hrefMatch[1].startsWith('http') ? hrefMatch[1] : `${site.url.split('/search')[0]}${hrefMatch[1]}`,
                    snippet: `${site.icon} ${site.name} documentation about ${query}`,
                    type: 'documentation',
                    difficulty: 'intermediate',
                    free: true,
                    verified: true,
                    source: site.name,
                    category: 'general'
                  });
                }
              }
            });
          }
          return siteResults;
        })
        .catch(error => {
          console.error(`${site.name} search error:`, error.message);
          return [];
        })
    );

    const docResults = await Promise.allSettled(docPromises);
    docResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });
  } catch (error) {
    console.error('Documentation search error:', error);
  }
  
  return results;
}

// Get blog platform results
async function getBlogResults(query) {
  const results = [];
  const blogSites = [
    {
      name: 'Dev.to',
      url: `https://dev.to/search?q=${encodeURIComponent(query)}`,
      icon: '📝'
    },
    {
      name: 'freeCodeCamp',
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(query)}`,
      icon: '🎓'
    }
  ];

  try {
    const blogPromises = blogSites.map(site => 
      axios.get(site.url, { timeout: 3000 })
        .then(response => {
          const titleMatches = response.data.match(/<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
          const siteResults = [];
          
          if (titleMatches) {
            titleMatches.slice(0, 3).forEach(match => {
              const hrefMatch = match.match(/href="([^"]*)"/);
              const titleMatch = match.match(/>([^<]*)</);
              if (hrefMatch && titleMatch) {
                const title = titleMatch[1].trim();
                if (!isCodingCampOrSchool(title)) {
                  siteResults.push({
                    title: title,
                    link: hrefMatch[1].startsWith('http') ? hrefMatch[1] : `${site.url.split('/search')[0]}${hrefMatch[1]}`,
                    snippet: `${site.icon} ${site.name} article about ${query}`,
                    type: 'blog-post',
                    difficulty: 'intermediate',
                    free: true,
                    verified: true,
                    source: site.name,
                    category: 'general'
                  });
                }
              }
            });
          }
          return siteResults;
        })
        .catch(error => {
          console.error(`${site.name} search error:`, error.message);
          return [];
        })
    );

    const blogResults = await Promise.allSetled(blogPromises);
    blogResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });
  } catch (error) {
    console.error('Blog search error:', error);
  }
  
  return results;
}

// Filter out coding camps and schools from search results
function isCodingCampOrSchool(title) {
  const titleLower = title.toLowerCase();
  const codingCampsAndSchools = [
    // Bootcamps
    'bootcamp', 'coding bootcamp', 'programming bootcamp', 'web development bootcamp',
    'data science bootcamp', 'full stack bootcamp', 'frontend bootcamp', 'backend bootcamp',
    'software engineering bootcamp', 'computer science bootcamp', 'javascript bootcamp',
    'python bootcamp', 'react bootcamp', 'node.js bootcamp', 'devops bootcamp',
    
    // Schools and academies
    'coding school', 'programming school', 'tech school', 'coding academy', 'programming academy',
    'web development school', 'software development school', 'computer science school',
    'tech academy', 'digital academy', 'code academy', 'programming institute',
    
    // Learning platforms (commercial)
    'learn to code', 'learn programming', 'coding course', 'programming course',
    'coding class', 'programming class', 'web development course', 'software development course',
    'coding training', 'programming training', 'web development training',
    'become a developer', 'become a programmer', 'career change to coding',
    
    // Specific bootcamp names
    'flatiron', 'general assembly', 'lambda school', 'app academy', 'hack reactor',
    'galvanize', 'coding dojo', 'ironhack', 'le wagon', 'makers academy',
    'nucamp', 'thinkful', 'bloc', 'codecademy pro', 'udacity nanodegree',
    'springboard', 'careerfoundry', 'brainstation', 'devmountain', 'coding temple',
    'fullstack academy', 'grace hopper', 'codesmith', 'rithm school', 'actualize',
    'coding house', 'dev bootcamp', 'metis', 'dataquest', 'data camp',
    
    // University/college programs
    'university program', 'college course', 'degree program', 'certificate program',
    'bachelor degree', 'master degree', 'associate degree', 'diploma program',
    
    // Commercial learning platforms
    'udemy course', 'coursera specialization', 'edx program', 'pluralsight path',
    'skillshare class', 'linkedin learning', 'treehouse track', 'team treehouse',
    
    // Job placement promises
    'job guarantee', 'career guarantee', 'placement guarantee', 'hire guarantee',
    'get hired', 'land a job', 'find employment', 'career placement',
    
    // Cost-related terms
    'pay after placement', 'income share agreement', 'deferred tuition',
    'financing available', 'payment plans', 'scholarship program'
  ];
  
  return codingCampsAndSchools.some(term => titleLower.includes(term));
}

// Get resource types for filtering
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const resourceDatabase = await resourceGenerator.getCurrentResources();
    const types = new Set();
    
    Object.keys(resourceDatabase).forEach(category => {
      resourceDatabase[category].resources.forEach(resource => {
        types.add(resource.type);
      });
    });

    res.json({
      types: Array.from(types).sort(),
      totalTypes: types.size
    });
  } catch (error) {
    console.error('Types error:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
});

// Get resource sources for filtering
router.get('/sources', authenticateToken, async (req, res) => {
  try {
    const resourceDatabase = await resourceGenerator.getCurrentResources();
    const sources = new Set();
    
    Object.keys(resourceDatabase).forEach(category => {
      resourceDatabase[category].resources.forEach(resource => {
        if (resource.source) {
          sources.add(resource.source);
        }
      });
    });

    res.json({
      sources: Array.from(sources).sort(),
      totalSources: sources.size
    });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Get resource generation status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = resourceGenerator.getStatus();
    const resourceDatabase = await resourceGenerator.getCurrentResources();
    
    const categoryStats = {};
    Object.keys(resourceDatabase).forEach(category => {
      categoryStats[category] = {
        name: resourceDatabase[category].name,
        resourceCount: resourceDatabase[category].resources.length,
        lastUpdated: resourceDatabase[category].lastUpdated
      };
    });

    res.json({
      generationStatus: status,
      categoryStats,
      totalResources: Object.values(categoryStats).reduce((sum, cat) => sum + cat.resourceCount, 0)
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Manually trigger resource generation (admin only)
router.post('/regenerate', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can implement your own admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Manual resource regeneration triggered by admin');
    const newResources = await resourceGenerator.generateResources();
    
    res.json({
      message: 'Resources regenerated successfully',
      categories: Object.keys(newResources),
      totalResources: Object.values(newResources).reduce((sum, cat) => sum + cat.resources.length, 0),
      lastGenerated: resourceGenerator.getStatus().lastGenerated
    });
  } catch (error) {
    console.error('Regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate resources' });
  }
});

// Get trending resources (most popular based on stars/views)
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const resourceDatabase = await resourceGenerator.getCurrentResources();
    
    const allResources = [];
    Object.keys(resourceDatabase).forEach(category => {
      resourceDatabase[category].resources.forEach(resource => {
        allResources.push({
          ...resource,
          category: category
        });
      });
    });

    // Sort by popularity (stars for GitHub, or by source popularity)
    const trending = allResources
      .filter(r => r.stars || r.source === 'YouTube' || r.source === 'Coursera')
      .sort((a, b) => {
        const aScore = a.stars || (a.source === 'YouTube' ? 1000 : 500);
        const bScore = b.stars || (b.source === 'YouTube' ? 1000 : 500);
        return bScore - aScore;
      })
      .slice(0, parseInt(limit));

    res.json({
      trending,
      totalFound: trending.length,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending resources' });
  }
});

module.exports = router; 