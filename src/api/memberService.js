const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * GetMember(memberID)
 * Takes a Member ID and returns each of their fields.
 */
export async function GetMember(memberID) {
  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberID}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in GetMember:", error);
    throw error;
  }
}

/**
 * UpdateMember(memberID, memberData)
 * Pushes any changes made to the member's fields to the Server.
 */
export async function UpdateMember(memberID, memberData) {
  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberID}`, {
      method: 'PUT', // Or 'PATCH', depending on what your partner prefers
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update member: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in UpdateMember:", error);
    throw error;
  }
}

/**
 * CreateMember(firstName, lastName, employer)
 * Creates a new member. Requires first and last name. Employer is optional.
 */
export async function CreateMember(firstName, lastName, employer = "") {
  // Client-side validation enforcing your rule
  if (!firstName || !lastName) {
    throw new Error("First Name and Last Name are required to create a member.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, employer }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create member: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in CreateMember:", error);
    throw error;
  }
}