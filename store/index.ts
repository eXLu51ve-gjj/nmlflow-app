import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  citizenship?: string;
  avatar: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  teamMemberId?: string;
  dailyRate?: number;
  carBonus?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  status: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string;
  assigneeIds?: string[];
  tags: string[];
  comments: Comment[];
  attachments: string[];
  projectId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  isAdmin: boolean;
  dailyRate: number;
  carBonus: number;
}

export interface WorkDay {
  id: string;
  memberId: string;
  date: string;
  withCar: boolean;
  isDouble: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  attachments: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  columns: { id: string; name: { ru: string; en: string }; color: string }[];
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
  
  // Data
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  
  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  
  workDays: WorkDay[];
  setWorkDays: (days: WorkDay[]) => void;
  
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  
  // Settings
  salaryPayday: number;
  setSalaryPayday: (day: number) => void;
  
  showAllTasks: boolean;
  setShowAllTasks: (value: boolean) => void;
  
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  
  chatNotificationsEnabled: boolean;
  setChatNotificationsEnabled: (value: boolean) => void;
  
  // Background Theme
  backgroundId: string;
  setBackgroundId: (id: string) => void;
  
  // Custom Background Image
  customBackgroundUri: string | null;
  setCustomBackgroundUri: (uri: string | null) => void;
  
  // Background Overlay Opacity
  backgroundOverlay: number;
  setBackgroundOverlay: (value: number) => void;
  
  // UI Elements Opacity
  uiOpacity: number;
  setUiOpacity: (value: number) => void;
  
  // Selected Project (for drawer navigation)
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (value: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: () => set({ isAuthenticated: false, user: null }),
  
  // Data
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  
  teamMembers: [],
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  
  workDays: [],
  setWorkDays: (workDays) => set({ workDays }),
  
  chatMessages: [],
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages, message] 
  })),
  
  projects: [],
  setProjects: (projects) => set({ projects }),
  
  // Settings
  salaryPayday: 1,
  setSalaryPayday: (salaryPayday) => set({ salaryPayday }),
  
  showAllTasks: true,
  setShowAllTasks: (showAllTasks) => set({ showAllTasks }),
  
  notificationsEnabled: true,
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  
  chatNotificationsEnabled: true,
  setChatNotificationsEnabled: (chatNotificationsEnabled) => set({ chatNotificationsEnabled }),
  
  // Background Theme
  backgroundId: 'default',
  setBackgroundId: (backgroundId) => set({ backgroundId }),
  
  // Custom Background Image
  customBackgroundUri: null,
  setCustomBackgroundUri: (customBackgroundUri) => set({ customBackgroundUri }),
  
  // Background Overlay Opacity
  backgroundOverlay: 0.4,
  setBackgroundOverlay: (backgroundOverlay) => set({ backgroundOverlay }),
  
  // UI Elements Opacity
  uiOpacity: 1,
  setUiOpacity: (uiOpacity) => set({ uiOpacity }),
  
  // Selected Project
  selectedProjectId: null,
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  
  // Loading
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
