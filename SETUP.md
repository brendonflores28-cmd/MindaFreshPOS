# MindaFresh ERP — Setup for each module

Everyone uses **Laragon + phpMyAdmin** and one shared database, `mindafresh_db`.

## 1. Database (your own copy, for working at home)

1. Laragon → **Start All**. In the Laragon Terminal, `mysql --version` must be 8.0.16 or newer.
2. phpMyAdmin (right-click Laragon → Tools → Quick add → phpMyAdmin) → http://localhost/phpmyadmin, user `root`, empty password.
3. Click the phpMyAdmin logo → **Import** `shared/database/schema.sql`, then **Import** `shared/database/seed.sql`.
4. **SQL** tab:
   ```sql
   CREATE USER 'mindafresh'@'localhost' IDENTIFIED BY 'MindaFresh@2026';
   GRANT ALL PRIVILEGES ON mindafresh_db.* TO 'mindafresh'@'localhost';
   FLUSH PRIVILEGES;
   ```
5. Check: `mindafresh_db` → **products** → **Browse** shows 10 products.

## 2. Your module

Extract this folder to `C:\laragon\www\mindafresh-erp`, then in the Laragon Terminal:

```
cd C:\laragon\www\mindafresh-erp
xianfires new pos
```
(`pos`, `attendance`, `hr` or `accounting`; answers: **With CRUD Functions**, **MySQL**, **No**, **No**)

**Important — the generated app can delete our shared tables:**
- Copy `module-template\migrate.js` and `module-template\create.js` into your module, replacing the generated ones (the originals call `sequelize.sync()`).
- Delete the line `await sequelize.sync();` from your module's `controllers\authController.js`.
- Never call `sequelize.sync()` anywhere. Tables come only from `shared/database/schema.sql`.

Then, in your module folder:
```
npm install
npm install dotenv
```
Copy `module-template\.env.example` into your module as `.env` and set `PORT` and `APP_NAME`.

**Same look as the other modules** (colours and font from the shared `head.xian`):
- Copy `module-template\tailwind.config.js` into your module.
- Copy the `module-template\public` folder into your module (merge with your `public` folder).
- In your module folder:
  ```
  npm install -D tailwindcss@3.4.17
  npx tailwindcss -i ./public/css/input.css -o ./public/css/app.css --watch
  ```
  Leave that running while you work: it rebuilds `public/css/app.css` every time you save a `.xian` view. Use the shared classes `btn-primary`, `btn-outline`, `card`, `field`, `label`, `badge`, and the colours `brand`, `ink`, `peach`, `cream`.
- Your views start with `{{> head}}` and end with `{{> footer}}`.

## 3. Check the connection

From `C:\laragon\www\mindafresh-erp`:
```
node shared\sync.js
node shared\check-connection.js pos
```
It should end with `✓ pos is connected to the shared database.` Every ✗ prints its fix.

`node shared\sync.js` copies the shared files (config, models, services, middleware, utils, views/partials) into your module. Run it after every update to `shared/`, and never edit the copies inside your module.

## 4. Joint tests

Everyone joins the same Wi-Fi. The DB host (Ali) posts their IP; change `DB_HOST` in your `.env` to it and restart your app.

| Module | Member | Port |
|---|---|---|
| Online Shop | Ali | 3001 |
| POS (with Inventory and Purchasing) | Bren | 3002 |
| Attendance | Brian | 3003 |
| HR | Fate | 3004 |
| Accounting & Finance | Jean | 3005 |
