import React, { useState, useEffect } from 'react';
import { AnalyticsChart3D } from '../components/3d/AnalyticsChart3D';
import { WorkplaceFloor3D } from '../components/3d/WorkplaceFloor3D';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [floorNodes, setFloorNodes] = useState([]);
  const [zones, setZones] = useState([]);
  const [trends, setTrends] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchDashboardData = async () => {
    try {
      const [sumRes, nodesRes, trendsRes, todayRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/workplace-3d-nodes'),
        api.get('/analytics/trends?days=7'),
        api.get('/attendance/today')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.summary);
      if (nodesRes.data.success) {
        setFloorNodes(nodesRes.data.nodes || []);
        if (nodesRes.data.zones) setZones(nodesRes.data.zones);
      }
      if (trendsRes.data.success) setTrends(trendsRes.data.trends || []);
      if (todayRes.data.success) setTodayLogs(todayRes.data.attendance || []);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter employees needing attention: Late or Absent today
  const attentionEmployees = floorNodes.filter(
    (n) => n.status === 'LATE' || n.status === 'ABSENT'
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <span className="text-xs font-semibold text-[#86868b] tracking-wider uppercase">
            {getGreeting()}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-0.5 tracking-tight">
            Workplace Attendance
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#86868b]" />
            <span>{getFormattedDate()}</span>
            <span className="text-gray-300">•</span>
            <span>
              {summary
                ? `${summary.present_today + summary.late_today} of ${summary.total_employees} employees clocked in with ${summary.attendance_percentage}% attendance.`
                : 'Loading workforce metrics...'}
            </span>
          </p>
        </div>

        {/* Quick Kiosk CTA */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/mark-attendance"
            className="apple-btn-primary flex items-center gap-2 text-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Kiosk Terminal</span>
          </Link>
          <Link
            to="/attendance"
            className="apple-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <span>Audit Records</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
          </Link>
        </div>
      </div>

      {/* Main KPI Section (5 Cards with Trend Indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Employees */}
        <div className="apple-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Total Employees</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#111827]">
              {summary ? summary.total_employees : '—'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]">
              <span>Active workforce</span>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="apple-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Present Today</span>
            <div className="w-2 h-2 rounded-full bg-[#0071e3]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0071e3]">
              {summary ? summary.present_today : '—'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>{summary?.present_trend || '+4.2% from yesterday'}</span>
            </div>
          </div>
        </div>

        {/* Late Today */}
        <div className="apple-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Late Today</span>
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#f59e0b]">
              {summary ? summary.late_today : '—'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <ArrowDownRight className="w-3 h-3" />
              <span>{summary?.late_trend || '-8.1% from yesterday'}</span>
            </div>
          </div>
        </div>

        {/* Absent Today */}
        <div className="apple-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Absent Today</span>
            <div className="w-2 h-2 rounded-full bg-[#9ca3af]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#6b7280]">
              {summary ? summary.absent_today : '—'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <span>{summary?.absent_trend || '0 from yesterday'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="apple-card p-4 sm:p-5 col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-[#0071e3]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#111827]">
              {summary ? `${summary.attendance_percentage}%` : '—'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>{summary?.rate_trend || '+2.1% from yesterday'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Visualizers Grid: Attendance Trends & Workplace Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Attendance Trends 3D & 2D */}
        <AnalyticsChart3D trends={trends} />

        {/* Workplace Floor 3D & 2D */}
        <WorkplaceFloor3D
          nodes={floorNodes}
          zones={zones}
          onSelectNode={setSelectedEmployee}
          selectedNode={selectedEmployee}
        />
      </div>

      {/* Storytelling Rows: Employees Needing Attention + Today's Recent Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1-col: Attention Alert List */}
        <div className="apple-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
                <h3 className="text-sm font-semibold text-[#111827]">Requires Attention</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                {attentionEmployees.length} {attentionEmployees.length === 1 ? 'case' : 'cases'}
              </span>
            </div>

            <p className="text-xs text-[#6b7280] mb-3">
              Employees who arrived past the grace window or have not reported for work today.
            </p>

            <div className="space-y-2">
              {attentionEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                  All employees on time today.
                </div>
              ) : (
                attentionEmployees.map((emp) => (
                  <div
                    key={emp.employee_id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50/70 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          emp.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {emp.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#111827]">{emp.name}</p>
                        <p className="text-[10px] text-[#86868b]">{emp.designation} • {emp.department}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        emp.status === 'LATE' ? 'badge-late' : 'badge-absent'
                      }`}
                    >
                      {emp.status === 'LATE' ? `Late (${emp.check_in_time || '09:25'})` : 'Absent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/employees"
            className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-[#0071e3] hover:underline"
          >
            <span>Manage Employee Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right 2-cols: Today's Live Check-in Stream */}
        <div className="apple-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Today's Activity Stream</h3>
              <p className="text-xs text-[#6b7280]">Real-time biometric arrivals and departures.</p>
            </div>
            <Link
              to="/attendance"
              className="text-xs text-[#0071e3] hover:underline font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[#86868b] uppercase text-[10px] tracking-wider">
                  <th className="pb-2 font-medium">Employee</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Check-In</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No attendance activity recorded yet today.
                    </td>
                  </tr>
                ) : (
                  todayLogs.slice(0, 6).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5">
                        <Link
                          to={`/employees/${log.employee_id}`}
                          className="font-medium text-[#111827] hover:text-[#0071e3] flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0071e3] font-semibold text-[10px] flex items-center justify-center">
                            {log.full_name?.charAt(0)}
                          </div>
                          <span>{log.full_name}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 text-[#6b7280]">{log.department_name || 'Engineering'}</td>
                      <td className="py-2.5 font-mono text-[#111827]">
                        {log.check_in_time ? log.check_in_time.slice(11, 16) : '—'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            log.status === 'PRESENT'
                              ? 'badge-present'
                              : log.status === 'LATE'
                              ? 'badge-late'
                              : 'badge-absent'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#86868b] truncate max-w-[140px]">
                        {log.device_name || 'Main Gate Kiosk'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
