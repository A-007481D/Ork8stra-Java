// User types
export interface User {
    id: string;
    username: string;
    email: string;
    roles: string[];
}

// Auth types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface TokenResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    username: string;
}

// Project types
export interface Project {
    id: string;
    name: string;
    owner: string;
    k8sNamespace?: string;
    createdAt?: string;
}

export interface CreateProjectRequest {
    name: string;
}

// Application types
export interface Application {
    id: string;
    name: string;
    projectId: string;
    gitRepoUrl: string;
    buildBranch: string;
    envVars: Record<string, string>;
    status?: 'pending' | 'building' | 'deployed' | 'failed';
}

export interface CreateApplicationRequest {
    name: string;
    gitRepoUrl: string;
    buildBranch: string;
    envVars?: Record<string, string>;
}

// Organization types
export interface Organization {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: string;
}

// Build types
export interface Build {
    id: string;
    applicationId: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    imageTag?: string;
    createdAt: string;
}

// Deployment types
export interface Deployment {
    id: string;
    applicationId: string;
    imageTag: string;
    status: 'pending' | 'healthy' | 'unhealthy';
    createdAt: string;
}

// API Response wrapper
export interface ApiError {
    message: string;
    status: number;
    path?: string;
}
