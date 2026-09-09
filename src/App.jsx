import { useState } from 'react';
import CreateMember from './components/CreateMember';
import MemberList from './components/MemberList';
import MemberDetail from './components/MemberDetail';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);

  // Trigger list refresh after creating or editing a member
  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Client-Server Communication Test Bench</h2>
      <p style={{ color: '#555', marginBottom: '30px' }}>
        Testing interface with dynamic search and hidden server IDs.
      </p>

      <CreateMember onMemberCreated={handleDataChange} />
      
      <MemberList 
        refreshTrigger={refreshTrigger} 
        onSelectMember={(member) => setSelectedMember(member)} 
      />

      <MemberDetail 
        selectedMember={selectedMember} 
        onMemberUpdated={handleDataChange} 
      />
    </div>
  );
}

export default App;