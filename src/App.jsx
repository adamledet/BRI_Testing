import CreateMember from './components/CreateMember';
import MemberDetail from './components/MemberDetail';
import './App.css';

function App() {
  const handleMemberCreated = (newMember) => {
    console.log("New member created callback:", newMember);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Client-Server Communication Test Bench</h2>
      <p style={{ color: '#555', marginBottom: '30px' }}>
        Testing interface for <code>GetMember</code>, <code>UpdateMember</code>, and <code>CreateMember</code>.
      </p>

      <CreateMember onMemberCreated={handleMemberCreated} />
      <MemberDetail />
    </div>
  );
}

export default App;