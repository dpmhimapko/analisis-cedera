import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Ruler, Activity, Clock, Save, Plus, ChevronRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
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
    bodyPart: '',
    recoveryTime: ''
  });
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showForm, setShowForm] = useState(!!isAthleteMode);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    
    const loadAthletes = async () => {
      const athletesPath = "athletes";
      try {
        const athletesSnap = await getDocs(collection(db, "athletes"));
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
                bodyPart: currentAthlete.body_part || '',
                recoveryTime: currentAthlete.recovery_time?.toString() || ''
              });
              setShowForm(true);
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, athletesPath);
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
        recovery_time: parseInt(formData.recoveryTime) || 0,
        created_at: new Date().toISOString()
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onNext(formData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, athleteDocPath);
    }
  };

  const selectAthlete = (a: Athlete) => {
    const data = {
      id: a.id,
      name: a.name || '',
      age: (a.age ?? '').toString(),
      gender: a.gender || 'Laki-laki',
      injuryType: a.injury_type || '',
      bodyPart: a.body_part || '',
      recoveryTime: (a.recovery_time ?? '').toString()
    };
    setFormData(data);
    onNext(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-6xl font-display font-black tracking-tighter text-slate-900 leading-none uppercase title-glitch">
            {isAthleteMode ? "PROFIL " : "DATA "}
            <span className="text-upi-red">{isAthleteMode ? "ANDA" : "ATLET"}</span>
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-1 w-12 bg-upi-red"></div>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest">
              {isAthleteMode ? "Perbarui Informasi Identitas Diri Anda" : "Registrasi & Identitas Profile Atlet"}
            </p>
          </div>
        </div>
        {!showForm && !isAthleteMode && (
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
            className="gold-button !py-4 !px-8 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" /> TAMBAH BARU
          </button>
        )}
      </div>

      {showForm ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-10 relative overflow-hidden"
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
                <InputGroup icon={<Clock />} label="Target Masa Pemulihan (Minggu)" id="recovery" type="number" value={formData.recoveryTime} onChange={(val: string) => setFormData({...formData, recoveryTime: val})} placeholder="Contoh: 12" />
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
          {athletes.map((a, i) => (
            <motion.div 
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => selectAthlete(a)}
              className="premium-card p-6 flex items-center justify-between group cursor-pointer hover:border-upi-red transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl group-hover:bg-upi-red/10 transition-colors">
                  <User className="text-slate-400 group-hover:text-upi-red transition-colors" />
                </div>
                <div>
                  <h4 className="text-xl font-display font-black text-slate-900 leading-tight">{a.name}</h4>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{a.id} • {a.injury_type || "Tidak ada riwayat cedera"}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-upi-red transition-colors" />
            </motion.div>
          ))}
          {athletes.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400 font-medium">Belum ada data atlet. Silakan tambah data baru ☝️</p>
            </div>
          )}
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
