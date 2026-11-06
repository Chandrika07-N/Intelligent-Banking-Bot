const express = require('express');
const path = require('path');
const db = require('./db');
const { infer, evaluateLoan, validateLoan, SUGGESTIONS } = require('./engine');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const wrap = fn => (req, res) => { try { fn(req, res); } catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong. Please try again.' }); } };

app.get('/api/customer', wrap((q, r) => r.json(db.customer())));
app.get('/api/overview', wrap((q, r) => { const c = db.customer(); const t = db.transactions(); r.json({ customer: c, totalTransactions: t.length, credits: t.filter(x => x.amount > 0).length, debits: t.filter(x => x.amount < 0).length, loanStatus: c.loan_status, services: 8 }); }));
app.get('/api/transactions', wrap((q, r) => r.json(db.transactions(String(q.query.q || ''), ['Credit', 'Debit'].includes(q.query.type) ? q.query.type : ''))));
app.get('/api/suggestions', wrap((q, r) => r.json(SUGGESTIONS)));
app.post('/api/chat', wrap((q, r) => {
  const text = String(q.body.message || '').trim();
  if (!text) return r.status(400).json({ error: 'Please type a question.' });
  if (text.length > 300) return r.status(400).json({ error: 'Message too long (max 300 characters).' });
  r.json(infer(text, db.customer(), db));
}));
app.post('/api/loan', wrap((q, r) => { const e = validateLoan(q.body); if (Object.keys(e).length) return r.status(400).json({ error: 'Please fix the highlighted fields.', fields: e }); r.json(evaluateLoan(q.body)); }));
app.post('/api/transfer', wrap((q, r) => { // DEMO ONLY - nothing is moved or stored
  const { payee, amount, method } = q.body, c = db.customer(), e = {};
  if (!payee || String(payee).trim().length < 3) e.payee = 'Enter a payee name or UPI ID.';
  if (!(+amount > 0)) e.amount = 'Amount must be greater than 0.'; else if (+amount > c.balance) e.amount = 'Amount exceeds available balance.';
  if (!['UPI', 'NEFT', 'IMPS'].includes(method)) e.method = 'Choose UPI, NEFT or IMPS.';
  if (Object.keys(e).length) return r.status(400).json({ error: 'Please fix the highlighted fields.', fields: e });
  r.json({ message: `DEMO: ${method} transfer of ₹${(+amount).toLocaleString('en-IN')} to ${payee} simulated. No real money was moved.`, reference: 'DEMO' + Date.now().toString().slice(-8) });
}));
app.post('/api/block-card', wrap((q, r) => r.json({ message: 'DEMO: your debit card ending 4821 is shown as blocked in this simulation. No real card was affected. Contact official bank support for a real block.' })));
app.use('/api', (q, r) => r.status(404).json({ error: 'Not found' }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BankBot running at http://localhost:${PORT}`));
