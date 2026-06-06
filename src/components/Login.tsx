import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Key, Activity, Sparkles, ChevronRight, Check, UserPlus, Heart } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: string;
  injury_type: string;
  body_part: string;
  recovery_time: number;
}

interface LoginProps {
  onLoginSuccess: (user: { role: 'atlet' | 'pelatih'; athleteId?: string; athleteName?: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<'pelatih' | 'atlet'>('pelatih');
  const [passcode, setPasscode] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // New Athlete Registration Form inside Login
  const [registerNew, setRegisterNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Laki-laki');
  const [newInjury, setNewInjury] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('');
  const [newRecovery, setNewRecovery] = useState('');

  useEffect(() => {
    fetch('/api/athletes')
      .then(res => res.json())
      .then(data => {
        setAthletes(Array.isArray(data) ? data : []);
        if (data && data.length > 0) {
          setSelectedAthleteId(data[0].id);
        }
      })
      .catch(err => console.error("Error fetching athletes on login:", err));
  }, []);

  const handlePelatihSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'pelatih123') {
      setErrorMsg('');
      onLoginSuccess({ role: 'pelatih' });
    } else {
      setErrorMsg('Autentikasi Gagal! PIN Pelatih salah. Gunakan PIN: pelatih123');
    }
  };

  const handleAtletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) {
      setErrorMsg('Silakan pilih profil atlet atau registrasi profil baru.');
      return;
    }
    const athlete = athletes.find(a => a.id === selectedAthleteId);
    if (athlete) {
      setErrorMsg('');
      onLoginSuccess({ role: 'atlet', athleteId: athlete.id, athleteName: athlete.name });
    }
  };

  const handleRegisterAtlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Nama Lengkap tidak boleh kosong.');
      return;
    }

    const newId = `ATLET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const payload = {
      id: newId,
      name: newName,
      age: parseInt(newAge) || 0,
      gender: newGender,
      injury_type: newInjury,
      body_part: newBodyPart,
      recovery_time: parseInt(newRecovery) || 0
    };

    try {
      const response = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setErrorMsg('');
        // Log in as this newly created athlete!
        onLoginSuccess({ role: 'atlet', athleteId: newId, athleteName: newName });
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan identitas atlet.');
      }
    } catch (err) {
      setErrorMsg('Terdapat kendala jaringan.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 relative">
      {/* Background blur decorative circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-upi-red/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-upi-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 md:p-12 relative overflow-hidden"
      >
        {/* Aesthetic design accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-upi-red via-upi-gold to-upi-red"></div>

        {/* Brand / Logo */}
        <div className="text-center space-y-3 mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-upi-red to-red-800 rounded-2xl flex items-center justify-center shadow-lg mx-auto border border-white/20">
            <Activity className="w-8 h-8 text-upi-gold animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-black tracking-tight text-slate-900 leading-none uppercase">
              SILATMETRICS <span className="text-upi-red">PORTAL</span>
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2">Laboratorium Biomekanika & AI UPI</p>
          </div>
        </div>

        {/* Role Select Tabs */}
        <div className="grid grid-cols-2 gap-4 mb-10 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
          <button
            type="button"
            onClick={() => { setRole('pelatih'); setErrorMsg(''); setRegisterNew(false); }}
            className={`py-4 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              role === 'pelatih' 
                ? 'bg-upi-red text-white shadow-xl shadow-upi-red/15' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" /> Pelatih
          </button>
          <button
            type="button"
            onClick={() => { setRole('atlet'); setErrorMsg(''); }}
            className={`py-4 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              role === 'atlet' 
                ? 'bg-upi-red text-white shadow-xl shadow-upi-red/15' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Atlet
          </button>
        </div>

        {/* Main Forms with Switchable Views */}
        <AnimatePresence mode="wait">
          {role === 'pelatih' ? (
            <motion.form 
              key="pelatih-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handlePelatihSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="section-label" htmlFor="pin">PIN AKSES PELATIH</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    id="pin"
                    type="password"
                    required
                    placeholder="Masukkan Sandi Akses Pelatih..."
                    className="form-input !pl-14"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-upi-gold/5 rounded-2xl border border-upi-gold/10 flex gap-3 text-xs text-upi-red leading-relaxed">
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-upi-red/80 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider">Akses Penguji/Pelatih:</span> Masukkan PIN <code className="font-mono font-bold bg-upi-gold/20 px-1.5 py-0.5 rounded">pelatih123</code> untuk memuat keseluruhan fitur pengujuan video AI, riwayat lengkap serta modifikasi tim.
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-normal">
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="action-button w-full">
                MASUK SEBAGAI PELATIH <ChevronRight className="w-5 h-5" />
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="atlet-wrapper"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              {!registerNew ? (
                <form onSubmit={handleAtletSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="section-label">PILIH PROFIL ATLET ANDA</label>
                    
                    {athletes.length > 0 ? (
                      <select
                        className="form-input"
                        value={selectedAthleteId}
                        onChange={(e) => setSelectedAthleteId(e.target.value)}
                      >
                        {athletes.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.id}) - {a.injury_type || "No injury record"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-400">
                        Belum ada profil atlet terdaftar di database. Silakan klik tombol di bawah untuk membuat profil atlet baru.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => { setRegisterNew(true); setErrorMsg(''); }}
                      className="text-upi-red font-black tracking-wider uppercase hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4 text-upi-red" /> REGISTRASI PROFIL ATLET BARU
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-normal">
                      {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="action-button w-full"
                    disabled={athletes.length === 0}
                  >
                    MASUK SEBAGAI ATLET <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterAtlet} className="space-y-6">
                  <div className="flex items-center gap-2 text-upi-red border-b border-slate-100 pb-3 mb-4">
                    <UserPlus className="w-5 h-5" />
                    <h4 className="font-display font-black text-xs uppercase tracking-widest">Identitas Profil Baru Atlet</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="section-label">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Prasetyo"
                        className="form-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="section-label">Umur</label>
                        <input
                          type="number"
                          placeholder="Tahun"
                          className="form-input"
                          value={newAge}
                          onChange={(e) => setNewAge(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="section-label">Kelamin</label>
                        <select
                          className="form-input"
                          value={newGender}
                          onChange={(e) => setNewGender(e.target.value)}
                        >
                          <option>Laki-laki</option>
                          <option>Perempuan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="section-label">Jenis Cedera (Optional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: ACL / Sprain"
                        className="form-input"
                        value={newInjury}
                        onChange={(e) => setNewInjury(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="section-label">Bagian Tubuh</label>
                        <input
                          type="text"
                          placeholder="Lutut Kiri"
                          className="form-input"
                          value={newBodyPart}
                          onChange={(e) => setNewBodyPart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="section-label">Pemulihan (Wk)</label>
                        <input
                          type="number"
                          placeholder="12"
                          className="form-input"
                          value={newRecovery}
                          onChange={(e) => setNewRecovery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-normal">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => { setRegisterNew(false); setErrorMsg(''); }}
                      className="secondary-button !py-3 !px-6 text-sm"
                    >
                      KEMBALI
                    </button>
                    <button
                      type="submit"
                      className="action-button flex-grow !py-3"
                    >
                      SIMPAN & LOGIN <Check className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
