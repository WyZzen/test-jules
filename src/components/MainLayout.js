import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import SideMenu from './SideMenu';
import './MainLayout.css'; // Import the CSS

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on small screens

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="main-layout">
      <header className="main-layout-header">
        {/* Pass the toggle function to TopNavBar */}
        <TopNavBar onToggleSidebar={toggleSidebar} />
      </header>
      <div className="main-layout-body">
        {/* Apply 'open' class conditionally */}
        <aside className={`main-layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <SideMenu />
        </aside>
        <main className="main-layout-content">
          {children} {/* Page content will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
