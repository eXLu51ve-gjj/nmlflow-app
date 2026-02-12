import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/constants/api';

// Dynamic base URL
let currentBaseUrl = '';

const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and base URL to requests
api.interceptors.request.use(async (config) => {
  // Set base URL from storage
  if (!currentBaseUrl) {
    currentBaseUrl = await SecureStore.getItemAsync('serverUrl') || '';
  }
  config.baseURL = currentBaseUrl;
  
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Server URL management
export const saveServerUrl = async (url: string) => {
  // Normalize URL
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  await SecureStore.setItemAsync('serverUrl', normalized);
  currentBaseUrl = normalized;
  return normalized;
};

export const getServerUrl = async () => {
  const url = await SecureStore.getItemAsync('serverUrl');
  currentBaseUrl = url || '';
  return url;
};

export const clearServerUrl = async () => {
  await SecureStore.deleteItemAsync('serverUrl');
  currentBaseUrl = '';
};

// Token management
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('token', token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync('token');
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post(API_ENDPOINTS.login, { email, password });
    if (res.data.token) {
      await saveToken(res.data.token);
    }
    return res.data;
  },
  
  register: async (data: { name: string; email: string; phone: string; password: string; inviteCode?: string }) => {
    const res = await api.post(API_ENDPOINTS.register, data);
    if (res.data.token) {
      await saveToken(res.data.token);
    }
    return res.data;
  },
  
  me: async () => {
    const res = await api.get(API_ENDPOINTS.me);
    return res.data;
  },
  
  logout: async () => {
    await api.post(API_ENDPOINTS.logout);
    await removeToken();
  },
  
  heartbeat: async () => {
    await api.post(API_ENDPOINTS.heartbeat);
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.tasks);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`${API_ENDPOINTS.tasks}/${id}`);
    return res.data;
  },
  
  create: async (data: any) => {
    const token = await getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        data.userId = payload.userId;
      } catch (e) {}
    }
    const res = await api.post(API_ENDPOINTS.tasks, data);
    return res.data;
  },
  
  update: async (id: string, data: any) => {
    // Add userId from token for activity logging
    const token = await getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        data.userId = payload.userId;
      } catch (e) {}
    }
    
    const res = await api.patch(`${API_ENDPOINTS.tasks}/${id}`, data);
    return res.data;
  },
  
  addComment: async (taskId: string, text: string) => {
    // Get current user ID from stored token
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    
    // Decode token to get userId
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const res = await api.post('/api/comments', { taskId, text, authorId: payload.userId });
    return res.data;
  },
};

// Team API
export const teamAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.team);
    return res.data;
  },
};

// Workdays API
export const workdaysAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.workdays);
    return res.data;
  },
};

// Chat API
export const chatAPI = {
  getMessages: async (userId?: string) => {
    const url = userId ? `${API_ENDPOINTS.chat}?userId=${userId}` : API_ENDPOINTS.chat;
    const res = await api.get(url);
    // API returns { messages: [...], hasAccess: true }
    return res.data.messages || res.data || [];
  },
  
  sendMessage: async (text: string, attachments: string[] = []) => {
    // Get current user ID from stored token
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    
    // Decode token to get userId (simple base64 decode of payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const res = await api.post(API_ENDPOINTS.chat, { 
      text, 
      attachments,
      authorId: payload.userId 
    });
    return res.data;
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const res = await api.get(API_ENDPOINTS.settings);
    return res.data;
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.projects);
    return res.data;
  },
};

// Leads API (for admin)
export const leadsAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.leads);
    return res.data;
  },
  
  update: async (id: string, data: any) => {
    const res = await api.patch(`${API_ENDPOINTS.leads}/${id}`, data);
    return res.data;
  },
};

// Activities API
export const activitiesAPI = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.activities);
    return res.data;
  },
};

// Users API
export const usersAPI = {
  update: async (id: string, data: { name?: string; phone?: string; city?: string; citizenship?: string; avatar?: string }) => {
    const res = await api.patch(`${API_ENDPOINTS.users}/${id}`, data);
    return res.data;
  },
};

export default api;
