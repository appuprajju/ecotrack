import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';


interface Goal {
  id: string;
  title: string;
  category: string;
  targetCo2Kg: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  prediction?: {
    projectedEndEmissionsKg: number;
    successProbability: number;
    recommendation: string;
  };
}

export const GoalsTracker: React.FC = () => {
  const { token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create Goal State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('total');
  const [targetCo2, setTargetCo2] = useState<string>('150');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const loadGoals = async () => {
    try {
      const data = await ApiService.get('/goals', token!);
      setGoals(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadGoals();
  }, [token]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const goal = await ApiService.post('/goals', {
        title,
        category,
        targetCo2Kg: parseFloat(targetCo2),
        startDate,
        endDate
      }, token!);

      setGoals([...goals, goal]);
      setSuccess(`Goal "${title}" successfully set!`);
      
      // Reset
      setTitle('');
      setTargetCo2('150');
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'COMPLETED' | 'FAILED') => {
    try {
      const updated = await ApiService.patch(`/goals/${id}/status`, { status: newStatus }, token!);
      setGoals(goals.map(g => g.id === id ? { ...g, status: updated.status } : g));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getProbColor = (p: number) => {
    if (p < 0.4) return 'var(--danger)';
    if (p < 0.7) return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div className="animate-fade-in">
      <h1>Carbon Reduction Goals</h1>
      <p style={{ marginBottom: '30px' }}>Establish limits, track target metrics, and inspect dynamic AI success projections based on real-time logging rate.</p>

      <div className="grid-3" style={{ alignItems: 'start', marginBottom: '40px' }}>
        {/* Set New Goal Card */}
        <div className="glass-card" style={{ gridColumn: isMobile ? '1 / -1' : 'span 1' }}>
          <h2>Set Sustainability Target</h2>
          
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--primary)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleCreateGoal}>
            <div className="form-group">
              <label htmlFor="goal-title" className="form-label">Goal Title</label>
              <input
                id="goal-title"
                type="text"
                required
                className="form-control"
                placeholder="e.g. June Commute Reductions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-category" className="form-label">Target Category</label>
              <select
                id="goal-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="total">Total Footprint (All)</option>
                <option value="transportation">Transportation Only</option>
                <option value="energy">Home Energy Only</option>
                <option value="food">Dietary Only</option>
                <option value="waste">Waste Management Only</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-threshold" className="form-label">CO₂ Limit Threshold (kg)</label>
              <input
                id="goal-threshold"
                type="number"
                required
                min="1"
                className="form-control"
                value={targetCo2}
                onChange={(e) => setTargetCo2(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-start-date" className="form-label">Start Date</label>
              <input
                id="goal-start-date"
                type="date"
                required
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-end-date" className="form-label">End Date</label>
              <input
                id="goal-end-date"
                type="date"
                required
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Initialize Goal
            </button>
          </form>
        </div>

        {/* Goals List Panel */}
        <div className="glass-card" style={{ gridColumn: isMobile ? '1 / -1' : 'span 2' }}>
          <h2>Current Goal Tracks</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Active goals query the AI Engine to calculate completion odds.</p>

          {loading ? (
            <p>Loading goals database...</p>
          ) : goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No goals configured yet. Establish your first carbon limit target on the panel!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {goals.map((g) => (
                <div key={g.id} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${g.status === 'ACTIVE' ? 'var(--accent)' : g.status === 'COMPLETED' ? 'var(--success)' : 'var(--danger)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{g.title}</h3>
                      <span className="badge-tag badge-transportation" style={{ marginTop: '4px', textTransform: 'capitalize' }}>
                        {g.category}
                      </span>
                    </div>
                    <span className="badge-tag" style={{
                      backgroundColor: g.status === 'ACTIVE' ? 'rgba(99, 102, 241, 0.1)' : g.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: g.status === 'ACTIVE' ? 'var(--accent)' : g.status === 'COMPLETED' ? 'var(--success)' : 'var(--danger)',
                      flexShrink: 0
                    }}>
                      {g.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>Limit: <strong>{g.targetCo2Kg} kg CO₂</strong></span>
                    <span style={{ fontSize: '0.8rem' }}>📅 {new Date(g.startDate).toLocaleDateString()} → {new Date(g.endDate).toLocaleDateString()}</span>
                  </div>

                  {/* AI success model indicator */}
                  {g.status === 'ACTIVE' && g.prediction && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🤖 CARBON INTELLIGENCE FORECAST</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getProbColor(g.prediction.successProbability) }}>
                          Success Probability: {(g.prediction.successProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Success bar */}
                      <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{
                          height: '100%',
                          width: `${g.prediction.successProbability * 100}%`,
                          backgroundColor: getProbColor(g.prediction.successProbability)
                        }}></div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                        &ldquo;{g.prediction.recommendation}&rdquo;
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Current Rate Projection: <strong>{g.prediction.projectedEndEmissionsKg} kg</strong> at end date.
                      </div>
                    </div>
                  )}

                  {/* Manual trigger for achievements */}
                  {g.status === 'ACTIVE' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleUpdateStatus(g.id, 'COMPLETED')}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(g.id, 'FAILED')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Mark Failed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
