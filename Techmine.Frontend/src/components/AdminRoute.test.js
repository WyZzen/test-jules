import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import { AuthContext } from '../contexts/AuthContext'; // Import the actual context

// Mock component to be rendered by AdminRoute
const MockAdminPageComponent = () => <div data-testid="admin-page">Admin Page Content</div>;
const MockHomePageComponent = () => <div data-testid="home-page">Home Page</div>;

// Mock Navigate for verifying redirection
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(({ to, state }) => (
    <div data-testid="navigate-mock" data-to={to} data-state={JSON.stringify(state)}>
      Redirecting to {to}
    </div>
  )),
}));


const renderWithAuthProvider = (ui, { providerProps, routePath = "/", currentPath = "/" } = {}) => {
  window.history.pushState({}, 'Test page', currentPath);
  return render(
    <AuthContext.Provider value={providerProps}>
      <Router>
        <Routes>
          <Route path={routePath} element={ui} />
          <Route path="/Techmine/Home" element={<MockHomePageComponent />} />
           {/* Fallback for other navigation checks if needed */}
          <Route path="/Techmine/" element={<div>Login Page Mock</div>} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

describe('AdminRoute', () => {
  beforeEach(() => {
    Navigate.mockClear();
  });

  test('renders child component if user is Admin and profile is loaded', () => {
    const providerProps = {
      user: { id: 'admin-user-id' },
      profile: { id: 'admin-user-id', role: 'Admin' },
      loading: false,
    };
    renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    expect(screen.getByText('Admin Page Content')).toBeInTheDocument();
  });

  test('redirects to HomePage if user is not Admin', () => {
    const providerProps = {
      user: { id: 'user-id' },
      profile: { id: 'user-id', role: 'User' },
      loading: false,
    };
     renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/Techmine/Home', replace: true }),
      {}
    );
    // Check if the mock Navigate component's output is rendered (optional)
    expect(screen.getByTestId('navigate-mock')).toHaveAttribute('data-to', '/Techmine/Home');
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });

  test('redirects to LoginPage if user is not authenticated (safeguard)', () => {
    const providerProps = {
      user: null,
      profile: null,
      loading: false,
    };
    renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/Techmine/', replace: true }), // Assuming /Techmine/ is login
      {}
    );
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });

  test('shows loading message if AuthContext is loading', () => {
    const providerProps = {
      user: null,
      profile: null,
      loading: true,
    };
    renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );
    expect(screen.getByText(/loading user information/i)).toBeInTheDocument();
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });

  test('redirects to HomePage if user is authenticated but profile is null (no role)', () => {
    const providerProps = {
      user: { id: 'user-id' },
      profile: null, // Profile not loaded or doesn't exist
      loading: false,
    };
    renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/Techmine/Home', replace: true }),
      {}
    );
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });

   test('redirects to HomePage if user is authenticated but profile has no role property', () => {
    const providerProps = {
      user: { id: 'user-id' },
      profile: { id: 'user-id' /* no role property */ },
      loading: false,
    };
    renderWithAuthProvider(
        <AdminRoute>
            <MockAdminPageComponent />
        </AdminRoute>,
        { providerProps, routePath: "/admin-test", currentPath: "/admin-test" }
    );
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/Techmine/Home', replace: true }),
      {}
    );
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });
});
