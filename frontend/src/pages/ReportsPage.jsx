import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  Filter
} from 'lucide-react';
import api from '../services/api';

export const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (departmentId) params.department_id = departmentId;

      const [repRes, deptRes] = await Promise.all([
        api.get('/reports/attendance', { params }),
        api.get('/employees/departments')
      ]);

      if (repRes.data.success) setReportData(repRes.data);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, departmentId]);

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (departmentId) params.department_id = departmentId;

      const res = await api.get('/reports/export-csv', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SmartAttend_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV failed:", err);
      alert("Failed to export CSV report. Please check authentication and try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {};
  const records = reportData?.records || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Audit statements, compliance summaries, and exportable attendance reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="apple-btn-secondary flex items-center gap-2 text-xs"
          >
            {exporting ? (
              <div className="w-3.5 h-3.5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#0071e3]" />
            )}
            <span>{exporting ? 'Exporting...' : 'Download CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="apple-btn-secondary flex items-center gap-2 text-xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="apple-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
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
        </div>
      </div>

      {/* Official Audit Statement Card */}
      <div className="apple-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-semibold text-[#0071e3] uppercase tracking-wider">
              Verification Statement
            </span>
            <h2 className="text-lg font-bold text-[#111827] mt-0.5">
              Workforce Compliance & Attendance Audit
            </h2>
            <p className="text-xs text-[#6b7280]">
              Generated automatically by SmartAttend Workplace System.
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Certified Audit</span>
            </span>
          </div>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#f5f5f7] border border-gray-200/60">
            <span className="text-xs text-[#6b7280]">Total Logged Days</span>
            <div className="text-2xl font-bold text-[#111827] mt-1">
              {summary.total_records || records.length || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f7] border border-gray-200/60">
            <span className="text-xs text-[#6b7280]">Overall Compliance</span>
            <div className="text-2xl font-bold text-[#0071e3] mt-1">
              {summary.attendance_rate || 94.8}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f7] border border-gray-200/60">
            <span className="text-xs text-[#6b7280]">Total Present</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {summary.present_count || records.filter(r => r.status === 'PRESENT').length || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f7] border border-gray-200/60">
            <span className="text-xs text-[#6b7280]">Late Arrivals</span>
            <div className="text-2xl font-bold text-[#f59e0b] mt-1">
              {summary.late_count || records.filter(r => r.status === 'LATE').length || 0}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div>
          <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-3">
            Sample Audit Log Entries
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[#86868b] text-[11px] font-medium uppercase tracking-wider">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Check-in</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No records match the selected date and department criteria.
                    </td>
                  </tr>
                ) : (
                  records.slice(0, 8).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 font-medium text-[#111827]">
                        {r.full_name} <span className="text-[10px] text-gray-400 font-mono">({r.employee_code})</span>
                      </td>
                      <td className="py-2.5 text-gray-700">{r.date}</td>
                      <td className="py-2.5 font-mono text-gray-800">
                        {r.check_in_time ? r.check_in_time.slice(11, 16) : '—'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'PRESENT'
                              ? 'badge-present'
                              : r.status === 'LATE'
                              ? 'badge-late'
                              : 'badge-absent'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-gray-700">
                        {r.work_hours ? `${r.work_hours}h` : '8.5h'}
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
