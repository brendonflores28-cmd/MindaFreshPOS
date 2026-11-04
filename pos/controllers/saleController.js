// pos/controllers/saleController.js — cashier screen, checkout, sales list, receipt, void.
import { Op } from "sequelize";
import { sequelize, Product, Category, StockLevel, Sale, SaleItem, Employee, StockMovement } from "../models/index.js";
import { checkout, voidSale } from "../services/saleService.js";
import { manilaDate } from "../utils/dates.js";
import { round2 } from "../utils/money.js";
import { dayRange } from "./dashboardController.js";

const userErr = (e) => e.name === "AppError";

export const cashierPage = async (req, res) => {
  const products = await Product.findAll({
    where: { status: "active" },
    include: [{ model: Category, attributes: ["name"] }, { model: StockLevel, attributes: ["quantity_on_hand"] }],
    order: [["name", "ASC"]]
  });
  const list = products.map((p) => ({
    id: p.id, code: p.product_code, name: p.name, unit: p.unit, price: Number(p.selling_price),
    category: p.Category?.name || "", stock: p.StockLevel?.quantity_on_hand ?? 0
  }));
  const categories = [...new Set(list.map((p) => p.category))].sort();
  res.render("pos", { title: "Cashier", products: list, categories });
};

export const checkoutSale = async (req, res, next) => {
  let cart;
  try { cart = JSON.parse(req.body.cart || "[]"); } catch { cart = []; }
  try {
    const sale = await checkout({
      cart,
      discount: Number(req.body.discount || 0),
      payment_method: req.body.payment_method,
      amount_paid: Number(req.body.amount_paid || 0),
      employee_id: req.session.user.employee_id
    });
    req.flash("success_msg", `${sale.sale_code} saved. Change: ₱${Number(sale.change_amount).toFixed(2)}`);
    res.redirect(`/sales/${sale.id}?print=1`);
  } catch (e) {
    if (!userErr(e)) return next(e);
    req.flash("error_msg", e.message);
    res.redirect("/pos");
  }
};

export const listSales = async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "") ? req.query.date : manilaDate();
  const where = { sold_at: dayRange(date) };
  if (["completed", "voided"].includes(req.query.status)) where.status = req.query.status;
  if (req.session.user.role === "cashier" && req.query.mine === "1") where.employee_id = req.session.user.employee_id;
  const sales = await Sale.findAll({
    where, include: [{ model: Employee, attributes: ["first_name", "last_name"] }],
    order: [["sold_at", "DESC"]], raw: true, nest: true
  });
  const done = sales.filter((s) => s.status === "completed");
  const total = round2(done.reduce((s, x) => s + Number(x.total_amount), 0));
  res.render("sales/index", { title: "Sales", sales, date, status: req.query.status || "", total, count: done.length });
};

// Has Accounting already posted this sale? (read-only look at Jean's journal_entries)
async function accountingStatus(sale) {
  const [rows] = await sequelize.query(
    `SELECT entry_code, entry_type FROM journal_entries
      WHERE source_module = 'pos' AND reference_code = :code AND status = 'posted'`,
    { replacements: { code: sale.sale_code } });
  return {
    sale: rows.find((r) => r.entry_type === "sale")?.entry_code || null,
    reversal: rows.find((r) => r.entry_type === "sale_reversal")?.entry_code || null
  };
}

export const showSale = async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: SaleItem }, { model: Employee, attributes: ["first_name", "last_name", "employee_code"] }]
  });
  if (!sale) return res.status(404).render("error", { title: "Not found", heading: "Sale not found", message: "That sale does not exist." });
  const movements = await StockMovement.findAll({ where: { sale_id: sale.id }, order: [["id", "ASC"]], raw: true });
  res.render("sales/show", {
    title: sale.sale_code, sale: sale.get({ plain: true }), movements,
    acct: await accountingStatus(sale), autoPrint: req.query.print === "1"
  });
};

export const voidSaleAction = async (req, res, next) => {
  try {
    const sale = await voidSale({ sale_id: req.params.id, reason: req.body.reason, employee_id: req.session.user.employee_id });
    req.flash("success_msg", `${sale.sale_code} voided. The stock was put back.`);
  } catch (e) {
    if (!userErr(e)) return next(e);
    req.flash("error_msg", e.message);
  }
  res.redirect(`/sales/${req.params.id}`);
};
