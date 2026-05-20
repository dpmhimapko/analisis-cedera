import React, { useState, useRef, useEffect } from 'react';
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { CameraIcon, ScannerIcon, TargetIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, AlertCircle, Activity, Play, Upload } from 'lucide-react';

interface VideoProcessorProps {
  onComplete: (metrics: any, timeSeries: any[]) => void;
  athleteId: string;
  athleteName: string;
  condition: string;
  trial: number;
  label: string;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ onComplete, athleteId, athleteName, condition, trial, label }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const processVideo = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
    });

    try {
      await (pose as any).initialize();
    } catch (e) {
      console.warn("pose.initialize() failed or not provided by this version, continuing...");
    }

    pose.setOptions({
      modelComplexity: 2,
      smoothLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const timeSeries: any[] = [];
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;
    
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.currentTime = 0;
        resolve(null);
      };
    });

    const duration = video.duration;
    const fps = 30;
    const totalFrames = Math.floor(duration * fps);
    let processedFrames = 0;
    let currentTargetTime = 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const resultPromiseMap = new Map<number, (res: Results) => void>();

    pose.onResults((results: Results) => {
      const targetTime = currentTargetTime;
      
      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        
        // Right side (Dominant assumption)
        const rShoulder = landmarks[12];
        const rHip = landmarks[24];
        const rKnee = landmarks[26];
        const rAnkle = landmarks[28];
        const rToe = landmarks[32]; // Foot index
        
        // Left side
        const lShoulder = landmarks[11];
        const lHip = landmarks[23];
        const lKnee = landmarks[25];
        const lAnkle = landmarks[27];

        if (rHip.visibility! > 0.4 && rKnee.visibility! > 0.4 && rAnkle.visibility! > 0.4) {
          const kneeAngle = calculateAngle(rHip, rKnee, rAnkle);
          const hipAngle = calculateAngle(rShoulder, rHip, rKnee);
          
          // Trunk angle (Stability)
          const trunkAngle = calculateAngle({x: rShoulder.x, y: rShoulder.y - 0.1}, rShoulder, rHip);
          
          // Abduction calculation (simplified: angle between vertical and thigh)
          const hipAbdDom = calculateAngle({x: rHip.x, y: rHip.y - 0.1}, rHip, rKnee);
          const hipAbdNon = calculateAngle({x: lHip.x, y: lHip.y - 0.1}, lHip, lKnee);

          // Capture frame with drawing
          canvas.width = 480; 
          canvas.height = (video.videoHeight / video.videoWidth) * 480;
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Draw skeleton overlay
            ctx.strokeStyle = '#00f7ff';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            
            const drawLine = (p1: any, p2: any) => {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            };

            const drawPoint = (p: any, color = '#00f7ff') => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, Math.PI * 2);
              ctx.fill();
            };

            // Draw right leg (assuming dominant for simple display)
            drawLine(rShoulder, rHip);
            drawLine(rHip, rKnee);
            drawLine(rKnee, rAnkle);
            drawPoint(rShoulder);
            drawPoint(rHip);
            drawPoint(rKnee);
            drawPoint(rAnkle);

            // Draw angle labels
            ctx.font = 'bold 20px font-mono';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;

            // Knee Label
            const kneeText = `K:${Math.round(kneeAngle)}°`;
            ctx.strokeText(kneeText, rKnee.x * canvas.width + 10, rKnee.y * canvas.height);
            ctx.fillText(kneeText, rKnee.x * canvas.width + 10, rKnee.y * canvas.height);

            // Hip Label
            const hipText = `H:${Math.round(hipAngle)}°`;
            ctx.strokeText(hipText, rHip.x * canvas.width + 10, rHip.y * canvas.height);
            ctx.fillText(hipText, rHip.x * canvas.width + 10, rHip.y * canvas.height);
          }

          const frameBase64 = canvas.toDataURL('image/jpeg', 0.6);

          timeSeries.push({
            time: targetTime,
            kneeAngle: parseFloat(kneeAngle.toFixed(2)),
            hipAngle: parseFloat(hipAngle.toFixed(2)),
            trunkAngle: parseFloat(trunkAngle.toFixed(2)),
            hipAbdDom: parseFloat(hipAbdDom.toFixed(2)),
            hipAbdNon: parseFloat(hipAbdNon.toFixed(2)),
            toePos: { x: rToe.x, y: rToe.y },
            kneePos: { x: rKnee.x, y: rKnee.y },
            hipPos: { x: rHip.x, y: rHip.y },
            frame: frameBase64,
          });
        }
      }
      processedFrames++;
      setProgress(Math.round((processedFrames / totalFrames) * 100));
      
      const resolve = resultPromiseMap.get(targetTime);
      if (resolve) {
        resultPromiseMap.delete(targetTime);
        resolve(results);
      }
    });

    try {
      for (let i = 0; i < totalFrames; i++) {
        const targetTime = i / fps;
        currentTargetTime = targetTime;
        video.currentTime = targetTime;
        
        await new Promise((resolve) => {
          video.onseeked = async () => {
            const frameProcessed = new Promise<Results>((res) => {
              resultPromiseMap.set(targetTime, res);
            });
            
            try {
              await pose.send({ image: video });
              await frameProcessed;
            } catch (err) {
              console.error("Frame processing error:", err);
            }
            resolve(null);
          };
        });
      }
    } finally {
      // Close the pose estimator to release WASM memory
      try {
        await pose.close();
      } catch (e) {
        console.warn("Error closing pose:", e);
      }
    }

    // Sort by time to ensure determinism regardless of processing order
    timeSeries.sort((a, b) => a.time - b.time);

    if (timeSeries.length < 10) {
      setError("Pose-nya susah kebaca 😅 coba side view & cahaya terang");
      setIsProcessing(false);
      return;
    }

    // 1. Calculate Joint Velocities (Pixel/S)
    const timeSeriesWithVelocities = timeSeries.map((t, i) => {
      if (i === 0) return { ...t, toeSpeed: 0, kneeSpeed: 0, hipSpeed: 0 };
      const prev = timeSeries[i-1];
      const dt = t.time - prev.time;
      
      const getDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      
      const toeDist = getDist(t.toePos, prev.toePos);
      const kneeDist = getDist(t.kneePos, prev.kneePos);
      const hipDist = getDist(t.hipPos, prev.hipPos);
      
      return { 
        ...t, 
        toeSpeed: dt > 0 ? toeDist / dt : 0,
        kneeSpeed: dt > 0 ? kneeDist / dt : 0,
        hipSpeed: dt > 0 ? hipDist / dt : 0
      };
    });

    // 2. Identify Impact (Max Extension during high speed)
    let impactIdx = 0;
    let maxExt = 0;
    timeSeriesWithVelocities.forEach((t, i) => {
      // Impact is usually the maximum knee extension (straightest leg) near the end of the movement
      if (t.kneeAngle > maxExt && t.toeSpeed > 0.5) {
        maxExt = t.kneeAngle;
        impactIdx = i;
      }
    });

    // 3. Identify Motion Start (When the leg first starts moving significantly)
    // We search backwards from impact to find the beginning of the motion
    let startIdx = 0;
    for (let i = impactIdx; i >= 0; i--) {
      // The start of motion is when the foot speed was consistently low before the kick
      // We look for the first sustained quiet period backwards
      if (timeSeriesWithVelocities[i].toeSpeed < 0.1) {
        startIdx = i;
        break;
      }
    }

    // 4. Identify Kuda-kuda (Initial preparation phase)
    // Should be at the very early stages of the video when athlete is stationary
    let kudaIdx = 0;
    let minInitialSpeed = Infinity;
    // Look for the "stablest" frame in the first 20% of the video or before startIdx
    const searchLimit = Math.min(startIdx, Math.floor(timeSeriesWithVelocities.length * 0.2));
    for (let i = 0; i <= searchLimit; i++) {
       if (timeSeriesWithVelocities[i].toeSpeed < minInitialSpeed) {
         minInitialSpeed = timeSeriesWithVelocities[i].toeSpeed;
         kudaIdx = i;
       }
    }

    // 5. Identify Ancang-ancang (Chambering Phase)
    // This is the point of MAXIMUM flexion (MINIMUM angle) during the kick movement
    // It must happen between the start of motion and the impact
    let minKneeAngle = 180;
    let ancangIdx = startIdx;
    for (let i = startIdx; i <= impactIdx; i++) {
      if (timeSeriesWithVelocities[i].kneeAngle < minKneeAngle) {
        minKneeAngle = timeSeriesWithVelocities[i].kneeAngle;
        ancangIdx = i;
      }
    }

    // 6. Identify Recovery (When speed drops after impact)
    let recoveryIdx = timeSeriesWithVelocities.length - 1;
    for (let i = impactIdx; i < timeSeriesWithVelocities.length; i++) {
      if (timeSeriesWithVelocities[i].toeSpeed < 0.2 && i > impactIdx + 5) {
        recoveryIdx = i;
        break;
      }
    }

    // 7. Kinematic Calculations
    const executionTime = timeSeriesWithVelocities[impactIdx].time - timeSeriesWithVelocities[startIdx].time;
    
    // Scale factor for m/s
    const scaleFactor = 1.7 / 0.6; 

    // Swing Phase Metrics
    const swingFrames = timeSeriesWithVelocities.slice(startIdx, impactIdx + 1);
    
    const avgKneeVel = (swingFrames.reduce((a, b) => a + b.kneeSpeed, 0) / swingFrames.length) * scaleFactor;
    const avgHipVel = (swingFrames.reduce((a, b) => a + b.hipSpeed, 0) / swingFrames.length) * scaleFactor;
    const impactKneeVel = timeSeriesWithVelocities[impactIdx].kneeSpeed * scaleFactor;

    // Trunk Stability
    const trunkAngles = swingFrames.map(f => f.trunkAngle);
    const avgTrunk = trunkAngles.reduce((a, b) => a + b, 0) / trunkAngles.length;
    const trunkVariability = Math.sqrt(trunkAngles.map(x => Math.pow(x - avgTrunk, 2)).reduce((a, b) => a + b, 0) / trunkAngles.length);

    // Kuda-kuda (Representative stable state)
    const kudaKudaFrames = timeSeriesWithVelocities.slice(0, Math.max(1, startIdx - 5));
    const kneeKuda = kudaKudaFrames.length > 0 
      ? kudaKudaFrames.reduce((a, b) => a + b.kneeAngle, 0) / kudaKudaFrames.length 
      : timeSeriesWithVelocities[kudaIdx].kneeAngle;
    const hipKuda = kudaKudaFrames.length > 0 
      ? kudaKudaFrames.reduce((a, b) => a + b.hipAngle, 0) / kudaKudaFrames.length 
      : timeSeriesWithVelocities[kudaIdx].hipAngle;

    const metrics = {
      knee_kuda: kneeKuda,
      hip_kuda: hipKuda,
      knee_impact: timeSeriesWithVelocities[impactIdx].kneeAngle,
      hip_impact: timeSeriesWithVelocities[impactIdx].hipAngle,
      knee_ancang: timeSeriesWithVelocities[ancangIdx].kneeAngle,
      avg_vel_knee: avgKneeVel,
      avg_vel_hip: avgHipVel,
      impact_vel_knee: impactKneeVel,
      max_speed_ms: timeSeriesWithVelocities[impactIdx].toeSpeed * scaleFactor,
      execution_time: executionTime,
      trunk_variability: trunkVariability,
      hip_abd_dom: timeSeriesWithVelocities[impactIdx].hipAbdDom,
      hip_abd_non: timeSeriesWithVelocities[impactIdx].hipAbdNon,
      keyFrames: {
        kuda: timeSeriesWithVelocities[kudaIdx]?.frame || timeSeriesWithVelocities[0].frame,
        ancang: timeSeriesWithVelocities[ancangIdx].frame,
        impact: timeSeriesWithVelocities[impactIdx].frame
      },
      phases: {
        start: timeSeriesWithVelocities[startIdx].time,
        impact: timeSeriesWithVelocities[impactIdx].time,
        recovery: timeSeriesWithVelocities[recoveryIdx].time
      }
    };

    // Save to server
    try {
      const finalAthleteId = athleteId || `ATLET-${Math.random().toString(36).substr(2, 9)}`;
      const finalAthleteName = athleteName || "Atlet Anonim";

      // First ensure athlete exists
      await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: finalAthleteId, name: finalAthleteName }),
      });

      // Save session
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: finalAthleteId,
          condition,
          trial,
          date: new Date().toISOString(),
          metrics,
          timeSeries,
        }),
      });

      setIsDone(true);
      onComplete(metrics, timeSeries);
    } catch (err) {
      setError("Gagal menyimpan data ke server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${condition === 'pra' ? 'bg-blue-500' : 'bg-upi-red'} animate-pulse shadow-[0_0_10px_rgba(153,0,0,0.2)]`}></div>
          <h4 className="text-xl font-display text-slate-900 uppercase tracking-tight">Kondisi {condition.toUpperCase()}</h4>
        </div>
        {isDone && <CheckCircle2 className="w-5 h-5 text-grass" />}
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setVideoFile(e.dataTransfer.files[0]);
            setIsDone(false);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden group
          ${isDragging ? 'border-upi-red bg-upi-red/5 scale-[0.98]' : 'border-slate-200 bg-slate-50 hover:border-upi-red/30 hover:bg-slate-100'}
          ${isProcessing ? 'border-upi-red/50 bg-upi-red/5' : ''}
          ${isDone ? 'border-grass/50 bg-grass/5' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          className="hidden" 
          accept="video/*"
        />

        {/* HUD Corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-slate-300/50 group-hover:border-upi-red/40 transition-colors z-30"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-slate-300/50 group-hover:border-upi-red/40 transition-colors z-30"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-slate-300/50 group-hover:border-upi-red/40 transition-colors z-30"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-slate-300/50 group-hover:border-upi-red/40 transition-colors z-30"></div>

        {/* HUD Decorative Elements */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 w-1 h-12 bg-slate-200/30 rounded-full z-30"></div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-1 h-12 bg-slate-200/30 rounded-full z-30"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center relative z-20">
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.div 
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-24 h-24 bg-grass/20 rounded-full flex items-center justify-center mx-auto border border-grass/30 relative">
                  <div className="absolute inset-0 border border-grass/20 rounded-full animate-ping"></div>
                  <CheckCircle2 className="w-12 h-12 text-grass" />
                </div>
                <div>
                  <p className="text-sm font-black text-grass uppercase tracking-widest neon-text-grass">Analisis Selesai</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.2em] mt-2">Data Kinematika Tersimpan</p>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-xs space-y-8"
              >
                <div className="relative w-32 h-32 mx-auto">
                  <ScannerIcon className="absolute inset-0 w-full h-full text-upi-red/20" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-upi-red/30 border-t-transparent rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-upi-gold/20 border-b-transparent rounded-full border-dashed"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-black text-upi-red">{Math.round(progress)}%</span>
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">Processing</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                    <span>Neural Link</span>
                    <span className="text-upi-red">Active</span>
                  </div>
                  <div className="h-1 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-300/20">
                    <motion.div 
                      className="h-full bg-upi-red"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                    <span>Frame {Math.floor(progress * 1.2)}</span>
                    <span>30 FPS</span>
                  </div>
                </div>
              </motion.div>
            ) : videoFile ? (
              <motion.div 
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="w-24 h-24 bg-upi-red/10 rounded-3xl flex items-center justify-center mx-auto border border-upi-red/20 relative group-hover:scale-105 transition-transform">
                  <div className="absolute inset-0 border border-upi-red/10 rounded-3xl animate-pulse"></div>
                  <Play className="w-12 h-12 text-upi-red" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest truncate max-w-[240px]">{videoFile.name}</p>
                  <p className="text-[10px] font-medium text-upi-red uppercase tracking-[0.2em] mt-2">Siap Untuk Analisis</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-upi-red/10 transition-all duration-500 border border-slate-200 shadow-sm relative z-10">
                    <Upload className="w-12 h-12 text-slate-300 group-hover:text-upi-red transition-colors" />
                  </div>
                  <TargetIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-slate-100 group-hover:text-upi-red/5 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Input Video {label.toUpperCase()}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-2">Drag & Drop File Disini</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scan line effect during processing */}
        {isProcessing && (
          <div className="scanning-bar"></div>
        )}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-coral text-[10px] font-black uppercase tracking-widest bg-coral/10 p-3 rounded-lg border border-coral/20"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {!isDone && !isProcessing && videoFile && (
        <button 
          onClick={processVideo}
          className="gold-button w-full py-4 text-lg rounded-xl flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5" /> MULAI ANALISIS
        </button>
      )}
    </div>
  );
};
