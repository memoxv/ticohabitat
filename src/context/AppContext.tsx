'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  userId: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  verifiedPhone: string | null;
  emailVerified: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserSession | null;
  login: (email: string, role?: 'USER' | 'ADMIN', phone?: string, name?: string, password?: string, isSignUp?: boolean) => Promise<UserSession | null>;
  logout: () => void;
  favorites: string[]; // Property IDs
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  phoneVerified: string | null;
  verifyPhoneInSession: (phone: string) => void;
  refreshSession: () => Promise<UserSession | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<UserSession | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [phoneVerified, setPhoneVerified] = useState<string | null>(null);

  // Helper to sync user favorites from server
  const syncUserFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      if (data && Array.isArray(data.ids)) {
        setFavorites(data.ids);
        localStorage.setItem('favorites', JSON.stringify(data.ids));
      }
    } catch (e) {
      console.error('Failed to sync favorites from server:', e);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    // 1. Theme (Forced dark mode always)
    setTheme('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');

    // 2. Favorites (Local fallback)
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error(e);
      }
    }

    // 3. User & Verified Phone
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserSession;
        setUser(parsed);
        if (parsed.verifiedPhone) {
          setPhoneVerified(parsed.verifiedPhone);
        }
        // Async sync of favorites from database upon mount
        fetch('/api/favorites')
          .then((res) => res.json())
          .then((data) => {
            if (data && Array.isArray(data.ids)) {
              setFavorites(data.ids);
              localStorage.setItem('favorites', JSON.stringify(data.ids));
            }
          })
          .catch((e) => console.error('Failed to sync favorites on mount:', e));
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Fresh session sync from database to solve verification caches
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          const updatedUser: UserSession = {
            userId: data.session.userId,
            email: data.session.email,
            name: data.session.name || null,
            role: data.session.role,
            verifiedPhone: data.session.verifiedPhone || null,
            emailVerified: data.session.emailVerified,
          };
          setUser(updatedUser);
          localStorage.setItem('user_session', JSON.stringify(updatedUser));
          if (updatedUser.verifiedPhone) {
            setPhoneVerified(updatedUser.verifiedPhone);
          }
        }
      })
      .catch((e) => console.error('Failed to sync session on mount:', e));
  }, []);

  const toggleTheme = () => {
    // Light mode disabled, always dark
    setTheme('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  };

  const login = async (
    email: string,
    role: 'USER' | 'ADMIN' = 'USER',
    phone?: string,
    name?: string,
    password?: string,
    isSignUp?: boolean
  ): Promise<UserSession | null> => {
    const mockUser: UserSession = {
      userId: role === 'ADMIN' ? 'admin-id-123' : 'user-id-456',
      email,
      name: name || (role === 'ADMIN' ? 'Admin TicoHabitat' : 'Usuario Costa Rica'),
      role,
      verifiedPhone: phone || (role === 'ADMIN' ? '88888888' : null),
      emailVerified: role === 'ADMIN',
    };
    
    // Call server session cookie setter to register/upsert in DB and get the real database userId!
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mockUser, password, isSignUp }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user_session', JSON.stringify(data.user));
        if (data.user.verifiedPhone) {
          setPhoneVerified(data.user.verifiedPhone);
        }
        showToast(`Sesión iniciada como ${data.user.name}`, 'success');
        
        // Sync user favorites from server
        try {
          const favRes = await fetch('/api/favorites');
          const favData = await favRes.json();
          if (favData && Array.isArray(favData.ids)) {
            setFavorites(favData.ids);
            localStorage.setItem('favorites', JSON.stringify(favData.ids));
          }
        } catch (e) {
          console.error(e);
        }
        
        return data.user;
      } else if (data.error) {
        showToast(data.error, 'error');
        return null;
      }
    } catch (e) {
      console.error('Failed to sync server cookie:', e);
    }

    // Fallback if fetch fails
    setUser(mockUser);
    localStorage.setItem('user_session', JSON.stringify(mockUser));
    if (mockUser.verifiedPhone) {
      setPhoneVerified(mockUser.verifiedPhone);
    }
    showToast(`Sesión iniciada como ${mockUser.name}`, 'success');
    return mockUser;
  };

  const logout = async () => {
    setUser(null);
    setPhoneVerified(null);
    localStorage.removeItem('user_session');
    
    // Clear favorites on logout!
    setFavorites([]);
    localStorage.removeItem('favorites');
    
    // Destroy server session cookie BEFORE redirecting (must complete to avoid restore race)
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to destroy server session:', e);
    }

    showToast('Sesión cerrada correctamente', 'info');
    
    // Redirect to home page immediately to clear caches and ensure session-private routes are left cleanly
    window.location.replace('/');
  };

  const toggleFavorite = (propertyId: string) => {
    if (!user) {
      showToast('Debes iniciar sesión para guardar favoritos.', 'error');
      return;
    }

    let nextFavs: string[];
    if (favorites.includes(propertyId)) {
      nextFavs = favorites.filter((id) => id !== propertyId);
      showToast('Eliminado de favoritos', 'info');
    } else {
      nextFavs = [...favorites, propertyId];
      showToast('Guardado en favoritos', 'success');
    }
    setFavorites(nextFavs);
    localStorage.setItem('favorites', JSON.stringify(nextFavs));

    // Async sync to server
    fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    }).catch(console.error);
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const verifyPhoneInSession = (phone: string) => {
    setPhoneVerified(phone);
    if (user) {
      const updatedUser = { ...user, verifiedPhone: phone };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      // Sync cookie
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch(console.error);
    }
  };

  const refreshSession = async (): Promise<UserSession | null> => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.session) {
        const updatedUser: UserSession = {
          userId: data.session.userId,
          email: data.session.email,
          name: data.session.name || null,
          role: data.session.role,
          verifiedPhone: data.session.verifiedPhone || null,
          emailVerified: data.session.emailVerified,
        };
        setUser(updatedUser);
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
        if (updatedUser.verifiedPhone) {
          setPhoneVerified(updatedUser.verifiedPhone);
        } else {
          setPhoneVerified(null);
        }
        return updatedUser;
      } else {
        setUser(null);
        setPhoneVerified(null);
        localStorage.removeItem('user_session');
        return null;
      }
    } catch (e) {
      console.error('Failed to refresh session:', e);
      return user;
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        login,
        logout,
        favorites,
        toggleFavorite,
        isFavorite,
        toasts,
        showToast,
        removeToast,
        phoneVerified,
        verifyPhoneInSession,
        refreshSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
