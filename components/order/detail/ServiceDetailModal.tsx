import React from "react";
import { Briefcase, X } from "lucide-react";
import type { ServiceDetailItem } from "./types";

export type ServiceDetailModalProps = {
    item: ServiceDetailItem;
    onClose: () => void;
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            
            
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-teal-500"/>
                    服务明细详情
                </h3>
                <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition">
                    <X className="w-5 h-5 text-gray-400"/>
                </button>
            </div>
            <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">产品类型</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productType}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">产品规格</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productSpec}</div>
                    </div>
                    <div className="col-span-2">
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">产品名称</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{item.productName}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">授权方式/服务方式</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.serviceMethod}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">授权或服务期限</div>
                        <div className="text-sm font-medium text-teal-600 dark:text-teal-400">{item.servicePeriod}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">数量</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">x {item.quantity}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">服务成本预提单价</div>
                        <div className="text-sm font-bold font-mono text-gray-900 dark:text-white">¥{item.unitPrice.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">服务成本预提金额小计(含税)</div>
                        <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">¥{item.subtotal.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition">关闭</button>
            </div>
        </div>
    </div>
);
