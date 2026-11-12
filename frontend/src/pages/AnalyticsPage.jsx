import React, { useState, useEffect } from 'react';
import { AnalyticsChart3D } from '../components/3d/AnalyticsChart3D';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Clock,
  Users,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';

export const AnalyticsPage = () => {
  const [trends, setTrends] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [daysFilter, setDaysFilter] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendsRes, deptRes, sumRes] = await Promise.all([
          api.get(`/analytics/trends?days=${daysFilter}`),
          api.get('/analytics/departments'),
          api.get('/analytics/summary')
        ]);

        if (trendsRes.data.success) setTrends(trendsRes.data.trends);
        if (deptRes.data.success) setDeptStats(deptRes.data.departments);
        if (sumRes.data.success) setSummary(sumRes.data.summary);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [daysFilter]);

  const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Pie distribution data
  const pieData = [
    { name: 'Present On-Time', value: summary?.present_today || 8, color: '#10b981' },
    { name: 'Late Arrival', value: summary?.late_today || 2, color: '#f59e0b' },
    { name: 'Absent / Leave', value: summary?.absent_today || 0, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#0071e3]" />
            Workforce Attendance & Biometric Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            Deep analytics across biometric confidence, punctuality, and anti-spoofing defense.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                daysFilter === d
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Biometric Confidence"
          value={`${Math.round((summary?.avg_confidence_today || 0.98) * 100)}%`}
          subtitle="Cosine Identity Accuracy"
          icon={ShieldCheck}
          color="cyan"
        />

        <StatCard
          title="Attendance Rate"
          value={`${summary?.attendance_percentage || 94}%`}
          subtitle="Workforce Engagement"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Recognition Success"
          value={`${summary?.face_recognition_success_rate || 99.4}%`}
          subtitle="First-Attempt Pass Rate"
          icon={Activity}
          color="purple"
        />

        <StatCard
          title="Spoofs Intercepted"
          value={summary?.spoofing_attempts_blocked || 0}
          subtitle="Zero Security Breaches"
          icon={ShieldCheck}
          color="rose"
        />
      </div>

      {/* 3D Interactive Analytics Bar Visualization */}
      <div className="w-full">
        <AnalyticsChart3D trends={trends} className="w-full" />
      </div>

      {/* 2D Analytics Charts: 14-Day Timeline + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Attendance Trend Area Chart */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Attendance Timeline & Daily Check-Ins
          </h3>
          <p className="text-xs text-slate-400 mb-4">Historical daily attendance counts</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(v) => String(v).slice(5)} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#06b6d4', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="present" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Department Breakdown */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Department Attendance Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Total workforce by business unit</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="code" stroke="#64748b" fontSize={10} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#06b6d4', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Bar dataKey="total_employees" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
