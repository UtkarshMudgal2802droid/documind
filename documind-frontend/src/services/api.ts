import axios from 'axios';
import type { UploadResponse, SearchResponse } from '../types/document';
import type { LoginResponse } from '../types/auth';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// Helper to pull the secure token from the browser session
const getAuthToken = () => {
    const token = localStorage.getItem('documind_token');
    if (!token) throw new Error("No authorization token found. Please log in.");
    return token;
};

export const documentService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        // FastAPI's OAuth2 expects x-www-form-urlencoded data
        const response = await apiClient.post<LoginResponse>('/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        // Save the token securely in the browser
        localStorage.setItem('documind_token', response.data.access_token);
        return response.data;
    },

    uploadDocument: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<UploadResponse>('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${getAuthToken()}` // Inject JWT
            },
        });
        return response.data;
    },

    searchDocuments: async (query: string): Promise<SearchResponse> => {
        const response = await apiClient.get<SearchResponse>('/documents/search', {
            params: { query },
            headers: {
                'Authorization': `Bearer ${getAuthToken()}` // Inject JWT
            }
        });
        return response.data;
    }
};