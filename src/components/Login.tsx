import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Activity, Sparkles, ChevronRight, Check, UserPlus, Heart, LogOut } from 'lucide-react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, OperationType, handleFirestoreError } from '../firebase';

interface LoginProps {
  onLoginSuccess: (user: { role: 'atlet' | 'pelatih'; athleteId?: string; athleteName?: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // States for Stage 2 (Role Choice & Registration)
  const [stage, setStage] = useState<'auth' | 'role' | 'register' | 'password'>('auth');
  const [selectedRole, setSelectedRole] = useState<'pelatih' | 'atlet' | null>(null);
  const [pelatihPassword, setPelatihPassword] = useState('');
  
  // Registration form inputs if Athlete isn't in DB yet
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Laki-laki');
  const [newInjury, setNewInjury] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('');
  const [newRecovery, setNewRecovery] = useState('');

  // Sync auth state if already logged in via Firebase Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setGoogleUser(user);
        setNewName(user.displayName || '');
        setStage('role');
      } else {
        setGoogleUser(null);
        setStage('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setGoogleUser(result.user);
        setNewName(result.user.displayName || '');
        setStage('role');
      }
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      // Friendly message
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Pop-up masuk diblokir oleh browser Anda. Mohon izinkan pop-up untuk situs ini.');
      } else {
        setErrorMsg('Gagal masuk dengan Google: ' + (err.message || String(err)));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectPelatih = () => {
    if (!googleUser) return;
    setPelatihPassword('');
    setErrorMsg('');
    setStage('password');
  };

  const handleVerifyPelatihPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pelatihPassword === 'pelatih123') {
      onLoginSuccess({
        role: 'pelatih',
        athleteName: googleUser?.displayName || 'Pelatih'
      });
    } else {
      setErrorMsg('Password Pelatih salah! Silakan coba lagi.');
    }
  };

  const selectAtlet = async () => {
    if (!googleUser) return;
    setLoading(true);
    setErrorMsg('');
    
    const athleteDocPath = `athletes/${googleUser.uid}`;
    try {
      const docRef = doc(db, "athletes", googleUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        onLoginSuccess({
          role: 'atlet',
          athleteId: googleUser.uid,
          athleteName: data.name || googleUser.displayName || 'Atlet'
        });
      } else {
        // Not registered yet, transition to register form
        setStage('register');
      }
    } catch (err: any) {
      setErrorMsg('Gagal memuat profil atlet: ' + (err.message || String(err)));
      handleFirestoreError(err, OperationType.GET, athleteDocPath);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAtlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    if (!newName.trim()) {
      setErrorMsg('Nama Lengkap tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const payload = {
      id: googleUser.uid,
      name: newName,
      age: parseInt(newAge) || 0,
      gender: newGender,
      injury_type: newInjury,
      body_part: newBodyPart,
      recovery_time: parseInt(newRecovery) || 0,
      created_at: new Date().toISOString()
    };

    const athleteDocPath = `athletes/${googleUser.uid}`;
    try {
      const docRef = doc(db, "athletes", googleUser.uid);
      await setDoc(docRef, payload);
      
      onLoginSuccess({
        role: 'atlet',
        athleteId: googleUser.uid,
        athleteName: newName
      });
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan profil atlet: ' + (err.message || String(err)));
      handleFirestoreError(err, OperationType.CREATE, athleteDocPath);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setGoogleUser(null);
      setStage('auth');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative">
      {/* Background blur decorative circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-upi-red/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-upi-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl p-5 sm:p-10 md:p-12 relative overflow-hidden"
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
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">Laboratorium Biomekanika & Analisis Performa Olahraga UPI</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-normal">
            {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === 'auth' && (
            <motion.div
              key="stage-auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 text-center"
            >
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm leading-relaxed text-left">
                <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-upi-red" /> Autentikasi Menggunakan Akun Google
                </p>
                Silakan masuk dengan akun Google Anda untuk melanjutkan penggunaan portal Silatmetrics. Data performa biomekanika, profil medis, dan riwayat pengujian cedera atlet akan secara otomatis tersimpan dan tersinkronisasi dengan aman.
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-slate-950 text-white hover:bg-slate-900 px-8 py-5 rounded-2xl font-display font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                {loading ? 'MENGHUBUNGKAN...' : 'MASUK DENGAN GOOGLE'}
              </button>
            </motion.div>
          )}

          {stage === 'role' && googleUser && (
            <motion.div
              key="stage-role"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-left">
                  {googleUser.photoURL ? (
                    <img src={googleUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-upi-red text-white flex items-center justify-center font-bold">
                      {googleUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 leading-none">Masuk Sebagai</h4>
                    <p className="text-sm font-black text-slate-800 truncate max-w-[220px]">{googleUser.displayName}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                  title="Ganti Akun"
                >
                  <LogOut className="w-3.5 h-3.5" /> Ganti Akun
                </button>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-display font-black text-slate-900 uppercase">Pilih Peran Anda</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Silakan pilih jenis portal yang ingin Anda akses</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {/* Pelatih Role Option */}
                <button
                  type="button"
                  onClick={selectPelatih}
                  disabled={loading}
                  className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white hover:border-upi-red hover:shadow-2xl hover:shadow-upi-red/5 transition-all flex flex-col items-center text-center gap-3 sm:gap-4 cursor-pointer group text-slate-800"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-2xl flex items-center justify-center text-upi-red group-hover:bg-upi-red group-hover:text-white transition-all border border-red-100">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-lg font-display font-black uppercase text-slate-800 group-hover:text-upi-red transition-colors">PELATIH / PENGUJI</h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed mt-2 uppercase font-semibold">
                      Analisis video, rekam detail biomekanika & kelola riwayat pemulihan tim atlet.
                    </p>
                  </div>
                </button>

                {/* Atlet Role Option */}
                <button
                  type="button"
                  onClick={selectAtlet}
                  disabled={loading}
                  className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white hover:border-upi-red hover:shadow-2xl hover:shadow-upi-red/5 transition-all flex flex-col items-center text-center gap-3 sm:gap-4 cursor-pointer group text-slate-800"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-upi-gold group-hover:bg-upi-red group-hover:text-white transition-all border border-amber-100">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-upi-red" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-lg font-display font-black uppercase text-slate-800 group-hover:text-upi-red transition-colors">ATLET</h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed mt-2 uppercase font-semibold">
                      Pantau perkembangan akurasi personal & statistik pemulihan biomekanis pasca cedera.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'password' && googleUser && (
            <motion.form
              key="stage-password"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={handleVerifyPelatihPassword}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-upi-red border-b border-slate-100 pb-3 mb-4">
                <Shield className="w-5 h-5 animate-pulse" />
                <h4 className="font-display font-black text-xs uppercase tracking-widest text-[#990000]">Verifikasi Akses Khusus Pelatih</h4>
              </div>

              <div className="space-y-2">
                <label className="section-label">Password Pelatih</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password pelatih..."
                  className="form-input text-sm"
                  value={pelatihPassword}
                  onChange={(e) => setPelatihPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setStage('role'); setErrorMsg(''); }}
                  className="secondary-button !py-3 !px-6 text-sm flex-none uppercase tracking-widest font-black"
                >
                  KEMBALI
                </button>
                <button
                  type="submit"
                  className="action-button flex-grow !py-3 font-display font-black uppercase text-xs tracking-widest"
                >
                  VERIFIKASI & MASUK <Check className="w-5 h-5 ml-1" />
                </button>
              </div>
            </motion.form>
          )}

          {stage === 'register' && googleUser && (
            <motion.form
              key="stage-register"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={handleRegisterAtlet}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-upi-red border-b border-slate-100 pb-3 mb-4">
                <UserPlus className="w-5 h-5 animate-pulse" />
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
                      required
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

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setStage('role'); setErrorMsg(''); }}
                  className="secondary-button !py-3 !px-6 text-sm flex-none uppercase tracking-widest font-black"
                >
                  KEMBALI
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="action-button flex-grow !py-3 font-display font-black uppercase text-xs tracking-widest"
                >
                  {loading ? 'MEMPROSES...' : 'SIMPAN & LOGIN SEBAGAI ATLET'} <Check className="w-5 h-5 ml-1" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
