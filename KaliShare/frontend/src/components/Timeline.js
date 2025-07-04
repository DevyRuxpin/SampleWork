import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
  FaHeart, FaComment, FaShare, FaTrash, FaEllipsisH, FaPlay,
  FaYoutube, FaTwitch, FaVideo, FaUser, FaClock, FaGlobe, FaPaperPlane, FaSpinner
} from 'react-icons/fa';

const getAvatar = (email) => {
  // Simple avatar using first letter of email
  return email ? email.charAt(0).toUpperCase() : '?';
};

// Helper function to convert livestream URLs to embed URLs
const getEmbedUrl = (url) => {
  if (!url) return null;
  
  // YouTube Live
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    const videoId = url.includes('youtu.be/') 
      ? url.split('youtu.be/')[1].split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  
  // Twitch
  if (url.includes('twitch.tv/')) {
    const channel = url.split('twitch.tv/')[1]?.split('/')[0];
    return channel ? `https://player.twitch.tv/?channel=${channel}&parent=localhost` : null;
  }
  
  // Zoom (convert to iframe-friendly format)
  if (url.includes('zoom.us/j/')) {
    return url; // Zoom URLs work directly in iframes
  }
  
  // Google Meet
  if (url.includes('meet.google.com/')) {
    return url; // Google Meet URLs work directly in iframes
  }
  
  return null;
};

const Timeline = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newLivestreamUrl, setNewLivestreamUrl] = useState('');
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [showLivestreamInput, setShowLivestreamInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCommentDeleteConfirm, setShowCommentDeleteConfirm] = useState(null);
  const { trackUserAction, trackFeatureUsage } = useAnalytics();
  const postsEndRef = useRef(null);
  const [user, setUser] = useState(null);

  const scrollToBottom = () => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view the timeline');
      setLoading(false);
      return;
    }

    fetchPosts();
    initializeSocket();
  }, []);

  const initializeSocket = () => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to timeline');
    });

    newSocket.on('newPost', (post) => {
      setPosts(prev => [post, ...prev]);
      trackUserAction('New Post Received', { postId: post._id });
    });

    newSocket.on('postDeleted', (postId) => {
      setPosts(prev => prev.filter(post => post._id !== postId));
      trackUserAction('Post Deleted', { postId });
    });

    newSocket.on('newComment', (data) => {
      setPosts(prev => prev.map(post => 
        post._id === data.postId 
          ? { ...post, comments: [...(post.comments || []), data.comment] }
          : post
      ));
      trackUserAction('New Comment Received', { postId: data.postId, commentId: data.comment._id });
    });

    newSocket.on('commentDeleted', (data) => {
      setPosts(prev => prev.map(post => 
        post._id === data.postId 
          ? { ...post, comments: post.comments.filter(comment => comment._id !== data.commentId) }
          : post
      ));
      trackUserAction('Comment Deleted', { postId: data.postId, commentId: data.commentId });
    });

    return () => newSocket.close();
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timeline', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPost })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      const post = await response.json();
      setPosts(prev => [post, ...prev]);
      setNewPost('');
      
      trackUserAction('Post Created', { postId: post._id });
      
      if (socket) {
        socket.emit('newPost', post);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timeline/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }

      setPosts(prev => prev.filter(post => post._id !== postId));
      setShowDeleteConfirm(null);
      setShowDropdown(null);
      
      trackUserAction('Post Deleted', { postId });
      
      if (socket) {
        socket.emit('postDeleted', postId);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.message || 'Failed to delete post');
    }
  };

  const handleAddComment = async (postId, commentText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timeline/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      const comment = await response.json();
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...(post.comments || []), comment] }
          : post
      ));
      
      trackUserAction('Comment Added', { postId, commentId: comment._id });
      
      if (socket) {
        socket.emit('newComment', { postId, comment });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timeline/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }

      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, comments: post.comments.filter(comment => comment._id !== commentId) }
          : post
      ));
      setShowCommentDeleteConfirm(null);
      
      trackUserAction('Comment Deleted', { postId, commentId });
      
      if (socket) {
        socket.emit('commentDeleted', { postId, commentId });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.message || 'Failed to delete comment');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const post = posts.find(p => p._id === postId);
      const isCurrentlyLiked = post.isLiked;
      
      const response = await fetch(`/api/timeline/${postId}/like`, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like');
      }

      // Update the post's like status
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isLiked: !isCurrentlyLiked,
              likeCount: isCurrentlyLiked ? post.likeCount - 1 : post.likeCount + 1
            }
          : post
      ));
      
      trackUserAction(isCurrentlyLiked ? 'Post Unliked' : 'Post Liked', { postId });
    } catch (error) {
      console.error('Error updating like:', error);
      setError(error.message || 'Failed to update like');
    }
  };

  const handleSharePost = async (post) => {
    try {
      const shareData = {
        title: 'KaliShare Post',
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: `${window.location.origin}/timeline?post=${post._id}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
        trackUserAction('Post Shared', { postId: post._id, method: 'native' });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setError('Link copied to clipboard!');
        setTimeout(() => setError(''), 3000);
        trackUserAction('Post Shared', { postId: post._id, method: 'clipboard' });
      }
    } catch (error) {
      // Don't show error for canceled shares (this is normal behavior)
      if (error.name === 'AbortError' || error.message.includes('Share canceled')) {
        console.log('Share was canceled by user');
        return;
      }
      
      console.error('Error sharing post:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/timeline?post=${post._id}`);
        setError('Link copied to clipboard!');
        setTimeout(() => setError(''), 3000);
        trackUserAction('Post Shared', { postId: post._id, method: 'clipboard' });
      } catch (clipboardError) {
        setError('Failed to share post');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-3xl) var(--space-lg)',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: 'var(--space-lg)', 
            color: 'var(--primary-color)',
            animation: 'pulse 2s infinite'
          }}>
            💬
          </div>
          <div style={{ 
            fontSize: '1.5rem', 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '600'
          }}>
            Loading Timeline
          </div>
          <div style={{ 
            color: 'var(--text-tertiary)', 
            fontSize: '1rem'
          }}>
            Connecting to real-time updates...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-3xl) var(--space-lg)',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: 'var(--space-lg)', 
            color: 'var(--error-color)',
            animation: 'shake 0.5s ease-in-out'
          }}>
            ⚠️
          </div>
          <h3 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-md)',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>
            Timeline Error
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-xl)',
            fontSize: '1.1rem',
            maxWidth: '500px'
          }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: 'var(--space-md) var(--space-xl)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-xl) 0'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-lighter) 0%, var(--accent-lighter) 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-2xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite'
          }} />
          
          <h1 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-md)', 
            fontWeight: '800', 
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative',
            zIndex: 1
          }}>
            Developer Timeline
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '0',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1
          }}>
            Share your thoughts, ask questions, and connect with the community
          </p>
        </div>
      </div>

      {/* Create Post Form */}
      <div className="card" style={{ 
        marginBottom: 'var(--space-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
        }} />
        
        <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0
            }}>
              <FaUser />
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind? Share your thoughts, questions, or discoveries..."
                className="form-control"
                style={{ 
                  minHeight: '120px',
                  resize: 'vertical',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  border: '2px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-md)',
                  transition: 'all var(--transition-normal)'
                }}
                disabled={!user}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!newPost.trim() || !user}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                padding: 'var(--space-md) var(--space-xl)'
              }}
            >
              <FaPaperPlane style={{ fontSize: '0.875rem' }} />
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {posts.map((post, index) => (
          <div 
            key={post._id} 
            className="timeline-post"
            style={{
              animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
            }}
          >
            {/* Post Header */}
            <div className="post-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <FaUser />
                </div>
                <div>
                  <div className="post-author">{post.author.email}</div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-sm)',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.875rem'
                  }}>
                    <FaClock style={{ fontSize: '0.75rem' }} />
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </div>
              
              {/* Post Actions Dropdown */}
              {user && post.author._id === user._id && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDropdown(showDropdown === post._id ? null : post._id)}
                    className="btn btn-ghost"
                    style={{ 
                      padding: 'var(--space-sm)',
                      fontSize: '1.1rem',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    <FaEllipsisH />
                  </button>
                  
                  {showDropdown === post._id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--background-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-xl)',
                      zIndex: 1000,
                      minWidth: '150px',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        style={{
                          width: '100%',
                          padding: 'var(--space-md)',
                          border: 'none',
                          background: 'none',
                          color: 'var(--error-color)',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--error-lighter)'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                      >
                        <FaTrash style={{ fontSize: '0.875rem' }} />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="post-content" style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
              {post.content}
            </div>

            {/* Post Actions */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-lg)',
              paddingTop: 'var(--space-md)',
              borderTop: '1px solid var(--border-light)'
            }}>
              <button 
                onClick={() => handleLikePost(post._id)}
                className="btn btn-ghost" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-sm)',
                  fontSize: '0.875rem',
                  color: post.isLiked ? 'var(--error-color)' : 'var(--text-tertiary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <FaHeart style={{ 
                  color: post.isLiked ? 'var(--error-color)' : 'var(--text-tertiary)',
                  fill: post.isLiked ? 'var(--error-color)' : 'none',
                  stroke: post.isLiked ? 'var(--error-color)' : 'var(--text-tertiary)',
                  strokeWidth: '2'
                }} />
                {post.likeCount || 0} {post.likeCount === 1 ? 'Like' : 'Likes'}
              </button>
              <button className="btn btn-ghost" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                fontSize: '0.875rem'
              }}>
                <FaComment style={{ color: 'var(--text-tertiary)' }} />
                {post.comments ? post.comments.length : 0} Comments
              </button>
              <button 
                onClick={() => handleSharePost(post)}
                className="btn btn-ghost" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <FaShare style={{ color: 'var(--text-tertiary)' }} />
                Share
              </button>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              {/* Add Comment */}
              {user && (
                <CommentForm 
                  postId={post._id} 
                  onAddComment={handleAddComment}
                  user={user}
                />
              )}
              
              {/* Comments List */}
              {post.comments && post.comments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {post.comments.map((comment) => (
                    <div key={comment._id} className="comment">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, var(--accent-color), var(--primary-color))',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            <FaUser />
                          </div>
                          <div>
                            <div style={{ 
                              fontWeight: '600', 
                              color: 'var(--primary-color)',
                              fontSize: '0.875rem'
                            }}>
                              {comment.author.email}
                            </div>
                            <div style={{ 
                              color: 'var(--text-tertiary)', 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-xs)'
                            }}>
                              <FaClock style={{ fontSize: '0.625rem' }} />
                              {formatDate(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Comment Delete Button */}
                        {user && comment.author._id === user._id && (
                          <button
                            onClick={() => setShowCommentDeleteConfirm(showCommentDeleteConfirm === comment._id ? null : comment._id)}
                            className="btn btn-ghost"
                            style={{ 
                              padding: 'var(--space-xs)',
                              fontSize: '0.75rem',
                              color: 'var(--error-color)'
                            }}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      
                      <div style={{ 
                        marginTop: 'var(--space-sm)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        lineHeight: '1.6'
                      }}>
                        {comment.content}
                      </div>
                      
                      {/* Comment Delete Confirmation */}
                      {showCommentDeleteConfirm === comment._id && (
                        <div style={{
                          marginTop: 'var(--space-sm)',
                          padding: 'var(--space-sm)',
                          background: 'var(--error-lighter)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--error-light)'
                        }}>
                          <p style={{ 
                            color: 'var(--error-color)', 
                            fontSize: '0.875rem',
                            marginBottom: 'var(--space-sm)'
                          }}>
                            Are you sure you want to delete this comment?
                          </p>
                          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button
                              onClick={() => handleDeleteComment(post._id, comment._id)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setShowCommentDeleteConfirm(null)}
                              className="btn btn-ghost"
                              style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--background-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-2xl)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-2xl)',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Delete Post
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                onClick={() => handleDeletePost(showDeleteConfirm)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={postsEndRef} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Comment Form Component
const CommentForm = ({ postId, onAddComment, user }) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    onAddComment(postId, commentText);
    setCommentText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, var(--accent-color), var(--primary-color))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          <FaUser />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 'var(--space-sm)' }}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="form-control"
            style={{ 
              fontSize: '0.875rem',
              padding: 'var(--space-sm) var(--space-md)',
              border: '2px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              flex: 1
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!commentText.trim()}
            style={{ 
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: '0.875rem'
            }}
          >
            <FaPaperPlane style={{ fontSize: '0.75rem' }} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default Timeline; 