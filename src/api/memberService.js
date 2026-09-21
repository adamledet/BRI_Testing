// ==========================================
// MOCK API TOGGLE
// Set this to `false` when your partner's server is ready!
// ==========================================
const USE_MOCK_API = false;
const API_BASE_URL = 'http://testbed.icorp.net/tbx/sample1.php';

function getMockDb() {
  const data = localStorage.getItem('mock_members_db');
  if (!data) {
    const initial = {
      "1": { recno: 1, MemberID: "101", FirstName: "Jane", LastName: "Doe", Employer: "Acme Corp" },
      "2": { recno: 2, MemberID: "102", FirstName: "John", LastName: "Smith", Employer: "Globex Corporation" },
      "3": { recno: 3, MemberID: "103", FirstName: "Alice", LastName: "Johnson", Employer: "TechStart LLC" }
    };
    localStorage.setItem('mock_members_db', JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function saveMockDb(db) {
  localStorage.setItem('mock_members_db', JSON.stringify(db));
}

async function callApi(payload) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Check response code (1 = success, 0 or 99 = failure)
    if (result.rcode !== 1) {
      throw new Error(result.ecode || "Server returned an unknown error.");
    }

    return result;
  } catch (error) {
    console.error("API Error [", payload.fnc, "]:", error);
    throw error;
  }
}

// GetAllMembers (fnc: "list")
export async function GetAllMembers() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    return Object.values(db);
  }

  try {
    const result = await callApi({
      fnc: "list"
    });
    // --- ADD THIS LINE TO INSPECT THE RAW SERVER DATA IN YOUR BROWSER CONSOLE ---
    console.log("RAW SERVER LIST RESPONSE:", result.data);
    return result.data || [];
  } catch (error) {
    console.error("Error in GetAllMembers:", error);
    throw error;
  }
}

// GetMember (fnc: "get")
export async function GetMember(recno) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    const member = db[recno];
    if (!member) throw new Error(`Member not found.`);
    return member;
  }

  try {
    const result = await callApi({
      fnc: "get",
      recno: recno
    });
    return result.member || result.data;
  } catch (error) {
    console.error("Error in GetMember:", error);
    throw error;
  }
}

// UpdateMember (fnc: "update")
export async function UpdateMember(recno, memberData) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    if (!db[recno]) throw new Error(`Member does not exist.`);

    db[recno] = { ...db[recno], ...memberData, recno: recno };
    saveMockDb(db);
    return db[recno];
  }

  try {
    const result = await callApi({
      fnc: "update",
      recno: recno,
      memberid: memberData.memberid,
      firstname: memberData.firstname,
      lastname: memberData.lastname,
      employer: memberData.employer
    });
    return result;
  } catch (error) {
    console.error("Error in UpdateMember:", error);
    throw error;
  }
}

// CreateMember (fnc: "add")
export async function CreateMember(firstName, lastName, employer = "") {
  if (!firstName || !lastName) {
    throw new Error("First Name and Last Name are required.");
  }

  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    const newRecno = Object.keys(db).length + 1;
    const newMember = { recno: newRecno, MemberID: (100 + newRecno).toString(), FirstName: firstName, LastName: lastName, Employer: employer };
    
    db[newRecno] = newMember;
    saveMockDb(db);
    return newMember;
  }

  try {
    // Added 'await' here so it properly waits for the server response!
    const numericMemberId = Math.floor(Date.now() / 1000); //pseudo random member id
    const result = await callApi({
      fnc: "add",
      memberid: numericMemberId,
      firstname: firstName,
      lastname: lastName,
      employer: employer
    });
    return result;
  } catch (error) {
    console.error("Error in CreateMember:", error);
    throw error;
  }
}

// DeleteMember (fnc: "delete")
export async function DeleteMember(recno) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const db = getMockDb();
    
    // Convert recno to string so it matches the object keys correctly
    const key = recno.toString();
    if (!db[key]) throw new Error(`Member does not exist.`);
    
    delete db[key];
    saveMockDb(db);
    return { rcode: 1 };
  }

  try {
    const result = await callApi({
      fnc: "delete",
      recno: recno
    });
    return result;
  } catch (error) {
    console.error("Error in DeleteMember:", error);
    throw error;
  }
}

// Example powershell command to run in terminal to access server
//powershell -Command "Invoke-RestMethod -Uri 'http://testbed.icorp.net/tbx/sample1.php' -Method Post -ContentType 'application/json' -Body '{\"fnc\": \"add\", \"memberid\": 28, \"firstname\": \"Adam\", \"lastname\": \"TestName\", \"employer\": \"Self\"}'"