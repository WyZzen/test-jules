import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';
import axios from 'axios'; // Import axios

// Simple logger for demonstration
const _logger = {
    info: (...args) => console.log('[AuthContext INFO]', ...args),
    error: (...args) => console.error('[AuthContext ERROR]', ...args),
    warn: (...args) => console.warn('[AuthContext WARN]', ...args),
};

const AuthContext = createContext(null);

// Define the backend API URL. Adjust port if your C# backend runs on a different one.
// This should ideally come from an environment variable.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Default to 5000 if not set (check your C# launchSettings)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores Supabase auth user
  const [profile, setProfile] = useState(null); // Stores user profile from C# backend
  const [loading, setLoading] = useState(true);

  const fetchProfileFromBackend = async (session) => {
    if (!session || !session.user || !session.access_token) {
        _logger.info('No active session or access token to fetch profile from backend.');
        setProfile(null);
        return;
    }
    _logger.info('Fetching user profile from C# backend for user:', session.user.id);
    try {
        const response = await axios.get(`${API_URL}/api/profiles/me`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        setProfile(response.data); // response.data should be ProfileDto
        _logger.info('User profile fetched from C# backend:', response.data);
    } catch (error) {
        _logger.error('Error fetching user profile from C# backend:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
            _logger.warn('Profile not found in backend for user:', session.user.id, "- User might need to complete profile setup or a profile record is missing.");
            setProfile(null); // Or a default profile indicating no specific role / guest
        } else {
            // For other errors (network, server error), also set profile to null or handle appropriately
            setProfile(null);
        }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        _logger.error("Error getting initial session:", sessionError);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileFromBackend(session);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        _logger.info('Auth state changed:', event, session);
        setLoading(true);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfileFromBackend(session);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // If token is refreshed, user is still signed in, potentially re-fetch profile if it can change
          // or if there was an issue fetching it initially.
          // For now, assume profile is stable during session unless explicitly changed.
          // If profile was null and we have a session, try fetching again.
          if (!profile) {
            _logger.info('Token refreshed, attempting to fetch profile again as it was missing.');
            await fetchProfileFromBackend(session);
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
            // User attributes (e.g. email) changed in Supabase auth.
            // Potentially re-fetch profile if it depends on these.
            _logger.info('User updated in Supabase, re-fetching profile.');
            await fetchProfileFromBackend(session);
        }
        // For other events like PASSWORD_RECOVERY, MFA_CHALLENGE, etc., profile might not be relevant yet.
        setLoading(false);
      }
    );

    return () => {
      // Cleanup listener on component unmount
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      } else if (authListener && authListener.subscription) { // V2 Supabase listener
         authListener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const value = {
    user,        // The Supabase auth user object
    profile,     // The user's profile from C# backend (includes role)
    loading,     // Loading state for session/profile fetching
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
