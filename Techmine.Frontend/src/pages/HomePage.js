import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import './HomePage.css'; // Import the CSS

const HomePage = () => {
  const [summaryStats, setSummaryStats] = useState({
    recentReportsCount: 0,
    openIncidentsCount: 0,
    activeWorksitesCount: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch summary statistics
        const { count: reportsCount, error: reportsError } = await supabase
          .from('reports')
          // .select('*', { count: 'exact', head: true }) // Basic count
          // Example: count reports from the last 7 days
          .select('id', { count: 'exact' })
          .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString());
        if (reportsError) throw reportsError;

        const { count: incidentsCount, error: incidentsError } = await supabase
          .from('incidents')
          .select('id', { count: 'exact' })
          .eq('status', 'Open');
        if (incidentsError) throw incidentsError;

        const { count: worksitesCount, error: worksitesError } = await supabase
          .from('worksites')
          .select('id', { count: 'exact' })
          .eq('status', 'Active');
        if (worksitesError) throw worksitesError;

        setSummaryStats({
          recentReportsCount: reportsCount || 0,
          openIncidentsCount: incidentsCount || 0,
          activeWorksitesCount: worksitesCount || 0,
        });

        // Fetch recent activities (e.g., last 3 reports and 2 incidents)
        const { data: recentReports, error: recentReportsError } = await supabase
          .from('reports')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(3);
        if (recentReportsError) throw recentReportsError;

        const { data: recentIncidents, error: recentIncidentsError } = await supabase
          .from('incidents')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(2);
        if (recentIncidentsError) throw recentIncidentsError;

        const activities = [
          ...(recentReports || []).map(r => ({ ...r, type: 'Report' })),
          ...(recentIncidents || []).map(i => ({ ...i, type: 'Incident' })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5); // Combine and sort

        setRecentActivities(activities);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="homepage">
      <h1>Dashboard</h1>

      {loading && <p className="loading-message">Loading dashboard data...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="summary-cards">
            <div className="summary-card-item">
              <h3>Recent Reports (Last 7 Days)</h3>
              <p className="count">{summaryStats.recentReportsCount}</p>
              <p className="description">Reports created in the past week.</p>
            </div>
            <div className="summary-card-item">
              <h3>Open Incidents</h3>
              <p className="count">{summaryStats.openIncidentsCount}</p>
              <p className="description">Incidents currently needing attention.</p>
            </div>
            <div className="summary-card-item">
              <h3>Active Worksites</h3>
              <p className="count">{summaryStats.activeWorksitesCount}</p>
              <p className="description">Worksites currently marked as active.</p>
            </div>
          </div>

          <div className="quick-access">
            <h2>Quick Access</h2>
            <div className="quick-access-buttons">
              <Link to="/Techmine/ReportsForm" className="quick-access-button">Create New Report</Link>
              <Link to="/Techmine/AttachementForm" className="quick-access-button secondary">Create New Attachment</Link>
              <Link to="/Techmine/Signalement" className="quick-access-button tertiary">Report an Incident</Link>
              <Link to="/Techmine/ReportList" className="quick-access-button view-all">View All Reports</Link>
            </div>
          </div>

          <div className="activity-feed">
            <h2>Recent Activity (Last 5 entries)</h2>
            {recentActivities.length > 0 ? (
              <ul className="activity-list">
                {recentActivities.map(activity => (
                  <li key={`${activity.type}-${activity.id}`} className="activity-item">
                    <span className="type">{activity.type}: </span>
                    <span className="title">{activity.title}</span>
                    <span className="date">({new Date(activity.created_at).toLocaleDateString()})</span>
                    {activity.type === 'Incident' && activity.status && <span> - Status: {activity.status}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity to display.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
