
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../../types';
import { ArrowLeft, FolderKanban, Clock, CheckCircle, AlertCircle, Save, Edit2, Calendar, User, TrendingUp, BarChart2 } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

const ProjectDetails: React.FC = () => {
  const { projects, setProjects, customers } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});

  if (!project) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">项目不存在</div>;

  const handleEdit = () => {
    setFormData(project);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...formData } as Project : p));
    setIsEditing(false);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch(status) {
        case 'Planning': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5"/> 规划中</span>;
        case 'Ongoing': return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold"><FolderKanban className="w-3.5 h-3.5"/> 进行中</span>;
        case 'OnHold': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold"><AlertCircle className="w-3.5 h-3.5"/> 挂起</span>;
        case 'Completed': return <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> 已完成</span>;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
              <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{project.name}</h1>
                  {getStatusBadge(project.status)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">ID: {project.id}</span>
                  <span>•</span>
                  <span>{project.customerName}</span>
              </div>
          </div>
        </div>
        <button 
            onClick={isEditing ? handleSave : handleEdit}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition shadow-apple flex items-center gap-2
            ${isEditing 
                ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80' 
                : 'bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? '保存' : '编辑'}
        </button>
      </div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Col: Status & Progress */}
            <div className="space-y-6">
                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">项目进度</div>
                     <div className="flex flex-col items-center justify-center py-4">
                         {isEditing ? (
                             <div className="w-full space-y-2">
                                 <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={formData.progress} 
                                    onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                                    className="w-full accent-blue-600 dark:accent-[#FF2D55]"
                                 />
                                 <div className="text-center font-bold text-xl text-gray-900 dark:text-white">{formData.progress}%</div>
                             </div>
                         ) : (
                             <div className="relative w-32 h-32 flex items-center justify-center">
                                 <svg className="w-full h-full transform -rotate-90">
                                     <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-white/10" />
                                     <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={377} strokeDashoffset={377 - (377 * project.progress) / 100}
                                        className="text-[#0071E3] dark:text-[#FF2D55] transition-all duration-1000 ease-out" />
                                 </svg>
                                 <span className="absolute text-2xl font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                             </div>
                         )}
                     </div>

                     {isEditing && (
                         <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">项目状态</label>
                                 <select 
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm dark:text-white"
                                 >
                                     <option value="Planning">规划中</option>
                                     <option value="Ongoing">进行中</option>
                                     <option value="OnHold">挂起</option>
                                     <option value="Completed">已完成</option>
                                     <option value="Cancelled">已取消</option>
                                 </select>
                             </div>
                         </div>
                     )}
                </div>

                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">关键时间</div>
                     <div className="space-y-4">
                         <div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">开始日期</div>
                             <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                 <Calendar className="w-4 h-4 text-blue-500" />
                                 {new Date(project.startDate).toLocaleDateString()}
                             </div>
                         </div>
                         <div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">预计结束</div>
                             <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                 <Calendar className="w-4 h-4 text-gray-400" />
                                 {project.endDate ? new Date(project.endDate).toLocaleDateString() : '未设定'}
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* Right Col */}
            <div className="md:col-span-2 space-y-6">
                <div className="unified-card dark:bg-[#1C1C1E] p-8 border-gray-100/50 dark:border-white/10 min-h-[300px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">项目概况</h3>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-white/5">
                        {isEditing ? (
                            <textarea 
                                value={formData.description || ''}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-transparent border-none outline-none resize-none"
                                rows={4}
                                placeholder="输入项目描述..."
                            />
                        ) : (
                            project.description || "暂无项目描述"
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">项目团队</h4>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 min-w-[200px]">
                                 <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                     <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-gray-900 dark:text-white">{project.pmName}</div>
                                     <div className="text-xs text-gray-500 dark:text-gray-400">项目经理 (PM)</div>
                                 </div>
                             </div>
                             {/* Add more team members here */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
