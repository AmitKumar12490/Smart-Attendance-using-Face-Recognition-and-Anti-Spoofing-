import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
