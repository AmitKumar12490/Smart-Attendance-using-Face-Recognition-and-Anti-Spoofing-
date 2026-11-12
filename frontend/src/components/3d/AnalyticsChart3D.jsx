import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCcw,
  BarChart3,
  Box,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserX,
  Compass
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function DayColumnGroup({
  position,
  dayData,
  maxVal = 15,
  isHovered,
  isSelected,
  onHover,
  onUnhover,
  onSelect,
  activeFilters
}) {
  const groupRef = useRef();
  const plinthRef = useRef();

  // Compute normalized heights with smooth minimums
  const pHeight = activeFilters.present
    ? Math.max(0.15, ((dayData.present || 0) / maxVal) * 3.2)
    : 0.001;
  const lHeight = activeFilters.late
    ? Math.max(0.12, ((dayData.late || 0) / maxVal) * 3.2)
    : 0.001;
  const aHeight = activeFilters.absent
    ? Math.max(0.1, ((dayData.absent || 0) / maxVal) * 3.2)
    : 0.001;

  const maxHeight = Math.max(pHeight, lHeight, aHeight);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetScale = isSelected ? 1.08 : isHovered ? 1.04 : 1.0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 10
      );
    }
    if (plinthRef.current) {
      const glowIntensity = isSelected ? 0.45 : isHovered ? 0.3 : 0.08;
      plinthRef.current.material.opacity = THREE.MathUtils.lerp(
        plinthRef.current.material.opacity,
        glowIntensity,
        delta * 8
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(dayData);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(dayData);
      }}
      onPointerOut={() => onUnhover()}
    >
      {/* Interactive Plinth Base */}
      <mesh
        ref={plinthRef}
        position={[0.02, 0.02, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.95, 0.04, 0.7]} />
        <meshStandardMaterial
          color={isSelected ? '#0071e3' : isHovered ? '#38bdf8' : '#e2e8f0'}
          transparent
          opacity={0.08}
          roughness={0.2}
        />
      </mesh>

      {/* Present Bar (Cybernetic Blue/Sapphire) */}
      {activeFilters.present && (
        <group position={[-0.27, pHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, pHeight, 0.38]} />
            <meshStandardMaterial
              color={isSelected ? '#0062c4' : '#0071e3'}
              roughness={0.18}
              metalness={0.25}
              emissive="#0071e3"
              emissiveIntensity={isSelected ? 0.28 : isHovered ? 0.18 : 0.04}
            />
          </mesh>
          <mesh position={[0, pHeight / 2 + 0.005, 0]}>
            <planeGeometry args={[0.2, 0.36]} />
            <meshBasicMaterial
              color="#93c5fd"
              rotation={[-Math.PI / 2, 0, 0]}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Late Bar (Warm Amber Gold) */}
      {activeFilters.late && (
        <group position={[0.02, lHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, lHeight, 0.38]} />
            <meshStandardMaterial
              color={isSelected ? '#d97706' : '#f59e0b'}
              roughness={0.2}
              metalness={0.25}
              emissive="#f59e0b"
              emissiveIntensity={isSelected ? 0.28 : isHovered ? 0.18 : 0.04}
            />
          </mesh>
          <mesh position={[0, lHeight / 2 + 0.005, 0]}>
            <planeGeometry args={[0.2, 0.36]} />
            <meshBasicMaterial
              color="#fde68a"
              rotation={[-Math.PI / 2, 0, 0]}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Absent Bar (Slate Gray) */}
      {activeFilters.absent && (
        <group position={[0.31, aHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, aHeight, 0.38]} />
            <meshStandardMaterial
              color={isSelected ? '#6b7280' : '#9ca3af'}
              roughness={0.35}
              metalness={0.15}
              emissive="#9ca3af"
              emissiveIntensity={isSelected ? 0.22 : isHovered ? 0.12 : 0.02}
            />
          </mesh>
          <mesh position={[0, aHeight / 2 + 0.005, 0]}>
            <planeGeometry args={[0.2, 0.36]} />
            <meshBasicMaterial
              color="#e5e7eb"
              rotation={[-Math.PI / 2, 0, 0]}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Active Day Focused 3D Tag (ONLY rendered for hovered or selected day to prevent overlaps) */}
      {(isHovered || isSelected) && (
        <Html position={[0.02, maxHeight + 0.35, 0]} center distanceFactor={16}>
          <div className="bg-gray-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap animate-fade-in border border-white/10">
            {dayData.day_name} • {dayData.display_date || dayData.date}
          </div>
        </Html>
      )}
    </group>
  );
}

// Minimalist 2D Enhanced Recharts Component
function Clean2DChart({ data, activeFilters }) {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0071e3" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fcd34d" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d1d5db" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.9} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="day_name"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                const total = (d.present || 0) + (d.late || 0) + (d.absent || 0);
                return (
                  <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-apple-dropdown p-3.5 text-xs min-w-[170px]">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                      <p className="font-bold text-gray-900">{d.day_name}, {d.display_date || d.date}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0071e3]">
                        {d.attendance_rate}%
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {activeFilters.present && (
                        <div className="flex justify-between items-center text-[#0071e3]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#0071e3]" /> Present
                          </span>
                          <span className="font-bold">{d.present}</span>
                        </div>
                      )}
                      {activeFilters.late && (
                        <div className="flex justify-between items-center text-[#b45309]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Late
                          </span>
                          <span className="font-bold">{d.late}</span>
                        </div>
                      )}
                      {activeFilters.absent && (
                        <div className="flex justify-between items-center text-[#64748b]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#9ca3af]" /> Absent
                          </span>
                          <span className="font-bold">{d.absent}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between">
                      <span>Total Employees</span>
                      <span className="font-semibold text-gray-800">{total}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {activeFilters.present && (
            <Bar dataKey="present" name="Present" fill="url(#presentGrad)" radius={[5, 5, 0, 0]} />
          )}
          {activeFilters.late && (
            <Bar dataKey="late" name="Late" fill="url(#lateGrad)" radius={[5, 5, 0, 0]} />
          )}
          {activeFilters.absent && (
            <Bar dataKey="absent" name="Absent" fill="url(#absentGrad)" radius={[5, 5, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const AnalyticsChart3D = ({ trends = [], className = "" }) => {
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    present: true,
    late: true,
    absent: true
  });

  const controlsRef = useRef();

  // Normalize last 7 days chronologically
  const daysData = useMemo(() => {
    if (!trends || trends.length === 0) {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return dayNames.map((d, i) => ({
        day_name: d,
        date: `2026-10-${14 + i}`,
        display_date: `${14 + i} Oct`,
        present: 13 + (i % 3),
        late: 1 + (i % 2),
        absent: 1,
        attendance_rate: 93.3,
      }));
    }
    const sliced = trends.slice(-7);
    return sliced.map(item => ({
      ...item,
      present: item.present || 0,
      late: item.late || 0,
      absent: item.absent !== undefined ? item.absent : Math.max(0, 15 - (item.present || 0) - (item.late || 0)),
      attendance_rate: item.attendance_rate || (item.present ? Math.round(((item.present + (item.late || 0)) / 15) * 100) : 92.0),
    }));
  }, [trends]);

  // Aggregate high-level executive KPIs
  const kpiStats = useMemo(() => {
    if (daysData.length === 0) return { avgRate: 94.2, bestDay: 'Wed', totalPresent: 0, totalLate: 0 };
    const totalPresent = daysData.reduce((acc, d) => acc + (d.present || 0), 0);
    const totalLate = daysData.reduce((acc, d) => acc + (d.late || 0), 0);
    const totalLogged = totalPresent + totalLate;
    const avgRate = (daysData.reduce((acc, d) => acc + (d.attendance_rate || 0), 0) / daysData.length).toFixed(1);
    
    let best = daysData[0];
    daysData.forEach(d => {
      if ((d.attendance_rate || 0) > (best.attendance_rate || 0)) best = d;
    });

    return {
      avgRate,
      bestDay: best.day_name,
      bestRate: best.attendance_rate,
      totalPresent,
      totalLate,
      totalLogged,
      punctualityRate: totalLogged > 0 ? Math.round((totalPresent / totalLogged) * 100) : 95
    };
  }, [daysData]);

  const maxVal = Math.max(
    ...daysData.map(d => Math.max(d.present, d.late, d.absent, 1)),
    15
  );

  const toggleFilter = (series) => {
    setActiveFilters(prev => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[series] && activeCount <= 1) return prev;
      return { ...prev, [series]: !prev[series] };
    });
  };

  const setCameraPreset = (position) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...position);
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  };

  const activeDay = selectedDay || hoveredDay;

  return (
    <div className={`apple-card p-6 w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#111827]">Attendance Trends</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {kpiStats.avgRate}% Weekly Avg
            </span>
          </div>
          <p className="text-xs text-[#6b7280] mt-0.5">
            See how employee attendance changes throughout the week.
          </p>
        </div>

        {/* View Toggle & 3D Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewMode === '3D' && (
            <div className="flex items-center gap-1 bg-[#f5f5f7] p-0.5 rounded-lg border border-gray-200/80">
              <button
                onClick={() => setCameraPreset([0, 4.5, 7.5])}
                title="Isometric View"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Iso
              </button>
              <button
                onClick={() => setCameraPreset([0, 1.8, 7.8])}
                title="Front Elevation"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Front
              </button>
              <button
                onClick={() => setCameraPreset([0, 8.5, 0.1])}
                title="Top Plan View"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Top
              </button>
              <button
                onClick={() => setCameraPreset([0, 4.5, 7.5])}
                title="Reset Camera"
                className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-[#f5f5f7] p-0.5 rounded-lg border border-gray-200/80">
            <button
              onClick={() => setViewMode('3D')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === '3D'
                  ? 'bg-white text-[#111827] shadow-apple-sm font-semibold'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode('2D')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === '2D'
                  ? 'bg-white text-[#111827] shadow-apple-sm font-semibold'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3 mb-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Weekly Rate</span>
          <span className="font-bold text-[#0071e3] text-sm">{kpiStats.avgRate}%</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Peak Day</span>
          <span className="font-bold text-gray-900 text-sm">{kpiStats.bestDay} ({kpiStats.bestRate}%)</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Punctuality</span>
          <span className="font-bold text-emerald-600 text-sm">{kpiStats.punctualityRate}% on-time</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Total Check-Ins</span>
          <span className="font-bold text-gray-900 text-sm">{kpiStats.totalLogged} logged</span>
        </div>
      </div>

      {/* Interactive Legend & Series Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Filter Series:</span>
          
          <button
            onClick={() => toggleFilter('present')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              activeFilters.present
                ? 'bg-blue-50 border-blue-200 text-[#0071e3] font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3]" />
            <span>Present</span>
          </button>

          <button
            onClick={() => toggleFilter('late')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              activeFilters.late
                ? 'bg-amber-50 border-amber-200 text-[#b45309] font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span>Late</span>
          </button>

          <button
            onClick={() => toggleFilter('absent')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              activeFilters.absent
                ? 'bg-gray-100 border-gray-300 text-gray-700 font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#9ca3af]" />
            <span>Absent</span>
          </button>
        </div>

        {viewMode === '3D' && (
          <span className="text-[11px] text-[#86868b] flex items-center gap-1">
            <Compass className="w-3 h-3 text-gray-400" />
            Drag to rotate • Scroll to zoom • Click day below to inspect
          </span>
        )}
      </div>

      {/* Chart Canvas or 2D View */}
      {viewMode === '2D' ? (
        <Clean2DChart data={daysData} activeFilters={activeFilters} />
      ) : (
        <WebGLErrorBoundary fallback={<Clean2DChart data={daysData} activeFilters={activeFilters} />}>
          <div className="relative h-72 sm:h-80 w-full rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-[#f1f5f9] border border-gray-200/80 overflow-hidden shadow-inner">
            
            {/* Interactive Day Details Floating Card */}
            {activeDay && (
              <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-apple-dropdown p-4 pointer-events-auto min-w-[190px] animate-fade-in text-left">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#111827]">
                      {activeDay.day_name}, {activeDay.display_date || activeDay.date}
                    </p>
                    <p className="text-[10px] text-gray-500">Attendance Breakdown</p>
                  </div>
                  {selectedDay && (
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-[10px] text-gray-400 hover:text-gray-700 px-1 py-0.5 rounded bg-gray-100"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {/* Present */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="flex items-center gap-1.5 text-[#0071e3] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </span>
                      <span className="font-bold text-gray-900">{activeDay.present}</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#0071e3] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (activeDay.present / maxVal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Late */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="flex items-center gap-1.5 text-[#b45309] font-medium">
                        <Clock className="w-3 h-3" /> Late Arrival
                      </span>
                      <span className="font-bold text-gray-900">{activeDay.late}</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#f59e0b] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (activeDay.late / maxVal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Absent */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="flex items-center gap-1.5 text-[#64748b] font-medium">
                        <UserX className="w-3 h-3" /> Absent
                      </span>
                      <span className="font-bold text-gray-900">{activeDay.absent}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#9ca3af] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (activeDay.absent / maxVal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Rate */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[11px]">
                    <span className="text-[#86868b] font-medium">Compliance Rate:</span>
                    <span className="font-bold text-[#0071e3] text-xs">{activeDay.attendance_rate}%</span>
                  </div>
                </div>
              </div>
            )}

            <Canvas
              shadows
              camera={{ position: [0, 4.5, 7.5], fov: 42 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            >
              <ambientLight intensity={0.9} />
              <directionalLight
                position={[5, 12, 7]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight position={[-6, 6, -4]} intensity={0.4} />

              {/* Minimalist Studio Floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[18, 9]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.8} />
              </mesh>

              {/* Subtle Floor Grid lines */}
              <gridHelper args={[16, 16, '#cbd5e1', '#e2e8f0']} position={[0, 0.005, 0]} />

              {/* 7 Days Columns with expanded spacing */}
              <group position={[-3.15, 0, 0]}>
                {daysData.map((day, idx) => (
                  <DayColumnGroup
                    key={day.date || idx}
                    position={[idx * 1.05, 0, 0]}
                    dayData={day}
                    maxVal={maxVal}
                    isHovered={hoveredDay?.date === day.date}
                    isSelected={selectedDay?.date === day.date}
                    onHover={(d) => setHoveredDay(d)}
                    onUnhover={() => setHoveredDay(null)}
                    onSelect={(d) => setSelectedDay(prev => prev?.date === d.date ? null : d)}
                    activeFilters={activeFilters}
                  />
                ))}
              </group>

              <OrbitControls
                ref={controlsRef}
                maxPolarAngle={Math.PI / 2.2}
                minPolarAngle={Math.PI / 6}
                enableZoom={true}
                maxDistance={14}
                minDistance={4}
                enablePan={false}
              />
            </Canvas>
          </div>
        </WebGLErrorBoundary>
      )}

      {/* Interactive Responsive 7-Day Timeline Strip (Zero Overlap, Crystal-Clear Legibility) */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3 pt-3 border-t border-gray-100">
        {daysData.map((d) => {
          const isSelected = selectedDay?.date === d.date;
          const isHovered = hoveredDay?.date === d.date;
          return (
            <button
              key={d.date}
              onClick={() => setSelectedDay(prev => prev?.date === d.date ? null : d)}
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-blue-50 border-[#0071e3] text-[#0071e3] ring-2 ring-blue-100 shadow-xs'
                  : isHovered
                  ? 'bg-gray-50 border-gray-300 text-gray-900 shadow-xs'
                  : 'bg-white border-gray-200/90 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-[#0071e3]' : 'text-gray-900'}`}>
                  {d.day_name}
                </span>
              </div>
              <span className="block text-[10px] text-gray-400 mt-0.5 truncate">
                {d.display_date || d.date?.slice(5)}
              </span>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-blue-100 text-[#0071e3]' : 'bg-slate-100 text-slate-700'
              }`}>
                {d.attendance_rate}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
