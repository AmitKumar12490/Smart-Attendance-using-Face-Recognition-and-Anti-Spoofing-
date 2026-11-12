import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCcw,
  Box,
  LayoutGrid,
  X,
  ExternalLink,
  Clock,
  Building2,
  MapPin,
  Search,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_ZONES = [
  { id: 'reception', name: 'Reception', code: 'REC', center: [-5.5, 0.05, 3.8], size: [3.8, 3.0], color: '#f0f9ff', borderColor: '#bae6fd' },
  { id: 'conference_room', name: 'Conference Room', code: 'CONF', center: [-1.8, 0.05, 3.8], size: [3.2, 3.0], color: '#f5f3ff', borderColor: '#ddd6fe' },
  { id: 'meeting_room', name: 'Meeting Room', code: 'MR', center: [1.8, 0.05, 3.8], size: [3.2, 3.0], color: '#fffbeb', borderColor: '#fde68a' },
  { id: 'cafeteria', name: 'Cafeteria', code: 'CAFE', center: [5.5, 0.05, 3.8], size: [3.6, 3.0], color: '#fff7ed', borderColor: '#fed7aa' },
  { id: 'hr', name: 'HR', code: 'HR', center: [-5.5, 0.05, 0.2], size: [3.8, 2.8], color: '#fdf2f8', borderColor: '#fbcfe8' },
  { id: 'finance', name: 'Finance', code: 'FIN', center: [5.5, 0.05, 0.2], size: [3.6, 2.8], color: '#ecfdf5', borderColor: '#a7f3d0' },
  { id: 'dev_area', name: 'Development Area', code: 'DEV', center: [-2.8, 0.05, -2.4], size: [5.5, 4.0], color: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'design_area', name: 'Design Area', code: 'DES', center: [3.2, 0.05, -2.4], size: [5.0, 4.0], color: '#faf5ff', borderColor: '#e9d5ff' },
];

function getStatusColor(status) {
  if (status === 'PRESENT') return '#0071e3'; // Cybernetic Sapphire
  if (status === 'LATE') return '#f59e0b';    // Warm Amber
  return '#94a3b8';                          // Slate Gray
}

function EmployeeMarker3D({ node, isSelected, isMatched, onSelect }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);
  const color = getStatusColor(node.status);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const floatY =
        node.position[1] +
        (hovered || isSelected ? 0.2 : Math.sin(state.clock.elapsedTime * 2.5 + node.employee_id) * 0.04);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatY, delta * 8);

      if (isSelected || isMatched) {
        meshRef.current.rotation.y += delta * 2.0;
      }
    }
    if (ringRef.current && node.status === 'PRESENT') {
      const pulseScale = 1.0 + Math.sin(state.clock.elapsedTime * 3.0 + node.employee_id) * 0.15;
      ringRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });

  return (
    <group position={[node.position[0], 0, node.position[2]]}>
      {/* Floor Presence Halo Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      >
        <ringGeometry args={[0.22, 0.38, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected || isMatched ? 0.85 : hovered ? 0.6 : 0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Holographic Beacon / Avatar Sphere */}
      <group
        ref={meshRef}
        position={[0, node.position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Core Sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.23, 24, 24]} />
          <meshStandardMaterial
            color={color}
            roughness={0.15}
            metalness={0.3}
            emissive={color}
            emissiveIntensity={isSelected || isMatched ? 0.4 : hovered ? 0.25 : 0.08}
          />
        </mesh>

        {/* Crown Orbit Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
          <torusGeometry args={[0.13, 0.025, 16, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.2}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Floating Hover Card */}
        {(hovered || isSelected || isMatched) && (
          <Html position={[0, 0.52, 0]} center distanceFactor={14}>
            <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl px-3 py-1.5 shadow-apple-card text-center pointer-events-none select-none whitespace-nowrap animate-fade-in">
              <div className="flex items-center gap-1.5 justify-center">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-bold text-[#111827]">{node.name}</span>
              </div>
              <span className="block text-[9px] font-medium text-[#64748b]">
                {node.designation} • {node.status}
              </span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

function OfficeFloorModel({ zones, zoneOccupancy }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Main Floor Slab */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[16.4, 0.1, 12.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>

      {/* Modern Outer Border Frame */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[16.5, 0.05, 12.5]} />
        <meshBasicMaterial color="#e2e8f0" wireframe />
      </mesh>

      {/* Grid Guide Overlay */}
      <gridHelper args={[16, 16, '#cbd5e1', '#f1f5f9']} position={[0, 0.005, 0]} />

      {/* Zone Plinths, Outlines & Floating Badges */}
      {zones.map((zone) => {
        const count = zoneOccupancy[zone.name] || 0;
        return (
          <group key={zone.id} position={[zone.center[0], 0.01, zone.center[2]]}>
            {/* Zone Base Plate */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[zone.size[0], zone.size[1]]} />
              <meshStandardMaterial
                color={zone.color}
                roughness={0.8}
                transparent
                opacity={0.88}
              />
            </mesh>

            {/* Zone Border */}
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(zone.size[0], zone.size[1])]} />
              <lineBasicMaterial color={zone.borderColor || '#cbd5e1'} linewidth={1.5} />
            </lineSegments>

            {/* Zone Floating Nameplate with Real-time Count */}
            <Html position={[0, 0.03, -zone.size[1] / 2 + 0.35]} center distanceFactor={15}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#334155] bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/80 shadow-xs pointer-events-none select-none whitespace-nowrap">
                <span>{zone.name}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[9px] font-mono">
                  {count}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// 2D Enhanced Architectural Floor Plan View
function Clean2DFloorMap({ zones, nodes, onSelectNode, selectedNode, searchQuery, statusFilter }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-1">
      {zones.map((zone) => {
        const zoneEmployees = nodes.filter(n => {
          const matchZone = n.zone === zone.name;
          const matchSearch =
            !searchQuery ||
            n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
          const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
          return matchZone && matchSearch && matchStatus;
        });

        const totalInZone = nodes.filter(n => n.zone === zone.name).length;

        return (
          <div
            key={zone.id}
            className="p-4 rounded-2xl border border-gray-200/90 bg-white shadow-apple-sm hover:border-gray-300 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: zone.borderColor || '#94a3b8' }}
                  />
                  <span className="text-xs font-bold text-[#111827]">{zone.name}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {totalInZone} {totalInZone === 1 ? 'desk' : 'desks'}
                </span>
              </div>

              {/* Employee Avatar Pills in this Zone */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {zoneEmployees.length === 0 ? (
                  <span className="text-[11px] text-gray-400 italic py-2">No matching employees</span>
                ) : (
                  zoneEmployees.map((emp) => {
                    const statusCol = getStatusColor(emp.status);
                    const isSelected = selectedNode?.employee_id === emp.employee_id;
                    return (
                      <button
                        key={emp.employee_id}
                        onClick={() => onSelectNode(emp)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#0071e3] bg-blue-50 text-[#0071e3] font-semibold shadow-xs ring-2 ring-blue-100'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: statusCol }}
                        />
                        <span className="truncate max-w-[95px]">{emp.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100/80 flex items-center justify-between text-[10px] text-gray-400">
              <span>Code: {zone.code}</span>
              <span>{Math.round((zoneEmployees.length / Math.max(1, totalInZone)) * 100)}% present</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const WorkplaceFloor3D = ({
  nodes = [],
  zones = DEFAULT_ZONES,
  onSelectNode,
  selectedNode,
  className = ""
}) => {
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PRESENT', 'LATE', 'ABSENT'
  const controlsRef = useRef();

  // Zone live occupancy counts
  const zoneOccupancy = useMemo(() => {
    const counts = {};
    nodes.forEach(n => {
      const z = n.zone || 'Reception';
      counts[z] = (counts[z] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // Overall status summary
  const statusStats = useMemo(() => {
    const present = nodes.filter(n => n.status === 'PRESENT').length;
    const late = nodes.filter(n => n.status === 'LATE').length;
    const away = nodes.filter(n => n.status !== 'PRESENT' && n.status !== 'LATE').length;
    return { present, late, away, total: nodes.length };
  }, [nodes]);

  // Filtered nodes based on search & status
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchSearch =
        !searchQuery ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.department && n.department.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'AWAY'
          ? n.status !== 'PRESENT' && n.status !== 'LATE'
          : n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [nodes, searchQuery, statusFilter]);

  const setCameraPreset = (position) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...position);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className={`apple-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#111827]">Workplace Floor</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {statusStats.present + statusStats.late} On-Site
            </span>
          </div>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Real-time 3D spatial floor map & employee presence beacons.
          </p>
        </div>

        {/* View Toggle & Camera Presets */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewMode === '3D' && (
            <div className="flex items-center gap-1 bg-[#f5f5f7] p-0.5 rounded-lg border border-gray-200/80">
              <button
                onClick={() => setCameraPreset([0, 10, 11])}
                title="Isometric View"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Iso
              </button>
              <button
                onClick={() => setCameraPreset([0, 15, 0.1])}
                title="Top-Down Plan"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Top
              </button>
              <button
                onClick={() => setCameraPreset([0, 4, 12])}
                title="Entrance Elevation"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                Front
              </button>
              <button
                onClick={() => setCameraPreset([0, 10, 11])}
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
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Floor Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-gray-100 text-xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-gray-900 text-white font-semibold shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({statusStats.total})
          </button>
          <button
            onClick={() => setStatusFilter('PRESENT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'PRESENT'
                ? 'bg-blue-50 border border-blue-200 text-[#0071e3] font-semibold shadow-xs'
                : 'bg-gray-50 border border-gray-200/80 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
            Present ({statusStats.present})
          </button>
          <button
            onClick={() => setStatusFilter('LATE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'LATE'
                ? 'bg-amber-50 border border-amber-200 text-[#b45309] font-semibold shadow-xs'
                : 'bg-gray-50 border border-gray-200/80 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            Late ({statusStats.late})
          </button>
          <button
            onClick={() => setStatusFilter('AWAY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'AWAY'
                ? 'bg-slate-100 border border-slate-300 text-slate-700 font-semibold shadow-xs'
                : 'bg-gray-50 border border-gray-200/80 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
            Away ({statusStats.away})
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or code..."
            className="w-full pl-8 pr-7 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Floor Visualizer Area */}
      <div className="relative">
        {viewMode === '2D' ? (
          <Clean2DFloorMap
            zones={zones && zones.length > 0 ? zones : DEFAULT_ZONES}
            nodes={nodes}
            onSelectNode={onSelectNode}
            selectedNode={selectedNode}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        ) : (
          <div className="relative h-80 sm:h-96 w-full rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-[#f1f5f9] border border-gray-200/80 overflow-hidden shadow-inner">
            
            {/* Guide hint overlay */}
            <div className="absolute bottom-3 left-3 z-10 text-[11px] text-gray-500 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/60 pointer-events-none flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gray-400" />
              Click any beacon to view profile • Drag to rotate floor
            </div>

            <Canvas
              shadows
              camera={{ position: [0, 10, 11], fov: 44 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            >
              <ambientLight intensity={0.95} />
              <directionalLight
                position={[8, 15, 10]}
                intensity={1.25}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight position={[-8, 10, -6]} intensity={0.5} />

              <OfficeFloorModel
                zones={zones && zones.length > 0 ? zones : DEFAULT_ZONES}
                zoneOccupancy={zoneOccupancy}
              />

              {filteredNodes.map((node) => (
                <EmployeeMarker3D
                  key={node.employee_id}
                  node={node}
                  isSelected={selectedNode?.employee_id === node.employee_id}
                  isMatched={searchQuery.length > 1}
                  onSelect={onSelectNode}
                />
              ))}

              <OrbitControls
                ref={controlsRef}
                maxPolarAngle={Math.PI / 2.3}
                minPolarAngle={Math.PI / 6}
                maxDistance={22}
                minDistance={5}
                enablePan={true}
              />
            </Canvas>
          </div>
        )}

        {/* Enhanced Glassmorphic Slide-over / Modal Detail Panel */}
        {selectedNode && (
          <div className="absolute top-3 right-3 z-30 w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-apple-dropdown p-4 animate-fade-in text-left">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {selectedNode.avatar ? (
                  <img
                    src={selectedNode.avatar}
                    alt={selectedNode.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0071e3] font-bold text-sm flex items-center justify-center border border-blue-100 shadow-sm">
                    {selectedNode.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#111827] leading-tight">
                    {selectedNode.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-medium text-[#64748b]">
                      {selectedNode.employee_code}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        selectedNode.status === 'PRESENT'
                          ? 'bg-blue-50 text-[#0071e3] border border-blue-200'
                          : selectedNode.status === 'LATE'
                          ? 'bg-amber-50 text-[#b45309] border border-amber-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {selectedNode.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectNode(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Department & Designation */}
            <div className="py-2.5 border-b border-gray-100 space-y-1">
              <p className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                {selectedNode.designation}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#6b7280]">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  {selectedNode.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {selectedNode.location || 'Bengaluru'}
                </span>
              </div>
            </div>

            {/* Attendance Detail Grid */}
            <div className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> Check-in
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedNode.check_in_time || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> Check-out
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedNode.check_out_time || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Attendance Rate</span>
                <span className="font-bold text-[#0071e3]">
                  {selectedNode.attendance_percentage || '96'}%
                </span>
              </div>

              {selectedNode.zone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assigned Zone</span>
                  <span className="font-semibold text-gray-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                    {selectedNode.zone}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Action Link */}
            <Link
              to={`/employees/${selectedNode.employee_id}`}
              className="mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0062c4] text-xs font-semibold text-white shadow-sm transition-all"
            >
              <span>View Full Employee Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
