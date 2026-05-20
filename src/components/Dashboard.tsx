import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, FileText, Target, Zap, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Mascot } from './Icons';

interface DashboardStats {
  totalAthletes: number;
  totalTests: number;
  avgAccuracy: number;
  avgSpeed: number;
  performanceDist: { performance_category: string; count: number }[];
  recentTests: any[];
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div className="p-10 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <section className="premium-card p-10 flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-upi-red to-red-900 border-none text-white relative overflow-hidden">
        <div className="relative z-10 flex-grow space-y-6">
          <div className="inline-block px-4 py-1.5 bg-upi-gold text-upi-red rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Biomechanics Analysis System
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-none">
            SELAMAT DATANG DI <br />
            <span className="text-upi-gold uppercase">SILATMETRICS</span>
          </h1>
          <p className="text-lg text-red-100 max-w-xl font-light">
            Sistem analisis biomekanika tendangan depan pencak silat untuk monitoring akurasi dan kecepatan atlet secara presisi berbasis Artificial Intelligence.
          </p>
        </div>
        <div className="relative z-10 hidden lg:block">
          <div className="w-48 h-48 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
             <TrendingUp className="w-20 h-20 text-upi-gold" />
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-6 h-6" />} 
          label="Jumlah Atlet" 
          value={stats.totalAthletes} 
          sub="Atlet Terdaftar" 
        />
        <StatCard 
          icon={<FileText className="w-6 h-6" />} 
          label="Jumlah Data Tes" 
          value={stats.totalTests} 
          sub="Total Sesi Analisis" 
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
          sub="Daya Ledak" 
          color="text-upi-gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-8 premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-display font-black text-slate-900 uppercase">Perkembangan Hasil</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-upi-red"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Akurasi (%)</span>
            </div>
          </div>
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
        </div>

        {/* Category Dist */}
        <div className="lg:col-span-4 premium-card p-8">
          <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-8">Kategori Performa</h3>
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
                    animate={{ width: `${(item.count / stats.totalTests) * 100}%` }}
                    className="h-full bg-upi-red"
                   />
                </div>
              </div>
            )) : <p className="text-slate-400 text-center py-10">Belum ada data category</p>}
          </div>
        </div>
      </div>
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
