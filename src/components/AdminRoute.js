import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { profile, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    // Wait for authentication and profile loading to complete
    return <p>Loading user information...</p>; // Or a spinner component
  }

  if (!user) {
    // Should be caught by ProtectedRoutesWrapper first, but as a safeguard
    return <Navigate to="/Techmine/" state={{ from: location }} replace />;
  }

  // Check if profile is loaded and if role is 'Admin'
  // Ensure profile and profile.role are not null/undefined before checking
  if (profile && profile.role === 'Admin') {
    return children; // Render the protected admin component
  } else {
    // If not an Admin, or profile doesn't exist/doesn't have a role
    // Redirect to HomePage or an "Unauthorized" page
    // Sending a message via state could be useful for the target page
    console.warn("AdminRoute: Access denied. User role is not 'Admin' or profile is missing role.", profile);
    return <Navigate to="/Techmine/Home" state={{ error: "You are not authorized to view this page." }} replace />;
  }
};

export default AdminRoute;
