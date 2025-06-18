import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as attachmentService from '../services/attachmentService'; // Import the new service
import { useAuth } from '../contexts/AuthContext'; // To get the token
import './AttachementFormPage.css';

const AttachementFormPage = () => {
  const { id: attachmentId } = useParams(); // For edit mode
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user session for token

  const [attachmentMetadata, setAttachmentMetadata] = useState({
    name: '',
    type: 'Forage', // Default type
    // fileName and fileUrl will be populated after successful file upload or when fetching for edit
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false); // For form submission (metadata + potential upload)
  const [pageLoading, setPageLoading] = useState(false); // For fetching existing attachment for editing
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadProgress, setUploadProgress] = useState(0);


  const fetchAttachmentForEdit = useCallback(async (id) => {
    if (!user || !user.token) {
        setMessage({ type: 'error', text: "Authentication token not available."});
        return;
    }
    setPageLoading(true);
    setMessage({ type: '', text: ''});
    try {
        const data = await attachmentService.getAttachmentById(user.token, id);
        if (data) {
            setAttachmentMetadata({
                name: data.name || '',
                type: data.type || 'Forage',
                fileName: data.fileName, // From backend DTO
                fileUrl: data.fileUrl,   // From backend DTO
                // reportId: data.reportId // if applicable
            });
            // Note: We don't re-select the file for editing, user has to choose a new one if they want to change it.
        } else {
            setMessage({ type: 'error', text: `Attachment with ID ${id} not found.`});
        }
    } catch (err) {
        setMessage({ type: 'error', text: err.message || `Error fetching attachment ${id}.`});
    } finally {
        setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (attachmentId) {
        fetchAttachmentForEdit(attachmentId);
    }
  }, [attachmentId, fetchAttachmentForEdit]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttachmentMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Optionally update a preview or file name display immediately
      // setAttachmentMetadata(prev => ({ ...prev, fileName: file.name })); // This might be premature if upload fails
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
        setMessage({ type: 'error', text: "Authentication token not available."});
        return;
    }
    if (!attachmentMetadata.name || !attachmentMetadata.type) {
      setMessage({ type: 'error', text: 'Name and Type are required.' });
      return;
    }
    if (!selectedFile && !attachmentId) { // Require file for new attachments
        setMessage({ type: 'error', text: 'A file is required for new attachments.' });
        return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setUploadProgress(0);

    let fileUploadResult = null;
    if (selectedFile) {
        try {
            setMessage({type: 'info', text: `Uploading ${selectedFile.name}...`});
            // Simulate progress for demo if actual progress isn't tracked by SDK easily
            // For Supabase, actual progress events might need specific handling if available
            setUploadProgress(50); // Placeholder
            fileUploadResult = await attachmentService.uploadFileToSupabaseStorage(selectedFile);
            setUploadProgress(100);
            setMessage({type: 'success', text: `${fileUploadResult.fileName} uploaded successfully.`});
        } catch (uploadError) {
            setMessage({ type: 'error', text: `File upload failed: ${uploadError.message}` });
            setLoading(false);
            setUploadProgress(0);
            return;
        }
    }

    // Prepare metadata DTO for backend
    const metadataToSave = {
        name: attachmentMetadata.name,
        type: attachmentMetadata.type,
        fileName: fileUploadResult ? fileUploadResult.fileName : attachmentMetadata.fileName, // Use new if uploaded, else existing
        fileUrl: fileUploadResult ? fileUploadResult.fileUrl : attachmentMetadata.fileUrl,   // Use new if uploaded, else existing
        // reportId: attachmentMetadata.reportId, // if applicable
    };

    try {
      if (attachmentId) { // Update mode
        // If a new file was uploaded, old one might be orphaned in storage unless explicitly deleted.
        // This example doesn't handle deleting old file from storage on update.
        await attachmentService.updateAttachmentMetadata(user.token, attachmentId, metadataToSave);
        setMessage({ type: 'success', text: 'Attachment metadata updated successfully!' });
      } else { // Create mode
        const createdAttachment = await attachmentService.createAttachmentMetadata(user.token, metadataToSave);
        setMessage({ type: 'success', text: `Attachment metadata created successfully (ID: ${createdAttachment.id})` });
      }

      setTimeout(() => {
        navigate('/Techmine/AttachementList');
      }, 2000); // Slightly longer delay to read success message

    } catch (apiError) {
      setMessage({ type: 'error', text: apiError.message || 'An error occurred while saving attachment metadata.' });
    } finally {
      setLoading(false);
      setUploadProgress(0); // Reset progress
    }
  };

  if (pageLoading && attachmentId) {
    return <p>Loading attachment details...</p>;
  }

  return (
    <div className="attachment-form-page">
      <h1>{attachmentId ? 'Edit Attachment Metadata' : 'Create New Attachment'}</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      {loading && selectedFile && uploadProgress > 0 && (
        <div className="progress-bar">
            Uploading: {uploadProgress}%
            <div style={{ width: `${uploadProgress}%`, height: '10px', backgroundColor: 'green' }}></div>
        </div>
      )}


      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Attachment Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={attachmentMetadata.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Type:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="type"
                value="Forage"
                checked={attachmentMetadata.type === 'Forage'}
                onChange={handleChange}
              />
              Forage (Drilling)
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="Minage"
                checked={attachmentMetadata.type === 'Minage'}
                onChange={handleChange}
              />
              Minage (Mining)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="file">{attachmentId && selectedFile ? "Replace File (Optional):" : "File:"}</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            // Not strictly required if editing and not changing file
          />
          {selectedFile && <p>Selected file for upload: {selectedFile.name}</p>}
          {!selectedFile && attachmentMetadata.fileName && (
            <p>Current file: {attachmentMetadata.fileName} {attachmentMetadata.fileUrl && <a href={attachmentMetadata.fileUrl} target="_blank" rel="noopener noreferrer">(View)</a>}</p>
          )}
        </div>

        <button type="submit" className="submit-button-attachment" disabled={loading || !user}>
          {loading ? (attachmentId ? 'Updating...' : 'Saving...') : (attachmentId ? 'Update Metadata' : 'Create Attachment')}
        </button>
      </form>
    </div>
  );
};

export default AttachementFormPage;
