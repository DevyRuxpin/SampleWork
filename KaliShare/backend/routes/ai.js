const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { InferenceClient } = require('@huggingface/inference');

const router = express.Router();

// Initialize Hugging Face client
const hfClient = process.env.HUGGING_FACE_API_KEY ? 
  new InferenceClient(process.env.HUGGING_FACE_API_KEY) : null;

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

// Enhanced cache for AI responses
const aiCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Rate limiting for AI requests
const aiRateLimit = new Map();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Enhanced local knowledge base for web development
const webDevKnowledge = {
  javascript: {
    'async/await': `Async/await is a modern way to handle asynchronous operations in JavaScript. Here's how to use it:

**Basic Syntax:**
\`\`\`javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

**Key Points:**
- \`async\` functions always return a Promise
- \`await\` can only be used inside \`async\` functions
- Use try/catch for error handling
- \`await\` pauses execution until the Promise resolves

**Real Example:**
\`\`\`javascript
async function getUserPosts(userId) {
  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(userId);
  return { user, posts };
}
\`\`\``,
    'arrow functions': `Arrow functions are a concise way to write functions in JavaScript. Here's a comprehensive guide:

**Basic Syntax:**
\`\`\`javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function
const add = (a, b) => a + b;
\`\`\`

**Key Differences:**
- No \`this\` binding (inherits from parent scope)
- No \`arguments\` object
- Cannot be used as constructors
- Implicit return for single expressions

**Common Use Cases:**
\`\`\`javascript
// Array methods
const numbers = [1, 2, 3, 4];
const doubled = numbers.map(n => n * 2);

// Event handlers
button.addEventListener('click', () => {
  console.log('Button clicked!');
});

// Promise chains
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data));
\`\`\``,
    'promises': `Promises are objects representing the eventual completion or failure of an asynchronous operation. Here's everything you need to know:

**Creating Promises:**
\`\`\`javascript
const myPromise = new Promise((resolve, reject) => {
  // Async operation
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      resolve('Operation successful!');
    } else {
      reject('Operation failed!');
    }
  }, 1000);
});
\`\`\`

**Using Promises:**
\`\`\`javascript
myPromise
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  })
  .finally(() => {
    console.log('Always executed');
  });
\`\`\`

**Promise Methods:**
\`\`\`javascript
// Promise.all - waits for all promises
Promise.all([promise1, promise2, promise3])
  .then(results => console.log(results));

// Promise.race - returns first resolved promise
Promise.race([promise1, promise2])
  .then(result => console.log(result));
\`\`\``
  },
  react: {
    'hooks': `React Hooks are functions that let you use state and other React features in functional components. Here's a comprehensive guide:

**useState Hook:**
\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

**useEffect Hook:**
\`\`\`javascript
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data when component mounts or userId changes
    fetchUser(userId).then(setUser);
  }, [userId]); // Dependency array
  
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
\`\`\`

**Custom Hooks:**
\`\`\`javascript
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = value => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
\`\`\``,
    'components': `React components are the building blocks of React applications. Here's how to create and use them:

**Functional Components:**
\`\`\`javascript
import React from 'react';

function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Using the component
<Welcome name="John" />
\`\`\`

**Class Components:**
\`\`\`javascript
import React, { Component } from 'react';

class Welcome extends Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
\`\`\`

**Component Composition:**
\`\`\`javascript
function App() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

function Header() {
  return <header>My App</header>;
}

function MainContent() {
  return <main>Content goes here</main>;
}

function Footer() {
  return <footer>© 2024</footer>;
}
\`\`\``
  },
  css: {
    'flexbox': `CSS Flexbox is a layout model that allows you to design flexible responsive layouts. Here's a complete guide:

**Basic Flexbox Container:**
\`\`\`css
.container {
  display: flex;
  justify-content: center;    /* Horizontal alignment */
  align-items: center;        /* Vertical alignment */
  flex-direction: row;        /* Direction: row | column */
  flex-wrap: wrap;            /* Wrap items */
}
\`\`\`

**Flexbox Properties:**
\`\`\`css
/* Container properties */
justify-content: flex-start | flex-end | center | space-between | space-around;
align-items: stretch | flex-start | flex-end | center | baseline;
flex-direction: row | row-reverse | column | column-reverse;
flex-wrap: nowrap | wrap | wrap-reverse;
\`\`\`

**Flex Items:**
\`\`\`css
.item {
  flex: 1;                    /* Shorthand for flex-grow, flex-shrink, flex-basis */
  flex-grow: 1;               /* How much item can grow */
  flex-shrink: 1;             /* How much item can shrink */
  flex-basis: auto;           /* Initial size */
  align-self: center;         /* Override container's align-items */
}
\`\`\`

**Real Example:**
\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #333;
  color: white;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
}
\`\`\``,
    'grid': `CSS Grid is a powerful layout system for creating two-dimensional layouts. Here's everything you need to know:

**Basic Grid Container:**
\`\`\`css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  /* Three equal columns */
  grid-template-rows: 100px 200px;     /* Two rows with specific heights */
  gap: 20px;                           /* Gap between grid items */
}
\`\`\`

**Grid Template Areas:**
\`\`\`css
.container {
  display: grid;
  grid-template-areas: 
    "header header header"
    "sidebar main main"
    "footer footer footer";
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: 80px 1fr 100px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
\`\`\`

**Grid Items:**
\`\`\`css
.item {
  grid-column: 1 / 3;        /* Start at line 1, end at line 3 */
  grid-row: 1 / 2;           /* Start at line 1, end at line 2 */
  justify-self: center;      /* Horizontal alignment within grid cell */
  align-self: center;        /* Vertical alignment within grid cell */
}
\`\`\`

**Responsive Grid:**
\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
\`\`\``
  },
  html: {
    'semantic': `Semantic HTML uses meaningful tags that clearly describe their purpose. Here's a comprehensive guide:

**Document Structure:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <article>
      <h1>Article Title</h1>
      <p>Article content...</p>
    </article>
  </main>
  
  <footer>
    <p>&copy; 2024</p>
  </footer>
</body>
</html>
\`\`\`

**Semantic Elements:**
\`\`\`html
<!-- Header section -->
<header>
  <h1>Website Title</h1>
</header>

<!-- Navigation -->
<nav>
  <a href="#home">Home</a>
  <a href="#about">About</a>
</nav>

<!-- Main content -->
<main>
  <article>
    <h2>Article Title</h2>
    <p>Article content...</p>
  </article>
  
  <section>
    <h2>Section Title</h2>
    <p>Section content...</p>
  </section>
</main>

<!-- Sidebar -->
<aside>
  <h3>Related Links</h3>
  <ul>
    <li><a href="#">Link 1</a></li>
    <li><a href="#">Link 2</a></li>
  </ul>
</aside>

<!-- Footer -->
<footer>
  <p>Contact information</p>
</footer>
\`\`\`

**Benefits:**
- Better SEO
- Improved accessibility
- Easier maintenance
- Clearer code structure
- Better screen reader support`
  },
  database: {
    'postgresql': `PostgreSQL is a powerful, open-source object-relational database system. Here's a comprehensive guide:

**What is PostgreSQL?**
PostgreSQL (often called "Postgres") is an advanced, enterprise-class database that supports both SQL (relational) and JSON (non-relational) querying. It's known for its reliability, feature robustness, and performance.

**Key Features:**
- **ACID Compliance**: Ensures data integrity
- **Extensible**: Custom functions, operators, and data types
- **JSON Support**: Native JSON/JSONB data types
- **Advanced Indexing**: B-tree, Hash, GiST, SP-GiST, GIN, and BRIN
- **Concurrent Users**: Handles multiple users efficiently
- **Cross-Platform**: Runs on Windows, macOS, Linux

**Basic SQL Commands:**
\`\`\`sql
-- Create a database
CREATE DATABASE myapp;

-- Create a table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');

-- Query data
SELECT * FROM users WHERE email = 'john@example.com';

-- Update data
UPDATE users SET name = 'Jane Doe' WHERE id = 1;

-- Delete data
DELETE FROM users WHERE id = 1;
\`\`\`

**Advanced Features:**
\`\`\`sql
-- JSON support
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  metadata JSONB
);

INSERT INTO products (name, metadata) VALUES (
  'Laptop',
  '{"brand": "Apple", "model": "MacBook Pro", "specs": {"ram": "16GB", "storage": "512GB"}}'
);

-- Query JSON data
SELECT name, metadata->>'brand' as brand 
FROM products 
WHERE metadata->>'brand' = 'Apple';

-- Full-text search
CREATE INDEX idx_products_name ON products USING GIN (to_tsvector('english', name));

SELECT * FROM products 
WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'laptop');
\`\`\`

**Connection Examples:**

**Node.js with pg:**
\`\`\`javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'myapp',
  password: 'password',
  port: 5432,
});

async function getUsers() {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
}
\`\`\`

**Python with psycopg2:**
\`\`\`python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="myapp",
    user="postgres",
    password="password"
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
\`\`\`

**Best Practices:**
- **Use Connection Pooling**: For better performance
- **Index Frequently Queried Columns**: Improve query speed
- **Use Prepared Statements**: Prevent SQL injection
- **Regular Backups**: Use pg_dump for backups
- **Monitor Performance**: Use EXPLAIN ANALYZE
- **Use Transactions**: Ensure data consistency

**Installation:**
- **macOS**: \`brew install postgresql\`
- **Ubuntu**: \`sudo apt-get install postgresql postgresql-contrib\`
- **Windows**: Download from postgresql.org

**Resources:**
- Official Documentation: https://www.postgresql.org/docs/
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/
- Stack Overflow: https://stackoverflow.com/questions/tagged/postgresql`,

    'mysql': `MySQL is one of the most popular open-source relational database management systems. Here's a comprehensive guide:

**What is MySQL?**
MySQL is a fast, reliable, and easy-to-use database system that powers many of the world's most popular websites and applications. It's known for its speed, reliability, and ease of use.

**Key Features:**
- **High Performance**: Optimized for speed
- **Reliability**: Proven in production environments
- **Ease of Use**: Simple installation and management
- **Cross-Platform**: Runs on Windows, macOS, Linux
- **Large Community**: Extensive documentation and support
- **Scalability**: Handles large datasets efficiently

**Basic SQL Commands:**
\`\`\`sql
-- Create a database
CREATE DATABASE myapp;

-- Use the database
USE myapp;

-- Create a table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');

-- Query data
SELECT * FROM users WHERE email = 'john@example.com';

-- Update data
UPDATE users SET name = 'Jane Doe' WHERE id = 1;

-- Delete data
DELETE FROM users WHERE id = 1;
\`\`\`

**Advanced Features:**
\`\`\`sql
-- Indexes for performance
CREATE INDEX idx_email ON users(email);

-- Joins
SELECT u.name, p.title 
FROM users u 
JOIN posts p ON u.id = p.user_id;

-- Aggregation
SELECT COUNT(*) as total_users, 
       DATE(created_at) as signup_date 
FROM users 
GROUP BY DATE(created_at);

-- Subqueries
SELECT name FROM users 
WHERE id IN (SELECT user_id FROM posts WHERE published = 1);
\`\`\`

**Connection Examples:**

**Node.js with mysql2:**
\`\`\`javascript
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
});

const [rows] = await connection.execute('SELECT * FROM users');
\`\`\`

**Python with mysql-connector:**
\`\`\`python
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="myapp"
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
\`\`\`

**Best Practices:**
- **Use Connection Pooling**: For better performance
- **Index Frequently Queried Columns**: Improve query speed
- **Use Prepared Statements**: Prevent SQL injection
- **Regular Backups**: Use mysqldump for backups
- **Monitor Performance**: Use EXPLAIN for query analysis
- **Use Transactions**: Ensure data consistency
- **Optimize Queries**: Avoid SELECT * and use LIMIT

**Installation:**
- **macOS**: \`brew install mysql\`
- **Ubuntu**: \`sudo apt-get install mysql-server\`
- **Windows**: Download MySQL Installer

**Resources:**
- Official Documentation: https://dev.mysql.com/doc/
- MySQL Tutorial: https://www.mysqltutorial.org/
- Stack Overflow: https://stackoverflow.com/questions/tagged/mysql`,

    'mongodb': `MongoDB is a popular NoSQL database that stores data in flexible, JSON-like documents. Here's a comprehensive guide:

**What is MongoDB?**
MongoDB is a document-oriented database that stores data in BSON (Binary JSON) format. It's designed for scalability and flexibility, making it ideal for applications with rapidly changing data structures.

**Key Features:**
- **Document-Oriented**: Stores data as JSON-like documents
- **Schema Flexibility**: No fixed schema required
- **Horizontal Scalability**: Sharding for large datasets
- **High Performance**: Indexed queries and aggregation
- **Rich Query Language**: Complex queries and aggregations
- **JSON Support**: Native JSON data types

**Basic Operations:**
\`\`\`javascript
// Connect to MongoDB
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

// Create/use database
const db = client.db('myapp');

// Create/use collection
const users = db.collection('users');

// Insert document
await users.insertOne({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  created_at: new Date()
});

// Find documents
const user = await users.findOne({ email: 'john@example.com' });
const allUsers = await users.find({ age: { $gte: 18 } }).toArray();

// Update document
await users.updateOne(
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);

// Delete document
await users.deleteOne({ email: 'john@example.com' });
\`\`\`

**Advanced Queries:**
\`\`\`javascript
// Aggregation pipeline
const result = await users.aggregate([
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: '$age', count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray();

// Text search
await users.createIndex({ name: 'text' });
const searchResults = await users.find({
  $text: { $search: 'john' }
}).toArray();

// Geospatial queries
const locations = db.collection('locations');
await locations.createIndex({ location: '2dsphere' });

const nearby = await locations.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-73.97, 40.77]
      },
      $maxDistance: 1000
    }
  }
}).toArray();
\`\`\`

**Schema Design:**
\`\`\`javascript
// User document
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  profile: {
    age: 30,
    bio: "Software developer",
    avatar: "https://example.com/avatar.jpg"
  },
  posts: [
    {
      title: "My First Post",
      content: "Hello World!",
      created_at: new Date()
    }
  ],
  created_at: new Date(),
  updated_at: new Date()
}
\`\`\`

**Best Practices:**
- **Use Indexes**: Create indexes on frequently queried fields
- **Embed vs Reference**: Embed small, related data; reference large, independent data
- **Use Aggregation**: For complex data processing
- **Handle Errors**: Implement proper error handling
- **Use Transactions**: For multi-document operations
- **Monitor Performance**: Use MongoDB Compass for analysis
- **Backup Regularly**: Use mongodump for backups

**Installation:**
- **macOS**: \`brew install mongodb-community\`
- **Ubuntu**: \`sudo apt-get install mongodb\`
- **Windows**: Download from mongodb.com

**Resources:**
- Official Documentation: https://docs.mongodb.com/
- MongoDB University: https://university.mongodb.com/
- MongoDB Atlas: https://www.mongodb.com/atlas (cloud service)`
  },
  nodejs: {
    'express': `Express.js is a fast, unopinionated, minimalist web framework for Node.js. Here's a comprehensive guide:

**What is Express.js?**
Express is a web application framework that provides a robust set of features for web and mobile applications. It simplifies the process of building web applications and APIs.

**Key Features:**
- **Minimalist**: Lightweight and flexible
- **Middleware Support**: Extensible through middleware
- **Routing**: Simple and powerful routing system
- **Template Engines**: Support for various view engines
- **Static Files**: Built-in static file serving
- **Error Handling**: Comprehensive error handling

**Basic Setup:**
\`\`\`javascript
const express = require('express');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
\`\`\`

**Advanced Routing:**
\`\`\`javascript
// Route parameters
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ userId, message: 'User details' });
});

// Query parameters
app.get('/search', (req, res) => {
  const { q, page = 1 } = req.query;
  res.json({ query: q, page });
});

// POST with JSON body
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  // Save user to database
  res.status(201).json({ message: 'User created', name, email });
});

// PUT request
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  // Update user
  res.json({ message: 'User updated', id });
});

// DELETE request
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  // Delete user
  res.json({ message: 'User deleted', id });
});
\`\`\`

**Middleware Examples:**
\`\`\`javascript
// Custom middleware
const logger = (req, res, next) => {
  console.log(\`\${req.method} \${req.url} - \${new Date().toISOString()}\`);
  next();
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // Verify token
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

app.use(logger);
app.use('/api', authenticate);
app.use(errorHandler);
\`\`\`

**Database Integration:**
\`\`\`javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'myapp',
  password: 'password',
  port: 5432,
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
\`\`\`

**Best Practices:**
- **Use Environment Variables**: Store configuration in .env files
- **Implement Error Handling**: Use try-catch and error middleware
- **Use Helmet**: For security headers
- **Rate Limiting**: Prevent abuse with express-rate-limit
- **CORS**: Handle cross-origin requests
- **Validation**: Validate input with libraries like Joi
- **Logging**: Use Winston or Morgan for logging
- **Testing**: Write tests with Jest or Mocha

**Installation:**
\`\`\`bash
npm init -y
npm install express
npm install --save-dev nodemon
\`\`\`

**Resources:**
- Official Documentation: https://expressjs.com/
- Express Generator: https://expressjs.com/en/starter/generator.html
- Express Middleware: https://expressjs.com/en/resources/middleware.html`
  }
};

// Get appropriate model for category
function getModelForCategory(category) {
  // Use Qwen3-235B for all categories - it's a powerful model that can handle any topic
  return 'Qwen/Qwen3-235B-A22B';
}

// Enhanced AI response generation
async function generateAIResponse(question, category = 'general') {
  const lowerQuestion = question.toLowerCase();
  
  // Check cache first
  const cacheKey = `${lowerQuestion}_${category}`;
  const cached = aiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }

  let response = '';
  let source = '';

  // Try multiple AI sources in order of preference
  try {
    // 1. Try Hugging Face Inference API with Qwen model (if API key is available)
    if (hfClient && process.env.HUGGING_FACE_API_KEY && process.env.HUGGING_FACE_API_KEY !== 'your_hugging_face_api_key_here') {
      try {
        console.log('🤖 Attempting to use Qwen3-235B model...');
        
        const chatCompletion = await hfClient.chatCompletion({
          provider: "hf-inference",
          model: "Qwen/Qwen3-235B-A22B",
          messages: [
            {
              role: "user",
              content: `You are a helpful AI assistant specializing in web development. Please provide a comprehensive, accurate, and helpful answer to this question: ${question}`
            },
          ],
          parameters: {
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9
          }
        });

        if (chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
          response = chatCompletion.choices[0].message.content;
          source = 'Qwen3-235B AI';
          console.log('✅ Qwen3-235B response generated successfully');
        }
      } catch (hfError) {
        console.error('❌ Qwen3-235B API error:', hfError);
        if (hfError.response) {
          console.error('❌ Qwen3-235B API error response data:', hfError.response.data);
        }
        // Fallback to old API method if new one fails
        try {
          const model = getModelForCategory(category);
          const hfResponse = await axios.post(`https://api-inference.huggingface.co/models/${model}`, {
            inputs: `Question: ${question}\n\nAnswer:`,
            parameters: {
              max_length: 500,
              temperature: 0.7,
              do_sample: true
            }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`
            },
            timeout: 10000
          });

          if (hfResponse.data && hfResponse.data[0] && hfResponse.data[0].generated_text) {
            response = hfResponse.data[0].generated_text;
            source = 'Hugging Face AI (Fallback)';
          }
        } catch (fallbackError) {
          console.error('❌ Fallback API also failed:', fallbackError);
          if (fallbackError.response) {
            console.error('❌ Fallback API error response data:', fallbackError.response.data);
          }
        }
      }
    }

    // 2. Try DuckDuckGo Instant Answer API (free, no auth required)
    if (!response) {
      const ddgResponse = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(question + ' web development')}&format=json&no_html=1&skip_disambig=1`, {
        timeout: 5000
      });

      if (ddgResponse.data && ddgResponse.data.Abstract) {
        response = ddgResponse.data.Abstract;
        source = 'DuckDuckGo';
      }
    }

    // 3. Use enhanced local knowledge base
    if (!response) {
      const localResponse = getLocalResponse(lowerQuestion, category);
      if (localResponse) {
        response = localResponse;
        source = 'Local Knowledge Base';
      }
    }

    // 4. Fallback to comprehensive response
    if (!response) {
      response = generateComprehensiveResponse(question, category);
      source = 'Enhanced Local AI';
    }

    // Cache the response
    aiCache.set(cacheKey, {
      response,
      source,
      timestamp: Date.now()
    });

    return { response, source };

  } catch (error) {
    console.error('AI API Error:', error.message);
    
    // Fallback to local knowledge
    const localResponse = getLocalResponse(lowerQuestion, category);
    if (localResponse) {
      return { response: localResponse, source: 'Local Knowledge Base (Fallback)' };
    }
    
    return { 
      response: generateComprehensiveResponse(question, category), 
      source: 'Enhanced Local AI (Fallback)' 
    };
  }
}

// Enhanced local response generation
function getLocalResponse(question, category) {
  const categoryKnowledge = webDevKnowledge[category];
  if (!categoryKnowledge) return null;

  const lowerQuestion = question.toLowerCase();

  // Check for exact matches first
  for (const [key, value] of Object.entries(categoryKnowledge)) {
    if (lowerQuestion.includes(key)) {
      return value;
    }
  }

  // Check for specific database questions
  if (category === 'database' || category === 'general') {
    if (lowerQuestion.includes('postgresql') || lowerQuestion.includes('postgres')) {
      return webDevKnowledge.database.postgresql;
    }
    if (lowerQuestion.includes('mysql')) {
      return webDevKnowledge.database.mysql;
    }
    if (lowerQuestion.includes('mongodb') || lowerQuestion.includes('mongo')) {
      return webDevKnowledge.database.mongodb;
    }
  }

  // Check for specific Node.js questions
  if (category === 'nodejs' || category === 'general') {
    if (lowerQuestion.includes('express')) {
      return webDevKnowledge.nodejs.express;
    }
  }

  // Check for partial matches with improved scoring
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, value] of Object.entries(categoryKnowledge)) {
    const keyWords = key.split(' ');
    const questionWords = lowerQuestion.split(' ');
    
    let score = 0;
    
    // Check for word matches
    for (const keyWord of keyWords) {
      for (const qWord of questionWords) {
        if (qWord.includes(keyWord) || keyWord.includes(qWord)) {
          score += 1;
        }
      }
    }
    
    // Bonus for longer matches
    if (lowerQuestion.includes(key)) {
      score += 2;
    }
    
    // Bonus for exact phrase matches
    if (lowerQuestion.includes(key.toLowerCase())) {
      score += 3;
    }
    
    if (score > bestScore && score >= 1) {
      bestScore = score;
      bestMatch = value;
    }
  }

  return bestMatch;
}

// Generate comprehensive response when no specific match found
function generateComprehensiveResponse(question, category) {
  const responses = {
    javascript: `Here's a comprehensive answer about JavaScript:

**JavaScript Fundamentals:**
JavaScript is a versatile programming language used for web development. It's essential for creating interactive websites and web applications.

**Key Concepts:**
- **Variables**: Use \`let\`, \`const\`, or \`var\` to declare variables
- **Functions**: Reusable blocks of code
- **Objects**: Collections of key-value pairs
- **Arrays**: Ordered collections of values
- **Promises**: Handle asynchronous operations
- **ES6+ Features**: Arrow functions, destructuring, modules

**Best Practices:**
- Use meaningful variable names
- Write clean, readable code
- Handle errors properly
- Use modern ES6+ syntax
- Follow consistent formatting

**Resources:**
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- JavaScript.info: https://javascript.info/
- Eloquent JavaScript: https://eloquentjavascript.net/`,

    react: `Here's a comprehensive guide to React:

**React Fundamentals:**
React is a JavaScript library for building user interfaces, particularly single-page applications.

**Core Concepts:**
- **Components**: Reusable UI pieces
- **Props**: Data passed to components
- **State**: Component's internal data
- **Hooks**: Functions for state and side effects
- **JSX**: JavaScript syntax extension
- **Virtual DOM**: Efficient rendering

**Key Hooks:**
- \`useState\`: Manage component state
- \`useEffect\`: Handle side effects
- \`useContext\`: Share data across components
- \`useReducer\`: Complex state management

**Best Practices:**
- Keep components small and focused
- Use functional components with hooks
- Implement proper error boundaries
- Optimize with React.memo and useMemo
- Follow the component composition pattern

**Resources:**
- React Documentation: https://react.dev/
- React Tutorial: https://react.dev/learn
- React Patterns: https://reactpatterns.com/`,

    css: `Here's a comprehensive CSS guide:

**CSS Fundamentals:**
CSS (Cascading Style Sheets) is used to style and layout web pages.

**Key Concepts:**
- **Selectors**: Target HTML elements
- **Properties**: Define styles
- **Values**: Specify property settings
- **Box Model**: Content, padding, border, margin
- **Layout**: Flexbox, Grid, positioning
- **Responsive Design**: Media queries

**Layout Systems:**
- **Flexbox**: One-dimensional layouts
- **Grid**: Two-dimensional layouts
- **Positioning**: Relative, absolute, fixed
- **Floats**: Legacy layout method

**Best Practices:**
- Use semantic class names
- Follow BEM methodology
- Write mobile-first CSS
- Optimize for performance
- Use CSS custom properties
- Implement responsive design

**Resources:**
- MDN CSS: https://developer.mozilla.org/en-US/docs/Web/CSS
- CSS-Tricks: https://css-tricks.com/
- Flexbox Froggy: https://flexboxfroggy.com/
- Grid Garden: https://cssgridgarden.com/`,

    html: `Here's a comprehensive HTML guide:

**HTML Fundamentals:**
HTML (HyperText Markup Language) is the standard markup language for creating web pages.

**Key Concepts:**
- **Elements**: Building blocks of HTML
- **Tags**: Markup that defines elements
- **Attributes**: Provide additional information
- **Semantic HTML**: Meaningful element names
- **Accessibility**: Making content available to all users
- **SEO**: Search engine optimization

**Document Structure:**
- \`<!DOCTYPE html>\`: Document type declaration
- \`<html>\`: Root element
- \`<head>\`: Metadata section
- \`<body>\`: Content section

**Semantic Elements:**
- \`<header>\`, \`<nav>\`, \`<main>\`
- \`<article>\`, \`<section>\`, \`<aside>\`
- \`<footer>\`, \`<figure>\`, \`<figcaption>\`

**Best Practices:**
- Use semantic HTML elements
- Include proper meta tags
- Ensure accessibility
- Validate your HTML
- Optimize for SEO
- Write clean, readable code

**Resources:**
- MDN HTML: https://developer.mozilla.org/en-US/docs/Web/HTML
- HTML Living Standard: https://html.spec.whatwg.org/
- W3Schools HTML: https://www.w3schools.com/html/`,

    general: `Here's a comprehensive web development guide:

**Web Development Fundamentals:**
Web development involves creating websites and web applications using various technologies.

**Frontend Technologies:**
- **HTML**: Structure and content
- **CSS**: Styling and layout
- **JavaScript**: Interactivity and logic
- **React/Vue/Angular**: Modern frameworks
- **TypeScript**: Typed JavaScript

**Backend Technologies:**
- **Node.js**: JavaScript runtime
- **Python**: Django, Flask
- **PHP**: WordPress, Laravel
- **Java**: Spring Boot
- **Databases**: MySQL, PostgreSQL, MongoDB

**Development Tools:**
- **Git**: Version control
- **VS Code**: Code editor
- **Chrome DevTools**: Browser debugging
- **Webpack/Vite**: Build tools
- **Docker**: Containerization

**Best Practices:**
- Write clean, maintainable code
- Follow coding standards
- Implement responsive design
- Optimize for performance
- Ensure accessibility
- Test thoroughly
- Use version control
- Document your code

**Learning Resources:**
- MDN Web Docs: https://developer.mozilla.org/
- freeCodeCamp: https://www.freecodecamp.org/
- The Odin Project: https://www.theodinproject.com/
- Frontend Mentor: https://www.frontendmentor.io/`
  };

  return responses[category] || responses.general;
}

// Rate limiting middleware
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = aiRateLimit.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  aiRateLimit.set(userId, recentRequests);
  return true;
}

// AI Q&A endpoint
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const { question, category = 'general' } = req.body;
    const userId = req.user.id;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before asking another question.',
        limit: RATE_LIMIT,
        window: '1 hour'
      });
    }

    console.log(`AI Q&A request from user ${userId}: "${question}"`);

    const result = await generateAIResponse(question, category);

    console.log(`AI response generated for user ${userId} using ${result.source}`);

    res.json({
      success: true,
      question,
      response: result.response,
      source: result.source,
      category,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Q&A Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error.message 
    });
  }
});

// Get AI categories
router.get('/categories', authenticateToken, (req, res) => {
  const categories = [
    { id: 'general', name: 'General Web Dev', icon: '🌐', description: 'General web development questions' },
    { id: 'javascript', name: 'JavaScript', icon: '⚡', description: 'JavaScript, ES6+, async/await, functions' },
    { id: 'react', name: 'React', icon: '⚛️', description: 'React components, hooks, state management' },
    { id: 'css', name: 'CSS & Styling', icon: '🎨', description: 'CSS, Flexbox, Grid, responsive design' },
    { id: 'html', name: 'HTML', icon: '📄', description: 'HTML structure, semantic elements, accessibility' },
    { id: 'nodejs', name: 'Node.js', icon: '🟢', description: 'Backend development, APIs, server-side' },
    { id: 'database', name: 'Databases', icon: '🗄️', description: 'SQL, NoSQL, data modeling' },
    { id: 'deployment', name: 'Deployment', icon: '🚀', description: 'Hosting, CI/CD, cloud platforms' }
  ];

  res.json({ categories });
});

// Get sample questions
router.get('/samples', authenticateToken, (req, res) => {
  const { category = 'general' } = req.query;
  
  const sampleQuestions = {
    general: [
      'What is the difference between frontend and backend development?',
      'How do I become a web developer?',
      'What are the best practices for responsive design?',
      'How do I optimize website performance?',
      'What is the difference between HTTP and HTTPS?'
    ],
    javascript: [
      'How do I use async/await in JavaScript?',
      'What is the difference between let, const, and var?',
      'How do I handle errors in JavaScript?',
      'What are arrow functions and when should I use them?',
      'How do I work with Promises?'
    ],
    react: [
      'What are React hooks and how do I use them?',
      'How do I manage state in React?',
      'What is the difference between props and state?',
      'How do I create reusable components?',
      'What is the Virtual DOM in React?'
    ],
    css: [
      'How do I use CSS Flexbox?',
      'What is CSS Grid and how do I use it?',
      'How do I create responsive layouts?',
      'What are CSS custom properties?',
      'How do I center elements in CSS?'
    ],
    html: [
      'What are semantic HTML elements?',
      'How do I create accessible forms?',
      'What is the difference between div and span?',
      'How do I optimize HTML for SEO?',
      'What are the best practices for HTML structure?'
    ]
  };

  res.json({ 
    questions: sampleQuestions[category] || sampleQuestions.general 
  });
});

// Clear cache endpoint (admin only)
router.delete('/cache', authenticateToken, (req, res) => {
  try {
    aiCache.clear();
    aiRateLimit.clear();
    res.json({ success: true, message: 'AI cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router; 