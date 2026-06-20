import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AnalyticsData {
  sustainabilityScore: number;
  totalEmissionsKg: number;
  byCategory: {
    transportation: number;
    energy: number;
    food: number;
    waste: number;
    water: number;
  };
  recentLogs: any[];
  weeklyTrend: { day: string; co2: number }[];
  historicalComparisons: { month: string; co2: number }[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCo2ReductionKg: number;
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  costSavingsEst: number;
}

export const UserDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  useEffect(() => {
    if (sessionStorage.getItem('just_logged_in') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('just_logged_in');
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation':
        return (
          <svg className="animated-icon" style={{ width: '16px', height: '16px', stroke: 'var(--accent)', fill: 'none', marginRight: '8px' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        );
      case 'energy':
        return (
          <svg className="animated-icon" style={{ width: '16px', height: '16px', stroke: 'var(--warning)', fill: 'none', marginRight: '8px' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case 'food':
        return (
          <svg className="animated-icon" style={{ width: '16px', height: '16px', stroke: 'var(--primary)', fill: 'none', marginRight: '8px' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'waste':
        return (
          <svg className="animated-icon" style={{ width: '16px', height: '16px', stroke: 'var(--danger)', fill: 'none', marginRight: '8px' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
          </svg>
        );
      case 'water':
        return (
          <svg className="animated-icon" style={{ width: '16px', height: '16px', stroke: 'var(--secondary)', fill: 'none', marginRight: '8px' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboard = await ApiService.get('/analytics/dashboard', token!);
        const recommendations = await ApiService.get('/recommendations', token!);
        setData(dashboard);
        setRecs(recommendations);
      } catch (e: any) {
        setErr(e.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Analyzing carbon logs and updating intelligence models...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h3>Error loading Dashboard</h3>
        <p>{err}</p>
      </div>
    );
  }

  const categoryTotals = data ? data.byCategory : { transportation: 0, energy: 0, food: 0, waste: 0, water: 0 };
  const totalCategoryVal = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  // Custom SVG Chart parameters
  const maxWeeklyCo2 = data ? Math.max(...data.weeklyTrend.map(d => d.co2), 10) : 10;
  
  // Dynamic Score color
  const getScoreColor = (score: number) => {
    if (score < 40) return 'var(--danger)';
    if (score < 75) return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div className="animate-fade-in">
      {/* Session Welcome Alert Banner */}
      {showWelcome && (
        <div className="welcome-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>🌱</span>
            <div>
              <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>Welcome to EcoTrack AI, {user?.firstName}!</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Your decentralized session is secure. Your real-time carbon profile and personalized AI challenges are loaded. Let's make an impact today!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="topbar">
        <div>
          <h1>Sustainability Hub</h1>
          <p>Welcome back, {user?.firstName}! Here is your current carbon profile and AI recommendations.</p>
        </div>
        <div className="user-badge">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.role} PORTAL</span>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="metric-grid">
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="metric-title" style={{ marginBottom: 0 }}>Tracked Emissions</div>
            <svg className="animated-icon" style={{ width: '20px', height: '20px', stroke: 'var(--primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="metric-value">{data?.totalEmissionsKg.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kg CO₂</span></div>
          <div className="metric-sub">Total logged footprint</div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="metric-title" style={{ marginBottom: 0 }}>Sustainability Score</div>
            <svg className="animated-icon" style={{ width: '20px', height: '20px', stroke: 'var(--primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z" />
              <path d="M19 2v10" />
            </svg>
          </div>
          <div className="metric-value" style={{ color: getScoreColor(data?.sustainabilityScore || 0) }}>
            {data?.sustainabilityScore}
          </div>
          <div className="metric-sub">Dynamic rating (0-100)</div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="metric-title" style={{ marginBottom: 0 }}>Highest Driver</div>
            <svg className="animated-icon" style={{ width: '20px', height: '20px', stroke: 'var(--warning)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div className="metric-value" style={{ textTransform: 'capitalize', fontSize: '1.5rem', marginTop: '4px' }}>
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
          </div>
          <div className="metric-sub">Priority target reduction</div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="metric-title" style={{ marginBottom: 0 }}>AI Actions Available</div>
            <svg className="animated-icon" style={{ width: '20px', height: '20px', stroke: 'var(--secondary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          </div>
          <div className="metric-value">{recs.length}</div>
          <div className="metric-sub">Tailored to your log behaviors</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '40px' }}>
        {/* Score Ring Gauge */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3>Eco Score Gauge</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Based on recent tracking habits</p>
          
          <div className="sustainability-ring">
            {/* SVG Circle Gauge */}
            <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`Sustainability score gauge: ${data?.sustainabilityScore} out of 100`}>
              <title>Sustainability score progress ring</title>
              <circle
                cx="75"
                cy="75"
                r="65"
                fill="none"
                stroke="var(--bg-input)"
                strokeWidth="10"
              />
              <circle
                cx="75"
                cy="75"
                r="65"
                fill="none"
                stroke={getScoreColor(data?.sustainabilityScore || 0)}
                strokeWidth="10"
                strokeDasharray="408.4"
                strokeDashoffset={408.4 - (408.4 * (data?.sustainabilityScore || 0)) / 100}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="sustainability-number">{data?.sustainabilityScore}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of 100</span>
            </div>
          </div>
          <span className="badge-tag" style={{
            backgroundColor: `${getScoreColor(data?.sustainabilityScore || 0)}20`,
            color: getScoreColor(data?.sustainabilityScore || 0),
            padding: '6px 12px',
            fontSize: '0.85rem'
          }}>
            {(data?.sustainabilityScore || 0) > 75 ? 'Excellent Eco Habits' : (data?.sustainabilityScore || 0) > 40 ? 'Moderate Impact' : 'High Footprint Warning'}
          </span>
        </div>

        {/* Weekly Trend SVG Graph */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h3>Weekly CO₂ Trend</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>Daily carbon footprint values in kg CO₂ equivalent</p>
          
          <div className="chart-container">
            {data?.weeklyTrend.map((t, idx) => {
              // Calculate percent height for SVG columns
              const pct = Math.max(5, (t.co2 / maxWeeklyCo2) * 100);
              return (
                <div key={idx} className="bar-column" role="img" aria-label={`Emissions on ${t.day}: ${t.co2.toFixed(1)} kg CO2`}>
                  <div 
                    className="bar-graphic" 
                    style={{ height: `${pct}%` }} 
                    data-value={t.co2.toFixed(1)}
                  />
                  <span className="bar-label" aria-hidden="true">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Category breakdown progress lines */}
        <div className="glass-card">
          <h2>Emissions breakdown by Category</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Analyze where your primary emissions come from</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(categoryTotals).map(([cat, val]) => {
              const pct = parseFloat(((val / totalCategoryVal) * 100).toFixed(1));
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', textTransform: 'capitalize' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getCategoryIcon(cat)}
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{val.toFixed(1)} kg ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: '4px',
                      backgroundColor: `var(--accent)`,
                      backgroundImage: `linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)`
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic AI Recommendation engine view */}
        <div className="glass-card">
          <h2>Personalized AI Actions</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Derived by carbon intelligence model for your logs</p>

          <div className="rec-grid">
            {recs.slice(0, 3).map((rec) => (
              <div key={rec.id} className="rec-card animate-fade-in">
                <div className="rec-info">
                  <span className={`badge-tag badge-${rec.category}`} style={{ width: 'fit-content', textTransform: 'capitalize' }}>
                    {rec.category}
                  </span>
                  <h4 style={{ margin: '6px 0 2px 0', fontSize: '0.95rem' }}>{rec.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.description}</p>
                  <div className="rec-meta">
                    <span style={{ color: rec.impactLevel === 'HIGH' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      🔥 {rec.impactLevel} Impact
                    </span>
                    <span>⚡ {rec.difficulty}</span>
                    <span style={{ color: 'var(--secondary)' }}>💵 Est Savings: ${rec.costSavingsEst}/mo</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', paddingLeft: '15px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    -{rec.estimatedCo2ReductionKg}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kg CO₂ / mo</div>
                </div>
              </div>
            ))}

            {recs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                No active recommendations. Keep tracking carbon entries to trigger the AI engine!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
