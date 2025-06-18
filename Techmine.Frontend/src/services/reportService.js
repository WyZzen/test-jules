import axios from 'axios';

// Adjust base URL to point to your C# backend's /api/reports endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Default if not set
const REPORTS_API_URL = `${API_BASE_URL}/api/reports`;

const getAuthHeaders = (token) => {
    if (!token) {
        console.error("No token provided for API call");
        // Or throw new Error("Token is required for this operation");
        // Depending on how you want to handle missing tokens globally vs per call
    }
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' // Usually good to specify
        }
    };
};

export const getReports = async (token, params) => { // params = { status, titleSearch }
    if (!token) throw new Error("Authentication token is required to fetch reports.");
    try {
        const response = await axios.get(REPORTS_API_URL, { ...getAuthHeaders(token), params });
        return response.data; // Return data directly for convenience
    } catch (error) {
        console.error('Error fetching reports:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error fetching reports');
    }
};

export const getReportById = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to fetch the report.");
    if (!id) throw new Error("Report ID is required.");
    try {
        const response = await axios.get(`${REPORTS_API_URL}/${id}`, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error fetching report with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error fetching report ${id}`);
    }
};

export const createReport = async (token, reportData) => { // reportData is CreateReportDto
    if (!token) throw new Error("Authentication token is required to create a report.");
    try {
        const response = await axios.post(REPORTS_API_URL, reportData, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error('Error creating report:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error creating report');
    }
};

export const updateReport = async (token, id, reportData) => { // reportData is UpdateReportDto
    if (!token) throw new Error("Authentication token is required to update a report.");
    if (!id) throw new Error("Report ID is required for update.");
    try {
        // PUT requests typically don't return content, or return the updated object.
        // Axios PUT by default will resolve with the response (which might be empty for 204).
        await axios.put(`${REPORTS_API_URL}/${id}`, reportData, getAuthHeaders(token));
        // If API returns updated object: return response.data;
        // For 204 NoContent, no data to return, or return a success indicator.
        return { success: true, id: id };
    } catch (error) {
        console.error(`Error updating report with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error updating report ${id}`);
    }
};

export const deleteReport = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to delete a report.");
    if (!id) throw new Error("Report ID is required for deletion.");
    try {
        await axios.delete(`${REPORTS_API_URL}/${id}`, getAuthHeaders(token));
        // For 204 NoContent, no data to return.
        return { success: true, id: id };
    } catch (error) {
        console.error(`Error deleting report with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error deleting report ${id}`);
    }
};
