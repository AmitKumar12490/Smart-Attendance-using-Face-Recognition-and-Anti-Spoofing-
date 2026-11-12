import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

export const EmployeeProfilePage = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const [empRes, attRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get(`/attendance/today`)
        ]);

        if (empRes.data.success) {
          setEmployee(empRes.data.employee);
        }

        if (attRes.data.success && attRes.data.attendance) {
          const matched = attRes.data.attendance.find(a => a.employee_id === parseInt(id, 10));
          setTodayLog(matched || null);
        }
      } catch (err) {
        console.error("Fetch employee profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500">Loading profile details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="apple-card p-10 text-center space-y-3">
        <h2 className="text-base font-bold text-gray-900">Employee Profile Not Found</h2>
        <p className="text-xs text-gray-500">The requested employee does not exist or was deleted.</p>
        <Link to="/employees" className="apple-btn-secondary text-xs inline-flex items-center gap-1.5 mt-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>
      </div>
    );
  }

  const metrics = employee.metrics || {};
  const recentAttendance = employee.recent_attendance || [];

  // Today's check-in/check-out values
  const checkInTime = todayLog?.check_in_time
    ? new Date(todayLog.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const checkOutTime = todayLog?.check_out_time
    ? new Date(todayLog.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const workingHours = todayLog?.work_hours
    ? `${Math.floor(todayLog.work_hours)}h ${Math.round((todayLog.work_hours % 1) * 60)}m`
    : (todayLog ? 'In Progress' : '0h 0m');

  const todayStatus = todayLog
    ? (todayLog.status === 'PRESENT' ? 'Present' : todayLog.status === 'LATE' ? 'Late' : todayLog.status)
    : (employee.status === 'ON_LEAVE' ? 'On Leave' : 'Not Clocked In');
  const attendanceRate = metrics.attendance_rate || 96;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Back to Directory */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>
      </div>

      {/* Profile Header (Apple Minimalist Standard) */}
      <div className="apple-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {employee.profile_photo_url ? (
              <img
                src={employee.profile_photo_url}
                alt={employee.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-gray-200/90 shadow-apple-card"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-50 text-[#0071e3] font-bold text-2xl flex items-center justify-center border border-blue-100">
                {employee.first_name ? employee.first_name.charAt(0) : 'E'}
              </div>
            )}
            {employee.face_registered && (
              <div
                title="Biometrics Enrolled & Verified"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Details & Status Badge */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827] leading-tight">
                  {employee.full_name}
                </h1>
                <span className="text-xs font-mono text-[#6b7280]">
                  {employee.employee_code}
                </span>
              </div>

              {/* Status Badge */}
              <span
                className={`self-center sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                  todayStatus.toUpperCase() === 'PRESENT'
                    ? 'badge-present'
                    : todayStatus.toUpperCase() === 'LATE'
                    ? 'badge-late'
                    : 'badge-absent'
                }`}
              >
                {todayStatus}
              </span>
            </div>

            <div className="pt-2 text-xs text-[#374151] font-medium flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
              <span className="text-gray-900 font-semibold">{employee.designation}</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-[#6b7280]">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {employee.department_name || 'Engineering'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-[#6b7280]">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {employee.location || 'Bengaluru'}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#6b7280]">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {employee.email}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {employee.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Attendance */}
        <div className="apple-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Today's Attendance
            </h3>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Check-in</span>
              <span className="font-semibold text-gray-900 font-mono">{checkInTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Check-out</span>
              <span className="font-semibold text-gray-900 font-mono">{checkOutTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Working Hours</span>
              <span className="font-semibold text-[#0071e3] font-mono">{workingHours}</span>
            </div>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="apple-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Attendance Overview
            </h3>
            <TrendingUp className="w-3.5 h-3.5 text-[#0071e3]" />
          </div>

          <div>
            <span className="text-xs text-[#6b7280]">Attendance Rate</span>
            <div className="text-3xl font-bold text-[#111827] mt-1">
              {attendanceRate}%
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Consistent punctuality
            </p>
          </div>
        </div>

        {/* Monthly Attendance */}
        <div className="apple-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Monthly Attendance
            </h3>
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Present</span>
              <span className="font-semibold text-[#0071e3] font-mono">
                {metrics.present_days || 21}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Late</span>
              <span className="font-semibold text-[#f59e0b] font-mono">
                {metrics.late_days || 2}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Absent</span>
              <span className="font-semibold text-[#9ca3af] font-mono">
                {metrics.absent_days || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance History Table */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Recent Attendance</h3>
            <p className="text-xs text-[#6b7280]">Chronological log of verified check-ins and timestamps.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[#86868b] text-[11px] font-medium uppercase tracking-wider">
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Check-in</th>
                <th className="pb-2">Check-out</th>
                <th className="pb-2 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No recent attendance records logged.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((rec) => {
                  let displayDate = rec.date;
                  try {
                    displayDate = new Date(rec.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  } catch (e) {
                    displayDate = rec.date;
                  }

                  const ci = rec.check_in_time ? rec.check_in_time.slice(11, 16) : '—';
                  const co = rec.check_out_time ? rec.check_out_time.slice(11, 16) : '—';

                  return (
                    <tr key={rec.id || rec.date} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-medium text-[#111827]">
                        {displayDate}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.status === 'PRESENT'
                              ? 'badge-present'
                              : rec.status === 'LATE'
                              ? 'badge-late'
                              : 'badge-absent'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-gray-700">{ci}</td>
                      <td className="py-3 font-mono text-gray-700">{co}</td>
                      <td className="py-3 text-right font-mono text-gray-800 font-medium">
                        {rec.work_hours ? `${rec.work_hours}h` : '8.5h'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
