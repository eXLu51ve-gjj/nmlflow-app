// API Configuration
// Change this to your server URL
export const API_BASE_URL = 'https://your-domain.com'; // Replace with your actual domain

export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  me: '/api/auth/me',
  logout: '/api/auth/logout',
  heartbeat: '/api/auth/heartbeat',
  
  // Data
  tasks: '/api/tasks',
  team: '/api/team',
  workdays: '/api/workdays',
  chat: '/api/chat',
  settings: '/api/settings',
  projects: '/api/projects',
  leads: '/api/leads',
  activities: '/api/activities',
  users: '/api/users',
};
