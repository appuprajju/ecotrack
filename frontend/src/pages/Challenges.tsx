import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  co2SavingsEstKg: number;
  points: number;
  startDate: string;
  endDate: string;
}

interface UserChallenge {
  challengeId: string;
  status: 'JOINED' | 'COMPLETED';
}

export const ChallengesPortal: React.FC = () => {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pointsTotal, setPointsTotal] = useState<number>(0);

  const loadChallenges = async () => {
    try {
      const all = await ApiService.get('/challenges', token!);
      const joined = await ApiService.get('/challenges/user', token!);
      setChallenges(all);
      setUserChallenges(joined);

      // Sum points for completed challenges
      const sumPoints = joined
        .filter((uc: any) => uc.status === 'COMPLETED')
        .reduce((sum: number, uc: any) => sum + uc.challenge.points, 0);
      setPointsTotal(sumPoints);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadChallenges();
  }, [token]);

  const handleJoin = async (challengeId: string) => {
    try {
      await ApiService.post('/challenges/join', { challengeId }, token!);
      setUserChallenges([...userChallenges, { challengeId, status: 'JOINED' }]);
    } catch (err: any) {
      alert(err.message || 'Failed to join challenge');
    }
  };

  const handleComplete = async (challengeId: string) => {
    try {
      await ApiService.post('/challenges/complete', { challengeId }, token!);
      
      setUserChallenges(userChallenges.map(uc => 
        uc.challengeId === challengeId ? { ...uc, status: 'COMPLETED' as const } : uc
      ));
      
      // Add points
      const chal = challenges.find(c => c.id === challengeId);
      if (chal) {
        setPointsTotal(prev => prev + chal.points);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete challenge');
    }
  };

  const isJoined = (id: string) => userChallenges.some(uc => uc.challengeId === id);
  const isCompleted = (id: string) => userChallenges.some(uc => uc.challengeId === id && uc.status === 'COMPLETED');

  return (
    <div className="animate-fade-in">
      <div className="challenges-header">
        <div>
          <h1>Eco Challenges</h1>
          <p>Commit to clean living goals, reduce real-world emissions, and gain eco credits.</p>
        </div>
        
        {/* Points Display Badge */}
        <div className="glass-card" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--primary)', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ECO CREDITS</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{pointsTotal} pts</span>
        </div>
      </div>

      {loading ? (
        <p>Loading active campaigns...</p>
      ) : (
        <div className="grid-2">
          {challenges.map((c) => {
            const joined = isJoined(c.id);
            const completed = isCompleted(c.id);

            return (
              <div key={c.id} className="glass-card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: completed ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: completed ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-card)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className={`badge-tag badge-${c.category}`} style={{ textTransform: 'capitalize' }}>
                      {c.category}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                      💎 {c.points} Eco Points
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>{c.description}</p>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', gap: '15px' }}>
                    <span>Est Savings: <strong>-{c.co2SavingsEstKg} kg CO₂</strong></span>
                    <span>Ends: {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  {completed ? (
                    <button className="btn btn-secondary" disabled style={{ width: '100%', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                      Completed ✓
                    </button>
                  ) : joined ? (
                    <button onClick={() => handleComplete(c.id)} className="btn btn-primary" style={{ width: '100%' }}>
                      Finish & Claim Credits
                    </button>
                  ) : (
                    <button onClick={() => handleJoin(c.id)} className="btn btn-secondary" style={{ width: '100%' }}>
                      Join Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
