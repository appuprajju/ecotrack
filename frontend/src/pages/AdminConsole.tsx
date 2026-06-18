import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  country: string;
  createdAt: string;
}

interface Factor {
  id: string;
  category: string;
  subCategory: string;
  factor: number;
  unit: string;
  source: string;
}

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  user?: {
    email: string;
  } | null;
}

export const AdminConsole: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'factors' | 'users' | 'audit'>('factors');
  const [users, setUsers] = useState<User[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Factor edit form state
  const [editSubCategory, setEditSubCategory] = useState<string | null>(null);
  const [factorVal, setFactorVal] = useState<number>(0);
  const [unitVal, setUnitVal] = useState<string>('');
  const [sourceVal, setSourceVal] = useState<string>('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'factors') {
        const data = await ApiService.get('/admin/emission-factors', token!);
        setFactors(data);
      } else if (activeTab === 'users') {
        const data = await ApiService.get('/admin/users', token!);
        setUsers(data);
      } else if (activeTab === 'audit') {
        const data = await ApiService.get('/admin/audit-logs', token!);
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Failed to load admin module:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [token, activeTab]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)', marginTop: '40px' }}>
        <h3>Access Restricted</h3>
        <p>This panel is only accessible by platform administrators. Unauthorized attempts are logged.</p>
      </div>
    );
  }

  const startEdit = (f: Factor) => {
    setEditSubCategory(f.subCategory);
    setFactorVal(f.factor);
    setUnitVal(f.unit);
    setSourceVal(f.source);
  };

  const handleUpdateFactor = async (subCategory: string) => {
    try {
      const updated = await ApiService.patch(`/admin/emission-factors/${subCategory}`, {
        factor: factorVal,
        unit: unitVal,
        source: sourceVal
      }, token!);

      setFactors(factors.map(f => f.subCategory === subCategory ? updated : f));
      setEditSubCategory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update factor');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Admin Console</h1>
      <p style={{ marginBottom: '30px' }}>Manage system constants, inspect audit activity log registers, and coordinate registered profiles.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('factors')}
          className={`btn ${activeTab === 'factors' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          Emission Factors
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          Registered Users
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          System Audit Trail
        </button>
      </div>

      {loading ? (
        <p>Retrieving database registries...</p>
      ) : (
        <div className="glass-card">
          {/* FACTORS TAB */}
          {activeTab === 'factors' && (
            <div>
              <h2>Emission Factors Management</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Standard conversions used to map activity metrics into CO₂ equivalents.</p>
              
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Sub-Category</th>
                      <th>Factor (kg CO₂/unit)</th>
                      <th>Unit</th>
                      <th>Source</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map(f => {
                      const editing = editSubCategory === f.subCategory;
                      return (
                        <tr key={f.id}>
                          <td><span className={`badge-tag badge-${f.category}`} style={{ textTransform: 'capitalize' }}>{f.category}</span></td>
                          <td style={{ fontWeight: 600 }}>{f.subCategory}</td>
                          <td>
                            {editing ? (
                              <input
                                type="number"
                                step="any"
                                className="form-control"
                                style={{ width: '100px', padding: '6px' }}
                                value={factorVal}
                                onChange={(e) => setFactorVal(parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              f.factor
                            )}
                          </td>
                          <td>
                            {editing ? (
                              <input
                                type="text"
                                className="form-control"
                                style={{ width: '80px', padding: '6px' }}
                                value={unitVal}
                                onChange={(e) => setUnitVal(e.target.value)}
                              />
                            ) : (
                              f.unit
                            )}
                          </td>
                          <td>
                            {editing ? (
                              <input
                                type="text"
                                className="form-control"
                                style={{ width: '180px', padding: '6px' }}
                                value={sourceVal}
                                onChange={(e) => setSourceVal(e.target.value)}
                              />
                            ) : (
                              f.source
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {editing ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleUpdateFactor(f.subCategory)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                  Save
                                </button>
                                <button onClick={() => setEditSubCategory(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(f)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                Edit Factor
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              <h2>Registered Platform Profiles</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Active users tracked by the EcoTrack platform.</p>
              
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Profile Name</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Region</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.firstName} {u.lastName}</td>
                        <td style={{ fontWeight: 600 }}>{u.email}</td>
                        <td>
                          <span className="badge-tag" style={{
                            backgroundColor: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            color: u.role === 'ADMIN' ? 'var(--danger)' : 'var(--accent)'
                          }}>{u.role}</span>
                        </td>
                        <td>{u.country}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div>
              <h2>Security & Action Audit Logs</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Historical ledger of transactions for security operations audits.</p>
              
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor Email</th>
                      <th>IP Location</th>
                      <th>Agent Metadata</th>
                      <th>Logged Details</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.action}</td>
                        <td>{l.user?.email || 'System/Guest'}</td>
                        <td>{l.ipAddress || 'unknown'}</td>
                        <td style={{ maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={l.userAgent || ''}>
                          {l.userAgent || 'none'}
                        </td>
                        <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={l.details || ''}>
                          {l.details || 'none'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
