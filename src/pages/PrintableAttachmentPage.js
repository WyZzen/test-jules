import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const PrintableAttachmentPage = () => {
  const { id: attachmentId } = useParams();
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttachmentDetails = async () => {
      if (!attachmentId) {
        setError("No attachment ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('attachments')
          .select('*')
          .eq('id', attachmentId)
          .single();

        if (fetchError) {
          setError(fetchError.message);
        } else if (data) {
          setAttachment(data);
        } else {
          setError(`Attachment with ID ${attachmentId} not found.`);
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttachmentDetails();
  }, [attachmentId]);

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
      <p style={detailStyle}><strong>File Name:</strong> {attachment.file_name || 'N/A'}</p>
      <p style={detailStyle}><strong>Created At:</strong> {new Date(attachment.created_at).toLocaleString()}</p>

      {attachment.file_url && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>File Link:</strong> <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">{attachment.file_url}</a></p>
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
