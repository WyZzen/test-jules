import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const SideMenu = () => {
  const { profile, loading } = useAuth(); // Get user profile and loading state

  // Determine if the user is an admin
  // Ensure profile is loaded and has a role property
  const isAdmin = !loading && profile && profile.role === 'Admin';

  return (
    <nav>
      <ul>
        <li><Link to="/Techmine/Home">Home</Link></li>
      </ul>

      <h4>Document Management</h4>
      <ul>
        <li><Link to="/Techmine/ReportList">Reports</Link></li>
        <li><Link to="/Techmine/ReportsForm">New Report</Link></li>
        <li><Link to="/Techmine/AttachementList">Attachments</Link></li>
        <li><Link to="/Techmine/AttachementForm">New Attachment</Link></li>
      </ul>

      <h4>Tracking</h4>
      <ul>
        <li><Link to="/Techmine/Signalement">Signalement</Link></li>
        <li><Link to="/Techmine/Recap">Recap</Link></li>
      </ul>

      {/* Conditionally render Administration links */}
      {isAdmin && (
        <>
          <h4>Administration</h4>
          <ul>
            <li><Link to="/Techmine/Users">Users</Link></li>
            <li><Link to="/Techmine/Worksites">Worksites</Link></li>
            <li><Link to="/Techmine/Clients">Clients</Link></li>
          </ul>
        </>
      )}
    </nav>
  );
};

export default SideMenu;
