import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import './ReportListPage.css'; // Import the CSS

const ReportListPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Placeholder for filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          setReports([]);
        } else {
          setReports(data || []);
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Placeholder for filter logic (not implemented yet)
  const filteredReports = reports.filter(report => {
    const titleMatch = report.title?.toLowerCase().includes(searchTerm.toLowerCase()) || true; // Implement actual search
    const statusMatch = statusFilter ? report.status === statusFilter : true; // Implement actual filter
    return titleMatch && statusMatch;
  });

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
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          {/* Add more statuses as needed */}
        </select>
        {/* <button onClick={() => { /* Implement filter logic trigger */ }}>Filter</button> */}
      </div>

      {loading && <p>Loading reports...</p>}
      {error && <p style={{ color: 'red' }}>Error fetching reports: {error}</p>}

      {!loading && !error && reports.length === 0 && <p>No reports found. Create one!</p>}

      {!loading && !error && reports.length > 0 && (
        <div className="reports-table-container"> {/* Added wrapper div */}
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
              <th>Title</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.title}</td>
                <td>{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>{report.status || 'N/A'}</td>
                <td className="actions">
                  <Link to={`/Techmine/ReportsForm/${report.id}`}>Edit</Link>
                  {/* Delete button can be added here later */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> /* Closing wrapper div */
      )}
    </div>
  );
};

export default ReportListPage;
