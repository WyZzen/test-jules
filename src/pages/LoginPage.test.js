import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom'; // Required for <Link> and navigate
import LoginPage from './LoginPage';
import { supabase } from '../services/supabaseClient';

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

// Mock Supabase client
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    supabase.auth.signInWithPassword.mockClear();
  });

  test('renders login form correctly', () => {
    render(
      <Router>
        <LoginPage />
      </Router>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('allows user to type into email and password fields', () => {
    render(
      <Router>
        <LoginPage />
      </Router>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls supabase.auth.signInWithPassword on form submission and navigates on success', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    render(
      <Router>
        <LoginPage />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Techmine/Home');
    });
  });

  test('displays error message on login failure', async () => {
    const errorMessage = 'Invalid login credentials';
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: errorMessage },
    });

    render(
      <Router>
        <LoginPage />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

   test('handles unexpected error during login', async () => {
    const errorMessage = 'An unexpected error occurred.';
    supabase.auth.signInWithPassword.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <Router>
        <LoginPage />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
