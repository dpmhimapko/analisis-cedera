import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Ruler, Activity, Clock, Save, Plus, ChevronRight, UserPlus, CheckCircle2, Trash2 } from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: string;
  injury_type: string;
  body_part: string;
  recovery_time: number;
}

interface AthleteDataProps {
  onNext: (data: any) => void;
  savedData?: any;
  athleteId?: string;       // Logged in athlete ID
  isAthleteMode?: boolean;   // Logged in as athlete
}

export const AthleteData: React.FC<AthleteDataProps> = ({ onNext, savedData, athleteId, isAthleteMode }) => {
  const [formData, setFormData] = useState(savedData || {
    id: athleteId || `ATLET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    name: '',
    age: '',
    gender: 'Laki-laki',
    injuryType: '',
    bodyPart: ''
  });
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showForm, setShowForm] = useState(!!isAthleteMode);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setErrorStatus(null);
    try {
      const bagasId = "ATLET-BAGAS";
      
      // 1. Seed Athlete
      const athleteRef = doc(db, "athletes", bagasId);
      await setDoc(athleteRef, {
        id: bagasId,
        name: "Bagas Prakoso",
        age: 23,
        gender: "Laki-laki",
        injury_type: "Putus Tendon Achilles (Rupture)",
        body_part: "Tungkai Kiri (Achilles Kiri)",
        recovery_time: 16,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      });

      // Kicks Sesi 1
      const kicksSesi1 = [
        { kick_number: 1, accuracy_points: 42, start_time: 0, contact_time: 0.72, duration: 0.75, angle: "lurus" },
        { kick_number: 2, accuracy_points: 45, start_time: 0.1, contact_time: 0.68, duration: 0.72, angle: "lurus" },
        { kick_number: 3, accuracy_points: 38, start_time: 0, contact_time: 0.75, duration: 0.82, angle: "lurus" },
        { kick_number: 4, accuracy_points: 52, start_time: 0.05, contact_time: 0.70, duration: 0.74, angle: "lurus" },
        { kick_number: 5, accuracy_points: 40, start_time: 0, contact_time: 0.78, duration: 0.80, angle: "lurus" },
        { kick_number: 6, accuracy_points: 48, start_time: 0.12, contact_time: 0.69, duration: 0.71, angle: "lurus" },
        { kick_number: 7, accuracy_points: 35, start_time: 0, contact_time: 0.85, duration: 0.89, angle: "lurus" },
        { kick_number: 8, accuracy_points: 47, start_time: 0.02, contact_time: 0.71, duration: 0.76, angle: "lurus" },
        { kick_number: 9, accuracy_points: 58, start_time: 0.05, contact_time: 0.65, duration: 0.69, angle: "lurus" },
        { kick_number: 10, accuracy_points: 47, start_time: 0, contact_time: 0.73, duration: 0.77, angle: "lurus" },
      ];

      // Kicks Sesi 2
      const kicksSesi2 = [
        { kick_number: 1, accuracy_points: 70, start_time: 0, contact_time: 0.48, duration: 0.51, angle: "lurus" },
        { kick_number: 2, accuracy_points: 75, start_time: 0.05, contact_time: 0.44, duration: 0.48, angle: "lurus" },
        { kick_number: 3, accuracy_points: 68, start_time: 0, contact_time: 0.50, duration: 0.53, angle: "lurus" },
        { kick_number: 4, accuracy_points: 72, start_time: 0.02, contact_time: 0.46, duration: 0.49, angle: "lurus" },
        { kick_number: 5, accuracy_points: 80, start_time: 0, contact_time: 0.42, duration: 0.45, angle: "lurus" },
        { kick_number: 6, accuracy_points: 65, start_time: 0.08, contact_time: 0.52, duration: 0.55, angle: "lurus" },
        { kick_number: 7, accuracy_points: 74, start_time: 0, contact_time: 0.45, duration: 0.48, angle: "lurus" },
        { kick_number: 8, accuracy_points: 71, start_time: 0.01, contact_time: 0.47, duration: 0.50, angle: "lurus" },
        { kick_number: 9, accuracy_points: 78, start_time: 0.04, contact_time: 0.43, duration: 0.46, angle: "lurus" },
        { kick_number: 10, accuracy_points: 62, start_time: 0, contact_time: 0.55, duration: 0.58, angle: "lurus" },
      ];

      // Kicks Sesi 3
      const kicksSesi3 = [
        { kick_number: 1, accuracy_points: 92, start_time: 0, contact_time: 0.28, duration: 0.31, angle: "lurus" },
        { kick_number: 2, accuracy_points: 95, start_time: 0.02, contact_time: 0.26, duration: 0.29, angle: "lurus" },
        { kick_number: 3, accuracy_points: 89, start_time: 0, contact_time: 0.30, duration: 0.33, angle: "lurus" },
        { kick_number: 4, accuracy_points: 94, start_time: 0.01, contact_time: 0.27, duration: 0.30, angle: "lurus" },
        { kick_number: 5, accuracy_points: 96, start_time: 0, contact_time: 0.25, duration: 0.28, angle: "lurus" },
        { kick_number: 6, accuracy_points: 91, start_time: 0.04, contact_time: 0.29, duration: 0.32, angle: "lurus" },
        { kick_number: 7, accuracy_points: 93, start_time: 0, contact_time: 0.27, duration: 0.30, angle: "lurus" },
        { kick_number: 8, accuracy_points: 90, start_time: 0.01, contact_time: 0.31, duration: 0.34, angle: "lurus" },
        { kick_number: 9, accuracy_points: 95, start_time: 0.03, contact_time: 0.26, duration: 0.29, angle: "lurus" },
        { kick_number: 10, accuracy_points: 89, start_time: 0, contact_time: 0.32, duration: 0.35, angle: "lurus" },
      ];

      // 2. Seed Test Sesi 1
      const testBagas1Id = "TEST-BAGAS001";
      await setDoc(doc(db, "tests", testBagas1Id), {
        id: testBagas1Id,
        athlete_id: bagasId,
        test_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
        avg_accuracy: 45.2,
        avg_speed: 2.4,
        performance_category: "RENDAH",
        kicks: kicksSesi1
      });

      // 3. Seed Test Sesi 2
      const testBagas2Id = "TEST-BAGAS002";
      await setDoc(doc(db, "tests", testBagas2Id), {
        id: testBagas2Id,
        athlete_id: bagasId,
        test_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        avg_accuracy: 71.5,
        avg_speed: 3.8,
        performance_category: "SEDANG",
        kicks: kicksSesi2
      });

      // 4. Seed Test Sesi 3
      const testBagas3Id = "TEST-BAGAS003";
      await setDoc(doc(db, "tests", testBagas3Id), {
        id: testBagas3Id,
        athlete_id: bagasId,
        test_date: new Date().toISOString(), // Now
        avg_accuracy: 92.4,
        avg_speed: 5.5,
        performance_category: "TINGGI",
        kicks: kicksSesi3
      });
      
      const athletesSnap = await getDocs(collection(db, "athletes"));
      const athletesList = athletesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      athletesList.sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setAthletes(athletesList);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorStatus(null);
    
    const withTimeout = <T,>(promise: Promise<T>, ms = 6000): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timeout load database. Mohon cek jaringan Anda atau muat ulang halaman."));
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

    const loadAthletes = async () => {
      const athletesPath = "athletes";
      try {
        const athletesSnap = await withTimeout(getDocs(collection(db, "athletes")));
        const athletesList = athletesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
        
        // Sort descending by created_at in memory
        athletesList.sort((a: any, b: any) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        if (active) {
          setAthletes(athletesList);
          
          if (isAthleteMode && athleteId) {
            const currentAthlete = athletesList.find((a: Athlete) => a.id === athleteId);
            if (currentAthlete) {
              setFormData({
                id: currentAthlete.id,
                name: currentAthlete.name,
                age: currentAthlete.age.toString(),
                gender: currentAthlete.gender,
                injuryType: currentAthlete.injury_type || '',
                bodyPart: currentAthlete.body_part || ''
              });
              setShowForm(true);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading athletes lists: ", err);
        if (active) {
          setErrorStatus(err.message || String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAthletes();
    return () => {
      active = false;
    };
  }, [isAthleteMode, athleteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Mohon masukkan nama atlet");

    const athleteDocPath = `athletes/${formData.id}`;
    try {
      const docRef = doc(db, "athletes", formData.id);
      await setDoc(docRef, {
        id: formData.id,
        name: formData.name,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        injury_type: formData.injuryType,
        body_part: formData.bodyPart,
        recovery_time: 0,
        created_at: new Date().toISOString()
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onNext(formData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, athleteDocPath);
    }
  };

  const handleDeleteAthlete = async (athlete: Athlete) => {
    setIsDeleting(true);
    const athletePath = `athletes/${athlete.id}`;
    try {
      // 1. Delete associated tests
      const testsQueryRef = query(collection(db, "tests"), where("athlete_id", "==", athlete.id));
      const querySnap = await getDocs(testsQueryRef);
      const deletePromises = querySnap.docs.map(docSnap => deleteDoc(doc(db, "tests", docSnap.id)));
      await Promise.all(deletePromises);

      // 2. Delete athlete doc
      await deleteDoc(doc(db, "athletes", athlete.id));

      // 3. Update local state
      setAthletes(prev => prev.filter(item => item.id !== athlete.id));
      setAthleteToDelete(null);
    } catch (err) {
      console.error("Gagal menghapus data atlet:", err);
      handleFirestoreError(err, OperationType.DELETE, athletePath);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectAthlete = (a: Athlete) => {
    const data = {
      id: a.id,
      name: a.name || '',
      age: (a.age ?? '').toString(),
      gender: a.gender || 'Laki-laki',
      injuryType: a.injury_type || '',
      bodyPart: a.body_part || ''
    };
    setFormData(data);
    onNext(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-900 leading-none uppercase title-glitch">
            {isAthleteMode ? "PROFIL " : "DATA "}
            <span className="text-upi-red">{isAthleteMode ? "ANDA" : "ATLET"}</span>
          </h2>
          <div className="flex items-center gap-3 mt-3 sm:mt-4">
            <div className="h-1 w-12 bg-upi-red"></div>
            <p className="text-xs sm:text-sm text-slate-500 font-bold sm:font-black uppercase tracking-widest">
              {isAthleteMode ? "Perbarui Informasi Identitas Diri Anda" : "Registrasi & Identitas Profile Atlet"}
            </p>
          </div>
        </div>
        {!showForm && !isAthleteMode && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="bg-slate-900 border border-slate-800 text-slate-100 font-black py-2.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex items-center gap-2 hover:bg-slate-850 disabled:opacity-50 transition-all text-[10px] sm:text-xs tracking-wider uppercase cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              {isSeeding ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "⚡"
              )}
              SUNTIK ATLET DEMO
            </button>
            <button 
              onClick={() => {
                setShowForm(true);
                setFormData({ 
                  id: `ATLET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, 
                  name: '',
                  age: '',
                  gender: 'Laki-laki',
                  injuryType: '',
                  bodyPart: '',
                  recoveryTime: ''
                });
              }}
              className="gold-button !py-2.5 sm:!py-4 !px-4 sm:!px-8 cursor-pointer flex-1 sm:flex-initial"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 hover:scale-115 transition-transform" /> TAMBAH BARU
            </button>
          </div>
        )}
      </div>

      {showForm ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5 sm:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-upi-red/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <InputGroup icon={<User />} label="Nama Lengkap" id="name" value={formData.name} onChange={(val: string) => setFormData({...formData, name: val})} placeholder="Masukkan nama..." />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup icon={<Calendar />} label="Umur" id="age" type="number" value={formData.age} onChange={(val: string) => setFormData({...formData, age: val})} placeholder="Tahun" />
                  <div className="space-y-2">
                    <label className="section-label">Jenis Kelamin</label>
                    <select 
                      className="form-input animate-fade-in"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <InputGroup icon={<Activity />} label="Jenis Cedera Pasca Latihan" id="injury" value={formData.injuryType} onChange={(val: string) => setFormData({...formData, injuryType: val})} placeholder="Contoh: ACL, Meniscus, Sprain..." />
                <InputGroup icon={<Ruler />} label="Bagian Tubuh" id="part" value={formData.bodyPart} onChange={(val: string) => setFormData({...formData, bodyPart: val})} placeholder="Contoh: Lutut Kanan..." />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {isAthleteMode ? (
                <div>
                  {saveSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-grass font-display font-bold text-xs uppercase tracking-wider"
                    >
                      <CheckCircle2 className="w-5 h-5 text-grass animate-bounce" /> Profil Berhasil Diperbarui!
                    </motion.div>
                  )}
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="secondary-button cursor-pointer"
                >
                  BATAL
                </button>
              )}
              
              <button 
                type="submit"
                className="action-button !px-12 ml-auto cursor-pointer"
              >
                <Save className="w-5 h-5" /> 
                {isAthleteMode ? "SIMPAN PERUBAHAN PROFIL" : "SIMPAN & LANJUTKAN"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-10 h-10 border-4 border-upi-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Memuat Daftar Atlet...</p>
            </div>
          ) : errorStatus ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <p className="text-red-500 font-bold uppercase text-xs">Gagal Memuat Data</p>
              <p className="text-slate-400 text-sm">{errorStatus}</p>
              <button onClick={() => window.location.reload()} className="action-button mx-auto">Coba Lagi</button>
            </div>
          ) : (
            <>
              {athletes.map((a, i) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => selectAthlete(a)}
                  className="premium-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:border-upi-red transition-all"
                >
                  <div className="flex items-center gap-4 sm:gap-6 w-full min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 flex items-center justify-center rounded-xl sm:rounded-2xl group-hover:bg-upi-red/10 transition-colors shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-upi-red transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-xl font-display font-black text-slate-900 leading-tight truncate">{a.name}</h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest truncate">{a.id} • {a.injury_type || "Tidak ada riwayat cedera"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-slate-50 sm:border-0 pt-3 sm:pt-0">
                    <span className="xl:hidden text-[9px] font-black text-slate-300 uppercase tracking-widest">PILIH ATLET</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAthleteToDelete(a);
                        }}
                        className="p-2.5 text-slate-400 hover:text-upi-red hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus Data Atlet"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <ChevronRight className="text-slate-200 group-hover:text-upi-red transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
              {athletes.length === 0 && (
                <div className="col-span-full py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                  <p className="text-slate-500 font-display font-medium uppercase tracking-wider text-xs">Belum Ada Data Atlet di Database</p>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">Mulai secara instan dengan memasang profil demo lengkap biomekanika cedera & hasil tes secara otomatis.</p>
                  <button
                    onClick={handleSeedDemo}
                    disabled={isSeeding || loading}
                    className="mx-auto bg-gradient-to-r from-upi-red to-red-600 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 text-xs tracking-widest uppercase cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "🚀"
                    )}
                    PASANG PROFIL DEMO ATLET
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {athleteToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-upi-red border border-red-100 mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">HAPUS DATA ATLET</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus data atlet <span className="font-extrabold text-slate-900">{athleteToDelete.name}</span>? 
                Seluruh data profil dan riwayat hasil tes akan dihapus secara permanen dari database.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                disabled={isDeleting}
                onClick={() => setAthleteToDelete(null)}
                className="flex-1 secondary-button !py-4 text-center cursor-pointer disabled:opacity-50"
              >
                BATAL
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteAthlete(athleteToDelete)}
                className="flex-1 bg-gradient-to-r from-upi-red to-red-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 text-xs tracking-wider uppercase cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "YA, HAPUS PERMANEN"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ icon, label, id, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="section-label" htmlFor={id}>{label}</label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-upi-red transition-colors">
        {icon}
      </div>
      <input 
        id={id}
        type={type}
        className="form-input !pl-14"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);
export { UserPlus };
