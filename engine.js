// Rule-Based Expert System: Knowledge Base + Inference Engine + Working Memory + Explanation Facility
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const DISCLAIMER = 'Simulated preliminary assessment only - not an actual bank loan approval.';

// ---------- Loan rules (R3 eligible, R4 rejection, R5 borderline) ----------
function evaluateLoan(a) {
  const income = +a.income, score = +a.score, emi = +a.emi || 0, amount = +a.amount || 0;
  const maxEmi = income * 0.5, maxAmt = income * 20;
  const conditions = [
    { label: 'Monthly income >= ₹25,000', ok: income >= 25000, actual: inr(income) },
    { label: 'Credit score >= 700', ok: score >= 700, actual: String(score) },
    { label: `Existing EMI within 50% of income (max ${inr(maxEmi)})`, ok: emi <= maxEmi, actual: inr(emi) },
    { label: `Requested amount <= 20x monthly income (max ${inr(maxAmt)})`, ok: amount <= maxAmt, actual: inr(amount) },
  ];
  let rule, status, reason;
  if (score < 600 || income < 15000) {
    rule = 'R4 Loan Rejection'; status = 'not_eligible';
    reason = [score < 600 && `credit score ${score} is below 600`, income < 15000 && `monthly income ${inr(income)} is below ₹15,000`].filter(Boolean).join(' and ');
    reason = `R4 fired because ${reason}.`;
  } else if (conditions.every(c => c.ok)) {
    rule = 'R3 Loan Eligibility'; status = 'eligible';
    reason = 'R3 fired because income, credit score, EMI load and loan amount all satisfy the limits.';
  } else {
    rule = 'R5 Borderline Review'; status = 'review';
    reason = 'Neither R3 nor R4 fully applies: you clear the minimum floor but fail: ' + conditions.filter(c => !c.ok).map(c => c.label).join('; ') + '.';
  }
  const suggestions = [];
  if (score < 700) suggestions.push('Improve your credit score above 700: pay dues on time and keep card utilisation below 30%.');
  if (income < 25000) suggestions.push('Add a co-applicant or show additional income to cross ₹25,000 per month.');
  if (emi > maxEmi) suggestions.push('Close or reduce existing EMIs so they stay within 50% of income.');
  if (amount > maxAmt) suggestions.push(`Lower the requested amount to ${inr(maxAmt)} or less.`);
  if (a.employment === 'Self-employed') suggestions.push('Keep last 2-3 years of ITR and business proof ready.');
  if (!suggestions.length) suggestions.push('Keep documents ready: ID proof, address proof, 3 months salary slips and 6 months bank statement.');
  return { status, rule, reason, conditions, suggestions, disclaimer: DISCLAIMER };
}
function validateLoan(a) {
  const e = {};
  if (!a.name || String(a.name).trim().length < 2) e.name = 'Enter the applicant name.';
  if (!(+a.income > 0)) e.income = 'Monthly income must be greater than 0.';
  if (!(+a.score >= 300 && +a.score <= 900)) e.score = 'Credit score must be between 300 and 900.';
  if (!['Salaried', 'Self-employed', 'Business Owner'].includes(a.employment)) e.employment = 'Select an employment type.';
  if (a.emi === '' || a.emi == null || +a.emi < 0) e.emi = 'Enter existing EMI (0 if none).';
  if (!(+a.amount > 0)) e.amount = 'Requested amount must be greater than 0.';
  return e;
}

// ---------- Knowledge Base: IF-THEN rules (most specific = most conditions wins) ----------
const KB = [
  { id: 'R0', name: 'Greeting', intent: 'greeting', if: 'user greets the bot', then: 'greet and list what the bot can do', when: [/\b(hi|hello|hey|namaste|good (morning|evening))\b/],
    run: c => `Hello ${c.name.split(' ')[0]}! I'm BankBot. I can help with balance, transactions, loans, cards, transfers, ATMs/branches and more.` },
  { id: 'R1', name: 'Account Balance', intent: 'account_balance', if: 'user asks about account balance', then: 'retrieve the simulated balance and display it', when: [/balance|how much (money|do i have)|funds available/],
    run: c => `Your available balance in **${c.account_type}** (${c.account_no}) is **${inr(c.balance)}**.` },
  { id: 'R2', name: 'Transaction History', intent: 'transactions', if: 'user asks for transaction history', then: 'display recent transactions with date, description, amount and type', when: [/transaction|statement|history|spent|spending|recent (payments|activity)/],
    run: (c, d) => 'Your 5 most recent transactions:\n' + d.transactions().slice(0, 5).map(t => `${t.date} | ${t.description} | ${t.amount < 0 ? '-' : '+'}${inr(Math.abs(t.amount))} | ${t.type}`).join('\n') },
  { id: 'R3', name: 'Loan Eligibility (chat)', intent: 'loan_eligibility', if: 'user asks about loan eligibility', then: 'evaluate profile with R3/R4/R5 and show satisfied conditions', when: [/loan|borrow/, /eligib|qualif|can i get|am i|chance/],
    run: c => { const r = evaluateLoan({ income: c.monthly_income, score: c.credit_score, emi: c.existing_emi, amount: c.monthly_income * 10 });
      return { answer: `${{ eligible: '**Potentially eligible** for a personal loan.', review: '**Needs review** for a personal loan.', not_eligible: '**Not currently eligible** for a personal loan.' }[r.status]}\n${r.conditions.map(x => `${x.ok ? '✔' : '✘'} ${x.label} (yours: ${x.actual})`).join('\n')}\n${r.reason}\n_${r.disclaimer}_`, loan: r, rule: r.rule }; } },
  { id: 'R7', name: 'Loan Documents', intent: 'loan_documents', if: 'user asks about documents required for a loan', then: 'list KYC, income and property documents', when: [/loan/, /document|paperwork|required|kyc|papers/],
    run: () => 'Typical documents for a loan:\n• Identity: Aadhaar / PAN / Passport\n• Address proof\n• Income: last 3 salary slips, 6 months bank statement, Form 16 / ITR\n• Home loan extra: sale agreement, property papers, approved plan\n• Self-employed: 2-3 years ITR and business proof' },
  { id: 'R8', name: 'Loan Information & Rates', intent: 'loan_info', if: 'user asks about loans, interest rates or EMI', then: 'show loan products and indicative rates', when: [/loan|interest|rate|emi/],
    run: () => 'Indicative (sample) rates:\n• Personal loan: 10.5% - 16% p.a., up to ₹25 lakh\n• Home loan: 8.4% - 9.5% p.a., up to 30 years\n• Car loan: 9% - 11% p.a.\n• Education loan: 9.5% - 12% p.a.\nAsk "Am I eligible for a personal loan?" to run an eligibility check.' },
  { id: 'R5', name: 'Block Debit/Credit Card', intent: 'block_card', if: 'user asks to block a card', then: 'give blocking steps and recommend official bank support', when: [/block|lost|stolen|freeze|hotlist|misplaced/, /card|debit|credit/],
    run: () => 'To block your card (demo steps):\n1. Open Banking Services and use the Block Card demo, or the official mobile app > Cards > Block.\n2. Or call the official 24x7 helpline 1800-000-0000 (sample number).\n3. Confirm the last 4 digits and request a replacement.\n⚠ Never share your PIN, CVV or OTP. Please contact official bank support for a real card block.' },
  { id: 'R9', name: 'Cards Information', intent: 'cards', if: 'user asks about debit or credit cards', then: 'explain card features and limits', when: [/card/],
    run: () => 'Cards (sample info):\n• Debit card: ATM limit ₹50,000/day, POS ₹1,50,000/day\n• Credit card: interest-free period up to 45 days, reward points on spends\n• Manage limits, PIN and international usage in the app. Ask "How can I block my debit card?" for blocking steps.' },
  { id: 'R6', name: 'Fund Transfer', intent: 'fund_transfer', if: 'user asks about transferring money', then: 'explain UPI, NEFT and IMPS steps', when: [/transfer|send money|neft|imps|upi|rtgs|pay someone/],
    run: () => 'Ways to transfer money:\n• **UPI**: instant, 24x7, up to ₹1 lakh. Add payee VPA > enter amount > authenticate with your UPI PIN.\n• **IMPS**: instant, 24x7, up to ₹5 lakh via account number + IFSC.\n• **NEFT**: batch based, 24x7, no upper limit; settles within ~30 minutes.\nTry the demo transfer in Banking Services. No real money moves.' },
  { id: 'R10', name: 'ATM & Branch Info', intent: 'atm_branch', if: 'user asks about ATM or branch', then: 'show nearest ATM/branch info', when: [/atm|branch|nearest|cash deposit/],
    run: c => `Your home branch: **${c.branch}**.\nATMs (sample): Kukatpally Metro Station, KPHB Phase 1, Forum Mall.\nCash deposit machines are available at the home branch.` },
  { id: 'R11', name: 'Working Hours', intent: 'working_hours', if: 'user asks about working hours', then: 'show branch and service timings', when: [/hour|timing|open|working|close|closing/],
    run: () => 'Branch hours: Mon-Fri 10:00 AM - 4:00 PM, Sat 10:00 AM - 2:00 PM (closed on Sundays and public holidays). Net banking, UPI and ATMs run 24x7.' },
  { id: 'R12', name: 'Account Details', intent: 'account_details', if: 'user asks for account details or IFSC', then: 'show masked account details', when: [/account (number|details|type|info)|ifsc|my account|profile/],
    run: c => `Name: ${c.name}\nAccount: ${c.account_no} (${c.account_type})\nIFSC: ${c.ifsc}\nBranch: ${c.branch}` },
  { id: 'R13', name: 'Customer Support', intent: 'support', if: 'user asks for support or help', then: 'show support channels', when: [/support|contact|help|complaint|customer care|agent|call/],
    run: () => 'Support (sample): Helpline 1800-000-0000 (24x7), email support@bankbot.example, or visit the Help & Support page. Never share OTP, PIN or passwords with anyone.' },
  { id: 'R14', name: 'Thanks', intent: 'thanks', if: 'user says thanks', then: 'acknowledge politely', when: [/thank|thanks|great|ok thanks/], run: () => "You're welcome! Anything else I can help with?" },
];
const SUGGESTIONS = ['What is my account balance?', 'Show my recent transactions', 'Am I eligible for a personal loan?', 'What documents are needed for a home loan?', 'How can I block my debit card?', 'How can I transfer money?', 'What are the bank working hours?'];

// ---------- Inference Engine ----------
function infer(query, customer, data) {
  const wm = { query, normalizedQuery: '', keywords: [], intent: null, customer: { name: customer.name, balance: customer.balance, income: customer.monthly_income, creditScore: customer.credit_score, existingEmi: customer.existing_emi }, matchedRule: null, candidates: [], response: null };
  wm.normalizedQuery = String(query).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const matches = KB.map(r => ({ r, hits: r.when.map(x => wm.normalizedQuery.match(x)) })).filter(m => m.hits.every(Boolean));
  wm.candidates = matches.map(m => `${m.r.id} ${m.r.name}`);
  const best = matches.sort((a, b) => b.r.when.length - a.r.when.length)[0]; // conflict resolution: specificity
  if (!best) {
    wm.response = "I'm sorry, I couldn't understand that. I can help with balance, transactions, loans, cards, transfers, ATMs/branches and working hours. Try one of the suggested questions.";
    return { answer: wm.response, supported: false, intent: 'unknown', rule: null, explanation: 'No rule in the knowledge base has all its IF-conditions satisfied by your question, so the fallback response was used.', memory: wm, suggestions: SUGGESTIONS.slice(0, 4) };
  }
  const { r, hits } = best;
  wm.keywords = [...new Set(hits.map(h => h[0]))]; wm.intent = r.intent; wm.matchedRule = `${r.id}: ${r.name}`;
  let out = r.run(customer, data), loan = null, ruleName = wm.matchedRule;
  if (typeof out === 'object') { loan = out.loan; ruleName = `${r.id} -> ${out.rule}`; out = out.answer; }
  wm.response = out;
  let explanation = `Rule ${ruleName}. IF ${r.if} THEN ${r.then}. Keywords detected: ${wm.keywords.join(', ')}. Competing rules: ${wm.candidates.join('; ')} (most specific rule chosen).`;
  if (loan) explanation += ' ' + loan.conditions.map(c => `${c.ok ? 'Satisfied' : 'Not satisfied'}: ${c.label}`).join(' | ') + ` | ${loan.reason}`;
  return { answer: out, supported: true, intent: r.intent, rule: wm.matchedRule, explanation, memory: wm, suggestions: SUGGESTIONS.filter(s => s !== query).slice(0, 4) };
}
module.exports = { infer, evaluateLoan, validateLoan, KB, SUGGESTIONS };
