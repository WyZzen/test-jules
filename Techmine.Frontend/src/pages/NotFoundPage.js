import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css'; // Import the CSS

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      {/* Optional: <div className="not-found-icon">⚠️</div> */}
      <h1>404</h1>
      <h2>Oops! Page Not Found.</h2>
      <p>
        We're sorry, but the page you are looking for doesn't exist, might have been removed,
        had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/Techmine/Home" className="not-found-link">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
