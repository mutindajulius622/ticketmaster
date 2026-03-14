import { create } from 'zustand';
import authService from './authService';

export const useAppStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    profile: null,
    activeView: 'Dashboard',
    notifications: [],

    setUser: (user) => set({ user }),
    setProfile: (profile) => set((state) => ({
        profile: typeof profile === 'function' ? profile(state.profile) : profile
    })),

    setActiveView: (view) => set({ activeView: view }),

    addNotification: (message) => {
        const id = Date.now();
        set((state) => ({
            notifications: [...state.notifications, { id, message }]
        }));
        setTimeout(() => {
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            }));
        }, 5000);
    },

    logout: () => {
        authService.logout();
        set({ user: null, profile: null, activeView: 'Dashboard' });
    }
}));
