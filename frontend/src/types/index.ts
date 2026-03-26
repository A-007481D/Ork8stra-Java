// User types
export interface User {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
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

// Organization types
// Organization types
export type OrgRole = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_VIEWER';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    owner_id?: string; // from GOrk8stra
    createdAt: string;
    created_at?: string; // from GOrk8stra
}

export interface OrgMember {
    id: string;
    userId: string;
    username: string;
    email: string;
    role: OrgRole;
    joinedAt: string;
}

// Team types
export interface Team {
    id: string;
    organization_id: string;
    name: string;
    created_at: string;
}

export interface TeamMember {
    id: string;
    userId: string;
    username: string;
    email: string;
    role: string; // "lead", "member", "viewer"
    joinedAt: string;
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
    updatedAt?: string;
    teamName?: string;
}

export interface CreateProjectRequest {
    name: string;
    team_id: string;
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
    dockerfilePath?: string;
    envVars?: Record<string, string>;
}

// Notification types
export type NotificationType = 
    | 'TEAM_INVITE'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'ROLE_CHANGED'
    | 'DEPLOY_SUCCESS'
    | 'DEPLOY_FAILED'
    | 'BUILD_STARTED'
    | 'BUILD_COMPLETED'
    | 'SECURITY_ALERT'
    | 'SYSTEM_INFO';

export interface Notification {
    id: string;
    userId: string;
    orgId?: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
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
    service_id?: string; // from GOrk8stra
    project_id?: string; // from GOrk8stra
    imageTag: string;
    status: string; // from GOrk8stra
    createdAt: string;
    created_at?: string; // from GOrk8stra
    commit_hash?: string; // from GOrk8stra
    logs?: string; // from GOrk8stra
}

// User Profile
export interface UserProfile extends User {
    organizations: {
        id: string;
        name: string;
        slug: string;
        role: string;
    }[];
}

// API Response wrapper
export interface ApiError {
    message: string;
    status: number;
    path?: string;
}

export interface Service {
    id: string;
    name: string;
    project_id: string;
    type: "backend" | "frontend" | "database" | "worker";
    repo_url: string;
    branch: string;
    created_at: string;
    status?: 'live' | 'failed' | 'building' | 'stopped' | 'restarting' | 'idle';
    deployment_status?: string;
    live_url?: string;
    port?: number;
    build_type?: string;
    build_command?: string;
    start_command?: string;
    dockerfile_path?: string;
    env_vars?: string;
    env?: Record<string, string>;
}

export type ViewState =
    | { type: 'GLOBAL' }
    | { type: 'OBSERVABILITY' }
    | { type: 'INFRA' }
    | { type: 'DELIVERY' }
    | { type: 'SECURITY' }
    | { type: 'IAM' }
    | { type: 'ROOT' }
    | { type: 'NOTIFICATIONS' }
    | { type: 'PROFILE' }
    | { type: 'PROJECT'; project: Project }
    | { type: 'SERVICE'; service: Service; project: Project }
    | { type: 'SETTINGS'; view: 'MEMBERS' };
