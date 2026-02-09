import api from './index';
import type { LoginRequest, RegisterRequest, TokenResponse } from '../types';

export const authApi = {
    /**
     * Login with username and password
     */
    login: async (data: LoginRequest): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/login', data);
        return response.data;
    },

    /**
     * Register a new user
     */
    register: async (data: RegisterRequest): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/register', data);
        return response.data;
    },

    /**
     * Check if auth service is healthy
     */
    health: async (): Promise<string> => {
        const response = await api.get<string>('/auth/health');
        return response.data;
    },
};

export default authApi;
