import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Target, Zap, Clock, Activity, Download, Printer, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ResultReportProps {
  testId: number;
  athleteData: any;
  kicks: any[];
  onReset: () => void;
}

export const ResultReport: React.FC<ResultReportProps> = ({ testId, athleteData, kicks, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const avgAccuracy = kicks.reduce((a, b) => a + b.accuracy_points, 0) / kicks.length;
  const avgSpeed = kicks.reduce((a, b) => a + (1.5 / b.duration), 0) / kicks.length;
  const totalPoints = kicks.reduce((a, b) => a + b.accuracy_points, 0);

  const getCategory = (acc: number, spd: number) => {
    if (acc > 80 && spd > 5) return { label: 'ISTIMEWA', color: 'bg-grass', desc: 'Sangat Baik' };
    if (acc > 60 && spd > 3) return { label: 'BAIK', color: 'bg-upi-gold', desc: 'Cukup Baik' };
    return { label: 'PERLU LATIHAN', color: 'bg-coral', desc: 'Underperform' };
  };

  const category = getCategory(avgAccuracy, avgSpeed);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-6xl font-display font-black tracking-tighter text-slate-900 leading-none uppercase title-glitch">
            LAPORAN <span className="text-upi-red">ANALISIS</span>
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-1 w-12 bg-upi-red"></div>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest">Final Performance Metrics & Biomechanics</p>
          </div>
        </div>
        <div className="flex gap-4">
            <button onClick={handlePrint} className="secondary-button !py-4 !px-8">
                <Printer className="w-5 h-5" /> CETAK LAPORAN
            </button>
            <button onClick={onReset} className="action-button !py-4 !px-8">
                ANALISIS BARU
            </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-10 print:p-0">
        {/* Summary Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="premium-card p-10 lg:col-span-1 space-y-8 bg-slate-900 text-white border-none relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="w-40 h-40" />
             </div>
             <div className="relative z-10">
                <p className="section-label !text-upi-gold">IDENTITAS ATLET</p>
                <div className="space-y-4">
                    <ProfileItem label="Nama" value={athleteData.name} />
                    <ProfileItem label="ID Test" value={`#${testId}`} />
                    <ProfileItem label="Cedera" value={athleteData.injuryType} />
                    <ProfileItem label="Lokasi" value={athleteData.bodyPart} />
                    <ProfileItem label="Pemulihan" value={`${athleteData.recoveryTime} Minggu`} />
                </div>
             </div>
          </div>

          <div className="premium-card p-10 lg:col-span-2 flex flex-col md:flex-row items-center gap-10">
              <div className="relative w-48 h-48 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <motion.circle 
                      cx="96" cy="96" r="80" fill="none" 
                      stroke="#990000" 
                      strokeWidth="12" 
                      strokeDasharray="502"
                      initial={{ strokeDashoffset: 502 }}
                      animate={{ strokeDashoffset: 502 - (502 * avgAccuracy / 100) }}
                      transition={{ duration: 1.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-display font-black text-slate-900">{avgAccuracy.toFixed(0)}<span className="text-xl">%</span></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
                  </div>
              </div>
              <div className="flex-grow space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                    <div className={`w-2 h-2 rounded-full ${category.color} animate-pulse`}></div>
                    <span className="text-xs font-black uppercase tracking-widest">{category.label}</span>
                  </div>
                  <h3 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tight leading-none">
                    HASIL <span className="text-upi-red">KOMPREHENSIF</span>
                  </h3>
                  <p className="text-slate-500 font-medium">Atlet menunjukkan tingkat {category.desc} dalam performa tendangan depan pasca pemulihan {athleteData.injuryType}.</p>
                  
                  <div className="grid grid-cols-2 gap-6 pt-4">
                      <div>
                          <p className="section-label">Total Poin Akurasi</p>
                          <p className="text-3xl font-display font-black text-slate-900">{totalPoints} <span className="text-sm font-medium text-slate-400">Pts</span></p>
                      </div>
                      <div>
                          <p className="section-label">Rata-rata Waktu</p>
                          <p className="text-3xl font-display font-black text-slate-900">{avgSpeed.toFixed(2)} <span className="text-sm font-medium text-slate-400">m/s</span></p>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="premium-card overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-display font-black text-slate-900 uppercase">Rincian Per-Tendangan</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total 10 Percobaan</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">No</th>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Akurasi (Pts)</th>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Waktu (s)</th>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Kecepatan (m/s)</th>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {kicks.map((k, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 font-tech font-bold text-slate-400">{(i + 1).toString().padStart(2, '0')}</td>
                                <td className="px-8 py-4 font-display font-black text-lg text-slate-900">{k.accuracy_points}</td>
                                <td className="px-8 py-4 font-tech text-slate-600">{k.duration.toFixed(3)}s</td>
                                <td className="px-8 py-4 font-tech font-bold text-upi-red">{(1.5 / k.duration).toFixed(2)}</td>
                                <td className="px-8 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${k.accuracy_points > 80 ? 'bg-grass/10 text-grass' : k.accuracy_points > 50 ? 'bg-upi-gold/10 text-upi-gold' : 'bg-coral/10 text-coral'}`}>
                                        {k.accuracy_points > 80 ? 'Perfect' : k.accuracy_points > 50 ? 'Valid' : 'Miss'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="premium-card p-8">
                <h3 className="text-xl font-display font-black text-slate-900 uppercase mb-8 flex items-center gap-3">
                    <Target className="w-5 h-5 text-upi-red" /> Tren Akurasi
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kicks.map((k, i) => ({ kick: i + 1, acc: k.accuracy_points }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="kick" label={{ value: 'Kick #', position: 'insideBottom', offset: -5 }} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="acc" stroke="#990000" strokeWidth={4} dot={{ r: 6, fill: '#990000', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="premium-card p-8">
                <h3 className="text-xl font-display font-black text-slate-900 uppercase mb-8 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-upi-gold" /> Tren Kecepatan (m/s)
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kicks.map((k, i) => ({ kick: i + 1, speed: 1.5 / k.duration }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="kick" />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="speed" fill="#FFD700" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Conclusion */}
        <div className="premium-card p-10 bg-slate-50 border-slate-200">
            <h4 className="text-2xl font-display font-black text-slate-900 uppercase mb-6">KESIMPULAN ANALISIS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-upi-red rounded-lg flex items-center justify-center text-white flex-shrink-0">1</div>
                        <p className="text-slate-600 font-medium">Akurasi rata-rata berada pada tingkat <span className="font-bold text-slate-900">{avgAccuracy.toFixed(1)}%</span>, menunjukkan pemulihan motorik yang {avgAccuracy > 70 ? 'baik' : 'sedang'}.</p>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-upi-red rounded-lg flex items-center justify-center text-white flex-shrink-0">2</div>
                        <p className="text-slate-600 font-medium">Daya ledak (kecepatan) rata-rata adalah <span className="font-bold text-slate-900">{avgSpeed.toFixed(2)} m/s</span>, {avgSpeed > 4 ? 'sudah mendekati' : 'masih di bawah'} standar kompetisi.</p>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rekomendasi Pelatih:</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Fokus pada latihan stability {athleteData.bodyPart} dan penguatan otot reaktif untuk meningkatkan akselerasi fase impact. Analisis video diagonal menunjukkan sedikit kompensasi pada trunk angle.
                    </p>
                </div>
            </div>
            <div className="mt-10 pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 grayscale">
                 <div className="flex items-center gap-4">
                    <img src="https://lh3.googleusercontent.com/d/150kr_WKX4Ha1bV6x8hnAJhB7X02PZKhk" className="w-10 h-10 object-contain" />
                    <p className="text-[8px] font-black uppercase tracking-widest">LABORATORIUM BIOMEKANIKA UPI</p>
                 </div>
                 <p className="text-[10px] font-mono">REPORT_TIMESTAMP: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ label, value }: any) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-display font-bold text-white uppercase">{value || '-'}</p>
    </div>
);
