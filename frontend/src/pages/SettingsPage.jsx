import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Clock,
  Shield,
  Sliders,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    FACE_CONFIDENCE_THRESHOLD: '0.68',
    ANTI_SPOOFING_THRESHOLD: '0.72',
    OFFICE_START_TIME: '09:00',
    LATE_GRACE_PERIOD_MINUTES: '15',
    OFFICE_END_TIME: '17:00',
    SECURITY_ALERT_EMAIL: 'security@smartattend3d.io',
    TERMINAL_CAMERA_RESOLUTION: '1080p'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      } catch (err) {
        console.error("Fetch settings error:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/settings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Configure workplace shift rules, biometric thresholds, and alert destinations.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Work Schedule & Shifts */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Clock className="w-4 h-4 text-[#0071e3]" />
            <h3 className="text-sm font-semibold text-[#111827]">Shift Rules & Punctuality</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={settings.OFFICE_START_TIME}
                onChange={(e) => setSettings({ ...settings, OFFICE_START_TIME: e.target.value })}
                className="apple-input w-full px-3 py-2 text-xs"
                required
              />
              <span className="text-[11px] text-[#86868b] mt-1 block">Default work start</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.LATE_GRACE_PERIOD_MINUTES}
                onChange={(e) => setSettings({ ...settings, LATE_GRACE_PERIOD_MINUTES: e.target.value })}
                className="apple-input w-full px-3 py-2 text-xs"
                required
              />
              <span className="text-[11px] text-[#86868b] mt-1 block">Arrival grace window</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={settings.OFFICE_END_TIME}
                onChange={(e) => setSettings({ ...settings, OFFICE_END_TIME: e.target.value })}
                className="apple-input w-full px-3 py-2 text-xs"
                required
              />
              <span className="text-[11px] text-[#86868b] mt-1 block">Expected checkout time</span>
            </div>
          </div>
        </div>

        {/* Section 2: Biometrics & AI Sensitivity */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Shield className="w-4 h-4 text-[#0071e3]" />
            <h3 className="text-sm font-semibold text-[#111827]">Biometric Recognition & Anti-Spoofing</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Face Confidence Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-gray-800">Face Match Threshold</span>
                <span className="font-bold text-[#0071e3]">
                  {Math.round(parseFloat(settings.FACE_CONFIDENCE_THRESHOLD) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.90"
                step="0.01"
                value={settings.FACE_CONFIDENCE_THRESHOLD}
                onChange={(e) => setSettings({ ...settings, FACE_CONFIDENCE_THRESHOLD: e.target.value })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
              />
              <p className="text-[11px] text-[#86868b] mt-1">
                Minimum cosine similarity score required to positively identify an enrolled employee.
              </p>
            </div>

            {/* Anti-spoofing Sensitivity Slider */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-gray-800">Anti-Spoofing Sensitivity</span>
                <span className="font-bold text-[#f59e0b]">
                  {Math.round(parseFloat(settings.ANTI_SPOOFING_THRESHOLD) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.90"
                step="0.01"
                value={settings.ANTI_SPOOFING_THRESHOLD}
                onChange={(e) => setSettings({ ...settings, ANTI_SPOOFING_THRESHOLD: e.target.value })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#f59e0b]"
              />
              <p className="text-[11px] text-[#86868b] mt-1">
                Fourier frequency and micro-texture threshold for rejecting photo prints and screen replays.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Terminal Hardware & Security Dispatch */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Camera className="w-4 h-4 text-[#0071e3]" />
            <h3 className="text-sm font-semibold text-[#111827]">Hardware & Alert Notifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Security Alert Email
              </label>
              <input
                type="email"
                value={settings.SECURITY_ALERT_EMAIL}
                onChange={(e) => setSettings({ ...settings, SECURITY_ALERT_EMAIL: e.target.value })}
                className="apple-input w-full px-3 py-2 text-xs"
                required
              />
              <span className="text-[11px] text-[#86868b] mt-1 block">
                Destination for urgent anti-spoofing incident alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Camera Stream Resolution
              </label>
              <select
                value={settings.TERMINAL_CAMERA_RESOLUTION}
                onChange={(e) => setSettings({ ...settings, TERMINAL_CAMERA_RESOLUTION: e.target.value })}
                className="apple-input w-full px-3 py-2 text-xs"
              >
                <option value="720p">720p (1280x720) - Standard</option>
                <option value="1080p">1080p (1920x1080) - High Precision</option>
                <option value="4K">4K (3840x2160) - Ultra HD</option>
              </select>
              <span className="text-[11px] text-[#86868b] mt-1 block">
                Resolution for terminal webcam capture.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="apple-btn-primary text-xs flex items-center gap-2 px-5 py-2.5 shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
