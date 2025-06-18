import axios from 'axios';

// Adjust base URL to point to your C# backend's /api/incidents endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const INCIDENTS_API_URL = `${API_BASE_URL}/api/incidents`;

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

export const getIncidents = async (token, params) => { // params = { status, severity, titleSearch }
    if (!token) throw new Error("Authentication token is required to fetch incidents.");
    try {
        const response = await axios.get(INCIDENTS_API_URL, { ...getAuthHeaders(token), params });
        return response.data; // Return data directly
    } catch (error) {
        console.error('Error fetching incidents:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error fetching incidents');
    }
};

export const getIncidentById = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to fetch the incident.");
    if (!id) throw new Error("Incident ID is required.");
    try {
        const response = await axios.get(`${INCIDENTS_API_URL}/${id}`, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error fetching incident with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error fetching incident ${id}`);
    }
};

export const createIncident = async (token, incidentData) => { // incidentData is CreateIncidentDto
    if (!token) throw new Error("Authentication token is required to create an incident.");
    try {
        const response = await axios.post(INCIDENTS_API_URL, incidentData, getAuthHeaders(token));
        return response.data;
    } catch (error) {
        console.error('Error creating incident:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Error creating incident');
    }
};

export const updateIncident = async (token, id, incidentData) => { // incidentData is UpdateIncidentDto
    if (!token) throw new Error("Authentication token is required to update an incident.");
    if (!id) throw new Error("Incident ID is required for update.");
    try {
        await axios.put(`${INCIDENTS_API_URL}/${id}`, incidentData, getAuthHeaders(token));
        // PUT typically returns 204 NoContent or the updated resource.
        // For simplicity, returning a success indicator. Adjust if your API returns the updated object.
        return { success: true, id: id };
    } catch (error) {
        console.error(`Error updating incident with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error updating incident ${id}`);
    }
};

export const deleteIncident = async (token, id) => {
    if (!token) throw new Error("Authentication token is required to delete an incident.");
    if (!id) throw new Error("Incident ID is required for deletion.");
    try {
        await axios.delete(`${INCIDENTS_API_URL}/${id}`, getAuthHeaders(token));
        return { success: true, id: id };
    } catch (error) {
        console.error(`Error deleting incident with ID ${id}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(`Error deleting incident ${id}`);
    }
};
