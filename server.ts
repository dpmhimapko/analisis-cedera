import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("silatkick.db");

// Initialize Database
try {
  // Check if sessions table has the new columns
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as any[];
  const hasNewColumn = tableInfo.some(col => col.name === 'knee_kuda');
  
  if (tableInfo.length > 0 && !hasNewColumn) {
    console.log("Old schema detected, dropping tables...");
    db.exec("DROP TABLE IF EXISTS time_series");
    db.exec("DROP TABLE IF EXISTS sessions");
    db.exec("DROP TABLE IF EXISTS athletes");
  }
} catch (e) {
  console.error("Error checking schema:", e);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS athletes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    injury_type TEXT,
    body_part TEXT,
    recovery_time INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id TEXT,
    test_date TEXT,
    avg_accuracy REAL,
    avg_speed REAL,
    performance_category TEXT,
    FOREIGN KEY(athlete_id) REFERENCES athletes(id)
  );

  CREATE TABLE IF NOT EXISTS kicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER,
    kick_number INTEGER,
    accuracy_points INTEGER,
    start_time REAL,
    contact_time REAL,
    duration REAL,
    angle TEXT,
    FOREIGN KEY(test_id) REFERENCES tests(id)
  );
`);

// Seed Data if empty
const athleteCount = (db.prepare("SELECT COUNT(*) as count FROM athletes").get() as any).count;
if (athleteCount === 0) {
  const insertAthlete = db.prepare(`
    INSERT INTO athletes (id, name, age, gender, injury_type, body_part, recovery_time, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertAthlete.run("ATLET-ASEP", "Asep Sunandar", 24, "Laki-laki", "ACL", "Lutut Kanan", 12, new Date().toISOString());
  insertAthlete.run("ATLET-SITI", "Siti Aminah", 21, "Perempuan", "Meniscus", "Pergelangan Kaki", 8, new Date().toISOString());

  const insertTest = db.prepare(`
    INSERT INTO tests (athlete_id, test_date, avg_accuracy, avg_speed, performance_category)
    VALUES (?, ?, ?, ?, ?)
  `);

  const t1 = insertTest.run("ATLET-ASEP", new Date().toISOString(), 85.5, 5.2, "TINGGI");
  const t2 = insertTest.run("ATLET-SITI", new Date().toISOString(), 62.0, 3.8, "SEDANG");

  const insertKick = db.prepare(`
    INSERT INTO kicks (test_id, kick_number, accuracy_points, start_time, contact_time, duration, angle)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for(let i=1; i<=10; i++) {
      insertKick.run(t1.lastInsertRowid, i, 80 + Math.floor(Math.random()*20), 0, 0.3, 0.3, 'samping');
      insertKick.run(t2.lastInsertRowid, i, 50 + Math.floor(Math.random()*30), 0, 0.4, 0.4, 'samping');
  }
  console.log("Seeded 2 athletes and tests.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/athletes", (req, res) => {
    const { id, name, age, gender, injury_type, body_part, recovery_time } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO athletes (id, name, age, gender, injury_type, body_part, recovery_time, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          name = excluded.name,
          age = excluded.age,
          gender = excluded.gender,
          injury_type = excluded.injury_type,
          body_part = excluded.body_part,
          recovery_time = excluded.recovery_time
      `);
      stmt.run(id, name, age, gender, injury_type, body_part, recovery_time, new Date().toISOString());
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/athletes", (req, res) => {
    try {
      const athletes = db.prepare("SELECT * FROM athletes ORDER BY created_at DESC").all();
      res.json(athletes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/tests", (req, res) => {
    const { athlete_id, avg_accuracy, avg_speed, performance_category, kicks } = req.body;
    try {
      const insertTest = db.prepare(`
        INSERT INTO tests (athlete_id, test_date, avg_accuracy, avg_speed, performance_category)
        VALUES (?, ?, ?, ?, ?)
      `);
      const testResult = insertTest.run(athlete_id, new Date().toISOString(), avg_accuracy, avg_speed, performance_category);
      const testId = testResult.lastInsertRowid;

      const insertKick = db.prepare(`
        INSERT INTO kicks (test_id, kick_number, accuracy_points, start_time, contact_time, duration, angle)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((kicksData) => {
        for (const kick of kicksData) {
          insertKick.run(testId, kick.kick_number, kick.accuracy_points, kick.start_time, kick.contact_time, kick.duration, kick.angle);
        }
      });
      transaction(kicks);

      res.json({ success: true, testId });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/dashboard-stats", (req, res) => {
    const { athlete_id } = req.query;
    try {
      if (athlete_id) {
        const idStr = String(athlete_id);
        const stats = {
          totalAthletes: 1,
          totalTests: db.prepare("SELECT COUNT(*) as count FROM tests WHERE athlete_id = ?").get(idStr).count,
          avgAccuracy: db.prepare("SELECT AVG(avg_accuracy) as avg FROM tests WHERE athlete_id = ?").get(idStr).avg || 0,
          avgSpeed: db.prepare("SELECT AVG(avg_speed) as avg FROM tests WHERE athlete_id = ?").get(idStr).avg || 0,
          performanceDist: db.prepare("SELECT performance_category, COUNT(*) as count FROM tests WHERE athlete_id = ? GROUP BY performance_category").all(idStr),
          recentTests: db.prepare(`
            SELECT t.*, a.name as athlete_name 
            FROM tests t 
            JOIN athletes a ON t.athlete_id = a.id 
            WHERE t.athlete_id = ?
            ORDER BY t.test_date DESC 
            LIMIT 10
          `).all(idStr),
          athleteProfile: db.prepare("SELECT * FROM athletes WHERE id = ?").get(idStr)
        };
        res.json(stats);
      } else {
        const stats = {
          totalAthletes: db.prepare("SELECT COUNT(*) as count FROM athletes").get().count,
          totalTests: db.prepare("SELECT COUNT(*) as count FROM tests").get().count,
          avgAccuracy: db.prepare("SELECT AVG(avg_accuracy) as avg FROM tests").get().avg || 0,
          avgSpeed: db.prepare("SELECT AVG(avg_speed) as avg FROM tests").get().avg || 0,
          performanceDist: db.prepare("SELECT performance_category, COUNT(*) as count FROM tests GROUP BY performance_category").all(),
          recentTests: db.prepare(`
            SELECT t.*, a.name as athlete_name 
            FROM tests t 
            JOIN athletes a ON t.athlete_id = a.id 
            ORDER BY t.test_date DESC 
            LIMIT 5
          `).all()
        };
        res.json(stats);
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT t.*, a.name as athlete_name, a.injury_type, a.body_part 
        FROM tests t 
        JOIN athletes a ON t.athlete_id = a.id 
        ORDER BY t.test_date DESC
      `).all();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/test/:id", (req, res) => {
    try {
      const test = db.prepare(`
        SELECT t.*, a.* 
        FROM tests t 
        JOIN athletes a ON t.athlete_id = a.id 
        WHERE t.id = ?
      `).get(req.params.id);
      const kicks = db.prepare("SELECT * FROM kicks WHERE test_id = ? ORDER BY kick_number ASC").all(req.params.id);
      res.json({ test, kicks });
    } catch (err) {
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
