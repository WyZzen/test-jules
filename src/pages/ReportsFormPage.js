import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import './ReportsFormPage.css'; // Import the CSS

const ReportsFormPage = () => {
  const { id: reportId } = useParams(); // Get report ID from URL if editing
  const navigate = useNavigate();

  const [report, setReport] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    status: 'Draft', // Default status
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // For success/error messages

  useEffect(() => {
    if (reportId) {
      const fetchReport = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single();

          if (error) {
            setMessage({ type: 'error', text: `Error fetching report: ${error.message}` });
          } else if (data) {
            setReport({
              title: data.title || '',
              description: data.description || '',
              date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: data.status || 'Draft',
            });
          } else {
            setMessage({ type: 'error', text: `Report with ID ${reportId} not found.` });
          }
        } catch (err) {
          setMessage({ type: 'error', text: `An unexpected error occurred: ${err.message}` });
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [reportId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReport(prevReport => ({
      ...prevReport,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!report.title || !report.date) {
        setMessage({ type: 'error', text: 'Title and Date are required.' });
        setLoading(false);
        return;
    }

    try {
      let error = null;
      if (reportId) {
        // Update existing report
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            title: report.title,
            description: report.description,
            date: report.date,
            status: report.status,
            // updated_at: new Date().toISOString() // Supabase might handle this automatically
          })
          .eq('id', reportId);
        error = updateError;
      } else {
        // Create new report
        const { error: insertError } = await supabase
          .from('reports')
          .insert([{
            title: report.title,
            description: report.description,
            date: report.date,
            status: report.status,
            // created_at: new Date().toISOString() // Supabase handles this by default
          }]);
        error = insertError;
      }

      if (error) {
        setMessage({ type: 'error', text: `Error saving report: ${error.message}` });
      } else {
        setMessage({
          type: 'success',
          text: `Report ${reportId ? 'updated' : 'created'} successfully!`
        });
        setTimeout(() => {
          navigate('/Techmine/ReportList');
        }, 1500); // Redirect after a short delay
      }
    } catch (err) {
      setMessage({ type: 'error', text: `An unexpected error occurred: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

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
            name="title"
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
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={report.date}
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
            {/* Add more statuses as needed */}
          </select>
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? (reportId ? 'Updating...' : 'Creating...') : (reportId ? 'Update Report' : 'Create Report')}
        </button>
      </form>
    </div>
  );
};

export default ReportsFormPage;
