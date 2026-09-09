// ==========================================
// MOCK API TOGGLE
// Set this to `false` when your partner's server is ready!
// ==========================================
const USE_MOCK_API = true;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function getMockDb() {
  const data = localStorage.getItem('mock_members_db');
  if (!data) {
    const initial = {
      "1": { id: "1", FirstName: "Jane", LastName: "Doe", Employer: "Acme Corp" },
      "2": { id: "2", FirstName: "John", LastName: "Smith", Employer: "Globex Corporation" },
      "3": { id: "3", FirstName: "Alice", LastName: "Johnson", Employer: "TechStart LLC" }
    };
    localStorage.setItem('mock_members_db', JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function saveMockDb(db) {
  localStorage.setItem('mock_members_db', JSON.stringify(db));
}

/**
 * GetAllMembers()
 * Returns an array of all members.
 */
export async function GetAllMembers() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    return Object.values(db); // Convert mock DB object into an array
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members`);
    if (!response.ok) throw new Error(`Failed to fetch members: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error in GetAllMembers:", error);
    throw error;
  }
}

export async function GetMember(memberID) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    const member = db[memberID];
    if (!member) throw new Error(`Member not found.`);
    return member;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberID}`);
    if (!response.ok) throw new Error(`Failed to fetch member: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error in GetMember:", error);
    throw error;
  }
}

export async function UpdateMember(memberID, memberData) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    if (!db[memberID]) throw new Error(`Member does not exist.`);

    db[memberID] = { ...db[memberID], ...memberData, id: memberID };
    saveMockDb(db);
    return db[memberID];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    if (!response.ok) throw new Error(`Failed to update member: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error in UpdateMember:", error);
    throw error;
  }
}

export async function CreateMember(firstName, lastName, employer = "") {
  if (!firstName || !lastName) {
    throw new Error("First Name and Last Name are required.");
  }

  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    const newId = Math.floor(100 + Math.random() * 900).toString();
    const newMember = { id: newId, FirstName: firstName, LastName: lastName, Employer: employer };
    
    db[newId] = newMember;
    saveMockDb(db);
    return newMember;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FirstName: firstName, LastName: lastName, Employer: employer }),
    });
    if (!response.ok) throw new Error(`Failed to create member: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error in CreateMember:", error);
    throw error;
  }
}