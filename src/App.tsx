import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, User, Upload, Activity, History as HistoryIcon, FileText, Maximize, Minimize, LogOut, Shield } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';

import { Dashboard } from './components/Dashboard';
import { AthleteData } from './components/AthleteData';
import { Assessment } from './components/Assessment';
import { ResultReport } from './components/ResultReport';
import { AthleteHistory } from './components/AthleteHistory';
import { Login } from './components/Login';

type Page = 'dashboard' | 'athlete-data' | 'assessment' | 'results' | 'history' | 'report';

interface UserRole {
  role: 'atlet' | 'pelatih';
  athleteId?: string;
  athleteName?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [athleteData, setAthleteData] = useState<any>(null);
  const [testResults, setTestResults] = useState<{ testId: string, kicks: any[] } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load user role from session
  const [user, setUser] = useState<UserRole | null>(() => {
    try {
      const stored = localStorage.getItem('silatmetrics_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Keeps local state updated if auth matches
        const stored = localStorage.getItem('silatmetrics_auth');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } else {
        // User logged out from firebase, clear local Role state to stay in sync
        setUser(null);
        localStorage.removeItem('silatmetrics_auth');
      }
      setIsAuthLoading(false);
    });

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      unsubscribe();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-[0.03]"></div>
        <div className="text-center space-y-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-upi-red to-red-800 rounded-2xl flex items-center justify-center shadow-lg mx-auto border border-white/20 animate-pulse">
            <Activity className="w-8 h-8 text-upi-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 uppercase">
              SILATMETRICS
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-bold">Menyiapkan Sistem Performa...</p>
          </div>
          <div className="w-8 h-8 border-4 border-upi-red border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  const handleAthleteNext = (data: any) => {
    setAthleteData(data);
    if (user?.role === 'atlet') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('assessment');
    }
  };

  const handleAssessmentComplete = (testId: string, kicks: any[]) => {
    setTestResults({ testId, kicks });
    setCurrentPage('report');
  };

  const handleViewReport = async (testId: string) => {
    const singleTestPath = `tests/${testId}`;
    try {
      const testSnap = await getDoc(doc(db, "tests", testId));
      if (testSnap.exists()) {
        const testData = testSnap.data() as any;
        const athleteSnap = await getDoc(doc(db, "athletes", String(testData.athlete_id)));
        const athlete = athleteSnap.exists() ? athleteSnap.data() : {};

        setAthleteData({
          id: testData.athlete_id,
          name: athlete.name || "Unknown",
          age: athlete.age || 0,
          gender: athlete.gender || "Laki-laki",
          injuryType: athlete.injury_type || "",
          bodyPart: athlete.body_part || "",
          recoveryTime: athlete.recovery_time || 0
        });

        setTestResults({ testId, kicks: testData.kicks || [] });
        setCurrentPage('report');
      } else {
        console.error("Sesi tes tidak ditemukan di Firestore");
      }
    } catch (err) {
      console.error("Error viewing report:", err);
      handleFirestoreError(err, OperationType.GET, singleTestPath);
    }
  };

  const handleLoginSuccess = (userData: UserRole) => {
    setUser(userData);
    localStorage.setItem('silatmetrics_auth', JSON.stringify(userData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('silatmetrics_auth');
    setAthleteData(null);
    setTestResults(null);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-upi-red/5 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 sticky top-0 z-50 shadow-sm overflow-hidden animate-fade-in">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="cursor-pointer group flex items-center gap-4" 
            onClick={() => user && setCurrentPage('dashboard')}
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:scale-110 transition-transform overflow-hidden border border-slate-100">
              <img 
                src="https://lh3.googleusercontent.com/d/150kr_WKX4Ha1bV6x8hnAJhB7X02PZKhk" 
                alt="UPI Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 leading-none group-hover:text-upi-red transition-colors title-glitch uppercase font-black">
                SILAT<span className="text-upi-red group-hover:text-slate-900 transition-colors">METRICS</span>
              </h1>
            </div>
          </motion.div>

          {user && (
            <nav className="hidden xl:flex items-center gap-2">
              <NavButton active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
              <NavButton active={currentPage === 'athlete-data'} onClick={() => setCurrentPage('athlete-data')} icon={<User className="w-4 h-4" />} label={user.role === 'atlet' ? "Profil Saya" : "Data Atlet"} />
              
              {user.role === 'pelatih' && (
                <>
                  <NavButton active={currentPage === 'assessment'} onClick={() => {
                    // For coach, ensure athleteData is populated first, or let them pick of athletes list
                    setCurrentPage('assessment');
                  }} icon={<Upload className="w-4 h-4" />} label="Upload Video" />
                  <NavButton active={currentPage === 'history'} onClick={() => setCurrentPage('history')} icon={<HistoryIcon className="w-4 h-4" />} label="Riwayat" />
                </>
              )}

              {testResults && (
                <NavButton active={currentPage === 'report'} onClick={() => setCurrentPage('report')} icon={<FileText className="w-4 h-4" />} label="Laporan" />
              )}
              
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              
              {/* User Identifier Tag */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 mr-2">
                {user.role === 'pelatih' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-upi-red" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Pelatih</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-grass animate-ping"></div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest max-w-[120px] truncate">
                      {user.athleteName}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2 font-display text-[10px] uppercase tracking-widest"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-500 hover:text-white hover:bg-upi-red transition-all flex items-center gap-2 font-display text-[10px] uppercase tracking-widest font-black"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </nav>
          )}
          
          {/* Mobile indicator / Quick access */}
          {user && (
            <div className="xl:hidden flex items-center gap-4">
              <div className="text-[10px] font-black text-upi-red uppercase tracking-widest border border-upi-red/20 px-3 py-1 rounded-full">
                {user.role === 'atlet' ? 'Atlet' : 'Pelatih'}: {currentPage.replace('-', ' ')}
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 bg-slate-50 rounded-xl text-red-500 border border-slate-100 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-6 flex-grow relative z-10">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div key="login" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <Login onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                 <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Dashboard 
                      athleteId={user.role === 'atlet' ? user.athleteId : undefined} 
                      onViewReport={handleViewReport} 
                    />
                 </motion.div>
              )}
              {currentPage === 'athlete-data' && (
                 <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <AthleteData 
                      savedData={athleteData} 
                      onNext={handleAthleteNext} 
                      athleteId={user.role === 'atlet' ? user.athleteId : undefined}
                      isAthleteMode={user.role === 'atlet'}
                    />
                 </motion.div>
              )}
              {currentPage === 'assessment' && user.role === 'pelatih' && (
                 <motion.div key="assess" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {!athleteData ? (
                        <div className="p-20 text-center space-y-6 premium-card">
                             <User className="w-16 h-16 mx-auto text-slate-200" />
                             <p className="text-xl font-bold text-slate-400">Silakan pilih atau isi Data Atlet terlebih dahulu.</p>
                             <button onClick={() => setCurrentPage('athlete-data')} className="action-button">KE DATA ATLET</button>
                        </div>
                    ) : (
                        <Assessment athleteData={athleteData} onComplete={handleAssessmentComplete} />
                    )}
                 </motion.div>
              )}
              {currentPage === 'report' && testResults && (
                <motion.div key="report" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                    <ResultReport 
                        testId={testResults.testId} 
                        athleteData={athleteData} 
                        kicks={testResults.kicks} 
                        onReset={() => setCurrentPage('dashboard')} 
                    />
                </motion.div>
              )}
              {currentPage === 'history' && user.role === 'pelatih' && (
                 <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <AthleteHistory onViewReport={handleViewReport} />
                 </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 border-t border-white/5 py-12 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-[0.05]"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <Activity className="w-6 h-6 text-upi-red" />
             </div>
             <div>
                <p className="text-white font-display font-black tracking-widest text-sm uppercase">SILATMETRICS v3.0</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest">Laboratorium Biomekanika & AI UPI</p>
             </div>
          </div>
          <div className="flex gap-6">
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Privacy Policy</span>
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Terms of Use</span>
             <span className="text-upi-gold text-[10px] font-black uppercase tracking-widest">© 2026 Admin Panel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-xl flex items-center gap-3 font-display text-xs uppercase tracking-widest transition-all ${
      active ? 'bg-upi-red text-white shadow-xl shadow-upi-red/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);
export { NavButton };
