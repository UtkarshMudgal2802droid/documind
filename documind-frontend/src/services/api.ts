import axios from 'axios';
import type { UploadResponse, SearchResponse } from '../types/document';
import type { LoginResponse } from '../types/auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    timeout: 30000, // 30 second timeout
});

// Helper to pull the secure token from the browser session
const getAuthToken = () => {
    const token = localStorage.getItem('documind_token');
    if (!token) {
        // Token expired or missing — force re-login
        localStorage.removeItem('documind_token');
        window.location.reload();
        throw new Error("Session expired. Redirecting to login.");
    }
    return token;
};

// Intercept 401 responses globally to handle token expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('documind_token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export const documentService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        if (!username.trim() || !password.trim()) {
            throw new Error("Username and password are required.");
        }

        const formData = new URLSearchParams();
        formData.append('username', username.trim());
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
                'Authorization': `Bearer ${getAuthToken()}`
            },
        });
        return response.data;
    },

    searchDocuments: async (query: string): Promise<SearchResponse> => {
        if (!query.trim()) {
            throw new Error("Search query cannot be empty.");
        }

        const response = await apiClient.get<SearchResponse>('/documents/search', {
            params: { query: query.trim() },
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        return response.data;
    }
};