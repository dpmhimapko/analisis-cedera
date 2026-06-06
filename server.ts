import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read configuration from firebase-applet-config.json safely
let firebaseConfig: any;
try {
  const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
  const configText = fs.readFileSync(firebaseConfigPath, "utf8");
  firebaseConfig = JSON.parse(configText);
  console.log("Firebase config loaded successfully for project:", firebaseConfig.projectId);
} catch (err) {
  console.error("Critical: Gagal membaca firebase-applet-config.json", err);
  process.exit(1);
}

// Initialize Firebase JS SDK Server-side
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Seed Data helper for Firestore
async function seedFirestore() {
  try {
    const athletesSnap = await getDocs(collection(firestoreDb, "athletes"));
    if (athletesSnap.empty) {
      console.log("Firestore collection 'athletes' is empty. Seeding default data...");
      
      const asepId = "ATLET-ASEP";
      const sitiId = "ATLET-SITI";

      await setDoc(doc(firestoreDb, "athletes", asepId), {
        id: asepId,
        name: "Asep Sunandar",
        age: 24,
        gender: "Laki-laki",
        injury_type: "ACL",
        body_part: "Lutut Kanan",
        recovery_time: 12,
        created_at: new Date().toISOString()
      });

      await setDoc(doc(firestoreDb, "athletes", sitiId), {
        id: sitiId,
        name: "Siti Aminah",
        age: 21,
        gender: "Perempuan",
        injury_type: "Meniscus",
        body_part: "Pergelangan Kaki",
        recovery_time: 8,
        created_at: new Date().toISOString()
      });

      // Sample kicks
      const sampleKicksAsep = Array.from({ length: 10 }, (_, i) => ({
        kick_number: i + 1,
        accuracy_points: 80 + Math.floor(Math.random() * 20),
        start_time: 0,
        contact_time: 0.3,
        duration: 0.3,
        angle: "samping"
      }));

      const sampleKicksSiti = Array.from({ length: 10 }, (_, i) => ({
        kick_number: i + 1,
        accuracy_points: 50 + Math.floor(Math.random() * 30),
        start_time: 0,
        contact_time: 0.4,
        duration: 0.4,
        angle: "samping"
      }));

      const testAsepId = "TEST-ASEP001";
      await setDoc(doc(firestoreDb, "tests", testAsepId), {
        id: testAsepId,
        athlete_id: asepId,
        test_date: new Date().toISOString(),
        avg_accuracy: 85.5,
        avg_speed: 5.2,
        performance_category: "TINGGI",
        kicks: sampleKicksAsep
      });

      const testSitiId = "TEST-SITI001";
      await setDoc(doc(firestoreDb, "tests", testSitiId), {
        id: testSitiId,
        athlete_id: sitiId,
        test_date: new Date().toISOString(),
        avg_accuracy: 62.0,
        avg_speed: 3.8,
        performance_category: "SEDANG",
        kicks: sampleKicksSiti
      });

      console.log("Seeded 2 athletes and tests into Firestore successfully.");
    } else {
      console.log("Firestore database already has seeded profiles.");
    }
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}

// Invoke seed asynchronously on launch
seedFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes

  // 1. POST /api/athletes
  app.post("/api/athletes", async (req, res) => {
    const { id, name, age, gender, injury_type, body_part, recovery_time } = req.body;
    try {
      const athleteRef = doc(firestoreDb, "athletes", String(id));
      await setDoc(athleteRef, {
        id: String(id),
        name: String(name || ""),
        age: Number(age) || 0,
        gender: String(gender || "Laki-laki"),
        injury_type: String(injury_type || ""),
        body_part: String(body_part || ""),
        recovery_time: Number(recovery_time) || 0,
        created_at: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true });
    } catch (err) {
      console.error("Error inserting athlete:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 2. GET /api/athletes
  app.get("/api/athletes", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(firestoreDb, "athletes"));
      const athletes = snapshot.docs.map(doc => doc.data());
      
      // Sort desc by created_at in memory
      athletes.sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      res.json(athletes);
    } catch (err) {
      console.error("Error loading athletes:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 3. POST /api/tests
  app.post("/api/tests", async (req, res) => {
    const { athlete_id, avg_accuracy, avg_speed, performance_category, kicks } = req.body;
    try {
      // Generate unique test ID
      const testId = `TEST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const testRef = doc(firestoreDb, "tests", testId);

      await setDoc(testRef, {
        id: testId,
        athlete_id: String(athlete_id || ""),
        test_date: new Date().toISOString(),
        avg_accuracy: Number(avg_accuracy) || 0,
        avg_speed: Number(avg_speed) || 0,
        performance_category: String(performance_category || "RENDAH"),
        kicks: Array.isArray(kicks) ? kicks : []
      });

      res.json({ success: true, testId });
    } catch (err) {
      console.error("Error inserting test sessions:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 4. GET /api/dashboard-stats
  app.get("/api/dashboard-stats", async (req, res) => {
    const { athlete_id } = req.query;
    try {
      if (athlete_id) {
        const idStr = String(athlete_id);

        const athletesSnap = await getDoc(doc(firestoreDb, "athletes", idStr));
        const athleteProfile = athletesSnap.exists() ? athletesSnap.data() : null;

        const testsSnap = await getDocs(collection(firestoreDb, "tests"));
        const allTests = testsSnap.docs.map(doc => doc.data() as any);
        const athleteTests = allTests.filter(t => t.athlete_id === idStr);

        const totalTests = athleteTests.length;
        const totalAccuracySum = athleteTests.reduce((acc, t) => acc + (t.avg_accuracy || 0), 0);
        const totalSpeedSum = athleteTests.reduce((acc, t) => acc + (t.avg_speed || 0), 0);

        const avgAccuracy = totalTests > 0 ? (totalAccuracySum / totalTests) : 0;
        const avgSpeed = totalTests > 0 ? (totalSpeedSum / totalTests) : 0;

        // Grouping distribution
        const distMap: Record<string, number> = {};
        athleteTests.forEach(t => {
          const cat = t.performance_category || "RENDAH";
          distMap[cat] = (distMap[cat] || 0) + 1;
        });

        const performanceDist = Object.keys(distMap).map(key => ({
          performance_category: key,
          count: distMap[key]
        }));

        // Recent limit 10
        const recentTests = athleteTests.map(t => ({
          ...t,
          athlete_name: athleteProfile ? athleteProfile.name : "Atlet"
        }));
        recentTests.sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime());
        const recentLimit = recentTests.slice(0, 10);

        const stats = {
          totalAthletes: 1,
          totalTests,
          avgAccuracy,
          avgSpeed,
          performanceDist,
          recentTests: recentLimit,
          athleteProfile
        };

        res.json(stats);
      } else {
        // Global / Coach mode stats
        const athletesSnap = await getDocs(collection(firestoreDb, "athletes"));
        const allAthletes = athletesSnap.docs.map(doc => doc.data() as any);
        const athletesMap = new Map();
        allAthletes.forEach(ath => {
          athletesMap.set(ath.id, ath);
        });

        const testsSnap = await getDocs(collection(firestoreDb, "tests"));
        const allTests = testsSnap.docs.map(doc => doc.data() as any);

        const totalAthletes = allAthletes.length;
        const totalTests = allTests.length;

        const totalAccuracySum = allTests.reduce((acc, t) => acc + (t.avg_accuracy || 0), 0);
        const totalSpeedSum = allTests.reduce((acc, t) => acc + (t.avg_speed || 0), 0);

        const avgAccuracy = totalTests > 0 ? (totalAccuracySum / totalTests) : 0;
        const avgSpeed = totalTests > 0 ? (totalSpeedSum / totalTests) : 0;

        // Grouping distribution
        const distMap: Record<string, number> = {};
        allTests.forEach(t => {
          const cat = t.performance_category || "RENDAH";
          distMap[cat] = (distMap[cat] || 0) + 1;
        });

        const performanceDist = Object.keys(distMap).map(key => ({
          performance_category: key,
          count: distMap[key]
        }));

        // Recent overall limit 5
        const recentTests = allTests.map(t => {
          const ath = athletesMap.get(t.athlete_id);
          return {
            ...t,
            athlete_name: ath ? ath.name : "Unknown"
          };
        });
        recentTests.sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime());
        const recentLimit = recentTests.slice(0, 5);

        const stats = {
          totalAthletes,
          totalTests,
          avgAccuracy,
          avgSpeed,
          performanceDist,
          recentTests: recentLimit
        };

        res.json(stats);
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 5. GET /api/history
  app.get("/api/history", async (req, res) => {
    try {
      const athletesSnap = await getDocs(collection(firestoreDb, "athletes"));
      const athletesMap = new Map();
      athletesSnap.docs.forEach(doc => {
        const data = doc.data();
        athletesMap.set(data.id, data);
      });

      const testsSnap = await getDocs(collection(firestoreDb, "tests"));
      const tests = testsSnap.docs.map(doc => {
        const t = doc.data() as any;
        const ath = athletesMap.get(t.athlete_id) || {};
        return {
          ...t,
          athlete_name: ath.name || "Unknown",
          injury_type: ath.injury_type || "",
          body_part: ath.body_part || ""
        } as any;
      });

      tests.sort((a, b) => {
        return new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime();
      });

      res.json(tests);
    } catch (err) {
      console.error("History loading error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 6. GET /api/test/:id
  app.get("/api/test/:id", async (req, res) => {
    try {
      const testId = String(req.params.id);
      const testSnap = await getDoc(doc(firestoreDb, "tests", testId));
      if (!testSnap.exists()) {
        return res.status(404).json({ error: "Sesi tes tidak ditemukan." });
      }

      const testData = testSnap.data() as any;
      const athleteSnap = await getDoc(doc(firestoreDb, "athletes", String(testData.athlete_id)));
      const athlete = athleteSnap.exists() ? athleteSnap.data() : {};

      // Combined test profile
      const combinedTest = {
        ...testData,
        ...athlete,
        id: testData.id // Maintain test id
      };

      res.json({
        test: combinedTest,
        kicks: testData.kicks || []
      });
    } catch (err) {
      console.error("Single test loading error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

