/* Deepu Ledger — family credit-card bills, EMIs, and monthly charges */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PALETTE = ["#9c2b20","#2f4f3e","#1d4e89","#6b4c2a","#4a3d6b","#1e5c5c","#8b3a3a","#3d5a45"];
const LS_KEY = "deepu-ledger-v1";
const LS_PIN_OK = "deepu-ledger-unlocked";

const $ = (id) => document.getElementById(id);

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function colorFor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

function formatINR(n) {
  if (n === "" || n == null || Number.isNaN(Number(n))) return "";
  return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
}

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return n + "th";
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
}

function parseMonth(s) {
  if (!s) return null;
  const [mon, yy] = String(s).trim().split(/\s+/);
  const m = MONTHS.indexOf(mon);
  if (m < 0) return null;
  const y = 2000 + parseInt(yy, 10);
  return { m, y, key: `${MONTHS[m]} ${String(y).slice(-2)}` };
}

function formatMonth(m, y) {
  return `${MONTHS[m]} ${String(y).slice(-2)}`;
}

function addMonthsObj(obj, n) {
  const d = new Date(obj.y, obj.m + n, 1);
  return { m: d.getMonth(), y: d.getFullYear(), key: formatMonth(d.getMonth(), d.getFullYear()) };
}

function monthDiff(a, b) {
  return (b.y - a.y) * 12 + (b.m - a.m);
}

function parseDate(s) {
  if (!s || s === "Monthly") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T12:00:00");
  const m = String(s).trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    if (mi >= 0) return new Date(+m[3], mi, +m[1], 12);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(s) {
  if (!s) return "";
  if (s === "Monthly") return "Monthly";
  const d = parseDate(s);
  if (!d) return s;
  return `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

function toISODate(s) {
  const d = parseDate(s) || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addCalendarMonths(dateStr, n) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const day = d.getDate();
  const nd = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
  nd.setDate(Math.min(day, last));
  return formatDate(nd);
}

function cycleLabel(left) {
  const a = parseMonth(left);
  const b = addMonthsObj(a, 1);
  return `${MONTHS[a.m]}–${MONTHS[b.m]} ${String(b.y).slice(-2)}`;
}

function emptyData() {
  return {
    people: [],
    cards: [
      { id: uid(), name: "Card ICICI", closingDay: 22 },
      { id: uid(), name: "Card Amex", closingDay: 25 },
      { id: uid(), name: "Deepu SBI Card", closingDay: 22 },
    ],
    purchases: [],
    emis: [],
    subscriptions: [],
    payments: [],
    meta: { pin: "", gasUrl: "", defaultCardId: "" },
  };
}

function demoData() {
  const chinnu = { id: "p-chinnu", name: "Chinnu" };
  return {
    people: [chinnu, { id: "p-deepu", name: "Deepu" }, { id: "p-anu", name: "Anu" }],
    cards: [
      { id: "c-icici", name: "Card ICICI", closingDay: 22 },
      { id: "c-amex", name: "Card Amex", closingDay: 25 },
      { id: "c-sbi", name: "Deepu SBI Card", closingDay: 22 },
    ],
    purchases: [
      { id: uid(), date: "11-Aug-2026", description: "Ray-ban Glasess", amount: 4000, personId: chinnu.id, billMonth: "Sep 26", cardId: "c-icici" },
      { id: uid(), date: "", description: "GPay Bescom Bill Pay (2000)", amount: "", personId: chinnu.id, billMonth: "Oct 26", cardId: "c-icici" },
      { id: uid(), date: "14-Jul-2026", description: "Prestige (Stove+3Ltr Cooker) Part 2 of 2", amount: 2059, personId: chinnu.id, billMonth: "Oct 26", cardId: "c-icici" },
      { id: uid(), date: "08-Aug-2026", description: "Amazon (Razer Headphones) Half Payment", amount: 1814, personId: chinnu.id, billMonth: "Oct 26", cardId: "c-icici" },
      { id: uid(), date: "12-Aug-2026", description: "Signature Hotel Lakshmipuram", amount: 2700, personId: chinnu.id, billMonth: "Oct 26", cardId: "c-icici" },
    ],
    emis: [
      { id: uid(), title: "Gigabyte 5070Ti", personId: chinnu.id, amount: 2650, startBillMonth: "Sep 26", startDate: "07-Nov-2026", startN: 1, totalMonths: 24, note: "", cardId: "c-icici" },
      { id: uid(), title: "Apple Mac Mini", personId: chinnu.id, amount: 7541, startBillMonth: "Sep 26", startDate: "09-Nov-2026", startN: 1, totalMonths: 12, note: "", cardId: "c-icici" },
      { id: uid(), title: "RD hp Laptop", personId: chinnu.id, amount: 4795.92, startBillMonth: "Sep 26", startDate: "09-Nov-2026", startN: 5, totalMonths: 12, note: "Half", cardId: "c-icici" },
    ],
    subscriptions: [
      { id: uid(), title: "iCloud+ 2TB Membership", personId: chinnu.id, amount: 143, active: true },
      { id: uid(), title: "Airtel Postpaid Bill Payment (4444)", personId: chinnu.id, amount: 412.41, active: true },
      { id: uid(), title: "Netflix Membership", personId: chinnu.id, amount: 499, active: true },
      { id: uid(), title: "Spotify Membership", personId: chinnu.id, amount: 179, active: true },
    ],
    payments: [
      { id: uid(), personId: chinnu.id, billMonth: "Sep 26", amount: 0 },
      { id: uid(), personId: chinnu.id, billMonth: "Oct 26", amount: 70.7 },
    ],
    meta: { pin: "", gasUrl: "", defaultCardId: "c-icici" },
  };
}

/* ---------------- persistence ---------------- */

function inGas() {
  return typeof google !== "undefined" && google.script && google.script.run;
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "deepu_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet timed out"));
    }, 20000);
    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    }
    window[cb] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("Could not reach Google")); };
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
    document.head.appendChild(script);
  });
}

function gasRun(fn, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[fn](...args);
  });
}

const Store = {
  async load() {
    if (inGas()) {
      const remote = await gasRun("getAllData");
      if (remote && remote.people) return remote;
    }
    const gasUrl = (JSON.parse(localStorage.getItem(LS_KEY) || "null") || {}).meta?.gasUrl;
    if (gasUrl) {
      try {
        const res = await jsonp(gasUrl.replace(/\/$/, "") + "?action=load");
        if (res && res.ok && res.data && res.data.people) {
          const merged = res.data;
          merged.meta = merged.meta || {};
          merged.meta.gasUrl = gasUrl;
          return merged;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    const local = localStorage.getItem(LS_KEY);
    return local ? JSON.parse(local) : demoData();
  },

  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    if (inGas()) {
      await gasRun("saveAllData", data);
      return { ok: true, where: "sheet" };
    }
    const gasUrl = data.meta?.gasUrl;
    if (!gasUrl) return { ok: true, where: "browser" };
    const payload = JSON.stringify(data);
    const size = 1400;
    const chunks = [];
    for (let i = 0; i < payload.length; i += size) chunks.push(payload.slice(i, i + size));
    const token = uid();
    const base = gasUrl.replace(/\/$/, "");
    await jsonp(`${base}?action=saveStart&token=${encodeURIComponent(token)}&n=${chunks.length}`);
    for (let i = 0; i < chunks.length; i++) {
      await jsonp(`${base}?action=saveChunk&token=${encodeURIComponent(token)}&i=${i}&c=${encodeURIComponent(chunks[i])}`);
    }
    const res = await jsonp(`${base}?action=saveCommit&token=${encodeURIComponent(token)}`);
    if (!res || !res.ok) throw new Error(res?.error || "Save to Sheet failed");
    return { ok: true, where: "sheet" };
  },

  async exportBills(personName, leftMonth, rightMonth) {
    if (inGas()) return gasRun("generateFormattedBills", personName, leftMonth, rightMonth);
    const gasUrl = state.data.meta?.gasUrl;
    if (!gasUrl) throw new Error("Connect Google Sheets in Settings first.");
    const url = `${gasUrl.replace(/\/$/, "")}?action=export&person=${encodeURIComponent(personName)}&left=${encodeURIComponent(leftMonth)}&right=${encodeURIComponent(rightMonth)}`;
    const res = await jsonp(url);
    if (!res || !res.ok) throw new Error(res?.error || "Export failed");
    return res.data;
  },
};

/* ---------------- state ---------------- */

const state = {
  data: emptyData(),
  view: "bills",
  personId: null,
  leftMonth: "Sep 26",
  billPane: 0,
  saving: false,
  deferredInstall: null,
};

function visibleBillMonth() {
  const right = addMonthsObj(parseMonth(state.leftMonth), 1).key;
  return state.billPane === 1 ? right : state.leftMonth;
}

function applyBillPane() {
  document.body.dataset.billPane = String(state.billPane);
  document.querySelectorAll(".due-card[data-pane]").forEach((card) => {
    card.classList.toggle("active", Number(card.dataset.pane) === state.billPane);
  });
}

function personById(id) {
  return state.data.people.find((p) => p.id === id);
}

function currentPerson() {
  return personById(state.personId) || state.data.people[0] || null;
}

function paymentFor(personId, month) {
  return state.data.payments.find((p) => p.personId === personId && p.billMonth === month);
}

function num(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function emiLine(emi, monthKey) {
  const start = parseMonth(emi.startBillMonth);
  const target = parseMonth(monthKey);
  if (!start || !target) return null;
  const offset = monthDiff(start, target);
  const n = Number(emi.startN) + offset;
  if (n < 1 || n > Number(emi.totalMonths)) return null;
  const note = emi.note ? ` (${emi.note})` : "";
  return {
    date: addCalendarMonths(emi.startDate, offset),
    description: `${emi.title} ${ordinal(n)} EMI Of ${emi.totalMonths}M${note}`,
    amount: Number(emi.amount),
    kind: "emi",
    emiId: emi.id,
  };
}

function buildBill(personId, monthKey) {
  const purchases = state.data.purchases
    .filter((x) => x.personId === personId && x.billMonth === monthKey)
    .map((x) => ({
      id: x.id,
      date: x.date || "",
      description: x.description,
      amount: x.amount === "" || x.amount == null ? "" : Number(x.amount),
      kind: "purchase",
    }));
  const emis = state.data.emis
    .filter((x) => x.personId === personId)
    .map((e) => emiLine(e, monthKey))
    .filter(Boolean);
  const subs = state.data.subscriptions
    .filter((x) => x.personId === personId && x.active !== false)
    .map((s) => ({
      id: s.id,
      date: "Monthly",
      description: s.title,
      amount: Number(s.amount),
      kind: "sub",
    }));
  const lines = [...purchases, ...emis, ...subs];
  const purchTotal = lines.reduce((s, r) => s + num(r.amount), 0);
  const pay = num(paymentFor(personId, monthKey)?.amount);
  return {
    monthKey,
    purchases,
    recurring: [...emis, ...subs],
    purchTotal,
    payment: pay,
    total: purchTotal - pay,
  };
}

async function persist(flash) {
  try {
    state.saving = true;
    const res = await Store.save(state.data);
    if (flash) toast(flash);
    return res;
  } catch (err) {
    toast(err.message || "Could not save", true);
    return null;
  } finally {
    state.saving = false;
  }
}

function toast(msg, isErr) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.style.background = isErr ? "#9c2b20" : "#1c1916";
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 2800);
}

/* ---------------- render ---------------- */

function render() {
  const person = currentPerson();
  document.body.dataset.view = state.view;
  document.body.dataset.billPane = String(state.billPane);
  $("cycle-label").textContent = cycleLabel(state.leftMonth);
  $("top-eyebrow").textContent = state.view === "bills" ? "Statement cycle" : "Deepu Ledger";
  $("top-title").textContent = state.view === "bills"
    ? (person ? `${person.name}'s bills` : "Add a person to start")
    : ({ emis: "EMI schedules", subs: "Monthly charges", people: "People", cards: "Credit cards", settings: "More" }[state.view] || "Deepu Ledger");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
  ["bills","emis","subs","people","cards","settings"].forEach((v) => {
    const el = $(`view-${v}`);
    const off = state.view !== v;
    el.classList.toggle("hidden", off);
    el.hidden = off;
  });

  renderPeopleRail();
  if (state.view === "bills") renderBills();
  if (state.view === "emis") renderEmis();
  if (state.view === "subs") renderSubs();
  if (state.view === "people") renderPeople();
  if (state.view === "cards") renderCards();
  if (state.view === "settings") renderSettings();
}

function renderPeopleRail() {
  const el = $("people-rail");
  if (!state.data.people.length) {
    el.innerHTML = `<p class="muted" style="padding:8px">No people yet.</p>`;
    return;
  }
  const left = state.leftMonth;
  const right = addMonthsObj(parseMonth(left), 1).key;
  el.innerHTML = state.data.people.map((p) => {
    const due = buildBill(p.id, left).total + buildBill(p.id, right).total;
    return `<button class="person-chip ${p.id === state.personId ? "active" : ""}" data-person="${p.id}" type="button">
      <span class="avatar" style="background:${colorFor(p.name)}">${esc(initials(p.name))}</span>
      <span><b>${esc(p.name)}</b><small>${formatINR(due)} this cycle</small></span>
    </button>`;
  }).join("");
  el.querySelectorAll("[data-person]").forEach((b) => {
    b.onclick = () => { state.personId = b.dataset.person; state.view = "bills"; render(); };
  });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function bindBillSwipe(root) {
  const pair = root.querySelector(".bills-pair");
  if (!pair) return;
  let startX = null;
  pair.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  pair.addEventListener("touchend", (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 48) return;
    state.billPane = dx < 0 ? 1 : 0;
    applyBillPane();
  }, { passive: true });
}

function renderStatement(person, monthKey) {
  const bill = buildBill(person.id, monthKey);
  const purchRows = bill.purchases.map((r) => rowHtml(r, monthKey)).join("")
    || `<div class="row blank"><span></span><span class="muted">No one-off purchases</span><span></span></div>`;
  const recRows = bill.recurring.map((r) => rowHtml(r, monthKey)).join("");
  return `<article class="statement" data-month="${esc(monthKey)}">
    <div class="statement-head">
      <span>Date</span>
      <span>Description (${esc(monthKey)})</span>
      <span>${esc(person.name)}</span>
    </div>
    <div class="statement-body">
      ${purchRows}
      <button class="add-inline" data-add="purchase" data-month="${esc(monthKey)}" type="button">+ Add purchase to ${esc(monthKey)}</button>
      <div class="statement-gap"></div>
      ${recRows}
    </div>
    <div class="statement-foot">
      <div class="sum-row">
        <span class="cobalt">Payments</span>
        <span class="crimson">Purchases</span>
        <span class="right crimson">${formatINR(bill.purchTotal)}</span>
      </div>
      <div class="sum-row">
        <button class="btn ghost" data-pay="${esc(monthKey)}" type="button" style="padding:4px 8px">${formatINR(bill.payment)}</button>
        <span class="crimson">Total Bill</span>
        <span class="right crimson">${formatINR(bill.total)}</span>
      </div>
    </div>
  </article>`;
}

function rowHtml(r, monthKey) {
  const amt = r.amount === "" || r.amount == null ? "" : formatINR(r.amount);
  const pending = r.amount === "" || r.amount == null;
  const canEdit = r.kind === "purchase";
  return `<div class="row ${pending ? "pending" : ""}" ${canEdit ? `data-edit="${r.id}"` : ""} data-month="${esc(monthKey)}">
    <span class="date">${esc(formatDate(r.date) || "—")}</span>
    <span>${esc(r.description)}</span>
    <span class="amt">${esc(amt)}</span>
  </div>`;
}

function renderBills() {
  const root = $("view-bills");
  const person = currentPerson();
  if (!person) {
    root.innerHTML = `<div class="empty">Add Chinnu, Deepu, or anyone else you bill each month.</div>`;
    return;
  }
  const left = state.leftMonth;
  const right = addMonthsObj(parseMonth(left), 1).key;
  const a = buildBill(person.id, left);
  const b = buildBill(person.id, right);
  root.innerHTML = `
    <div class="due-strip">
      <div class="due-card ${state.billPane === 0 ? "active" : ""}" data-pane="0"><span>${left}</span><b>${formatINR(a.total)}</b></div>
      <div class="due-card ${state.billPane === 1 ? "active" : ""}" data-pane="1"><span>${right}</span><b>${formatINR(b.total)}</b></div>
      <div class="due-card total"><span>Cycle total</span><b>${formatINR(a.total + b.total)}</b></div>
    </div>
    <div class="bills-pair">
      ${renderStatement(person, left)}
      ${renderStatement(person, right)}
    </div>`;
  applyBillPane();
  root.querySelectorAll(".due-card[data-pane]").forEach((card) => {
    card.onclick = () => {
      state.billPane = Number(card.dataset.pane);
      applyBillPane();
    };
  });
  bindBillSwipe(root);
  root.querySelectorAll("[data-add]").forEach((btn) => {
    btn.onclick = () => openPurchaseModal({ billMonth: btn.dataset.month, personId: person.id });
  });
  root.querySelectorAll("[data-edit]").forEach((row) => {
    row.onclick = () => {
      const item = state.data.purchases.find((p) => p.id === row.dataset.edit);
      if (item) openPurchaseModal(item);
    };
  });
  root.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.onclick = () => openPaymentModal(person.id, btn.dataset.pay);
  });
}

function renderEmis() {
  const root = $("view-emis");
  root.innerHTML = `
    <div class="toolbar">
      <p class="hint">Add an EMI once. Every later month increments 1st → 2nd → 3rd automatically, then stops.</p>
      <button class="btn primary" id="emi-new" type="button">Add EMI</button>
    </div>
    <div class="table-wrap">${tableOrEmpty(state.data.emis, emiTable)}</div>`;
  $("emi-new").onclick = () => openEmiModal();
  bindRowButtons(root);
}

function emiTable() {
  return `<table><thead><tr><th>Item</th><th>Person</th><th class="num">EMI</th><th>Starts</th><th>Progress</th><th></th></tr></thead><tbody>
    ${state.data.emis.map((e) => {
      const p = personById(e.personId);
      return `<tr>
        <td data-label="Item"><b>${esc(e.title)}</b>${e.note ? ` <span class="muted">(${esc(e.note)})</span>` : ""}</td>
        <td data-label="Person">${esc(p?.name || "")}</td>
        <td class="num" data-label="EMI">${formatINR(e.amount)}</td>
        <td data-label="Starts">${esc(e.startBillMonth)} · ${esc(ordinal(e.startN))} of ${esc(e.totalMonths)}</td>
        <td class="muted" data-label="Date">${esc(formatDate(e.startDate))}</td>
        <td class="table-actions actions">
          <button class="btn" data-edit-emi="${e.id}" type="button">Edit</button>
          <button class="btn" data-del-emi="${e.id}" type="button">Delete</button>
        </td>
      </tr>`;
    }).join("")}
  </tbody></table>`;
}

function renderSubs() {
  const root = $("view-subs");
  root.innerHTML = `
    <div class="toolbar">
      <p class="hint">These appear as <b>Monthly</b> on every person's bill until you turn them off.</p>
      <button class="btn primary" id="sub-new" type="button">Add monthly</button>
    </div>
    <div class="table-wrap">${tableOrEmpty(state.data.subscriptions, subTable)}</div>`;
  $("sub-new").onclick = () => openSubModal();
  bindRowButtons(root);
}

function subTable() {
  return `<table><thead><tr><th>Charge</th><th>Person</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead><tbody>
    ${state.data.subscriptions.map((s) => `<tr>
      <td data-label="Charge">${esc(s.title)}</td>
      <td data-label="Person">${esc(personById(s.personId)?.name || "")}</td>
      <td class="num" data-label="Amount">${formatINR(s.amount)}</td>
      <td data-label="Status">${s.active === false ? "Paused" : "Active"}</td>
      <td class="table-actions actions">
        <button class="btn" data-edit-sub="${s.id}" type="button">Edit</button>
        <button class="btn" data-del-sub="${s.id}" type="button">Delete</button>
      </td>
    </tr>`).join("")}
  </tbody></table>`;
}

function renderPeople() {
  const root = $("view-people");
  root.innerHTML = `
    <div class="toolbar">
      <p class="hint">Each person gets their own two-month bill, the same way you keep Chinnu / Deepu sheets today.</p>
      <button class="btn primary" id="people-new" type="button">Add person</button>
    </div>
    <div class="card-list">
      ${state.data.people.map((p) => `<div class="row people-row" style="grid-template-columns:40px 1fr auto;border-bottom:1px solid var(--line)">
        <span class="avatar" style="background:${colorFor(p.name)}">${esc(initials(p.name))}</span>
        <b>${esc(p.name)}</b>
        <span class="table-actions">
          <button class="btn" data-edit-person="${p.id}" type="button">Rename</button>
          <button class="btn" data-del-person="${p.id}" type="button">Remove</button>
        </span>
      </div>`).join("") || `<div class="empty">No people yet.</div>`}
    </div>`;
  $("people-new").onclick = () => openPersonModal();
  bindRowButtons(root);
}

function renderCards() {
  const root = $("view-cards");
  root.innerHTML = `
    <div class="toolbar">
      <p class="hint">Closing day is only a hint when you log a purchase. You can still drop an August swipe onto the October bill.</p>
      <button class="btn primary" id="card-new" type="button">Add card</button>
    </div>
    <div class="table-wrap">${tableOrEmpty(state.data.cards, () => `<table><thead><tr><th>Card</th><th>Closing day</th><th></th></tr></thead><tbody>
      ${state.data.cards.map((c) => `<tr>
        <td data-label="Card">${esc(c.name)}</td>
        <td data-label="Closing day">${esc(c.closingDay)}</td>
        <td class="table-actions actions">
          <button class="btn" data-edit-card="${c.id}" type="button">Edit</button>
          <button class="btn" data-del-card="${c.id}" type="button">Delete</button>
        </td>
      </tr>`).join("")}
    </tbody></table>`)}</div>`;
  $("card-new").onclick = () => openCardModal();
  bindRowButtons(root);
}

function renderSettings() {
  const m = state.data.meta;
  $("view-settings").innerHTML = `
    <div class="settings-block">
      <h3>Install on your phone</h3>
      <p class="hint">Same app as the computer. Add it to the home screen and it opens full-screen, even offline.</p>
      <p class="ios-tip" id="ios-install-tip" hidden></p>
      <div class="modal-actions" style="justify-content:flex-start;margin-top:8px">
        <button class="btn primary" id="btn-install-settings" type="button">Install app</button>
        <button class="btn" id="btn-open-cards" type="button">Credit cards</button>
      </div>
    </div>
    <div class="settings-block">
      <h3>Google Sheet</h3>
      <p class="hint">Paste the Apps Script web-app URL after you deploy <code>gas/Code.gs</code>. Bills then live in your Google account. Until then, everything is saved in this browser.</p>
      <label>Web app URL
        <input id="gas-url" value="${esc(m.gasUrl || "")}" placeholder="https://script.google.com/macros/s/…/exec" />
      </label>
      <div class="modal-actions" style="margin-top:12px">
        <button class="btn" id="btn-load-sheet" type="button">Load from Sheet</button>
        <button class="btn primary" id="btn-save-sheet" type="button">Save URL &amp; sync</button>
      </div>
      <p class="muted" id="sheet-status"></p>
    </div>
    <div class="settings-block">
      <h3>PIN lock</h3>
      <p class="hint">Optional. Anyone with the link will need this PIN. Leave blank for no lock.</p>
      <label>PIN <input id="pin-set" value="${esc(m.pin || "")}" inputmode="numeric" maxlength="8" /></label>
      <div class="modal-actions"><button class="btn primary" id="btn-save-pin" type="button">Save PIN</button></div>
    </div>
    <div class="settings-block">
      <h3>Demo &amp; reset</h3>
      <p class="hint">Load Chinnu's Sep–Oct 2026 bill (Ray-Ban, Prestige, EMIs, Netflix) to see the layout. Reset clears this browser copy only.</p>
      <div class="modal-actions" style="justify-content:flex-start">
        <button class="btn" id="btn-demo" type="button">Load Chinnu demo</button>
        <button class="btn danger" id="btn-reset" type="button">Reset ledger</button>
      </div>
    </div>`;
  $("btn-save-sheet").onclick = async () => {
    state.data.meta.gasUrl = $("gas-url").value.trim();
    $("sheet-status").textContent = "Saving…";
    try {
      const res = await persist();
      $("sheet-status").textContent = res?.where === "sheet" || state.data.meta.gasUrl
        ? "Saved. If the URL is valid, this ledger is now in your Sheet."
        : "Saved in this browser.";
      toast("Settings saved");
    } catch (err) {
      $("sheet-status").textContent = err.message;
    }
  };
  $("btn-load-sheet").onclick = async () => {
    state.data.meta.gasUrl = $("gas-url").value.trim();
    localStorage.setItem(LS_KEY, JSON.stringify(state.data));
    $("sheet-status").textContent = "Loading…";
    try {
      const data = await Store.load();
      state.data = data;
      state.personId = data.people[0]?.id || null;
      render();
      toast("Loaded from Sheet");
    } catch (err) {
      $("sheet-status").textContent = err.message;
    }
  };
  $("btn-save-pin").onclick = async () => {
    state.data.meta.pin = $("pin-set").value.trim();
    await persist("PIN saved");
  };
  $("btn-demo").onclick = async () => {
    if (!confirm("Replace current data with the Chinnu demo bill?")) return;
    const gasUrl = state.data.meta.gasUrl;
    state.data = demoData();
    state.data.meta.gasUrl = gasUrl || "";
    state.personId = "p-chinnu";
    state.leftMonth = "Sep 26";
    await persist("Demo loaded");
    state.view = "bills";
    render();
  };
  $("btn-reset").onclick = async () => {
    if (!confirm("Clear all people, bills, EMIs and payments in this browser?")) return;
    const gasUrl = state.data.meta.gasUrl;
    state.data = emptyData();
    state.data.meta.gasUrl = gasUrl || "";
    state.personId = null;
    await persist("Ledger cleared");
    render();
  };
  $("btn-open-cards").onclick = () => { state.view = "cards"; render(); };
  $("btn-install-settings").onclick = () => promptInstall(true);
  const tip = $("ios-install-tip");
  if (isIos() && !isStandalone()) {
    tip.hidden = false;
    tip.textContent = "iPhone / iPad: open this page in Safari, tap Share, then Add to Home Screen.";
  }
}

function tableOrEmpty(arr, fn) {
  return arr.length ? fn() : `<div class="empty">Nothing here yet.</div>`;
}

function bindRowButtons(root) {
  root.querySelectorAll("[data-edit-emi]").forEach((b) => b.onclick = () => openEmiModal(state.data.emis.find((x) => x.id === b.dataset.editEmi)));
  root.querySelectorAll("[data-del-emi]").forEach((b) => b.onclick = () => removeItem("emis", b.dataset.delEmi));
  root.querySelectorAll("[data-edit-sub]").forEach((b) => b.onclick = () => openSubModal(state.data.subscriptions.find((x) => x.id === b.dataset.editSub)));
  root.querySelectorAll("[data-del-sub]").forEach((b) => b.onclick = () => removeItem("subscriptions", b.dataset.delSub));
  root.querySelectorAll("[data-edit-person]").forEach((b) => b.onclick = () => openPersonModal(personById(b.dataset.editPerson)));
  root.querySelectorAll("[data-del-person]").forEach((b) => b.onclick = () => removePerson(b.dataset.delPerson));
  root.querySelectorAll("[data-edit-card]").forEach((b) => b.onclick = () => openCardModal(state.data.cards.find((x) => x.id === b.dataset.editCard)));
  root.querySelectorAll("[data-del-card]").forEach((b) => b.onclick = () => removeItem("cards", b.dataset.delCard));
}

async function removeItem(key, id) {
  if (!confirm("Delete this item?")) return;
  state.data[key] = state.data[key].filter((x) => x.id !== id);
  await persist("Deleted");
  render();
}

async function removePerson(id) {
  if (!confirm("Remove this person and their purchases, EMIs, monthly charges and payments?")) return;
  state.data.people = state.data.people.filter((p) => p.id !== id);
  ["purchases","emis","subscriptions","payments"].forEach((k) => {
    state.data[k] = state.data[k].filter((x) => x.personId !== id);
  });
  if (state.personId === id) state.personId = state.data.people[0]?.id || null;
  await persist("Person removed");
  render();
}

/* ---------------- modals ---------------- */

function openModal(html) {
  const modal = $("modal");
  $("modal-card").innerHTML = html;
  modal.hidden = false;
  modal.classList.remove("hidden");
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function closeModal() {
  $("modal").hidden = true;
  $("modal").classList.add("hidden");
  $("modal-card").innerHTML = "";
}

function peopleOptions(selected) {
  return state.data.people.map((p) => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${esc(p.name)}</option>`).join("");
}

function cardOptions(selected) {
  return `<option value="">—</option>` + state.data.cards.map((c) => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("");
}

function monthOptions(selected) {
  const start = parseMonth("Jan 25");
  const opts = [];
  for (let i = 0; i < 48; i++) {
    const m = addMonthsObj(start, i);
    opts.push(`<option value="${m.key}" ${m.key === selected ? "selected" : ""}>${m.key}</option>`);
  }
  return opts.join("");
}

function openPurchaseModal(item) {
  const isNew = !item?.id;
  const personId = item?.personId || state.personId;
  openModal(`
    <h2>${isNew ? "Add purchase" : "Edit purchase"}</h2>
    <div class="form-grid">
      <label>Date <input id="f-date" type="date" value="${item?.date ? toISODate(item.date) : ""}" /></label>
      <label>Bill month <select id="f-month">${monthOptions(item?.billMonth || state.leftMonth)}</select></label>
      <label class="full">Description <input id="f-desc" value="${esc(item?.description || "")}" placeholder="Ray-ban Glasses" /></label>
      <label>Amount (₹) <input id="f-amt" type="number" step="0.01" min="0" value="${item?.amount ?? ""}" placeholder="Leave blank if pending" /></label>
      <label>Person <select id="f-person">${peopleOptions(personId)}</select></label>
      <label class="full">Card <select id="f-card">${cardOptions(item?.cardId || state.data.meta.defaultCardId)}</select></label>
    </div>
    <div class="modal-actions">
      ${isNew ? "" : `<button class="btn danger" id="f-del" type="button">Delete</button>`}
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const rec = {
      id: item?.id || uid(),
      date: $("f-date").value ? formatDate($("f-date").value) : "",
      description: $("f-desc").value.trim(),
      amount: $("f-amt").value === "" ? "" : Number($("f-amt").value),
      personId: $("f-person").value,
      billMonth: $("f-month").value,
      cardId: $("f-card").value,
    };
    if (!rec.description) return toast("Description is required", true);
    const idx = state.data.purchases.findIndex((p) => p.id === rec.id);
    if (idx >= 0) state.data.purchases[idx] = rec;
    else state.data.purchases.push(rec);
    closeModal();
    await persist("Purchase saved");
    render();
  };
  const del = $("f-del");
  if (del) del.onclick = async () => {
    state.data.purchases = state.data.purchases.filter((p) => p.id !== item.id);
    closeModal();
    await persist("Purchase deleted");
    render();
  };
}

function openEmiModal(item) {
  const isNew = !item?.id;
  openModal(`
    <h2>${isNew ? "Add EMI" : "Edit EMI"}</h2>
    <p class="hint">Logged once. Each bill month shows the next installment and date.</p>
    <div class="form-grid">
      <label class="full">Title <input id="f-title" value="${esc(item?.title || "")}" placeholder="Gigabyte 5070Ti" /></label>
      <label>Person <select id="f-person">${peopleOptions(item?.personId || state.personId)}</select></label>
      <label>Monthly EMI (₹) <input id="f-amt" type="number" step="0.01" value="${item?.amount ?? ""}" /></label>
      <label>First bill month <select id="f-month">${monthOptions(item?.startBillMonth || state.leftMonth)}</select></label>
      <label>First EMI date <input id="f-date" type="date" value="${item?.startDate ? toISODate(item.startDate) : ""}" /></label>
      <label>Starting installment # <input id="f-startn" type="number" min="1" value="${item?.startN || 1}" /></label>
      <label>Total months <input id="f-total" type="number" min="1" value="${item?.totalMonths || 12}" /></label>
      <label>Note <input id="f-note" value="${esc(item?.note || "")}" placeholder="Half" /></label>
      <label>Card <select id="f-card">${cardOptions(item?.cardId)}</select></label>
    </div>
    <div class="modal-actions">
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const rec = {
      id: item?.id || uid(),
      title: $("f-title").value.trim(),
      personId: $("f-person").value,
      amount: Number($("f-amt").value),
      startBillMonth: $("f-month").value,
      startDate: $("f-date").value ? formatDate($("f-date").value) : "",
      startN: Number($("f-startn").value) || 1,
      totalMonths: Number($("f-total").value) || 1,
      note: $("f-note").value.trim(),
      cardId: $("f-card").value,
    };
    if (!rec.title) return toast("Title is required", true);
    const idx = state.data.emis.findIndex((p) => p.id === rec.id);
    if (idx >= 0) state.data.emis[idx] = rec;
    else state.data.emis.push(rec);
    closeModal();
    await persist("EMI saved");
    render();
  };
}

function openSubModal(item) {
  const isNew = !item?.id;
  openModal(`
    <h2>${isNew ? "Add monthly charge" : "Edit monthly charge"}</h2>
    <div class="form-grid">
      <label class="full">Title <input id="f-title" value="${esc(item?.title || "")}" placeholder="Netflix Membership" /></label>
      <label>Person <select id="f-person">${peopleOptions(item?.personId || state.personId)}</select></label>
      <label>Amount (₹) <input id="f-amt" type="number" step="0.01" value="${item?.amount ?? ""}" /></label>
      <label class="full">Active
        <select id="f-active">
          <option value="yes" ${item?.active === false ? "" : "selected"}>Yes — show every month</option>
          <option value="no" ${item?.active === false ? "selected" : ""}>Paused</option>
        </select>
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const rec = {
      id: item?.id || uid(),
      title: $("f-title").value.trim(),
      personId: $("f-person").value,
      amount: Number($("f-amt").value),
      active: $("f-active").value === "yes",
    };
    if (!rec.title) return toast("Title is required", true);
    const idx = state.data.subscriptions.findIndex((p) => p.id === rec.id);
    if (idx >= 0) state.data.subscriptions[idx] = rec;
    else state.data.subscriptions.push(rec);
    closeModal();
    await persist("Monthly charge saved");
    render();
  };
}

function openPersonModal(item) {
  openModal(`
    <h2>${item ? "Rename person" : "Add person"}</h2>
    <label>Name <input id="f-name" value="${esc(item?.name || "")}" placeholder="Chinnu" /></label>
    <div class="modal-actions">
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const name = $("f-name").value.trim();
    if (!name) return toast("Name is required", true);
    if (item) item.name = name;
    else {
      const rec = { id: uid(), name };
      state.data.people.push(rec);
      state.personId = rec.id;
    }
    closeModal();
    await persist("Person saved");
    render();
  };
}

function openCardModal(item) {
  openModal(`
    <h2>${item ? "Edit card" : "Add card"}</h2>
    <div class="form-grid">
      <label>Name <input id="f-name" value="${esc(item?.name || "")}" placeholder="Card ICICI" /></label>
      <label>Closing day <input id="f-day" type="number" min="1" max="31" value="${item?.closingDay || 22}" /></label>
    </div>
    <div class="modal-actions">
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const rec = { id: item?.id || uid(), name: $("f-name").value.trim(), closingDay: Number($("f-day").value) || 31 };
    if (!rec.name) return toast("Name is required", true);
    const idx = state.data.cards.findIndex((p) => p.id === rec.id);
    if (idx >= 0) state.data.cards[idx] = rec;
    else state.data.cards.push(rec);
    closeModal();
    await persist("Card saved");
    render();
  };
}

function openPaymentModal(personId, month) {
  const existing = paymentFor(personId, month);
  openModal(`
    <h2>Payment · ${esc(month)}</h2>
    <p class="hint">Money already received for this bill. Total bill = purchases − payments.</p>
    <label>Amount (₹) <input id="f-amt" type="number" step="0.01" min="0" value="${existing?.amount ?? 0}" /></label>
    <div class="modal-actions">
      <button class="btn" id="f-cancel" type="button">Cancel</button>
      <button class="btn primary" id="f-save" type="button">Save</button>
    </div>`);
  $("f-cancel").onclick = closeModal;
  $("f-save").onclick = async () => {
    const amount = Number($("f-amt").value) || 0;
    if (existing) existing.amount = amount;
    else state.data.payments.push({ id: uid(), personId, billMonth: month, amount });
    closeModal();
    await persist("Payment saved");
    render();
  };
}

/* ---------------- events ---------------- */

function bindChrome() {
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.onclick = () => { state.view = b.dataset.view; render(); };
  });
  $("cycle-prev").onclick = () => { state.leftMonth = addMonthsObj(parseMonth(state.leftMonth), -2).key; render(); };
  $("cycle-next").onclick = () => { state.leftMonth = addMonthsObj(parseMonth(state.leftMonth), 2).key; render(); };
  $("btn-add-person").onclick = () => openPersonModal();
  $("btn-add-item").onclick = () => {
    const p = currentPerson();
    if (!p) return openPersonModal();
    openPurchaseModal({ billMonth: visibleBillMonth(), personId: p.id });
  };
  $("btn-print").onclick = () => window.print();
  $("btn-export").onclick = async () => {
    const person = currentPerson();
    if (!person) return toast("Add a person first", true);
    const right = addMonthsObj(parseMonth(state.leftMonth), 1).key;
    try {
      toast("Writing bill tab…");
      const name = await Store.exportBills(person.name, state.leftMonth, right);
      toast("Wrote tab: " + (name || `${person.name} ${cycleLabel(state.leftMonth)}`));
    } catch (err) {
      toast(err.message, true);
    }
  };
}

function maybeLock() {
  const pin = state.data.meta?.pin;
  if (!pin) return false;
  if (sessionStorage.getItem(LS_PIN_OK) === "1") return false;
  $("lock-screen").hidden = false;
  $("lock-screen").classList.remove("hidden");
  $("app").style.display = "none";
  $("pin-unlock").onclick = () => {
    if ($("pin-input").value === pin) {
      sessionStorage.setItem(LS_PIN_OK, "1");
      $("lock-screen").hidden = true;
      $("app").style.display = "";
    } else {
      $("pin-error").hidden = false;
      $("pin-error").classList.remove("hidden");
      $("pin-error").textContent = "Wrong PIN";
    }
  };
  $("pin-input").onkeydown = (e) => { if (e.key === "Enter") $("pin-unlock").click(); };
  return true;
}

async function init() {
  bindChrome();
  try {
    state.data = await Store.load();
  } catch (err) {
    state.data = JSON.parse(localStorage.getItem(LS_KEY) || "null") || demoData();
    toast("Working offline from this browser", true);
  }
  if (!state.data.people) state.data = demoData();
  state.personId = state.data.people[0]?.id || null;
  const now = new Date();
  const thisMonth = formatMonth(now.getMonth(), now.getFullYear());
  const parsed = parseMonth(thisMonth);
  state.leftMonth = parsed.m % 2 === 0 ? thisMonth : addMonthsObj(parsed, -1).key;
  if (state.data.purchases.some((p) => p.billMonth === "Sep 26")) state.leftMonth = "Sep 26";
  maybeLock();
  setupPwa();
  render();
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function setupPwa() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredInstall = e;
    showInstallBar("Install Deepu Ledger on this phone for the full-screen app.");
  });
  if (isIos() && !isStandalone() && !sessionStorage.getItem("deepu-install-dismissed")) {
    showInstallBar("iPhone: tap Share, then Add to Home Screen.");
    $("btn-install").textContent = "How?";
  }
  $("btn-install").onclick = () => promptInstall(true);
  $("btn-install-dismiss").onclick = () => {
    sessionStorage.setItem("deepu-install-dismissed", "1");
    hideInstallBar();
  };
}

function showInstallBar(copy) {
  if (isStandalone()) return;
  const bar = $("install-bar");
  $("install-copy").textContent = copy;
  bar.hidden = false;
  bar.classList.remove("hidden");
}

function hideInstallBar() {
  $("install-bar").hidden = true;
  $("install-bar").classList.add("hidden");
}

async function promptInstall(fromSettings) {
  if (state.deferredInstall) {
    state.deferredInstall.prompt();
    await state.deferredInstall.userChoice;
    state.deferredInstall = null;
    hideInstallBar();
    return;
  }
  if (isIos()) {
    toast("Safari → Share → Add to Home Screen");
    showInstallBar("iPhone: tap Share, then Add to Home Screen.");
    return;
  }
  if (fromSettings) toast("Use your browser menu: Install app / Add to Home screen");
}

init();
