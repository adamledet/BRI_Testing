import { useState, useEffect } from 'react';
import { DeleteMember, GetAllMembers } from '../api/memberService';

export default function MemberList({ refreshTrigger, onSelectMember, onMemberDeleted }) {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const data = await GetAllMembers();
        setMembers(data);
      } catch (err) {
        setError('Failed to load member list.');
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [refreshTrigger]);

  const handleDelete = async (recno) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await DeleteMember(recno);
        if (onMemberDeleted) {
          onMemberDeleted();
        }
      } catch (err) {
        alert("Failed to delete member.");
      }
    }
  };

  // Dynamic search filter using lowercase keys
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    const firstName = (member.firstname || '').toLowerCase();
    const lastName = (member.lastname || '').toLowerCase();
    const employer = (member.employer || '').toLowerCase();

    return firstName.includes(query) || lastName.includes(query) || employer.includes(query);
  });

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>Member Directory</h3>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search by first name, last name, or employer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      {loading && <p>Loading members...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '8px' }}>First Name</th>
              <th style={{ padding: '8px' }}>Last Name</th>
              <th style={{ padding: '8px' }}>Employer</th>
              <th style={{ padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>
                  No members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.recno} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{member.firstname}</td>
                  <td style={{ padding: '8px' }}>{member.lastname}</td>
                  <td style={{ padding: '8px' }}>{member.employer || <span style={{ color: '#aaa' }}>None</span>}</td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => onSelectMember(member)}
                      style={{ padding: '5px 10px', marginRight: '5px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.recno)}
                      style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}