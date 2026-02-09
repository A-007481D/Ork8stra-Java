import api from './index';
import type { Application, CreateApplicationRequest } from '../types';

export const applicationsApi = {
    /**
     * Get all applications for a project
     */
    getByProject: async (projectId: string): Promise<Application[]> => {
        const response = await api.get<Application[]>(`/projects/${projectId}/apps`);
        return response.data;
    },

    /**
     * Get a single application by ID
     */
    getById: async (id: string): Promise<Application> => {
        const response = await api.get<Application>(`/apps/${id}`);
        return response.data;
    },

    /**
     * Create a new application within a project
     */
    create: async (projectId: string, data: CreateApplicationRequest): Promise<Application> => {
        const response = await api.post<Application>(`/projects/${projectId}/apps`, data);
        return response.data;
    },
};

export default applicationsApi;
