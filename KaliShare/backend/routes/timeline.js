const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
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

// Main timeline endpoint - returns posts and user data
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user data
    const userQuery = 'SELECT id, email FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = {
      _id: userResult.rows[0].id,
      email: userResult.rows[0].email
    };

    // Get all posts with comments
    const postsQuery = `
      SELECT 
        p.id as _id, 
        p.content, 
        p.livestream_url,
        p.created_at as "createdAt",
        u.id as "author._id",
        u.email as "author.email",
        COUNT(l.id) as like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      GROUP BY p.id, u.id, u.email
      ORDER BY p.created_at DESC
    `;
    
    const postsResult = await pool.query(postsQuery);
    
    // Get comments for each post
    const posts = await Promise.all(
      postsResult.rows.map(async (post) => {
        const commentsQuery = `
          SELECT 
            c.id as _id, 
            c.content, 
            c.created_at as "createdAt",
            u.id as "author._id",
            u.email as "author.email"
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = $1
          ORDER BY c.created_at ASC
        `;
        
        const commentsResult = await pool.query(commentsQuery, [post._id]);
        
        // Check if current user liked this post
        const userLikeQuery = 'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2';
        const userLikeResult = await pool.query(userLikeQuery, [post._id, req.user.id]);
        
        return {
          _id: post._id,
          content: post.content,
          livestream_url: post.livestream_url,
          createdAt: post.createdAt,
          likeCount: parseInt(post.like_count),
          isLiked: userLikeResult.rows.length > 0,
          author: {
            _id: post["author._id"],
            email: post["author.email"]
          },
          comments: commentsResult.rows.map(comment => ({
            _id: comment._id,
            content: comment.content,
            createdAt: comment.createdAt,
            author: {
              _id: comment["author._id"],
              email: comment["author.email"]
            }
          }))
        };
      })
    );

    res.json({
      posts: posts,
      user: user
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all posts with comments (legacy endpoint)
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const postsQuery = `
      SELECT 
        p.id, 
        p.content, 
        p.livestream_url,
        p.created_at,
        u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    
    const posts = await pool.query(postsQuery);
    
    // Get comments for each post
    const postsWithComments = await Promise.all(
      posts.rows.map(async (post) => {
        const commentsQuery = `
          SELECT 
            c.id, 
            c.content, 
            c.created_at,
            u.email as author_email
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = $1
          ORDER BY c.created_at ASC
        `;
        
        const comments = await pool.query(commentsQuery, [post.id]);
        
        return {
          ...post,
          comments: comments.rows
        };
      })
    );

    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get educational resources
router.get('/resources', async (req, res) => {
  try {
    const resources = await resourceGenerator.getCurrentResources();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, livestream_url } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Validate livestream URL if provided
    if (livestream_url && livestream_url.trim().length > 0) {
      const url = livestream_url.trim();
      
      // Check if it's a valid livestream URL from supported platforms
      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];
      
      const isValidLivestreamUrl = supportedPlatforms.some(platform => 
        url.includes(platform)
      );
      
      if (!isValidLivestreamUrl) {
        return res.status(400).json({ 
          error: 'Invalid livestream URL. Supported platforms: YouTube, Twitch, Zoom, Google Meet' 
        });
      }
    }

    const newPost = await pool.query(
      'INSERT INTO posts (user_id, content, livestream_url) VALUES ($1, $2, $3) RETURNING id, content, livestream_url, created_at',
      [req.user.id, content.trim(), livestream_url ? livestream_url.trim() : null]
    );

    // Get the user email for the response
    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);

    const postWithAuthor = {
      _id: newPost.rows[0].id,
      content: newPost.rows[0].content,
      livestream_url: newPost.rows[0].livestream_url,
      createdAt: newPost.rows[0].created_at,
      author: {
        _id: req.user.id,
        email: user.rows[0].email
      },
      comments: []
    };

    res.status(201).json(postWithAuthor);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post (legacy endpoint)
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { content, livestream_url } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Validate livestream URL if provided
    if (livestream_url && livestream_url.trim().length > 0) {
      const url = livestream_url.trim();
      
      // Check if it's a valid livestream URL from supported platforms
      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];
      
      const isValidLivestreamUrl = supportedPlatforms.some(platform => 
        url.includes(platform)
      );
      
      if (!isValidLivestreamUrl) {
        return res.status(400).json({ 
          error: 'Invalid livestream URL. Supported platforms: YouTube, Twitch, Zoom, Google Meet' 
        });
      }
    }

    const newPost = await pool.query(
      'INSERT INTO posts (user_id, content, livestream_url) VALUES ($1, $2, $3) RETURNING id, content, livestream_url, created_at',
      [req.user.id, content.trim(), livestream_url ? livestream_url.trim() : null]
    );

    // Get the user email for the response
    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);

    const postWithAuthor = {
      ...newPost.rows[0],
      author_email: user.rows[0].email,
      comments: []
    };

    res.status(201).json(postWithAuthor);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment to a post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if post exists
    const postExists = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [postId, req.user.id, content.trim()]
    );

    // Get the user email for the response
    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);

    const commentWithAuthor = {
      _id: newComment.rows[0].id,
      content: newComment.rows[0].content,
      createdAt: newComment.rows[0].created_at,
      author: {
        _id: req.user.id,
        email: user.rows[0].email
      }
    };

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment to a post (legacy endpoint)
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if post exists
    const postExists = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [postId, req.user.id, content.trim()]
    );

    // Get the user email for the response
    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);

    const commentWithAuthor = {
      ...newComment.rows[0],
      author_email: user.rows[0].email
    };

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // Check if comment exists and belongs to user
    const commentQuery = `
      SELECT c.id, c.user_id, p.id as post_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1 AND c.post_id = $2
    `;
    
    const commentResult = await pool.query(commentQuery, [commentId, postId]);
    
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Delete the comment
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment (legacy endpoint)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if comment exists and belongs to the user
    const commentQuery = `
      SELECT c.id, c.user_id, c.post_id, u.email as author_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    const comment = await pool.query(commentQuery, [commentId]);
    
    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the comment belongs to the current user
    if (comment.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Delete the comment
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ 
      message: 'Comment deleted successfully',
      commentId: commentId,
      postId: comment.rows[0].post_id
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists and belongs to the user
    const postQuery = `
      SELECT p.id, p.user_id, p.content, u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    const post = await pool.query(postQuery, [postId]);
    
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the post belongs to the current user
    if (post.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete all comments for this post first (due to foreign key constraint)
    await pool.query('DELETE FROM comments WHERE post_id = $1', [postId]);

    // Delete the post
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.json({ 
      message: 'Post deleted successfully',
      postId: postId
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post (legacy endpoint)
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists and belongs to the user
    const postQuery = `
      SELECT p.id, p.user_id, p.content, u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    const post = await pool.query(postQuery, [postId]);
    
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the post belongs to the current user
    if (post.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete all comments for this post first (due to foreign key constraint)
    await pool.query('DELETE FROM comments WHERE post_id = $1', [postId]);

    // Delete the post
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.json({ 
      message: 'Post deleted successfully',
      postId: postId
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const postQuery = 'SELECT id FROM posts WHERE id = $1';
    const postResult = await pool.query(postQuery, [postId]);
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked the post
    const existingLikeQuery = 'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2';
    const existingLikeResult = await pool.query(existingLikeQuery, [postId, req.user.id]);
    
    if (existingLikeResult.rows.length > 0) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    // Add like
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, req.user.id]);

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlike a post
router.delete('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Remove like
    const result = await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get like status for a post
router.get('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if user liked the post
    const likeQuery = 'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2';
    const likeResult = await pool.query(likeQuery, [postId, req.user.id]);
    
    const isLiked = likeResult.rows.length > 0;

    // Get total likes count
    const countQuery = 'SELECT COUNT(*) as count FROM likes WHERE post_id = $1';
    const countResult = await pool.query(countQuery, [postId]);
    
    res.json({
      isLiked: isLiked,
      likeCount: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 