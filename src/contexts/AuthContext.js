import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores Supabase auth user
  const [profile, setProfile] = useState(null); // Stores user profile from 'profiles' table
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        // Fetch profile if session exists
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id) // Assuming 'id' in profiles table is FK to auth.users.id
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError.message);
          // Handle case where profile might not exist yet, or other errors
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile on auth change:', profileError.message);
            setProfile(null);
          } else {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
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
  }, []);

  const value = {
    user,        // The Supabase auth user object
    profile,     // The user's profile from 'profiles' table (includes role)
    loading,     // Loading state for session/profile fetching
    // login: async (email, password) => { /* Handled in LoginPage, but could expose context update if needed */ },
    // logout: async () => { /* Handled by Supabase client, auth state change will trigger update */ },
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
