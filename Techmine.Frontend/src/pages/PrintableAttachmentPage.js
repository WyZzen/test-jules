import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as attachmentService from '../services/attachmentService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token

const PrintableAttachmentPage = () => {
  const { id: attachmentId } = useParams();
  const { user } = useAuth(); // Get user session for token
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!user || !user.token) {
      setError("Authentication token not available. Please log in.");
      setLoading(false);
      return;
    }
    if (!attachmentId) {
      setError("No attachment ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await attachmentService.getAttachmentById(user.token, attachmentId);
      if (data) {
        setAttachment(data); // Data should be AttachmentDto from backend
      } else {
        // attachmentService.getAttachmentById should throw an error if not found,
        // which will be caught below. Or it might return null/undefined.
        setError(`Attachment with ID ${attachmentId} not found.`);
      }
    } catch (err) {
      setError(err.message || `An unexpected error occurred while fetching attachment ${attachmentId}.`);
    } finally {
      setLoading(false);
    }
  }, [attachmentId, user]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return <p>Loading attachment details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!attachment) {
    return <p>Attachment not found.</p>;
  }

  // Basic styling for the printable page (can be expanded in a CSS file)
  // These styles match the DTO properties from C# backend (e.g., fileName, fileUrl, createdAt)
  const pageStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '10px',
  };

  const detailStyle = {
    marginBottom: '10px',
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1>Printable View for Attachment</h1>
      </header>

      <h2>{attachment.name}</h2>
      <p style={detailStyle}><strong>ID:</strong> {attachment.id}</p>
      <p style={detailStyle}><strong>Type:</strong> {attachment.type}</p>
      <p style={detailStyle}><strong>File Name:</strong> {attachment.fileName || 'N/A'}</p>
      <p style={detailStyle}><strong>Created At:</strong> {new Date(attachment.createdAt).toLocaleString()}</p>

      {attachment.fileUrl && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>File Link:</strong> <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">{attachment.fileUrl}</a></p>
          {/* In a real scenario, if it's an image or PDF, you might embed it here */}
        </div>
      )}

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <p><em>This is a basic printable view. PDF generation or more complex layout will be implemented later.</em></p>
        {/* Placeholder for where actual printable content (e.g. PDF embed or specific data fields) would go */}
      </div>
    </div>
  );
};

export default PrintableAttachmentPage;
