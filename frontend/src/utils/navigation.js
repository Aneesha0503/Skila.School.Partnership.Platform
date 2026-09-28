/**
 * Navigation and History synchronization utilities for Skila Partnership Platform.
 * Supports native HTML5 History API (backward and forward browser navigation).
 */

export function parseSearchParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  return {
    state: params.get('state') || '',
    district: params.get('district') || '',
    revenue_division: params.get('rev_div') || '',
    mandal: params.get('mandal') || '',
    local_body_name: params.get('local_body') || '',
    village_locality_ward: params.get('ward') || '',
    schoolId: params.get('school') || null,
    tab: params.get('tab') || 'info',
    modal: params.get('modal') || null,
    editId: params.get('editId') || null
  };
}

export function buildSearchParams({
  hierarchy = {},
  schoolId = null,
  tab = null,
  modal = null,
  editId = null
} = {}) {
  const params = new URLSearchParams();

  if (hierarchy?.state) params.set('state', hierarchy.state);
  if (hierarchy?.district) params.set('district', hierarchy.district);
  if (hierarchy?.revenue_division) params.set('rev_div', hierarchy.revenue_division);
  if (hierarchy?.mandal) params.set('mandal', hierarchy.mandal);
  if (hierarchy?.local_body_name) params.set('local_body', hierarchy.local_body_name);
  if (hierarchy?.village_locality_ward) params.set('ward', hierarchy.village_locality_ward);

  if (schoolId) {
    params.set('school', schoolId);
    if (tab && tab !== 'info') {
      params.set('tab', tab);
    }
  }

  if (modal) {
    params.set('modal', modal);
    if (editId) {
      params.set('editId', editId);
    }
  }

  return params.toString();
}

export function computeNextHierarchy(currentHierarchy, level, value) {
  const next = { ...currentHierarchy, [level]: value };
  if (level === 'state') {
    next.district = '';
    next.revenue_division = '';
    next.mandal = '';
    next.local_body_name = '';
    next.village_locality_ward = '';
  } else if (level === 'district') {
    next.revenue_division = '';
    next.mandal = '';
    next.local_body_name = '';
    next.village_locality_ward = '';
  } else if (level === 'revenue_division') {
    next.mandal = '';
    next.local_body_name = '';
    next.village_locality_ward = '';
  } else if (level === 'mandal') {
    next.local_body_name = '';
    next.village_locality_ward = '';
  } else if (level === 'local_body_name') {
    next.village_locality_ward = '';
  }
  return next;
}

export function computeStepBackHierarchy(current) {
  const next = { ...current };
  if (next.village_locality_ward) {
    next.village_locality_ward = '';
  } else if (next.local_body_name) {
    next.local_body_name = '';
  } else if (next.mandal) {
    next.mandal = '';
  } else if (next.revenue_division) {
    next.revenue_division = '';
  } else if (next.district) {
    next.district = '';
  } else if (next.state) {
    next.state = '';
  }
  return next;
}
