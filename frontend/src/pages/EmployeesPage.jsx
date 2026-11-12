import React, { useState, useEffect } from 'react';
import { EmployeeModal } from '../components/employee/EmployeeModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Mail,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState({});
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteModalEmployee, setDeleteModalEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEmployeesData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department_id = departmentFilter;
      if (statusFilter) params.status = statusFilter;
      if (locationFilter && locationFilter !== 'All Locations') params.location = locationFilter;

      const [empRes, deptRes, todayRes] = await Promise.all([
        api.get('/employees', { params }),
        api.get('/employees/departments'),
        api.get('/attendance/today')
      ]);

      if (empRes.data.success) {
        setEmployees(empRes.data.employees || []);
      }
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments || []);
      }
      if (todayRes.data.success && todayRes.data.attendance) {
        const map = {};
        todayRes.data.attendance.forEach(att => {
          map[att.employee_id] = att;
        });
        setTodayAttendanceMap(map);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
      showToast(err.response?.data?.error || "Failed to load employee directory.", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, [search, departmentFilter, statusFilter, locationFilter]);

  // Actual Delete API Handler
  const confirmDelete = async () => {
    if (!deleteModalEmployee) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/employees/${deleteModalEmployee.id}`);
      if (res.data.success) {
        // Remove immediately from list
        setEmployees(prev => prev.filter(e => e.id !== deleteModalEmployee.id));
        showToast(`Employee ${deleteModalEmployee.full_name || deleteModalEmployee.employee_code} removed successfully.`);
        setDeleteModalEmployee(null);
      } else {
        showToast(res.data.error || "Failed to delete employee.", 'error');
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      showToast(err.response?.data?.error || "Failed to delete employee. Server error occurred.", 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-apple-dropdown border flex items-center gap-2.5 text-xs font-medium animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Employees
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Manage employee directory, assignments, and contact profiles.
          </p>
        </div>

        {/* Clear Add Employee Button */}
        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          className="apple-btn-primary flex items-center gap-2 text-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="apple-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search: "Search employees..." */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="apple-input w-full pl-9 pr-4 py-2 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-48">
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
          <div className="w-full md:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="w-full md:w-40">
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
      </div>

      {/* Employee Table */}
      <div className="apple-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">Loading workforce directory...</p>
          </div>
        ) : employees.length === 0 ? (
          /* Empty State (As specified) */
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">No employees yet</h3>
            <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
              Add your first employee to start tracking workplace attendance.
            </p>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
              className="apple-btn-primary text-xs mt-4 inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-gray-200/80 text-[#86868b] text-[11px] font-medium uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => {
                  const todayAtt = todayAttendanceMap[emp.id];
                  const liveStatus = todayAtt ? todayAtt.status : (emp.status === 'ACTIVE' ? 'ABSENT' : emp.status);
                  const checkInTime = todayAtt?.check_in_time ? todayAtt.check_in_time.slice(11, 16) : '—';

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Employee Name & Avatar */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/employees/${emp.id}`}
                          className="flex items-center gap-3 font-medium text-[#111827] hover:text-[#0071e3] transition-colors"
                        >
                          {emp.profile_photo_url ? (
                            <img
                              src={emp.profile_photo_url}
                              alt={emp.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0071e3] font-semibold text-xs flex items-center justify-center border border-blue-100">
                              {emp.first_name ? emp.first_name.charAt(0) : 'E'}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-900 block">{emp.full_name}</span>
                            <span className="text-[11px] text-gray-400 block">{emp.email}</span>
                          </div>
                        </Link>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-4 font-mono text-gray-700 font-medium">
                        {emp.employee_code}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {emp.department_name || 'Engineering'}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-gray-600">
                        {emp.designation}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{emp.location || 'Bengaluru'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            liveStatus === 'PRESENT'
                              ? 'badge-present'
                              : liveStatus === 'LATE'
                              ? 'badge-late'
                              : 'badge-absent'
                          }`}
                        >
                          {liveStatus}
                        </span>
                      </td>

                      {/* Check-in */}
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {checkInTime}
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <Link
                            to={`/employees/${emp.id}`}
                            title="View Employee Profile"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0071e3] hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setIsModalOpen(true);
                            }}
                            title="Edit Employee"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteModalEmployee(emp)}
                            title="Delete Employee"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        departments={departments}
        existingEmployees={employees}
        onSaved={(msg) => {
          setIsModalOpen(false);
          setEditingEmployee(null);
          fetchEmployeesData();
          showToast(msg);
        }}
      />

      {/* Delete Confirmation Modal (As specified in prompt) */}
      {deleteModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white border border-gray-200/90 rounded-2xl shadow-apple-dropdown p-6 animate-modal-enter">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-[#111827]">
              Delete employee?
            </h3>
            <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
              This will permanently remove{' '}
              <span className="font-semibold text-gray-900">
                {deleteModalEmployee.full_name || deleteModalEmployee.employee_code}
              </span>{' '}
              from the employee directory.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalEmployee(null)}
                className="apple-btn-secondary text-xs"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-apple-sm transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Employee</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
