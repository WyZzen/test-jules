import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './SignalementPage.css'; // Import the CSS

const SignalementPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [errorIncidents, setErrorIncidents] = useState(null);

  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    location: '',
    severity: 'Medium', // Default severity
    reported_by: '', // Could be auto-filled from user session later
    status: 'Open', // Default status
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch incidents
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    setErrorIncidents(null);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorIncidents(error.message);
        setIncidents([]);
      } else {
        setIncidents(data || []);
      }
    } catch (err) {
      setErrorIncidents(err.message || 'An unexpected error occurred.');
      setIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // TODO: Fetch current user to prefill reported_by
    // const currentUser = supabase.auth.user();
    // if (currentUser) {
    //   setIncidentForm(prev => ({ ...prev, reported_by: currentUser.email }));
    // }
  }, []);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setIncidentForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage({ type: '', text: '' });

    if (!incidentForm.title || !incidentForm.incident_date || !incidentForm.location || !incidentForm.reported_by) {
      setFormMessage({ type: 'error', text: 'Please fill in Title, Incident Date, Location, and Reported By.' });
      setFormLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('incidents')
        .insert([{ ...incidentForm, status: 'Open' }]); // Ensure status is Open

      if (error) {
        setFormMessage({ type: 'error', text: `Error reporting incident: ${error.message}` });
      } else {
        setFormMessage({ type: 'success', text: 'Incident reported successfully!' });
        setIncidentForm({ // Reset form
          title: '',
          description: '',
          incident_date: new Date().toISOString().split('T')[0],
          location: '',
          severity: 'Medium',
          reported_by: incidentForm.reported_by, // Keep reported_by if user is logged in
          status: 'Open',
        });
        fetchIncidents(); // Refresh the list
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: `An unexpected error occurred: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let currentIncidents = [...incidents];
    if (statusFilter) {
      currentIncidents = currentIncidents.filter(inc => inc.status === statusFilter);
    }
    setFilteredIncidents(currentIncidents);
  }, [statusFilter, incidents]);


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
            <label htmlFor="incident_date">Date of Incident:</label>
            <input type="date" id="incident_date" name="incident_date" value={incidentForm.incident_date} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input type="text" id="location" name="location" value={incidentForm.location} onChange={handleFormChange} required />
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
            <label htmlFor="reported_by">Reported By:</label>
            <input type="text" id="reported_by" name="reported_by" value={incidentForm.reported_by} onChange={handleFormChange} placeholder="Your name or email" required />
          </div>
          <button type="submit" className="submit-button-incident" disabled={formLoading}>
            {formLoading ? 'Submitting...' : 'Submit Incident Report'}
          </button>
        </form>
      </div>

      <div className="incidents-list-container">
        <h2>Reported Incidents</h2>
        <div className="filter-controls-incidents">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {loadingIncidents && <p>Loading incidents...</p>}
        {errorIncidents && <p style={{ color: 'red' }}>Error fetching incidents: {errorIncidents}</p>}
        {!loadingIncidents && !errorIncidents && filteredIncidents.length === 0 && <p>No incidents found matching your criteria.</p>}

        {!loadingIncidents && !errorIncidents && filteredIncidents.length > 0 && (
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
              {filteredIncidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.id}</td>
                  <td>{incident.title}</td>
                  <td>{new Date(incident.incident_date).toLocaleDateString()}</td>
                  <td>{incident.location}</td>
                  <td>{incident.severity}</td>
                  <td>{incident.status}</td>
                  <td>{incident.reported_by}</td>
                  <td>{new Date(incident.created_at).toLocaleString()}</td>
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
