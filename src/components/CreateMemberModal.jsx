import { useState } from 'react';
import { CreateMember as ApiCreateMember } from '../api/memberService';

export default function CreateMemberModal({ isOpen, onClose, onMemberCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employer, setEmployer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ApiCreateMember(firstName, lastName, employer);
      setFirstName('');
      setLastName('');
      setEmployer('');
      if (onMemberCreated) onMemberCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '95vw', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        
        <h2 style={{ marginTop: 0, color: '#334155', fontSize: '20px', marginBottom: '20px' }}>Add New Member</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' }}>First Name (Required):</label>
            <input
              type="text"
              placeholder="e.g., Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' }}>Last Name (Required):</label>
            <input
              type="text"
              placeholder="e.g., Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' }}>Employer (Optional):</label>
            <input
              type="text"
              placeholder="e.g., Acme Corp"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ color: 'red', marginBottom: '15px', fontSize: '13px' }}>{error}</p>}

          <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}