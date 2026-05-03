const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const initSqlJs = require("sql.js");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "nucleus.db");
let db = null;

// ── Persist to disk after every write ────────────────────────────────────────
function saveDb() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// ── Thin synchronous API wrapping sql.js ──────────────────────────────────────
const dbApi = {
  run(sql, params = []) {
    db.run(sql, params);
    saveDb();
  },
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  },
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },
  insert(sql, params = []) {
    db.run(sql, params);
    const stmt = db.prepare("SELECT last_insert_rowid() as id");
    stmt.step();
    const { id } = stmt.getAsObject();
    stmt.free();
    saveDb();
    return id;
  },
};

// ── Schema ────────────────────────────────────────────────────────────────────
function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name         TEXT    NOT NULL,
    email             TEXT    UNIQUE NOT NULL,
    password          TEXT    NOT NULL,
    role              TEXT    NOT NULL,
    interests         TEXT    DEFAULT '[]',
    security_question TEXT,
    security_answer   TEXT,
    avatar_url        TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS societies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  focus_areas TEXT    DEFAULT '[]',
  user_id     INTEGER,
  mission     TEXT,
  vision      TEXT,
  values_text TEXT,
  avatar_url  TEXT,
  banner_url  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
 db.run(`CREATE TABLE IF NOT EXISTS society_registrations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT,
  focus_areas  TEXT DEFAULT '[]',
  mission      TEXT,
  vision       TEXT,
  email        TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  security_question TEXT DEFAULT '',
  security_answer   TEXT DEFAULT ''
)`);
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    title                 TEXT    NOT NULL,
    description           TEXT,
    category              TEXT    NOT NULL,
    date                  TEXT    NOT NULL,
    time                  TEXT,
    location              TEXT,
    registration_deadline TEXT,
    image_url             TEXT,
    society_id            INTEGER,
    status                TEXT    DEFAULT 'pending',
    max_participants      INTEGER,
    registration_open     INTEGER DEFAULT 1,
    registration_closed_at DATETIME,
    check_in_code         TEXT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS event_registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    event_id      INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attended      INTEGER  DEFAULT 0,
    checked_in_at DATETIME,
    UNIQUE(user_id, event_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookmarks (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS society_follows (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    society_id INTEGER NOT NULL,
    followed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, society_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    type              TEXT    NOT NULL,
    message           TEXT    NOT NULL,
    related_event_id  INTEGER,
    related_society_id INTEGER,
    is_read           INTEGER  DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS opportunities (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    type         TEXT NOT NULL,
    organization TEXT,
    description  TEXT,
    deadline     TEXT,
    link         TEXT,
    posted_by    INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS opportunity_bookmarks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    saved_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, opportunity_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY,
    platform_name TEXT DEFAULT 'NUcleus',
    contact_email TEXT
  )`);
  db.run(
    `INSERT OR IGNORE INTO platform_settings (id, platform_name, contact_email) VALUES (1, 'NUcleus', 'nucesadmin@gmail.com')`,
  );
  saveDb();
}

// ── Helper to grab last inserted rowid ───────────────────────────────────────
function lastId() {
  const stmt = db.prepare("SELECT last_insert_rowid() as id");
  stmt.step();
  const { id } = stmt.getAsObject();
  stmt.free();
  return id;
}

// ── Seed ─────────────────────────────────────────────────────────────────────
function seedData() {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  db.run(
    "INSERT INTO users (full_name,email,password,role,interests) VALUES (?,?,?,?,?)",
    ["Platform Admin", "nucesadmin@gmail.com", hash("admin123"), "admin", "[]"],
  );

  saveDb();
  console.log("🌱 Database seeded with clean data!");
}
// ── Migrations (for existing databases) ──────────────────────────────────────
function runMigrations() {
  const migrations = [
    "ALTER TABLE event_registrations ADD COLUMN attended INTEGER DEFAULT 0",
    "ALTER TABLE event_registrations ADD COLUMN checked_in_at DATETIME",
    "ALTER TABLE events ADD COLUMN max_participants INTEGER",
    "ALTER TABLE events ADD COLUMN registration_open INTEGER DEFAULT 1",
    "ALTER TABLE events ADD COLUMN registration_closed_at DATETIME",
    "ALTER TABLE events ADD COLUMN image_url TEXT",
    "ALTER TABLE events ADD COLUMN check_in_code TEXT",
    "ALTER TABLE societies ADD COLUMN mission TEXT",
    "ALTER TABLE societies ADD COLUMN vision TEXT",
    "ALTER TABLE societies ADD COLUMN values_text TEXT",
    "ALTER TABLE societies ADD COLUMN avatar_url TEXT",
    "ALTER TABLE users ADD COLUMN security_question TEXT",
    "ALTER TABLE users ADD COLUMN security_answer TEXT",
    "ALTER TABLE societies ADD COLUMN banner_url TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
    "ALTER TABLE platform_settings ADD COLUMN contact_email TEXT DEFAULT 'nucesadmin@gmail.com'",
    "ALTER TABLE society_registrations ADD COLUMN security_question TEXT DEFAULT ''",
    "ALTER TABLE society_registrations ADD COLUMN security_answer TEXT DEFAULT ''",
  ];
try {
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_societies_user_id ON societies(user_id)",
  );
} catch (e) { }
  
  try {
    db.run(`CREATE TABLE IF NOT EXISTS societies_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    focus_areas TEXT DEFAULT '[]',
    mission TEXT,
    vision TEXT,
    values_text TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    user_id INTEGER
  )`);
    db.run(
      `INSERT OR IGNORE INTO societies_new SELECT id,name,description,focus_areas,mission,vision,values_text,avatar_url,banner_url,user_id FROM societies`,
    );
    db.run(`DROP TABLE societies`);
    db.run(`ALTER TABLE societies_new RENAME TO societies`);
  } catch (e) {
    console.log("Migration skipped:", e.message);
  }
  for (const sql of migrations) {
    try {
      db.run(sql);
    } catch (_) {
      /* column already exists — safe to ignore */
    }
  }



  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL,
    related_event_id INTEGER, related_society_id INTEGER,
    is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS opportunity_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, opportunity_id INTEGER NOT NULL,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, opportunity_id)
  )`);

  // Backfill check-in codes for any approved events missing one
  const stmt = db.prepare(
    "SELECT id FROM events WHERE status='approved' AND (check_in_code IS NULL OR check_in_code='')",
  );
  const toFill = [];
  while (stmt.step()) toFill.push(stmt.getAsObject().id);
  stmt.free();

  for (const id of toFill) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.run("UPDATE events SET check_in_code=? WHERE id=?", [code, id]);
  }

  saveDb();
  console.log("✅ Migrations applied");
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    runMigrations();
    console.log("📂 Loaded existing database");
  } else {
    db = new SQL.Database();
    console.log("🆕 No database found — creating fresh one...");
    createTables();
    seedData();
  }

  return dbApi;
}

module.exports = { initDb };
