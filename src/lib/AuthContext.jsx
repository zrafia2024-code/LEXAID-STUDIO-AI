import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

/**
 * Saves or updates user record in public.pwa_users table
 */
export const syncUserToPwaUsers = async (userObj) => {
  if (!userObj || !userObj.email) return { success: false, reason: 'No user email' };
  const payload = {
    email: userObj.email.toLowerCase().trim(),
    name: userObj.full_name || userObj.name || userObj.email.split('@')[0],
    base44_user_id: userObj.id || null,
  };

  let clientSynced = false;

  // 1. Direct Supabase Client Upsert into public.pwa_users
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pwa_users')
        .upsert(payload, { onConflict: 'email' });

      if (!error) {
        clientSynced = true;
      } else {
        console.warn("Client sync to public.pwa_users:", error.message);
        if (error.code === '42501') {
          console.info(
            "Note: public.pwa_users has RLS enabled. If writes are rejected, run in Supabase SQL editor:\n" +
            'CREATE POLICY "insert pwa_users" ON public.pwa_users FOR INSERT WITH CHECK (true);\n' +
            'CREATE POLICY "update pwa_users" ON public.pwa_users FOR UPDATE USING (true);'
          );
        }
      }
    } catch (err) {
      console.warn("Direct pwa_users upsert error:", err);
    }
  }

  // 2. Server API fallback/sync (utilizes backend client or service_role if available)
  try {
    const res = await fetch('/api/sync-pwa-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, user: json.user };
    }
  } catch {
    // Non-blocking
  }

  return { success: clientSynced };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let subscription = null;

    // Remove legacy fake mock user from localStorage if present
    try {
      const stored = localStorage.getItem('lexaid_local_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed?.email === 'google.citizen@lexaid.pk' ||
          parsed?.email === 'citizen@lexaid.pk' ||
          parsed?.full_name === 'Google User' ||
          parsed?.full_name === 'Pakistani Citizen'
        ) {
          localStorage.removeItem('lexaid_local_user');
        }
      }
    } catch {
      localStorage.removeItem('lexaid_local_user');
    }

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Check Supabase session from real cloud project
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("Supabase session check:", error.message);
          }
          if (session?.user) {
            const activeUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              role: 'user',
            };
            setUser(activeUser);
            setIsAuthenticated(true);
            syncUserToPwaUsers(activeUser);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }

          // 2. Listen to Supabase auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const activeUser = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                role: 'user',
              };
              setUser(activeUser);
              setIsAuthenticated(true);
              syncUserToPwaUsers(activeUser);
            } else {
              setUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem('lexaid_local_user');
            }
          });
          subscription = authListener?.subscription;
        } else {
          // Only check local session if a user explicitly registered/logged in locally
          const stored = localStorage.getItem('lexaid_local_user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.email && !parsed.email.includes('lexaid.pk')) {
                setUser(parsed);
                setIsAuthenticated(true);
              } else {
                localStorage.removeItem('lexaid_local_user');
                setUser(null);
                setIsAuthenticated(false);
              }
            } catch {
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
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
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message?.toLowerCase().includes("email not confirmed")) {
            const confirmErr = new Error(
              "Your account was created, but its email has not been confirmed yet in Supabase.\n\n" +
              "To confirm this account instantly in your Supabase Dashboard:\n" +
              "1. Go to Authentication → Users\n" +
              "2. Click the '...' menu next to your email\n" +
              "3. Select 'Confirm user'\n\n" +
              "Once confirmed, sign in will work immediately."
            );
            confirmErr.isEmailNotConfirmed = true;
            throw confirmErr;
          }
          throw error;
        }
        const loggedUser = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          role: 'user',
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
        // Automatically save/update user in public.pwa_users table
        await syncUserToPwaUsers(loggedUser);
        return loggedUser;
      } catch (err) {
        throw err;
      }
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
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) {
          if (
            error.message?.toLowerCase().includes('rate limit') ||
            error.status === 429
          ) {
            const rateLimitError = new Error(
              "Supabase Email Rate Limit Exceeded\n\n" +
              "Supabase's built-in email service allows only 3 confirmation emails per hour.\n\n" +
              "To fix this immediately and allow unlimited instant signups:\n" +
              "1. Go to your Supabase Dashboard → Authentication → Providers → Email\n" +
              "2. Turn OFF 'Confirm email'\n" +
              "3. Click Save\n\n" +
              "Once turned off, accounts are created instantly without waiting for email verification."
            );
            rateLimitError.isRateLimit = true;
            throw rateLimitError;
          }
          throw error;
        }
        if (data?.user) {
          const newUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || data.user.user_metadata?.full_name || email.split('@')[0],
            role: 'user',
          };
          setUser(newUser);
          setIsAuthenticated(true);
          // Automatically save new user to public.pwa_users table
          await syncUserToPwaUsers(newUser);
          return newUser;
        }
      } catch (err) {
        throw err;
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
      // 1. Verify if Google OAuth is configured and enabled in Supabase
      try {
        const checkRes = await fetch("/api/check-google-auth");
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.enabled) {
            const detailedError = new Error(
              "Google Sign-In is disabled in your Supabase project.\n\n" +
              "To enable it:\n" +
              "1. Open Supabase Dashboard → Authentication → Providers → Google\n" +
              "2. Toggle 'Enable Google provider' to ON\n" +
              "3. Enter your Google Client ID & Client Secret\n" +
              `4. Add callback URL to Google Cloud Console: ${checkData.callbackUrl}`
            );
            detailedError.isGoogleDisabled = true;
            detailedError.details = checkData;
            throw detailedError;
          }
        }
      } catch (err) {
        if (err.isGoogleDisabled) throw err;
        // Non-blocking if network fails
      }

      // 2. Initiate OAuth with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        if (
          error.message?.includes('provider is not enabled') ||
          error.message?.includes('Unsupported provider') ||
          error.code === 'validation_failed'
        ) {
          const detailedError = new Error(
            "Google sign-in is not enabled in your Supabase project yet."
          );
          detailedError.isGoogleDisabled = true;
          throw detailedError;
        }
        throw error;
      }

      if (data?.url) {
        // In iframe environment, open in top window or popup to prevent X-Frame-Options denial
        if (window.self !== window.top) {
          window.open(data.url, "_blank", "width=520,height=650");
        } else {
          window.location.href = data.url;
        }
      }
    } else {
      throw new Error("Supabase is not configured yet. Please sign in with email and password.");
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
        syncUserToPwaUsers,
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
