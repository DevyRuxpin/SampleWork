import React, { useState } from 'react';
import { FaRobot, FaLightbulb, FaSpinner, FaTimes, FaCheck, FaRegCopy } from 'react-icons/fa';
import { useAnalytics } from '../hooks/useAnalytics';
import styles from './AI.module.css';

const AI = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [copied, setCopied] = useState(false);
  const { trackUserAction } = useAnalytics();

  const categories = [
    { id: 'general', name: 'General Web Dev', icon: '🌐' },
    { id: 'javascript', name: 'JavaScript', icon: '⚡' },
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'css', name: 'CSS & Styling', icon: '🎨' },
    { id: 'html', name: 'HTML', icon: '📄' },
    { id: 'nodejs', name: 'Node.js', icon: '🟢' },
    { id: 'database', name: 'Databases', icon: '🗄️' },
    { id: 'deployment', name: 'Deployment', icon: '🚀' }
  ];

  const sampleQuestions = [
    'How do I use async/await in JavaScript?',
    'What are React hooks and how do I use them?',
    'How do I use CSS Flexbox?',
    'What are semantic HTML elements?',
    'Explain PostgreSQL to me',
    'How do I use Express.js?'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError('');
    setShowAnswer(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: question.trim(),
          category: selectedCategory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const answerText = data.answer || data.response || 'No response received';
      setAnswer(answerText);
      setShowAnswer(true);
      setCopied(false);

      trackUserAction('AI Question Asked', {
        question: question.trim(),
        category: selectedCategory,
        source: data.source || 'AI',
        cached: data.cached || false
      });

    } catch (error) {
      console.error('AI error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuestion = (sampleQuestion) => {
    setQuestion(sampleQuestion);
    const questionLower = sampleQuestion.toLowerCase();
    if (questionLower.includes('javascript') || questionLower.includes('async') || questionLower.includes('await')) {
      setSelectedCategory('javascript');
    } else if (questionLower.includes('react') || questionLower.includes('hooks')) {
      setSelectedCategory('react');
    } else if (questionLower.includes('css') || questionLower.includes('flexbox') || questionLower.includes('grid')) {
      setSelectedCategory('css');
    } else if (questionLower.includes('html') || questionLower.includes('semantic')) {
      setSelectedCategory('html');
    } else if (questionLower.includes('postgresql') || questionLower.includes('mysql') || questionLower.includes('mongodb') || questionLower.includes('database')) {
      setSelectedCategory('database');
    } else if (questionLower.includes('express') || questionLower.includes('node.js') || questionLower.includes('nodejs')) {
      setSelectedCategory('nodejs');
    } else if (questionLower.includes('deploy') || questionLower.includes('production')) {
      setSelectedCategory('deployment');
    } else {
      setSelectedCategory('general');
    }
  };

  const clearQuestion = () => {
    setQuestion('');
    setAnswer('');
    setError('');
    setShowAnswer(false);
    setCopied(false);
  };

  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className={styles.aiCard}>
      <div className={styles.aiHeader}>
        <h2 className={styles.aiTitle}>
          <div className={styles.aiIcon}>
            <FaRobot />
          </div>
          AI Web Development Assistant
        </h2>
        <p className={styles.aiSubtitle}>
          Ask me anything about web development! Get instant answers powered by AI.
        </p>
      </div>

      <div className={styles.aiContent}>
        <div className={styles.aiLeft}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="category" style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', display: 'block' }}>
              Category:
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
              disabled={loading}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <label htmlFor="question" style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', display: 'block' }}>
              Your Question:
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a web development question... (e.g., How do I use React hooks?)"
                className={styles.questionInput}
                rows="3"
                maxLength="500"
                disabled={loading}
              />
              {question && (
                <button
                  type="button"
                  onClick={clearQuestion}
                  className={styles.clearButton}
                  disabled={loading}
                  title="Clear"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <button
              type="submit"
              className={styles.askButton}
              disabled={!question.trim() || loading}
            >
              {loading ? (
                <span className={styles.loadingAnim}>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  AI is thinking...
                </span>
              ) : (
                <>
                  <FaLightbulb />
                  Ask AI
                </>
              )}
            </button>
          </form>

          <div className={styles.sampleQuestions}>
            <div className={styles.sampleTitle}>💡 Try asking about:</div>
            <div className={styles.sampleGrid}>
              {sampleQuestions.map((sampleQuestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuestion(sampleQuestion)}
                  className={styles.sampleButton}
                  disabled={loading}
                >
                  {sampleQuestion}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.aiRight}>
          {showAnswer && answer && (
            <div className={styles.aiAnswer}>
              <div className={styles.answerHeader}>
                <h4 className={styles.answerTitle}>AI Response</h4>
                <span className={styles.answerSource}>Powered by AI</span>
              </div>
              <button
                className={styles.copyButton}
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
                aria-label="Copy answer"
                type="button"
              >
                {copied ? <FaCheck /> : <FaRegCopy />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <div
                className={styles.answerText}
                dangerouslySetInnerHTML={{
                  __html: answer
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/\n/g, '<br>')
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AI; 