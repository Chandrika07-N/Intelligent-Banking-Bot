// SQLite layer (built-in node:sqlite, Node >= 22.13). Sample data only.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'bankbot.db'));
db.exec(`CREATE TABLE IF NOT EXISTS customer(id INTEGER PRIMARY KEY,name TEXT,account_no TEXT,account_type TEXT,balance REAL,ifsc TEXT,branch TEXT,monthly_income REAL,credit_score INTEGER,existing_emi REAL,loan_status TEXT);
CREATE TABLE IF NOT EXISTS transactions(id TEXT PRIMARY KEY,date TEXT,description TEXT,amount REAL,type TEXT);`);
if (!db.prepare('SELECT COUNT(*) c FROM customer').get().c) {
  db.prepare('INSERT INTO customer VALUES(1,?,?,?,?,?,?,?,?,?,?)').run('Priya Sharma','XXXXXXXX4821','Savings Account',148562.75,'BBOT0001024','Kukatpally Branch, Hyderabad',65000,742,12000,'No active loan');
  const t = [['2026-11-05','Salary Credit - Acme Tech',65000,'Credit'],['2026-11-04','UPI - Big Bazaar',-2340.5,'Debit'],['2026-11-03','Electricity Bill - TSSPDCL',-1860,'Debit'],['2026-11-02','ATM Withdrawal - Kukatpally',-5000,'Debit'],['2026-10-31','Interest Credit',412.25,'Credit'],['2026-10-29','NEFT - Rent to Landlord',-18000,'Debit'],['2026-10-27','UPI - Swiggy',-649,'Debit'],['2026-10-25','Mutual Fund SIP',-5000,'Debit'],['2026-10-22','IMPS from Ravi Kumar',3500,'Credit'],['2026-10-20','Amazon Purchase - Card',-4299,'Debit'],['2026-10-18','Mobile Recharge',-299,'Debit'],['2026-10-15','Freelance Payment',12000,'Credit'],['2026-10-12','UPI - Metro Card Top-up',-500,'Debit'],['2026-10-08','Insurance Premium',-3250,'Debit'],['2026-10-05','Salary Credit - Acme Tech',65000,'Credit']];
  const ins = db.prepare('INSERT INTO transactions VALUES(?,?,?,?,?)');
  t.forEach((x, i) => ins.run('TXN' + (900120 - i), ...x));
}
module.exports = {
  customer: () => db.prepare('SELECT * FROM customer WHERE id=1').get(),
  transactions: (q = '', type = '') => db.prepare(`SELECT * FROM transactions WHERE (description LIKE ? OR id LIKE ?) AND (?='' OR type=?) ORDER BY date DESC,id DESC`).all(`%${q}%`, `%${q}%`, type, type),
};
