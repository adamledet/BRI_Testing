import { useState } from 'react';
import { GetMember, UpdateMember } from '../api/memberService';

export default function MemberDetail() {
  const [memberIdInput, setMemberIdInput] = useState('');
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Handle Fetching Member
  const handleFetchMember = async (e) => {
    e.preventDefault();
    if (!memberIdInput.trim()) return;

    setLoading(true);
    setError('');
    setStatusMessage('');
    try {
      const data = await GetMember(memberIdInput);
      setMember(data);
    } catch (err) {
      setError('Could not retrieve member. Check ID or server connection.');
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Field Changes locally
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Saving/Updating Changes to Server
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    setError('');
    setStatusMessage('');
    try {
      await UpdateMember(memberIdInput, member);
      setStatusMessage('Changes successfully pushed to server!');
    } catch (err) {
      setError('Failed to update member on server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h3>Lookup & Update Member</h3>
      
      {/* Search Bar */}
      <form onSubmit={handleFetchMember} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter Member ID..."
          value={memberIdInput}
          onChange={(e) => setMemberIdInput(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Loading...' : 'Get Member'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {statusMessage && <p style={{ color: 'green' }}>{statusMessage}</p>}

      {/* Member Edit Form (Only shown if a member is loaded) */}
      {member && (
        <form onSubmit={handleUpdate} style={{ marginTop: '15px', borderTop: '1px dashed #ddd', paddingTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
            <input
              type="text"
              name="FirstName"
              value={member.FirstName || ''}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Last Name:</label>
            <input
              type="text"
              name="LastName"
              value={member.LastName || ''}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Employer:</label>
            <input
              type="text"
              name="Employer"
              value={member.Employer || ''}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? 'Updating...' : 'Update Member (Push to Server)'}
          </button>
        </form>
      )}
    </div>
  );
}