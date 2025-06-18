import React, { useState, useEffect, useCallback } from 'react';
import * as incidentService from '../services/incidentService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token and user info
import './SignalementPage.css';

const SignalementPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [errorIncidents, setErrorIncidents] = useState(null);
  const { user, profile, loading: authLoading } = useAuth(); // Get user session for token and profile

  const initialFormState = {
    title: '',
    description: '',
    incidentDate: new Date().toISOString().split('T')[0], // Matches DTO
    location: '',
    severity: 'Medium',
    reportedBy: '',
    status: 'Open',
  };
  const [incidentForm, setIncidentForm] = useState(initialFormState);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Filter states for fetching
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [titleSearchFilter, setTitleSearchFilter] = useState('');

  const fetchIncidentsFromAPI = useCallback(async () => {
    if (!user || !user.token) {
        if (!authLoading) setErrorIncidents("Authentication token not available. Please log in.");
        setLoadingIncidents(false);
        return;
    }
    setLoadingIncidents(true);
    setErrorIncidents(null);
    try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (severityFilter) params.severity = severityFilter;
        if (titleSearchFilter) params.titleSearch = titleSearchFilter;

        const data = await incidentService.getIncidents(user.token, params);
        setIncidents(data || []);
    } catch (err) {
        setErrorIncidents(err.message || 'An unexpected error occurred while fetching incidents.');
        setIncidents([]);
    } finally {
        setLoadingIncidents(false);
    }
  }, [user, authLoading, statusFilter, severityFilter, titleSearchFilter]);

  useEffect(() => {
    // Only fetch if auth is not loading and user object is available
    if (!authLoading && user) {
        fetchIncidentsFromAPI();
    } else if (!authLoading && !user) {
        setErrorIncidents("Please log in to view and report incidents.");
        setLoadingIncidents(false);
    }
  }, [fetchIncidentsFromAPI, authLoading, user]);

  useEffect(() => {
    // Pre-fill reportedBy if user profile is available and form field is empty
    if (profile && incidentForm.reportedBy === '') {
        setIncidentForm(prev => ({
            ...prev,
            reportedBy: profile.fullName || user?.email || ''
        }));
    } else if (user && !profile && incidentForm.reportedBy === '' && !authLoading) {
        setIncidentForm(prev => ({
            ...prev,
            reportedBy: user.email || ''
        }));
    }
  }, [user, profile, authLoading, incidentForm.reportedBy]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setIncidentForm(prev => ({ ...prev, [name]: value }));
  };

  // Helper for IsNullOrEmpty
  const stringIsNullOrEmpty = (val) => val === null || val === undefined || String(val).trim() === '';


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
        setFormMessage({ type: 'error', text: "Authentication token not available."});
        return;
    }
    setFormLoading(true);
    setFormMessage({ type: '', text: '' });

    if (stringIsNullOrEmpty(incidentForm.title) || stringIsNullOrEmpty(incidentForm.incidentDate) || stringIsNullOrEmpty(incidentForm.status) ) {
      setFormMessage({ type: 'error', text: 'Please fill in Title, Incident Date, and Status.' });
      setFormLoading(false);
      return;
    }

    let finalReportedBy = incidentForm.reportedBy;
    if (stringIsNullOrEmpty(finalReportedBy)) {
        finalReportedBy = profile?.fullName || user?.email || 'Anonymous';
    }

    const incidentDataPayload = {
        title: incidentForm.title,
        description: incidentForm.description,
        incidentDate: incidentForm.incidentDate,
        location: incidentForm.location,
        severity: incidentForm.severity,
        reportedBy: finalReportedBy,
        status: incidentForm.status,
    };

    try {
      const createdIncident = await incidentService.createIncident(user.token, incidentDataPayload);
      setFormMessage({ type: 'success', text: `Incident reported successfully! ID: ${createdIncident.id}` });

      setIncidentForm(prev => ({
          ...initialFormState,
          reportedBy: prev.reportedBy
      }));
      fetchIncidentsFromAPI();
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message || 'An unexpected error occurred while reporting the incident.' });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="signalement-page">
      <h1>Incident Reporting & Tracking</h1>

      <div className="incident-form-container">
        <h2>Report New Incident</h2>
        {formMessage.text && (
          <div className={`message ${formMessage.type}`}>{formMessage.text}</div>
        )}
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title/Subject:</label>
            <input type="text" id="title" name="title" value={incidentForm.title} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" value={incidentForm.description} onChange={handleFormChange} />
          </div>
          <div className="form-group">
            <label htmlFor="incidentDate">Date of Incident:</label>
            <input type="date" id="incidentDate" name="incidentDate" value={incidentForm.incidentDate} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input type="text" id="location" name="location" value={incidentForm.location} onChange={handleFormChange} />
          </div>
          <div className="form-group">
            <label htmlFor="severity">Severity:</label>
            <select id="severity" name="severity" value={incidentForm.severity} onChange={handleFormChange}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="reportedBy">Reported By:</label>
            <input type="text" id="reportedBy" name="reportedBy" value={incidentForm.reportedBy} onChange={handleFormChange} placeholder="Your name or email" />
          </div>
           <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select id="status" name="status" value={incidentForm.status} onChange={handleFormChange} required>
              <option value="Open">Open</option>
              {/* Other statuses might be set by admins later, keep form simple for creation */}
              {/* <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option> */}
            </select>
          </div>
          <button type="submit" className="submit-button-incident" disabled={formLoading || !user}>
            {formLoading ? 'Submitting...' : 'Submit Incident Report'}
          </button>
        </form>
      </div>

      <div className="incidents-list-container">
        <h2>Reported Incidents</h2>
        <div className="filter-controls-incidents">
          <input
            type="text"
            placeholder="Search by title..."
            value={titleSearchFilter}
            onChange={(e) => setTitleSearchFilter(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
           <button onClick={fetchIncidentsFromAPI} disabled={loadingIncidents || !user}>
            {loadingIncidents && !user ? 'Authenticating...' : loadingIncidents ? 'Searching...' : 'Search'}
          </button>
        </div>

        {loadingIncidents && <p>Loading incidents...</p>}
        {errorIncidents && <p style={{ color: 'red' }}>Error: {errorIncidents}</p>}
        {!loadingIncidents && !errorIncidents && incidents.length === 0 && <p>No incidents found matching your criteria.</p>}

        {!loadingIncidents && !errorIncidents && incidents.length > 0 && (
          <table className="incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Incident Date</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.id.substring(0,8)}...</td>
                  <td>{incident.title}</td>
                  <td>{new Date(incident.incidentDate).toLocaleDateString()}</td>
                  <td>{incident.location}</td>
                  <td>{incident.severity}</td>
                  <td>{incident.status}</td>
                  <td>{incident.reportedBy}</td>
                  <td>{new Date(incident.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SignalementPage;
