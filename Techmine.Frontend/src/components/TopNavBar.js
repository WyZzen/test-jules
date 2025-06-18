import React from 'react';
import './TopNavBar.css'; // Import the CSS

// Accept onToggleSidebar as a prop
const TopNavBar = ({ onToggleSidebar }) => {
  return (
    <div className="top-nav-bar">
      <button
        className="sidebar-toggle-button-react"
        onClick={onToggleSidebar} // Hook up the toggle function
        aria-label="Toggle sidebar" // Accessibility
      >
        &#9776; {/* Hamburger icon */}
      </button>
      <h1>My Application</h1>
      <div>
        {/* User profile/logout button can be added here later */}
        {/* Example: <UserMenu /> */}
      </div>
    </div>
  );
};

export default TopNavBar;
