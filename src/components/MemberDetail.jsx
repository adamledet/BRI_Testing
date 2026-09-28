import { useState, useEffect } from 'react';
import { UpdateMember } from '../api/memberService';

export default function MemberDetail({ selectedMember, onMemberUpdated }) {
  // Active tab state: 'personal', 'linked', or 'periods'
  const [activeTab, setActiveTab] = useState('personal');

  // 1. Live server fields synced with state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employer, setEmployer] = useState('');
  
  // 2. Local-only stub fields
  const [middleName, setMiddleName] = useState('');
  const [ssn, setSsn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [dateOfMarriage, setDateOfMarriage] = useState('');
  const [disabilityOnsetDate, setDisabilityOnsetDate] = useState('');
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [cityStateZip, setCityStateZip] = useState('');
  const [currentJobClass, setCurrentJobClass] = useState('Developer');
  const [currentWage, setCurrentWage] = useState(45.00);
  const [periods, setPeriods] = useState([
    { id: 1, startDate: '2020-01', endDate: '2020-01', jobClass: 'Developer', wage: 45.00, hours: 180, minutes: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedMember) {
      setFirstName(selectedMember.firstname || selectedMember.FirstName || '');
      setLastName(selectedMember.lastname || selectedMember.LastName || '');
      setEmployer(selectedMember.employer || selectedMember.Employer || '');
      setStatusMessage('');
      setError('');
    }
  }, [selectedMember]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      await UpdateMember(selectedMember.recno, {
        firstname: firstName,
        lastname: lastName,
        employer: employer,
        memberid: selectedMember.memberid || selectedMember.MemberID
      });
      setStatusMessage('Changes successfully pushed to server!');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError('Failed to update member on server.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMember) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* Top Header / Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#334155', margin: 0, fontSize: '20px' }}>
          Profile: {lastName}, {firstName}
        </h2>
        <button 
          onClick={() => alert("Check Benefits Generated stub modal opened.")} 
          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          Check Benefits Generated
        </button>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', gap: '5px' }}>
        <button
          onClick={() => setActiveTab('personal')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'personal' ? '#fff' : '#e2e8f0',
            color: activeTab === 'personal' ? '#334155' : '#64748b',
            border: '1px solid #cbd5e1',
            borderBottom: activeTab === 'personal' ? 'none' : '1px solid #cbd5e1',
            borderRadius: '6px 6px 0 0',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Personal Info & Company Settings
        </button>
        <button
          onClick={() => setActiveTab('linked')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'linked' ? '#fff' : '#e2e8f0',
            color: activeTab === 'linked' ? '#334155' : '#64748b',
            border: '1px solid #cbd5e1',
            borderBottom: activeTab === 'linked' ? 'none' : '1px solid #cbd5e1',
            borderRadius: '6px 6px 0 0',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Linked Members & Spouse
        </button>
        <button
          onClick={() => setActiveTab('periods')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'periods' ? '#fff' : '#e2e8f0',
            color: activeTab === 'periods' ? '#334155' : '#64748b',
            border: '1px solid #cbd5e1',
            borderBottom: activeTab === 'periods' ? 'none' : '1px solid #cbd5e1',
            borderRadius: '6px 6px 0 0',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Periods Worked
        </button>
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div style={{ backgroundColor: '#fff', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #cbd5e1', borderTop: 'none', overflow: 'hidden' }}>
        
        {/* TAB 1: PERSONAL INFO & COMPANY SETTINGS */}
        {activeTab === 'personal' && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Middle Name</label>
              <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={inputStyle} placeholder="Local stub" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>SSN</label>
              <input type="text" value={ssn} onChange={(e) => setSsn(e.target.value)} style={inputStyle} placeholder="123-45-6789" />
            </div>

            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Death</label>
              <input type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Marriage</label>
              <input type="date" value={dateOfMarriage} onChange={(e) => setDateOfMarriage(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Disability Onset Date</label>
              <input type="date" value={disabilityOnsetDate} onChange={(e) => setDisabilityOnsetDate(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ gridColumn: 'span 4', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={labelStyle}>Street Address</label>
                <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} placeholder="123 Main St" />
              </div>
              <div>
                <label style={labelStyle}>Unit / Apt / Suite</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} placeholder="Apt 4B" />
              </div>
              <div>
                <label style={labelStyle}>City, State, Postal Code</label>
                <input type="text" value={cityStateZip} onChange={(e) => setCityStateZip(e.target.value)} style={inputStyle} placeholder="New Orleans, LA" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Employer (Server Field)</label>
              <input type="text" value={employer} onChange={(e) => setEmployer(e.target.value)} style={inputStyle} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label style={labelStyle}>Job Classification (Stub)</label>
              <input type="text" value={currentJobClass} onChange={(e) => setCurrentJobClass(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Current Wage ($) (Stub)</label>
              <input type="number" step="0.01" value={currentWage} onChange={(e) => setCurrentWage(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Total Hours Worked:</span>
              <span style={{ fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>180.00 hrs</span>
            </div>
          </div>
        )}

        {/* TAB 2: LINKED MEMBERS & SPOUSE */}
        {activeTab === 'linked' && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <label style={labelStyle}>Spouse Information (Local Stub)</label>
              <select style={inputStyle} disabled>
                <option>-- No Spouse Linked --</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Other Linked Persons</span>
              <button onClick={() => alert("Link person stub modal")} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Link Person</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Name</th>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Relationship</th>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No other linked persons.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: PERIODS WORKED */}
        {activeTab === 'periods' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Work Periods History</span>
              <button onClick={() => alert("Add period stub modal")} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Period</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Dates</th>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Job Class</th>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Wage</th>
                  <th style={{ padding: '10px 15px', fontSize: '13px', color: '#334155' }}>Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '12px 15px', fontSize: '13px', color: '#334155' }}>{p.startDate} to {p.endDate}</td>
                    <td style={{ padding: '12px 15px', fontSize: '13px', color: '#334155' }}>{p.jobClass}</td>
                    <td style={{ padding: '12px 15px', fontSize: '13px', color: '#334155' }}>${p.wage.toFixed(2)}</td>
                    <td style={{ padding: '12px 15px', fontSize: '13px', color: '#334155' }}>{p.hours}h {p.minutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PERSISTENT SAVE BAR (Available on every tab) */}
        <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
          {error && <span style={{ color: 'red', fontSize: '13px' }}>{error}</span>}
          {statusMessage && <span style={{ color: 'green', fontSize: '13px' }}>{statusMessage}</span>}
          <button onClick={handleSave} disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

      </div>

    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box', fontSize: '14px' };