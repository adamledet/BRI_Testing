import { useState, useEffect } from 'react';
import { GetAllMembers, UpdateMember } from '../api/memberService';

export default function MemberList({ refreshTrigger, onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch members when component loads or when refreshTrigger changes (e.g. after creating a new one)
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

  // Dynamic search filter: checks First Name, Last Name, or Employer
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    const firstName = (member.FirstName || '').toLowerCase();
    const lastName = (member.LastName || '').toLowerCase();
    const employer = (member.Employer || '').toLowerCase();

    return firstName.includes(query) || lastName.includes(query) || employer.includes(query);
  });

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>Member Directory</h3>

      {/* Dynamic Search Bar */}
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
              <th style={{ padding: '8px' }}>Action</th>
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
                <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{member.FirstName}</td>
                  <td style={{ padding: '8px' }}>{member.LastName}</td>
                  <td style={{ padding: '8px' }}>{member.Employer || <span style={{ color: '#aaa' }}>None</span>}</td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => onSelectMember(member)}
                      style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Edit
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