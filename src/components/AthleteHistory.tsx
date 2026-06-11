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
    
    const withTimeout = <T,>(promise: Promise<T>, ms = 6000): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timeout load database."));
        }, ms);
        promise
          .then((res) => {
            clearTimeout(timer);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    const getHistory = async () => {
      try {
        const athletesSnap = await withTimeout(getDocs(collection(db, "athletes")));
        const athletesMap = new Map();
        athletesSnap.docs.forEach(doc => {
          const data = doc.data();
          athletesMap.set(data.id, data);
        });

        const testsSnap = await withTimeout(getDocs(collection(db, "tests")));
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
    <div className="space-y-6 sm:space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-900 leading-none uppercase">
            RIWAYAT <span className="text-upi-red">ANALISIS</span>
          </h2>
          <div className="flex items-center gap-3 mt-3 sm:mt-4">
            <div className="h-1 w-12 bg-upi-red"></div>
            <p className="text-xs sm:text-sm text-slate-500 font-bold sm:font-black uppercase tracking-widest">Database Performa Atlet Pasca Cedera</p>
          </div>
        </div>
        <button 
          onClick={exportToExcel}
          className="gold-button !py-2.5 sm:!py-4 !px-6 sm:!px-10 cursor-pointer w-full md:w-auto"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" /> EXPORT EXCEL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {history.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onViewReport?.(item.id)}
            className="premium-card p-4 sm:p-6 lg:p-8 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 xl:gap-8 cursor-pointer hover:border-upi-red group transition-all"
          >
            <div className="flex items-center gap-4 sm:gap-6 w-full xl:w-auto min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-upi-red/10 group-hover:text-upi-red transition-all shrink-0">
                    <User className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-lg sm:text-2xl font-display font-black text-slate-900 group-hover:text-upi-red transition-colors truncate">{item.athlete_name}</h4>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{item.athlete_id} • {item.injury_type}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 xl:gap-12 w-full xl:w-auto border-t border-slate-100 xl:border-0 pt-4 xl:pt-0">
                <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Akurasi Rata-rata</p>
                    <p className="text-xl sm:text-2xl md:text-4xl font-display font-black text-slate-900">{item.avg_accuracy}<span className="text-sm sm:text-lg text-upi-red">%</span></p>
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kecepatan Rata-rata</p>
                    <p className="text-xl sm:text-2xl md:text-4xl font-display font-black text-slate-900">{item.avg_speed}<span className="text-sm sm:text-lg text-upi-red">m/s</span></p>
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori Performa</p>
                    <div className="pt-0.5">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${item.performance_category === 'TINGGI' ? 'bg-grass/10 text-grass' : item.performance_category === 'SEDANG' ? 'bg-upi-gold/10 text-upi-red' : 'bg-upi-red/10 text-upi-red'}`}>
                          {item.performance_category}
                      </span>
                    </div>
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Analisis</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-600">{format(new Date(item.test_date), 'dd/MM/yyyy')}</p>
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
