import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Camera,
  CalendarCheck,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout, isAdmin, isSecurityOfficer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, role: 'ALL' },
    { label: 'Mark Attendance', path: '/mark-attendance', icon: Camera, role: 'ALL', highlight: true },
    { label: 'Employees', path: '/employees', icon: Users, role: 'ADMIN_ONLY' },
    { label: 'Attendance Logs', path: '/attendance', icon: CalendarCheck, role: 'ALL' },
    { label: 'Analytics & 3D', path: '/analytics', icon: BarChart3, role: 'ALL' },
    { label: 'Security & Spoofing', path: '/security', icon: ShieldAlert, role: 'ADMIN_ONLY', badge: 'AI Guard' },
    { label: 'Reports & Exports', path: '/reports', icon: FileText, role: 'ADMIN_ONLY' },
    { label: 'My Attendance', path: '/my-portal', icon: UserCircle, role: 'EMPLOYEE_ONLY' },
    { label: 'System Settings', path: '/settings', icon: Settings, role: 'ADMIN_ONLY' },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.role === 'ALL') return true;
    if (item.role === 'ADMIN_ONLY') return isAdmin || isSecurityOfficer;
    if (item.role === 'EMPLOYEE_ONLY') return !isAdmin;
    return true;
  });

  return (
    <aside
      className={`fixed lg:static top-16 bottom-0 left-0 z-30 transition-all duration-300 flex flex-col justify-between bg-[#070b14]/95 lg:bg-transparent backdrop-blur-xl border-r border-cyan-500/15 ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'
      } overflow-hidden`}
    >
      {/* Top Nav Items */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center justify-between">
          <span className={`${!isOpen ? 'lg:hidden' : 'block'}`}>Navigation</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-500" />
        </div>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                } ${item.highlight ? 'ring-1 ring-cyan-500/40' : ''}`
              }
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  item.highlight ? 'text-cyan-400 animate-pulse' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />
              <span className={`truncate ${!isOpen ? 'lg:hidden' : 'block'}`}>
                {item.label}
              </span>

              {item.badge && isOpen && (
                <span className="ml-auto text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Info / System Health */}
      <div className="p-3 border-t border-cyan-500/10 bg-slate-950/40">
        <div className={`p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 mb-2 ${!isOpen ? 'lg:hidden' : 'block'}`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">AI Shield v2.4 Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Liveness & Anti-Spoofing: <span className="text-emerald-400 font-mono">SECURE</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={`${!isOpen ? 'lg:hidden' : 'block'}`}>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
