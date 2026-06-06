import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { User, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

interface AthleteHistoryProps {
  onViewReport?: (testId: string) => void;
}

export const AthleteHistory: React.FC<AthleteHistoryProps> = ({ onViewReport }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const historyDocPath = "tests";
    
    const getHistory = async () => {
      try {
        const athletesSnap = await getDocs(collection(db, "athletes"));
        const athletesMap = new Map();
        athletesSnap.docs.forEach(doc => {
          const data = doc.data();
          athletesMap.set(data.id, data);
        });

        const testsSnap = await getDocs(collection(db, "tests"));
        const tests = testsSnap.docs.map(doc => {
          const t = doc.data() as any;
          const ath = athletesMap.get(t.athlete_id) || {};
          return {
            ...t,
            id: doc.id,
            athlete_name: ath.name || "Unknown",
            injury_type: ath.injury_type || "",
            body_part: ath.body_part || ""
          } as any;
        });

        tests.sort((a, b) => {
          return new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime();
        });

        if (active) {
          setHistory(tests);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed compiling history: ", err);
        if (active) {
          handleFirestoreError(err, OperationType.LIST, historyDocPath);
          setHistory([]);
          setLoading(false);
        }
      }
    };

    getHistory();
    return () => {
      active = false;
    };
  }, []);

  const exportToExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dataToExport = history.map(item => ({
      'Tanggal': format(new Date(item.test_date), 'dd/MM/yyyy HH:mm'),
      'ID Atlet': item.athlete_id,
      'Nama Atlet': item.athlete_name,
      'Cedera': item.injury_type,
      'Bagian Tubuh': item.body_part,
      'Rata-rata Akurasi (%)': item.avg_accuracy,
      'Rata-rata Kecepatan (m/s)': item.avg_speed,
      'Kategori': item.performance_category
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat SILATMETRICS");
    XLSX.writeFile(wb, `SILATMETRICS_History_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  if (loading) return <div className="p-20 text-center text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Memuat riwayat...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-6xl font-display font-black tracking-tighter text-slate-900 leading-none uppercase">
            RIWAYAT <span className="text-upi-red">ANALISIS</span>
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-1 w-12 bg-upi-red"></div>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest">Database Performa Atlet Pasca Cedera</p>
          </div>
        </div>
        <button 
          onClick={exportToExcel}
          className="gold-button !py-4 !px-10 cursor-pointer"
        >
          <Download className="w-5 h-5" /> EXPORT EXCEL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {history.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onViewReport?.(item.id)}
            className="premium-card p-10 flex flex-col xl:flex-row items-center justify-between gap-10 cursor-pointer hover:border-upi-red group transition-all"
          >
            <div className="flex items-center gap-8 w-full xl:w-auto">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-upi-red/10 group-hover:text-upi-red transition-all">
                    <User className="w-10 h-10" />
                </div>
                <div>
                    <h4 className="text-3xl font-display font-black text-slate-900 group-hover:text-upi-red transition-colors">{item.athlete_name}</h4>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{item.athlete_id} • {item.injury_type}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full xl:w-auto">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akurasi Rata-rata</p>
                    <p className="text-4xl font-display font-black text-slate-900">{item.avg_accuracy}<span className="text-lg text-upi-red">%</span></p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kecepatan Rata-rata</p>
                    <p className="text-4xl font-display font-black text-slate-900">{item.avg_speed}<span className="text-lg text-upi-red">m/s</span></p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori Performa</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.performance_category === 'TINGGI' ? 'bg-grass/10 text-grass' : item.performance_category === 'SEDANG' ? 'bg-upi-gold/10 text-upi-red' : 'bg-upi-red/10 text-upi-red'}`}>
                        {item.performance_category}
                    </span>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Analisis</p>
                    <p className="text-lg font-bold text-slate-600">{format(new Date(item.test_date), 'dd/MM/yyyy')}</p>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 font-bold">Belum ada data riwayat.</p>
        </div>
      )}
    </div>
  );
};
export { XLSX };
