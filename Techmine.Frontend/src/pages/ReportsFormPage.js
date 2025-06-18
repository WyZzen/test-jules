import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as reportService from '../services/reportService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token
import './ReportsFormPage.css';

const ReportsFormPage = () => {
  const { id: reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user session for token

  const [report, setReport] = useState({
    title: '',
    description: '',
    reportDate: new Date().toISOString().split('T')[0], // Matches DTO, default to today
    status: 'Draft',
  });
  const [loading, setLoading] = useState(false); // For form submission
  const [pageLoading, setPageLoading] = useState(false); // For fetching existing report
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReportById = useCallback(async (id) => {
    if (!user || !user.token) {
        setMessage({ type: 'error', text: "Authentication token not available."});
        return;
    }
    setPageLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await reportService.getReportById(user.token, id);
      if (data) {
        setReport({
          title: data.title || '',
          description: data.description || '',
          // Ensure field name matches what C# DTO provides (e.g., reportDate)
          reportDate: data.reportDate ? new Date(data.reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: data.status || 'Draft',
        });
      } else {
        setMessage({ type: 'error', text: `Report with ID ${id} not found.` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || `An unexpected error occurred while fetching report ${id}.` });
    } finally {
      setPageLoading(false);
    }
  }, [user]); // Dependency on user for token

  useEffect(() => {
    if (reportId) {
      fetchReportById(reportId);
    }
    // Set a default date for new reports if reportId is not present
    // and reportDate is not already set (e.g. from previous failed attempt)
    if (!reportId && !report.reportDate) {
        setReport(prev => ({ ...prev, reportDate: new Date().toISOString().split('T')[0]}));
    }
  }, [reportId, fetchReportById]); // Add fetchReportById to dependencies


  const handleChange = (e) => {
    const { name, value } = e.target;
    setReport(prevReport => ({
      ...prevReport,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
        setMessage({ type: 'error', text: "Authentication token not available."});
        return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!report.title || !report.reportDate) { // Ensure field name matches state
        setMessage({ type: 'error', text: 'Title and Report Date are required.' });
        setLoading(false);
        return;
    }

    // Prepare DTO. Ensure property names match C# DTOs (CreateReportDto/UpdateReportDto)
    const reportDataPayload = {
        title: report.title,
        description: report.description,
        reportDate: report.reportDate, // This should match the DTO field name
        status: report.status,
    };

    try {
      if (reportId) {
        // Update existing report
        await reportService.updateReport(user.token, reportId, reportDataPayload);
        setMessage({ type: 'success', text: 'Report updated successfully!' });
      } else {
        // Create new report
        const createdReport = await reportService.createReport(user.token, reportDataPayload);
        setMessage({ type: 'success', text: `Report created successfully with ID: ${createdReport.id}` });
      }

      setTimeout(() => {
        navigate('/Techmine/ReportList');
      }, 1500); // Redirect after a short delay

    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred while saving the report.' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading && reportId) {
    return <p>Loading report details...</p>;
  }

  return (
    <div className="reports-form-page">
      <h1>{reportId ? 'Edit Report' : 'Create New Report'}</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title" // Should match key in report state object
            value={report.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={report.description}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reportDate">Date:</label> {/* Changed name to reportDate */}
          <input
            type="date"
            id="reportDate"
            name="reportDate" // Should match key in report state object and DTO
            value={report.reportDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={report.status}
            onChange={handleChange}
          >
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            {/* Add more statuses as needed, ensure they match backend expectations */}
          </select>
        </div>
        <button type="submit" className="submit-button" disabled={loading || !user}>
          {loading ? (reportId ? 'Updating...' : 'Creating...') : (reportId ? 'Update Report' : 'Create Report')}
        </button>
      </form>
    </div>
  );
};

export default ReportsFormPage;
