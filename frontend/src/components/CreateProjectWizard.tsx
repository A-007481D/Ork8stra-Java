"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CheckCircle, FolderGit2, Upload, Plus, ChevronRight, Loader2, Search, Layers, Zap, Box, Server, Layout, Database, Cpu } from "lucide-react";
import api from "../api";

interface WizardData {
    // Step 0: Project Context
    projectId: string | null;
    isNewProject: boolean;
    newProjectName: string;

    // Step 1: Source
    provider: "github" | "gitlab" | "bitbucket" | "git_url" | null;

    // Step 2: Repo
    repository: string;
    repositoryFullName: string;
    branch: string;

    // Step 3: Service Config
    serviceName: string;
    serviceType: "backend" | "frontend" | "database" | "worker"; // Added serviceType
    buildType: "manual" | "dockerfile";
    dockerfilePath: string;
    buildCommand: string;
    startCommand: string;
    port: string;
    envVars: { key: string; value: string }[];
}

interface Project {
    id: string;
    name: string;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    default_branch: string;
    updated_at: string;
    owner: { login: string; avatar_url: string };
}

interface GitHubBranch {
    name: string;
}

interface GitHubConnection {
    connected: boolean;
    username?: string;
}

const slideIn = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${index < currentStep
                                ? "bg-[#00E5FF] text-black"
                                : index === currentStep
                                    ? "bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                                    : "bg-white/10 text-slate-500"
                                }`}
                        >
                            {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`mt-2 text-xs font-medium ${index <= currentStep ? "text-white" : "text-slate-600"}`}>
                            {step}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-12 h-[1px] mx-2 mb-6 ${index < currentStep ? "bg-[#00E5FF]" : "bg-white/10"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function SelectionCard({
    icon,
    title,
    description,
    selected,
    onClick,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-lg border text-left transition-all ${selected
                ? "border-[#00E5FF] bg-[#00E5FF]/10"
                : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-[#00E5FF] text-black" : "bg-white/5 text-slate-400"}`}>
                    {icon}
                </div>
                <div>
                    <div className={`font-medium ${selected ? "text-white" : "text-slate-300"}`}>{title}</div>
                    <div className="text-sm text-slate-500">{description}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-[#00E5FF] ml-auto" />}
            </div>
        </button>
    );
}

export default function CreateServiceWizard({
    isOpen,
    onClose,
    onComplete,
    token,
    teamId,
    initialServiceType,
    initialProjectId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    token: string;
    teamId: string;
    initialServiceType?: "backend" | "frontend" | "database" | "worker";
    initialProjectId?: string;
}) {
    const [step, setStep] = useState(initialProjectId ? 1 : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data State
    const [existingProjects, setExistingProjects] = useState<Project[]>([]);
    const [githubConnection, setGithubConnection] = useState<GitHubConnection>({ connected: false });
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [branches, setBranches] = useState<GitHubBranch[]>([]);

    // Loading State
    const [, setLoadingProjects] = useState(false);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Search State
    const [searchRepoQuery, setSearchRepoQuery] = useState("");
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    const [data, setData] = useState<WizardData>({
        projectId: initialProjectId || null,
        isNewProject: false,
        newProjectName: "",

        provider: null,

        repository: "",
        repositoryFullName: "",
        branch: "main",

        serviceName: "",
        serviceType: initialServiceType || "backend",
        buildType: "dockerfile",
        dockerfilePath: "Dockerfile",
        buildCommand: "npm run build",
        startCommand: "npm start",
        port: "3000",
        envVars: [{ key: "", value: "" }],
    });

    const isGitProvider = ["github", "gitlab", "bitbucket"].includes(data.provider || "");
    const isGitUrlProvider = data.provider === "git_url";

    const steps = [
        "Project", // 0
        "Source",  // 1
        ...(isGitProvider || isGitUrlProvider ? ["Repository"] : []), // 2 (if git or url)
        "Configure", // 2 or 3
        "Review"     // 3 or 4
    ];

    const updateData = (updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    // --- Validation ---
    const canProceed = () => {
        // Step 0: Project
        if (step === 0) {
            if (data.isNewProject) return data.newProjectName.trim() !== "";
            return data.projectId !== null;
        }

        // Step 1: Source
        if (step === 1) return data.provider !== null;

        // Step 2: Repo (if git)
        if (step === 2 && isGitProvider) {
            return data.repositoryFullName !== "";
        }

        // Step 2: Git URL (if git_url)
        if (step === 2 && isGitUrlProvider) {
            return data.repository !== "";
        }

        // Step 3: Configure
        const configStepIndex = (isGitProvider || isGitUrlProvider) ? 3 : 2;
        if (step === configStepIndex) {
            return data.serviceName.trim() !== "";
        }

        return true;
    };

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        const minStep = initialProjectId ? 1 : 0;
        if (step > minStep) setStep(step - 1);
    };

    // --- Data Fetching ---
    const fetchProjects = useCallback(async () => {
        if (!teamId) return;
        setLoadingProjects(true);
        try {
            const res = await api.get(`/projects?teamId=${teamId}`);
            setExistingProjects(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProjects(false);
        }
    }, [token, teamId]);

    useEffect(() => { if (isOpen) fetchProjects(); }, [isOpen, fetchProjects]);

    const checkGitHubConnection = useCallback(async () => {
        try {
            const res = await api.get("/github/connection");
            setGithubConnection(res.data);
        } catch (e) { console.error(e); }
    }, [token]);

    const fetchRepos = useCallback(async () => {
        setLoadingRepos(true);
        try {
            const res = await api.get("/github/repos");
            setRepos(res.data || []);
        } catch (e) { console.error(e); } finally { setLoadingRepos(false); }
    }, [token]);

    const fetchBranches = useCallback(async (owner: string, repo: string) => {
        setLoadingBranches(true);
        try {
            const res = await api.get(`/github/branches?owner=${owner}&repo=${repo}`);
            setBranches(res.data || []);
        } catch (e) { console.error(e); } finally { setLoadingBranches(false); }
    }, [token]);

    const handleGitHubConnect = async () => {
        try {
            const res = await api.get("/github/auth");
            window.open(res.data.url, "_blank", "width=600,height=700");
        } catch (e) { console.error(e); }
    };

    // GitHub Message Listener
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === "GITHUB_CODE") {
                const { code } = event.data;
                try {
                    await api.post("/github/connect-code", { code });
                    setGithubConnection({ connected: true });
                    fetchRepos();
                } catch (e) { console.error(e); }
            }
            
            // Legacy handling for old callback style if any
            if (event.data.type === "GITHUB_CONNECTED") {
                const { access_token, username } = event.data.data;
                try {
                    await api.post("/github/connect", { access_token, username });
                    setGithubConnection({ connected: true, username });
                    fetchRepos();
                } catch (e) { console.error(e); }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [token, fetchRepos]);

    // Triggers
    useEffect(() => {
        if (data.provider === "github" && isOpen) checkGitHubConnection();
    }, [data.provider, isOpen, checkGitHubConnection]);

    useEffect(() => {
        if (githubConnection.connected && data.provider === "github") fetchRepos();
    }, [githubConnection.connected, data.provider, fetchRepos]);

    // --- Submit ---
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            let finalProjectId = data.projectId;

            if (data.isNewProject) {
                const pRes = await api.post("/projects", { name: data.newProjectName, team_id: teamId });
                finalProjectId = pRes.data.id;
            }

            if (!finalProjectId) throw new Error("No Project ID");

            // 2. Create Service
            const envVarMap = data.envVars.reduce((acc, curr) => {
                if (curr.key) acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const selectedPort = data.port.trim();
            if (selectedPort && !envVarMap.PORT) {
                envVarMap.PORT = selectedPort;
            }

            await api.post(`/projects/${finalProjectId}/apps`, {
                name: data.serviceName,
                gitRepoUrl: data.repository,
                buildBranch: data.branch,
                dockerfilePath: data.buildType === "dockerfile" ? (data.dockerfilePath || "Dockerfile") : null,
                envVars: envVarMap
            });

            onComplete();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Helper IDs for step rendering logic
    const showRepoStep = step === 2 && (isGitProvider || isGitUrlProvider);
    const showConfigStep = step === 3; // Now simplified as both paths have step 2 (repo)
    const showReviewStep = step === 4;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0A] w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#050505]">
                    <h2 className="text-base font-semibold text-white">Create New Service</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 #0A0A0A' }}>
                    <StepIndicator steps={steps} currentStep={step} />

                    <div className="min-h-[300px]">
                        <AnimatePresence mode="wait">

                            {/* STEP 0: Project Context */}
                            {step === 0 && (
                                <motion.div key="step0" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Select Project Context</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Existing Projects */}
                                        {existingProjects.map(p => (
                                            <SelectionCard
                                                key={p.id}
                                                title={p.name}
                                                description="Add to existing project"
                                                icon={<Layers className="w-5 h-5" />}
                                                selected={!data.isNewProject && data.projectId === p.id}
                                                onClick={() => updateData({ isNewProject: false, projectId: p.id })}
                                            />
                                        ))}

                                        {/* Create New */}
                                        <SelectionCard
                                            title="Create New Project"
                                            description="Start a fresh workspace"
                                            icon={<Plus className="w-5 h-5" />}
                                            selected={data.isNewProject}
                                            onClick={() => updateData({ isNewProject: true, projectId: null, newProjectName: "" })}
                                        />
                                    </div>

                                    {data.isNewProject && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pt-2">
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Project Name</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={data.newProjectName}
                                                onChange={e => updateData({ newProjectName: e.target.value })}
                                                placeholder="e.g. E-commerce Platform"
                                                className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-[#00E5FF] focus:outline-none text-sm"
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP 1: Source */}
                            {step === 1 && (
                                <motion.div key="step1" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Service Source Code</h3>
                                    <SelectionCard
                                        title="GitHub"
                                        icon={<FolderGit2 className="w-5 h-5" />}
                                        description="Import from your GitHub repositories"
                                        selected={data.provider === "github"}
                                        onClick={() => updateData({ provider: "github" })}
                                    />
                                    <SelectionCard
                                        title="Import Git URL"
                                        icon={<Upload className="w-5 h-5" />}
                                        description="Deploy public repository or local path"
                                        selected={data.provider === "git_url"}
                                        onClick={() => updateData({ provider: "git_url" })}
                                    />
                                </motion.div>
                            )}

                            {/* STEP 2: Repo Selection (Git Only) */}
                            {showRepoStep && (
                                <motion.div key="step-repo" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                                    {isGitUrlProvider ? (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Enter Repository URL</h3>
                                            <div className="bg-[#111] border border-white/10 rounded-lg p-4 space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-2">GIT URL (HTTPS, SSH, or FILE://)</label>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="https://github.com/username/repo  or  file:///path/to/local"
                                                        value={data.repository}
                                                        onChange={e => {
                                                            const url = e.target.value;
                                                            // Try to extract name from url
                                                            const parts = url.split('/');
                                                            const name = parts[parts.length - 1]?.replace('.git', '') || "my-service";
                                                            updateData({ repository: url, serviceName: name });
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-[#00E5FF] focus:outline-none font-mono text-sm"
                                                    />
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    For local testing, use <code>file:///absolute/path/to/repo</code>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-2">Branch</label>
                                                    <input
                                                        type="text"
                                                        placeholder="main"
                                                        value={data.branch}
                                                        onChange={e => updateData({ branch: e.target.value })}
                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-[#00E5FF] focus:outline-none font-mono text-sm"
                                                    />
                                                </div>
                                                {/* <div className="mt-2 text-xs text-slate-500">
                                                    For local testing, use <code>file:///absolute/path/to/repo</code>
                                                </div> */}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            {!githubConnection.connected ? (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                                        <FolderGit2 className="w-8 h-8 text-slate-500" />
                                                    </div>
                                                    <h3 className="text-white font-medium mb-2">Connect to GitHub</h3>
                                                    <button onClick={handleGitHubConnect} className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00B8CC] text-black font-medium rounded-lg transition-colors">
                                                        Connect Account
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Select Repository</h3>
                                                        <div className="relative w-64">
                                                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                                                            <input type="text" placeholder="Search..." value={searchRepoQuery} onChange={e => setSearchRepoQuery(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 border-t border-white/10 pt-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        {loadingRepos ? <div className="text-center py-8 text-slate-500">Loading repositories...</div> : (
                                                            (repos || []).filter(r => r.full_name.toLowerCase().includes(searchRepoQuery.toLowerCase())).map(repo => (
                                                                <button
                                                                    key={repo.id}
                                                                    onClick={() => {
                                                                        const [owner, repoName] = repo.full_name.split('/');
                                                                        updateData({ repository: repo.html_url, repositoryFullName: repo.full_name, serviceName: repo.name, branch: repo.default_branch });
                                                                        fetchBranches(owner, repoName);
                                                                    }}
                                                                    className={`w-full text-left p-3 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-between group ${data.repository === repo.html_url ? 'border-[#00E5FF] bg-[#00E5FF]/5' : ''}`}
                                                                >
                                                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{repo.full_name}</span>
                                                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Branch Selection (shown after repo selected) */}
                                                    {data.repositoryFullName && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="mt-4 pt-4 border-t border-white/10"
                                                        >
                                                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Branch</label>
                                                            {loadingBranches ? (
                                                                <div className="flex items-center justify-center py-3 text-slate-500 text-sm gap-2">
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Loading branches...
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                                                                        className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-white text-sm cursor-pointer flex items-center justify-between hover:border-[#00E5FF]/50 transition-colors"
                                                                    >
                                                                        <span className="truncate font-mono">{data.branch || 'Select branch...'}</span>
                                                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showBranchDropdown ? 'rotate-90' : ''}`} />
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {showBranchDropdown && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                                                                transition={{ duration: 0.15 }}
                                                                                className="absolute z-50 w-full mt-1 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                                                                            >
                                                                                <div
                                                                                    className="max-h-48 overflow-y-auto py-1"
                                                                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 #111' }}
                                                                                >
                                                                                    {branches.map(branch => (
                                                                                        <button
                                                                                            key={branch.name}
                                                                                            onClick={() => {
                                                                                                updateData({ branch: branch.name });
                                                                                                setShowBranchDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${data.branch === branch.name
                                                                                                ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                                                                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                                                                }`}
                                                                                        >
                                                                                            <span className="font-mono">{branch.name}</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP: Configuration */}
                            {showConfigStep && (
                                <motion.div key="step-config" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Configure Service</h3>

                                    {/* Service Type */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Service Type</label>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <SelectionCard
                                                title="Backend API"
                                                description="Go, Node.js, Python server"
                                                icon={<Server className="w-5 h-5" />}
                                                selected={data.serviceType === "backend"}
                                                onClick={() => updateData({ serviceType: "backend" })}
                                            />
                                            <SelectionCard
                                                title="Frontend App"
                                                description="React, Vue, Static Site"
                                                icon={<Layout className="w-5 h-5" />}
                                                selected={data.serviceType === "frontend"}
                                                onClick={() => updateData({ serviceType: "frontend" })}
                                            />
                                            <SelectionCard
                                                title="Database"
                                                description="Postgres, Redis, Mongo"
                                                icon={<Database className="w-5 h-5" />}
                                                selected={data.serviceType === "database"}
                                                onClick={() => updateData({ serviceType: "database" })}
                                            />
                                            <SelectionCard
                                                title="Worker"
                                                description="Background Job Processor"
                                                icon={<Cpu className="w-5 h-5" />}
                                                selected={data.serviceType === "worker"}
                                                onClick={() => updateData({ serviceType: "worker" })}
                                            />
                                        </div>
                                    </div>

                                    {/* Build Strategy */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Build Strategy</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <SelectionCard
                                                title="Auto-detect"
                                                description="Use auto-detection"
                                                icon={<Zap className="w-5 h-5" />}
                                                selected={data.buildType === "manual"}
                                                onClick={() => updateData({ buildType: "manual", dockerfilePath: "" })}
                                            />
                                            <SelectionCard
                                                title="Dockerfile"
                                                description="Use existing Dockerfile"
                                                icon={<Box className="w-5 h-5" />}
                                                selected={data.buildType === "dockerfile"}
                                                onClick={() => updateData({ buildType: "dockerfile", dockerfilePath: data.dockerfilePath || "Dockerfile" })}
                                            />
                                        </div>
                                        {data.buildType === "dockerfile" && (
                                            <input
                                                type="text"
                                                value={data.dockerfilePath}
                                                onChange={e => updateData({ dockerfilePath: e.target.value })}
                                                placeholder="Dockerfile"
                                                className="mt-2 w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-white focus:border-[#00E5FF] focus:outline-none text-sm"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Service Name</label>
                                        <input type="text" value={data.serviceName} onChange={e => updateData({ serviceName: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-white focus:border-[#00E5FF] focus:outline-none text-sm" placeholder="my-service-api" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Port</label>
                                        <input type="text" value={data.port} onChange={e => updateData({ port: e.target.value })} placeholder="3000" className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-white focus:border-[#00E5FF] focus:outline-none text-sm" />
                                    </div>
                                    {/* Env Vars */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Environment Variables</label>
                                            <button onClick={() => updateData({ envVars: [...data.envVars, { key: "", value: "" }] })} className="text-xs text-[#00E5FF] hover:text-[#00B8CC] flex items-center gap-1">
                                                <Plus className="w-3 h-3" /> Add
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {data.envVars.map((env, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input placeholder="KEY" value={env.key} onChange={e => { const n = [...data.envVars]; n[i].key = e.target.value; updateData({ envVars: n }); }} className="flex-1 bg-[#111] border border-white/10 rounded p-2 text-sm text-white font-mono uppercase focus:border-[#00E5FF] focus:outline-none" />
                                                    <input placeholder="VALUE" value={env.value} onChange={e => { const n = [...data.envVars]; n[i].value = e.target.value; updateData({ envVars: n }); }} className="flex-1 bg-[#111] border border-white/10 rounded p-2 text-sm text-white font-mono focus:border-[#00E5FF] focus:outline-none" />
                                                    <button onClick={() => updateData({ envVars: data.envVars.filter((_, idx) => idx !== i) })} className="p-2 text-slate-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP: Review */}
                            {showReviewStep && (
                                <motion.div key="step-review" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Review & Deploy</h3>
                                    <div className="bg-[#111] p-4 rounded-lg border border-white/10 space-y-2 font-mono text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Project</span><span className="text-white">{data.isNewProject ? data.newProjectName + " (New)" : existingProjects.find(p => p.id === data.projectId)?.name}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Service</span><span className="text-white">{data.serviceName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Repo</span><span className="text-[#00E5FF] truncate max-w-[200px]">{data.repository}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Port</span><span className="text-white">{data.port}</span></div>
                                    </div>
                                    <div className="mt-4 p-3 rounded border border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] text-xs">
                                        ✓ Ready to deploy service.
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-[#050505] flex justify-between items-center">
                    <button onClick={step === 0 ? onClose : handleBack} className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
                        {step === 0 ? "Cancel" : "Back"}
                    </button>
                    <button
                        onClick={step === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={!canProceed() || isSubmitting}
                        className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${canProceed() && !isSubmitting
                            ? "bg-[#00E5FF] text-black hover:bg-[#00B8CC] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                            : "bg-white/5 text-slate-500 cursor-not-allowed"
                            }`}
                    >
                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</> : step === steps.length - 1 ? "Deploy Service" : "Continue"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
