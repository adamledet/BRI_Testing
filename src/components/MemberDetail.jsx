import { useState, useEffect, useMemo } from 'react';
import { UpdateMember } from '../api/memberService';

const TABS = [
  { id: 'personal', label: 'Personal Info & Company Settings' },
  { id: 'linked', label: 'Linked Members & Spouse' },
  { id: 'periods', label: 'Periods Worked' },
];

export default function MemberDetail({ selectedMember, onMemberUpdated }) {
  const [activeTab, setActiveTab] = useState('personal');

  // 1. Live server fields synced with state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employer, setEmployer] = useState('');

  // 2. Local-only stub fields
  const [middleName, setMiddleName] = useState('');
  const [ssn, setSsn] = useState('');
  const [showSsn, setShowSsn] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [dateOfMarriage, setDateOfMarriage] = useState('');
  const [disabilityOnsetDate, setDisabilityOnsetDate] = useState('');
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [cityStateZip, setCityStateZip] = useState('');
  const [currentJobClass, setCurrentJobClass] = useState('Developer');
  const [currentWage, setCurrentWage] = useState(45.0);
  const [periods] = useState([
    { id: 1, startDate: '2020-01', endDate: '2020-01', jobClass: 'Developer', wage: 45.0, hours: 180, minutes: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // memberService now returns one consistent shape, so no casing fallbacks here.
  useEffect(() => {
    if (selectedMember) {
      setFirstName(selectedMember.firstName);
      setLastName(selectedMember.lastName);
      setEmployer(selectedMember.employer);
      setStatusMessage('');
      setError('');
    }
  }, [selectedMember]);

  // FIX: computed from the periods instead of a hardcoded "180.00 hrs".
  const totalHoursDisplay = useMemo(() => {
    const totalMinutes = periods.reduce((sum, p) => sum + p.hours * 60 + p.minutes, 0);
    return (totalMinutes / 60).toFixed(2);
  }, [periods]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedMember || loading) return;

    // FIX: the `required` attributes never ran (there was no <form>), so
    // blank names could be saved. Validate explicitly, and jump to the tab
    // that holds the problem fields so the user can see them.
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setActiveTab('personal');
      setStatusMessage('');
      setError('First Name and Last Name are required.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      await UpdateMember(selectedMember.recno, {
        memberId: selectedMember.memberId,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        employer: employer.trim(),
      });
      setFirstName(trimmedFirst);
      setLastName(trimmedLast);
      setEmployer(employer.trim());
      setStatusMessage('Changes saved.');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError(err.message ? `Could not save changes: ${err.message}` : 'Could not save changes to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMember) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>

      {/* Top Header / Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#334155', margin: 0, fontSize: '20px' }}>
          Profile: {lastName}, {firstName}
        </h2>
        <button
          type="button"
          onClick={() => alert('Check Benefits Generated stub modal opened.')}
          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          Check Benefits Generated
        </button>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div role="tablist" style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', gap: '5px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CONTAINER
          Wrapped in a <form> so pressing Enter in a field saves, and the Save
          button is a real submit button. noValidate because validation is
          handled in handleSave (fields on hidden tabs aren't in the DOM, so
          browser validation couldn't check them anyway).
          NOTE: every other button inside this form needs type="button",
          otherwise it would submit the form. */}
      <form
        onSubmit={handleSave}
        noValidate
        style={{ backgroundColor: '#fff', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #cbd5e1', borderTop: 'none', overflow: 'hidden' }}
      >

        {/* TAB 1: PERSONAL INFO & COMPANY SETTINGS */}
        {activeTab === 'personal' && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label htmlFor="md-first" style={labelStyle}>First Name *</label>
              <input id="md-first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} aria-required="true" />
            </div>
            <div>
              <label htmlFor="md-middle" style={labelStyle}>Middle Name</label>
              <input id="md-middle" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={inputStyle} placeholder="Local stub" />
            </div>
            <div>
              <label htmlFor="md-last" style={labelStyle}>Last Name *</label>
              <input id="md-last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} aria-required="true" />
            </div>
            <div>
              {/* SSN is masked by default. When this is wired to the server, the
                  server should return a masked value (***-**-6789) unless the
                  user's role is allowed to see the full number. */}
              <label htmlFor="md-ssn" style={labelStyle}>SSN</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  id="md-ssn"
                  type={showSsn ? 'text' : 'password'}
                  value={ssn}
                  onChange={(e) => setSsn(e.target.value)}
                  style={inputStyle}
                  placeholder="123-45-6789"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={11}
                />
                <button
                  type="button"
                  onClick={() => setShowSsn((v) => !v)}
                  aria-label={showSsn ? 'Hide SSN' : 'Show SSN'}
                  style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '0 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  {showSsn ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="md-dob" style={labelStyle}>Date of Birth</label>
              <input id="md-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="md-dod" style={labelStyle}>Date of Death</label>
              <input id="md-dod" type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="md-dom" style={labelStyle}>Date of Marriage</label>
              <input id="md-dom" type="date" value={dateOfMarriage} onChange={(e) => setDateOfMarriage(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="md-disability" style={labelStyle}>Disability Onset Date</label>
              <input id="md-disability" type="date" value={disabilityOnsetDate} onChange={(e) => setDisabilityOnsetDate(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ gridColumn: 'span 4', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div>
                <label htmlFor="md-street" style={labelStyle}>Street Address</label>
                <input id="md-street" type="text" value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} placeholder="123 Main St" />
              </div>
              <div>
                <label htmlFor="md-unit" style={labelStyle}>Unit / Apt / Suite</label>
                <input id="md-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} placeholder="Apt 4B" />
              </div>
              <div>
                <label htmlFor="md-city" style={labelStyle}>City, State, Postal Code</label>
                <input id="md-city" type="text" value={cityStateZip} onChange={(e) => setCityStateZip(e.target.value)} style={inputStyle} placeholder="City, ST 00000" />
              </div>
            </div>

            <div>
              <label htmlFor="md-employer" style={labelStyle}>Employer (Server Field)</label>
              <input id="md-employer" type="text" value={employer} onChange={(e) => setEmployer(e.target.value)} style={inputStyle} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label htmlFor="md-jobclass" style={labelStyle}>Job Classification (Stub)</label>
              <input id="md-jobclass" type="text" value={currentJobClass} onChange={(e) => setCurrentJobClass(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="md-wage" style={labelStyle}>Current Wage ($) (Stub)</label>
              <input id="md-wage" type="number" step="0.01" value={currentWage} onChange={(e) => setCurrentWage(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Total Hours Worked:</span>
              <span style={{ fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{totalHoursDisplay} hrs</span>
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
              <button type="button" onClick={() => alert('Link person stub modal')} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Link Person</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={subThStyle}>Name</th>
                  <th style={subThStyle}>Relationship</th>
                  <th style={subThStyle}>Status</th>
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
              <button type="button" onClick={() => alert('Add period stub modal')} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Period</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={subThStyle}>Dates</th>
                  <th style={subThStyle}>Job Class</th>
                  <th style={subThStyle}>Wage</th>
                  <th style={subThStyle}>Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={subTdStyle}>{p.startDate} to {p.endDate}</td>
                    <td style={subTdStyle}>{p.jobClass}</td>
                    <td style={subTdStyle}>${p.wage.toFixed(2)}</td>
                    <td style={subTdStyle}>{p.hours}h {p.minutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PERSISTENT SAVE BAR (Available on every tab) */}
        <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span role="status" aria-live="polite">
            {error && <span style={{ color: 'red', fontSize: '13px' }}>{error}</span>}
            {statusMessage && <span style={{ color: 'green', fontSize: '13px' }}>{statusMessage}</span>}
          </span>
          <button type="submit" disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

const tabStyle = (active) => ({
  padding: '12px 20px',
  backgroundColor: active ? '#fff' : '#e2e8f0',
  color: active ? '#334155' : '#64748b',
  border: '1px solid #cbd5e1',
  borderBottom: active ? 'none' : '1px solid #cbd5e1',
  borderRadius: '6px 6px 0 0',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '14px',
});

const labelStyle = { display: 'block', fontSize: '13px', color: '#334155', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', boxSizing: 'border-box', fontSize: '14px' };
const subThStyle = { padding: '10px 15px', fontSize: '13px', color: '#334155' };
const subTdStyle = { padding: '12px 15px', fontSize: '13px', color: '#334155' };
