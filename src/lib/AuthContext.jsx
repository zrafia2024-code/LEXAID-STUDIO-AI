import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let subscription = null;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Check Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("Supabase session check:", error.message);
          }
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              role: 'user',
            });
            setIsAuthenticated(true);
          } else {
            checkLocalSession();
          }

          // 2. Listen to Supabase auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                role: 'user',
              });
              setIsAuthenticated(true);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem('lexaid_local_user');
            }
          });
          subscription = authListener?.subscription;
        } else {
          // Local storage session fallback for development / preview
          checkLocalSession();
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
        checkLocalSession();
      } finally {
        setIsLoadingAuth(false);
      }
    };

    const checkLocalSession = () => {
      try {
        const stored = localStorage.getItem('lexaid_local_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          // Default demo citizen session so user can immediately test the app
          const defaultUser = {
            id: 'demo-citizen-1',
            email: 'citizen@lexaid.pk',
            full_name: 'Pakistani Citizen',
            role: 'user',
          };
          setUser(defaultUser);
          setIsAuthenticated(true);
          localStorage.setItem('lexaid_local_user', JSON.stringify(defaultUser));
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const loggedUser = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        role: 'user',
      };
      setUser(loggedUser);
      setIsAuthenticated(true);
      return loggedUser;
    } else {
      const localUser = {
        id: 'user-' + Date.now(),
        email,
        full_name: email.split('@')[0],
        role: 'user',
      };
      setUser(localUser);
      setIsAuthenticated(true);
      localStorage.setItem('lexaid_local_user', JSON.stringify(localUser));
      return localUser;
    }
  };

  const register = async (email, password, fullName = '') => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      if (data?.user) {
        const newUser = {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || email.split('@')[0],
          role: 'user',
        };
        setUser(newUser);
        setIsAuthenticated(true);
        return newUser;
      }
    } else {
      const localUser = {
        id: 'user-' + Date.now(),
        email,
        full_name: fullName || email.split('@')[0],
        role: 'user',
      };
      setUser(localUser);
      setIsAuthenticated(true);
      localStorage.setItem('lexaid_local_user', JSON.stringify(localUser));
      return localUser;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase sign out error:", err);
      }
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('lexaid_local_user');
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } else {
      const googleUser = {
        id: 'google-user-' + Date.now(),
        email: 'google.citizen@lexaid.pk',
        full_name: 'Google User',
        role: 'user',
      };
      setUser(googleUser);
      setIsAuthenticated(true);
      localStorage.setItem('lexaid_local_user', JSON.stringify(googleUser));
    }
  };

  const resetPassword = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        isSupabaseConfigured,
        login,
        register,
        logout,
        loginWithGoogle,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
