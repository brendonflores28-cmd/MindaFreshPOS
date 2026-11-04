// pos/routes/index.js — every page and the roles that may open it.
// cashier: sell + sales. inventory_staff: stock, suppliers, purchase orders. admin: everything + products.
import express from "express";
import { requireRole } from "../middleware/requireRole.js";
import { loginPage, loginUser, logoutUser, homeFor } from "../controllers/authController.js";
import { dashboard } from "../controllers/dashboardController.js";
import { cashierPage, checkoutSale, listSales, showSale, voidSaleAction } from "../controllers/saleController.js";
import { listProducts, newProduct, createProduct, editProduct, updateProduct, toggleProduct, listCategories, saveCategory } from "../controllers/productController.js";
import { stockList, adjustForm, adjustSave, movements } from "../controllers/inventoryController.js";
import { listSuppliers, newSupplier, createSupplier, editSupplier, updateSupplier, toggleSupplier } from "../controllers/supplierController.js";
import { listOrders, newOrder, createOrderAction, showOrder, editOrder, updateOrderAction, placeOrderAction, cancelOrderAction, receiveOrderAction } from "../controllers/purchaseController.js";

const router = express.Router();
// Express 4 does not catch rejected promises: pass them to the error page.
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ANY = requireRole("admin", "cashier", "inventory_staff");
const SELL = requireRole("admin", "cashier");
const STOCK = requireRole("admin", "inventory_staff");
const ADMIN = requireRole("admin");

router.get("/", (req, res) => res.redirect(req.session.user ? homeFor(req.session.user.role) : "/login"));
router.get("/login", loginPage);
router.post("/login", a(loginUser));
router.get("/logout", logoutUser);
router.post("/logout", logoutUser);

router.get("/dashboard", ANY, a(dashboard));

// Sales (cashier)
router.get("/pos", SELL, a(cashierPage));
router.post("/pos/checkout", SELL, a(checkoutSale));
router.get("/sales", SELL, a(listSales));
router.get("/sales/:id", SELL, a(showSale));
router.post("/sales/:id/void", SELL, a(voidSaleAction));

// Products and categories (admin)
router.get("/products", ADMIN, a(listProducts));
router.get("/products/new", ADMIN, a(newProduct));
router.post("/products", ADMIN, a(createProduct));
router.get("/products/:id/edit", ADMIN, a(editProduct));
router.post("/products/:id", ADMIN, a(updateProduct));
router.post("/products/:id/toggle", ADMIN, a(toggleProduct));
router.get("/categories", ADMIN, a(listCategories));
router.post("/categories", ADMIN, a(saveCategory));
router.post("/categories/:id", ADMIN, a(saveCategory));

// Inventory
router.get("/inventory", STOCK, a(stockList));
router.get("/inventory/adjust", STOCK, a(adjustForm));
router.post("/inventory/adjust", STOCK, a(adjustSave));
router.get("/inventory/movements", STOCK, a(movements));

// Suppliers
router.get("/suppliers", STOCK, a(listSuppliers));
router.get("/suppliers/new", STOCK, newSupplier);
router.post("/suppliers", STOCK, a(createSupplier));
router.get("/suppliers/:id/edit", STOCK, a(editSupplier));
router.post("/suppliers/:id", STOCK, a(updateSupplier));
router.post("/suppliers/:id/toggle", STOCK, a(toggleSupplier));

// Purchase orders
router.get("/purchases", STOCK, a(listOrders));
router.get("/purchases/new", STOCK, a(newOrder));
router.post("/purchases", STOCK, a(createOrderAction));
router.get("/purchases/:id", STOCK, a(showOrder));
router.get("/purchases/:id/edit", STOCK, a(editOrder));
router.post("/purchases/:id", STOCK, a(updateOrderAction));
router.post("/purchases/:id/place", STOCK, a(placeOrderAction));
router.post("/purchases/:id/receive", STOCK, a(receiveOrderAction));
router.post("/purchases/:id/cancel", STOCK, a(cancelOrderAction));

export default router;
