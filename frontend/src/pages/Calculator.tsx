import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Log {
  id: string;
  category: string;
  subCategory: string;
  value: number;
  unit: string;
  co2EquivalentKg: number;
  loggedAt: string;
}

export const CarbonCalculator: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Input form state
  const [category, setCategory] = useState<string>('transportation');
  const [subCategory, setSubCategory] = useState<string>('car');
  const [value, setValue] = useState<number>(10);
  const [estimate, setEstimate] = useState<number>(1.8); // 10km * 0.18
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Local constants for real-time calculator preview
  const SUB_OPTIONS: Record<string, { label: string; value: string; factor: number; unit: string }[]> = {
    transportation: [
      { label: 'Private Gasoline Car (km)', value: 'car', factor: 0.18, unit: 'km' },
      { label: 'City Transit Bus (km)', value: 'bus', factor: 0.08, unit: 'km' },
      { label: 'Electric Subway / Metro (km)', value: 'metro', factor: 0.03, unit: 'km' },
      { label: 'Passenger Train (km)', value: 'train', factor: 0.04, unit: 'km' },
      { label: 'Commercial Airline Flight (km)', value: 'flight', factor: 0.25, unit: 'km' }
    ],
    energy: [
      { label: 'Grid Electricity (kWh)', value: 'electricity', factor: 0.45, unit: 'kWh' },
      { label: 'LPG Gas Bottle (kg)', value: 'lpg', factor: 1.51, unit: 'kg' },
      { label: 'Renewable Energy (Solar/Wind) (kWh)', value: 'renewable', factor: 0.02, unit: 'kWh' }
    ],
    food: [
      { label: 'Vegan Meal (qty)', value: 'vegan', factor: 1.5, unit: 'meal' },
      { label: 'Vegetarian Meal (qty)', value: 'vegetarian', factor: 2.5, unit: 'meal' },
      { label: 'Meat-containing Non-Veg Meal (qty)', value: 'non_vegetarian', factor: 7.2, unit: 'meal' }
    ],
    waste: [
      { label: 'Landfill Plastic Waste (kg)', value: 'plastic', factor: 2.0, unit: 'kg' },
      { label: 'Organic Composting Waste (kg)', value: 'organic', factor: 0.5, unit: 'kg' },
      { label: 'Recyclable Paper/Glass (kg)', value: 'recyclable', factor: 0.1, unit: 'kg' }
    ],
    water: [
      { label: 'Tap Water Consumed (liters)', value: 'tap_water', factor: 0.0003, unit: 'liter' }
    ]
  };

  const loadLogs = async () => {
    try {
      const data = await ApiService.get('/carbon/logs', token!);
      setLogs(data);
    } catch (e: any) {
      console.error('Logs fetching error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadLogs();
  }, [token]);

  // Update dropdown options and value defaults when category shifts
  useEffect(() => {
    const defaultSub = SUB_OPTIONS[category][0];
    setSubCategory(defaultSub.value);
    const defaultVal = category === 'water' ? 200 : category === 'food' ? 1 : 15;
    setValue(defaultVal);
    setEstimate(parseFloat((defaultVal * defaultSub.factor).toFixed(3)));
  }, [category]);

  // Update real-time calculator preview
  const handleValueChange = (newVal: number) => {
    setValue(newVal);
    const factor = SUB_OPTIONS[category].find(opt => opt.value === subCategory)?.factor || 0;
    setEstimate(parseFloat((newVal * factor).toFixed(3)));
  };

  const handleSubChange = (newSub: string) => {
    setSubCategory(newSub);
    const factor = SUB_OPTIONS[category].find(opt => opt.value === newSub)?.factor || 0;
    setEstimate(parseFloat((value * factor).toFixed(3)));
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const log = await ApiService.post('/carbon/log', {
        category,
        subCategory,
        value
      }, token!);
      
      setLogs([log, ...logs]);
      setSuccess(`Success! Logged ${estimate}kg of CO₂ equivalent in ${subCategory}.`);
      
      // Reset defaults
      setValue(category === 'water' ? 200 : category === 'food' ? 1 : 10);
    } catch (err: any) {
      setError(err.message || 'Failed to submit carbon entry');
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this carbon entry?')) return;
    try {
      await ApiService.delete(`/carbon/logs/${id}`, token!);
      setLogs(logs.filter(l => l.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Carbon Calculator</h1>
      <p style={{ marginBottom: '30px' }}>Log daily consumption habits. Watch the emissions equivalent update in real-time before saving to history.</p>

      <div className="grid-2" style={{ marginBottom: '40px' }}>
        {/* Logger Entry Panel */}
        <div className="glass-card">
          <h2>New Carbon Entry</h2>
          
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

          <form onSubmit={handleLogSubmit}>
            <div className="form-group">
              <label className="form-label">Emission Category</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['transportation', 'energy', 'food', 'waste', 'water'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, textTransform: 'capitalize', padding: '10px', fontSize: '0.85rem' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Category Details</label>
              <select
                className="form-control"
                value={subCategory}
                onChange={(e) => handleSubChange(e.target.value)}
              >
                {SUB_OPTIONS[category].map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Quantity Amount</label>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {value} {SUB_OPTIONS[category].find(opt => opt.value === subCategory)?.unit}
                </span>
              </div>
              <input
                type="range"
                min={category === 'food' ? 1 : 1}
                max={category === 'water' ? 1000 : category === 'transportation' ? 500 : 100}
                className="form-control"
                style={{ height: '6px', padding: 0 }}
                value={value}
                onChange={(e) => handleValueChange(parseFloat(e.target.value))}
              />
              <input
                type="number"
                min="0.001"
                step="any"
                className="form-control"
                style={{ marginTop: '12px' }}
                value={value}
                onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Save Carbon Log
            </button>
          </form>
        </div>

        {/* Real-time Math Preview Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', border: '1px dashed var(--primary)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Environmental Impact Estimate</span>
          
          <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--primary)', textShadow: '0 0 15px var(--primary-glow)', margin: '15px 0' }}>
            {estimate}
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>kg CO₂ equivalent</span>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '300px' }}>
            Based on conversion factor of {SUB_OPTIONS[category].find(opt => opt.value === subCategory)?.factor} kg CO₂ per unit, supplied by global IPCC regulatory bodies.
          </p>
        </div>
      </div>

      {/* Audit History Logs */}
      <div className="glass-card">
        <h2>Your Emissions Journal</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Audited historical carbon footprint logs entered on this system.</p>

        {loading ? (
          <p>Loading entries...</p>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No logged footprints recorded yet. Log your first action above!
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Activity Type</th>
                  <th>Quantity</th>
                  <th>Footprint (kg CO₂)</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="animate-fade-in">
                    <td>
                      <span className={`badge-tag badge-${log.category}`} style={{ textTransform: 'capitalize' }}>
                        {log.category}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{log.subCategory.replace('_', ' ')}</td>
                    <td>{log.value} {log.unit}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.co2EquivalentKg.toFixed(2)} kg</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(log.loggedAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
