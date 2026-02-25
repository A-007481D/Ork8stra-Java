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
    email?: string; // from GOrk8stra
    created_at?: string; // from GOrk8stra
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
    owner_id?: string; // from GOrk8stra
    createdAt: string;
    created_at?: string; // from GOrk8stra
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
    service_id?: string; // from GOrk8stra
    project_id?: string; // from GOrk8stra
    imageTag: string;
    status: string; // from GOrk8stra (was 'pending' | 'healthy' | 'unhealthy')
    createdAt: string;
    created_at?: string; // from GOrk8stra
    commit_hash?: string; // from GOrk8stra
    logs?: string; // from GOrk8stra
}

// API Response wrapper
export interface ApiError {
    message: string;
    status: number;
    path?: string;
}

export interface Team {
    id: string;
    organization_id: string;
    name: string;
    created_at: string;
}

export interface Service {
    id: string;
    name: string;
    project_id: string;
    type: "backend" | "frontend" | "database" | "worker";
    repo_url: string;
    branch: string;
    created_at: string;
    status?: 'live' | 'failed' | 'building';
    port?: number;
    build_type?: string;
    build_command?: string;
    start_command?: string;
    dockerfile_path?: string;
    env_vars?: string;
    env?: Record<string, string>;
}

export type ViewState =
    | { type: 'ROOT' }
    | { type: 'PROJECT'; project: Project }
    | { type: 'SERVICE'; service: Service; project: Project }
    | { type: 'SETTINGS'; view: 'MEMBERS' };
