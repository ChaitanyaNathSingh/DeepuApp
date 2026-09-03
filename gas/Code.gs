/**
 * Deepu Ledger — Google Sheets backend
 * Bind this script to spreadsheet "Deepu Ledger", then Deploy → Web app.
 *
 * If Google says it has not verified the app: Advanced → Go to Deepu Ledger (unsafe) → Allow.
 * That screen appears for every personal script. You are the owner.
 */

const SHEETS = ["People", "Cards", "Purchases", "Emis", "Subscriptions", "Payments", "Meta"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.action) {
    return HtmlService.createHtmlOutputFromFile("Index")
      .setTitle("Deepu Ledger")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  let result;
  try {
    result = { ok: true, data: route(p) };
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  const body = p.callback
    ? p.callback + "(" + JSON.stringify(result) + ")"
    : JSON.stringify(result);
  return ContentService.createTextOutput(body).setMimeType(
    p.callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON
  );
}

function route(p) {
  ensureSchema();
  if (p.action === "load") return getAllData();
  if (p.action === "saveStart") {
    CacheService.getScriptCache().put("chunk_" + p.token + "_n", String(p.n), 300);
    return true;
  }
  if (p.action === "saveChunk") {
    CacheService.getScriptCache().put("chunk_" + p.token + "_" + p.i, p.c || "", 300);
    return true;
  }
  if (p.action === "saveCommit") {
    const cache = CacheService.getScriptCache();
    const n = Number(cache.get("chunk_" + p.token + "_n") || 0);
    let json = "";
    for (let i = 0; i < n; i++) json += cache.get("chunk_" + p.token + "_" + i) || "";
    const data = JSON.parse(json);
    saveAllData(data);
    return true;
  }
  if (p.action === "export") {
    return generateFormattedBills(p.person, p.left, p.right);
  }
  throw new Error("Unknown action");
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Deepu Ledger")
    .addItem("Open app", "openApp")
    .addItem("Rebuild this spreadsheet", "ensureSchema")
    .addToUi();
}

function openApp() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(url ? "Open:\n" + url : "Deploy the script as a web app first (Deploy → New deployment → Web app).");
}

function ensureSchema() {
  const ss = SpreadsheetApp.getActive();
  const headers = {
    People: ["id", "name"],
    Cards: ["id", "name", "closingDay"],
    Purchases: ["id", "date", "description", "amount", "personId", "billMonth", "cardId"],
    Emis: ["id", "title", "personId", "amount", "interestRate", "principal", "startBillMonth", "startDate", "startN", "totalMonths", "note", "cardId"],
    Subscriptions: ["id", "title", "personId", "amount", "active"],
    Payments: ["id", "personId", "billMonth", "amount"],
    Meta: ["key", "value"],
  };
  SHEETS.forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const needed = headers[name];
    const last = Math.max(sh.getLastColumn(), needed.length);
    const have = sh.getRange(1, 1, 1, last).getValues()[0].map(String);
    if (have.join("") === "") {
      sh.getRange(1, 1, 1, needed.length).setValues([needed]).setFontWeight("bold");
      return;
    }
    needed.forEach(function (h) {
      if (have.indexOf(h) < 0) {
        const col = sh.getLastColumn() + 1;
        sh.getRange(1, col).setValue(h).setFontWeight("bold");
        have.push(h);
      }
    });
  });
}

function sheetRows(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function (r) { return r.join("") !== ""; }).map(function (r) {
    const o = {};
    headers.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function writeSheet(name, rows, headers) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (!rows.length) return;
  const data = rows.map(function (row) {
    return headers.map(function (h) {
      const v = row[h];
      if (v === true || v === false) return v;
      return v == null ? "" : v;
    });
  });
  sh.getRange(2, 1, data.length, headers.length).setValues(data);
}

function getAllData() {
  ensureSchema();
  const metaRows = sheetRows("Meta");
  const meta = { pin: "", gasUrl: "", defaultCardId: "" };
  metaRows.forEach(function (r) { meta[String(r.key)] = r.value; });
  return {
    people: sheetRows("People").map(function (r) { return { id: String(r.id), name: String(r.name) }; }),
    cards: sheetRows("Cards").map(function (r) {
      return { id: String(r.id), name: String(r.name), closingDay: Number(r.closingDay) || 31 };
    }),
    purchases: sheetRows("Purchases").map(function (r) {
      return {
        id: String(r.id),
        date: formatMaybeDate(r.date),
        description: String(r.description || ""),
        amount: r.amount === "" || r.amount == null ? "" : Number(r.amount),
        personId: String(r.personId),
        billMonth: String(r.billMonth),
        cardId: String(r.cardId || ""),
      };
    }),
    emis: sheetRows("Emis").map(function (r) {
      return {
        id: String(r.id),
        title: String(r.title),
        personId: String(r.personId),
        amount: Number(r.amount),
        interestRate: r.interestRate === "" || r.interestRate == null ? "" : Number(r.interestRate),
        principal: r.principal === "" || r.principal == null ? "" : Number(r.principal),
        startBillMonth: String(r.startBillMonth),
        startDate: formatMaybeDate(r.startDate),
        startN: Number(r.startN) || 1,
        totalMonths: Number(r.totalMonths) || 1,
        note: String(r.note || ""),
        cardId: String(r.cardId || ""),
      };
    }),
    subscriptions: sheetRows("Subscriptions").map(function (r) {
      return {
        id: String(r.id),
        title: String(r.title),
        personId: String(r.personId),
        amount: Number(r.amount),
        active: r.active !== false && String(r.active).toLowerCase() !== "false",
      };
    }),
    payments: sheetRows("Payments").map(function (r) {
      return { id: String(r.id), personId: String(r.personId), billMonth: String(r.billMonth), amount: Number(r.amount) || 0 };
    }),
    meta: meta,
  };
}

function saveAllData(data) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    ensureSchema();
    writeSheet("People", data.people || [], ["id", "name"]);
    writeSheet("Cards", data.cards || [], ["id", "name", "closingDay"]);
    writeSheet("Purchases", data.purchases || [], ["id", "date", "description", "amount", "personId", "billMonth", "cardId"]);
    writeSheet("Emis", data.emis || [], ["id", "title", "personId", "amount", "interestRate", "principal", "startBillMonth", "startDate", "startN", "totalMonths", "note", "cardId"]);
    writeSheet("Subscriptions", data.subscriptions || [], ["id", "title", "personId", "amount", "active"]);
    writeSheet("Payments", data.payments || [], ["id", "personId", "billMonth", "amount"]);
    const meta = data.meta || {};
    writeSheet("Meta", Object.keys(meta).map(function (k) { return { key: k, value: meta[k] }; }), ["key", "value"]);
  } finally {
    lock.releaseLock();
  }
}

function formatMaybeDate(v) {
  if (!v) return "";
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) {
    const d = v.getDate();
    return (d < 10 ? "0" : "") + d + "-" + MONTHS[v.getMonth()] + "-" + v.getFullYear();
  }
  return String(v);
}

function parseMonth(s) {
  const parts = String(s || "").trim().split(/\s+/);
  const m = MONTHS.indexOf(parts[0]);
  const y = 2000 + parseInt(parts[1], 10);
  return { m: m, y: y, key: MONTHS[m] + " " + String(y).slice(-2) };
}

function addMonthsKey(key, n) {
  const o = parseMonth(key);
  const d = new Date(o.y, o.m + n, 1);
  return MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(-2);
}

function monthDiff(aKey, bKey) {
  const a = parseMonth(aKey);
  const b = parseMonth(bKey);
  return (b.y - a.y) * 12 + (b.m - a.m);
}

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return n + "th";
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
}

function addCalendarMonths(dateStr, n) {
  const s = String(dateStr || "");
  const match = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return s;
  const mi = MONTHS.indexOf(match[2]);
  const d = new Date(+match[3], mi, +match[1]);
  const day = d.getDate();
  const nd = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
  nd.setDate(Math.min(day, last));
  const dd = nd.getDate();
  return (dd < 10 ? "0" : "") + dd + "-" + MONTHS[nd.getMonth()] + "-" + nd.getFullYear();
}

function money(n) {
  return Number(n || 0);
}

function buildBill(data, personId, monthKey) {
  const purchases = (data.purchases || []).filter(function (x) {
    return x.personId === personId && x.billMonth === monthKey;
  }).map(function (x) {
    return { date: x.date || "", description: x.description, amount: x.amount };
  });
  const emis = (data.emis || []).filter(function (e) { return e.personId === personId; }).map(function (emi) {
    const offset = monthDiff(emi.startBillMonth, monthKey);
    const n = Number(emi.startN) + offset;
    if (n < 1 || n > Number(emi.totalMonths)) return null;
    const note = emi.note ? " (" + emi.note + ")" : "";
    const rate = Number(emi.interestRate) > 0 ? " @ " + emi.interestRate + "%" : "";
    return {
      date: addCalendarMonths(emi.startDate, offset),
      description: emi.title + " " + ordinal(n) + " EMI Of " + emi.totalMonths + "M" + note + rate,
      amount: Number(emi.amount),
    };
  }).filter(Boolean);
  const subs = (data.subscriptions || []).filter(function (s) {
    return s.personId === personId && s.active !== false;
  }).map(function (s) {
    return { date: "Monthly", description: s.title, amount: Number(s.amount) };
  });
  const lines = purchases.concat(emis, subs);
  const purchTotal = lines.reduce(function (sum, r) {
    return sum + (r.amount === "" || r.amount == null ? 0 : money(r.amount));
  }, 0);
  const payRow = (data.payments || []).find(function (p) { return p.personId === personId && p.billMonth === monthKey; });
  const payment = money(payRow && payRow.amount);
  return { purchases: purchases, recurring: emis.concat(subs), purchTotal: purchTotal, payment: payment, total: purchTotal - payment };
}

function generateFormattedBills(personName, leftMonth, rightMonth) {
  ensureSchema();
  const data = getAllData();
  const person = (data.people || []).find(function (p) { return p.name === personName; });
  if (!person) throw new Error("Person not found: " + personName);
  const ss = SpreadsheetApp.getActive();
  const tabName = (personName + " " + String(leftMonth).split(" ")[0] + "-" + rightMonth).replace(/\s+/g, " ").slice(0, 31);
  let sh = ss.getSheetByName(tabName);
  if (!sh) sh = ss.insertSheet(tabName);
  sh.clear();
  sh.setHiddenGridlines(true);

  writeMonthBlock_(sh, 1, person, leftMonth, buildBill(data, person.id, leftMonth));
  writeMonthBlock_(sh, 6, person, rightMonth, buildBill(data, person.id, rightMonth));

  sh.setColumnWidth(1, 120);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 120);
  sh.setColumnWidth(4, 24);
  sh.setColumnWidth(5, 24);
  sh.setColumnWidth(6, 120);
  sh.setColumnWidth(7, 340);
  sh.setColumnWidth(8, 120);
  sh.getRange("C:C").setNumberFormat("₹#,##0.00");
  sh.getRange("H:H").setNumberFormat("₹#,##0.00");
  return tabName;
}

function writeMonthBlock_(sh, col, person, monthKey, bill) {
  const head = sh.getRange(1, col, 1, 3);
  head.setValues([["Date", "Description  (" + monthKey + ")", person.name]]);
  head.setFontWeight("bold").setBackground("#1c1916").setFontColor("#f7f1e6");

  let r = 2;
  bill.purchases.forEach(function (line) {
    sh.getRange(r, col, 1, 3).setValues([[line.date, line.description, line.amount === "" ? "" : line.amount]]);
    r++;
  });
  r += 3;
  bill.recurring.forEach(function (line) {
    sh.getRange(r, col, 1, 3).setValues([[line.date, line.description, line.amount]]);
    r++;
  });
  const purchRow = r;
  const totalRow = r + 1;
  sh.getRange(purchRow, col, 1, 3).setValues([["Payments", "Purchases", bill.purchTotal]]);
  sh.getRange(totalRow, col, 1, 3).setValues([[bill.payment, "Total Bill", bill.total]]);
  sh.getRange(purchRow, col + 1, 2, 2).setFontColor("#9c2b20").setFontWeight("bold");
  sh.getRange(totalRow, col).setFontColor("#1d4e89").setFontWeight("bold");
}
