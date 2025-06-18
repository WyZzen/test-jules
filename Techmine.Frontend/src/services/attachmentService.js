import axios from 'axios';
import { supabase } from './supabaseClient'; // For client-side storage operations

// Adjust base URL to point to your C# backend's /api/attachments endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ATTACHMENTS_API_URL = `${API_BASE_URL}/api/attachments`;

// Placeholder for your Supabase Storage bucket name
const BUCKET_NAME = process.env.REACT_APP_SUPABASE_BUCKET_NAME || 'attachments-bucket'; // Ensure this bucket exists in your Supabase project

const getAuthHeaders = (token) => {
    if (!token) {
        console.error("No token provided for API call");
    }
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// Function to upload file to Supabase Storage client-side
export const uploadFileToSupabaseStorage = async (file, pathPrefix = 'public') => {
    if (!file) throw new Error("No file provided for upload.");

    const filePath = `${pathPrefix}/${Date.now()}-${file.name}`; // Unique file path

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading file to Supabase Storage:', error);
        throw error;
    }

    // After upload, get the public URL (or just the path if you construct URLs differently)
    // Note: data.path is just the key/path, not the full URL.
    // You might need to construct the full URL based on your Supabase project URL and bucket.
    // For simplicity, let's assume we store the path and construct URL later or use Supabase client to get signed URL if needed.
    // Or, get public URL if bucket permissions allow:
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    console.log('File uploaded to Supabase Storage:', data, 'Public URL data:', urlData);
    return {
        fileName: file.name, // Original file name
        filePath: data.path, // Path in Supabase storage bucket
        fileUrl: urlData.publicUrl // Full public URL
    };
};


export const getAttachments = async (token, params) => { // params = { type, nameSearch }
    if (!token) throw new Error("Authentication token is required to fetch attachments.");
    try {
        const response = await axios.get(ATTACHMENTS_API_URL, { ...getAuthHeaders(token), params });
        return response.data;
    } catch (error) {
        console.error('Error fetching attachments:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error fetching attachments');
    }
};

export const getAttachmentById = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to fetch the attachment.");
    if (!id) throw new Error("Attachment ID is required.");
    try {
        const response = await axios.get(`${ATTACHMENTS_API_URL}/${id}`, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error fetching attachment with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error fetching attachment ${id}`);
    }
};

// createAttachment now only handles metadata. File upload should happen before calling this.
export const createAttachmentMetadata = async (token, attachmentMetadata) => { // attachmentMetadata is CreateAttachmentDto
    if (!token) throw new Error("Authentication token is required to create attachment metadata.");
    try {
        const response = await axios.post(ATTACHMENTS_API_URL, attachmentMetadata, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error('Error creating attachment metadata:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error creating attachment metadata');
    }
};

export const updateAttachmentMetadata = async (token, id, attachmentMetadata) => { // attachmentMetadata is UpdateAttachmentDto
    if (!token) throw new Error("Authentication token is required to update attachment metadata.");
    if (!id) throw new Error("Attachment ID is required for update.");
    try {
        await axios.put(`${ATTACHMENTS_API_URL}/${id}`, attachmentMetadata, getAuthHeaders(token));
        return { success: true, id: id };
    } catch (error) {
        console.error(`Error updating attachment metadata for ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error updating attachment ${id}`);
    }
};

export const deleteAttachment = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to delete an attachment.");
    if (!id) throw new Error("Attachment ID is required for deletion.");
    try {
        // First, attempt to delete metadata from your backend
        await axios.delete(`${ATTACHMENTS_API_URL}/${id}`, getAuthHeaders(token));

        // Note: The C# backend's deleteAttachment only removes the metadata.
        // The actual file in Supabase Storage is NOT deleted by the backend API.
        // If you need to delete the file from storage, you must do it client-side here
        // or have a trusted backend function (e.g., Supabase Edge Function or another C# endpoint with service key)
        // that can delete from storage. Client-side deletion from storage requires appropriate RLS policies on the bucket.

        // Example (conceptual) client-side storage deletion (requires attachment.filePath):
        // const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([attachment.filePath]);
        // if (storageError) {
        //   console.warn(`Metadata for ${id} deleted, but failed to delete file from storage: ${storageError.message}`);
        //   // Decide how to handle partial success. Maybe re-throw or return specific status.
        // }

        return { success: true, id: id, message: "Metadata deleted. File in storage may still exist." };
    } catch (error) {
        console.error(`Error deleting attachment with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error deleting attachment ${id}`);
    }
};
