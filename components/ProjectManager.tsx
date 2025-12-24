
import React, { useState } from 'react';
import { Project, ProjectStatus, Customer } from '../types';
import { Search, Plus, FolderKanban, Clock, CheckCircle, AlertCircle, Calendar, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  customers: Customer[];
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, setProjects, customers }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Project>>({
      name: '',
      customerId: '',
      status: 'Planning',
      progress: 0,
      startDate: ''
  });

  const filtered = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
      if (!formData.name || !formData.customerId) return;
      
      const customer = customers.find(c => c.id === formData.customerId);
      const newProj: Project = {
          id: `PRJ${Date.now()}`,
          name: formData.name,
          customerId: formData.customerId,
          customerName: customer?.companyName || 'Unknown',
          pmId: 'u1',
          pmName: 'Current User',
          startDate: formData.startDate || new Date().toISOString(),
          status: formData.status as ProjectStatus,
          progress: Number(formData.progress),
      };
      
      setProjects(prev => [newProj, ...prev]);
      setIsModalOpen(false);
      setFormData({ name: '', customerId: '', status: 'Planning', progress: 0, startDate: '' });
  };

  const getStatusBadge = (status: ProjectStatus) => {
      switch(status) {
          case 'Planning': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold"><Clock className="w-3 h-3"/> 规划中</span>;
          case 'Ongoing': return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold"><FolderKanban className="w-3 h-3"/> 进行中</span>;
          case 'OnHold': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold"><AlertCircle className="w-3 h-3"/> 挂起</span>;
          case 'Completed': return <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold"><CheckCircle className="w-3 h-3"/> 已完成</span>;
          default: return null;
      }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">项目管理</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理交付项目，监控进度与里程碑。</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm">
                <Plus className="w-4 h-4" /> 新建项目
            </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索项目名称或客户..." 
                    className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="p-4 pl-6">项目名称</th>
                            <th className="p-4">客户</th>
                            <th className="p-4">项目经理</th>
                            <th className="p-4">状态</th>
                            <th className="p-4">进度</th>
                            <th className="p-4">开始时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {filtered.map(proj => (
                            <tr 
                                key={proj.id} 
                                className="group cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors"
                                onClick={() => navigate(`/projects/${proj.id}`)}
                            >
                                <td className="p-4 pl-6">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{proj.name}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{proj.id}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{proj.customerName}</td>
                                <td className="p-4 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                     <UserIcon className="w-3 h-3 text-gray-400"/> {proj.pmName}
                                </td>
                                <td className="p-4">{getStatusBadge(proj.status)}</td>
                                <td className="p-4">
                                     <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${proj.progress}%` }}></div>
                                        </div>
                                        {proj.progress}%
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-gray-400"/>
                                    {new Date(proj.startDate).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">暂无项目数据</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-modal-enter border border-white/10">
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">新建项目</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Plus className="w-5 h-5 rotate-45"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">项目名称</label>
                            <input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black rounded-xl p-3 text-sm outline-none text-gray-900 dark:text-white" />
                        </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">客户</label>
                             <select value={formData.customerId} onChange={e=>setFormData({...formData, customerId:e.target.value})} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black rounded-xl p-3 text-sm outline-none text-gray-900 dark:text-white">
                                 <option value="">-- 选择客户 --</option>
                                 {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                             </select>
                         </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-sm font-medium">取消</button>
                        <button onClick={handleSave} className="px-5 py-2.5 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-md text-sm font-medium">保存</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProjectManager;
