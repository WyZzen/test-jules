import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

// Mock Supabase client
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// A helper component to consume and display context values
const TestConsumerComponent = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="profile-role">{profile ? profile.role : 'No Profile/Role'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  let onAuthStateChangeCallback = null;

  beforeEach(() => {
    // Reset all mocks
    supabase.auth.getSession.mockReset();
    supabase.auth.onAuthStateChange.mockReset();
    supabase.from.mockClear();
    supabase.select.mockClear();
    supabase.eq.mockClear();
    supabase.single.mockReset();

    // Capture the onAuthStateChange callback to simulate events
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: jest.fn() } }, // V2 listener
      };
    });
  });

  test('initial state is loading, then no user/profile if no session', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('profile-role')).toHaveTextContent('No Profile/Role');
    });
  });

  test('fetches session and profile on mount if session exists', async () => {
    const mockSession = { user: { id: 'user1', email: 'user1@example.com' } };
    const mockProfile = { id: 'user1', role: 'Admin' };

    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    supabase.from.mockReturnValueOnce({ // chained calls for profile fetch
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockProfile, error: null })
    });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user1@example.com');
      expect(screen.getByTestId('profile-role')).toHaveTextContent('Admin');
    });
     expect(supabase.from).toHaveBeenCalledWith('profiles');
     expect(supabase.eq).toHaveBeenCalledWith('id', 'user1');
  });

  test('updates context on SIGNED_IN event', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null }); // Initial: no session
     const mockNewSession = { user: { id: 'user2', email: 'user2@example.com' } };
    const mockNewProfile = { id: 'user2', role: 'User' };

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText('Loading...')).toBeInTheDocument()); // Initial load finishes

    // Simulate SIGNED_IN event
    supabase.from.mockReturnValueOnce({ // chained calls for profile fetch on auth change
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockNewProfile, error: null })
    });

    await act(async () => {
      // Ensure onAuthStateChangeCallback has been set by the mockImplementation
      if (onAuthStateChangeCallback) {
        onAuthStateChangeCallback('SIGNED_IN', mockNewSession);
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user2@example.com');
      expect(screen.getByTestId('profile-role')).toHaveTextContent('User');
    });
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.eq).toHaveBeenCalledWith('id', 'user2');
  });

  test('updates context on SIGNED_OUT event', async () => {
    // Initial state: user is logged in
    const mockInitialSession = { user: { id: 'user1', email: 'user1@example.com' } };
    const mockInitialProfile = { id: 'user1', role: 'Admin' };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockInitialSession }, error: null });
    supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockInitialProfile, error: null })
    });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => { // Wait for initial login to complete
        expect(screen.getByTestId('user')).toHaveTextContent('user1@example.com');
    });

    // Simulate SIGNED_OUT event
    await act(async () => {
      if (onAuthStateChangeCallback) {
        onAuthStateChangeCallback('SIGNED_OUT', null); // No session on sign out
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('profile-role')).toHaveTextContent('No Profile/Role');
    });
  });

  test('handles error when fetching profile', async () => {
    const mockSession = { user: { id: 'user3', email: 'user3@example.com' } };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    supabase.from.mockReturnValueOnce({ // chained calls for profile fetch
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Profile fetch error' } })
    });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user3@example.com'); // User is set
      expect(screen.getByTestId('profile-role')).toHaveTextContent('No Profile/Role'); // Profile is null due to error
    });
  });
});
