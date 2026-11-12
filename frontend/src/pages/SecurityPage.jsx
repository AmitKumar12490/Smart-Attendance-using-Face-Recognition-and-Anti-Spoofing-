import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { SecurityShield3D } from '../components/3d/SecurityShield3D';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Radio,
  CheckCircle2,
  Terminal,
  Clock,
  Eye,
  Check
} from 'lucide-react';
import api from '../services/api';

export const SecurityPage = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    try {
      const params = {};
      if (severityFilter) params.severity = severityFilter;

      const [evRes, sumRes] = await Promise.all([
        api.get('/security/events', { params }),
        api.get('/security/summary')
      ]);

      if (evRes.data.success) setEvents(evRes.data.events);
      if (sumRes.data.success) setSummary(sumRes.data.summary);
    } catch (err) {
      console.error("Fetch security data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [severityFilter]);

  const handleResolve = async (eventId) => {
    try {
      await api.post(`/security/events/${eventId}/resolve`);
      fetchSecurityData();
    } catch (err) {
      alert("Failed to resolve event.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            AI Anti-Spoofing & Intrusion Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            Real-time multi-cue presentation attack detection (Fourier frequency moiré + LBP color texture analysis).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-700 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span>Biometric Sensor Firewall: SECURE</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Spoofs Blocked"
          value={summary?.spoofs_blocked || 0}
          subtitle="Photo / Screen / Replay"
          icon={ShieldAlert}
          color="rose"
        />

        <StatCard
          title="Active Alerts"
          value={summary?.unresolved_alerts || 0}
          subtitle="Awaiting Officer Review"
          icon={AlertTriangle}
          color="amber"
          trendPositive={false}
        />

        <StatCard
          title="Security Health"
          value={summary?.security_system_health || 'OPTIMAL'}
          subtitle="Multi-Sensor Verification"
          icon={ShieldCheck}
          color={summary?.security_system_health === 'ATTENTION_REQUIRED' ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Total Audit Events"
          value={summary?.total_events || 0}
          subtitle="Cryptographic Log Trail"
          icon={Terminal}
          color="cyan"
        />
      </div>

      {/* Filter & Incident Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Recorded Security & Anti-Spoofing Incidents
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input bg-slate-900 text-xs"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Attack Vector / Type</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Liveness Score</th>
                <th className="p-3.5">Terminal / Device</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <Badge variant={event.severity}>{event.severity}</Badge>
                  </td>
                  <td className="p-3.5 font-bold text-white">
                    {event.attack_vector || event.event_type}
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-xs truncate">
                    {event.description}
                  </td>
                  <td className="p-3.5 font-mono text-rose-400 font-bold">
                    {Math.round((event.liveness_score || 0.2) * 100)}%
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {event.device_name || 'Terminal #1'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">
                    {event.created_at}
                  </td>
                  <td className="p-3.5 text-right">
                    {event.resolved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolve(event.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Check className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                    No security incidents recorded. System operating securely.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
