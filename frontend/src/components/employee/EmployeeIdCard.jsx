import React from 'react';
import { Logo } from '../common/Logo';
import { ShieldCheck, Cpu, QrCode } from 'lucide-react';

export const EmployeeIdCard = ({ employee }) => {
  if (!employee) return null;

  return (
    <div className="relative w-80 rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#0b1329] to-[#070b14] border-2 border-cyan-500/30 p-5 shadow-2xl overflow-hidden flex flex-col items-center text-center select-none">
      {/* Holographic Top Banner Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
      
      {/* Lanyard Clip Hole */}
      <div className="w-12 h-2.5 rounded-full bg-slate-800 border border-cyan-500/20 mb-4 shadow-inner" />

      {/* Corporate Header */}
      <div className="flex items-center gap-2 mb-4">
        <Logo size="sm" showText={true} />
      </div>

      {/* Profile Photo with Biometric Verification Ring */}
      <div className="relative w-28 h-28 rounded-2xl p-1 bg-gradient-to-tr from-cyan-500 via-blue-500 to-emerald-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        <img
          src={employee.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
          alt={employee.full_name}
          className="w-full h-full rounded-xl object-cover bg-slate-900"
        />
        <div className="absolute -bottom-2 right-1 bg-emerald-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
          <ShieldCheck className="w-3 h-3 stroke-[3]" />
          <span>Biometric</span>
        </div>
      </div>

      {/* Employee Details */}
      <h3 className="text-base font-black text-white tracking-wide mt-1">
        {employee.full_name || `${employee.first_name} ${employee.last_name}`}
      </h3>
      <p className="text-xs font-semibold text-cyan-400 mt-0.5">{employee.designation}</p>
      <p className="text-[11px] text-slate-400">{employee.department_name || employee.department || 'HQ Engineering'}</p>

      {/* Meta Grid */}
      <div className="mt-4 pt-3 border-t border-cyan-500/15 w-full grid grid-cols-2 gap-2 text-left text-[10px] font-mono">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">BADGE ID</span>
          <span className="text-white font-bold">{employee.employee_code}</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">SECURITY CLEARANCE</span>
          <span className="text-emerald-400 font-bold">LEVEL 4 - AI MESH</span>
        </div>
      </div>

      {/* Microchip & QR Barcode simulation */}
      <div className="mt-4 w-full pt-3 border-t border-cyan-500/15 flex items-center justify-between">
        {/* Smart Gold Chip */}
        <div className="w-9 h-7 rounded bg-amber-400/90 border border-amber-300 p-1 flex flex-col justify-between opacity-85 shadow-sm">
          <div className="h-0.5 w-full bg-amber-600 rounded" />
          <div className="h-0.5 w-full bg-amber-600 rounded" />
        </div>

        {/* Scan Barcode */}
        <div className="flex flex-col items-end">
          <div className="h-4 flex items-center gap-0.5">
            {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2].map((w, i) => (
              <span key={i} className="h-full bg-cyan-400/80 inline-block" style={{ width: `${w}px` }} />
            ))}
          </div>
          <span className="text-[8px] font-mono text-slate-500 mt-0.5">{employee.employee_code} • SEC-AUTH</span>
        </div>
      </div>
    </div>
  );
};
