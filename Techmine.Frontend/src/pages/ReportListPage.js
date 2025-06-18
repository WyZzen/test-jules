import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as reportService from '../services/reportService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token
import './ReportListPage.css';

const ReportListPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user session for token

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReports = useCallback(async () => {
    if (!user || !user.token) { // user.token from Supabase session is access_token
        setError("Authentication token not available. Please log in.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (searchTerm) params.titleSearch = searchTerm;

        const data = await reportService.getReports(user.token, params);
        setReports(data || []);
    } catch (err) {
        setError(err.message || 'An unexpected error occurred while fetching reports.');
        setReports([]);
    } finally {
        setLoading(false);
    }
  }, [user, statusFilter, searchTerm]); // Dependencies for useCallback

  useEffect(() => {
    fetchReports();
  }, [fetchReports]); // fetchReports is now a dependency

  // No client-side filtering needed initially as backend handles it.
  // If you want to further refine on client-side, you can, but backend filtering is primary.
  // For simplicity, we'll display what the backend returns.
  // const filteredReports = reports; // Assuming backend already filtered

  const handleDeleteReport = async (reportId) => {
    if (!user || !user.token) {
        setError("Authentication token not available.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this report?')) {
        try {
            await reportService.deleteReport(user.token, reportId);
            setReports(prevReports => prevReports.filter(report => report.id !== reportId));
            // Optionally show a success message
        } catch (err) {
            setError(err.message || 'Failed to delete report.');
            // Optionally show an error message to the user
        }
    }
  };


  return (
    <div className="report-list-page">
      <h1>Reports</h1>
      <Link to="/Techmine/ReportsForm" className="create-report-button">
        Create New Report
      </Link>

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // Consider adding a small delay or onBlur to trigger fetchReports, or a search button
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          {/* Add more statuses as needed based on your C# DTO/Entity */}
        </select>
        <button onClick={fetchReports} disabled={loading || !user}>
            {loading && !user ? 'Authenticating...' : loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p>Loading reports...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && reports.length === 0 && <p>No reports found. Create one!</p>}

      {!loading && !error && reports.length > 0 && (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                {/* Assuming ReportDto has 'id', 'title', 'createdAt', 'status' */}
                <th>ID</th>
                <th>Title</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id.substring(0,8)}...</td> {/* Show partial ID if too long */}
                  <td>{report.title}</td>
                  <td>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{report.status || 'N/A'}</td>
                  <td className="actions">
                    <Link to={`/Techmine/ReportsForm/${report.id}`}>Edit</Link>
                    <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="delete-button"
                        disabled={!user} // Disable if no user/token
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportListPage;
