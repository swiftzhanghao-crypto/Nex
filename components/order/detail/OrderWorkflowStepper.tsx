import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import type { WorkflowStep } from './types';

export type OrderWorkflowStepperProps = {
    steps: WorkflowStep[];
    onStepClick: (stepId: string) => void;
};

export const OrderWorkflowStepper: React.FC<OrderWorkflowStepperProps> = React.memo(function OrderWorkflowStepper({ steps, onStepClick }) {
    return (
<div className="shrink-0 border-b border-gray-200/80 dark:border-white/10 px-4 md:px-6 overflow-x-auto" style={{background: 'linear-gradient(to bottom, #FDFBF7, #F5F2EC)'}}>
              <div className="max-w-content mx-auto w-full py-5">
                  <div className="flex justify-between items-start relative min-w-[700px]">
                      <div className="absolute top-5 h-0.5 bg-gray-300 dark:bg-white/10 -z-0 rounded-full overflow-hidden" style={{ left: `calc(100% / ${steps.length} / 2)`, right: `calc(100% / ${steps.length} / 2)` }}>
                      </div>
                      {steps.map((step, idx) => (
                          <div 
                              key={step.id} 
                              onClick={() => !step.disabled && onStepClick(step.id)} 
                              className={`flex flex-col items-center gap-1.5 relative z-10 flex-1 transition-all group ${
                                  step.disabled 
                                  ? 'cursor-not-allowed' 
                                  : 'cursor-pointer hover:scale-105'
                              }`}
                          >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  step.status === 'Completed' ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20 shadow-apple' : 
                                  step.status === 'Current' ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110' : 
                                  'bg-white dark:bg-[#2C2C2E] border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 shadow-sm'
                              }`}>
                                  {step.status === 'Completed' ? <CheckCircle className="w-5 h-5" /> : step.status === 'Locked' ? <Lock className="w-3.5 h-3.5" /> : <step.icon className="w-5 h-5" />}
                              </div>
                              <div className="text-center">
                                  <div className={`text-sm font-semibold ${step.status === 'Completed' ? 'text-green-600 dark:text-green-400' : step.status === 'Current' ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 dark:text-gray-500'}`}>{step.label}</div>
                                  {step.completedAt && (
                                      <div className="text-[9px] text-gray-400 font-mono mt-0.5 whitespace-nowrap">
                                          {new Date(step.completedAt).toLocaleDateString()} {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                  )}
                                  {step.status === 'Current' && <div className="text-[9px] font-bold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full mt-1 border border-blue-100 dark:border-blue-800/40">待处理</div>}
                                  {step.status === 'Completed' && <div className="text-[9px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-bold mt-0.5 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" />已完成</div>}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
    );
});
