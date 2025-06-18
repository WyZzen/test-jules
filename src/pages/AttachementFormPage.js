import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import './AttachementFormPage.css'; // Import the CSS

const AttachementFormPage = () => {
  const { id: attachmentId } = useParams(); // For potential future edit functionality
  const navigate = useNavigate();

  const [attachment, setAttachment] = useState({
    name: '',
    type: 'Forage', // Default type
    file_name: '', // To store the name of the selected file
    // file_url: '', // This would be set after actual upload
    // report_id: null, // If linking to reports, add this field
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // useEffect for fetching if attachmentId exists (for future edit mode)
  useEffect(() => {
    if (attachmentId) {
      // TODO: Implement fetch logic for editing an existing attachment
      // For now, this form is primarily for creation.
      console.log("Attachment ID detected (edit mode not fully implemented yet):", attachmentId);
      // Example: fetchAttachmentDetails(attachmentId);
    }
  }, [attachmentId]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttachment(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAttachment(prev => ({ ...prev, file_name: file.name }));
    } else {
      setSelectedFile(null);
      setAttachment(prev => ({ ...prev, file_name: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!attachment.name || !attachment.type) {
      setMessage({ type: 'error', text: 'Name and Type are required.' });
      setLoading(false);
      return;
    }
    if (!selectedFile && !attachmentId) { // Require file for new attachments
        setMessage({ type: 'error', text: 'A file is required for new attachments.' });
        setLoading(false);
        return;
    }

    // Actual file upload to Supabase Storage would happen here.
    // For now, we're just saving metadata including the file_name.
    // let fileUrl = attachment.file_url; // Keep existing if editing and no new file
    // if (selectedFile) {
    //   // const { data: uploadData, error: uploadError } = await supabase.storage
    //   //   .from('attachments-bucket') // replace with your bucket name
    //   //   .upload(`public/${selectedFile.name}`, selectedFile);
    //   // if (uploadError) {
    //   //   setMessage({ type: 'error', text: `File upload failed: ${uploadError.message}` });
    //   //   setLoading(false);
    //   //   return;
    //   // }
    //   // fileUrl = uploadData.path; // Or full URL depending on how you construct it
    //   console.log("Simulating file upload for:", selectedFile.name);
    //   // Placeholder: In a real scenario, you'd get the URL from Supabase Storage.
    //   // For now, we'll just use the file name as a placeholder or could construct a dummy path.
    // }


    try {
      let error = null;
      const attachmentDataToSave = {
        name: attachment.name,
        type: attachment.type,
        // file_url: fileUrl, // This would be the actual URL after upload
        file_name: attachment.file_name, // Storing the original file name
        // report_id: attachment.report_id,
      };

      if (attachmentId) {
        // Update existing attachment metadata (not fully implemented for file handling)
        // const { error: updateError } = await supabase
        //   .from('attachments')
        //   .update(attachmentDataToSave)
        //   .eq('id', attachmentId);
        // error = updateError;
        setMessage({ type: 'info', text: 'Update functionality is not fully implemented yet for files.' });
        setLoading(false); // Prevent further action for now
        return;
      } else {
        // Create new attachment metadata
        const { error: insertError } = await supabase
          .from('attachments')
          .insert([attachmentDataToSave]);
        error = insertError;
      }

      if (error) {
        setMessage({ type: 'error', text: `Error saving attachment: ${error.message}` });
      } else {
        setMessage({
          type: 'success',
          text: `Attachment ${attachmentId ? 'updated' : 'created'} successfully (metadata only)!`
        });
        setTimeout(() => {
          navigate('/Techmine/AttachementList');
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: `An unexpected error occurred: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attachment-form-page">
      <h1>{attachmentId ? 'Edit Attachment' : 'Create New Attachment'}</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Attachment Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={attachment.name}
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
                checked={attachment.type === 'Forage'}
                onChange={handleChange}
              />
              Forage (Drilling)
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="Minage"
                checked={attachment.type === 'Minage'}
                onChange={handleChange}
              />
              Minage (Mining)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="file">File:</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            // required={!attachmentId} // Only required for new attachments
          />
          {attachment.file_name && <p>Selected file: {attachment.file_name}</p>}
        </div>

        {/* Example for Report ID if linking attachments to reports */}
        {/* <div className="form-group">
          <label htmlFor="report_id">Related Report ID (Optional):</label>
          <input
            type="number" // Or a select dropdown fetching reports
            id="report_id"
            name="report_id"
            value={attachment.report_id || ''}
            onChange={handleChange}
          />
        </div> */}

        <button type="submit" className="submit-button-attachment" disabled={loading}>
          {loading ? (attachmentId ? 'Updating...' : 'Creating...') : (attachmentId ? 'Update Attachment' : 'Create Attachment')}
        </button>
      </form>
    </div>
  );
};

export default AttachementFormPage;
