import api from './index';
import type { Project, CreateProjectRequest } from '../types';

export const projectsApi = {
    /**
     * Get all projects
     */
    getAll: async (): Promise<Project[]> => {
        const response = await api.get<Project[]>('/projects');
        return response.data;
    },

    /**
     * Get a single project by ID
     */
    getById: async (id: string): Promise<Project> => {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    },

    /**
     * Create a new project
     */
    create: async (data: CreateProjectRequest): Promise<Project> => {
        const response = await api.post<Project>('/projects', data);
        return response.data;
    },
};

export default projectsApi;
