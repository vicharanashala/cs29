import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


export type Role = 'student' | 'admin';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  alternateEmail?: string;
  mobile?: string;
  collegeName?: string;
  collegeAddress?: string;
  collegeWebsite?: string;
  departmentName?: string;
  departmentWebpage?: string;
  programme?: string;
  branch?: string;
  gpa?: string;
  cvFileName?: string;
}

export interface User extends UserProfile {
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string) => Promise<void>;
  signup: (name: string, email: string, role: Role, cvFileName?: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const u = JSON.parse(storedUser) as User;
        const first = (u.firstName || '').trim();
        const last = (u.lastName || '').trim();
        if (first || last) {
          u.name = [first, last].filter(Boolean).join(' ');
        }
        return u;
      }
    } catch {
      localStorage.removeItem('auth_user');
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const login = async (email: string) => {
    // Clear guest ratings on login — prevents anonymous votes leaking into account session
    localStorage.removeItem('vins_faq_ratings_guest');

    // Automatically determine role based on email ID
    const role: Role = email === 'admin@vins.in' ? 'admin' : 'student';
    
    if (role === 'admin') {
      const adminUser = { name: 'Super Admin', email, role: 'admin' as const };
      localStorage.setItem('auth_user', JSON.stringify(adminUser));
      setUser(adminUser);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(email)}`);
      if (res.ok) {
        const dbUser = await res.json();
        const first = (dbUser.firstName || '').trim();
        const last = (dbUser.lastName || '').trim();
        const displayName = (first || last)
          ? [first, last].filter(Boolean).join(' ')
          : (dbUser.name || email.split('@')[0]);

        setUser({
          name: displayName,
          email,
          role: 'student',
          firstName: dbUser.firstName || '',
          lastName: dbUser.lastName || '',
          alternateEmail: dbUser.alternateEmail || '',
          mobile: dbUser.mobile || '',
          collegeName: dbUser.collegeName || '',
          collegeAddress: dbUser.collegeAddress || '',
          collegeWebsite: dbUser.collegeWebsite || '',
          departmentName: dbUser.departmentName || '',
          departmentWebpage: dbUser.departmentWebpage || '',
          programme: dbUser.programme || '',
          branch: dbUser.branch || '',
          gpa: dbUser.gpa || '',
          cvFileName: dbUser.cvFileName || '',
        });
        return;
      }
    } catch (err) {
      console.error("Failed to fetch user profile during login, fallback to mock", err);
    }

    setUser({
      name: email.split('@')[0],
      email,
      role: 'student',
    });
  };

  const signup = async (name: string, email: string, role: Role, cvFileName?: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, cvFileName }),
      });
    } catch (err) {
      console.error("Signup backend request failed:", err);
    }

    setUser({
      name,
      email,
      role,
      cvFileName,
    });
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (user?.email) {
      fetch(`${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      .then(res => {
        if (!res.ok) {
          console.error("Server returned error on profile update");
        }
      })
      .catch(err => console.error("Failed to persist profile update:", err));
    }

    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      // If firstName/lastName were provided, update display name
      const first = (data.firstName ?? prev.firstName ?? '').trim();
      const last = (data.lastName ?? prev.lastName ?? '').trim();
      if (first || last) {
        updated.name = [first, last].filter(Boolean).join(' ');
      }
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('vins_faq_viewed');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
