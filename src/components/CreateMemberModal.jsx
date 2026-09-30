import { useState, useEffect } from 'react';
import { CreateMember as ApiCreateMember } from '../api/memberService';

export default function CreateMemberModal({ isOpen, onClose, onMemberCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employer, setEmployer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // FIX: start with a clean form every time the modal opens. Previously,
  // cancelling left typed values and old errors in place for next time.
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setEmployer('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Close on Escape, unless a save is in progress.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // All hooks must run before this early return (Rules of Hooks).
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // guard against double submission

    setLoading(true);
    setError('');

    try {
      // Trimming and required-field checks now live in memberService.
      await ApiCreateMember(firstName, lastName, employer);
      onClose();
      if (onMemberCreated) onMemberCreated();
    } catch (err) {
      setError(err.message || 'Failed to create member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-member-title"
        style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '95vw', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box' }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
        >
          ✕
        </button>

        <h2 id="create-member-title" style={{ marginTop: 0, color: '#334155', fontSize: '20px', marginBottom: '20px' }}>Add New Member</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cm-first" style={labelStyle}>First Name (Required):</label>
            <input
              id="cm-first"
              type="text"
              placeholder="e.g., Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cm-last" style={labelStyle}>Last Name (Required):</label>
            <input
              id="cm-last"
              type="text"
              placeholder="e.g., Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="cm-employer" style={labelStyle}>Employer (Optional):</label>
            <input
              id="cm-employer"
              type="text"
              placeholder="e.g., Acme Corp"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && <p role="alert" style={{ color: 'red', marginBottom: '15px', fontSize: '13px' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '14px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box' };
