import React from 'react';

export const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base font-semibold', sub: 'text-[10px]' },
    md: { icon: 'w-8 h-8', text: 'text-lg font-semibold', sub: 'text-xs' },
    lg: { icon: 'w-10 h-10', text: 'text-xl font-bold', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl font-bold', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Apple-style minimalist icon badge */}
      <div className={`${currentSize.icon} rounded-xl bg-gradient-to-b from-[#0071e3] to-[#005bb5] flex items-center justify-center text-white shadow-sm ring-1 ring-black/5`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-1/2 h-1/2 text-white"
        >
          <path
            d="M12 2L20 5.5V11.5C20 16.5 16.6 20.9 12 22C7.4 20.9 4 16.5 4 11.5V5.5L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`tracking-tight ${currentSize.text} text-[#111827]`}>
              SmartAttend
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-[#0071e3] border border-blue-200/60">
              3D
            </span>
          </div>
          <span className={`text-[#86868b] tracking-normal font-normal mt-0.5 ${currentSize.sub}`}>
            Workforce Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
