import React from 'react';
import { X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { User, UserType, RoleDefinition, Channel } from '../../../types';

export interface UserEditModalProps {
  userForm: Partial<User>;
  setUserForm: React.Dispatch<React.SetStateAction<Partial<User>>>;
  roles: RoleDefinition[];
  departments: { id: string; name: string }[];
  channels: Channel[];
  onClose: () => void;
  onSave: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ userForm, setUserForm, roles, departments, channels, onClose, onSave }) => (
<ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg flex flex-col animate-modal-enter border-white/10">
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">新增用户</h3>
                      <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">姓名</label>
                          <input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">邮箱</label>
                          <input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">手机号</label>
                          <input value={userForm.phone || ''} onChange={e => setUserForm({...userForm, phone: e.target.value})} placeholder="请输入手机号" className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 dark:placeholder-gray-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">角色</label>
                              <select
                                  multiple
                                  value={userForm.roles || []}
                                  onChange={e => {
                                      const selected = Array.from(e.target.selectedOptions, o => o.value);
                                      setUserForm({ ...userForm, roles: selected });
                                  }}
                                  className="w-full min-h-[7.5rem] p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white"
                              >
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">部门</label>
                              <select value={userForm.departmentId} onChange={e => setUserForm({...userForm, departmentId: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="">-- 未分配 --</option>
                                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">人员类型</label>
                              <select value={userForm.userType} onChange={e => { const ut = e.target.value as UserType; setUserForm({...userForm, userType: ut, channelId: ut === 'Internal' ? undefined : userForm.channelId}); }} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="Internal">内部员工</option>
                                  <option value="External">外部协作者</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">状态</label>
                              <select value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value as 'Active' | 'Inactive'})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                              </select>
                          </div>
                      </div>
                      {userForm.userType === 'External' && (
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                              关联渠道 <span className="text-red-500">*</span>
                          </label>
                          <select
                              value={userForm.channelId || ''}
                              onChange={e => setUserForm({...userForm, channelId: e.target.value || undefined})}
                              className={`w-full p-3 bg-white dark:bg-black border rounded-xl text-sm outline-none dark:text-white ${!userForm.channelId ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`}
                          >
                              <option value="">-- 请选择渠道 --</option>
                              {channels.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                          </select>
                          {!userForm.channelId && <p className="text-xs text-red-500 mt-1">外部人员必须关联一个渠道</p>}
                      </div>
                      )}
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                      <button onClick={() => onClose()} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-sm font-medium">取消</button>
                      <button onClick={onSave} className="px-5 py-2.5 bg-[#0071E3] text-white rounded-full text-sm font-medium hover:bg-[#0062CC] transition shadow-sm">保存</button>
                  </div>
              </div>
          </div>
          </ModalPortal>
);

export default UserEditModal;
