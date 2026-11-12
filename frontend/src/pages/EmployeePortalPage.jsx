import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmployeeIdCard } from '../components/employee/EmployeeIdCard';
import { Modal } from '../components/common/Modal';
import {
  UserCircle,
  Clock,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  Calendar,
  History,
  Camera,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const EmployeePortalPage = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [myLogs, setMyLogs] = useState([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        if (user?.employee_id) {
          const [empRes, attRes] = await Promise.all([
            api.get(`/employees/${user.employee_id}`),
            api.get(`/attendance?employee_id=${user.employee_id}`)
          ]);

          if (empRes.data.success) setEmployee(empRes.data.employee);
          if (attRes.data.success) setMyLogs(attRes.data.attendance);
        }
      } catch (err) {
        console.error("Fetch personal portal error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, [user]);

  const metrics = employee?.metrics || {};
  const todayLog = myLogs.find(l => l.date === new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10 text-center sm:text-left">
          <img
            src={employee?.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
            alt={user?.full_name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Welcome back, {user?.full_name || 'Employee'}!
            </h1>
            <p className="text-xs text-cyan-400 font-semibold">{employee?.designation || 'Staff Member'}</p>
            <p className="text-xs text-slate-400">
              Badge ID: <span className="font-mono text-cyan-300">{employee?.employee_code || user?.employee_code || 'SA-1001'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/mark-attendance"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Camera className="w-4 h-4 text-black" />
            <span>Mark Today's Attendance</span>
          </Link>

          <button
            onClick={() => setShowBadgeModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Digital ID</span>
          </button>
        </div>
      </div>

      {/* Today's Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c162e] to-slate-900 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${todayLog ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Today's Status</span>
            <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{todayLog ? `Checked In at ${String(todayLog.check_in_time || '').slice(11, 16)}` : 'Not Checked In Yet'}</span>
              {todayLog && <Badge variant={todayLog.status}>{todayLog.status}</Badge>}
            </div>
          </div>
        </div>

        {todayLog && (
          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500 block">CHECK-OUT</span>
              <span className="text-white font-bold">{String(todayLog.check_out_time || '').slice(11, 16) || 'Active Shift'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">TOTAL HOURS</span>
              <span className="text-cyan-400 font-bold">{todayLog.work_hours || 0.0} hrs</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${metrics.attendance_rate || 96}%`}
          subtitle="Monthly Score"
          icon={CalendarCheck}
          color="cyan"
        />

        <StatCard
          title="Days Present"
          value={metrics.present_days || 0}
          subtitle="On Time"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Late Days"
          value={metrics.late_days || 0}
          subtitle="Grace Exceeded"
          icon={Clock}
          color="amber"
          trendPositive={false}
        />

        <StatCard
          title="Total Hours Logged"
          value={`${Math.round(metrics.avg_work_hours ? metrics.avg_work_hours * 22 : 176)}h`}
          subtitle="Biometric terminal tally"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Attendance History */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          My Attendance Log History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="pb-3">Date</th>
                <th className="pb-3">Check-In</th>
                <th className="pb-3">Check-Out</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Work Hours</th>
                <th className="pb-3 text-right">Biometric Conf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {myLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono text-slate-300">{log.date}</td>
                  <td className="py-3 font-mono text-cyan-400">{String(log.check_in_time || '').slice(11, 16) || '—'}</td>
                  <td className="py-3 font-mono text-slate-400">{String(log.check_out_time || '').slice(11, 16) || '—'}</td>
                  <td className="py-3">
                    <Badge variant={log.status}>{log.status}</Badge>
                  </td>
                  <td className="py-3 font-mono text-slate-300">{log.work_hours || 0.0} hrs</td>
                  <td className="py-3 text-right font-mono text-emerald-400">
                    {Math.round((log.recognition_confidence || 0.98) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ID Badge Modal */}
      <Modal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        title="Employee Biometric ID Pass"
        maxWidth="max-w-md"
      >
        <div className="flex justify-center">
          <EmployeeIdCard employee={employee} />
        </div>
      </Modal>
    </div>
  );
};
