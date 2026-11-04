// Handlebars helpers for the POS .xian views.
import { peso, round2 } from "../utils/money.js";
import { manilaDateTime, manilaDate } from "../utils/dates.js";

const BADGES = {
  completed: "bg-leaf-bg text-leaf", received: "bg-leaf-bg text-leaf", active: "bg-leaf-bg text-leaf", posted: "bg-leaf-bg text-leaf",
  voided: "bg-danger-bg text-danger", cancelled: "bg-danger-bg text-danger", inactive: "bg-danger-bg text-danger", low: "bg-danger-bg text-danger",
  ordered: "bg-sky-bg text-sky", draft: "bg-peach text-ink", pending: "bg-peach text-ink",
  opening: "bg-peach text-ink", stock_in: "bg-leaf-bg text-leaf", sale: "bg-sky-bg text-sky",
  online_order: "bg-sky-bg text-sky", adjustment: "bg-peach text-ink", return: "bg-leaf-bg text-leaf"
};

export const helpers = {
  peso: (n) => peso(n),
  money: (n) => round2(n || 0).toFixed(2),
  dateTime: (d) => manilaDateTime(d),
  date: (d) => (d && typeof d !== "object" || d instanceof Date ? manilaDate(d) : ""),
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => String(a) !== String(b),
  gt: (a, b) => Number(a) > Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),
  and: (...args) => args.slice(0, -1).every(Boolean),
  or: (...args) => args.slice(0, -1).some(Boolean),
  not: (a) => !a,
  inc: (n) => Number(n) + 1,
  sub: (a, b) => Number(a) - Number(b),
  label: (s) => String(s ?? "").replace(/_/g, " "),
  badge: (s) => BADGES[s] || "bg-peach-soft text-ink",
  signed: (n) => (Number(n) > 0 ? `+${n}` : String(n)),
  startsWith: (s, prefix) => String(s ?? "").startsWith(prefix),
  // Safe JSON for <script> blocks
  json: (v) => JSON.stringify(v ?? null).replace(/</g, "\\u003c")
};
