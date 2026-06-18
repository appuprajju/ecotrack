import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';

interface Motive {
  key: string;
  title: string;
  subtitle: string;
  quote: string;
  author: string;
  description: string;
  tips: string[];
  color: string;
  icon: React.ReactNode;
}

export const UserProfile: React.FC = () => {
  const { token, user } = useAuth();
  const [highestCategory, setHighestCategory] = useState<string>('general');
  const [selectedMotive, setSelectedMotive] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Define the motivational profiles with premium SVG icons
  const motives: Motive[] = [
    {
      key: 'forestry',
      title: 'Forestry & Land Restoration',
      subtitle: 'Nature-Based Sequestration',
      quote: "To live, man must rest, but to rest he must plant.",
      author: "IPCC Conservation Guild",
      description: "Your primary interest lies in preserving biodiverse carbon sinks, offsetting residual emissions through native tree planting, and supporting local rewilding projects.",
      tips: [
        "Participate in local tree planting and afforestation events.",
        "Choose certified carbon offset projects that focus on forest protection.",
        "Minimize paper/wood waste and support sustainably sourced timber products."
      ],
      color: 'var(--primary)',
      icon: (
        <svg style={{ width: '36px', height: '36px', stroke: 'var(--primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M12 2L19 12H15V22H9V12H5L12 2z" />
          <path d="M12 12V22" />
        </svg>
      )
    },
    {
      key: 'mobility',
      title: 'Sustainable Urban Mobility',
      subtitle: 'Low-Carbon Commuter',
      quote: "A developed country is not a place where the poor have cars. It is where the rich use public transportation.",
      author: "Gustavo Petro",
      description: "You focus on changing how you move. Swapping high-emission passenger vehicle travel for active transit, rail, carpools, and electric micro-mobility is your key path.",
      tips: [
        "Commit to walking, biking, or skating for all commutes under 2 kilometers.",
        "Advocate for municipal public transit improvements and active bike lanes.",
        "When driving is required, prioritize carsharing or high-efficiency electric vehicles."
      ],
      color: 'var(--accent)',
      icon: (
        <svg style={{ width: '36px', height: '36px', stroke: 'var(--accent)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.5">
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
          <path d="M3 17.5l2-10h11l2 5h3v5h-2.5" />
          <path d="M5.5 17.5h10.5" />
          <path d="M14 7.5L12 12.5" />
        </svg>
      )
    },
    {
      key: 'energy',
      title: 'Clean Energy & Smart Grid',
      subtitle: 'Residential Decarbonizer',
      quote: "The future is clean energy, home solar efficiency, and smart grid automation.",
      author: "EcoTech Laboratory",
      description: "You aim to clean up the energy feeding your home and devices. This includes switching utility programs to renewables, upgrading insulation, and reducing base loads.",
      tips: [
        "Unplug vampire electronics and install smart power strips to cut passive load.",
        "Transition home lighting to energy-efficient LEDs and program your thermostat.",
        "Inquire with your utility company about purchasing green/renewable-sourced power."
      ],
      color: 'var(--warning)',
      icon: (
        <svg style={{ width: '36px', height: '36px', stroke: 'var(--warning)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    },
    {
      key: 'circularity',
      title: 'Circular Zero-Waste Economy',
      subtitle: 'Zero Waste Advocate',
      quote: "Refuse what you do not need; reduce what you do; reuse what you can; recycle what you cannot.",
      author: "Bea Johnson",
      description: "You focus on waste reduction, eliminating single-use plastics, and adopting composting, upcycling, and local sorting to achieve zero trash output.",
      tips: [
        "Eliminate single-use plastic bags, cups, and food packaging from your daily routine.",
        "Set up a kitchen composting system to divert organic waste from local landfills.",
        "Upcycle broken or old goods rather than replacing them with raw newly manufactured ones."
      ],
      color: 'var(--danger)',
      icon: (
        <svg style={{ width: '36px', height: '36px', stroke: 'var(--danger)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
        </svg>
      )
    },
    {
      key: 'aquatic',
      title: 'Aquatic Ecosystem Stewardship',
      subtitle: 'Water Conservationist',
      quote: "Water is the driving force of all nature.",
      author: "Leonardo da Vinci",
      description: "You prioritize aquatic ecology, reducing personal indoor/outdoor water use, protecting watersheds, and combatting ocean plastic accumulation.",
      tips: [
        "Install low-flow aerators on showerheads and faucets to cut water use in half.",
        "Never wash chemicals down household drains and use biodegradable soaps.",
        "Participate in local beach, river, or watershed debris cleanup campaigns."
      ],
      color: 'var(--secondary)',
      icon: (
        <svg style={{ width: '36px', height: '36px', stroke: 'var(--secondary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const fetchEmissionsData = async () => {
      try {
        const dashboard = await ApiService.get('/analytics/dashboard', token!);
        if (dashboard && dashboard.byCategory) {
          // Find the category with the highest value
          const entries = Object.entries(dashboard.byCategory) as [string, number][];
          const sorted = entries.sort((a, b) => b[1] - a[1]);
          const topCategory = sorted[0]?.[0];
          
          if (topCategory) {
            setHighestCategory(topCategory);
            
            // Map the emission category to a default motive
            const defaultMotiveMap: Record<string, string> = {
              transportation: 'mobility',
              energy: 'energy',
              food: 'forestry', // food relates to land/offset
              waste: 'circularity',
              water: 'aquatic'
            };
            
            // Set motive if not already overridden in localStorage
            const localSaved = localStorage.getItem(`ecotrack_motive_${user?.id}`);
            if (localSaved) {
              setSelectedMotive(localSaved);
            } else {
              setSelectedMotive(defaultMotiveMap[topCategory] || 'forestry');
            }
          }
        }
      } catch (e) {
        console.error('Failed to load user analytics for profile dynamic motive:', e);
        // Fallback to local storage or standard default
        const localSaved = localStorage.getItem(`ecotrack_motive_${user?.id}`);
        setSelectedMotive(localSaved || 'forestry');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEmissionsData();
    }
  }, [token, user?.id]);

  const handleMotiveChange = (key: string) => {
    setSelectedMotive(key);
    localStorage.setItem(`ecotrack_motive_${user?.id}`, key);
  };

  const activeMotive = motives.find(m => m.key === selectedMotive) || motives[0];

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>User Settings & Profile</h1>
          <p>Manage your account settings, secure session information, and project motives.</p>
        </div>
        <div className="user-badge">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.role} ACCOUNT</span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Profile Details Card */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <h3>Personal Details</h3>
          <p style={{ fontSize: '0.8rem', marginBottom: '24px' }}>Secure credentials database records</p>
          
          <div className="profile-header-card">
            <div className="profile-avatar">
              {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{user?.firstName} {user?.lastName}</h2>
              <span className="badge-tag" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                🛡️ {user?.role} Mode
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.email}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Region / Country</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.country || 'United States'}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Decentralized Node Identifier</span>
              <code style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>node-usr-{user?.id?.substring(0, 8)}</code>
            </div>
          </div>
        </div>

        {/* Selected Project Motive Card */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3>Active Project Motive</h3>
              <p style={{ fontSize: '0.8rem' }}>How your tracker visualizes and interprets climate action</p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)'
            }}>
              {activeMotive.icon}
            </div>
          </div>

          {loading ? (
            <p>Evaluating carbon profile motives...</p>
          ) : (
            <div className="animate-fade-in">
              <span className="badge-tag" style={{
                backgroundColor: `${activeMotive.color}18`,
                color: activeMotive.color,
                marginBottom: '16px',
                fontSize: '0.8rem',
                border: `1px solid ${activeMotive.color}35`
              }}>
                🎯 Focus: {activeMotive.title}
              </span>

              {/* Climate Quote */}
              <blockquote style={{
                borderLeft: `3px solid ${activeMotive.color}`,
                paddingLeft: '16px',
                margin: '16px 0',
                fontStyle: 'italic',
                color: 'var(--text-primary)'
              }}>
                "{activeMotive.quote}"
                <cite style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'normal' }}>
                  — {activeMotive.author}
                </cite>
              </blockquote>

              <p style={{ fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>{activeMotive.description}</p>
              
              <h4 style={{ fontSize: '0.9rem', color: activeMotive.color, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Local Actions</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeMotive.tips.map((tip, idx) => (
                  <li key={idx} style={{ lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Motivation Selector */}
      <div className="glass-card">
        <h3>Customize your Climate Focus</h3>
        <p style={{ fontSize: '0.8rem' }}>
          Select your primary environmental motive. The intelligence engine will tailor advice to this area. 
          {highestCategory !== 'general' && (
            <span style={{ color: 'var(--primary)', marginLeft: '6px' }}>
              (Note: based on your highest logged footprint category, your dynamic matching profile is <strong>{highestCategory}</strong>).
            </span>
          )}
        </p>

        <div className="motive-selection-grid">
          {motives.map((m) => {
            const isActive = m.key === selectedMotive;
            return (
              <div
                key={m.key}
                onClick={() => handleMotiveChange(m.key)}
                className={`motive-option-card ${isActive ? 'active' : ''}`}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? `${m.color}15` : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  marginTop: '2px'
                }}>
                  {m.icon}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: isActive ? m.color : 'var(--text-primary)' }}>
                    {m.title}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    {m.subtitle}
                  </span>
                  <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                    {m.description.substring(0, 110)}...
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
