import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import './AttachementListPage.css'; // Import the CSS

const AttachementListPage = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Placeholder for filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('attachments') // Assuming 'attachments' table
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          setAttachments([]);
        } else {
          setAttachments(data || []);
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
        setAttachments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, []);

  // Placeholder for filter logic
  const filteredAttachments = attachments.filter(attachment => {
    const nameMatch = attachment.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = typeFilter ? attachment.type === typeFilter : true;
    return nameMatch && typeMatch;
  });

  return (
    <div className="attachment-list-page">
      <h1>Attachments</h1>
      <Link to="/Techmine/AttachementForm" className="create-attachment-button">
        Create New Attachment
      </Link>

      <div className="filter-controls-attachments">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="Forage">Forage (Drilling)</option>
          <option value="Minage">Minage (Mining)</option>
          {/* Add more types as needed */}
        </select>
      </div>

      {loading && <p>Loading attachments...</p>}
      {error && <p style={{ color: 'red' }}>Error fetching attachments: {error}</p>}

      {!loading && !error && attachments.length === 0 && <p>No attachments found. Create one!</p>}

      {!loading && !error && attachments.length > 0 && (
        <div className="attachments-table-container"> {/* Added wrapper div */}
          <table className="attachments-table">
            <thead>
              <tr>
                <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>File URL/Link</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttachments.map((attachment) => (
              <tr key={attachment.id}>
                <td>{attachment.id}</td>
                <td>{attachment.name}</td>
                <td>{attachment.type}</td>
                <td>
                  {attachment.file_url ? (
                    <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                      View/Download
                    </a>
                  ) : (
                    'No file'
                  )}
                </td>
                <td>{attachment.created_at ? new Date(attachment.created_at).toLocaleDateString() : 'N/A'}</td>
                <td className="actions">
                  <Link to={`/Techmine/PrintableAttachment/${attachment.id}`}>Printable View</Link>
                  {/* Edit link can be added here: <Link to={`/Techmine/AttachementForm/${attachment.id}`}>Edit</Link> */}
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

export default AttachementListPage;
