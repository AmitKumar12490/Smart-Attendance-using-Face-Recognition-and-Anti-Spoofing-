import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Download,
  Filter,
  Building2,
  MapPin,
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const INDIAN_LOCATIONS = [
  'All Locations',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Gurugram',
  'Noida',
  'Chennai',
  'Chandigarh'
];

export const AttendanceRecordsPage = () => {
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAttendanceLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (statusFilter) params.status = statusFilter;
      if (locationFilter && locationFilter !== 'All Locations') params.location = locationFilter;

      const [attRes, deptRes] = await Promise.all([
        api.get('/attendance', { params }),
        api.get('/employees/departments')
      ]);

      if (attRes.data.success) {
        setLogs(attRes.data.attendance || []);
      }
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments || []);
      }
    } catch (err) {
      console.error("Fetch attendance logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs();
  }, [dateFilter, departmentFilter, statusFilter, locationFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    // Generate CSV data from current filtered view
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Location', 'Date', 'Check-In', 'Check-Out', 'Working Hours', 'Status'];
    const rows = filteredLogs.map(l => [
      `"${l.full_name || ''}"`,
      `"${l.employee_code || ''}"`,
      `"${l.department_name || ''}"`,
      `"${l.location || 'Bengaluru'}"`,
      `"${l.date || ''}"`,
      `"${l.check_in_time ? l.check_in_time.slice(11, 16) : '—'}"`,
      `"${l.work_hours != null && l.work_hours !== '' ? `${Number(l.work_hours).toFixed(1)}h` : (l.status === 'ABSENT' ? '0.0h' : '—')}"`,
      `"${l.status || 'PRESENT'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAttend_Attendance_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (l.full_name || '').toLowerCase().includes(term) ||
      (l.employee_code || '').toLowerCase().includes(term) ||
      (l.department_name || '').toLowerCase().includes(term) ||
      (l.location || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Attendance
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Track employee attendance and daily check-ins.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
          className="apple-btn-secondary flex items-center gap-2 text-xs self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="apple-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID..."
              className="apple-input w-full pl-9 pr-4 py-2 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            >
              {INDIAN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(dateFilter || departmentFilter || statusFilter || locationFilter !== 'All Locations' || search) && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-[#6b7280]">
            <span>
              Showing {filteredLogs.length} filtered {filteredLogs.length === 1 ? 'record' : 'records'}
            </span>
            <button
              onClick={() => {
                setDateFilter('');
                setDepartmentFilter('');
                setStatusFilter('');
                setLocationFilter('All Locations');
                setSearch('');
              }}
              className="text-[#0071e3] hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="apple-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">Loading attendance records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          /* Empty State (As specified) */
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">No attendance records</h3>
            <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
              Attendance records will appear here once employees check in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-gray-200/80 text-[#86868b] text-[11px] font-medium uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th>
                  <th className="py-3 px-4">Working Hours</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  let displayDate = log.date;
                  try {
                    displayDate = new Date(log.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  } catch (e) {
                    displayDate = log.date;
                  }

                  const ci = log.check_in_time ? log.check_in_time.slice(11, 16) : '—';
                  const co = log.check_out_time ? log.check_out_time.slice(11, 16) : '—';
                  const hours = log.work_hours != null && log.work_hours !== '' ? `${Number(log.work_hours).toFixed(1)}h` : (log.status === 'ABSENT' ? '0.0h' : '—');

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/employees/${log.employee_id}`}
                          className="flex items-center gap-2.5 font-medium text-[#111827] hover:text-[#0071e3] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0071e3] font-semibold text-xs flex items-center justify-center shrink-0">
                            {log.full_name ? log.full_name.charAt(0) : 'E'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">{log.full_name}</span>
                            <span className="text-[10px] text-gray-400 font-mono block">{log.employee_code}</span>
                          </div>
                        </Link>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-gray-700">
                        {log.department_name || 'Engineering'}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {displayDate}
                      </td>

                      {/* Check-in */}
                      <td className="py-3 px-4 font-mono text-gray-800 font-medium">
                        {ci}
                      </td>

                      {/* Check-out */}
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {co}
                      </td>

                      {/* Working Hours */}
                      <td className="py-3 px-4 font-mono text-[#111827] font-medium">
                        {hours}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                            log.status === 'PRESENT'
                              ? 'badge-present'
                              : log.status === 'LATE'
                              ? 'badge-late'
                              : log.status === 'ON_LEAVE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'badge-absent'
                          }`}
                        >
                          {log.status === 'ON_LEAVE' ? 'On Leave' : log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
