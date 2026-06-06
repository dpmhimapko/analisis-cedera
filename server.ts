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
async function seedDemoAthlete(dbInstance: any) {
  const bagasId = "ATLET-BAGAS";
  try {
    console.log("Seeding premium demo athlete (Bagas Prakoso) with historical test results...");
    
    await setDoc(doc(dbInstance, "athletes", bagasId), {
      id: bagasId,
      name: "Bagas Prakoso",
      age: 23,
      gender: "Laki-laki",
      injury_type: "Putus Tendon Achilles (Rupture)",
      body_part: "Tungkai Kiri (Achilles Kiri)",
      recovery_time: 16,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    });

    // Sample kicks for Bagas Sesi 1 (Week 4 of recovery) - Low recovery
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

    // Sesi 2 (Week 10 of recovery) - Intermediate
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

    // Sesi 3 (Week 14 of recovery) - High / Near fully recovered
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

    const testBagas1Id = "TEST-BAGAS001";
    await setDoc(doc(dbInstance, "tests", testBagas1Id), {
      id: testBagas1Id,
      athlete_id: bagasId,
      test_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
      avg_accuracy: 45.2,
      avg_speed: 2.4,
      performance_category: "RENDAH",
      kicks: kicksSesi1
    });

    const testBagas2Id = "TEST-BAGAS002";
    await setDoc(doc(dbInstance, "tests", testBagas2Id), {
      id: testBagas2Id,
      athlete_id: bagasId,
      test_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      avg_accuracy: 71.5,
      avg_speed: 3.8,
      performance_category: "SEDANG",
      kicks: kicksSesi2
    });

    const testBagas3Id = "TEST-BAGAS003";
    await setDoc(doc(dbInstance, "tests", testBagas3Id), {
      id: testBagas3Id,
      athlete_id: bagasId,
      test_date: new Date().toISOString(), // Now
      avg_accuracy: 92.4,
      avg_speed: 5.5,
      performance_category: "TINGGI",
      kicks: kicksSesi3
    });

    console.log("Seeded Bagas Prakoso demo successfully in Firestore.");
    return true;
  } catch (error) {
    console.error("Error seeding Bagas Prakoso demo:", error);
    throw error;
  }
}

async function seedFirestore() {
  try {
    const athletesSnap = await getDocs(collection(firestoreDb, "athletes"));
    
    // Always seed Bagas if he doesn't exist to ensure our demo dashboard shines!
    const bagasId = "ATLET-BAGAS";
    const bagasDoc = await getDoc(doc(firestoreDb, "athletes", bagasId));
    if (!bagasDoc.exists()) {
      await seedDemoAthlete(firestoreDb);
    }

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
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      });

      await setDoc(doc(firestoreDb, "athletes", sitiId), {
        id: sitiId,
        name: "Siti Aminah",
        age: 21,
        gender: "Perempuan",
        injury_type: "Meniscus",
        body_part: "Pergelangan Kaki",
        recovery_time: 8,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
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
        test_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        avg_accuracy: 85.5,
        avg_speed: 5.2,
        performance_category: "TINGGI",
        kicks: sampleKicksAsep
      });

      const testSitiId = "TEST-SITI001";
      await setDoc(doc(firestoreDb, "tests", testSitiId), {
        id: testSitiId,
        athlete_id: sitiId,
        test_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        avg_accuracy: 62.0,
        avg_speed: 3.8,
        performance_category: "SEDANG",
        kicks: sampleKicksSiti
      });

      console.log("Seeded all fallback athletes and tests into Firestore successfully.");
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
  
  // 1b. POST /api/seed-demo
  app.post("/api/seed-demo", async (req, res) => {
    try {
      await seedDemoAthlete(firestoreDb);
      res.json({ success: true, message: "Demo athlete Bagas Prakoso and tests seeded successfully!" });
    } catch (err) {
      console.error("Error forced seeding demo athlete:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

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

