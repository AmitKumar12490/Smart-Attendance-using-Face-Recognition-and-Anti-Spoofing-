import React, { useState, useEffect } from 'react';
import { CameraScanner } from '../components/attendance/CameraScanner';
import {
  Camera,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const MarkAttendancePage = () => {
  const [todayLogs, setTodayLogs] = useState([]);

  const fetchTodayLogs = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayLogs(res.data.attendance || []);
      }
    } catch (err) {
      console.error("Fetch today logs error:", err);
    }
  };

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  const handleAttendanceSuccess = () => {
    fetchTodayLogs();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider">
              Biometric Attendance Kiosk
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Touchless Facial Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Face biometric recognition with active multi-spectral anti-spoofing defense.
          </p>
        </div>

        <Link
          to="/"
          className="apple-btn-secondary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Grid: Camera Scanner (8 cols) + Real-time Entry Stream (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Biometric Camera Scanner */}
        <div className="lg:col-span-8">
          <CameraScanner onAttendanceSuccess={handleAttendanceSuccess} />
        </div>

        {/* Right 4 Cols: Live Terminal Activity Stream */}
        <div className="lg:col-span-4 space-y-4">
          <div className="apple-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="text-xs font-semibold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0071e3]" />
                <span>Today's Check-ins</span>
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-100">
                {todayLogs.length} Logged
              </span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50/70 transition-all flex items-center gap-3 text-xs"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0071e3] font-semibold text-xs flex items-center justify-center border border-blue-100 shrink-0">
                    {log.full_name ? log.full_name.charAt(0) : 'E'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-gray-900 truncate">{log.full_name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          log.status === 'PRESENT'
                            ? 'badge-present'
                            : log.status === 'LATE'
                            ? 'badge-late'
                            : 'badge-absent'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6b7280] truncate">
                      {log.designation} • {log.department_name}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#86868b] font-mono">
                      <span>{String(log.check_in_time || '').slice(11, 16)}</span>
                      <span className="text-emerald-600 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              ))}

              {todayLogs.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No check-ins recorded yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
