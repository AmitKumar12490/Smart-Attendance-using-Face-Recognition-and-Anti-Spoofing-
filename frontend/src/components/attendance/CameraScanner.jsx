import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, ShieldAlert, UserCheck, AlertCircle, Play, Pause, Scan, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

// Web Audio synthesizer for corporate biometric feedback chimes
const playFeedbackChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.18);
      
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1760.0, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn("Audio chime unavailable:", err);
  }
};

export const CameraScanner = ({ onAttendanceSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mode, setMode] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [mockSpoof, setMockSpoof] = useState('NONE'); // 'NONE' | 'PRINTED_PHOTO' | 'SCREEN_REPLAY'
  
  const [stage, setStage] = useState('IDLE');
  const [statusMessage, setStatusMessage] = useState('Position face inside frame and click Verify');
  const [resultData, setResultData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setStage('SCANNING');
        setStatusMessage('Camera active. Align face inside guideline.');
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Webcam access not granted or unavailable. You can use biometric simulation.");
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setStage('IDLE');
    setStatusMessage('Camera paused. Click Start Camera to resume.');
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const handleVerifyBiometrics = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResultData(null);
    setStage('DETECTING');
    setStatusMessage('Analyzing biometric signature & liveness...');

    await new Promise(r => setTimeout(r, 450));

    // If camera is not active, synthesize a valid frame
    let imageBase64 = streamActive ? captureFrame() : null;
    if (!imageBase64) {
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 300;
      dummyCanvas.height = 300;
      const ctx = dummyCanvas.getContext('2d');
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 300, 300);
      imageBase64 = dummyCanvas.toDataURL('image/jpeg', 0.8);
    }

    try {
      const payload = {
        image_base64: imageBase64,
        mode: mode,
        mock_spoof_mode: mockSpoof === 'NONE' ? 'GENUINE' : mockSpoof,
        device_name: 'SmartAttend Main Gate Kiosk',
        location: 'Bengaluru Tech Campus'
      };

      const res = await api.post('/attendance/mark', payload);

      if (res.data.success) {
        setStage('SUCCESS');
        setStatusMessage(res.data.message || 'Identity verified! Attendance logged.');
        setResultData(res.data);
        playFeedbackChime('success');

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#0071e3', '#10b981', '#60a5fa']
        });

        if (onAttendanceSuccess) {
          onAttendanceSuccess(res.data);
        }
      }
    } catch (err) {
      const errData = err.response?.data;
      setStage('REJECTED');
      playFeedbackChime('error');

      if (errData?.status === 'SPOOF_DETECTED') {
        setStatusMessage(errData.error || 'Security Alert: Presentation attack detected!');
        setResultData({
          isSpoof: true,
          error: errData.error,
          attack_vector: errData.attack_vector || 'Screen Replay / Print',
          liveness_score: errData.liveness_score || 0.18
        });
      } else {
        setStatusMessage(errData?.error || 'Verification failed. Face signature not recognized.');
        setResultData({
          error: errData?.error || 'Verification rejected.',
          confidence: errData?.confidence
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="apple-card p-6 sm:p-8 flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header & Mode Toggle */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">Live Biometric Scanner</h3>
          <p className="text-xs text-[#6b7280]">Look directly at the sensor for instant check-in</p>
        </div>

        {/* Check-In vs Check-Out Selector */}
        <div className="flex items-center bg-[#f5f5f7] p-0.5 rounded-lg border border-gray-200/80 self-start sm:self-auto">
          <button
            onClick={() => setMode('CHECK_IN')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'CHECK_IN'
                ? 'bg-white text-[#111827] shadow-apple-sm font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Check-In
          </button>
          <button
            onClick={() => setMode('CHECK_OUT')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'CHECK_OUT'
                ? 'bg-white text-[#111827] shadow-apple-sm font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Check-Out
          </button>
        </div>
      </div>

      {/* Main Camera Viewport */}
      <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-apple-card flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-900/90 text-white">
            <Camera className="w-10 h-10 text-gray-500 mb-2" />
            <p className="text-xs font-medium text-gray-300">Camera Stream Inactive</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">{cameraError || "Click below to activate webcam"}</p>
            <button
              onClick={startCamera}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#0071e3] text-white text-xs font-medium hover:bg-[#0062c4] transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          </div>
        )}

        {/* Minimalist White Target Reticle */}
        {streamActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-48 h-56 rounded-2xl border-2 transition-all duration-200 ${
              stage === 'SUCCESS'
                ? 'border-emerald-400 shadow-lg'
                : stage === 'REJECTED'
                ? 'border-red-500 shadow-lg'
                : isProcessing
                ? 'border-[#0071e3]'
                : 'border-white/50'
            }`}>
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
            </div>

            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TERMINAL #1 • 1080P</span>
            </div>
          </div>
        )}
      </div>

      {/* Guidance Ribbon */}
      <div className={`mt-5 w-full max-w-md p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
        stage === 'SUCCESS'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : stage === 'REJECTED'
          ? 'bg-red-50 border-red-200 text-red-800'
          : isProcessing
          ? 'bg-blue-50 border-blue-200 text-[#0071e3]'
          : 'bg-[#f5f5f7] border-gray-200/80 text-[#374151]'
      }`}>
        <div className="flex items-center gap-2">
          {stage === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : stage === 'REJECTED' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : isProcessing ? (
            <RefreshCw className="w-4 h-4 text-[#0071e3] animate-spin shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-[#0071e3] shrink-0" />
          )}
          <span className="font-medium text-xs">{statusMessage}</span>
        </div>

        {stage === 'SUCCESS' && resultData?.attendance && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {resultData.attendance.status}
          </span>
        )}
      </div>

      {/* Verified Employee Result */}
      {resultData?.employee && stage === 'SUCCESS' && (
        <div className="mt-3 w-full max-w-md p-3.5 rounded-xl bg-white border border-gray-200 shadow-apple-sm flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0071e3] font-bold text-xs flex items-center justify-center border border-blue-100">
            {resultData.employee.first_name ? resultData.employee.first_name.charAt(0) : 'E'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#111827] truncate">{resultData.employee.full_name}</h4>
            <p className="text-[11px] text-[#6b7280]">{resultData.employee.designation}</p>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-[#86868b] font-mono">
              <span>{resultData.employee.employee_code}</span>
              <span>Match: {Math.round((resultData.confidence || 0.95) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Unrecognized Face Alert */}
      {stage === 'REJECTED' && !resultData?.isSpoof && (
        <div className="mt-3 w-full max-w-md p-3.5 rounded-xl bg-red-50/90 border border-red-200 flex items-center gap-3 animate-fade-in text-red-800">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center border border-red-200 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-red-900">Identity Not Recognized</h4>
            <p className="text-[11px] text-red-700 mt-0.5">
              {resultData?.error || 'Face signature does not match any registered employee.'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex items-center justify-center gap-2.5 w-full max-w-md">
        <button
          onClick={handleVerifyBiometrics}
          disabled={isProcessing}
          className="apple-btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-2 shadow-sm"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Face...</span>
            </>
          ) : (
            <>
              <Scan className="w-3.5 h-3.5" />
              <span>Verify & Mark Attendance</span>
            </>
          )}
        </button>

        {streamActive ? (
          <button
            onClick={stopCamera}
            className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Pause camera"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={startCamera}
            className="p-2.5 rounded-lg border border-gray-200 text-[#0071e3] hover:bg-blue-50"
            title="Start camera"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Anti-Spoofing Simulation Suite */}
      <div className="mt-6 pt-4 border-t border-gray-100 w-full max-w-md">
        <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-2">
          <span className="font-medium">Anti-Spoofing Test Suite:</span>
          <span>Simulation</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMockSpoof('NONE')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
              mockSpoof === 'NONE'
                ? 'bg-blue-50 border-[#0071e3] text-[#0071e3] font-semibold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Live Person
          </button>

          <button
            onClick={() => setMockSpoof('PRINTED_PHOTO')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
              mockSpoof === 'PRINTED_PHOTO'
                ? 'bg-red-50 border-red-500 text-red-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Photo Spoof
          </button>

          <button
            onClick={() => setMockSpoof('SCREEN_REPLAY')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
              mockSpoof === 'SCREEN_REPLAY'
                ? 'bg-amber-50 border-amber-500 text-amber-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Screen Replay
          </button>
        </div>
      </div>
    </div>
  );
};
