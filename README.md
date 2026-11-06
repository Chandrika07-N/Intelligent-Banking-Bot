# BankBot – Intelligent Banking Assistant (Rule-Based Expert System)
## Run
Requires Node.js >= 22.13 (uses built-in `node:sqlite`).
    npm install
    npm start        # http://localhost:3000
    npm test         # tests the expert system + DB (no network needed)
## Structure
- engine.js  – Knowledge Base (IF-THEN rules R0–R14), Inference Engine (`infer`), Working Memory (`memory`), Explanation Facility (`explanation`), loan rules R3/R4/R5
- db.js      – SQLite schema + sample data (auto-created as bankbot.db)
- server.js  – Express REST API (/api/chat, /api/loan, /api/transactions, /api/transfer, ...)
- public/    – index.html, style.css, app.js (7 pages, hash-routed)
All data is simulated. Transfers and card blocking are demos only.
