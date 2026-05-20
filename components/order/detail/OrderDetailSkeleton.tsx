import React from 'react';

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-100 dark:bg-white/10 rounded-xl animate-pulse ${className}`} />
);

export const OrderDetailSkeleton: React.FC = () => (
    <div className="flex flex-col min-h-screen bg-[#F5F2EC] dark:bg-black">
        {/* Header skeleton */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 pb-3">
            <div className="flex items-center gap-4">
                <SkeletonBlock className="w-9 h-9 !rounded-full" />
                <div className="space-y-2">
                    <SkeletonBlock className="w-48 h-6" />
                    <SkeletonBlock className="w-32 h-3" />
                </div>
                <div className="flex-1" />
                <div className="hidden md:flex items-center gap-3">
                    <SkeletonBlock className="w-16 h-7 !rounded-full" />
                    <SkeletonBlock className="w-16 h-7 !rounded-full" />
                    <SkeletonBlock className="w-16 h-7 !rounded-full" />
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <SkeletonBlock className="w-20 h-8 !rounded-lg" />
                    <SkeletonBlock className="w-16 h-8 !rounded-lg" />
                </div>
            </div>
            <div className="flex gap-4 mt-4 pb-1">
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-20 h-4" />
            </div>
        </div>
        {/* Content skeleton */}
        <div className="page-container space-y-2.5">
            {/* Stepper skeleton */}
            <div className="unified-card dark:bg-[#1C1C1E] px-6 py-5 border-gray-100/50 dark:border-white/10">
                <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <SkeletonBlock className="w-10 h-10 !rounded-full" />
                            <SkeletonBlock className="w-12 h-3" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Product table skeleton */}
            <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                    <SkeletonBlock className="w-5 h-5 !rounded-md" />
                    <SkeletonBlock className="w-32 h-5" />
                </div>
                <div className="p-5 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <SkeletonBlock className="w-9 h-9 !rounded-xl" />
                            <SkeletonBlock className="flex-1 h-5" />
                            <SkeletonBlock className="w-20 h-5" />
                            <SkeletonBlock className="w-16 h-5" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Info cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <SkeletonBlock className="w-5 h-5 !rounded-md" />
                            <SkeletonBlock className="w-24 h-5" />
                        </div>
                        {[1, 2, 3, 4].map(j => (
                            <div key={j} className="flex items-center gap-3">
                                <SkeletonBlock className="w-20 h-4" />
                                <SkeletonBlock className="flex-1 h-4" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
);
