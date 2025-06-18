import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './ClientsPage.css'; // Import CSS

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState({
    id: null,
    name: '',
    contact_person: '',
    email: '',
    phone: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch clients.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClient(prev => ({ ...prev, [name]: value }));
  };

  const openFormForCreate = () => {
    setIsEditing(false);
    setCurrentClient({ id: null, name: '', contact_person: '', email: '', phone: '' });
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const openFormForEdit = (client) => {
    setIsEditing(true);
    setCurrentClient(client);
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Consider a more specific loading state for form submission
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!currentClient.name || !currentClient.email) {
        setMessage({ type: 'error', text: 'Client Name and Email are required.' });
        setLoading(false);
        return;
    }

    const dataToSave = {
        name: currentClient.name,
        contact_person: currentClient.contact_person,
        email: currentClient.email,
        phone: currentClient.phone,
    };

    try {
      let supabaseError;
      if (isEditing) {
        const { error } = await supabase
          .from('clients')
          .update(dataToSave)
          .eq('id', currentClient.id);
        supabaseError = error;
      } else {
        const { error } = await supabase.from('clients').insert([dataToSave]);
        supabaseError = error;
      }

      if (supabaseError) throw supabaseError;

      setMessage({ type: 'success', text: `Client ${isEditing ? 'updated' : 'created'} successfully!` });
      fetchClients();
      closeForm();
    } catch (err) {
      setMessage({ type: 'error', text: `Operation failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setLoading(true);
      setMessage({ type: '', text: '' });
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Client deleted successfully.' });
        fetchClients();
      } catch (err) {
        setMessage({ type: 'error', text: `Delete failed: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="admin-page clients-page">
      <h1>Client Management</h1>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {!isFormOpen && (
        <button onClick={openFormForCreate} className="admin-button primary">Add New Client</button>
      )}

      {isFormOpen && (
        <div className="form-container">
          <h2>{isEditing ? 'Edit Client' : 'Add New Client'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Client Name:</label>
              <input type="text" id="name" name="name" value={currentClient.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="contact_person">Contact Person:</label>
              <input type="text" id="contact_person" name="contact_person" value={currentClient.contact_person} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" value={currentClient.email} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone:</label>
              <input type="tel" id="phone" name="phone" value={currentClient.phone} onChange={handleInputChange} />
            </div>
            <button type="submit" className="admin-button primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Client' : 'Create Client')}
            </button>
            <button type="button" onClick={closeForm} className="admin-button secondary" disabled={loading}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <h2>Clients List</h2>
      {loading && !isFormOpen && <p>Loading clients...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && clients.length === 0 && !isFormOpen && <p>No clients found.</p>}

      {!isFormOpen && clients.length > 0 && (
        <div className="admin-table-container"> {/* Added wrapper */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
              <th>Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.name}</td>
                <td>{client.contact_person}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td className="actions">
                  <button onClick={() => openFormForEdit(client)} className="admin-button primary">Edit</button>
                  <button onClick={() => handleDelete(client.id)} className="admin-button danger" disabled={loading}>Delete</button>
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

export default ClientsPage;
