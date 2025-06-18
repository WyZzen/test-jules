import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './WorksitesPage.css'; // Import CSS

const WorksitesPage = () => {
  const [worksites, setWorksites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentWorksite, setCurrentWorksite] = useState({
    id: null,
    name: '',
    location: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active', // Default status
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch worksites
  const fetchWorksites = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('worksites')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWorksites(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch worksites.');
      setWorksites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksites();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentWorksite(prev => ({ ...prev, [name]: value }));
  };

  const openFormForCreate = () => {
    setIsEditing(false);
    setCurrentWorksite({ id: null, name: '', location: '', start_date: new Date().toISOString().split('T')[0], status: 'Active' });
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const openFormForEdit = (worksite) => {
    setIsEditing(true);
    setCurrentWorksite({
        ...worksite,
        start_date: worksite.start_date ? new Date(worksite.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Consider a more specific loading state for form submission
    setMessage({ type: '', text: '' });

    if (!currentWorksite.name || !currentWorksite.location || !currentWorksite.start_date) {
        setMessage({ type: 'error', text: 'Name, Location, and Start Date are required.' });
        setLoading(false);
        return;
    }

    const dataToSave = {
        name: currentWorksite.name,
        location: currentWorksite.location,
        start_date: currentWorksite.start_date,
        status: currentWorksite.status,
    };

    try {
      let supabaseError;
      if (isEditing) {
        const { error } = await supabase
          .from('worksites')
          .update(dataToSave)
          .eq('id', currentWorksite.id);
        supabaseError = error;
      } else {
        const { error } = await supabase.from('worksites').insert([dataToSave]);
        supabaseError = error;
      }

      if (supabaseError) throw supabaseError;

      setMessage({ type: 'success', text: `Worksite ${isEditing ? 'updated' : 'created'} successfully!` });
      fetchWorksites();
      closeForm();
    } catch (err) {
      setMessage({ type: 'error', text: `Operation failed: ${err.message}` });
    } finally {
      setLoading(false); // Reset general loading or specific form loading state
    }
  };

  const handleDelete = async (worksiteId) => {
    if (window.confirm('Are you sure you want to delete this worksite?')) {
      setLoading(true); // Consider specific loading state
      setMessage({ type: '', text: '' });
      try {
        const { error } = await supabase
          .from('worksites')
          .delete()
          .eq('id', worksiteId);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Worksite deleted successfully.' });
        fetchWorksites();
      } catch (err) {
        setMessage({ type: 'error', text: `Delete failed: ${err.message}` });
      } finally {
        setLoading(false); // Reset specific loading state
      }
    }
  };

  return (
    <div className="admin-page worksites-page">
      <h1>Worksite Management</h1>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {!isFormOpen && (
        <button onClick={openFormForCreate} className="admin-button primary">Add New Worksite</button>
      )}

      {isFormOpen && (
        <div className="form-container">
          <h2>{isEditing ? 'Edit Worksite' : 'Add New Worksite'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Worksite Name:</label>
              <input type="text" id="name" name="name" value={currentWorksite.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location:</label>
              <input type="text" id="location" name="location" value={currentWorksite.location} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="start_date">Start Date:</label>
              <input type="date" id="start_date" name="start_date" value={currentWorksite.start_date} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select id="status" name="status" value={currentWorksite.status} onChange={handleInputChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <button type="submit" className="admin-button primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Worksite' : 'Create Worksite')}
            </button>
            <button type="button" onClick={closeForm} className="admin-button secondary" disabled={loading}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <h2>Worksites List</h2>
      {loading && !isFormOpen && <p>Loading worksites...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && worksites.length === 0 && !isFormOpen && <p>No worksites found.</p>}

      {!isFormOpen && worksites.length > 0 && (
        <div className="admin-table-container"> {/* Added wrapper */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {worksites.map(worksite => (
              <tr key={worksite.id}>
                <td>{worksite.id}</td>
                <td>{worksite.name}</td>
                <td>{worksite.location}</td>
                <td>{new Date(worksite.start_date).toLocaleDateString()}</td>
                <td>{worksite.status}</td>
                <td className="actions">
                  <button onClick={() => openFormForEdit(worksite)} className="admin-button primary">Edit</button>
                  <button onClick={() => handleDelete(worksite.id)} className="admin-button danger" disabled={loading}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> {/* Closing wrapper */}
      )}
    </div>
  );
};

export default WorksitesPage;
