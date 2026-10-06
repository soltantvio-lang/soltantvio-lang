var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express3 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// server/auth.ts
var import_express = __toESM(require("express"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "database.json");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var dbInstance = null;
function loadDatabase() {
  if (dbInstance) return dbInstance;
  if (import_fs.default.existsSync(DB_FILE)) {
    try {
      const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
      dbInstance = JSON.parse(content);
      return dbInstance;
    } catch (err) {
      console.error("Failed to parse database.json, initializing empty db:", err);
    }
  }
  dbInstance = {
    users: {},
    phone_index: {},
    username_index: {},
    workout_logs: [],
    client_event_index: {},
    audit_logs: []
  };
  saveDatabase();
  return dbInstance;
}
function saveDatabase() {
  if (!dbInstance) return;
  try {
    const tempFile = `${DB_FILE}.tmp`;
    import_fs.default.writeFileSync(tempFile, JSON.stringify(dbInstance, null, 2), "utf-8");
    import_fs.default.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Error saving database to file:", err);
  }
}

// server/auth.ts
var authRouter = import_express.default.Router();
var JWT_SECRET = process.env.JWT_SECRET || "fitmax_super_secret_jwt_key_2026_secure";
function generateToken(user) {
  return import_jsonwebtoken.default.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
function requireAuth(req, res, next) {
  const token = req.cookies?.fitmax_token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
  if (!token) {
    return res.status(401).json({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F." });
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const db = loadDatabase();
    const user = db.users[decoded.id];
    if (!user || user.status === "deleted") {
      return res.status(401).json({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "\u0646\u0634\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A." });
  }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632. \u0641\u0642\u0637 \u0645\u062F\u06CC\u0631\u0627\u0646 \u0633\u06CC\u0633\u062A\u0645 \u0645\u062C\u0627\u0632 \u0647\u0633\u062A\u0646\u062F." });
    }
    next();
  });
}
function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}
var rateLimitMap = {};
function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1e3;
  const maxAttempts = 15;
  if (!rateLimitMap[ip] || now > rateLimitMap[ip].resetAt) {
    rateLimitMap[ip] = { count: 1, resetAt: now + windowMs };
    return next();
  }
  rateLimitMap[ip].count += 1;
  if (rateLimitMap[ip].count > maxAttempts) {
    return res.status(429).json({ error: "\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06CC\u06A9 \u062F\u0642\u06CC\u0642\u0647 \u0635\u0628\u0631 \u06A9\u0646\u06CC\u062F." });
  }
  next();
}
authRouter.post("/register", rateLimit, async (req, res) => {
  try {
    const { phone, username, password, display_name } = req.body;
    if (!phone || !username || !password) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644\u060C \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0647\u0633\u062A\u0646\u062F." });
    }
    const cleanPhone = String(phone).trim().replace(/[^\d+]/g, "");
    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return res.status(400).json({ error: "\u0641\u0631\u0645\u062A \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (\u0645\u062B\u0627\u0644: 09121234567)." });
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F3 \u062A\u0627 \u06F3\u06F0 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0648 \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC\u060C \u0639\u062F\u062F \u06CC\u0627 \u0622\u0646\u062F\u0631\u0644\u0627\u06CC\u0646 \u0628\u0627\u0634\u062F." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F6 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0627\u0634\u062F." });
    }
    const db = loadDatabase();
    if (db.phone_index[cleanPhone]) {
      return res.status(409).json({ error: "\u0627\u06CC\u0646 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0642\u0628\u0644\u0627\u064B \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    if (db.username_index[cleanUsername]) {
      return res.status(409).json({ error: "\u0627\u06CC\u0646 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const password_hash = await import_bcryptjs.default.hash(password, salt);
    const isFirstUser = Object.keys(db.users).length === 0;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = {
      id: userId,
      phone: cleanPhone,
      username: cleanUsername,
      password_hash,
      display_name: display_name && String(display_name).trim() || cleanUsername,
      role: isFirstUser ? "super_admin" : "user",
      status: "active",
      created_at: now,
      updated_at: now,
      last_login_at: now
    };
    db.users[userId] = newUser;
    db.phone_index[cleanPhone] = userId;
    db.username_index[cleanUsername] = userId;
    saveDatabase();
    const token = generateToken(newUser);
    res.cookie("fitmax_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
      // 30 days
    });
    return res.status(201).json({
      message: "\u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631." });
  }
});
authRouter.post("/login", rateLimit, async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC/\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0647\u0633\u062A\u0646\u062F." });
    }
    const cleanIdentifier = String(identifier).trim().toLowerCase();
    const cleanPhone = cleanIdentifier.replace(/[^\d+]/g, "");
    const db = loadDatabase();
    let userId = db.username_index[cleanIdentifier] || db.phone_index[cleanPhone];
    if (!userId) {
      return res.status(401).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC\u060C \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A." });
    }
    const user = db.users[userId];
    if (!user || user.status === "deleted") {
      return res.status(401).json({ error: "\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062D\u0630\u0641 \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const isMatch = await import_bcryptjs.default.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC\u060C \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A." });
    }
    user.last_login_at = (/* @__PURE__ */ new Date()).toISOString();
    user.updated_at = user.last_login_at;
    saveDatabase();
    const token = generateToken(user);
    res.cookie("fitmax_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    return res.json({
      message: "\u0648\u0631\u0648\u062F \u0645\u0648\u0641\u0642\u06CC\u062A\u200C\u0622\u0645\u06CC\u0632 \u0628\u0648\u062F.",
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u0648\u0631\u0648\u062F \u06A9\u0627\u0631\u0628\u0631." });
  }
});
authRouter.post("/logout", (req, res) => {
  res.clearCookie("fitmax_token");
  return res.json({ message: "\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0627\u0631\u062C \u0634\u062F\u06CC\u062F." });
});
authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: sanitizeUser(req.user)
  });
});

// server/routes.ts
var import_express2 = __toESM(require("express"), 1);
var XLSX = __toESM(require("xlsx"), 1);
var apiRouter = import_express2.default.Router();
apiRouter.get("/user/profile", requireAuth, (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});
apiRouter.put("/user/profile", requireAuth, (req, res) => {
  const { display_name } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user.id];
  if (!user) return res.status(404).json({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  if (display_name && typeof display_name === "string") {
    user.display_name = display_name.trim();
  }
  user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  saveDatabase();
  return res.json({ message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F.", user: sanitizeUser(user) });
});
apiRouter.get("/user/assessment", requireAuth, (req, res) => {
  const user = req.user;
  return res.json({ assessment_data: user.assessment_data || null });
});
apiRouter.post("/user/assessment", requireAuth, (req, res) => {
  const { assessment_data } = req.body;
  if (!assessment_data) return res.status(400).json({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." });
  const db = loadDatabase();
  const user = db.users[req.user.id];
  user.assessment_data = assessment_data;
  user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  saveDatabase();
  return res.json({ message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u0641\u0636\u0627\u06CC \u0627\u0628\u0631\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F." });
});
apiRouter.get("/user/program", requireAuth, (req, res) => {
  const user = req.user;
  return res.json({
    program_data: user.program_data || null,
    current_week: user.current_week || 1,
    progress: user.progress || null
  });
});
apiRouter.post("/user/program", requireAuth, (req, res) => {
  const { program_data, current_week, progress } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user.id];
  if (program_data !== void 0) user.program_data = program_data;
  if (current_week !== void 0) user.current_week = Number(current_week);
  if (progress !== void 0) user.progress = progress;
  user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  saveDatabase();
  return res.json({ message: "\u0628\u0631\u0646\u0627\u0645\u0647 \u062A\u0645\u0631\u06CC\u0646\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u0641\u0636\u0627\u06CC \u0627\u0628\u0631\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F." });
});
apiRouter.get("/user/workout-logs", requireAuth, (req, res) => {
  const db = loadDatabase();
  const userLogs = db.workout_logs.filter((log) => log.user_id === req.user.id);
  return res.json({ workout_logs: userLogs });
});
apiRouter.post("/user/workout-logs", requireAuth, (req, res) => {
  const { logs } = req.body;
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: "\u0622\u0631\u0627\u06CC\u0647 \u0644\u0627\u06AF\u200C\u0647\u0627 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
  }
  const db = loadDatabase();
  const userId = req.user.id;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let addedCount = 0;
  for (const item of logs) {
    const clientEventId = item.client_event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (db.client_event_index[clientEventId]) {
      continue;
    }
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      client_event_id: clientEventId,
      week_number: Number(item.week_number || 1),
      session_id: String(item.session_id || ""),
      exercise_id: String(item.exercise_id || ""),
      exercise_name: item.exercise_name || "",
      set_number: Number(item.set_number || 1),
      reps: Number(item.reps || 0),
      weight: Number(item.weight || 0),
      rpe: Number(item.rpe || 0),
      completed_at: item.completed_at || now,
      created_at: now
    };
    db.workout_logs.push(newLog);
    db.client_event_index[clientEventId] = true;
    addedCount++;
  }
  if (addedCount > 0) {
    saveDatabase();
  }
  return res.json({ message: `${addedCount} \u0631\u06A9\u0648\u0631\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F.` });
});
apiRouter.post("/user/sync", requireAuth, (req, res) => {
  const { assessment_data, program_data, current_week, progress, workout_logs } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user.id];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (assessment_data) {
    user.assessment_data = assessment_data;
  }
  if (program_data) {
    user.program_data = program_data;
  }
  if (current_week) {
    user.current_week = Number(current_week);
  }
  if (progress) {
    user.progress = progress;
  }
  let addedLogs = 0;
  if (Array.isArray(workout_logs)) {
    for (const item of workout_logs) {
      const clientEventId = item.client_event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (!db.client_event_index[clientEventId]) {
        db.workout_logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: user.id,
          client_event_id: clientEventId,
          week_number: Number(item.week_number || 1),
          session_id: String(item.session_id || ""),
          exercise_id: String(item.exercise_id || ""),
          exercise_name: item.exercise_name || "",
          set_number: Number(item.set_number || 1),
          reps: Number(item.reps || 0),
          weight: Number(item.weight || 0),
          rpe: Number(item.rpe || 0),
          completed_at: item.completed_at || now,
          created_at: now
        });
        db.client_event_index[clientEventId] = true;
        addedLogs++;
      }
    }
  }
  user.updated_at = now;
  saveDatabase();
  return res.json({
    message: "\u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0627\u0628\u0631\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F.",
    added_logs: addedLogs,
    user: sanitizeUser(user)
  });
});
apiRouter.get("/admin/stats", requireAdmin, (req, res) => {
  const db = loadDatabase();
  const allUsers = Object.values(db.users).filter((u) => u.status !== "deleted");
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1e3;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1e3;
  const totalUsers = allUsers.length;
  const activeToday = allUsers.filter((u) => u.last_login_at && new Date(u.last_login_at).getTime() > oneDayAgo).length;
  const activeThisWeek = allUsers.filter((u) => u.last_login_at && new Date(u.last_login_at).getTime() > oneWeekAgo).length;
  const withProgram = allUsers.filter((u) => !!u.program_data).length;
  const totalLogs = db.workout_logs.length;
  const weekDistribution = {
    week1: allUsers.filter((u) => (u.current_week || 1) === 1).length,
    week2: allUsers.filter((u) => u.current_week === 2).length,
    week3: allUsers.filter((u) => u.current_week === 3).length,
    week4: allUsers.filter((u) => u.current_week === 4).length
  };
  return res.json({
    totalUsers,
    activeToday,
    activeThisWeek,
    withProgram,
    totalLogs,
    weekDistribution
  });
});
apiRouter.get("/admin/users", requireAdmin, (req, res) => {
  const db = loadDatabase();
  const { search, role, week } = req.query;
  let list = Object.values(db.users).filter((u) => u.status !== "deleted").map((u) => {
    const userLogsCount = db.workout_logs.filter((l) => l.user_id === u.id).length;
    return {
      id: u.id,
      phone: u.phone,
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
      current_week: u.current_week || 1,
      has_assessment: !!u.assessment_data,
      has_program: !!u.program_data,
      logs_count: userLogsCount,
      progress_pct: u.progress?.completion_percentage || 0
    };
  });
  if (search && typeof search === "string") {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (u) => u.username.toLowerCase().includes(q) || u.phone.includes(q) || u.display_name.toLowerCase().includes(q)
    );
  }
  if (role && typeof role === "string") {
    list = list.filter((u) => u.role === role);
  }
  if (week && typeof week === "string") {
    list = list.filter((u) => u.current_week === Number(week));
  }
  return res.json({ users: list });
});
apiRouter.get("/admin/export-excel", requireAdmin, (req, res) => {
  const db = loadDatabase();
  const allUsers = Object.values(db.users).filter((u) => u.status !== "deleted");
  const rows = allUsers.map((u) => {
    const userLogsCount = db.workout_logs.filter((l) => l.user_id === u.id).length;
    return {
      "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631": u.id,
      "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644": u.phone,
      "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC": u.username,
      "\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC": u.display_name,
      "\u0646\u0642\u0634": u.role === "super_admin" ? "\u0645\u062F\u06CC\u0631 \u0627\u0631\u0634\u062F" : u.role === "admin" ? "\u0645\u062F\u06CC\u0631" : "\u06A9\u0627\u0631\u0628\u0631",
      "\u062A\u0627\u0631\u06CC\u062E \u0639\u0636\u0648\u06CC\u062A": new Date(u.created_at).toLocaleDateString("fa-IR"),
      "\u0622\u062E\u0631\u06CC\u0646 \u0648\u0631\u0648\u062F": u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("fa-IR") : "\u2014",
      "\u0647\u0641\u062A\u0647 \u062A\u0645\u0631\u06CC\u0646\u06CC": u.current_week || 1,
      "\u062F\u0631\u0635\u062F \u067E\u06CC\u0634\u0631\u0641\u062A": `${u.progress?.completion_percentage || 0}%`,
      "\u062A\u0639\u062F\u0627\u062F \u0633\u062A\u200C\u0647\u0627\u06CC \u062B\u0628\u062A \u0634\u062F\u0647": userLogsCount,
      "\u0648\u0636\u0639\u06CC\u062A \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC": u.assessment_data ? "\u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F\u0647" : "\u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0646\u0634\u062F\u0647"
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "\u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u06CC\u062A \u0645\u06A9\u0633");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  db.audit_logs.push({
    id: `audit_${Date.now()}`,
    admin_id: req.user.id,
    admin_username: req.user.username,
    action: "EXPORT_USERS_EXCEL",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  res.setHeader("Content-Disposition", 'attachment; filename="fitmax-users.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  return res.send(buffer);
});

// server.ts
import_dotenv.default.config();
var PORT = 3e3;
var ADMIN_ACCESS_PATH = process.env.ADMIN_ACCESS_PATH || "/fitmax-manage-portal-99x";
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
function hashPassword(pass) {
  return import_crypto.default.createHash("sha256").update(pass + "fitmax_secret_salt_2026").digest("hex");
}
var adminCredentials = {
  username: "admin",
  passwordHash: hashPassword("1234")
};
var activeSessions = {};
var activityLogs = [
  {
    id: "log_init",
    adminUser: "system",
    action: "\u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u0633\u06CC\u0633\u062A\u0645 \u0645\u062F\u06CC\u0631\u06CC\u062A",
    target: "Fit Max Admin",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details: "\u067E\u0644\u062A\u0641\u0631\u0645 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0641\u06CC\u062A \u0645\u06A9\u0633 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0641\u0639\u0627\u0644 \u06AF\u0631\u062F\u06CC\u062F."
  }
];
function logAdminActivity(username, action, target, details) {
  activityLogs.unshift({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
    adminUser: username,
    action,
    target,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details
  });
}
var siteSettings = {
  siteName: "FIT MAX | \u0641\u06CC\u062A \u0645\u06A9\u0633",
  logoUrl: "/images/site/logo.png",
  faviconUrl: "/favicon.ico",
  siteDescription: "\u067E\u0644\u062A\u0641\u0631\u0645 \u0639\u0644\u0645\u06CC\u060C \u0622\u0645\u0648\u0632\u0634\u06CC \u0648 \u062A\u062E\u0635\u0635\u06CC \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633\u060C \u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u0648\u0632\u0646 \u0628\u062F\u0646 \u0648 \u0628\u062F\u0646\u0633\u0627\u0632\u06CC. \u0647\u0645\u0631\u0627\u0647 \u0631\u0633\u0645\u06CC \u06A9\u0627\u0646\u0627\u0644 \u06CC\u0648\u062A\u06CC\u0648\u0628 Fit Max.",
  youtubeUrl: "https://youtube.com/@fitmaxofficial",
  telegramAdminHandle: "@FitMax_Admin",
  contactPhone: "\u06F0\u06F2\u06F1-\u06F8\u06F8\u06F9\u06F9\u06F0\u06F0\u06F1\u06F1",
  contactEmail: "info@fitmaxofficial.ir",
  footerText: "\xA9 \u06F2\u06F0\u06F2\u06F6 FIT MAX | \u062A\u0645\u0627\u0645\u06CC \u062D\u0642\u0648\u0642 \u0645\u0627\u062F\u06CC \u0648 \u0645\u0639\u0646\u0648\u06CC \u0645\u062D\u0641\u0648\u0638 \u0627\u0633\u062A.",
  socialLinks: [
    { platform: "youtube", url: "https://youtube.com/@fitmaxofficial" },
    { platform: "telegram", url: "https://t.me/FitMaxOfficial1" }
  ]
};
var typographySettings = {
  headerFont: "Vazirmatn",
  bodyFont: "Vazirmatn",
  buttonFont: "Vazirmatn",
  cardFont: "Vazirmatn",
  fontSizeScale: "normal"
};
var appearanceSettings = {
  primaryColor: "#f97316",
  // Brand Orange
  secondaryColor: "#ea580c",
  backgroundColor: "#ffead9",
  // Soft Peach
  textColor: "#0f172a",
  cardColor: "#ffffff",
  borderColor: "#ffead9",
  accentColor: "#ef4444"
};
var heroBanners = [
  {
    id: "ban_1",
    title_fa: "\u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0648 \u06A9\u0646\u062A\u0631\u0644 \u06A9\u0627\u0645\u0644 \u0628\u062F\u0646 \u0631\u0627 \u0639\u0644\u0645\u06CC \u0634\u0631\u0648\u0639 \u06A9\u0646",
    description_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u062A\u0645\u0631\u06CC\u0646\u06CC \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0628\u062F\u0648\u0646 \u0646\u06CC\u0627\u0632 \u0628\u0647 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A \u06AF\u0631\u0627\u0646\u200C\u0642\u06CC\u0645\u062A \u0628\u0627 \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0633\u0637\u0648\u062D \u062D\u0631\u06A9\u062A\u06CC.",
    image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    button_text: "\u0634\u0631\u0648\u0639 \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0631\u0627\u06CC\u06AF\u0627\u0646",
    button_link: "assessment",
    is_active: true,
    display_order: 1
  }
];
var pagesContent = {
  home: {
    page_slug: "home",
    page_title_fa: "\u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC - \u0641\u06CC\u062A \u0645\u06A9\u0633",
    meta_description_fa: "\u062E\u0627\u0646\u0647 \u0627\u0635\u0644\u06CC \u067E\u0644\u062A\u0641\u0631\u0645 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0641\u06CC\u062A \u0645\u06A9\u0633",
    sections: [
      { id: "s1", section_key: "hero", title_fa: "\u0628\u062E\u0634 \u0647\u06CC\u0631\u0648 \u0648 \u062E\u06CC\u0631 \u0645\u0642\u062F\u0645", content_fa: "\u0622\u0645\u0648\u0632\u0634 \u062A\u062E\u0635\u0635\u06CC \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0628\u0627 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0631\u0633\u0645\u06CC \u0641\u06CC\u062A \u0645\u06A9\u0633", is_active: true, display_order: 1 },
      { id: "s2", section_key: "features", title_fa: "\u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627\u06CC \u067E\u0644\u062A\u0641\u0631\u0645", content_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u0647\u0648\u0634\u0645\u0646\u062F\u060C \u0628\u0627\u0646\u06A9 \u062D\u0631\u06A9\u0627\u062A\u060C \u0645\u0631\u0628\u06CC \u0647\u0648\u0634\u0645\u0646\u062F AI", is_active: true, display_order: 2 }
    ]
  },
  workout: {
    page_slug: "workout",
    page_title_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u062A\u0645\u0631\u06CC\u0646\u06CC \u0645\u0646",
    meta_description_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0648 \u0628\u062F\u0646\u0633\u0627\u0632\u06CC",
    sections: [
      { id: "s1", section_key: "program_overview", title_fa: "\u062E\u0644\u0627\u0635\u0647 \u0628\u0631\u0646\u0627\u0645\u0647", content_fa: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0628\u0631\u0646\u0627\u0645\u0647 \u0647\u0641\u062A\u06AF\u06CC \u0628\u0631 \u0627\u0633\u0627\u0633 \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0634\u0645\u0627", is_active: true, display_order: 1 }
    ]
  }
};
var pendingComments = [
  {
    id: "c_1",
    article_id: "art_progressive_overload",
    user_name: "\u0639\u0644\u06CC \u0631\u0636\u0627\u06CC\u06CC",
    content: "\u0645\u0645\u0646\u0648\u0646 \u0627\u0632 \u0645\u0642\u0627\u0644\u0647 \u0639\u0627\u0644\u06CC. \u0628\u0631\u0627\u06CC \u06A9\u0633\u0627\u0646\u06CC \u06A9\u0647 \u0641\u0642\u0637 \u0628\u0627 \u0648\u0632\u0646 \u0628\u062F\u0646 \u062A\u0645\u0631\u06CC\u0646 \u0645\u06CC\u200C\u06A9\u0646\u0646\u062F\u060C \u062A\u063A\u06CC\u06CC\u0631 \u0632\u0627\u0648\u06CC\u0647 \u062D\u0631\u06A9\u062A \u0648\u0627\u0642\u0639\u0627\u064B \u0645\u0639\u062C\u0632\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0647.",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    status: "approved"
  },
  {
    id: "c_2",
    article_id: "art_pullup_progression",
    user_name: "\u0633\u0627\u0631\u0627 \u062D\u0633\u06CC\u0646\u06CC",
    content: "\u0628\u0627 \u06A9\u0645\u06A9 \u0686\u0627\u0644\u0634 \u06F3\u06F0 \u0631\u0648\u0632\u0647 \u0628\u0647 \u0627\u0648\u0644\u06CC\u0646 \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u06A9\u0627\u0645\u0644 \u0631\u0633\u06CC\u062F\u0645! \u0648\u0627\u0642\u0639\u0627\u064B \u0645\u0645\u0646\u0648\u0646\u0645 \u0627\u0632 \u0622\u0645\u0648\u0632\u0634\u200C\u0647\u0627\u06CC \u0639\u0627\u0644\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628 \u0641\u06CC\u062A \u0645\u06A9\u0633.",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    status: "pending"
  }
];
var mediaFiles = [
  {
    id: "med_1",
    filename: "fitmax_character.jpg",
    folder: "character",
    url: "/images/character/fitmax_mascot.jpg",
    alt_text: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0631\u0633\u0645\u06CC \u0641\u06CC\u062A \u0645\u06A9\u0633 \u0628\u0627 \u0647\u062F\u0628\u0646\u062F \u0642\u0631\u0645\u0632 FM",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    size_kb: 240
  },
  {
    id: "med_2",
    filename: "pushup_demo.jpg",
    folder: "exercises",
    url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
    alt_text: "\u0627\u062C\u0631\u0627\u06CC \u0635\u062D\u06CC\u062D \u0634\u0646\u0627 \u0633\u0648\u0626\u062F\u06CC",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    size_kb: 180
  }
];
var aiCoachKnowledge = [
  {
    id: "ak_1",
    title_fa: "\u0627\u0635\u0644 \u0627\u0636\u0627\u0641\u0647 \u0628\u0627\u0631 \u062A\u062F\u0631\u06CC\u062C\u06CC (Progressive Overload)",
    category: "exercise_science",
    content_fa: "\u062F\u0631 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0627\u0636\u0627\u0641\u0647 \u0628\u0627\u0631 \u0628\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u0632\u0627\u0648\u06CC\u0647 \u0628\u062F\u0646\u06CC\u060C \u0627\u0641\u0632\u0627\u06CC\u0634 \u0632\u0645\u0627\u0646 \u062A\u062D\u062A \u0641\u0634\u0627\u0631 (TUT)\u060C \u06A9\u0627\u0647\u0634 \u0632\u0645\u0627\u0646 \u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06CC\u0627 \u0627\u0641\u0632\u0648\u062F\u0646 \u0648\u0632\u0646 \u062C\u0644\u06CC\u0642\u0647 \u0627\u0646\u062C\u0627\u0645 \u0645\u06CC\u200C\u0634\u0648\u062F.",
    sources: ["ACSM Essentials of Strength Training", "Fit Max Methodology"],
    is_active: true
  },
  {
    id: "ak_2",
    title_fa: "\u067E\u0631\u0648\u062A\u06A9\u0644 \u0627\u06CC\u0645\u0646\u06CC \u0645\u0641\u0627\u0635\u0644 \u0634\u0627\u0646\u0647 \u0648 \u0645\u0686 \u062F\u0633\u062A",
    category: "safety",
    content_fa: "\u0642\u0628\u0644 \u0627\u0632 \u062D\u0631\u06A9\u0627\u062A \u067E\u06CC\u0634\u0631\u0641\u062A\u0647 \u0645\u062B\u0644 \u062F\u06CC\u067E\u0633 \u06CC\u0627 \u0628\u0627\u0644\u0627\u0646\u0633\u060C \u062D\u062A\u0645\u0627\u064B \u06F5 \u062F\u0642\u06CC\u0642\u0647 \u06AF\u0631\u0645 \u06A9\u0631\u062F\u0646 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0645\u0686 \u062F\u0633\u062A \u0648 \u0631\u0648\u062A\u0627\u062A\u0648\u0631 \u06A9\u0627\u0641 \u0627\u0646\u062C\u0627\u0645 \u0634\u0648\u062F.",
    sources: ["NSCA Guidelines"],
    is_active: true
  }
];
var registeredUsers = [
  {
    id: "usr_1",
    name: "\u0631\u0636\u0627 \u0645\u062D\u0645\u062F\u06CC",
    email: "reza@example.com",
    phone: "09121112233",
    status: "active",
    registeredAt: "2026-01-10",
    goal: "\u0627\u0641\u0632\u0627\u06CC\u0634 \u062D\u062C\u0645 \u0648 \u0642\u062F\u0631\u062A \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633",
    calculatedLevel: "intermediate"
  },
  {
    id: "usr_2",
    name: "\u0645\u0631\u06CC\u0645 \u0627\u062D\u0645\u062F\u06CC",
    email: "maryam@example.com",
    phone: "09123334455",
    status: "active",
    registeredAt: "2026-02-01",
    goal: "\u0686\u0631\u0628\u06CC\u200C\u0633\u0648\u0632\u06CC \u0648 \u0631\u0633\u06CC\u062F\u0646 \u0628\u0647 \u0627\u0648\u0644\u06CC\u0646 \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633",
    calculatedLevel: "beginner"
  }
];
var productsCatalog = [
  {
    id: "prod_course_calisthenics_master",
    title_fa: "\u062F\u0648\u0631\u0647 \u062C\u0627\u0645\u0639 \u0645\u0633\u062A\u0631\u06A9\u0644\u0627\u0633 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0648 \u06A9\u0646\u062A\u0631\u0644 \u0628\u062F\u0646",
    description_fa: "\u062F\u0648\u0631\u0647 \u0648\u06CC\u062F\u06CC\u0648\u06CC\u06CC \u067E\u06CC\u0634\u0631\u0641\u062A\u0647 \u0634\u0627\u0645\u0644 \u0622\u0645\u0648\u0632\u0634 \u0641\u0631\u0627\u0646\u062A \u0644\u0648\u0631\u060C \u0647\u062F\u0641\u200C\u06AF\u0630\u0627\u0631\u06CC \u067E\u0631\u0686\u0645\u06CC\u060C \u0628\u0627\u0644\u0627\u0646\u0633 \u0648 \u062A\u06A9\u0646\u06CC\u06A9\u200C\u0647\u0627\u06CC \u067E\u06CC\u0634\u0631\u0641\u062A\u0647 \u0642\u062F\u0631\u062A\u06CC \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633.",
    price_toman: 49e4,
    is_free: false,
    image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    features_fa: ["\u0628\u06CC\u0634 \u0627\u0632 \u06F1\u06F0 \u0633\u0627\u0639\u062A \u0648\u06CC\u062F\u06CC\u0648 HD", "\u0628\u0631\u0646\u0627\u0645\u0647 \u062A\u0645\u0631\u06CC\u0646\u06CC \u0627\u062E\u062A\u0635\u0627\u0635\u06CC PDF", "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645 \u062A\u0644\u06AF\u0631\u0627\u0645"],
    category: "course"
  },
  {
    id: "prod_ebook_nutrition_science",
    title_fa: "\u06A9\u062A\u0627\u0628 \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9\u06CC \u0639\u0644\u0645 \u0631\u0698\u06CC\u0645 \u0648 \u0641\u06CC\u062A\u0646\u0633 \u0628\u062F\u0648\u0646 \u06AF\u0631\u0633\u0646\u06AF\u06CC",
    description_fa: "\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u0639\u0645\u0644\u06CC \u0645\u062D\u0627\u0633\u0628\u0647 \u062F\u0631\u0634\u062A\u200C\u0645\u063A\u0630\u06CC\u200C\u0647\u0627\u060C \u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u0648\u0627\u062F \u063A\u0630\u0627\u06CC\u06CC \u0627\u06CC\u0631\u0627\u0646\u06CC\u060C \u0631\u0698\u06CC\u0645 \u0686\u0631\u0628\u06CC\u200C\u0633\u0648\u0632\u06CC \u0645\u0627\u0646\u062F\u06AF\u0627\u0631 \u0648 \u0645\u06A9\u0645\u0644\u200C\u0634\u0646\u0627\u0633\u06CC.",
    price_toman: 19e4,
    is_free: false,
    image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    features_fa: ["\u0641\u0631\u0645\u062A PDF \u062A\u0639\u0627\u0645\u0644\u06CC", "\u062C\u062F\u0648\u0644 \u0627\u0631\u0632\u0634 \u063A\u0630\u0627\u06CC\u06CC \u063A\u0630\u0627\u0647\u0627\u06CC \u0627\u06CC\u0631\u0627\u0646\u06CC", "\u0645\u062D\u0627\u0633\u0628\u0647\u200C\u06AF\u0631 \u0627\u06A9\u0633\u0644 \u0647\u0645\u0631\u0627\u0647"],
    category: "ebook"
  }
];
var youtubeVideosStore = [
  {
    id: "yt_starter_100",
    youtube_id: "RMpaiLRWveo",
    title_fa: "\u0627\u0632 \u0635\u0641\u0631 \u062A\u0627 \u06F1\u06F0\u06F0 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 (\u0642\u0633\u0645\u062A \u06F1)",
    description_fa: "\u0628\u0647\u062A\u0631\u06CC\u0646 \u0646\u0642\u0637\u0647 \u0634\u0631\u0648\u0639 \u0628\u0631\u0627\u06CC \u06A9\u0633\u0627\u0646\u06CC \u06A9\u0647 \u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u0646\u062F \u062A\u0645\u0631\u06CC\u0646 \u0628\u0627 \u0648\u0632\u0646 \u0628\u062F\u0646 \u0648 \u06A9\u0646\u062A\u0631\u0644 \u06A9\u0627\u0645\u0644 \u0628\u062F\u0646 \u0631\u0627 \u0634\u0631\u0648\u0639 \u06A9\u0646\u0646\u062F.",
    category: "starter",
    duration: "15:40",
    thumbnail_url: "https://img.youtube.com/vi/RMpaiLRWveo/hqdefault.jpg",
    featured: true
  },
  {
    id: "yt_starter_secrets",
    youtube_id: "j3SnZFTBfQI",
    title_fa: "\u0686\u0637\u0648\u0631 \u0627\u0648\u0644\u06CC\u0646 \u062D\u0631\u06A9\u0627\u062A \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0631\u0648 \u0628\u0632\u0646\u06CC\u0645\u061F",
    description_fa: "\u0622\u0645\u0648\u0632\u0634 \u06F3 \u0631\u0627\u0632 \u0637\u0644\u0627\u06CC\u06CC \u0628\u0631\u0627\u06CC \u0627\u062C\u0631\u0627\u06CC \u062F\u0631\u0633\u062A \u0648 \u0628\u062F\u0648\u0646 \u0622\u0633\u06CC\u0628 \u062D\u0631\u06A9\u0627\u062A \u0627\u0635\u0644\u06CC \u0634\u0646\u0627\u060C \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u0648 \u0627\u0633\u06A9\u0627\u062A.",
    category: "starter",
    duration: "12:15",
    thumbnail_url: "https://img.youtube.com/vi/j3SnZFTBfQI/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard", "pullup_standard", "squat_bodyweight"],
    featured: true
  },
  {
    id: "yt_starter_why_cali",
    youtube_id: "4ELO_G6EAiQ",
    title_fa: "\u0686\u0631\u0627 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0627\u0632 \u0628\u0627\u0634\u06AF\u0627\u0647 \u0628\u0647\u062A\u0631\u0647\u061F",
    description_fa: "\u0648\u06CC\u062F\u06CC\u0648 \u0627\u0646\u06AF\u06CC\u0632\u0634\u06CC \u0648 \u062A\u062D\u0644\u06CC\u0644\u06CC \u062F\u0631\u0628\u0627\u0631\u0647 \u0645\u0632\u0627\u06CC\u0627\u06CC \u062A\u0645\u0631\u06CC\u0646 \u0628\u0627 \u0648\u0632\u0646 \u0628\u062F\u0646\u060C \u0633\u0627\u062E\u062A \u0639\u0636\u0644\u0627\u062A \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC \u0648 \u0622\u0632\u0627\u062F\u06CC \u062A\u0645\u0631\u06CC\u0646.",
    category: "starter",
    duration: "10:50",
    thumbnail_url: "https://img.youtube.com/vi/4ELO_G6EAiQ/hqdefault.jpg",
    featured: true
  },
  {
    id: "yt_starter_test",
    youtube_id: "y_L14s0kc5s",
    title_fa: "\u062A\u0633\u062A \u0642\u062F\u0631\u062A: \u062A\u0627 \u06A9\u062F\u0648\u0645 \u0633\u0637\u062D \u0634\u0646\u0627 \u0645\u06CC\u062A\u0648\u0646\u06CC \u0628\u0631\u06CC\u061F",
    description_fa: "\u06CC\u06A9 \u0648\u06CC\u062F\u06CC\u0648\u06CC \u0639\u0627\u0644\u06CC \u0628\u0631\u0627\u06CC \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0633\u0637\u062D \u0627\u0648\u0644\u06CC\u0647 \u0642\u062F\u0631\u062A \u0633\u06CC\u0646\u0647 \u0648 \u0634\u0627\u0646\u0647 \u0648 \u062A\u0639\u06CC\u06CC\u0646 \u062F\u0642\u06CC\u0642 \u0633\u0637\u062D \u0622\u0645\u0627\u062F\u06AF\u06CC \u062C\u0633\u0645\u0627\u0646\u06CC.",
    category: "starter",
    duration: "08:30",
    thumbnail_url: "https://img.youtube.com/vi/y_L14s0kc5s/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard"],
    featured: true
  },
  {
    id: "yt_forearm_30days",
    youtube_id: "Tf0ULax6ifA",
    title_fa: "\u0631\u0627\u0632 \u0633\u0627\u0639\u062F\u0647\u0627\u06CC \u0631\u06AF\u062F\u0627\u0631: \u062A\u0645\u0631\u06CC\u0646 \u06F3\u06F0 \u0631\u0648\u0632\u0647",
    description_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u06A9\u0627\u0645\u0644 \u0648 \u0627\u0646\u0641\u062C\u0627\u0631\u06CC \u0628\u0631\u0627\u06CC \u062D\u062C\u06CC\u0645 \u06A9\u0631\u062F\u0646 \u0639\u0636\u0644\u0627\u062A \u0645\u0686 \u0648 \u0633\u0627\u062E\u062A \u0633\u0627\u0639\u062F\u0647\u0627\u06CC \u0631\u06AF\u062F\u0627\u0631 \u062F\u0631 \u062E\u0627\u0646\u0647 \u0648 \u0628\u0627\u0634\u06AF\u0627\u0647.",
    category: "forearms",
    duration: "14:20",
    thumbnail_url: "https://img.youtube.com/vi/Tf0ULax6ifA/hqdefault.jpg",
    featured: true
  },
  {
    id: "yt_forearm_3moves",
    youtube_id: "2dkQXbSgd7U",
    title_fa: "\u0641\u0642\u0637 \u0628\u0627 \u06F3 \u062D\u0631\u06A9\u062A \u0633\u0627\u062F\u0647 \u0633\u0627\u0639\u062F \u062D\u062C\u06CC\u0645 \u0648 \u0631\u06AF\u062F\u0627\u0631 \u0628\u0633\u0627\u0632!",
    description_fa: "\u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u0633\u0631\u06CC\u0639 \u0648 \u0628\u0633\u06CC\u0627\u0631 \u0645\u0648\u062B\u0631 \u0628\u0631\u0627\u06CC \u06A9\u0633\u0627\u0646\u06CC \u06A9\u0647 \u0632\u0645\u0627\u0646 \u06A9\u0645\u06CC \u062F\u0627\u0631\u0646\u062F \u0627\u0645\u0627 \u0633\u0627\u0639\u062F \u0642\u0648\u06CC \u0648 \u062D\u062C\u06CC\u0645 \u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u0646\u062F.",
    category: "forearms",
    duration: "09:15",
    thumbnail_url: "https://img.youtube.com/vi/2dkQXbSgd7U/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_wrist_thick",
    youtube_id: "zT3YhzU8Xsk",
    title_fa: "\u0645\u0686\u200C\u0647\u0627\u062A \u0644\u0627\u063A\u0631\u0647\u061F \u06F3 \u062D\u0631\u06A9\u062A \u0628\u0631\u0627\u06CC \u0636\u062E\u06CC\u0645 \u06A9\u0631\u062F\u0646 \u0645\u0686",
    description_fa: "\u0631\u0627\u0647\u06A9\u0627\u0631 \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC \u0648 \u062D\u0631\u06A9\u0627\u062A \u062A\u062E\u0635\u0635\u06CC \u0628\u0631\u0627\u06CC \u06A9\u0633\u0627\u0646\u06CC \u06A9\u0647 \u0627\u0632 \u0627\u0633\u062A\u062E\u0648\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u0648 \u0645\u0686 \u0638\u0631\u06CC\u0641 \u0631\u0646\u062C \u0645\u06CC\u200C\u0628\u0631\u0646\u062F.",
    category: "forearms",
    duration: "11:05",
    thumbnail_url: "https://img.youtube.com/vi/zT3YhzU8Xsk/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_hand_size",
    youtube_id: "TdcJrtrYKtw",
    title_fa: "\u06A9\u0641 \u062F\u0633\u062A\u062A \u06A9\u0648\u0686\u06CC\u06A9\u0647\u061F \u06F3 \u062A\u0645\u0631\u06CC\u0646 \u0628\u0631\u0627\u06CC \u06A9\u0644\u0641\u062A \u06A9\u0631\u062F\u0646 \u062F\u0633\u062A",
    description_fa: "\u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u062E\u0627\u0635 \u0628\u0631\u0627\u06CC \u0627\u0641\u0632\u0627\u06CC\u0634 \u062D\u062C\u0645 \u06AF\u0648\u0634\u062A\u06CC \u062F\u0633\u062A \u0648 \u062A\u0642\u0648\u06CC\u062A \u0647\u06CC\u067E\u0631\u062A\u0631\u0648\u0641\u06CC \u0639\u0636\u0644\u0627\u062A \u067E\u0646\u062C\u0647.",
    category: "forearms",
    duration: "08:45",
    thumbnail_url: "https://img.youtube.com/vi/TdcJrtrYKtw/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_grip_strength",
    youtube_id: "gsiEFb5N4oE",
    title_fa: "\u0686\u0631\u0627 \u0642\u062F\u0631\u062A \u067E\u0646\u062C\u0647\u200C\u0647\u0627\u062A \u0636\u0639\u06CC\u0641\u0647\u061F",
    description_fa: "\u0627\u0635\u0644\u0627\u062D \u0627\u0634\u062A\u0628\u0627\u0647\u0627\u062A \u0631\u0627\u06CC\u062C \u062F\u0631 \u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u067E\u0646\u062C\u0647 \u0648 \u0645\u0686 \u0648 \u0627\u0641\u0632\u0627\u06CC\u0634 \u0642\u062F\u0631\u062A \u06AF\u06CC\u0631\u0627\u06CC\u06CC \u062F\u0633\u062A (Grip Strength).",
    category: "forearms",
    duration: "10:20",
    thumbnail_url: "https://img.youtube.com/vi/gsiEFb5N4oE/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_technique_pushup",
    youtube_id: "tc0mOEyWKLI",
    title_fa: "\u0686\u0637\u0648\u0631 \u062F\u0631\u0633\u062A \u0634\u0646\u0627 \u0628\u0632\u0646\u06CC\u0645\u061F (\u0627\u0634\u062A\u0628\u0627\u0647\u0627\u062A \u06F9\u06F0\u066A \u0627\u0641\u0631\u0627\u062F)",
    description_fa: "\u0628\u0631\u0631\u0633\u06CC \u062F\u0642\u06CC\u0642 \u0628\u06CC\u0648\u0645\u06A9\u0627\u0646\u06CC\u06A9 \u0648 \u062C\u0632\u0626\u06CC\u0627\u062A \u0641\u0631\u0645 \u0635\u062D\u06CC\u062D \u0634\u0646\u0627 \u0633\u0648\u0626\u062F\u06CC \u0648 \u0627\u0635\u0644\u0627\u062D \u0632\u0627\u0648\u06CC\u0647 \u0634\u0627\u0646\u0647 \u0648 \u0622\u0631\u0646\u062C.",
    category: "technique",
    duration: "13:10",
    thumbnail_url: "https://img.youtube.com/vi/tc0mOEyWKLI/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard"],
    featured: true
  },
  {
    id: "yt_pushup_mistakes",
    youtube_id: "dhhyQOST0QA",
    title_fa: "\u06F5 \u0627\u0634\u062A\u0628\u0627\u0647 \u062E\u0637\u0631\u0646\u0627\u06A9 \u062F\u0631 \u062D\u0631\u06A9\u062A \u0634\u0646\u0627",
    description_fa: "\u0648\u06CC\u062F\u06CC\u0648\u06CC \u062A\u06A9\u0645\u06CC\u0644\u06CC \u0628\u0631\u0627\u06CC \u062C\u0644\u0648\u06AF\u06CC\u0631\u06CC \u0627\u0632 \u0622\u0633\u06CC\u0628\u200C\u062F\u06CC\u062F\u06AF\u06CC \u0645\u0641\u0635\u0644 \u0634\u0627\u0646\u0647\u060C \u0645\u0686 \u0648 \u06AF\u0648\u062F\u06CC \u06A9\u0645\u0631 \u0647\u0646\u06AF\u0627\u0645 \u0627\u062C\u0631\u0627\u06CC \u0634\u0646\u0627.",
    category: "technique",
    duration: "07:45",
    thumbnail_url: "https://img.youtube.com/vi/dhhyQOST0QA/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard"],
    featured: false
  },
  {
    id: "yt_pullup_form",
    youtube_id: "_B4OfVtlNqI",
    title_fa: "\u0641\u0631\u0645 \u062F\u0631\u0633\u062A \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u062F\u0631 \u06F2 \u062F\u0642\u06CC\u0642\u0647",
    description_fa: "\u0622\u0645\u0648\u0632\u0634 \u0633\u0631\u06CC\u0639 \u0648 \u062A\u062E\u0635\u0635\u06CC \u0628\u0631\u0627\u06CC \u06A9\u0633\u0627\u0646\u06CC \u06A9\u0647 \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u0631\u0627 \u0627\u0634\u062A\u0628\u0627\u0647 \u0645\u06CC\u200C\u0632\u0646\u0646\u062F \u0648 \u0642\u0635\u062F \u062A\u0642\u0648\u06CC\u062A \u0639\u0636\u0644\u0627\u062A \u0632\u06CC\u0631\u0628\u063A\u0644 \u0631\u0627 \u062F\u0627\u0631\u0646\u062F.",
    category: "technique",
    duration: "02:30",
    thumbnail_url: "https://img.youtube.com/vi/_B4OfVtlNqI/hqdefault.jpg",
    related_exercise_ids: ["pullup_standard"],
    featured: false
  },
  {
    id: "yt_neck_hump",
    youtube_id: "V3XnZiwlqaA",
    title_fa: "\u0642\u0648\u0632 \u06AF\u0631\u062F\u0646 \u062F\u0627\u0631\u06CC\u061F \u0627\u0635\u0644\u0627\u062D \u062F\u0631 \u06F2 \u062F\u0642\u06CC\u0642\u0647",
    description_fa: "\u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u0627\u0635\u0644\u0627\u062D\u06CC \u067E\u0627\u0633\u0686\u0631\u0627\u0644 \u0628\u0631\u0627\u06CC \u0628\u0647\u0628\u0648\u062F \u0648\u0636\u0639\u06CC\u062A \u06AF\u0631\u062F\u0646\u060C \u0634\u0627\u0646\u0647 \u0631\u0648 \u0628\u0647 \u062C\u0644\u0648 \u0648 \u0642\u0648\u0632 \u067E\u0634\u062A\u06CC.",
    category: "technique",
    duration: "02:45",
    thumbnail_url: "https://img.youtube.com/vi/V3XnZiwlqaA/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_challenge_100pushups",
    youtube_id: "vq0HXELEZj8",
    title_fa: "\u06F1\u06F0\u06F0 \u062A\u0627 \u0634\u0646\u0627 \u0633\u0648\u0626\u062F\u06CC \u067E\u0634\u062A \u0633\u0631 \u0647\u0645!",
    description_fa: "\u062A\u0645\u0631\u06CC\u0646\u0627\u062A \u0648 \u062A\u06A9\u0646\u06CC\u06A9\u200C\u0647\u0627\u06CC \u0645\u062E\u0641\u06CC \u062C\u0647\u0634 \u0639\u0635\u0628\u06CC-\u0639\u0636\u0644\u0627\u0646\u06CC \u0628\u0631\u0627\u06CC \u0627\u0641\u0632\u0627\u06CC\u0634 \u0686\u0634\u0645\u06AF\u06CC\u0631 \u062A\u0639\u062F\u0627\u062F \u0634\u0646\u0627.",
    category: "challenges",
    duration: "16:30",
    thumbnail_url: "https://img.youtube.com/vi/vq0HXELEZj8/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard"],
    featured: true
  },
  {
    id: "yt_challenge_25pullups",
    youtube_id: "-no3dx_Fa7Q",
    title_fa: "\u0686\u0637\u0648\u0631 \u0627\u0632 \u06F3 \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u0628\u0647 \u06F2\u06F5 \u062A\u0627 \u0628\u0631\u0633\u06CC\u0645!",
    description_fa: "\u0645\u062A\u062F \u0639\u0644\u0645\u06CC \u0648 \u0633\u06CC\u0633\u062A\u0645\u200C\u0647\u0627\u06CC \u062A\u0645\u0631\u06CC\u0646\u06CC \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC \u06A9\u0647 \u0628\u0627\u0639\u062B \u062C\u0647\u0634 \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u062F\u0631 \u0631\u06A9\u0648\u0631\u062F \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633 \u0645\u06CC\u200C\u0634\u0648\u062F.",
    category: "challenges",
    duration: "15:15",
    thumbnail_url: "https://img.youtube.com/vi/-no3dx_Fa7Q/hqdefault.jpg",
    related_exercise_ids: ["pullup_standard"],
    featured: true
  },
  {
    id: "yt_challenge_30day_pushup",
    youtube_id: "01Gw8TMw2uw",
    title_fa: "\u0686\u06CC \u0645\u06CC\u0634\u0647 \u0627\u06AF\u0647 \u06F3\u06F0 \u0631\u0648\u0632\u060C \u0647\u0631 \u0631\u0648\u0632 \u06F1\u06F0\u06F0 \u062A\u0627 \u0634\u0646\u0627 \u0628\u0632\u0646\u06CC\u061F",
    description_fa: "\u0628\u0631\u0631\u0633\u06CC \u0639\u0644\u0645\u06CC\u060C \u062A\u062C\u0631\u0628\u06CC \u0648 \u0622\u0646\u0627\u062A\u0648\u0645\u06CC\u06A9 \u0646\u062A\u0627\u06CC\u062C \u0648 \u0639\u0648\u0627\u0631\u0636 \u0686\u0627\u0644\u0634\u200C\u0647\u0627\u06CC \u0633\u0646\u06AF\u06CC\u0646 \u0634\u0646\u0627 \u0632\u062F\u0646 \u0631\u0648\u0632\u0627\u0646\u0647.",
    category: "challenges",
    duration: "12:40",
    thumbnail_url: "https://img.youtube.com/vi/01Gw8TMw2uw/hqdefault.jpg",
    related_exercise_ids: ["pushup_standard"],
    featured: false
  },
  {
    id: "yt_nutrition_budget",
    youtube_id: "Nk4eLcHLLu0",
    title_fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u063A\u0630\u0627\u06CC\u06CC \u0627\u0631\u0632\u0627\u0646 \u0628\u0631\u0627\u06CC \u0641\u0642\u0631 \u0645\u06A9\u0645\u0644!",
    description_fa: "\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u062C\u0627\u0645\u0639 \u062A\u063A\u0630\u06CC\u0647 \u0627\u0642\u062A\u0635\u0627\u062F\u06CC\u060C \u067E\u0631\u0648\u062A\u0626\u06CC\u0646 \u0627\u0631\u0632\u0627\u0646 \u0648 \u0631\u0698\u06CC\u0645 \u067E\u0631\u0642\u062F\u0631\u062A \u0628\u062F\u0648\u0646 \u0646\u06CC\u0627\u0632 \u0628\u0647 \u0645\u06A9\u0645\u0644\u200C\u0647\u0627\u06CC \u06AF\u0631\u0627\u0646.",
    category: "nutrition",
    duration: "18:20",
    thumbnail_url: "https://img.youtube.com/vi/Nk4eLcHLLu0/hqdefault.jpg",
    featured: true
  },
  {
    id: "yt_whey_experiment",
    youtube_id: "LWplmZZjGVo",
    title_fa: "\u06CC\u06A9 \u0633\u0627\u0644 \u0647\u0631 \u0631\u0648\u0632 \u067E\u0631\u0648\u062A\u0626\u06CC\u0646 \u0648\u06CC \u062E\u0648\u0631\u062F\u0645!",
    description_fa: "\u062A\u062C\u0631\u0628\u0647 \u0634\u062E\u0635\u06CC\u060C \u0628\u0631\u0631\u0633\u06CC \u0622\u0632\u0645\u0627\u06CC\u0634\u06AF\u0627\u0647\u06CC \u0648 \u0646\u062A\u0627\u06CC\u062C \u0648\u0627\u0642\u0639\u06CC \u0645\u0635\u0631\u0641 \u0645\u062F\u0627\u0648\u0645 \u0645\u06A9\u0645\u0644 \u067E\u0631\u0648\u062A\u0626\u06CC\u0646 \u0648\u06CC \u0637\u06CC \u06CC\u06A9 \u0633\u0627\u0644.",
    category: "nutrition",
    duration: "14:50",
    thumbnail_url: "https://img.youtube.com/vi/LWplmZZjGVo/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_no_sugar_1year",
    youtube_id: "ABrFMSaG1lA",
    title_fa: "\u062D\u0630\u0641 \u0634\u06A9\u0631 \u0628\u0647 \u0645\u062F\u062A \u06CC\u06A9 \u0633\u0627\u0644",
    description_fa: "\u0645\u0639\u062C\u0632\u0627\u062A \u0634\u06AF\u0641\u062A\u200C\u0627\u0646\u06AF\u06CC\u0632 \u0642\u0637\u0639 \u0642\u0646\u062F \u0645\u0635\u0646\u0648\u0639\u06CC \u062F\u0631 \u062A\u0631\u06A9\u06CC\u0628 \u0628\u062F\u0646\u06CC\u060C \u0686\u0631\u0628\u06CC\u200C\u0633\u0648\u0632\u06CC \u0634\u06A9\u0645 \u0648 \u0634\u0627\u062F\u0627\u0628\u06CC \u067E\u0648\u0633\u062A.",
    category: "nutrition",
    duration: "13:15",
    thumbnail_url: "https://img.youtube.com/vi/ABrFMSaG1lA/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_lifestyle_testosterone",
    youtube_id: "ACAD8vCqQLU",
    title_fa: "\u06F9 \u0631\u0627\u0647 \u0637\u0628\u06CC\u0639\u06CC \u0627\u0641\u0632\u0627\u06CC\u0634 \u062A\u0633\u062A\u0648\u0633\u062A\u0631\u0648\u0646",
    description_fa: "\u0631\u0627\u0647\u06A9\u0627\u0631\u0647\u0627\u06CC \u0639\u0644\u0645\u06CC \u0648 \u0627\u062B\u0628\u0627\u062A\u200C\u0634\u062F\u0647 \u0628\u0631\u0627\u06CC \u0627\u0641\u0632\u0627\u06CC\u0634 \u0637\u0628\u06CC\u0639\u06CC \u0647\u0648\u0631\u0645\u0648\u0646 \u0645\u0631\u062F\u0627\u0646\u0647 \u0628\u062F\u0648\u0646 \u0646\u06CC\u0627\u0632 \u0628\u0647 \u062F\u0627\u0631\u0648\u0647\u0627.",
    category: "lifestyle",
    duration: "17:40",
    thumbnail_url: "https://img.youtube.com/vi/ACAD8vCqQLU/hqdefault.jpg",
    featured: true
  },
  {
    id: "yt_lifestyle_nofap",
    youtube_id: "C5t6WxnjzcY",
    title_fa: "\u0627\u06AF\u0647 \u062E\u0648\u062F \u0627\u0631\u0636\u0627\u06CC\u06CC \u0631\u0648 \u062A\u0631\u06A9 \u06A9\u0646\u06CC \u0686\u0647 \u0627\u062A\u0641\u0627\u0642\u06CC \u0645\u06CC\u0641\u062A\u0647\u061F",
    description_fa: "\u0628\u0631\u0631\u0633\u06CC \u0639\u0644\u0645\u06CC \u062A\u0627\u062B\u06CC\u0631\u0627\u062A \u062A\u0631\u06A9 \u0639\u0627\u062F\u062A \u0628\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062F\u0648\u067E\u0627\u0645\u06CC\u0646\u060C \u0627\u0646\u0631\u0698\u06CC \u0628\u062F\u0646\u060C \u062C\u0630\u0627\u0628\u06CC\u062A \u0648 \u0639\u0645\u0644\u06A9\u0631\u062F \u0648\u0631\u0632\u0634\u06CC.",
    category: "lifestyle",
    duration: "15:10",
    thumbnail_url: "https://img.youtube.com/vi/C5t6WxnjzcY/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_lifestyle_height",
    youtube_id: "CAFRykU8wLg",
    title_fa: "\u0627\u0641\u0632\u0627\u06CC\u0634 \u0642\u062F \u062A\u0627 \u062D\u062F\u0627\u06A9\u062B\u0631 \u0698\u0646\u062A\u06CC\u06A9",
    description_fa: "\u0639\u0627\u062F\u0627\u062A \u062A\u0645\u0631\u06CC\u0646\u06CC\u060C \u0648\u0636\u0639\u06CC\u062A \u062E\u0648\u0627\u0628 \u0648 \u0631\u0698\u06CC\u0645 \u063A\u0630\u0627\u06CC\u06CC \u0628\u0631\u0627\u06CC \u062F\u0633\u062A\u200C\u06CC\u0627\u0628\u06CC \u0628\u0647 \u062D\u062F\u0627\u06A9\u062B\u0631 \u067E\u062A\u0627\u0646\u0633\u06CC\u0644 \u0631\u0634\u062F \u0642\u062F.",
    category: "lifestyle",
    duration: "11:30",
    thumbnail_url: "https://img.youtube.com/vi/CAFRykU8wLg/hqdefault.jpg",
    featured: false
  },
  {
    id: "yt_lifestyle_depression",
    youtube_id: "lM2C83O7ZcQ",
    title_fa: "\u0631\u0627\u0632 \u06F7 \u0631\u0648\u0632\u0647\u200C\u0627\u06CC \u06A9\u0647 \u0627\u0641\u0633\u0631\u062F\u06AF\u06CC \u0631\u0648 \u0646\u0627\u0628\u0648\u062F \u0645\u06CC\u06A9\u0646\u0647",
    description_fa: "\u0627\u0631\u062A\u0628\u0627\u0637 \u0639\u0645\u06CC\u0642 \u0628\u06CC\u0646 \u0633\u0644\u0627\u0645\u062A \u0631\u0648\u0627\u0646\u060C \u0641\u0639\u0627\u0644\u06CC\u062A \u0628\u062F\u0646\u06CC \u0645\u0646\u0638\u0645 \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633 \u0648 \u0631\u0641\u0639 \u0627\u0641\u0633\u0631\u062F\u06AF\u06CC \u0648 \u0628\u06CC\u200C\u0627\u0646\u06AF\u06CC\u0632\u06AF\u06CC.",
    category: "lifestyle",
    duration: "13:50",
    thumbnail_url: "https://img.youtube.com/vi/lM2C83O7ZcQ/hqdefault.jpg",
    featured: false
  }
];
function extractYouTubeVideoId(urlOrId) {
  if (!urlOrId) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(regExp);
  return match && match[2].length === 11 ? match[2] : urlOrId.trim();
}
function requireAdminAuth(req, res, next) {
  const token = req.headers["x-admin-token"] || (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "");
  if (!token || !activeSessions[token]) {
    return res.status(401).json({ error: "\u0646\u0634\u0633\u062A \u0645\u062F\u06CC\u0631\u06CC\u062A\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F." });
  }
  const session = activeSessions[token];
  if (Date.now() > session.expiresAt) {
    delete activeSessions[token];
    return res.status(401).json({ error: "\u0646\u0634\u0633\u062A \u0634\u0645\u0627 \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F\u0647 \u0627\u0633\u062A." });
  }
  req.adminUser = session.username;
  next();
}
async function startServer() {
  const app = (0, import_express3.default)();
  app.use(import_express3.default.json({ limit: "20mb" }));
  app.use((0, import_cookie_parser.default)());
  app.use("/api/v1/auth", authRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "FIT MAX | \u0641\u06CC\u062A \u0645\u06A9\u0633", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/admin/config", (req, res) => {
    res.json({ adminAccessPath: ADMIN_ACCESS_PATH });
  });
  app.get("/api/site-settings", (req, res) => {
    res.json({
      siteSettings,
      typographySettings,
      appearanceSettings,
      heroBanners: heroBanners.filter((b) => b.is_active)
    });
  });
  app.get("/api/youtube", (req, res) => {
    res.json(youtubeVideosStore);
  });
  app.get("/api/comments", (req, res) => {
    const { article_id, status } = req.query;
    let filtered = [...pendingComments];
    if (article_id) filtered = filtered.filter((c) => c.article_id === article_id);
    if (status) filtered = filtered.filter((c) => c.status === status);
    else filtered = filtered.filter((c) => c.status === "approved");
    res.json(filtered);
  });
  app.post("/api/comments", (req, res) => {
    const { article_id, user_name, content } = req.body;
    if (!article_id || !user_name || !content) {
      return res.status(400).json({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0645\u0646\u062A \u0646\u0627\u0642\u0635 \u0627\u0633\u062A." });
    }
    const newComment = {
      id: `c_${Date.now()}`,
      article_id,
      user_name,
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending"
    };
    pendingComments.push(newComment);
    res.json({ message: "\u062F\u06CC\u062F\u06AF\u0627\u0647 \u0634\u0645\u0627 \u062B\u0628\u062A \u0634\u062F \u0648 \u067E\u0633 \u0627\u0632 \u0628\u0631\u0631\u0633\u06CC \u0645\u062F\u06CC\u0631 \u0645\u0646\u062A\u0634\u0631 \u0645\u06CC\u200C\u0634\u0648\u062F.", comment: newComment });
  });
  app.post("/api/ai-coach", async (req, res) => {
    try {
      const { userQuestion, userProfile, conversationHistory } = req.body;
      if (!userQuestion) {
        return res.status(400).json({ error: "\u0633\u0648\u0627\u0644 \u06A9\u0627\u0631\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      const knowledgeContext = aiCoachKnowledge.filter((k) => k.is_active).map((k) => `[${k.title_fa}]: ${k.content_fa}`).join("\n");
      const systemInstruction = `
\u062A\u0648 \xAB\u0645\u0631\u0628\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0641\u06CC\u062A \u0645\u06A9\u0633 (FIT MAX AI COACH)\xBB\u060C \u0645\u0631\u0628\u06CC \u0631\u0633\u0645\u06CC \u067E\u0644\u062A\u0641\u0631\u0645 \u0622\u0645\u0648\u0632\u0634\u06CC \u0641\u06CC\u062A \u0645\u06A9\u0633 \u0648 \u06A9\u0627\u0646\u0627\u0644 \u06CC\u0648\u062A\u06CC\u0648\u0628 Fit Max \u0647\u0633\u062A\u06CC\u062F.

\u0648\u0638\u06CC\u0641\u0647 \u0648 \u0627\u0635\u0648\u0644 \u062A\u0648:
\u06F1. \u067E\u0627\u0633\u062E \u06A9\u0627\u0645\u0644\u0627\u064B \u0641\u0627\u0631\u0633\u06CC\u060C \u0631\u0648\u0627\u0646\u060C \u0639\u0644\u0645\u06CC\u060C \u0645\u062D\u062A\u0631\u0645\u0627\u0646\u0647\u060C \u0627\u0646\u06AF\u06CC\u0632\u0647 \u0628\u062E\u0634 \u0648 \u0635\u0645\u06CC\u0645\u06CC.
\u06F2. \u067E\u0627\u0633\u062E\u06AF\u0648\u06CC\u06CC \u0641\u0642\u0637 \u0628\u0647 \u0633\u0648\u0627\u0644\u0627\u062A \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u0641\u06CC\u062A\u0646\u0633\u060C \u06A9\u0644\u06CC\u0633\u062A\u0646\u06CC\u06A9\u0633\u060C \u0628\u062F\u0646\u0633\u0627\u0632\u06CC\u060C \u062A\u06A9\u0646\u06CC\u06A9 \u062D\u0631\u06A9\u0627\u062A\u060C \u0622\u0646\u0627\u062A\u0648\u0645\u06CC\u060C \u0628\u06CC\u0648\u0645\u06A9\u0627\u0646\u06CC\u06A9\u060C \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u062A\u0645\u0631\u06CC\u0646\u060C \u062A\u063A\u0630\u06CC\u0647 \u0648\u0631\u0632\u0634\u06CC\u060C \u0645\u062D\u0627\u0633\u0628\u0647 \u06A9\u0627\u0644\u0631\u06CC \u0648 \u0631\u06CC\u06A9\u0627\u0648\u0631\u06CC.
\u06F3. \u0631\u0627\u0647 \u0627\u0631\u062A\u0628\u0627\u0637\u06CC \u0628\u0627 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0645\u062F\u06CC\u0631\u06CC\u062A: ${siteSettings.telegramAdminHandle}.
\u06F4. \u062F\u0631 \u0635\u0648\u0631\u062A\u06CC \u06A9\u0647 \u0633\u0648\u0627\u0644 \u063A\u06CC\u0631\u0645\u0631\u062A\u0628\u0637 \u0627\u0633\u062A\u060C \u0645\u062D\u062A\u0631\u0645\u0627\u0646\u0647 \u0628\u06AF\u0648: \xAB\u0645\u0646 \u0645\u0631\u0628\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0641\u06CC\u062A \u0645\u06A9\u0633 \u0647\u0633\u062A\u0645 \u0648 \u062A\u062E\u0635\u0635\u06CC \u062F\u0631 \u0632\u0645\u06CC\u0646\u0647 \u0633\u0648\u0627\u0644\u0627\u062A \u0641\u06CC\u062A\u0646\u0633\u060C \u062A\u0645\u0631\u06CC\u0646 \u0648 \u062A\u063A\u0630\u06CC\u0647 \u0648\u0631\u0632\u0634\u06CC \u067E\u0627\u0633\u062E \u0645\u06CC\u200C\u062F\u0647\u0645.\xBB
\u06F5. \u0627\u0633\u062A\u0646\u0627\u062F \u0628\u0647 \u0627\u0635\u0648\u0644 \u0639\u0644\u0645 \u062A\u0645\u0631\u06CC\u0646 (ACSM, NSCA) \u0648 \u062F\u0627\u0646\u0634 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0632\u06CC\u0631:
${knowledgeContext}
\u06F6. \u062A\u0648\u0635\u06CC\u0647 \u0628\u0647 \u062A\u0645\u0627\u0634\u0627\u06CC \u0648\u06CC\u062F\u06CC\u0648\u0647\u0627\u06CC \u06A9\u0627\u0646\u0627\u0644 \u06CC\u0648\u062A\u06CC\u0648\u0628 Fit Max (${siteSettings.youtubeUrl}).
\u06F7. \u062E\u0637 \u0642\u0631\u0645\u0632 \u067E\u0632\u0634\u06A9\u06CC: \u0628\u0647 \u0647\u06CC\u0686 \u0648\u062C\u0647 \u0628\u06CC\u0645\u0627\u0631\u06CC \u06CC\u0627 \u0622\u0633\u06CC\u0628\u200C\u062F\u06CC\u062F\u06AF\u06CC \u0634\u062F\u06CC\u062F \u062D\u0627\u062F \u0631\u0627 \u062A\u0634\u062E\u06CC\u0635 \u0646\u062F\u0647 \u0648 \u062F\u0631 \u0635\u0648\u0631\u062A \u06AF\u0632\u0627\u0631\u0634 \u062F\u0631\u062F \u0634\u062F\u06CC\u062F \u06CC\u0627 \u0639\u0644\u0627\u0626\u0645 \u062E\u0637\u0631\u0646\u0627\u06A9\u060C \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u067E\u0632\u0634\u06A9 \u06CC\u0627 \u0645\u062A\u062E\u0635\u0635 \u0641\u06CC\u0632\u06CC\u0648\u062A\u0631\u0627\u067E\u06CC \u0627\u0631\u062C\u0627\u0639 \u0628\u062F\u0647.

\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631:
${userProfile ? JSON.stringify(userProfile) : "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0639\u0645\u0648\u0645\u06CC"}
      `;
      let promptText = `\u0633\u0648\u0627\u0644 \u06A9\u0627\u0631\u0628\u0631: ${userQuestion}`;
      if (conversationHistory && Array.isArray(conversationHistory)) {
        const historyText = conversationHistory.map((msg) => `${msg.role === "user" ? "\u06A9\u0627\u0631\u0628\u0631" : "\u0645\u0631\u0628\u06CC"}: ${msg.content}`).join("\n");
        promptText = `\u062A\u0627\u0631\u06CC\u062E\u0686\u0647 \u06AF\u0641\u062A\u06AF\u0648:
${historyText}

\u0633\u0648\u0627\u0644 \u062C\u062F\u06CC\u062F \u06A9\u0627\u0631\u0628\u0631: ${userQuestion}`;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      const reply = response.text || "\u0645\u062A\u0623\u0633\u0641\u0627\u0646\u0647 \u067E\u0627\u0633\u062E\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.";
      return res.json({ reply });
    } catch (error) {
      console.error("AI Coach Error:", error);
      return res.status(500).json({
        reply: "\u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0645\u0631\u0628\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F."
      });
    }
  });
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const inputHash = hashPassword(password);
    if (username.trim() === adminCredentials.username && inputHash === adminCredentials.passwordHash) {
      const token = import_crypto.default.randomBytes(32).toString("hex");
      activeSessions[token] = {
        username: adminCredentials.username,
        expiresAt: Date.now() + 24 * 60 * 60 * 1e3
        // 24 Hours
      };
      logAdminActivity(adminCredentials.username, "\u0648\u0631\u0648\u062F \u0628\u0647 \u0633\u06CC\u0633\u062A\u0645", "Admin Panel", "\u0648\u0631\u0648\u062F \u0645\u0648\u0641\u0642\u06CC\u062A\u200C\u0622\u0645\u06CC\u0632 \u0628\u0647 \u067E\u0646\u0644 \u0645\u062F\u06CC\u0631\u06CC\u062A");
      return res.json({
        success: true,
        token,
        username: adminCredentials.username,
        message: "\u0648\u0631\u0648\u062F \u0645\u0648\u0641\u0642\u06CC\u062A\u200C\u0622\u0645\u06CC\u0632 \u0628\u0648\u062F."
      });
    } else {
      logAdminActivity(username, "\u062A\u0644\u0627\u0634 \u0648\u0631\u0648\u062F \u0646\u0627\u0645\u0648\u0641\u0642", "Admin Panel", `\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648\u0627\u0631\u062F \u0634\u062F\u0647: ${username}`);
      return res.status(401).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A." });
    }
  });
  app.get("/api/admin/verify", requireAdminAuth, (req, res) => {
    res.json({ valid: true, username: req.adminUser });
  });
  app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    const token = req.headers["x-admin-token"] || (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "");
    if (token) delete activeSessions[token];
    logAdminActivity(req.adminUser, "\u062E\u0631\u0648\u062C \u0627\u0632 \u0633\u06CC\u0633\u062A\u0645", "Admin Panel", "\u062E\u0631\u0648\u062C \u06A9\u0627\u0645\u0644 \u0648 \u0627\u0628\u0637\u0627\u0644 \u0646\u0634\u0633\u062A");
    res.json({ success: true, message: "\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062E\u0627\u0631\u062C \u0634\u062F\u06CC\u062F." });
  });
  app.post("/api/admin/change-credentials", requireAdminAuth, (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: "\u062A\u0645\u0627\u0645 \u0641\u06CC\u0644\u062F\u0647\u0627 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    if (hashPassword(currentPassword) !== adminCredentials.passwordHash) {
      return res.status(400).json({ error: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A." });
    }
    adminCredentials.username = newUsername.trim();
    adminCredentials.passwordHash = hashPassword(newPassword);
    logAdminActivity(req.adminUser, "\u062A\u063A\u06CC\u06CC\u0631 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0631\u0648\u062F", "Admin Credentials", `\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062C\u062F\u06CC\u062F: ${newUsername}`);
    res.json({ success: true, message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0631\u0648\u062F \u0645\u062F\u06CC\u0631\u06CC\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F." });
  });
  app.get("/api/admin/dashboard-stats", requireAdminAuth, (req, res) => {
    res.json({
      totalUsers: registeredUsers.length,
      newUsers: registeredUsers.filter((u) => u.registeredAt >= "2026-02-01").length,
      totalPrograms: 8,
      activePrograms: 6,
      totalExercises: 35,
      totalArticles: 12,
      totalYoutubeVideos: youtubeVideosStore.length,
      pendingCommentsCount: pendingComments.filter((c) => c.status === "pending").length,
      totalProducts: productsCatalog.length,
      recentActivityLogs: activityLogs.slice(0, 10)
    });
  });
  app.get("/api/admin/activity-logs", requireAdminAuth, (req, res) => {
    res.json(activityLogs);
  });
  app.get("/api/admin/site-settings", requireAdminAuth, (req, res) => {
    res.json({ siteSettings, typographySettings, appearanceSettings });
  });
  app.post("/api/admin/site-settings", requireAdminAuth, (req, res) => {
    const { newSiteSettings, newTypography, newAppearance } = req.body;
    if (newSiteSettings) siteSettings = { ...siteSettings, ...newSiteSettings };
    if (newTypography) typographySettings = { ...typographySettings, ...newTypography };
    if (newAppearance) appearanceSettings = { ...appearanceSettings, ...newAppearance };
    logAdminActivity(req.adminUser, "\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0633\u0627\u06CC\u062A", "Site Settings", "\u062A\u063A\u06CC\u06CC\u0631 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0644\u06CC\u060C \u0638\u0627\u0647\u0631 \u06CC\u0627 \u0641\u0648\u0646\u062A");
    res.json({ success: true, siteSettings, typographySettings, appearanceSettings });
  });
  app.get("/api/admin/banners", requireAdminAuth, (req, res) => {
    res.json(heroBanners);
  });
  app.post("/api/admin/banners", requireAdminAuth, (req, res) => {
    const banner = req.body;
    if (!banner.id) {
      banner.id = `ban_${Date.now()}`;
      heroBanners.push(banner);
      logAdminActivity(req.adminUser, "\u0627\u06CC\u062C\u0627\u062F \u0628\u0646\u0631 \u062C\u062F\u06CC\u062F", banner.title_fa, `\u0634\u0646\u0627\u0633\u0647: ${banner.id}`);
    } else {
      const idx = heroBanners.findIndex((b) => b.id === banner.id);
      if (idx !== -1) heroBanners[idx] = banner;
      else heroBanners.push(banner);
      logAdminActivity(req.adminUser, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0628\u0646\u0631", banner.title_fa, `\u0634\u0646\u0627\u0633\u0647: ${banner.id}`);
    }
    res.json({ success: true, heroBanners });
  });
  app.delete("/api/admin/banners/:id", requireAdminAuth, (req, res) => {
    heroBanners = heroBanners.filter((b) => b.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u0628\u0646\u0631", req.params.id, "\u0628\u0646\u0631 \u0627\u0632 \u0633\u06CC\u0633\u062A\u0645 \u062D\u0630\u0641 \u0634\u062F");
    res.json({ success: true, heroBanners });
  });
  app.get("/api/admin/media", requireAdminAuth, (req, res) => {
    res.json(mediaFiles);
  });
  app.post("/api/admin/media", requireAdminAuth, (req, res) => {
    const { filename, folder, url, alt_text, size_kb } = req.body;
    if (!filename || !folder || !url) {
      return res.status(400).json({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062A\u0635\u0648\u06CC\u0631 \u0646\u0627\u0642\u0635 \u0627\u0633\u062A." });
    }
    const newMedia = {
      id: `med_${Date.now()}`,
      filename,
      folder,
      url,
      alt_text: alt_text || filename,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      size_kb: size_kb || 150
    };
    mediaFiles.unshift(newMedia);
    logAdminActivity(req.adminUser, "\u0622\u067E\u0644\u0648\u062F \u0648 \u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u0635\u0648\u06CC\u0631", filename, `\u067E\u0648\u0634\u0647: /images/${folder}`);
    res.json({ success: true, media: newMedia, mediaFiles });
  });
  app.delete("/api/admin/media/:id", requireAdminAuth, (req, res) => {
    mediaFiles = mediaFiles.filter((m) => m.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u062A\u0635\u0648\u06CC\u0631", req.params.id, "\u062A\u0635\u0648\u06CC\u0631 \u0627\u0632 \u06AF\u0627\u0644\u0631\u06CC \u0631\u0633\u0627\u0646\u0647 \u062D\u0630\u0641 \u0634\u062F");
    res.json({ success: true, mediaFiles });
  });
  app.get("/api/admin/pages", requireAdminAuth, (req, res) => {
    res.json(pagesContent);
  });
  app.post("/api/admin/pages", requireAdminAuth, (req, res) => {
    const { page_slug, pageData } = req.body;
    if (page_slug && pageData) {
      pagesContent[page_slug] = pageData;
      logAdminActivity(req.adminUser, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u062D\u062A\u0648\u0627\u06CC \u0635\u0641\u062D\u0647", page_slug, `\u0639\u0646\u0648\u0627\u0646: ${pageData.page_title_fa}`);
    }
    res.json({ success: true, pagesContent });
  });
  app.get("/api/admin/comments", requireAdminAuth, (req, res) => {
    res.json(pendingComments);
  });
  app.post("/api/admin/comments/status", requireAdminAuth, (req, res) => {
    const { comment_id, status } = req.body;
    const comment = pendingComments.find((c) => c.id === comment_id);
    if (comment) {
      comment.status = status;
      logAdminActivity(req.adminUser, "\u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u062F\u06CC\u062F\u06AF\u0627\u0647", comment_id, `\u0648\u0636\u0639\u06CC\u062A \u062C\u062F\u06CC\u062F: ${status}`);
      return res.json({ success: true, comment, comments: pendingComments });
    }
    res.status(404).json({ error: "\u062F\u06CC\u062F\u06AF\u0627\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  });
  app.delete("/api/admin/comments/:id", requireAdminAuth, (req, res) => {
    pendingComments = pendingComments.filter((c) => c.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u062F\u06CC\u062F\u06AF\u0627\u0647", req.params.id, "\u062F\u06CC\u062F\u06AF\u0627\u0647 \u06A9\u0627\u0631\u0628\u0631 \u062D\u0630\u0641 \u0634\u062F");
    res.json({ success: true, comments: pendingComments });
  });
  app.get("/api/admin/youtube", requireAdminAuth, (req, res) => {
    res.json(youtubeVideosStore);
  });
  app.post("/api/admin/youtube", requireAdminAuth, (req, res) => {
    const videoData = req.body;
    videoData.youtube_id = extractYouTubeVideoId(videoData.youtube_id || videoData.url || "");
    if (!videoData.id) {
      videoData.id = `yt_${Date.now()}`;
      youtubeVideosStore.unshift(videoData);
      logAdminActivity(req.adminUser, "\u0627\u0641\u0632\u0648\u062F\u0646 \u0648\u06CC\u062F\u06CC\u0648\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628", videoData.title_fa, `YouTube ID: ${videoData.youtube_id}`);
    } else {
      const idx = youtubeVideosStore.findIndex((v) => v.id === videoData.id);
      if (idx !== -1) youtubeVideosStore[idx] = videoData;
      else youtubeVideosStore.unshift(videoData);
      logAdminActivity(req.adminUser, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0648\u06CC\u062F\u06CC\u0648\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628", videoData.title_fa, `\u0634\u0646\u0627\u0633\u0647: ${videoData.id}`);
    }
    res.json({ success: true, youtubeVideos: youtubeVideosStore });
  });
  app.delete("/api/admin/youtube/:id", requireAdminAuth, (req, res) => {
    youtubeVideosStore = youtubeVideosStore.filter((v) => v.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u0648\u06CC\u062F\u06CC\u0648\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628", req.params.id, "\u0648\u06CC\u062F\u06CC\u0648 \u062D\u0630\u0641 \u0634\u062F");
    res.json({ success: true, youtubeVideos: youtubeVideosStore });
  });
  app.get("/api/admin/products", requireAdminAuth, (req, res) => {
    res.json(productsCatalog);
  });
  app.post("/api/admin/products", requireAdminAuth, (req, res) => {
    const prod = req.body;
    if (!prod.id) {
      prod.id = `prod_${Date.now()}`;
      productsCatalog.push(prod);
      logAdminActivity(req.adminUser, "\u0627\u06CC\u062C\u0627\u062F \u0645\u062D\u0635\u0648\u0644 \u062C\u062F\u06CC\u062F", prod.title_fa, `\u0642\u06CC\u0645\u062A: ${prod.price_toman} \u062A\u0648\u0645\u0627\u0646`);
    } else {
      const idx = productsCatalog.findIndex((p) => p.id === prod.id);
      if (idx !== -1) productsCatalog[idx] = prod;
      else productsCatalog.push(prod);
      logAdminActivity(req.adminUser, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u062D\u0635\u0648\u0644", prod.title_fa, `\u0642\u06CC\u0645\u062A: ${prod.price_toman} \u062A\u0648\u0645\u0627\u0646`);
    }
    res.json({ success: true, products: productsCatalog });
  });
  app.delete("/api/admin/products/:id", requireAdminAuth, (req, res) => {
    productsCatalog = productsCatalog.filter((p) => p.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u0645\u062D\u0635\u0648\u0644", req.params.id, "\u0645\u062D\u0635\u0648\u0644 \u0627\u0632 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062D\u0630\u0641 \u0634\u062F");
    res.json({ success: true, products: productsCatalog });
  });
  app.get("/api/admin/ai-coach-knowledge", requireAdminAuth, (req, res) => {
    res.json(aiCoachKnowledge);
  });
  app.post("/api/admin/ai-coach-knowledge", requireAdminAuth, (req, res) => {
    const item = req.body;
    if (!item.id) {
      item.id = `ak_${Date.now()}`;
      aiCoachKnowledge.push(item);
      logAdminActivity(req.adminUser, "\u0627\u0641\u0632\u0648\u062F\u0646 \u0645\u0646\u0628\u0639 \u062F\u0627\u0646\u0634 AI", item.title_fa, `\u062F\u0633\u062A\u0647: ${item.category}`);
    } else {
      const idx = aiCoachKnowledge.findIndex((k) => k.id === item.id);
      if (idx !== -1) aiCoachKnowledge[idx] = item;
      else aiCoachKnowledge.push(item);
      logAdminActivity(req.adminUser, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u062F\u0627\u0646\u0634 AI", item.title_fa, `\u0634\u0646\u0627\u0633\u0647: ${item.id}`);
    }
    res.json({ success: true, aiCoachKnowledge });
  });
  app.delete("/api/admin/ai-coach-knowledge/:id", requireAdminAuth, (req, res) => {
    aiCoachKnowledge = aiCoachKnowledge.filter((k) => k.id !== req.params.id);
    logAdminActivity(req.adminUser, "\u062D\u0630\u0641 \u0645\u0646\u0628\u0639 \u062F\u0627\u0646\u0634 AI", req.params.id, "\u0645\u0646\u0628\u0639 \u0622\u0645\u0648\u0632\u0634\u06CC AI \u062D\u0630\u0641 \u06AF\u0631\u062F\u06CC\u062F");
    res.json({ success: true, aiCoachKnowledge });
  });
  app.get("/api/admin/users", requireAdminAuth, (req, res) => {
    res.json(registeredUsers);
  });
  app.post("/api/admin/users/status", requireAdminAuth, (req, res) => {
    const { user_id, status } = req.body;
    const usr = registeredUsers.find((u) => u.id === user_id);
    if (usr) {
      usr.status = status;
      logAdminActivity(req.adminUser, "\u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631", user_id, `\u0648\u0636\u0639\u06CC\u062A \u062C\u062F\u06CC\u062F: ${status}`);
      return res.json({ success: true, users: registeredUsers });
    }
    res.status(404).json({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  });
  app.get("/api/admin/export", requireAdminAuth, (req, res) => {
    const fullBackup = {
      siteSettings,
      typographySettings,
      appearanceSettings,
      heroBanners,
      pagesContent,
      pendingComments,
      mediaFiles,
      aiCoachKnowledge,
      productsCatalog,
      youtubeVideosStore,
      registeredUsers,
      activityLogs,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    logAdminActivity(req.adminUser, "\u062F\u0627\u0646\u0644\u0648\u062F \u0628\u06A9\u200C\u0622\u067E \u06A9\u0627\u0645\u0644", "Database Backup", "\u062E\u0631\u0648\u062C\u06CC JSON \u06AF\u0631\u0641\u062A\u0647 \u0634\u062F");
    res.setHeader("Content-Disposition", "attachment; filename=fitmax_backup.json");
    res.json(fullBackup);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express3.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fit Max Server running on http://localhost:${PORT}`);
    console.log(`Admin Secret Path configured at: http://localhost:${PORT}${ADMIN_ACCESS_PATH}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
