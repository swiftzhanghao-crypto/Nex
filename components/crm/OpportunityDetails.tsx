
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Opportunity, OpportunityStage } from '../../types';
import { ArrowLeft, Target, DollarSign, Calendar, Save, Edit2, Building2, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const OpportunityDetails: React.FC = () => {
  const { opportunities, setOpportunities, customers } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const opportunity = opportunities.find(o => o.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Opportunity>>({});

  if (!opportunity) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">商机不存在</div>;

  const handleEdit = () => {
    setFormData(opportunity);
    setIsEditing(true);
  };

  const handleSave = () => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, ...formData } as Opportunity : o));
    setIsEditing(false);
  };

  const getStageColor = (stage: OpportunityStage) => {
    switch(stage) {
        case 'New': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'Qualification': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
        case 'Proposal': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'Negotiation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        case 'Closed Won': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'Closed Lost': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
        default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stages: OpportunityStage[] = ['New', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/opportunities')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
              <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{opportunity.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStageColor(opportunity.stage)}`}>
                      {opportunity.stage}
                  </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">ID: {opportunity.id}</span>
                  <span>•</span>
                  <span>{opportunity.customerName}</span>
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

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-page-enter">
        
        {/* Stage Progress (Visual) */}
        {!isEditing && opportunity.stage !== 'Closed Lost' && (
            <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                <div className="flex justify-between items-center relative z-10">
                    {stages.map((step, idx) => {
                        const currentIdx = stages.indexOf(opportunity.stage); 
                        const isDone = idx <= currentIdx;
                        return (
                            <div key={step} className="flex flex-col items-center gap-2 flex-1">
                                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${
                                    isDone 
                                    ? 'bg-[#0071E3] dark:bg-[#FF2D55] border-[#0071E3] dark:border-[#FF2D55]' 
                                    : 'bg-white dark:bg-[#2C2C2E] border-gray-300 dark:border-gray-600'
                                }`}></div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{step}</div>
                            </div>
                        )
                    })}
                    {/* Line */}
                    <div className="absolute top-2 left-0 w-full h-0.5 bg-gray-100 dark:bg-white/10 -z-0">
                         <div className="h-full bg-[#0071E3] dark:bg-[#FF2D55] transition-all duration-700" 
                              style={{ width: `${(stages.indexOf(opportunity.stage) / (stages.length - 1)) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Col */}
            <div className="space-y-6">
                 {/* Key Stats */}
                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10 space-y-6">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">预计金额</div>
                        {isEditing ? (
                            <input 
                                type="number" 
                                value={formData.expectedRevenue} 
                                onChange={e => setFormData({...formData, expectedRevenue: parseFloat(e.target.value)})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm dark:text-white"
                            />
                        ) : (
                            <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-1">
                                ¥{opportunity.expectedRevenue.toLocaleString()}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
                        <div>
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">赢单概率</div>
                             {isEditing ? (
                                <input 
                                    type="number" 
                                    value={formData.probability} 
                                    onChange={e => setFormData({...formData, probability: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm dark:text-white"
                                />
                             ) : (
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{opportunity.probability}%</div>
                             )}
                        </div>
                        <div>
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">预计成交</div>
                             {isEditing ? (
                                <input 
                                    type="date" 
                                    value={formData.closeDate ? new Date(formData.closeDate).toISOString().split('T')[0] : ''} 
                                    onChange={e => setFormData({...formData, closeDate: new Date(e.target.value).toISOString()})}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm dark:text-white"
                                />
                             ) : (
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{new Date(opportunity.closeDate).toLocaleDateString()}</div>
                             )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">商机阶段</label>
                            <select 
                                value={formData.stage} 
                                onChange={e => setFormData({...formData, stage: e.target.value as OpportunityStage})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm dark:text-white"
                            >
                                <option value="New">New</option>
                                <option value="Qualification">Qualification</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Closed Won">Closed Won</option>
                                <option value="Closed Lost">Closed Lost</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">关联客户</h3>
                    <div 
                        onClick={() => navigate(`/customers/${opportunity.customerId}`)}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{opportunity.customerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {opportunity.customerId}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Col */}
            <div className="md:col-span-2 space-y-6">
                <div className="unified-card dark:bg-[#1C1C1E] p-8 border-gray-100/50 dark:border-white/10 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">商机动态</h3>
                    
                    {/* Mock Activity Timeline */}
                    <div className="space-y-6 relative pl-2">
                         <div className="absolute left-[7px] top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-white/10"></div>
                         
                         <div className="relative pl-8">
                             <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1C1C1E] shadow-apple z-10"></div>
                             <div className="mb-1 text-sm font-bold text-gray-900 dark:text-white">商机创建</div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(opportunity.createdAt).toLocaleString()}</div>
                             <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                                 由 {opportunity.ownerName} 创建商机，初始阶段为 New。
                             </div>
                         </div>

                         {opportunity.stage !== 'New' && (
                             <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-[#1C1C1E] shadow-apple z-10"></div>
                                <div className="mb-1 text-sm font-bold text-gray-900 dark:text-white">阶段推进</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date().toLocaleDateString()}</div>
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                                    商机阶段变更为 <span className="font-bold">{opportunity.stage}</span>，赢单率更新为 {opportunity.probability}%。
                                </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;
