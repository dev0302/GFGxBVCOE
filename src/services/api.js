const BASE = import.meta.env.VITE_API_BASE_URL;

const AUTH_TOKEN_KEY = "gfg_auth_token";

/** Get stored auth token (survives refresh; works when cookies are blocked in production). */
export function getAuthToken() {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/** Store token after login/signup so requests can use Authorization header. */
export function setAuthToken(token) {
  try {
    if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    else sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (_) { }
}

/** Clear stored token on logout. */
export function clearAuthToken() {
  setAuthToken(null);
}

export async function verifyTeam(teamId) {
  const res = await fetch(`${BASE}/api/auth/team/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId })
  });
  if (!res.ok) throw new Error('Team not found');
  return res.json();
}

export async function getQuestions() {
  const res = await fetch(`${BASE}/api/quiz/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json(); // { questions }
}

export async function submitQuiz({ teamId, answers, timeMs }) {
  const res = await fetch(`${BASE}/api/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, answers, timeMs })
  });
  if (!res.ok) throw new Error('Submit failed');
  return res.json(); // { score, timeMs, teamId, teamName, teamLead }
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE}/api/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json(); // { entries }
}

export async function getSettings() {
  const res = await fetch(`${BASE}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json(); // { leaderboardEnabled }
}

export async function setLeaderboardEnabled(enabled) {
  const res = await fetch(`${BASE}/api/settings/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json(); // { leaderboardEnabled }
}

// Events (uploaded via /uploadevent)
/** Public Events page: only visible events (not scheduled for deletion). */
export async function getEvents() {
  const res = await fetch(`${BASE}/api/v1/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json(); // { success, data }
}

/** Upcoming events (public). Past events are auto-removed on fetch. */
export async function getUpcomingEvents() {
  const res = await fetch(`${BASE}/api/v1/events/upcoming`);
  const data = await res.json().catch(() => ({ success: false, data: [] }));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch upcoming events');
  return data;
}

/** Create upcoming event (auth + event upload). FormData: title, date (required); poster (file), location, time, targetAudience, otherLinks, otherDocs (optional). */
export async function createUpcomingEvent(formData) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/events/upcoming`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to create upcoming event');
  return data;
}

/** Update upcoming event (auth + event upload). FormData: same fields, poster (file) optional. */
export async function updateUpcomingEvent(id, formData) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/events/upcoming/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to update upcoming event');
  return data;
}

/** Delete upcoming event (auth + event upload). */
export async function deleteUpcomingEvent(id) {
  const res = await authFetch(`/api/v1/events/upcoming/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to delete upcoming event');
  return data;
}

/** Manage page: includes events scheduled for deletion (so admin can cancel). */
export async function getEventsForManage() {
  const res = await fetch(`${BASE}/api/v1/events?manage=1`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json(); // { success, data }
}

export async function createEvent(formData) {
  const res = await fetch(`${BASE}/api/v1/events`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload event');
  }
  return res.json();
}

/** Schedule event for deletion in 10 days (soft delete). */
export async function deleteEvent(id) {
  const res = await fetch(`${BASE}/api/v1/events/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to schedule deletion');
  }
  return res.json();
}

/** Cancel scheduled deletion so the event stays. */
export async function cancelScheduledDelete(id) {
  const res = await fetch(`${BASE}/api/v1/events/${id}/cancel-delete`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to cancel deletion');
  }
  return res.json();
}

/** Force-delete event immediately (no 10-day delay). Allowed only for Faculty Incharge and departments they allow. */
export async function forceDeleteEvent(id) {
  const res = await authFetch(`/api/v1/events/${id}/force`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to force-delete event');
  return data;
}

export async function updateEvent(id, formData) {
  const res = await fetch(`${BASE}/api/v1/events/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update event');
  }
  return res.json();
}

/** Generate a one-time upload link (12h expiry). Requires auth + event upload access. */
export async function createUploadLink() {
  const res = await authFetch('/api/v1/events/upload-link', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to create link');
  return data;
}

/** Suspend (turn off) an upload link immediately. Requires auth + event upload access. */
export async function suspendUploadLink(token) {
  const res = await authFetch(`/api/v1/events/upload-link/${token}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to suspend link');
  return data;
}

/** Validate upload link (public). */
export async function validateUploadLink(token) {
  const res = await fetch(`${BASE}/api/v1/events/upload-by-link/${token}`);
  return res.json().catch(() => ({ success: false, valid: false }));
}

/** Submit event via upload link (public, no auth). */
export async function createEventByLink(token, formData) {
  const res = await fetch(`${BASE}/api/v1/events/upload-by-link/${token}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload event');
  }
  return res.json();
}

/** Get departments allowed to access /uploadevent (core + extra). Requires auth + event upload access. */
export async function getEventUploadAllowed() {
  const res = await authFetch('/api/v1/events/upload-allowed');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch allowed departments');
  return data;
}

export async function addEventUploadDepartment(department) {
  const res = await authFetch('/api/v1/events/upload-allowed/add', {
    method: 'POST',
    body: JSON.stringify({ department }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to add department');
  return data;
}

export async function removeEventUploadDepartment(department) {
  const res = await authFetch('/api/v1/events/upload-allowed/remove', {
    method: 'POST',
    body: JSON.stringify({ department }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to remove department');
  return data;
}

/** Force-delete permissions: { allowed, canManage, data? }. Only Faculty Incharge can manage (canManage). */
export async function getForceDeleteAllowed() {
  const res = await authFetch('/api/v1/events/force-delete-allowed');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch force-delete permissions');
  return data;
}

export async function addForceDeleteDepartment(department) {
  const res = await authFetch('/api/v1/events/force-delete-allowed/add', {
    method: 'POST',
    body: JSON.stringify({ department }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to add');
  return data;
}

export async function removeForceDeleteDepartment(department) {
  const res = await authFetch('/api/v1/events/force-delete-allowed/remove', {
    method: 'POST',
    body: JSON.stringify({ department }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to remove');
  return data;
}

/** Faculty Incharge, Chairperson, Vice-Chairperson can see the Force delete permissions sidebar and page. */
export function canManageForceDeleteConfig(accountType) {
  return accountType === 'ADMIN' || accountType === 'Chairperson' || accountType === 'Vice-Chairperson';
}

const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  });
};

// Auth
export const AUTH_DEPARTMENTS = [
  'ADMIN',
  'Chairperson',
  'Vice-Chairperson',
  'Social Media and Promotion',
  'Technical',
  'Event Management',
  'Public Relation and Outreach',
  'Design',
  'Content and Documentation',
  'Photography and Videography',
  'Sponsorship and Marketing',
];

/** Display label for account type (e.g. ADMIN → "Faculty Incharge") */
export const ACCOUNT_TYPE_LABELS = {
  ADMIN: 'Faculty Incharge',
  Chairperson: 'Chairperson',
  'Vice-Chairperson': 'Vice-Chairperson',
};
export function getAccountTypeLabel(accountType) {
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType ?? '';
}

/** True if user can access "Manage society" (all departments) */
export const SOCIETY_ROLES = ['ADMIN', 'Chairperson', 'Vice-Chairperson'];
export function isSocietyRole(accountType) {
  return SOCIETY_ROLES.includes(accountType);
}

/** Core roles that can always access /uploadevent. Extra roles come from server (user.canManageEvents). */
export function canManageEvents(accountType) {
  return accountType === 'Event Management' || isSocietyRole(accountType);
}

/** Only these roles can add/remove departments in the event-upload allowed list (Faculty Incharge, Chairperson, Vice-Chairperson, Event Management). */
export function canManageEventUploadConfig(accountType) {
  return canManageEvents(accountType);
}

/** Prefer server-computed flag; fallback to static check (e.g. before /me loads). */
export function userCanManageEvents(user) {
  if (!user) return false;
  return user.canManageEvents === true || (user.canManageEvents !== false && canManageEvents(user.accountType));
}

export async function sendOTP({ email, department }) {
  const res = await authFetch('/api/v1/auth/sendotp', {
    method: 'POST',
    body: JSON.stringify({ email, department }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
}

/** Poll for OTP using one-time pollToken (for autofill). Returns { otp } when available. */
export async function getOtpForAutofill(pollToken) {
  if (!pollToken) throw new Error('Token required');
  const res = await fetch(`${BASE}/api/v1/auth/otp-for-autofill?token=${encodeURIComponent(pollToken)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to get OTP');
  return data;
}

export async function signup(body) {
  const res = await authFetch('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const res = await authFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Login failed');
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${BASE}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email?.trim()?.toLowerCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
  return data;
}

export async function resetPasswordWithToken({ token, password, confirmPassword }) {
  const res = await fetch(`${BASE}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password, confirmPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to reset password');
  return data;
}

export async function changePassword({ oldPassword, newPassword, confirmPassword }) {
  const res = await authFetch('/api/v1/auth/changepassword', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to change password');
  return data;
}

export async function deleteAccount() {
  const res = await authFetch('/api/v1/auth/account', { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to delete account');
  return data;
}

export async function getMe() {
  const res = await authFetch('/api/v1/auth/me');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Not authenticated');
  return data;
}

/** Stream enrich-profile SSE events; onMessage({ event, message }) for each event; resolves when stream ends. */
export function enrichProfileSSE({ onMessage }) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE}/api/v1/auth/enrich-profile`, { credentials: 'include', headers }).then((res) => {
    if (!res.ok) throw new Error('Enrich failed');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    function read() {
      return reader.read().then(({ done, value }) => {
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);
            } catch (_) { }
          }
        }
        return read();
      });
    }
    return read();
  });
}

export async function logout() {
  try {
    const res = await authFetch('/api/v1/auth/logout', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Logout failed');
    return data;
  } finally {
    clearAuthToken();
  }
}

// Admin: signup config (allowed emails per department)
export async function getSignupConfigs() {
  const res = await authFetch('/api/v1/auth/signup-config');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch config');
  return data;
}

export async function addSignupEmail(department, email) {
  const res = await authFetch('/api/v1/auth/signup-config/add', {
    method: 'POST',
    body: JSON.stringify({ department, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to add email');
  return data;
}

export async function removeSignupEmail(department, email) {
  const res = await authFetch('/api/v1/auth/signup-config/remove', {
    method: 'POST',
    body: JSON.stringify({ department, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to remove email');
  return data;
}

// Profile (auth required)
export async function updateProfile(payload) {
  const res = await authFetch('/api/v1/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to update profile');
  return data;
}

export async function updateAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/auth/profile/avatar`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to update avatar');
  return data;
}

// Search people (team members + users with profile and predefinedProfile)
export async function getSearchPeople(q) {
  const params = new URLSearchParams();
  if (q != null && String(q).trim()) params.set('q', String(q).trim());
  const res = await authFetch(`/api/v1/auth/search-people?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Search failed');
  return data;
}

// Send signup invite email to a predefined profile (not yet registered)
export async function sendSignupInvite(email) {
  const res = await authFetch('/api/v1/auth/send-signup-invite', {
    method: 'POST',
    body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to send invite');
  return data;
}

/** All users (society role only). For Manage Society "Show list". */
export async function getAllUsers() {
  const res = await authFetch('/api/v1/auth/all-users');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
}

/** All people: users + predefined-only + team members, sorted. Society role only. */
export async function getAllPeople() {
  const res = await authFetch('/api/v1/auth/all-people');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch people');
  return data;
}

/** Activity logs for a user. Society roles only (Faculty Incharge, Chairperson, Vice-Chairperson). */
export async function getActivityLogs(userId) {
  const res = await authFetch(`/api/v1/activity-logs/${encodeURIComponent(userId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch activity logs');
  return data;
}

// Team (manage your department members; society roles pass department)
export async function getTeamDepartments() {
  const res = await authFetch('/api/v1/team/departments');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch departments');
  return data;
}

export async function getTeamMembers(department) {
  const params = new URLSearchParams();
  if (department) params.set('department', department);
  const res = await authFetch(`/api/v1/team/members?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch team');
  return data;
}

/** Roster from signup config: allowed emails with registered (user) or not (predefined), for table in Manage team */
export async function getDepartmentRoster(department) {
  const params = new URLSearchParams();
  if (department) params.set('department', department);
  const res = await authFetch(`/api/v1/team/roster?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to fetch roster');
  return data;
}

export async function addTeamMember(payload) {
  const res = await authFetch('/api/v1/team/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to add member');
  return data;
}

/** Upload team member photo to Cloudinary. Returns { url }. */
export async function uploadTeamPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/team/upload-photo`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to upload photo');
  return data;
}

/** Create team invite link for a department. Pass { department } for society; core team uses accountType. */
export async function createTeamInviteLink(payload = {}) {
  const res = await authFetch('/api/v1/team/invite-link', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to create invite link');
  return data;
}

/** Suspend (turn off) a team invite link immediately. */
export async function suspendTeamInviteLink(token) {
  const res = await authFetch(`/api/v1/team/invite-link/${token}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to suspend link');
  return data;
}

/** Validate team invite link (public). */
export async function validateTeamInviteLink(token) {
  const res = await fetch(`${BASE}/api/v1/team/join/${token}`);
  return res.json().catch(() => ({ success: false, valid: false }));
}

/** Submit member form via invite link (public). Adds member to the link's department. */
export async function addTeamMemberByInviteLink(token, payload) {
  const res = await fetch(`${BASE}/api/v1/team/join/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to join team');
  return data;
}

/** Upload team photo via invite link (public). Valid token required. Returns { url }. Pass previousPhotoUrl when reuploading to delete the old one from Cloudinary. */
export async function uploadTeamPhotoByInviteLink(token, file, previousPhotoUrl = '') {
  const formData = new FormData();
  formData.append('photo', file);
  if (previousPhotoUrl && typeof previousPhotoUrl === 'string') {
    formData.append('previousPhotoUrl', previousPhotoUrl.trim());
  }
  const res = await fetch(`${BASE}/api/v1/team/join/${token}/upload-photo`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to upload photo');
  return data;
}

export async function updateTeamMember(id, payload) {
  const res = await authFetch(`/api/v1/team/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to update member');
  return data;
}

export async function deleteTeamMember(id, body = {}) {
  const res = await authFetch(`/api/v1/team/members/${id}`, {
    method: 'DELETE',
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to delete member');
  return data;
}

export async function uploadTeamExcel(file, department) {
  const formData = new FormData();
  formData.append('file', file);
  if (department) formData.append('department', department);
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/team/members/upload-excel`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to upload');
  return data;
}

export async function downloadTeamTemplate() {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/v1/team/template`, { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'team_members_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// Jam the Web judging
export async function getJamTheWebTeams(sortBy = "id") {
  const params = new URLSearchParams();
  if (sortBy === "score") params.set("sort", "score");
  const res = await authFetch(`/api/v1/jamtheweb?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to fetch Jam the Web data");
  return data;
}

export async function submitJamTheWebScores(teams) {
  const res = await authFetch("/api/v1/jamtheweb/submit", {
    method: "POST",
    body: JSON.stringify({ teams }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to submit scores");
  return data;
}


