import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Activity, ChevronRight, BarChart3, Info, BookOpen, Target, Lightbulb, Download, Eye, X } from 'lucide-react';

interface ResultsDisplayProps {
  praResults: { metrics: any, timeSeries: any[] } | null;
  pascaResults: { metrics: any, timeSeries: any[] } | null;
  athleteName: string;
}

const MethodologySection = () => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass-card p-8 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-upi-red/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
    <h3 className="text-3xl font-display font-black tracking-tight mb-8 flex items-center gap-4 text-slate-900 uppercase title-glitch">
      <BookOpen className="w-8 h-8 text-upi-red" />
      Metodologi Analisis
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
      {[
        { num: "01", title: "Pose Estimation", desc: "MediaPipe Pose mendeteksi 33 titik koordinat tubuh secara real-time." },
        { num: "02", title: "Trigonometri", desc: "Kalkulasi sudut sendi menggunakan rumus Law of Cosines presisi tinggi." },
        { num: "03", title: "Kinematika", desc: "Analisis kecepatan angular dan akselerasi antar frame video." }
      ].map((step, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="space-y-4"
        >
          <div className="w-12 h-12 bg-upi-red rounded-xl flex items-center justify-center font-display text-2xl text-white shadow-lg shadow-upi-red/20">
            {step.num}
          </div>
          <h4 className="font-display text-xl text-slate-900 uppercase tracking-tight">{step.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const calculateSkeletonPoints = (kneeAngle: number, hipAngle: number = 160) => {
  // Base points
  const hip = { x: 180, y: 100 };
  const thighLen = 60;
  const shinLen = 65;
  
  // Thigh angle (relative to vertical/torso)
  // We'll use hipAngle to tilt the thigh
  const thighRad = (hipAngle - 90) * (Math.PI / 180);
  const knee = {
    x: hip.x + thighLen * Math.cos(thighRad),
    y: hip.y + thighLen * Math.sin(thighRad)
  };
  
  // Shin angle (relative to thigh)
  // kneeAngle is the internal angle between thigh and shin
  const shinRad = thighRad + (180 - kneeAngle) * (Math.PI / 180);
  const ankle = {
    x: knee.x + shinLen * Math.cos(shinRad),
    y: knee.y + shinLen * Math.sin(shinRad)
  };
  
  return { hip, knee, ankle };
};

const FrameView = ({ frame, label, title }: { frame: any, label: string, title: string }) => {
  if (!frame) return null;
  const { hip, knee, ankle } = calculateSkeletonPoints(frame.kneeAngle, frame.hipAngle);
  
  return (
    <div className="glass-card p-6 overflow-hidden relative group">
      <div className="absolute top-4 left-4 z-20">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-xl backdrop-blur-md border ${label === 'pra' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-upi-gold/20 text-upi-gold border-upi-gold/30'}`}>
          {title} • {label.toUpperCase()}
        </span>
      </div>
      <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
        {/* Actual Frame Image */}
        {frame.frame && (
          <img 
            src={frame.frame} 
            alt="Analysis Frame" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        )}
        
        {/* HUD Elements */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Animated Reticle */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-upi-red/30 rounded-full"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-upi-red"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-4 bg-upi-red"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-4 bg-upi-red"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-4 bg-upi-red"></div>
          </motion.div>

          {/* Corner HUD */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-upi-red"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-upi-red"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-upi-red"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-upi-red"></div>
        </div>

        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
        
        <svg viewBox="0 0 400 225" className="w-full h-full relative z-10">
          <g stroke={label === 'pra' ? '#3b82f6' : '#FFD700'} strokeWidth="4" strokeLinecap="round" opacity="0.8">
            <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} />
            <line x1={knee.x} y1={knee.y} x2={ankle.x} y2={ankle.y} />
          </g>
          
          <g fill="white" stroke="black" strokeWidth="1.5">
            <circle cx={hip.x} cy={hip.y} r="6" fill={label === 'pra' ? '#3b82f6' : '#FFD700'} className="animate-pulse" />
            <circle cx={knee.x} cy={knee.y} r="6" fill={label === 'pra' ? '#3b82f6' : '#FFD700'} />
            <circle cx={ankle.x} cy={ankle.y} r="6" fill={label === 'pra' ? '#3b82f6' : '#FFD700'} />
          </g>

          <g transform={`translate(${knee.x}, ${knee.y - 20})`}>
            <rect x="-25" y="-15" width="50" height="20" rx="4" fill="rgba(0,0,0,0.8)" />
            <text textAnchor="middle" fill="white" className="text-[10px] font-black">{frame.kneeAngle.toFixed(1)}°</text>
          </g>
        </svg>

        {/* Scan line effect */}
        <motion.div 
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-px bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)] z-20"
        />
      </div>
      <div className="mt-4 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-upi-red rounded-full"></div>
          <p className="text-xs font-display text-slate-900">{frame.kneeAngle.toFixed(1)}°</p>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">T+{(frame.time).toFixed(2)}s</p>
      </div>
    </div>
  );
};

const FrameSequence = ({ results, label }: { results: any, label: string }) => {
  if (!results || !results.timeSeries) return null;

  const handleDownload = (frameData: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = frameData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card p-8 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-3xl font-display font-black tracking-tight flex items-center gap-4 text-slate-900 uppercase title-glitch">
          <div className={`w-4 h-4 rounded-full ${label === 'pra' ? 'bg-blue-600' : 'bg-upi-red'} animate-pulse shadow-[0_0_15px_rgba(153,0,0,0.2)]`}></div>
          Sekuens Frame: {label.toUpperCase()}
        </h4>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          {results.timeSeries.length} Frames Analyzed
        </div>
      </div>
      
      <div className="relative">
        <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide relative z-10">
          {results.timeSeries.map((frame: any, i: number) => {
            const { hip, knee, ankle } = calculateSkeletonPoints(frame.kneeAngle, frame.hipAngle);
            return (
              <div key={i} className="flex-shrink-0 w-48 space-y-4 group">
                <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-200 relative overflow-hidden shadow-2xl group-hover:border-upi-red/50 transition-all duration-500">
                  {/* Actual Frame Image */}
                  {frame.frame && (
                    <img 
                      src={frame.frame} 
                      alt={`Frame ${i}`} 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity z-40 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleDownload(frame.frame, `frame-${label}-${i}.jpg`)}
                      className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                      title="Download Frame"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* HUD Elements */}
                  <div className="absolute inset-0 pointer-events-none z-30">
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-4 border border-upi-red/20 rounded-lg"
                    />
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-upi-red"></div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-upi-red"></div>
                  </div>

                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white"></div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white"></div>
                  </div>

                  <svg viewBox="0 0 400 225" className="w-full h-full relative z-10">
                    <g opacity="0.6">
                      <circle cx={knee.x} cy={knee.y} r="6" fill={label === 'pra' ? '#3b82f6' : '#FFD700'} className="animate-pulse" />
                      <circle cx={knee.x} cy={knee.y} r="12" fill="none" stroke={label === 'pra' ? '#3b82f6' : '#FFD700'} strokeWidth="1" opacity="0.3" />
                    </g>
                    
                    <line x1={knee.x} y1={knee.y} x2={knee.x} y2={knee.y - 20} stroke="white" strokeWidth="1" opacity="0.2" />
                    <line x1={knee.x} y1={knee.y} x2={knee.x + 20} y2={knee.y} stroke="white" strokeWidth="1" opacity="0.2" />
                  </svg>
                  
                  <div className="absolute top-3 right-3 bg-upi-red/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-xl">
                    {frame.kneeAngle.toFixed(0)}°
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">T+{(i/30).toFixed(2)}s</p>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    className="h-0.5 w-8 bg-upi-red mx-auto mt-2 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const KeyPhaseGallery = ({ metrics, condition }: { metrics: any, condition: string }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  if (!metrics?.keyFrames) return null;

  const handleDownload = (frameData: string, phase: string) => {
    const link = document.createElement('a');
    link.href = frameData;
    link.download = `sabit-analysis-${condition}-${phase}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const phases = [
    { id: 'kuda', label: 'Kuda-kuda', frame: metrics.keyFrames.kuda, value: metrics.knee_kuda, unit: '°' },
    { id: 'ancang', label: 'Ancang-ancang', frame: metrics.keyFrames.ancang, value: metrics.knee_ancang, unit: '°' },
    { id: 'impact', label: 'Impact', frame: metrics.keyFrames.impact, value: metrics.knee_impact, unit: '°' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-upi-red rounded-xl flex items-center justify-center text-white shadow-lg">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-3xl font-display font-black tracking-tight text-upi-red uppercase title-glitch">Detail Fase Gerakan ({condition.toUpperCase()})</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map((phase) => (
          <div key={phase.id} className="premium-card overflow-hidden group">
            <div className="relative aspect-video bg-slate-900 cursor-pointer">
              <img 
                src={phase.frame} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt={phase.label}
                onClick={() => setSelectedImage(phase.frame)}
              />
              <div 
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-40"
                onClick={() => setSelectedImage(phase.frame)}
              >
                <div className="flex flex-col items-center gap-1">
                  <Eye className="w-8 h-8 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Click to Zoom</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(phase.frame, phase.id);
                  }}
                  className="p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-all hover:scale-110 shadow-xl border border-white/20"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              
              <div className="absolute top-4 left-4 z-30">
                <span className="px-3 py-1 bg-upi-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                  {phase.label}
                </span>
              </div>

                <div className="absolute bottom-4 right-4 flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {phase.id === 'kuda' ? 'Knee / Hip' : 'Sudut Knee'}
                  </span>
                  <span className="text-3xl font-display text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {phase.id === 'kuda' 
                      ? `${phase.value.toFixed(1)}° / ${metrics.hip_kuda.toFixed(1)}°`
                      : `${phase.value.toFixed(1)}${phase.unit}`
                    }
                  </span>
                </div>
              </div>

              {/* HUD scanline effect */}
              <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white animate-scanline"></div>
              </div>
            </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl transition-all"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-5xl w-full aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(153,0,0,0.3)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedImage} className="w-full h-full object-contain bg-black" alt="Preview" />
            
            <div className="absolute top-6 right-6 flex items-center gap-4">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage;
                  link.download = 'sabit-analysis-zoom.jpg';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/20 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span className="font-display font-bold uppercase tracking-widest text-xs pr-2">Save Frame</span>
              </button>
              
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-4 bg-upi-red hover:bg-red-700 text-white rounded-2xl transition-all shadow-xl flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal HUD Decorative */}
            <div className="absolute bottom-6 left-6 text-white/40 pointer-events-none">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Frame_Inspect_Mode: Active</p>
              <div className="flex gap-2 mt-2">
                <div className="w-2 h-2 bg-upi-red rounded-full animate-pulse"></div>
                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-upi-red" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ praResults, pascaResults, athleteName }) => {
  const [activeFrame, setActiveFrame] = useState(0);

  // Floating particles effect
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  const getPhaseFrames = (results: any) => {
    if (!results || !results.timeSeries || results.timeSeries.length === 0) return null;
    
    let impactIdx = 0;
    let maxKnee = 0;
    results.timeSeries.forEach((f: any, i: number) => {
      if (f.kneeAngle > maxKnee) {
        maxKnee = f.kneeAngle;
        impactIdx = i;
      }
    });
    
    return {
      kuda: results.timeSeries[0],
      ancang: results.timeSeries[Math.floor(impactIdx / 2)],
      impact: results.timeSeries[impactIdx]
    };
  };

  const praPhases = getPhaseFrames(praResults);
  const pascaPhases = getPhaseFrames(pascaResults);

  // --- FATIGUE CLASSIFICATION LOGIC ---
  const calculateFatigue = () => {
    if (!praResults || !pascaResults) return { level: 'N/A', color: 'bg-slate-400', score: 0 };
    
    const speedDrop = ((praResults.metrics.max_speed_ms - pascaResults.metrics.max_speed_ms) / praResults.metrics.max_speed_ms) * 100;
    const timeIncrease = ((pascaResults.metrics.execution_time - praResults.metrics.execution_time) / praResults.metrics.execution_time) * 100;
    
    // Fatigue Score (0-100)
    const score = Math.max(0, Math.min(100, (speedDrop * 2) + (timeIncrease * 1.5)));
    
    if (score > 40) return { level: 'LELAH BERAT', color: 'bg-coral', score, desc: 'Penurunan performa signifikan (>40%). Risiko cedera tinggi.' };
    if (score > 15) return { level: 'LELAH RINGAN', color: 'bg-upi-gold', score, desc: 'Penurunan performa moderat (15-40%). Perlu pemulihan aktif.' };
    return { level: 'TIDAK LELAH', color: 'bg-grass', score, desc: 'Performa stabil (<15%). Kondisi fisik optimal.' };
  };

  const fatigue = calculateFatigue();

  // Combine data for comparison chart
  const combinedData: any[] = [];
  const maxLen = Math.max(praResults?.timeSeries.length || 0, pascaResults?.timeSeries.length || 0);
  
  for (let i = 0; i < maxLen; i++) {
    const pra = praResults?.timeSeries[i];
    const pasca = pascaResults?.timeSeries[i];
    combinedData.push({
      index: i,
      praKnee: pra?.kneeAngle || null,
      pascaKnee: pasca?.kneeAngle || null,
      praHip: pra?.hipAngle || null,
      pascaHip: pasca?.hipAngle || null,
    });
  }

  const MetricCard = ({ title, pra, pasca, unit = "°", inverse = false }: { title: string, pra: number, pasca: number, unit?: string, inverse?: boolean }) => {
    const diff = pasca - pra;
    const percent = (diff / (pra || 1)) * 100;
    const isBetter = inverse ? diff < 0 : diff > 0;
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="premium-card p-8 group relative overflow-hidden"
      >
        {/* HUD Corners */}
        <div className="hud-corner top-0 left-0 border-t-2 border-l-2"></div>
        <div className="hud-corner top-0 right-0 border-t-2 border-r-2"></div>
        <div className="hud-corner bottom-0 left-0 border-b-2 border-l-2"></div>
        <div className="hud-corner bottom-0 right-0 border-b-2 border-r-2"></div>

        {/* Animated Background for Metric Card */}
        <motion.div 
          animate={{ 
            x: ['-100%', '100%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-upi-red/5 to-transparent skew-x-12 pointer-events-none"
        />

        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-upi-red/5 transition-colors"></div>
        
        <div className="relative z-10">
          {/* Micro Coordinate Labels */}
          <div className="absolute -top-2 -left-2 text-[6px] font-mono text-slate-300">X: {Math.floor(Math.random()*1000)} Y: {Math.floor(Math.random()*1000)}</div>
          
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{title}</p>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black ${isBetter ? 'bg-grass/10 text-grass border border-grass/20' : 'bg-coral/10 text-coral border border-coral/20'}`}>
              {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]"></div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Baseline (Pra)</p>
                  <p className="text-2xl font-display text-slate-900 leading-none">{pra.toFixed(pra < 10 ? 2 : 1)}{unit}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-upi-red rounded-full shadow-[0_0_10px_rgba(153,0,0,0.2)]"></div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fatigued (Pasca)</p>
                  <p className="text-2xl font-display text-slate-900 leading-none">{pasca.toFixed(pasca < 10 ? 2 : 1)}{unit}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DELTA</p>
              <div className={`text-5xl font-display ${isBetter ? 'text-grass' : 'text-coral'} drop-shadow-sm`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(Math.abs(diff) < 1 ? 2 : 1)}{unit}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const AnalysisSection = ({ title, icon, children, span = "lg:col-span-3" }: { title: string, icon: React.ReactNode, children: React.ReactNode, span?: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-8 relative"
    >
      <div className="flex items-center gap-6 group/section">
        <div className="relative">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 bg-upi-red rounded-2xl flex items-center justify-center text-white shadow-xl shadow-upi-red/20 relative overflow-hidden z-10"
          >
            <motion.div 
              animate={{ left: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
            {icon}
          </motion.div>
          {/* Decorative HUD Ring for Section Icon */}
          <div className="absolute inset-0 -m-2 border border-upi-red/20 rounded-2xl hud-ring-cw opacity-0 group-hover/section:opacity-100 transition-opacity"></div>
        </div>
        <h3 className="text-4xl font-display font-black tracking-tight text-slate-900 uppercase title-glitch group-hover/section:text-upi-red transition-colors relative">
          {title}
          <span className="absolute -top-4 -right-8 text-[8px] font-mono text-upi-red/40 opacity-0 group-hover/section:opacity-100 transition-opacity">SEC_ID: {Math.random().toString(16).substring(2,6).toUpperCase()}</span>
        </h3>
        <div className="h-px flex-grow bg-slate-200 relative overflow-hidden">
          <motion.div 
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-upi-red/40 to-transparent"
          />
        </div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${span} gap-8`}>
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-16 relative cyber-grid p-8 rounded-[40px] overflow-hidden">
      {/* Perspective Grid Background */}
      <div className="absolute -bottom-1/4 left-0 w-full h-1/2 perspective-grid opacity-20 pointer-events-none z-0"></div>

      {/* Scanline Overlay */}
      <div className="scanline-overlay"></div>

      {/* Digital Grain Overlay */}
      <div className="absolute inset-0 digital-grain pointer-events-none z-50"></div>

      {/* Data Stream Effect */}
      <div className="absolute top-0 right-10 h-full w-20 overflow-hidden opacity-5 pointer-events-none z-0 flex flex-col gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [-100, 500] }}
            transition={{ duration: Math.random() * 10 + 5, repeat: Infinity, ease: "linear" }}
            className="text-[8px] font-mono text-upi-red whitespace-nowrap"
          >
            {Math.random().toString(16).substring(2, 15).toUpperCase()}
          </motion.div>
        ))}
      </div>

      {/* Global Scanning Effect */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-upi-red/20 to-transparent z-0 pointer-events-none"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-upi-red/5"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 relative z-10">
        <div className="premium-card p-10 bg-white border-slate-200 relative overflow-hidden group">
          {/* HUD Corners */}
          <div className="hud-corner top-0 left-0 border-t-2 border-l-2 w-6 h-6"></div>
          <div className="hud-corner top-0 right-0 border-t-2 border-r-2 w-6 h-6"></div>
          <div className="hud-corner bottom-0 left-0 border-b-2 border-l-2 w-6 h-6"></div>
          <div className="hud-corner bottom-0 right-0 border-b-2 border-r-2 w-6 h-6"></div>

          {/* Animated Background Gradient for Card */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.03, 0.06, 0.03]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/4 w-full h-full bg-upi-red rounded-full blur-[120px] pointer-events-none"
          />

          {/* Animated Radar Sweep */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(153,0,0,0.05)_20deg,transparent_40deg)]"
            />
          </div>

          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="relative">
                {/* Rotating HUD Rings */}
                <div className="absolute inset-0 -m-4 border border-upi-red/10 rounded-full hud-ring-cw"></div>
                <div className="absolute inset-0 -m-8 border border-dashed border-upi-red/5 rounded-full hud-ring-ccw"></div>
                
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 0px rgba(153,0,0,0)',
                      '0 0 30px rgba(153,0,0,0.2)',
                      '0 0 0px rgba(153,0,0,0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-40 h-40 rounded-full border-8 border-slate-100 flex items-center justify-center relative`}
                >
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <motion.circle 
                      cx="80" cy="80" r="70" fill="none" 
                      stroke={fatigue.score > 40 ? '#ff4444' : fatigue.score > 15 ? '#FFD700' : '#00C851'} 
                      strokeWidth="8" 
                      strokeDasharray="440"
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * fatigue.score / 100) }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display text-slate-900">{fatigue.score.toFixed(0)}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fatigue Index</span>
                  </div>
                </motion.div>
              </div>
              
              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-flicker">
                  <div className={`w-2 h-2 rounded-full ${fatigue.color} animate-pulse`}></div>
                  <span className={`text-xs font-black uppercase tracking-widest ${fatigue.score > 40 ? 'text-coral' : fatigue.score > 15 ? 'text-upi-gold' : 'text-grass'}`}>
                    {fatigue.level}
                  </span>
                  <span className="ml-2 text-[8px] font-mono text-slate-400 opacity-50">LIVE_FEED_STABLE</span>
                </div>
                <h2 className="text-5xl font-display font-black text-slate-900 tracking-tighter leading-none title-glitch">CORE SYSTEM <span className="text-upi-red">ANALYSIS</span></h2>
                <p className="text-slate-500 font-medium max-w-md">{fatigue.desc}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {[
                    { label: 'Max Speed', value: pascaResults?.metrics.max_speed_ms.toFixed(2), unit: 'm/s' },
                    { label: 'Exec Time', value: pascaResults?.metrics.execution_time.toFixed(2), unit: 's' },
                    { label: 'Stability', value: (100 - (pascaResults?.metrics.trunk_variability || 0)).toFixed(1), unit: '%' },
                    { label: 'Recovery', value: (pascaResults?.metrics.phases.recovery - pascaResults?.metrics.phases.impact).toFixed(2), unit: 's' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-upi-red/20 hover:bg-white transition-all duration-300 group/stat"
                    >
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 group-hover/stat:text-upi-red transition-colors">{stat.label}</p>
                      <p className="text-xl font-display text-slate-900">{stat.value}<span className="text-[10px] ml-1">{stat.unit}</span></p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      {praResults && pascaResults && (
        <>
          <AnalysisSection title="Analisis Sudut Sendi" icon={<Target className="w-5 h-5" />} span="lg:col-span-3">
            <MetricCard 
              title="Sudut Impact" 
              pra={praResults.metrics.knee_impact} 
              pasca={pascaResults.metrics.knee_impact} 
              unit="°"
            />
            <MetricCard 
              title="Sudut Ancang-ancang" 
              pra={praResults.metrics.knee_ancang} 
              pasca={pascaResults.metrics.knee_ancang} 
              unit="°"
            />
            <MetricCard 
              title="Sudut Knee Kuda-kuda" 
              pra={praResults.metrics.knee_kuda} 
              pasca={pascaResults.metrics.knee_kuda} 
              unit="°"
            />
          </AnalysisSection>

          <AnalysisSection title="Analisis Kecepatan (Velocity)" icon={<Activity className="w-5 h-5" />} span="lg:col-span-3">
            <MetricCard 
              title="Avg Velocity Knee" 
              pra={praResults.metrics.avg_vel_knee} 
              pasca={pascaResults.metrics.avg_vel_knee} 
              unit=" m/s"
            />
            <MetricCard 
              title="Avg Velocity Hip" 
              pra={praResults.metrics.avg_vel_hip} 
              pasca={pascaResults.metrics.avg_vel_hip} 
              unit=" m/s"
            />
            <MetricCard 
              title="Velocity Knee (Impact)" 
              pra={praResults.metrics.impact_vel_knee} 
              pasca={pascaResults.metrics.impact_vel_knee} 
              unit=" m/s"
            />
          </AnalysisSection>

          <AnalysisSection title="Parameter Kinematika Tambahan" icon={<BarChart3 className="w-5 h-5" />} span="lg:col-span-4">
            <MetricCard title="Kecepatan Kaki (Max)" pra={praResults.metrics.max_speed_ms} pasca={pascaResults.metrics.max_speed_ms} unit=" m/s" />
            <MetricCard title="Waktu Eksekusi" pra={praResults.metrics.execution_time} pasca={pascaResults.metrics.execution_time} unit=" s" inverse={true} />
            <MetricCard title="Variabilitas Trunk" pra={praResults.metrics.trunk_variability} pasca={pascaResults.metrics.trunk_variability} unit="°" inverse={true} />
            <MetricCard title="Hip Abduction Dominan" pra={praResults.metrics.hip_abd_dom} pasca={pascaResults.metrics.hip_abd_dom} unit="°" />
          </AnalysisSection>

          <KeyPhaseGallery metrics={pascaResults.metrics} condition="Pasca" />
          {praResults && <KeyPhaseGallery metrics={praResults.metrics} condition="Pra" />}

          {/* Insight & Rekomendasi Section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="premium-card p-10 bg-white border-slate-200 relative overflow-hidden group"
          >
            {/* HUD Corners */}
            <div className="hud-corner top-0 left-0 border-t-2 border-l-2 w-6 h-6"></div>
            <div className="hud-corner top-0 right-0 border-t-2 border-r-2 w-6 h-6"></div>
            <div className="hud-corner bottom-0 left-0 border-b-2 border-l-2 w-6 h-6"></div>
            <div className="hud-corner bottom-0 right-0 border-b-2 border-r-2 w-6 h-6"></div>

            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-upi-red/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-upi-red rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(153,0,0,0.2)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-display font-black tracking-tighter text-slate-900 uppercase title-glitch">
                      INSIGHT & <span className="text-upi-red">REKOMENDASI</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Hasil Analisis Biomekanika Komprehensif</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
                  <div className="w-2 h-2 bg-upi-red rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-upi-red uppercase tracking-widest">AI Generated Insight</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Insights Column */}
                <div className="space-y-6">
                  <h4 className="text-xl font-display text-upi-red flex items-center gap-3">
                    <div className="w-1 h-6 bg-upi-red"></div>
                    KINEMATIC INSIGHTS
                  </h4>
                  <div className="space-y-4">
                    {pascaResults.metrics.impact_vel_knee < praResults.metrics.impact_vel_knee ? (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-coral/10 text-coral rounded-xl flex items-center justify-center flex-shrink-0 border border-coral/20">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">Penurunan Power Impact</p>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Kecepatan lutut saat impact menurun sebesar <span className="text-coral font-black">{(praResults.metrics.impact_vel_knee - pascaResults.metrics.impact_vel_knee).toFixed(2)} m/s</span> pada kondisi pasca-kelelahan. Ini mengindikasikan penurunan efisiensi transfer energi.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-grass/10 text-grass rounded-xl flex items-center justify-center flex-shrink-0 border border-grass/20">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">Konsistensi Power Terjaga</p>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Luar biasa! Kecepatan impact Anda tetap stabil bahkan setelah kelelahan. Ini menunjukkan tingkat kebugaran anaerobik yang sangat baik.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {pascaResults.metrics.knee_kuda > praResults.metrics.knee_kuda && (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-upi-red/10 text-upi-red rounded-xl flex items-center justify-center flex-shrink-0 border border-upi-red/20">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">Instabilitas Kuda-Kuda</p>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Sudut lutut kuda-kuda meningkat <span className="text-upi-red font-black">{(pascaResults.metrics.knee_kuda - praResults.metrics.knee_kuda).toFixed(1)}°</span>. Kuda-kuda yang lebih tinggi mengurangi stabilitas basis pendukung saat melakukan tendangan.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors group/item">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Fleksibilitas Panggul</p>
                          <p className="text-sm text-slate-500 mt-2 leading-relaxed">Hip Abduction dominan berada pada <span className="text-blue-600 font-black">{pascaResults.metrics.hip_abd_dom.toFixed(1)}°</span>. Rentang gerak ini krusial untuk mencapai target tendangan yang lebih tinggi.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations Column */}
                <div className="space-y-6">
                  <h4 className="text-xl font-display text-upi-red flex items-center gap-3">
                    <div className="w-1 h-6 bg-upi-red"></div>
                    STRATEGIC RECOMMENDATIONS
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-upi-red/5 border border-upi-red/10 rounded-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Activity className="w-24 h-24 text-upi-red" />
                      </div>
                      <p className="text-[10px] font-black text-upi-red uppercase tracking-widest mb-2">Latihan Fisik</p>
                      <p className="text-slate-700 font-medium leading-relaxed">Fokus pada <span className="text-upi-red font-bold">Plyometric Training</span> untuk meningkatkan daya ledak (explosive power) dan menjaga kecepatan impact saat kondisi lelah.</p>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Target className="w-24 h-24 text-upi-red" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teknik & Stabilitas</p>
                      <p className="text-slate-700 font-medium leading-relaxed">Perkuat otot <span className="text-upi-red font-bold">Quadriceps & Core</span> untuk mempertahankan kuda-kuda tetap rendah dan stabil sepanjang pertandingan.</p>
                    </div>

                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-5">
                        <BookOpen className="w-24 h-24 text-blue-600" />
                      </div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Pemulihan</p>
                      <p className="text-slate-700 font-medium leading-relaxed">Lakukan <span className="text-blue-600 font-bold">Dynamic Stretching</span> rutin pada area adductor panggul untuk memaksimalkan jangkauan tendangan Sabit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Comparison Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="premium-card p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-3xl font-display font-black tracking-tight text-upi-red flex items-center gap-4 title-glitch">
            <div className="w-12 h-12 bg-upi-red rounded-xl flex items-center justify-center text-white shadow-lg"><BarChart3 className="w-6 h-6" /></div>
            GRAFIK PERBANDINGAN SUDUT LUTUT
          </h3>
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-blue-600"></span>
              <span className="text-sm font-bold text-slate-600">Pra</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-upi-red"></span>
              <span className="text-sm font-bold text-slate-600">Pasca</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
              <XAxis dataKey="index" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 180]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#000' }}
                itemStyle={{ fontWeight: 'bold', color: '#990000' }}
              />
              <Line name="Pra" type="monotone" dataKey="praKnee" stroke="#2563eb" strokeWidth={4} dot={false} />
              <Line name="Pasca" type="monotone" dataKey="pascaKnee" stroke="#990000" strokeWidth={4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-upi-red rounded-xl flex items-center justify-center text-white shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-display font-black tracking-tight text-upi-red uppercase title-glitch">Detail Sekuens Frame-by-Frame</h3>
        </div>
        <div className="grid grid-cols-1 gap-8">
          <FrameSequence results={praResults} label="pra" />
          <FrameSequence results={pascaResults} label="pasca" />
        </div>
      </motion.div>
    </div>
  );
};
