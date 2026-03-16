
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Channel, ChannelType } from '../types';
import { ArrowLeft, Network, MapPin, Phone, Mail, Save, Edit2, Calendar, ShieldCheck, Tag } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface ChannelDetailsProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
}

const ChannelDetails: React.FC<ChannelDetailsProps> = ({ channels, setChannels }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const channel = channels.find(c => c.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Channel>>({});

  if (!channel) return <div className="p-10 text-center">Channel Not Found</div>;

  const handleEdit = () => {
    setFormData(channel);
    setIsEditing(true);
  };

  const handleSave = () => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...formData } as Channel : c));
    setIsEditing(false);
  };

  const getLevelBadgeColor = (level: string) => {
    switch(level) {
        case 'Tier1': return 'bg-purple-600 text-white';
        case 'Tier2': return 'bg-indigo-500 text-white';
        case 'Tier3': return 'bg-blue-500 text-white';
        default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
      {/* Sticky Header - Apple Style */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/channels')} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
              <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">{channel.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${channel.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {channel.status === 'Active' ? '合作中' : '已终止'}
                  </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">ID: {channel.id}</span>
                  <span>•</span>
                  <span>{channel.region}</span>
              </div>
          </div>
        </div>
        <button 
            onClick={isEditing ? handleSave : handleEdit}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition shadow-apple flex items-center gap-2
            ${isEditing ? 'bg-black text-white hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}
        >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? '保存' : '编辑信息'}
        </button>
      </div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Col */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-apple border border-gray-100/50">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">基本信息</h3>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">渠道名称</label>
                                <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">区域</label>
                                <input value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">类型</label>
                                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value as ChannelType})} className="w-full border p-2 rounded-lg text-sm bg-white">
                                    <option value="Distributor">经销商</option>
                                    <option value="Reseller">分销商</option>
                                    <option value="SI">集成商</option>
                                    <option value="ISV">ISV</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">等级</label>
                                <select value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value as 'Tier1' | 'Tier2' | 'Tier3'})} className="w-full border p-2 rounded-lg text-sm bg-white">
                                    <option value="Tier1">Tier 1</option>
                                    <option value="Tier2">Tier 2</option>
                                    <option value="Tier3">Tier 3</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">类型</span>
                                <span className="text-sm font-medium text-gray-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{channel.type}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">等级</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getLevelBadgeColor(channel.level)}`}>{channel.level}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">区域</span>
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400"/> {channel.region}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">签约日期</span>
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400"/> {new Date(channel.agreementDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-apple border border-gray-100/50">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">联系方式</h3>
                     {isEditing ? (
                         <div className="space-y-4">
                             <div><label className="text-xs text-gray-500 mb-1 block">联系人</label><input value={formData.contactName} onChange={e=>setFormData({...formData, contactName:e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50"/></div>
                             <div><label className="text-xs text-gray-500 mb-1 block">电话</label><input value={formData.contactPhone} onChange={e=>setFormData({...formData, contactPhone:e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50"/></div>
                             <div><label className="text-xs text-gray-500 mb-1 block">邮箱</label><input value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50"/></div>
                         </div>
                     ) : (
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">主要联系人</div>
                                <div className="text-sm font-bold text-gray-900">{channel.contactName}</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 font-mono">{channel.contactPhone}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{channel.email}</span>
                            </div>
                        </div>
                     )}
                </div>
            </div>

            {/* Right Col */}
            <div className="md:col-span-2 space-y-6">
                 {/* Performance or Info Card */}
                 <div className="bg-white p-8 rounded-3xl shadow-apple border border-gray-100/50">
                     <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                             <ShieldCheck className="w-5 h-5" />
                         </div>
                         <h3 className="text-lg font-bold text-gray-900">渠道资质与授权</h3>
                     </div>
                     <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed">
                         该渠道商已签署标准分销协议。具备 {channel.region} 区域的一级代理资格。
                         <br/>
                         授权产品范围：全线企业级产品。
                     </div>
                 </div>

                 {/* Placeholders for future modules */}
                 <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-3xl shadow-apple border border-gray-100/50 flex flex-col items-center justify-center text-center h-40">
                         <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
                         <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">关联商机</div>
                     </div>
                     <div className="bg-white p-6 rounded-3xl shadow-apple border border-gray-100/50 flex flex-col items-center justify-center text-center h-40">
                         <div className="text-3xl font-bold text-gray-900 mb-1">¥0</div>
                         <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">贡献营收</div>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetails;
