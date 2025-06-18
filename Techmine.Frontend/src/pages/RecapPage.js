import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './RecapPage.css'; // Import the CSS

const RecapPage = () => {
  const [counts, setCounts] = useState({
    reports: 0,
    attachments: 0,
    openIncidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch total reports count
        const { count: reportsCount, error: reportsError } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true });

        if (reportsError) throw reportsError;

        // Fetch total attachments count
        const { count: attachmentsCount, error: attachmentsError } = await supabase
          .from('attachments')
          .select('*', { count: 'exact', head: true });

        if (attachmentsError) throw attachmentsError;

        // Fetch open incidents count
        // Assuming 'Open' is a valid status. Adjust if your statuses are different.
        const { count: openIncidentsCount, error: incidentsError } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Open'); // Or any other status representing 'open'

        if (incidentsError) throw incidentsError;

        setCounts({
          reports: reportsCount || 0,
          attachments: attachmentsCount || 0,
          openIncidents: openIncidentsCount || 0,
        });

      } catch (err) {
        console.error("Error fetching recap data:", err);
        setError(err.message || 'An unexpected error occurred while fetching summary data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (loading) {
    return <p className="loading-message">Loading summary data...</p>;
  }

  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  return (
    <div className="recap-page">
      <h1>Application Activity Recap</h1>
      <div className="summary-container">
        <div className="summary-card">
          <h2>Total Reports</h2>
          <p className="count">{counts.reports}</p>
          <p className="description">Number of all submitted reports.</p>
        </div>
        <div className="summary-card">
          <h2>Total Attachments</h2>
          <p className="count">{counts.attachments}</p>
          <p className="description">Number of all uploaded attachments.</p>
        </div>
        <div className="summary-card">
          <h2>Open Incidents</h2>
          <p className="count">{counts.openIncidents}</p>
          <p className="description">Number of incidents currently open and requiring attention.</p>
        </div>
        {/* More summary cards can be added here as needed */}
      </div>
    </div>
  );
};

export default RecapPage;
