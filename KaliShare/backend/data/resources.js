// Comprehensive resource database for KaliShare
// Updated with current, active links and diversified sources

const resourceDatabase = {
  languages: {
    name: 'Programming Languages',
    description: 'Learn programming languages from beginner to advanced',
    resources: [
      // JavaScript
      {
        title: 'JavaScript Tutorial - MDN Web Docs',
        link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        snippet: 'Comprehensive JavaScript guide with interactive examples and best practices.',
        type: 'documentation',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Learn JavaScript - freeCodeCamp',
        link: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        snippet: 'Free interactive JavaScript course with algorithms and data structures.',
        type: 'interactive-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'JavaScript.info - Modern JavaScript Tutorial',
        link: 'https://javascript.info/',
        snippet: 'Modern JavaScript tutorial covering ES6+ features and advanced concepts.',
        type: 'tutorial',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      // Python
      {
        title: 'Python Tutorial - Official Documentation',
        link: 'https://docs.python.org/3/tutorial/',
        snippet: 'Official Python tutorial covering basics to advanced concepts.',
        type: 'documentation',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Python for Everybody - Coursera',
        link: 'https://www.coursera.org/specializations/python',
        snippet: 'University of Michigan course covering Python programming fundamentals.',
        type: 'university-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Real Python - Tutorials',
        link: 'https://realpython.com/',
        snippet: 'High-quality Python tutorials and articles for all skill levels.',
        type: 'tutorial',
        difficulty: 'all-levels',
        free: true,
        verified: true
      },
      // TypeScript
      {
        title: 'TypeScript Handbook - Official',
        link: 'https://www.typescriptlang.org/docs/',
        snippet: 'Official TypeScript documentation and learning resources.',
        type: 'documentation',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      {
        title: 'TypeScript Tutorial - freeCodeCamp',
        link: 'https://www.freecodecamp.org/news/learn-typescript-with-this-crash-course/',
        snippet: 'Free TypeScript crash course with practical examples.',
        type: 'tutorial',
        difficulty: 'intermediate',
        free: true,
        verified: true
      }
    ]
  },

  frontend: {
    name: 'Frontend Development',
    description: 'Master frontend technologies and frameworks',
    resources: [
      // React
      {
        title: 'React Tutorial - Official',
        link: 'https://react.dev/learn',
        snippet: 'Official React tutorial with interactive examples and modern patterns.',
        type: 'documentation',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'React Course - Scrimba',
        link: 'https://scrimba.com/learn/learnreact',
        snippet: 'Interactive React course with hands-on coding challenges.',
        type: 'interactive-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'React Patterns - Kent C. Dodds',
        link: 'https://kentcdodds.com/blog/react-patterns',
        snippet: 'Advanced React patterns and best practices from industry expert.',
        type: 'blog',
        difficulty: 'advanced',
        free: true,
        verified: true
      },
      // Vue.js
      {
        title: 'Vue.js Guide - Official',
        link: 'https://vuejs.org/guide/',
        snippet: 'Official Vue.js documentation with comprehensive guides.',
        type: 'documentation',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Vue Mastery - Free Courses',
        link: 'https://www.vuemastery.com/courses/intro-to-vue-3/intro-to-vue3',
        snippet: 'Free Vue.js courses with video tutorials and exercises.',
        type: 'video-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      // CSS & Styling
      {
        title: 'CSS Grid Garden',
        link: 'https://cssgridgarden.com/',
        snippet: 'Interactive game to learn CSS Grid layout.',
        type: 'interactive-game',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Flexbox Froggy',
        link: 'https://flexboxfroggy.com/',
        snippet: 'Learn CSS Flexbox through an interactive game.',
        type: 'interactive-game',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'CSS-Tricks - Complete Guide',
        link: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
        snippet: 'Complete guide to CSS Grid with examples and best practices.',
        type: 'guide',
        difficulty: 'intermediate',
        free: true,
        verified: true
      }
    ]
  },

  backend: {
    name: 'Backend Development',
    description: 'Server-side development and API creation',
    resources: [
      // Node.js
      {
        title: 'Node.js Tutorial - Official',
        link: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
        snippet: 'Official Node.js introduction and getting started guide.',
        type: 'documentation',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'Node.js Course - freeCodeCamp',
        link: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/',
        snippet: 'Free backend development course with Node.js and APIs.',
        type: 'interactive-course',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      {
        title: 'Express.js Guide - Official',
        link: 'https://expressjs.com/en/guide/routing.html',
        snippet: 'Official Express.js documentation and API reference.',
        type: 'documentation',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      // Python Backend
      {
        title: 'Django Tutorial - Official',
        link: 'https://docs.djangoproject.com/en/stable/intro/tutorial01/',
        snippet: 'Official Django tutorial building a web application.',
        type: 'documentation',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      {
        title: 'FastAPI Tutorial - Official',
        link: 'https://fastapi.tiangolo.com/tutorial/',
        snippet: 'Official FastAPI tutorial for building APIs with Python.',
        type: 'documentation',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      // Database
      {
        title: 'SQL Tutorial - W3Schools',
        link: 'https://www.w3schools.com/sql/',
        snippet: 'Comprehensive SQL tutorial with interactive examples.',
        type: 'tutorial',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'MongoDB University - Free Courses',
        link: 'https://university.mongodb.com/courses/catalog',
        snippet: 'Free MongoDB courses from the official MongoDB University.',
        type: 'university-course',
        difficulty: 'all-levels',
        free: true,
        verified: true
      }
    ]
  },

  tools: {
    name: 'Development Tools',
    description: 'Essential tools and utilities for developers',
    resources: [
      // Git
      {
        title: 'Git Tutorial - Atlassian',
        link: 'https://www.atlassian.com/git/tutorials',
        snippet: 'Comprehensive Git tutorials with branching and collaboration.',
        type: 'tutorial',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'GitHub Learning Lab',
        link: 'https://lab.github.com/',
        snippet: 'Interactive Git and GitHub tutorials with hands-on projects.',
        type: 'interactive-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      // Docker
      {
        title: 'Docker Tutorial - Official',
        link: 'https://docs.docker.com/get-started/',
        snippet: 'Official Docker getting started guide and tutorials.',
        type: 'documentation',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      {
        title: 'Docker Course - freeCodeCamp',
        link: 'https://www.freecodecamp.org/news/docker-full-course/',
        snippet: 'Complete Docker course with practical examples.',
        type: 'video-course',
        difficulty: 'intermediate',
        free: true,
        verified: true
      },
      // VS Code
      {
        title: 'VS Code Tutorial - Official',
        link: 'https://code.visualstudio.com/learn',
        snippet: 'Official VS Code tutorials and tips for productivity.',
        type: 'tutorial',
        difficulty: 'beginner',
        free: true,
        verified: true
      }
    ]
  },

  platforms: {
    name: 'Learning Platforms',
    description: 'Diverse learning platforms and communities',
    resources: [
      // Free Platforms
      {
        title: 'The Odin Project - Full Stack',
        link: 'https://www.theodinproject.com/',
        snippet: 'Free full-stack curriculum with project-based learning.',
        type: 'curriculum',
        difficulty: 'all-levels',
        free: true,
        verified: true
      },
      {
        title: 'freeCodeCamp - Interactive Learning',
        link: 'https://www.freecodecamp.org/',
        snippet: 'Free interactive coding lessons with certifications.',
        type: 'interactive-course',
        difficulty: 'all-levels',
        free: true,
        verified: true
      },
      {
        title: 'MDN Web Docs - Documentation',
        link: 'https://developer.mozilla.org/',
        snippet: 'Comprehensive web development documentation and tutorials.',
        type: 'documentation',
        difficulty: 'all-levels',
        free: true,
        verified: true
      },
      // University Courses
      {
        title: 'CS50 - Harvard University',
        link: 'https://cs50.harvard.edu/',
        snippet: 'Introduction to Computer Science from Harvard University.',
        type: 'university-course',
        difficulty: 'beginner',
        free: true,
        verified: true
      },
      {
        title: 'MIT OpenCourseWare - Computer Science',
        link: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/',
        snippet: 'Free MIT computer science courses and materials.',
        type: 'university-course',
        difficulty: 'advanced',
        free: true,
        verified: true
      },
      // Community & Blogs
      {
        title: 'Dev.to - Developer Community',
        link: 'https://dev.to/',
        snippet: 'Developer community with articles, tutorials, and discussions.',
        type: 'community',
        difficulty: 'all-levels',
        free: true,
        verified: true
      },
      {
        title: 'Hashnode - Developer Blogging',
        link: 'https://hashnode.com/',
        snippet: 'Developer blogging platform with technical articles.',
        type: 'community',
        difficulty: 'all-levels',
        free: true,
        verified: true
      }
    ]
  }
};

module.exports = resourceDatabase; 