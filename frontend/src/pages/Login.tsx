import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [country, setCountry] = useState<string>('United States');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        await login(email, password);
        sessionStorage.setItem('just_logged_in', 'true');
      } else {
        await register(email, password, firstName, lastName, country);
        setMessage('Welcome to the EcoTrack family! 🎉 Your account has been created successfully. You can now sign in using your credentials.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  // Generate floating eco-leaves particles
  const floatingLeaves = Array.from({ length: 15 }).map((_, idx) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = 12 + Math.random() * 12;
    const size = 12 + Math.random() * 16;
    return (
      <svg
        key={idx}
        className="floating-particle"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z" />
      </svg>
    );
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 10% 20%, rgba(12, 17, 34, 1) 0%, rgba(5, 7, 16, 1) 90%)'
    }}>
      {/* Floating Background Particles */}
      <div className="floating-bg">
        {floatingLeaves}
      </div>

      <div className="animated-card-border-wrap animate-fade-in" style={{ width: '100%', maxWidth: '440px', zIndex: 2 }}>
        <div className="glass-card" style={{ width: '100%', border: 'none', borderRadius: '15px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              marginBottom: '16px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }} className="animated-icon">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z" />
                <path d="M19 2v10" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(135deg, #ffffff 40%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EcoTrack AI</h2>
            <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Decentralized Carbon Intelligence Platform</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', padding: '4px', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`btn ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`btn ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
            >
              Register
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--primary)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Region / Country</label>
                <select
                  className="form-control"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="India">India</option>
                  <option value="Global">Global / Other</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {isLogin ? 'Sign In to Account' : 'Create Free Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            By continuing, you agree to EcoTrack's Terms of Service and Privacy Policy. Secure SSL encrypted environment.
          </div>
        </div>
      </div>
    </div>
  );
};
