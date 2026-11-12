import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';
import { User, LogOut, Menu, X, Camera, ChevronDown } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { label: 'Dashboard', path: '/', roles: ['ADMIN', 'SECURITY_OFFICER', 'EMPLOYEE'] },
    { label: 'Employees', path: '/employees', roles: ['ADMIN', 'SECURITY_OFFICER'] },
    { label: 'Attendance', path: '/attendance', roles: ['ADMIN', 'SECURITY_OFFICER', 'EMPLOYEE'] },
    { label: 'Analytics', path: '/analytics', roles: ['ADMIN', 'SECURITY_OFFICER'] },
    { label: 'Security', path: '/security', roles: ['ADMIN', 'SECURITY_OFFICER'] },
    { label: 'Reports', path: '/reports', roles: ['ADMIN', 'SECURITY_OFFICER'] },
    { label: 'Settings', path: '/settings', roles: ['ADMIN'] },
    { label: 'My Portal', path: '/my-portal', roles: ['EMPLOYEE'] },
  ];

  const userRole = user?.role || 'ADMIN';
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#111827] bg-[#f5f5f7] font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f5f5f7]/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Kiosk Button & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Kiosk Link */}
          <Link
            to="/mark-attendance"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f7] hover:bg-[#ebebef] text-xs font-medium text-[#1d1d1f] border border-gray-200/80 transition-all shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Kiosk Scanner</span>
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-gray-200/80 hover:border-gray-300 transition-colors bg-white"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#005bb5] flex items-center justify-center text-white font-medium text-xs shadow-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="hidden sm:block text-xs font-medium text-[#1d1d1f] max-w-[110px] truncate">
                {user?.full_name || 'Administrator'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86868b]" />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200/90 rounded-2xl shadow-apple-dropdown p-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-[#111827] truncate">
                      {user?.full_name || 'Administrator'}
                    </p>
                    <p className="text-[11px] text-[#86868b] truncate">
                      {user?.email || 'admin@smartattend3d.io'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-100">
                      {user?.role || 'ADMIN'}
                    </span>
                  </div>

                  <div className="py-1">
                    {user?.employee_id ? (
                      <Link
                        to={`/employees/${user.employee_id}`}
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#374151] hover:bg-[#f5f5f7] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6b7280]" />
                        <span>My Employee Profile</span>
                      </Link>
                    ) : (
                      <Link
                        to="/employees"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#374151] hover:bg-[#f5f5f7] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6b7280]" />
                        <span>Employee Directory</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200/80 bg-white py-3 px-4 shadow-lg space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'text-[#0071e3] bg-blue-50 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/mark-attendance"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Camera className="w-4 h-4 text-[#0071e3]" />
            <span>Kiosk Scanner</span>
          </Link>
        </div>
      )}
    </header>
  );
};
