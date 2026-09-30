// ==========================================
// CONFIGURATION
// Values come from environment variables so the real server URL never
// lives in source code. Create a `.env.local` file in the project root
// (Vite's default .gitignore already excludes *.local files):
//
//   VITE_API_BASE_URL=https://your-server/endpoint
//   VITE_USE_MOCK_API=false
//
// Restart the dev server after changing any .env file.
// ==========================================
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const REQUEST_TIMEOUT_MS = 15000;
const MOCK_DB_KEY = 'mock_members_db';
const MOCK_LATENCY_MS = 300;
const BULK_CONCURRENCY = 5; // max simultaneous requests during bulk operations

// ==========================================
// NORMALIZATION
// Every function in this file returns members in ONE shape:
//   { recno, memberId, firstName, lastName, employer }
// Components never need to guess at server casing. If the server's field
// names change, only normalizeMember and toServerFields need updating.
// ==========================================
export function normalizeMember(raw = {}) {
  return {
    recno: raw.recno ?? raw.RecNo ?? raw.RECNO ?? null,
    memberId: raw.memberid ?? raw.MemberID ?? raw.memberId ?? null,
    firstName: raw.firstname ?? raw.FirstName ?? raw.firstName ?? '',
    lastName: raw.lastname ?? raw.LastName ?? raw.lastName ?? '',
    employer: raw.employer ?? raw.Employer ?? '',
  };
}

// Converts the app's shape back into the field names the server expects.
function toServerFields(member) {
  return {
    memberid: member.memberId,
    firstname: member.firstName,
    lastname: member.lastName,
    employer: member.employer ?? '',
  };
}

// Shared validation so create and update enforce the same rules.
function cleanRequiredNames(firstName, lastName) {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();
  if (!first || !last) {
    throw new Error('First Name and Last Name are required.');
  }
  return { first, last };
}

// ==========================================
// MOCK DATABASE (localStorage, development only)
// Stored in the same field names the server uses, so mock mode exercises
// the normalization layer exactly as real server data would.
// ==========================================
const delay = (ms = MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

function saveMockDb(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

function getMockDb() {
  try {
    const data = localStorage.getItem(MOCK_DB_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // Corrupted mock data: fall through and reseed.
  }
  const initial = {
    1: { recno: 1, memberid: '101', firstname: 'Jane', lastname: 'Doe', employer: 'Acme Corp' },
    2: { recno: 2, memberid: '102', firstname: 'John', lastname: 'Smith', employer: 'Globex Corporation' },
    3: { recno: 3, memberid: '103', firstname: 'Alice', lastname: 'Johnson', employer: 'TechStart LLC' },
  };
  saveMockDb(initial);
  return initial;
}

// ==========================================
// HTTP LAYER
// ==========================================

// TODO(security): The server currently accepts unauthenticated requests.
// Once the backend supports auth (session cookie, bearer token, etc.),
// return the required headers here so every request includes them.
function getAuthHeaders() {
  return {};
}

async function callApi(payload) {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL in .env.local.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Server returned a response that was not valid JSON.');
    }

    // Response code: 1 = success, 0 or 99 = failure.
    // Number() tolerates the server sending "1" as a string.
    if (Number(result.rcode) !== 1) {
      throw new Error(result.ecode || 'Server returned an unknown error.');
    }

    return result;
  } catch (error) {
    const finalError =
      error.name === 'AbortError'
        ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`)
        : error;
    // Log the operation name and message only, never the payload,
    // so member data doesn't end up in the browser console.
    console.error(`API error [${payload.fnc}]:`, finalError.message);
    throw finalError;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// PUBLIC API
// ==========================================

// GetAllMembers (fnc: "list")
export async function GetAllMembers() {
  if (USE_MOCK_API) {
    await delay();
    return Object.values(getMockDb()).map(normalizeMember);
  }

  const result = await callApi({ fnc: 'list' });
  const rows = Array.isArray(result.data) ? result.data : [];

  if (import.meta.env.DEV && rows.length > 0) {
    // Logs field NAMES only (never values), which is enough to check casing
    // without putting member data in the console.
    console.debug('[memberService] list returned', rows.length, 'rows; fields:', Object.keys(rows[0]));
  }

  return rows.map(normalizeMember);
}

// GetMember (fnc: "get")
export async function GetMember(recno) {
  if (USE_MOCK_API) {
    await delay();
    const member = getMockDb()[String(recno)];
    if (!member) throw new Error('Member not found.');
    return normalizeMember(member);
  }

  const result = await callApi({ fnc: 'get', recno });
  const raw = result.member ?? result.data;
  if (!raw) throw new Error('Member not found.');
  return normalizeMember(raw);
}

// UpdateMember (fnc: "update")
// `member` uses the app's shape: { memberId, firstName, lastName, employer }
export async function UpdateMember(recno, member) {
  const { first, last } = cleanRequiredNames(member.firstName, member.lastName);
  const fields = toServerFields({
    ...member,
    firstName: first,
    lastName: last,
    employer: (member.employer ?? '').trim(),
  });

  if (USE_MOCK_API) {
    await delay();
    const db = getMockDb();
    const key = String(recno);
    if (!db[key]) throw new Error('Member does not exist.');
    db[key] = { ...db[key], ...fields, recno };
    saveMockDb(db);
    return normalizeMember(db[key]);
  }

  return callApi({ fnc: 'update', recno, ...fields });
}

// CreateMember (fnc: "add")
export async function CreateMember(firstName, lastName, employer = '') {
  const { first, last } = cleanRequiredNames(firstName, lastName);
  const cleanEmployer = (employer ?? '').trim();

  if (USE_MOCK_API) {
    await delay();
    const db = getMockDb();
    const keys = Object.keys(db).map(Number);
    const nextRecno = keys.length > 0 ? Math.max(...keys) + 1 : 1;
    const newMember = {
      recno: nextRecno,
      memberid: String(100 + nextRecno),
      firstname: first,
      lastname: last,
      employer: cleanEmployer,
    };
    db[nextRecno] = newMember;
    saveMockDb(db);
    return normalizeMember(newMember);
  }

  // TODO(server): Member IDs should be assigned by the server or database.
  // A seconds-based timestamp collides if two members are created in the
  // same second. Kept for now because the current "add" call expects it;
  // remove once the backend generates IDs (and enforce uniqueness there).
  const memberid = Math.floor(Date.now() / 1000);

  return callApi({
    fnc: 'add',
    memberid,
    firstname: first,
    lastname: last,
    employer: cleanEmployer,
  });
}

// DeleteMember (fnc: "delete")
export async function DeleteMember(recno) {
  if (USE_MOCK_API) {
    await delay();
    const db = getMockDb();
    const key = String(recno);
    if (!db[key]) throw new Error('Member does not exist.');
    delete db[key];
    saveMockDb(db);
    return { rcode: 1 };
  }

  return callApi({ fnc: 'delete', recno });
}

// DeleteMembers: bulk delete that never stops halfway.
// Runs a few requests at a time and reports exactly which succeeded and
// which failed, so the UI can tell the user the truth.
// If the backend later adds a bulk "delete" function, swap it in here.
export async function DeleteMembers(recnos) {
  const succeeded = [];
  const failed = [];

  for (let i = 0; i < recnos.length; i += BULK_CONCURRENCY) {
    const batch = recnos.slice(i, i + BULK_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((recno) => DeleteMember(recno)));
    results.forEach((result, index) => {
      (result.status === 'fulfilled' ? succeeded : failed).push(batch[index]);
    });
  }

  return { succeeded, failed };
}
