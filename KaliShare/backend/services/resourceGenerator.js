const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for storing generated resources (12 hours)
const resourceCache = new NodeCache({ stdTTL: 12 * 60 * 60 });

// Free educational resource sources (no API keys required)
const FREE_SOURCES = {
  // RSS feeds for educational content
  rss: {
    freecodecamp: 'https://www.freecodecamp.org/news/rss/',
    devto: 'https://dev.to/feed',
    cssTricks: 'https://css-tricks.com/feed/',
    smashingMag: 'https://www.smashingmagazine.com/feed/',
    sitepoint: 'https://www.sitepoint.com/feed/',
    webdesignerdepot: 'https://www.webdesignerdepot.com/feed/',
    alistapart: 'https://alistapart.com/main/feed/',
    codrops: 'https://tympanus.net/codrops/feed/',
    webplatform: 'https://webplatform.github.io/feed.xml',
    html5rocks: 'https://www.html5rocks.com/en/rss.xml',
    // DevOps-specific feeds
    dockerBlog: 'https://www.docker.com/blog/feed/',
    kubernetesBlog: 'https://kubernetes.io/feed.xml',
    hashicorpBlog: 'https://www.hashicorp.com/blog/feed.xml',
    awsBlog: 'https://aws.amazon.com/blogs/developer/feed/',
    googleCloudBlog: 'https://cloudblog.withgoogle.com/rss/',
    azureBlog: 'https://azure.microsoft.com/en-us/blog/feed/'
  },
  // Public educational platforms
  platforms: {
    mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    w3schools: 'https://www.w3schools.com/',
    tutorialspoint: 'https://www.tutorialspoint.com/',
    geeksforgeeks: 'https://www.geeksforgeeks.org/'
  }
};

// Educational topics and keywords for search
const EDUCATIONAL_TOPICS = {
  languages: {
    keywords: ['javascript', 'python', 'typescript', 'java', 'golang', 'rust', 'kotlin', 'swift'],
    filters: ['programming', 'coding', 'development', 'language'],
    rssFeeds: ['devto', 'freecodecamp']
  },
  frontend: {
    keywords: ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'frontend', 'web development'],
    filters: ['frontend', 'web development', 'ui/ux', 'css', 'html'],
    rssFeeds: ['devto', 'cssTricks', 'smashingMag', 'sitepoint']
  },
  backend: {
    keywords: ['node.js', 'express', 'database', 'api', 'server', 'backend', 'python', 'java'],
    filters: ['backend', 'server', 'database', 'api'],
    rssFeeds: ['devto', 'freecodecamp', 'sitepoint']
  },
  devops: {
    keywords: ['docker', 'kubernetes', 'aws', 'cloud', 'ci/cd', 'devops', 'deployment', 'terraform', 'jenkins', 'ansible'],
    filters: ['devops', 'cloud', 'deployment', 'infrastructure'],
    rssFeeds: ['dockerBlog', 'kubernetesBlog', 'hashicorpBlog', 'awsBlog', 'googleCloudBlog', 'azureBlog']
  }
};

class ResourceGenerator {
  constructor() {
    this.lastGenerated = null;
    this.generationInterval = null;
  }

  // Start the resource generation service
  start() {
    console.log('Starting resource generation service...');
    this.generateResources();
    
    // Set up 12-hour interval
    this.generationInterval = setInterval(() => {
      console.log('Generating fresh resources (12-hour cycle)...');
      this.generateResources();
    }, 12 * 60 * 60 * 1000); // 12 hours
  }

  // Stop the service
  stop() {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      console.log('Resource generation service stopped');
    }
  }

  // Generate resources from multiple sources
  async generateResources() {
    try {
      console.log('Generating fresh educational resources...');
      
      const generatedResources = {};
      
      // Generate resources for each category
      for (const [category, config] of Object.entries(EDUCATIONAL_TOPICS)) {
        console.log(`Generating resources for ${category}...`);
        
        const resources = await this.fetchCategoryResources(category, config);
        generatedResources[category] = {
          name: this.getCategoryName(category),
          description: this.getCategoryDescription(category),
          resources: resources,
          lastUpdated: new Date().toISOString()
        };
      }

      // Store in cache
      resourceCache.set('educationalResources', generatedResources);
      this.lastGenerated = new Date();
      
      console.log(`Successfully generated ${Object.keys(generatedResources).length} categories of resources`);
      return generatedResources;
      
    } catch (error) {
      console.error('Error generating resources:', error);
      // Return cached resources if available
      return resourceCache.get('educationalResources') || this.getFallbackResources();
    }
  }

  // Fetch resources for a specific category
  async fetchCategoryResources(category, config) {
    const resources = [];
    try {
      // Start with curated resources (guaranteed high-quality content)
      const curatedResources = this.getCuratedResources(category);
      resources.push(...curatedResources);

      // If we have less than 10 curated resources, try to fill with RSS content
      if (curatedResources.length < 10) {
        console.log(`Category ${category} has ${curatedResources.length} curated resources, fetching RSS content...`);
        
        // Fetch from RSS feeds (free)
        const rssResources = await this.fetchRSSResources(config.keywords, config.rssFeeds);
        resources.push(...rssResources);

        // Fetch from public educational platforms
        const platformResources = await this.fetchPlatformResources(config.keywords);
        resources.push(...platformResources);
        
        // If we still don't have enough resources, try DuckDuckGo as fallback
        if (resources.length < 9) {
          console.log(`Category ${category} has ${resources.length} resources, trying DuckDuckGo fallback...`);
          const duckDuckGoResources = await this.fetchDuckDuckGoResources(config.keywords, category);
          resources.push(...duckDuckGoResources);
        }
      }

      // Filter for English-only content and ensure exactly 10 resources
      const englishResources = this.filterEnglishResources(resources);
      const shuffledResources = this.shuffleArray(englishResources);
      
      // Ensure exactly 9 resources per category
      const finalResources = shuffledResources.slice(0, 9);
      
      // If we still don't have 9, pad with additional curated resources
      if (finalResources.length < 9) {
        console.log(`Category ${category} only has ${finalResources.length} resources, adding fallback content...`);
        const additionalCurated = this.getAdditionalCuratedResources(category);
        const remainingNeeded = 9 - finalResources.length;
        finalResources.push(...additionalCurated.slice(0, remainingNeeded));
      }
      
      console.log(`Category ${category}: Generated ${finalResources.length} resources`);
      return finalResources;
    } catch (error) {
      console.error(`Error fetching ${category} resources:`, error);
      // Fallback to curated resources only
      const fallbackResources = this.getCuratedResources(category);
      const additionalResources = this.getAdditionalCuratedResources(category);
      const allFallback = [...fallbackResources, ...additionalResources];
      return this.filterEnglishResources(allFallback).slice(0, 9);
    }
  }

  // Fetch from RSS feeds (completely free)
  async fetchRSSResources(keywords, rssFeeds = []) {
    const resources = [];
    
    try {
      // Use category-specific RSS feeds if provided, otherwise use default feeds
      const feedsToUse = rssFeeds.length > 0 ? rssFeeds : ['devto', 'freecodecamp'];
      
      for (const feedName of feedsToUse) {
        try {
          const feedUrl = FREE_SOURCES.rss[feedName];
          if (!feedUrl) continue;
          
          console.log(`Fetching RSS feed: ${feedName}`);
          const response = await axios.get(feedUrl, { timeout: 5000 });
          const articles = this.parseRSSFeed(response.data, keywords);
          
          articles.forEach(article => {
            resources.push({
              title: article.title,
              link: article.link,
              snippet: article.description || `${feedName} article about ${article.category}`,
              type: 'blog-post',
              difficulty: 'intermediate',
              free: true,
              verified: true,
              source: feedName,
              author: article.author,
              publishedAt: article.pubDate
            });
          });
        } catch (error) {
          console.error(`Error fetching ${feedName} RSS feed:`, error.message);
        }
      }
    } catch (error) {
      console.error('RSS fetch error:', error);
    }
    
    return resources;
  }

  // Fetch from DuckDuckGo as fallback when RSS feeds fail
  async fetchDuckDuckGoResources(keywords, category) {
    const resources = [];
    
    try {
      console.log(`Fetching DuckDuckGo resources for ${category}...`);
      
      // Create search queries based on category keywords
      const searchQueries = keywords.slice(0, 3).map(keyword => 
        `${keyword} tutorial guide documentation`
      );
      
      for (const query of searchQueries) {
        try {
          const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const data = response.data;
          
          // Process Abstract (main result)
          if (data.Abstract && data.AbstractURL && this.isEnglishContent(data.Abstract)) {
            resources.push({
              title: data.Abstract,
              link: data.AbstractURL,
              snippet: `🔍 ${data.AbstractSource || 'DuckDuckGo'}: ${data.AbstractText || data.Abstract}`,
              type: 'documentation',
              difficulty: 'intermediate',
              free: true,
              verified: true,
              source: 'DuckDuckGo',
              category: category
            });
          }
          
          // Process Related Topics
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            data.RelatedTopics.slice(0, 2).forEach(topic => {
              if (topic.Text && topic.FirstURL && this.isEnglishContent(topic.Text)) {
                resources.push({
                  title: topic.Text,
                  link: topic.FirstURL,
                  snippet: `🔗 Related: ${topic.Text}`,
                  type: 'resource',
                  difficulty: 'beginner',
                  free: true,
                  verified: true,
                  source: 'DuckDuckGo',
                  category: category
                });
              }
            });
          }
          
          // Process Results (if available)
          if (data.Results && Array.isArray(data.Results)) {
            data.Results.slice(0, 2).forEach(result => {
              if (result.Title && result.FirstURL && this.isEnglishContent(result.Title)) {
                resources.push({
                  title: result.Title,
                  link: result.FirstURL,
                  snippet: `📄 ${result.Abstract || 'Web resource about ' + query}`,
                  type: 'web-resource',
                  difficulty: 'intermediate',
                  free: true,
                  verified: true,
                  source: 'DuckDuckGo',
                  category: category
                });
              }
            });
          }
          
        } catch (error) {
          console.error(`DuckDuckGo search error for query "${query}":`, error.message);
        }
      }
      
      console.log(`DuckDuckGo found ${resources.length} resources for ${category}`);
    } catch (error) {
      console.error('DuckDuckGo fetch error:', error);
    }
    
    return resources;
  }

  // Parse RSS feed content
  parseRSSFeed(xmlContent, keywords) {
    const articles = [];
    
    function stripCDATA(str) {
      return str.replace(/^<!\[CDATA\[|\]\]>$/g, '').replace('<![CDATA[', '').replace(']]>', '');
    }
    
    try {
      // Simple XML parsing for RSS feeds
      const titleMatches = xmlContent.match(/<title>(.*?)<\/title>/g);
      const linkMatches = xmlContent.match(/<link>(.*?)<\/link>/g);
      const descriptionMatches = xmlContent.match(/<description>(.*?)<\/description>/g);
      
      if (titleMatches && linkMatches) {
        for (let i = 0; i < Math.min(titleMatches.length, linkMatches.length); i++) {
          let title = titleMatches[i].replace(/<title>|<\/title>/g, '');
          let link = linkMatches[i].replace(/<link>|<\/link>/g, '');
          let description = descriptionMatches && descriptionMatches[i] 
            ? descriptionMatches[i].replace(/<description>|<\/description>/g, '')
            : '';
          // Strip CDATA
          title = stripCDATA(title);
          description = stripCDATA(description);
          // Check if article matches our keywords
          const titleLower = title.toLowerCase();
          if (keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
            articles.push({
              title,
              link,
              description,
              category: keywords.find(keyword => titleLower.includes(keyword.toLowerCase())) || 'general'
            });
          }
        }
      }
    } catch (error) {
      console.error('RSS parsing error:', error);
    }
    
    return articles.slice(0, 5); // Limit to 5 articles per feed
  }

  // Fetch from public educational platforms
  async fetchPlatformResources(keywords) {
    const resources = [];
    
    try {
      // MDN Web Docs (public, no API key)
      const mdnResources = [
        {
          title: 'JavaScript Tutorial - MDN Web Docs',
          link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          snippet: 'Comprehensive JavaScript guide with interactive examples and best practices.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'MDN'
        },
        {
          title: 'CSS Tutorial - MDN Web Docs',
          link: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
          snippet: 'Complete CSS reference and tutorials.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'MDN'
        },
        {
          title: 'HTML Tutorial - MDN Web Docs',
          link: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
          snippet: 'Learn HTML fundamentals and best practices.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'MDN'
        }
      ];
      
      resources.push(...mdnResources);

      // W3Schools resources
      const w3schoolsResources = [
        {
          title: 'Python Tutorial - W3Schools',
          link: 'https://www.w3schools.com/python/',
          snippet: 'Learn Python programming with interactive examples.',
          type: 'tutorial',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'W3Schools'
        },
        {
          title: 'React Tutorial - W3Schools',
          link: 'https://www.w3schools.com/react/',
          snippet: 'Learn React.js with practical examples.',
          type: 'tutorial',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'W3Schools'
        }
      ];
      
      resources.push(...w3schoolsResources);

    } catch (error) {
      console.error('Platform resources error:', error.message);
    }

    return resources;
  }

  // Get curated high-quality resources as fallback
  getCuratedResources(category) {
    const curated = {
      languages: [
        {
          title: 'JavaScript Tutorial - MDN Web Docs',
          link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          snippet: 'Comprehensive JavaScript guide with interactive examples.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'MDN'
        },
        {
          title: 'TypeScript Handbook - Official',
          link: 'https://www.typescriptlang.org/docs/',
          snippet: 'Official TypeScript documentation and learning resources.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'TypeScript'
        },
        {
          title: 'Python Documentation - Official',
          link: 'https://docs.python.org/3/tutorial/',
          snippet: 'Official Python tutorial and documentation.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Python'
        },
        {
          title: 'Java Documentation - Oracle',
          link: 'https://docs.oracle.com/javase/tutorial/',
          snippet: 'Official Java tutorials and documentation.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Oracle'
        },
        {
          title: 'Go Programming Language',
          link: 'https://golang.org/doc/tutorial/',
          snippet: 'Official Go programming language tutorials.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Go'
        }
      ],
      frontend: [
        {
          title: 'React Tutorial - Official',
          link: 'https://react.dev/learn',
          snippet: 'Official React tutorial with interactive examples.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'React'
        },
        {
          title: 'Vue.js Guide - Official',
          link: 'https://vuejs.org/guide/',
          snippet: 'Official Vue.js documentation and tutorials.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Vue.js'
        },
        {
          title: 'Angular Documentation',
          link: 'https://angular.io/docs',
          snippet: 'Official Angular documentation and tutorials.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Angular'
        },
        {
          title: 'CSS Grid Garden',
          link: 'https://cssgridgarden.com/',
          snippet: 'Interactive game to learn CSS Grid layout.',
          type: 'interactive-game',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'CSS Grid Garden'
        },
        {
          title: 'Flexbox Froggy',
          link: 'https://flexboxfroggy.com/',
          snippet: 'Learn CSS Flexbox through an interactive game.',
          type: 'interactive-game',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Flexbox Froggy'
        },
        {
          title: 'CSS Diner',
          link: 'https://flukeout.github.io/',
          snippet: 'Learn CSS selectors through an interactive game.',
          type: 'interactive-game',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'CSS Diner'
        }
      ],
      backend: [
        {
          title: 'Node.js Tutorial - Official',
          link: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
          snippet: 'Official Node.js introduction and getting started guide.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Node.js'
        },
        {
          title: 'Express.js Guide - Official',
          link: 'https://expressjs.com/en/guide/routing.html',
          snippet: 'Official Express.js documentation and API reference.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Express.js'
        },
        {
          title: 'Django Documentation',
          link: 'https://docs.djangoproject.com/en/stable/intro/tutorial01/',
          snippet: 'Official Django web framework documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Django'
        },
        {
          title: 'Flask Documentation',
          link: 'https://flask.palletsprojects.com/en/2.3.x/quickstart/',
          snippet: 'Official Flask web framework documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Flask'
        },
        {
          title: 'PostgreSQL Documentation',
          link: 'https://www.postgresql.org/docs/current/tutorial.html',
          snippet: 'Official PostgreSQL database documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'PostgreSQL'
        }
      ],
      devops: [
        {
          title: 'Docker Documentation',
          link: 'https://docs.docker.com/',
          snippet: 'Official Docker documentation and tutorials.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Docker'
        },
        {
          title: 'Kubernetes Documentation',
          link: 'https://kubernetes.io/docs/',
          snippet: 'Official Kubernetes documentation and guides.',
          type: 'documentation',
          difficulty: 'advanced',
          free: true,
          verified: true,
          source: 'Kubernetes'
        },
        {
          title: 'Git Documentation',
          link: 'https://git-scm.com/doc',
          snippet: 'Official Git documentation and tutorials.',
          type: 'documentation',
          difficulty: 'beginner',
          free: true,
          verified: true,
          source: 'Git'
        },
        {
          title: 'Linux Documentation',
          link: 'https://www.kernel.org/doc/html/latest/',
          snippet: 'Official Linux kernel documentation.',
          type: 'documentation',
          difficulty: 'advanced',
          free: true,
          verified: true,
          source: 'Linux'
        },
        {
          title: 'Nginx Documentation',
          link: 'https://nginx.org/en/docs/',
          snippet: 'Official Nginx web server documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Nginx'
        },
        {
          title: 'AWS Documentation',
          link: 'https://docs.aws.amazon.com/',
          snippet: 'Official AWS cloud services documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'AWS'
        },
        {
          title: 'Terraform Documentation',
          link: 'https://www.terraform.io/docs',
          snippet: 'Official Terraform infrastructure as code documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Terraform'
        },
        {
          title: 'Jenkins Documentation',
          link: 'https://www.jenkins.io/doc/',
          snippet: 'Official Jenkins CI/CD documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Jenkins'
        },
        {
          title: 'Ansible Documentation',
          link: 'https://docs.ansible.com/',
          snippet: 'Official Ansible automation documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Ansible'
        },
        {
          title: 'Prometheus Documentation',
          link: 'https://prometheus.io/docs/',
          snippet: 'Official Prometheus monitoring documentation.',
          type: 'documentation',
          difficulty: 'advanced',
          free: true,
          verified: true,
          source: 'Prometheus'
        }
      ]
    };

    return curated[category] || [];
  }

  // Get fallback resources if all sources fail
  getFallbackResources() {
    return {
      languages: {
        name: 'Programming Languages',
        description: 'Learn programming languages from beginner to advanced',
        resources: this.getCuratedResources('languages'),
        lastUpdated: new Date().toISOString()
      },
      frontend: {
        name: 'Frontend Development',
        description: 'Master frontend technologies and frameworks',
        resources: this.getCuratedResources('frontend'),
        lastUpdated: new Date().toISOString()
      },
      backend: {
        name: 'Backend Development',
        description: 'Server-side development and API creation',
        resources: this.getCuratedResources('backend'),
        lastUpdated: new Date().toISOString()
      },
      devops: {
        name: 'DevOps',
        description: 'Learn deployment and infrastructure management',
        resources: this.getCuratedResources('devops'),
        lastUpdated: new Date().toISOString()
      }
    };
  }

  // Get current resources (from cache or generate new ones)
  async getCurrentResources() {
    let resources = resourceCache.get('educationalResources');
    
    if (!resources) {
      console.log('No cached resources found, generating new ones...');
      resources = await this.generateResources();
    }

    return resources;
  }

  // Get resources for a specific category
  async getCategoryResources(category) {
    const resources = await this.getCurrentResources();
    return resources[category] || null;
  }

  // Helper methods
  getCategoryName(category) {
    const names = {
      languages: 'Programming Languages',
      frontend: 'Frontend Development',
      backend: 'Backend Development',
      devops: 'DevOps'
    };
    return names[category] || category;
  }

  getCategoryDescription(category) {
    const descriptions = {
      languages: 'Learn programming languages from beginner to advanced',
      frontend: 'Master frontend technologies and frameworks',
      backend: 'Server-side development and API creation',
      devops: 'Learn deployment and infrastructure management'
    };
    return descriptions[category] || `Learn about ${category}`;
  }

  assessDifficulty(stars, language) {
    if (stars > 10000) return 'advanced';
    if (stars > 1000) return 'intermediate';
    return 'beginner';
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get service status
  getStatus() {
    return {
      isRunning: !!this.generationInterval,
      lastGenerated: this.lastGenerated,
      nextGeneration: this.lastGenerated ? new Date(this.lastGenerated.getTime() + 12 * 60 * 60 * 1000) : null,
      cacheSize: resourceCache.keys().length
    };
  }

  // Check if content is in English (simple heuristic)
  isEnglishContent(text) {
    if (!text) return true;
    
    const textLower = text.toLowerCase();
    
    // Common non-English characters that indicate foreign language
    const nonEnglishPatterns = [
      /[一-龯]/g, // Chinese/Japanese
      /[가-힣]/g, // Korean
      /[ก-๙]/g, // Thai
      /[ऀ-ॿ]/g, // Devanagari
      /[ء-ي]/g, // Arabic
      /[א-ת]/g, // Hebrew
      /[а-яё]/g, // Cyrillic
    ];
    
    // Check for non-English characters
    for (const pattern of nonEnglishPatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    
    // Check for common English words to confirm it's English
    const englishWords = ['the', 'and', 'for', 'with', 'this', 'that', 'you', 'are', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'just', 'into', 'than', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'so', 'people', 'can', 'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'up', 'out', 'docker', 'kubernetes', 'aws', 'cloud', 'devops', 'deployment', 'api', 'server', 'database', 'javascript', 'python', 'react', 'node', 'express', 'tutorial', 'guide', 'documentation', 'learn', 'development', 'programming', 'code', 'web', 'frontend', 'backend', 'data', 'machine', 'learning', 'analytics'];
    
    const words = textLower.split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    const englishRatio = englishWordCount / Math.max(words.length, 1);
    
    // If more than 10% of words are common English words, consider it English (lowered threshold)
    // Also allow technical terms and short titles
    return englishRatio > 0.10 || text.length < 50;
  }

  // Truncate long text to ensure consistent sizing
  truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Filter resources to ensure only English content
  filterEnglishResources(resources) {
    return resources.filter(resource => {
      const titleEnglish = this.isEnglishContent(resource.title);
      const snippetEnglish = this.isEnglishContent(resource.snippet);
      
      // Only include if both title and snippet are in English
      return titleEnglish && snippetEnglish;
    }).map(resource => ({
      ...resource,
      // Truncate snippets for consistent sizing
      snippet: this.truncateText(resource.snippet, 150),
      title: this.truncateText(resource.title, 80)
    }));
  }

  // Get additional curated resources for fallback
  getAdditionalCuratedResources(category) {
    const additional = {
      languages: [
        {
          title: 'Rust Programming Language',
          link: 'https://doc.rust-lang.org/book/',
          snippet: 'Official Rust programming language book and documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Rust'
        },
        {
          title: 'Kotlin Documentation',
          link: 'https://kotlinlang.org/docs/home.html',
          snippet: 'Official Kotlin programming language documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Kotlin'
        },
        {
          title: 'Swift Documentation',
          link: 'https://docs.swift.org/swift-book/',
          snippet: 'Official Swift programming language documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Swift'
        }
      ],
      frontend: [
        {
          title: 'Svelte Tutorial',
          link: 'https://svelte.dev/tutorial',
          snippet: 'Official Svelte framework tutorial and documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Svelte'
        },
        {
          title: 'Web Components MDN',
          link: 'https://developer.mozilla.org/en-US/docs/Web/Web_Components',
          snippet: 'Learn about Web Components and custom elements.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'MDN'
        }
      ],
      backend: [
        {
          title: 'FastAPI Documentation',
          link: 'https://fastapi.tiangolo.com/',
          snippet: 'Official FastAPI Python web framework documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'FastAPI'
        },
        {
          title: 'Spring Boot Guide',
          link: 'https://spring.io/guides/gs/spring-boot/',
          snippet: 'Official Spring Boot getting started guide.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Spring'
        }
      ],
      devops: [
        {
          title: 'Helm Documentation',
          link: 'https://helm.sh/docs/',
          snippet: 'Official Helm Kubernetes package manager documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Helm'
        },
        {
          title: 'Istio Documentation',
          link: 'https://istio.io/latest/docs/',
          snippet: 'Official Istio service mesh documentation.',
          type: 'documentation',
          difficulty: 'advanced',
          free: true,
          verified: true,
          source: 'Istio'
        },
        {
          title: 'Grafana Documentation',
          link: 'https://grafana.com/docs/',
          snippet: 'Official Grafana monitoring and visualization documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Grafana'
        },
        {
          title: 'ELK Stack Documentation',
          link: 'https://www.elastic.co/guide/index.html',
          snippet: 'Official Elasticsearch, Logstash, and Kibana documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Elastic'
        },
        {
          title: 'Vagrant Documentation',
          link: 'https://www.vagrantup.com/docs',
          snippet: 'Official Vagrant development environment documentation.',
          type: 'documentation',
          difficulty: 'intermediate',
          free: true,
          verified: true,
          source: 'Vagrant'
        }
      ]
    };

    return additional[category] || [];
  }
}

module.exports = new ResourceGenerator(); 