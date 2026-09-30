import { useState } from 'react';
import MemberList from './components/MemberList';
import MemberDetail from './components/MemberDetail';
// App.css removed: it only contained unused Vite starter styles.

export default function App() {
  const [currentView, setCurrentView] = useState('Members');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'Members':
        if (selectedMember) {
          return (
            <div style={{ width: '100%', margin: '0 auto', padding: '30px', boxSizing: 'border-box' }}>
              <button 
                onClick={() => setSelectedMember(null)} 
                style={{ marginBottom: '15px', cursor: 'pointer', background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', padding: 0 }}
              >
                &larr; Back to Members
              </button>
              
              {/* key forces a fresh component (and fresh stub fields) per member */}
              <MemberDetail 
                key={selectedMember.recno ?? selectedMember.memberId}
                selectedMember={selectedMember} 
                onMemberUpdated={handleDataChange} 
              />
            </div>
          );
        }

        return (
          <div style={{ width: '100%', margin: '0 auto', padding: '30px', boxSizing: 'border-box' }}>
            <MemberList 
              refreshTrigger={refreshTrigger} 
              onSelectMember={(member) => setSelectedMember(member)}
            />
          </div>
        );

      case 'Dashboard':
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><h2>Dashboard</h2><p>Customizable shortcuts coming soon.</p></div>;
      case 'Employers':
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><h2>Employers Module</h2><p>Pending server integration.</p></div>;
      case 'Plans':
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><h2>Benefit Plans Module</h2><p>Pending server integration.</p></div>;
      case 'Benefits':
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><h2>Benefits Configuration</h2><p>Pending server integration.</p></div>;
      case 'Settings':
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><h2>Settings</h2><p>Application preferences.</p></div>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#e2e8f0', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{ width: '250px', minWidth: '250px', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ padding: '20px', fontSize: '24px', color: '#334155', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>
          BRI
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
          {['Dashboard', 'Members', 'Employers', 'Plans', 'Benefits', 'Settings'].map((item) => {
            const isActive = currentView === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setCurrentView(item);
                  if (item === 'Members') setSelectedMember(null);
                }}
                style={{ 
                  padding: '15px 20px', 
                  textAlign: 'left', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '16px', 
                  background: isActive ? '#475569' : 'transparent', 
                  color: isActive ? '#fff' : '#475569',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'background 0.2s'
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        <header style={{ height: '60px', backgroundColor: '#475569', display: 'flex', alignItems: 'center', padding: '0 25px', justifyContent: 'flex-end', color: '#fff', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: '500' }}>Admin User</div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          {renderCurrentView()}
        </main>
      </div>

    </div>
  );
}