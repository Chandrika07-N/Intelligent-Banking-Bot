const $ = s => document.querySelector(s), view = $('#view');
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<i>$1</i>').replace(/\n/g, '<br>');
const api = async (u, body) => { const r = await fetch('/api' + u, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined); const d = await r.json().catch(() => ({ error: 'Server error' })); if (!r.ok) throw d; return d; };
const toast = (m, bad) => { const t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' error' : ''); setTimeout(() => t.className = '', 3500); };
const icons = () => window.lucide && lucide.createIcons();
const NAV = [['dashboard', 'layout-dashboard', 'Dashboard'], ['chat', 'message-circle', 'Banking Chatbot'], ['account', 'user-round', 'Account Details'], ['transactions', 'arrow-left-right', 'Transactions'], ['loan', 'badge-indian-rupee', 'Loan Eligibility'], ['services', 'briefcase', 'Banking Services'], ['help', 'life-buoy', 'Help & Support']];
$('#nav').innerHTML = NAV.map(([k, i, l]) => `<a href="#${k}" data-k="${k}"><i data-lucide="${i}"></i>${l}</a>`).join('');
$('#menu').onclick = () => document.body.classList.toggle('open'); $('#scrim').onclick = () => document.body.classList.remove('open');
const goChat = q => { sessionStorage.bbPending = q; location.hash = 'chat'; };
const tbl = rows => `<div class="tw"><table><tr><th>ID</th><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>${rows.length ? rows.map(t => `<tr><td>${t.id}</td><td>${t.date}</td><td>${esc(t.description)}</td><td>${t.amount < 0 ? '-' : '+'}${inr(Math.abs(t.amount))}</td><td><span class="pill ${t.type}">${t.type}</span></td></tr>`).join('') : '<tr><td colspan="5">No transactions match your search.</td></tr>'}</table></div>`;

const views = {
  async dashboard() {
    const o = await api('/overview'), c = o.customer;
    view.innerHTML = `<div class="hero"><div class="eyebrow">Rule-based expert system</div><h1>Your Banking, <span>Made Simple.</span></h1><p>Meet your intelligent banking assistant. Get instant answers to your banking questions.</p><br><button class="btn" id="go">Start Chatting <i data-lucide="arrow-right"></i></button></div>
    <h2>Quick overview</h2><div class="grid">
    <div class="card"><i data-lucide="wallet"></i><small>Account Balance</small><div class="v">${inr(c.balance)}</div></div>
    <div class="card"><i data-lucide="arrow-left-right"></i><small>Total Transactions</small><div class="v">${o.totalTransactions}</div><small>${o.credits} credits · ${o.debits} debits</small></div>
    <div class="card"><i data-lucide="landmark"></i><small>Loan Status</small><div class="v" style="font-size:19px">${esc(o.loanStatus)}</div></div>
    <div class="card"><i data-lucide="briefcase"></i><small>Banking Services</small><div class="v">${o.services}</div></div></div>
    <h2>Quick actions</h2><div class="grid">${[['Check Balance', 'wallet', () => goChat('What is my account balance?')], ['View Transactions', 'list', () => location.hash = 'transactions'], ['Check Loan Eligibility', 'badge-indian-rupee', () => location.hash = 'loan'], ['Contact Support', 'headphones', () => location.hash = 'help']].map(([l, i], n) => `<button class="card q" data-a="${n}"><i data-lucide="${i}"></i><b>${l}</b></button>`).join('')}</div>`;
    const acts = [() => goChat('What is my account balance?'), () => location.hash = 'transactions', () => location.hash = 'loan', () => location.hash = 'help'];
    $('#go').onclick = () => location.hash = 'chat'; view.querySelectorAll('[data-a]').forEach(b => b.onclick = acts[b.dataset.a]);
  },
  async chat() {
    let hist = JSON.parse(localStorage.bbChat || '[]'); const sug = await api('/suggestions');
    view.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><div><div class="eyebrow">Inference engine</div><h2 style="margin:0">Banking Chatbot</h2></div><button class="btn alt" id="clr"><i data-lucide="rotate-ccw"></i>Clear chat</button></div>
    <div class="chat"><div class="msgs" id="msgs"></div><div class="chips" id="chips"></div><form class="bar" id="cf"><input id="ci" maxlength="300" placeholder="Ask a banking question…" autocomplete="off"><button class="btn" id="cs"><i data-lucide="send"></i>Send</button></form></div>`;
    const box = $('#msgs'), chips = list => $('#chips').innerHTML = list.map(s => `<button class="chip">${esc(s)}</button>`).join('');
    const draw = m => { const d = document.createElement('div'); d.className = 'm ' + (m.role === 'user' ? 'u' : 'b'); d.innerHTML = md(m.text) + (m.explain ? `<details><summary>Why this answer?</summary><pre>${esc(m.explain)}</pre><pre>Working memory:\n${esc(JSON.stringify(m.memory, null, 1))}</pre></details>` : ''); box.append(d); box.scrollTop = box.scrollHeight; };
    if (!hist.length) hist = [{ role: 'bot', text: "Hi! I'm BankBot, a rule-based expert system. Ask me about balance, transactions, loans, cards, transfers or branches." }];
    hist.forEach(draw); chips(sug.slice(0, 5));
    const save = () => localStorage.bbChat = JSON.stringify(hist.slice(-40));
    async function send(text) {
      text = text.trim(); if (!text) return; const u = { role: 'user', text }; hist.push(u); draw(u); $('#ci').value = '';
      const t = document.createElement('div'); t.className = 'm b'; t.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>'; box.append(t); box.scrollTop = box.scrollHeight;
      try { const r = await api('/chat', { message: text }); t.remove(); const b = { role: 'bot', text: r.answer, explain: r.explanation, memory: r.memory }; hist.push(b); draw(b); chips(r.suggestions); }
      catch (e) { t.remove(); const b = { role: 'bot', text: '⚠ ' + (e.error || 'Could not reach the server.') }; hist.push(b); draw(b); }
      save();
    }
    $('#cf').onsubmit = e => { e.preventDefault(); send($('#ci').value); }; $('#chips').onclick = e => e.target.classList.contains('chip') && send(e.target.textContent);
    $('#clr').onclick = () => { localStorage.removeItem('bbChat'); views.chat(); toast('Chat cleared'); icons(); };
    if (sessionStorage.bbPending) { const p = sessionStorage.bbPending; sessionStorage.removeItem('bbPending'); send(p); }
  },
  async account() {
    const c = await api('/customer');
    view.innerHTML = `<h2 style="margin-top:0">Account Details</h2><div class="card"><dl class="kv">${[['Customer Name', c.name], ['Account Number', c.account_no], ['Account Type', c.account_type], ['Available Balance', inr(c.balance)], ['IFSC Code', c.ifsc], ['Home Branch', c.branch], ['Monthly Income (sample)', inr(c.monthly_income)], ['Credit Score (sample)', c.credit_score]].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
  },
  async transactions() {
    view.innerHTML = `<h2 style="margin-top:0">Transactions</h2><div class="row"><input id="q" placeholder="Search description or ID…" style="max-width:320px"><select id="ty" style="max-width:180px"><option value="">All types</option><option>Credit</option><option>Debit</option></select></div><div class="card" id="tb"></div>`;
    const load = async () => { $('#tb').innerHTML = 'Loading…'; try { $('#tb').innerHTML = tbl(await api(`/transactions?q=${encodeURIComponent($('#q').value)}&type=${$('#ty').value}`)); } catch (e) { $('#tb').textContent = 'Could not load transactions.'; } };
    let tm; $('#q').oninput = () => { clearTimeout(tm); tm = setTimeout(load, 250); }; $('#ty').onchange = load; load();
  },
  async loan() {
    view.innerHTML = `<div class="eyebrow">Expert system</div><h2 style="margin-top:0">Loan Eligibility</h2><div class="card"><form class="f" id="lf" novalidate>
    ${[['name', 'Applicant Name', 'text'], ['income', 'Monthly Income (₹)', 'number'], ['score', 'Credit Score (300-900)', 'number'], ['emi', 'Existing Monthly EMI (₹)', 'number'], ['amount', 'Requested Loan Amount (₹)', 'number']].map(([k, l, t]) => `<div><label>${l}</label><input name="${k}" type="${t}" min="0"><div class="err" id="e-${k}"></div></div>`).join('')}
    <div><label>Employment Type</label><select name="employment"><option value="">Select…</option><option>Salaried</option><option>Self-employed</option><option>Business Owner</option></select><div class="err" id="e-employment"></div></div>
    <div style="align-self:end"><button class="btn" id="lb">Check Eligibility</button></div></form></div><div id="lr"></div>`;
    $('#lf').onsubmit = async e => { e.preventDefault(); document.querySelectorAll('.err').forEach(x => x.textContent = ''); const b = $('#lb'); b.disabled = true; b.textContent = 'Evaluating…';
      try { const r = await api('/loan', Object.fromEntries(new FormData(e.target))); const L = { eligible: ['Potentially Eligible', 'good'], review: ['Needs Review', 'warn'], not_eligible: ['Not Currently Eligible', 'badc'] }[r.status];
        $('#lr').innerHTML = `<div class="card res ${r.status}" style="margin-top:16px"><span class="pill ${L[1]}">${L[0]}</span><h3 style="margin:10px 0">Rule fired: ${esc(r.rule)}</h3><p>${esc(r.reason)}</p>
        <b>Conditions</b><ul>${r.conditions.map(c => `<li>${c.ok ? '✅ Satisfied' : '❌ Not satisfied'}: ${esc(c.label)} <small>(yours: ${esc(c.actual)})</small></li>`).join('')}</ul><b>Suggested improvements</b><ul>${r.suggestions.map(s => `<li>${esc(s)}</li>`).join('')}</ul><small><i>⚠ ${r.disclaimer}</i></small></div>`; toast('Assessment complete'); }
      catch (er) { Object.entries(er.fields || {}).forEach(([k, v]) => $('#e-' + k).textContent = v); toast(er.error || 'Request failed', true); }
      b.disabled = false; b.textContent = 'Check Eligibility'; };
  },
  async services() {
    const S = [['Savings & Current Accounts', 'piggy-bank', 'Zero-balance and premium accounts.'], ['Personal & Home Loans', 'home', 'Competitive rates, quick digital approval.'], ['Debit & Credit Cards', 'credit-card', 'Rewards, limits and instant blocking.'], ['UPI / NEFT / IMPS', 'send', 'Instant and scheduled transfers.'], ['Fixed & Recurring Deposits', 'trending-up', 'Guaranteed returns.'], ['Insurance', 'umbrella', 'Life, health and motor cover.'], ['ATM & Branch Locator', 'map-pin', 'Find us nearby.'], ['Net & Mobile Banking', 'smartphone', '24x7 banking on the go.']];
    view.innerHTML = `<h2 style="margin-top:0">Banking Services</h2><div class="grid">${S.map(([t, i, d]) => `<div class="card"><i data-lucide="${i}"></i><b>${t}</b><br><small>${d}</small></div>`).join('')}</div>
    <h2>Demo: Fund Transfer</h2><div class="card"><form class="f" id="tf" novalidate><div><label>Payee name / UPI ID</label><input name="payee"><div class="err" id="e-payee"></div></div><div><label>Amount (₹)</label><input name="amount" type="number" min="0"><div class="err" id="e-amount"></div></div><div><label>Method</label><select name="method"><option>UPI</option><option>NEFT</option><option>IMPS</option></select></div><div style="align-self:end"><button class="btn">Simulate Transfer</button></div></form></div>
    <h2>Demo: Block Debit Card</h2><div class="card"><p>Simulation only. No real card is affected.</p><button class="btn alt" id="bk"><i data-lucide="lock"></i>Block card ending 4821 (demo)</button></div>`;
    $('#tf').onsubmit = async e => { e.preventDefault(); document.querySelectorAll('.err').forEach(x => x.textContent = ''); try { const r = await api('/transfer', Object.fromEntries(new FormData(e.target))); toast(`${r.message} Ref: ${r.reference}`); e.target.reset(); } catch (er) { Object.entries(er.fields || {}).forEach(([k, v]) => $('#e-' + k).textContent = v); toast(er.error || 'Failed', true); } };
    $('#bk').onclick = async () => { if (confirm('Run the card-blocking DEMO?')) toast((await api('/block-card', {})).message); };
  },
  async help() {
    const F = [['How do I check my balance?', 'What is my account balance?'], ['How can I transfer money?', 'How can I transfer money?'], ['How do I block a lost card?', 'How can I block my debit card?'], ['What are the working hours?', 'What are the bank working hours?']];
    view.innerHTML = `<h2 style="margin-top:0">Help & Support</h2><div class="grid"><div class="card"><i data-lucide="phone"></i><b>Helpline</b><br>1800-000-0000 (sample, 24x7)</div><div class="card"><i data-lucide="mail"></i><b>Email</b><br>support@bankbot.example</div><div class="card"><i data-lucide="shield-alert"></i><b>Stay safe</b><br>Never share OTP, PIN or passwords.</div></div><h2>Frequently asked</h2><div class="grid">${F.map(([q, a], i) => `<button class="card q" data-f="${i}"><b>${q}</b><br><small>Ask the chatbot →</small></button>`).join('')}</div>`;
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => goChat(F[b.dataset.f][1]));
  },
};
async function route() {
  const k = views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard'; document.body.classList.remove('open');
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.k === k));
  $('#crumb').innerHTML = `BankBot / <b>${NAV.find(n => n[0] === k)[2]}</b>`; view.innerHTML = 'Loading…';
  try { await views[k](); } catch (e) { view.innerHTML = `<div class="card">⚠ ${esc(e.error || 'Could not load this page. Is the server running?')}</div>`; }
  icons();
}
addEventListener('hashchange', route); route();
