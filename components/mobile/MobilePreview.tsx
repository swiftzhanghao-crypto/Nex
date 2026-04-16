import React, { useState } from 'react';
import { X, ShoppingCart, Package, Wifi, Battery, Signal } from 'lucide-react';
import MobileOrderManager from './MobileOrderManager';
import MobileProductCenter from './MobileProductCenter';

interface MobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

type MobileTab = 'orders' | 'products';

const MobilePreview: React.FC<MobilePreviewProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('orders');

  if (!isOpen) return null;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'mobileBackdropIn 0.3s ease-out' }} />

      {/* iPhone 17 Shell */}
      <div
        className="relative"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'mobilePhoneIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Phone Frame — iPhone 17 (6.3", ~393×852 logical viewport) */}
        <div
          className="relative rounded-[54px] bg-[#1A1A1C] shadow-[0_0_0_2px_rgba(255,255,255,0.08),0_40px_80px_rgba(0,0,0,0.5)]"
          style={{ width: 393 + 24, height: 852 + 24, padding: 12 }}
        >
          {/* Titanium Side Buttons */}
          <div className="absolute -left-[3px] top-[140px] w-[3px] h-[32px] bg-[#3A3A3C] rounded-l-sm" />
          <div className="absolute -left-[3px] top-[190px] w-[3px] h-[56px] bg-[#3A3A3C] rounded-l-sm" />
          <div className="absolute -left-[3px] top-[256px] w-[3px] h-[56px] bg-[#3A3A3C] rounded-l-sm" />
          <div className="absolute -right-[3px] top-[200px] w-[3px] h-[72px] bg-[#3A3A3C] rounded-r-sm" />

          {/* Screen Bezel */}
          <div
            className="relative w-[393px] h-[852px] rounded-[44px] overflow-hidden bg-white dark:bg-black"
          >
            {/* Dynamic Island */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
              <div className="mt-[11px] w-[126px] h-[37px] bg-black rounded-full flex items-center justify-center gap-2">
                <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a2e] ring-1 ring-[#2a2a3e]" />
              </div>
            </div>

            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-40 h-[54px] flex items-end justify-between px-8 pb-0">
              <span className="text-[15px] font-semibold text-gray-900 dark:text-white tabular-nums" style={{ fontFamily: '-apple-system, SF Pro Text' }}>
                {timeStr}
              </span>
              <div className="flex items-center gap-1">
                <Signal className="w-[15px] h-[15px] text-gray-900 dark:text-white" />
                <Wifi className="w-[15px] h-[15px] text-gray-900 dark:text-white" />
                <Battery className="w-[22px] h-[11px] text-gray-900 dark:text-white" />
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute top-[54px] left-0 right-0 bottom-[83px] overflow-hidden">
              {activeTab === 'orders' && <MobileOrderManager />}
              {activeTab === 'products' && <MobileProductCenter />}
            </div>

            {/* Bottom Tab Bar — iOS style */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-t border-black/[0.04] dark:border-white/[0.08]">
              <div className="flex items-start justify-around pt-2 pb-1">
                <TabBarItem
                  icon={<ShoppingCart className="w-[22px] h-[22px]" />}
                  label="订单"
                  isActive={activeTab === 'orders'}
                  onClick={() => setActiveTab('orders')}
                />
                <TabBarItem
                  icon={<Package className="w-[22px] h-[22px]" />}
                  label="产品"
                  isActive={activeTab === 'products'}
                  onClick={() => setActiveTab('products')}
                />
              </div>
              {/* Home Indicator */}
              <div className="flex justify-center pb-2 pt-1">
                <div className="w-[134px] h-[5px] rounded-full bg-gray-900/20 dark:bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="text-center mt-4">
          <span className="text-[13px] font-medium text-white/70">iPhone 17 · 393 × 852</span>
        </div>
      </div>

      <style>{`
        @keyframes mobileBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mobilePhoneIn {
          from { opacity: 0; transform: scale(0.85) translateY(40px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

const TabBarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 min-w-[64px] transition-colors ${
      isActive ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default MobilePreview;
