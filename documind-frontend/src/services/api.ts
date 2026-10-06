import axios from 'axios';
import type { UploadResponse, SearchResponse } from '../types/document';
import type { LoginResponse } from '../types/auth';

export interface UserSession {
    id: string;
    device_info: string;
    ip_address: string;
    created_at: string;
    is_current: boolean;
}

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000, // 30 second timeout
});

export const TOKEN_KEY = import.meta.env.VITE_PROJECT_NAME ? `${import.meta.env.VITE_PROJECT_NAME.toLowerCase()}_token` : 'app_token';

// Decodes the JWT locally to check expiration time
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
};

// Sets an automatic timer to log the user out exactly when the token expires
export const startSessionTimer = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const timeUntilExpiry = (payload.exp * 1000) - Date.now();

        if (timeUntilExpiry <= 0) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.reload();
        } else {
            setTimeout(() => {
                localStorage.removeItem(TOKEN_KEY);
                alert("Your secure session has expired. Please log in again.");
                window.location.reload();
            }, timeUntilExpiry);
        }
    } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
    }
};

// Call it immediately when the app boots up
startSessionTimer();

// Helper to pull the secure token from the browser session
const getAuthToken = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token || isTokenExpired(token)) {
        // Token expired or missing — force re-login instantly without asking backend
        localStorage.removeItem(TOKEN_KEY);
        window.location.reload();
        throw new Error("Session expired. Redirecting to login.");
    }
    return token;
};

// Intercept 401 responses globally to handle token expiration
// IMPORTANT: Skip the /token endpoint so login errors are shown properly
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || '';
        if (error.response?.status === 401 && !requestUrl.includes('/token')) {
            localStorage.removeItem(TOKEN_KEY);
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
        localStorage.setItem(TOKEN_KEY, response.data.access_token);
        
        // Start the automatic logout timer for the new session
        startSessionTimer();
        
        return response.data;
    },

    uploadDocument: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<UploadResponse>('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
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
    },

    forgotPassword: async (username: string, new_password: string, confirm_password: string): Promise<{ message: string }> => {
        if (!username.trim() || !new_password.trim() || !confirm_password.trim()) throw new Error("All fields are required.");
        
        const response = await apiClient.post<{ message: string }>('/users/forgot-password', {
            username: username.trim(),
            new_password: new_password,
            confirm_password: confirm_password
        });
        return response.data;
    },

    logoutAllDevices: async (): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/users/logout-all', {}, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        // Clear local token since they just logged out of everything
        localStorage.removeItem(TOKEN_KEY);
        
        return response.data;
    },

    getSessions: async (): Promise<UserSession[]> => {
        const response = await apiClient.get<UserSession[]>('/users/sessions', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        return response.data;
    },

    revokeSession: async (sessionId: string): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/users/sessions/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        return response.data;
    }
};