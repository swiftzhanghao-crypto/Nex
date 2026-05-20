import React from 'react';
import { CheckCircle, ClipboardCheck, Layers, ShoppingBag, User as UserIcon } from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 1, label: '订单类型', desc: '来源与模式', icon: Layers },
  { id: 2, label: '客户信息', desc: '客户/商机', icon: UserIcon },
  { id: 3, label: '产品配置', desc: '规格/价格', icon: ShoppingBag },
  { id: 4, label: '交付信息', desc: '备注/验收', icon: ClipboardCheck },
] as const;

interface WizardStepNavProps {
  currentStep: number;
}

const WizardStepNav: React.FC<WizardStepNavProps> = ({ currentStep }) => (
  <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100/50 dark:border-white/10 overflow-x-auto no-scrollbar">
    <div className="flex justify-between items-start relative">
      <div
        className="absolute top-5 h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full overflow-hidden"
        style={{ left: `calc(100% / ${WIZARD_STEPS.length} / 2)`, right: `calc(100% / ${WIZARD_STEPS.length} / 2)` }}
      >
        <div
          className="h-full bg-[#0071E3] dark:bg-[#0A84FF] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
        />
      </div>
      {WIZARD_STEPS.map((s) => (
        <div key={s.id} className="flex flex-col items-center gap-1.5 relative z-10 flex-1 transition-all group">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-apple ${
              currentStep > s.id
                ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20'
                : currentStep === s.id
                  ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110'
                  : 'bg-white dark:bg-[#2C2C2E] border-2 border-gray-200 dark:border-gray-600 text-gray-400'
            }`}
          >
            {currentStep > s.id ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-5 h-5" />}
          </div>
          <div className="text-center">
            <div
              className={`text-sm font-bold ${currentStep > s.id ? 'text-green-600' : currentStep === s.id ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`}
            >
              {s.label}
            </div>
            <div className="text-[10px] text-gray-400 hidden md:block mt-0.5">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default WizardStepNav;
