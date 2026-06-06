import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, FileText, Target, Zap, Activity, TrendingUp, Award, Calendar, Heart, Shield, ChevronRight, Clock } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

interface DashboardStats {
  totalAthletes: number;
  totalTests: number;
  avgAccuracy: number;
  avgSpeed: number;
  performanceDist: { performance_category: string; count: number }[];
  recentTests: any[];
  athleteProfile?: {
    id: string;
    name: string;
    age: number;
    gender: string;
    injury_type: string;
    body_part: string;
    recovery_time: number;
    created_at: string;
  };
}

interface DashboardProps {
  athleteId?: string;
  onViewReport?: (testId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ athleteId, onViewReport }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);

    const loadData = async () => {
      try {
        if (athleteId) {
          // --- Athlete Mode ---
          const athleteDocRef = doc(db, "athletes", athleteId);
          let athleteProfile: any = null;
          try {
            const athSnap = await getDoc(athleteDocRef);
            if (athSnap.exists()) {
              athleteProfile = athSnap.data();
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `athletes/${athleteId}`);
          }

          let allTests: any[] = [];
          try {
            const testsSnap = await getDocs(collection(db, "tests"));
            allTests = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "tests");
          }

          const athleteTests = allTests.filter(t => t.athlete_id === athleteId);
          const totalTests = athleteTests.length;
          const totalAccuracySum = athleteTests.reduce((acc, t) => acc + (t.avg_accuracy || 0), 0);
          const totalSpeedSum = athleteTests.reduce((acc, t) => acc + (t.avg_speed || 0), 0);

          const avgAccuracy = totalTests > 0 ? (totalAccuracySum / totalTests) : 0;
          const avgSpeed = totalTests > 0 ? (totalSpeedSum / totalTests) : 0;

          // Group by performance category
          const distMap: Record<string, number> = {};
          athleteTests.forEach(t => {
            const cat = t.performance_category || "RENDAH";
            distMap[cat] = (distMap[cat] || 0) + 1;
          });

          const performanceDist = Object.keys(distMap).map(key => ({
            performance_category: key,
            count: distMap[key]
          }));

          const recentTests = athleteTests.map(t => ({
            ...t,
            athlete_name: athleteProfile ? athleteProfile.name : "Atlet"
          }));
          recentTests.sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime());
          const recentLimit = recentTests.slice(0, 10);

          if (active) {
            setStats({
              totalAthletes: 1,
              totalTests,
              avgAccuracy,
              avgSpeed,
              performanceDist,
              recentTests: recentLimit,
              athleteProfile
            });
          }
        } else {
          // --- Coach Mode ---
          let allAthletes: any[] = [];
          try {
            const athletesSnap = await getDocs(collection(db, "athletes"));
            allAthletes = athletesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "athletes");
          }

          const athletesMap = new Map();
          allAthletes.forEach(ath => {
            athletesMap.set(ath.id, ath);
          });

          let allTests: any[] = [];
          try {
            const testsSnap = await getDocs(collection(db, "tests"));
            allTests = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "tests");
          }

          const totalAthletes = allAthletes.length;
          const totalTests = allTests.length;
          const totalAccuracySum = allTests.reduce((acc, t) => acc + (t.avg_accuracy || 0), 0);
          const totalSpeedSum = allTests.reduce((acc, t) => acc + (t.avg_speed || 0), 0);

          const avgAccuracy = totalTests > 0 ? (totalAccuracySum / totalTests) : 0;
          const avgSpeed = totalTests > 0 ? (totalSpeedSum / totalTests) : 0;

          // Group by category
          const distMap: Record<string, number> = {};
          allTests.forEach(t => {
            const cat = t.performance_category || "RENDAH";
            distMap[cat] = (distMap[cat] || 0) + 1;
          });

          const performanceDist = Object.keys(distMap).map(key => ({
            performance_category: key,
            count: distMap[key]
          }));

          const recentTests = allTests.map(t => {
            const ath = athletesMap.get(t.athlete_id);
            return {
              ...t,
              athlete_name: ath ? ath.name : "Unknown"
            };
          });
          recentTests.sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime());
          const recentLimit = recentTests.slice(0, 5);

          if (active) {
            setStats({
              totalAthletes,
              totalTests,
              avgAccuracy,
              avgSpeed,
              performanceDist,
              recentTests: recentLimit
            });
          }
        }
      } catch (err: any) {
        console.error("Failed compiling stats: ", err);
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [athleteId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-12 premium-card text-center space-y-6 mt-10">
        <div className="w-16 h-16 bg-red-50 text-upi-red rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-sm animate-pulse">
          <Activity className="w-8 h-8 text-upi-red" />
        </div>
        <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">GAGAL MEMUAT DASHBOARD</h3>
        <p className="text-slate-500 font-medium text-sm leading-relaxed">
          Terdapat kendala koneksi atau gangguan proses data pada database. Silakan muat ulang halaman atau coba lagi.
        </p>
        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs font-mono text-left text-red-600 max-h-36 overflow-y-auto">
          {error}
        </div>
        <button 
          onClick={() => {
            window.location.reload();
          }}
          className="action-button w-full shadow-lg shadow-upi-red/15 uppercase font-display"
        >
          MUAT ULANG HALAMAN
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-upi-red border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-display font-bold text-sm uppercase tracking-widest animate-pulse">Memuat Dashboard...</p>
      </div>
    );
  }

  const isAthlete = !!athleteId && stats.athleteProfile;
  const profile = stats.athleteProfile;

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <section className="premium-card p-10 flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-upi-red to-red-900 border-none text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex-grow space-y-6">
          <div className="inline-block px-4 py-1.5 bg-upi-gold text-upi-red rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            {isAthlete ? "Athlete Personal Monitoring Hub" : "Biomechanics Analysis System"}
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-none uppercase">
            {isAthlete ? (
              <>
                SELAMAT DATANG, <br />
                <span className="text-upi-gold text-wrap">{profile?.name}</span>
              </>
            ) : (
              <>
                SELAMAT DATANG DI <br />
                <span className="text-upi-gold uppercase">SILATMETRICS</span>
              </>
            )}
          </h1>
          <p className="text-lg text-red-100 max-w-xl font-light">
            {isAthlete 
              ? `Dashboard personal untuk memantau pemulihan biomekanika tendangan depan pencak silat pasca cedera ${profile?.injury_type} pada ${profile?.body_part}.`
              : "Sistem analisis biomekanika tendangan depan pencak silat untuk monitoring akurasi dan kecepatan atlet secara presisi berbasis Artificial Intelligence."
            }
          </p>
        </div>
        <div className="relative z-10 hidden lg:block">
          <div className="w-48 h-48 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
             <TrendingUp className="w-20 h-20 text-upi-gold" />
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={isAthlete ? <Activity className="w-6 h-6" /> : <Users className="w-6 h-6" />} 
          label={isAthlete ? "Jumlah Sesi Latihan" : "Jumlah Atlet"} 
          value={isAthlete ? stats.totalTests : stats.totalAthletes} 
          sub={isAthlete ? "Total Sesi Analisis" : "Atlet Terdaftar"} 
        />
        <StatCard 
          icon={<FileText className="w-6 h-6" />} 
          label="Jumlah Data Tes" 
          value={stats.totalTests} 
          sub="Total Sesi Terlaksana" 
        />
        <StatCard 
          icon={<Target className="w-6 h-6" />} 
          label="Rata-rata Akurasi" 
          value={`${stats.avgAccuracy.toFixed(1)}%`} 
          sub="Performa Presisi" 
          color="text-grass"
        />
        <StatCard 
          icon={<Zap className="w-6 h-6" />} 
          label="Rata-rata Kecepatan" 
          value={`${stats.avgSpeed.toFixed(2)} m/s`} 
          sub="Daya Ledak Maksimal" 
          color="text-upi-gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-8 premium-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">
                {isAthlete ? "Grafik Perkembangan Anda" : "Perkembangan Hasil Keseluruhan"}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-upi-red"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Akurasi (%)</span>
              </div>
            </div>
            {stats.recentTests.length > 0 ? (
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.recentTests.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="test_date" tickFormatter={(val) => new Date(val).toLocaleDateString()} label={{ value: 'Tanggal', position: 'bottom', offset: 0 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg_accuracy" 
                        stroke="#990000" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#990000', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 10 }}
                      />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-slate-400 font-medium">Belum ada data tes untuk divisualisasikan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories or Profile Detail */}
        <div className="lg:col-span-4 space-y-8">
          {isAthlete && profile ? (
            <div className="premium-card p-8 bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Heart className="w-6 h-6 text-upi-red/20" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-950 uppercase mb-6 tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-upi-red" /> STATUS MEDIS
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-upi-red/5 flex items-center justify-center text-upi-red text-sm font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jenis Cedera</p>
                    <p className="text-base font-black text-slate-800 uppercase">{profile.injury_type || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-upi-gold/10 flex items-center justify-center text-upi-red text-sm font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bagian Tubuh</p>
                    <p className="text-base font-black text-slate-800 uppercase">{profile.body_part || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Pemulihan</p>
                    <p className="text-base font-black text-slate-800 uppercase">{profile.recovery_time ? `${profile.recovery_time} Minggu` : "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Profil Dibuat</p>
                    <p className="text-base font-bold text-slate-600">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="premium-card p-8">
            <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-8 tracking-tight">Kategori Performa</h3>
            <div className="space-y-6">
              {stats.performanceDist.length > 0 ? stats.performanceDist.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">{item.performance_category}</span>
                    <span className="text-xl font-display font-black text-upi-red">{item.count}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                     <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / (stats.totalTests || 1)) * 100}%` }}
                      className="h-full bg-upi-red"
                     />
                  </div>
                </div>
              )) : <p className="text-slate-400 text-center py-10 font-medium">Belum ada statistik kategori</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests Table & Report Access for Athletes */}
      {isAthlete && (
        <div className="premium-card p-8">
          <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-6 tracking-tight">
            RIWAYAT HASIL TES ANDA
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Akurasi Rata-rata</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kecepatan Rata-rata</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Performa</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 text-sm font-black text-slate-700">
                      {new Date(t.test_date).toLocaleDateString()} • {new Date(t.test_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 font-display font-black text-slate-900 text-lg">
                      {t.avg_accuracy.toFixed(1)}%
                    </td>
                    <td className="py-4 font-display font-medium text-slate-600">
                      {t.avg_speed.toFixed(2)} m/s
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        t.performance_category === 'TINGGI' ? 'bg-grass/10 text-grass' : t.performance_category === 'SEDANG' ? 'bg-upi-gold/10 text-upi-red' : 'bg-upi-red/10 text-upi-red'
                      }`}>
                        {t.performance_category}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {onViewReport ? (
                        <button
                          onClick={() => onViewReport(t.id)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-upi-red transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          LIHAT <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {stats.recentTests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-medium bg-slate-50/30 rounded-xl">
                      Belum ada sesi analisis biomekanika tendangan yang direkam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color = "text-upi-red" }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="premium-card p-8 group relative overflow-hidden"
  >
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
      {icon}
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform ${color === 'text-grass' ? 'bg-grass text-white' : color === 'text-upi-gold' ? 'bg-upi-gold text-upi-red' : 'bg-upi-red text-white'}`}>
      {icon}
    </div>
    <p className="section-label">{label}</p>
    <h4 className="text-4xl font-display font-black text-slate-900 group-hover:text-upi-red transition-colors">{value}</h4>
    <p className="text-xs text-slate-400 font-medium mt-2 uppercase tracking-widest">{sub}</p>
  </motion.div>
);
