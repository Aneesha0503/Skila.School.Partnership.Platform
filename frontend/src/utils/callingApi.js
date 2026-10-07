/**
 * Skila AI Telugu-First Calling Platform API Client
 * Facilitates all REST interactions for voice calls, campaigns, hot leads, transcripts, and settings.
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('skila_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function fetchCallingDashboard() {
  const res = await fetch('/api/calling/dashboard', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
  return res.json();
}

export async function initiateAICall({ school_id, school_name, phone_number, district, principal_name, force_mock = false }) {
  const res = await fetch('/api/calling/initiate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      school_id: school_id || null,
      school_name: school_name || 'School',
      phone_number: phone_number || '',
      district: district || '',
      principal_name: principal_name || 'Principal',
      force_mock
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Call initiate failed' }));
    throw new Error(err.detail || 'Call initiate failed');
  }
  return res.json();
}

export async function sendSpeechTurn(call_id, user_speech) {
  const res = await fetch('/api/calling/speech-turn', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ call_id, user_speech })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Speech turn failed' }));
    throw new Error(err.detail || 'Speech turn failed');
  }
  return res.json();
}

export async function endAICall(call_id) {
  const res = await fetch(`/api/calling/end/${call_id}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'End call failed' }));
    throw new Error(err.detail || 'End call failed');
  }
  return res.json();
}

export async function fetchCallsHistory({ interest = 'All', status = 'All', search = '' } = {}) {
  const params = new URLSearchParams();
  if (interest && interest !== 'All') params.append('interest', interest);
  if (status && status !== 'All') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`/api/calling/calls?${params.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch calls');
  return res.json();
}

export async function fetchCallDetails(call_id) {
  const res = await fetch(`/api/calling/calls/${call_id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch call details');
  return res.json();
}

export async function fetchHotLeads() {
  const res = await fetch('/api/calling/hot-leads', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch hot leads');
  return res.json();
}

export async function fetchFollowups() {
  const res = await fetch('/api/calling/followups', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch followups');
  return res.json();
}

export async function completeFollowup(followup_id) {
  const res = await fetch(`/api/calling/followups/${followup_id}/complete`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to mark followup complete');
  return res.json();
}

export async function fetchDemos() {
  const res = await fetch('/api/calling/demos', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch demos');
  return res.json();
}

export async function fetchCampaigns() {
  const res = await fetch('/api/calling/campaigns', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function createCampaign(data) {
  const res = await fetch('/api/calling/campaigns', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return res.json();
}

export async function triggerCampaignAction(campaign_id, action) {
  const res = await fetch(`/api/calling/campaigns/${campaign_id}/action?action=${action}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to update campaign');
  return res.json();
}

export async function fetchCallingAnalytics() {
  const res = await fetch('/api/calling/analytics', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch calling analytics');
  return res.json();
}

export async function fetchCallingSettings() {
  const res = await fetch('/api/calling/settings', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateCallingSettings(data) {
  const res = await fetch('/api/calling/settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function saveCarrierCredentials(data) {
  const res = await fetch('/api/calling/settings/credentials', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save credentials' }));
    throw new Error(err.detail || 'Failed to save credentials');
  }
  return res.json();
}

export async function testPlivoConnection(data = {}) {
  const res = await fetch('/api/calling/settings/test-plivo', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Connection test failed' }));
    throw new Error(err.error || err.detail || 'Connection test failed');
  }
  return res.json();
}

