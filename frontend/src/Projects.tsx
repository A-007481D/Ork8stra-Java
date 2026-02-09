import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import projectsApi from './api/projects';
import type { Project } from './types';
import Button from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import CreateProjectModal from './components/features/CreateProjectModal';
import { ChevronRight } from 'lucide-react';

export default function Projects() {
    useAuth();
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await projectsApi.getAll();
            setProjects(data);
        } catch (err) {
            showToast('error', 'Failed to fetch projects');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateSuccess = (project: Project) => {
        setProjects([...projects, project]);
        setIsModalOpen(false);
        showToast('success', `Project "${project.name}" created successfully`);
    };

    return (
        <div className="p-10 md:p-14 min-h-full bg-[#0F0F0F] text-[#E3E3E3]">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Projects</h1>
                    <p className="text-[#888] text-lg">Manage your cloud workspaces</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                    New Project
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-[#666]">Loading projects...</div>
            ) : projects.length === 0 ? (
                <Card className="border-dashed border-[#2C2C2C] text-center py-20 bg-transparent">
                    <div className="text-4xl mb-4 grayscale opacity-50">📂</div>
                    <h3 className="text-xl font-semibold mb-2 text-[#E3E3E3]">No projects yet</h3>
                    <p className="text-[#666] mb-6">Create your first project to get started</p>
                    <Button onClick={() => setIsModalOpen(true)} variant="secondary">
                        Create Project
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="group border border-[#2C2C2C] bg-[#141414] hover:border-[#3A3A3A] hover:bg-[#1A1A1A] rounded-lg p-5 cursor-pointer transition-all relative overflow-hidden shadow-sm hover:shadow-md"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2">
                                <ChevronRight className="w-4 h-4 text-[#666]" />
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#262626] to-[#111] border border-white/5 flex items-center justify-center text-[#E3E3E3] font-bold text-sm shadow-inner group-hover:border-[#333] transition-colors">
                                    {project.name.substring(0, 2).toUpperCase()}
                                </div>
                                <Badge variant="live" className="text-[10px] uppercase">Active</Badge>
                            </div>

                            <h3 className="text-[#E3E3E3] font-medium text-[15px] mb-1 group-hover:text-white transition-colors">{project.name}</h3>
                            <div className="text-[#666] text-xs mb-6 flex flex-col gap-1">
                                <span>Namespace: <span className="font-mono text-[#888]">{project.k8sNamespace || 'N/A'}</span></span>
                                <span>Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-auto border-t border-[#222] pt-3">
                                <Button size="sm" variant="secondary" fullWidth className="bg-[#222] border-[#333] hover:bg-[#333] text-[#CCC]">
                                    View Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}
