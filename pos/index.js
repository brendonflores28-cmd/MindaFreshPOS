// MindaFresh POS (with Inventory and Purchasing) — Bren — port 3002
// Shared database mindafresh_db. Never call sequelize.sync(): tables come only from shared/database/schema.sql.
import "dotenv/config";
import path from "path";
import express from "express";
import session from "express-session";
import flash from "connect-flash";
import { engine } from "express-handlebars";
import { sequelize } from "./config/database.js";
import { helpers } from "./helpers/handlebars.js";
import router from "./routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const APP_NAME = process.env.APP_NAME || "MindaFresh POS";

app.engine("xian", engine({
  extname: ".xian",
  defaultLayout: false,
  partialsDir: path.join(process.cwd(), "views", "partials"),
  helpers
}));
app.set("view engine", "xian");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "pos-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 10 } // one store day
}));
app.use(flash());
app.get("/favicon.ico", (req, res) => res.status(204).end()); // so it never eats a flash message

app.use((req, res, next) => {
  const user = req.session.user || null;
  res.locals.appName = APP_NAME;
  res.locals.currentUser = user;
  res.locals.isAdmin = user?.role === "admin";
  res.locals.canSell = ["admin", "cashier"].includes(user?.role);
  res.locals.canStock = ["admin", "inventory_staff"].includes(user?.role);
  res.locals.currentPath = req.path;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

app.use("/", router);

app.use((req, res) => res.status(404).render("error", { title: "Not found", heading: "Page not found", message: `There is no page at ${req.path}.` }));

// "Database is offline": the DB host slept or MySQL stopped. Pages recover on reload once it is back.
app.use((err, req, res, next) => {
  console.error(err);
  const offline = /Sequelize(Connection|ConnectionRefused|HostNotFound|HostNotReachable|ConnectionTimedOut|ConnectionAcquireTimeout|AccessDenied)Error/.test(err.name);
  res.status(offline ? 503 : 500).render("error", {
    title: offline ? "Database is offline" : "Error",
    heading: offline ? "Database is offline" : "Something went wrong",
    message: offline
      ? `Cannot reach the shared database at ${process.env.DB_HOST}:${process.env.DB_PORT}. Check that the DB host is awake and Laragon is running, then reload.`
      : err.message
  });
});

app.listen(PORT, async () => {
  console.log(`${APP_NAME} running at http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log(`✓ Connected to ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  } catch (e) {
    console.log(`✗ Database not reachable yet (${e.message}). Run: node ../shared/check-connection.js pos`);
  }
});
