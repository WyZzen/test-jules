import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as attachmentService from '../services/attachmentService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token
import { supabase } from '../services/supabaseClient'; // Still needed for Storage operations
import './AttachementListPage.css';

const BUCKET_NAME = process.env.REACT_APP_SUPABASE_BUCKET_NAME || 'attachments-bucket';

const AttachementListPage = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth(); // Get user session for token

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchAttachmentsMetadata = useCallback(async () => {
    if (!user || !user.token) {
        setError("Authentication token not available. Please log in.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
        const params = {};
        if (typeFilter) params.type = typeFilter;
        if (searchTerm) params.nameSearch = searchTerm;

        const data = await attachmentService.getAttachments(user.token, params);
        setAttachments(data || []);
    } catch (err) {
        setError(err.message || 'An unexpected error occurred while fetching attachments.');
        setAttachments([]);
    } finally {
        setLoading(false);
    }
  }, [user, typeFilter, searchTerm]);

  useEffect(() => {
    fetchAttachmentsMetadata();
  }, [fetchAttachmentsMetadata]);

  const handleDeleteAttachment = async (attachmentToDelete) => {
    if (!user || !user.token) {
        setError("Authentication token not available.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete attachment: "${attachmentToDelete.name}"? This will delete its metadata and attempt to delete the file from storage.`)) {
        setLoading(true); // Indicate loading state for delete operation
        setError(null);
        setSuccessMessage('');
        try {
            // 1. Attempt to delete file from Supabase Storage if filePath is available
            if (attachmentToDelete.filePath) { // Assuming filePath is part of your attachment DTO/object
                const { error: storageError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .remove([attachmentToDelete.filePath]);

                if (storageError) {
                    // Log error but proceed to delete metadata, or handle more strictly
                    console.warn(`Failed to delete file from storage: ${storageError.message}. Proceeding to delete metadata.`);
                    // setError(`Failed to delete file from storage: ${storageError.message}. Metadata deletion will be attempted.`);
                    // Optionally, you could stop here if file deletion is critical
                } else {
                    console.log(`File ${attachmentToDelete.filePath} deleted from storage.`);
                }
            } else {
                console.warn(`No filePath available for attachment ID ${attachmentToDelete.id}, cannot delete from storage. Proceeding to delete metadata.`);
            }

            // 2. Delete metadata via backend API
            await attachmentService.deleteAttachment(user.token, attachmentToDelete.id);
            setAttachments(prevAttachments => prevAttachments.filter(att => att.id !== attachmentToDelete.id));
            setSuccessMessage(`Attachment "${attachmentToDelete.name}" metadata deleted successfully.`);
        } catch (err) {
            setError(err.message || 'Failed to delete attachment.');
        } finally {
            setLoading(false);
        }
    }
  };

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
          {/* Ensure these values match what your backend expects for 'type' */}
        </select>
         <button onClick={fetchAttachmentsMetadata} disabled={loading || !user}>
            {loading && !user ? 'Authenticating...' : loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p>Loading attachments...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      {!loading && !error && attachments.length === 0 && <p>No attachments found. Create one!</p>}

      {!loading && !error && attachments.length > 0 && (
        <div className="attachments-table-container">
          <table className="attachments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>File Name</th>
                <th>File URL/Link</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td>{attachment.id.substring(0,8)}...</td>
                  <td>{attachment.name}</td>
                  <td>{attachment.type}</td>
                  <td>{attachment.fileName || 'N/A'}</td>
                  <td>
                    {attachment.fileUrl ? (
                      <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                        View/Download
                      </a>
                    ) : (
                      'No URL'
                    )}
                  </td>
                  <td>{attachment.createdAt ? new Date(attachment.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    <Link to={`/Techmine/PrintableAttachment/${attachment.id}`}>Printable View</Link>
                    {/* <Link to={`/Techmine/AttachementForm/${attachment.id}`}>Edit</Link> */} {/* Uncomment if edit is implemented */}
                    <button
                        onClick={() => handleDeleteAttachment(attachment)}
                        className="delete-button"
                        disabled={loading || !user}
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

export default AttachementListPage;
