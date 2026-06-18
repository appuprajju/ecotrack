import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Article {
  id: string;
  title: string;
  contentType: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
}

export const LearningHub: React.FC = () => {
  const { token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await ApiService.get('/content', token!);
        setArticles(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) loadContent();
  }, [token]);

  const categories = ['all', 'general', 'food', 'transportation', 'energy'];

  const filteredArticles = filterCategory === 'all'
    ? articles
    : articles.filter(a => a.category === filterCategory);

  return (
    <div className="animate-fade-in">
      <h1>Learning Hub</h1>
      <p style={{ marginBottom: '30px' }}>Educate yourself on carbon metrics, climate offsets, and simple daily practices for conservation.</p>

      {/* Categories Filter tab */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '6px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading library modules...</p>
      ) : filteredArticles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No content found under this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredArticles.map(a => (
            <div key={a.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge-tag badge-${a.category}`} style={{ textTransform: 'capitalize' }}>
                  {a.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  By {a.authorName} • {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#ffffff' }}>{a.title}</h2>
              <div style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap'
              }}>
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
