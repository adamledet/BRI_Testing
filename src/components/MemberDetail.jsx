import { useState, useEffect } from 'react';
import { UpdateMember } from '../api/memberService';

export default function MemberDetail({ selectedMember, onMemberUpdated }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // When a user clicks "Edit" on the table, load them into this form
  useEffect(() => {
    if (selectedMember) {
      setMember({ ...selectedMember });
      setStatusMessage('');
      setError('');
    }
  }, [selectedMember]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      // Passes the hidden internal id and the updated data object (JSON) to the server
      await UpdateMember(member.id, {
        FirstName: member.FirstName,
        LastName: member.LastName,
        Employer: member.Employer,
      });
      setStatusMessage('Changes successfully pushed to server!');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError('Failed to update member on server.');
    } finally {
      setLoading(false);
    }
  };

  if (!member) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', color: '#777', textAlign: 'center' }}>
        <p>Click "Edit" on any member in the directory above to modify their details.</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3>Edit Member</h3>
      
      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
          <input
            type="text"
            name="FirstName"
            value={member.FirstName || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Last Name:</label>
          <input
            type="text"
            name="LastName"
            value={member.LastName || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Employer:</label>
          <input
            type="text"
            name="Employer"
            value={member.Employer || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Saving...' : 'Save Changes (Push to Server)'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {statusMessage && <p style={{ color: 'green', marginTop: '10px' }}>{statusMessage}</p>}
    </div>
  );
}