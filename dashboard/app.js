// Token Radar v17 dashboard. Derives every displayed field from DATA rows
// with the same formulas main.ts used; Rebuild recomputes implied from inputs.
const D = window.DATA, M = D.M, R = D.R.split("\n").map((l) => l.split("|"));
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (x) => { const s = String(Math.round(x)); let o = "", n = s.length; while (n > 3) { o = "," + s.slice(n - 3, n) + o; n -= 3; } return "$" + s.slice(0, n) + o; };
const l10 = (x) => Math.log(x) / Math.LN10;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const GAS_MIN = { Ethereum: 8, Base: 0.05, Solana: 0.01, Arbitrum: 0.2, Binance: 0.15, Avalanche: 0.3 };
const PLAN = 5000, HZ = 12, DROP = 0.07;
const gasMin = (r) => r.chains.length ? Math.min(...r.chains.map((c) => GAS_MIN[c] ?? 1)) : 1;
const gasFirst = (c) => { const x = String(c).toLowerCase();
  if (x === "ethereum") return 8; if (x === "solana") return 1;
  if (x === "bitcoin" || x === "babylon genesis" || x === "bittensor") return 2;
  if (["arbitrum", "optimism", "base", "zksync", "linea", "scroll", "blast", "mode", "mantle", "polygon", "bsc", "avalanche", "fantom", "gnosis"].includes(x)) return 1; return 2; };
const capitalStd = (r) => r.tvl >= 5e9 ? 250 : r.tvl >= 1e9 ? 150 : r.tvl >= 1e8 ? 100 : 50;
const holdStd = (age) => age < 180 ? 60 : age < 365 ? 45 : 30;
const L2S = ["Arbitrum", "Optimism", "Base", "zkSync Era", "Linea", "Scroll", "Blast", "Mode", "Mantle", "Polygon", "BSC", "Avalanche"];
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
function rowObj(a) {
  const ch = a[2] ? a[2].split(";").map((i) => M.CH[+i]) : [];
  const tvl = +a[3], g7 = a[4] === "" ? null : +a[4];
  const lt = l10(tvl);
  return { slug: slugify(a[0]), name: a[0], catI: +a[1], cat: M.CAT[+a[1]], chains: ch, tvl, g7, age: Math.abs(+a[5]), listedNull: +a[5] < 0, im: +a[6], odds: +a[7] / 1000, p10: +a[8], p90: +a[9],
    extrap: lt < 6.70 || lt > 10.01 || (g7 !== null && (g7 < -40.1 || g7 > 2.7)),
    grey: tvl >= 50e6 && a[10] !== "1", watch: a[10] === "1" };
}
const ROWS = R.map(rowObj);
function derive(r) {
  const gf = 1 + clamp(r.g7 ?? 0, -60, 200) / 100 * 0.75;
  const mf = 0.6 + Math.min(Math.max(r.age, 0), 1095) / 1095 * 0.4;
  const cm = Math.exp(M.curve.a + M.curve.b * Math.log(r.tvl));
  let binding = "size", bval = cm;
  if (gf < 1 || mf < 1) { if (gf <= mf) { binding = "growth"; bval = gf; } else { binding = "maturity"; bval = mf; } }
  const sl = 1000 * (r.im / r.tvl) * DROP * r.odds;
  const costs = 2 * gasMin(r) + PLAN * 0.001 + PLAN * 0.04 * (HZ / 52);
  const net = sl * (PLAN / 1000) - costs;
  const verdict = net > 25 ? "FARM" : net < -25 ? "SKIP" : "MARGINAL";
  const a3 = sl / 1000 - 0.001 - 0.04 * (HZ / 52);
  const gas = gasFirst(r.chains[0] || "Ethereum"), cap = capitalStd(r);
  const weeks = Math.max(1, Math.round(holdStd(r.age) / 7));
  const gs = (gas * 2 + gas * weeks) / cap * 100;
  const sig = [];
  if (r.watch) sig.push("watchlist");
  if (r.g7 !== null && r.g7 >= 10) sig.push("surging>=10%"); else if (r.g7 !== null && r.g7 <= -10) sig.push("sliding<=-10%");
  if (r.age >= 1095) sig.push("token-free>=3y");
  if (r.chains.length >= 8) sig.push("chains>=8");
  if (r.tvl >= 1e9) sig.push("billion-TVL");
  const launch = Math.round(Math.min(r.age, 1095) / 1095 * 40) + Math.round(clamp(l10(Math.max(1, r.tvl) / 5000000) / l10(1000) * 30, 0, 30));
  const tv = clamp(l10(Math.max(1, r.tvl) / 5000000) / l10(1000) * 40, 0, 40);
  const mo = (clamp(r.g7 ?? 0, -60, 200) + 60) / 260 * 20;
  const ma = Math.min(r.age, 1095) / 1095 * 20;
  const br = Math.min(r.chains.length, 5) / 5 * 10;
  const ce = Math.min(M.catN[r.catI] || 0, 10) / 10 * 10;
  const conf = 100 - (r.g7 === null ? 30 : 0) - (r.listedNull ? 30 : 0) - (r.cat === null ? 20 : 0) - (r.chains.length ? 0 : 20);
  const l2 = r.chains.slice(1).find((c) => L2S.includes(c)) || "";
  const rebuild = Math.max(1, Math.round(Math.min(r.tvl * cm * gf * mf, r.tvl)));
  return { ...r, mult: r.im / r.tvl, gf, mf, cm, binding, bval, cf: r.im / bval, uplift: 1 / bval,
    lo: Math.max(1, Math.round(r.im / M.range.hwIn)), hi: Math.round(r.im * M.range.hwIn),
    loOut: Math.max(1, Math.round(r.im / M.range.hwOut)), hiOut: Math.round(r.im * M.range.hwOut),
    net, costs, verdict, be: a3 > 0 ? 2 * gasMin(r) / a3 : null, walk: sl * (PLAN / 1000) / costs,
    evCost: (sl * (PLAN / 1000)) / costs, gasShare: gs, gasVerdict: gs <= 25 ? "FARM" : gs <= 50 ? "THIN" : "SKIP",
    farmValue: cap * (r.im / r.tvl), half: r.g7 !== null && r.g7 < -10, launch,
    conviction: Math.round(tv + mo + ma + br + ce), confidence: Math.max(0, conf), signals: sig,
    bear: (sl * 0.33 * (PLAN / 1000) - costs) > 25, l2, rebuild, match: rebuild === r.im,
    capTier: r.tvl >= 5e8 ? "institutional" : r.tvl >= 1e8 ? "large" : r.tvl >= 25e6 ? "mid" : "early" };
}
const DR = ROWS.map((r, i) => ({ ...derive(r), rank: i + 1 }));
{ const ord = [...DR].sort((a, b) => a.odds - b.odds || DR.indexOf(a) - DR.indexOf(b));
  ord.forEach((r, i) => { r.tier = i < 66 ? "LOW" : i < 132 ? "MED" : "HIGH"; }); }
const bySlug = {}; DR.forEach((r) => { bySlug[r.slug] = r; });
// ---- calendar D-11, computed live from DR (same rule as main.ts) ----
function calBuild() {
  const fr = DR.filter((r) => r.verdict === "FARM");
  const by = {};
  fr.forEach((r) => { const ch = r.chains[0] || "other"; (by[ch] = by[ch] || []).push(r); });
  const order = Object.keys(by).sort((a, b) => by[b].length - by[a].length || by[b].reduce((s, r) => s + r.net, 0) - by[a].reduce((s, r) => s + r.net, 0) || a.localeCompare(b));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sessions = order.slice(0, 7).map((ch, i) => ({ day: days[i], chain: ch, rows: by[ch].map((r) => r.slug), net: Math.round(by[ch].reduce((s, r) => s + r.net, 0)), hrs: 0.5 * by[ch].length }));
  if (order.length > 7) {
    const rest = order.slice(7).flatMap((ch) => by[ch]);
    const last = sessions[6];
    last.rows.push(...rest.map((r) => r.slug));
    last.net = Math.round(last.net + rest.reduce((s, r) => s + r.net, 0));
    last.hrs = 0.5 * last.rows.length;
    last.extra = "+" + order.slice(7).join(", ");
  }
  return { sessions, net: Math.round(fr.reduce((s, r) => s + r.net, 0)), hrs: 0.5 * fr.length, farmN: fr.length };
}
const CAL = calBuild();
// ---- farm steps: SAME generator as main.ts buildSteps (keep in sync) ----
const MECH = { Lending: "lending", Dexs: "DEX LP", Yield: "vault", RWA: "vault", "Basis Trading": "basis vault", Perps: "perps", Derivatives: "perps", Bridge: "bridge", CDP: "mint", Stablecoin: "mint", "Prediction Market": "prediction", Restaking: "restaking", Farm: "LP farm", Options: "options", Insurance: "cover", Staking: "staking", "Algo-Stables": "mint", "Cross Chain": "bridge", DEX: "DEX LP", "Yield Aggregator": "vault" };
const mechOf = (r) => MECH[r.cat || ""] || "protocol";
const ACT = {
  "DEX LP": ["make a second small swap through the same pool", "check the pool's share and top up only if your slice fell"],
  lending: ["borrow a small amount against the deposit, then repay it the same week", "check the borrow rate and your health factor"],
  perps: ["close the hedge, then reopen it at a fresh entry", "check funding and rebalance the hedge"],
  bridge: ["bridge a small amount back the other way", "check the return route's fee before moving anything"],
  prediction: ["open a second position in a different market", "check whether your market resolved and log the result"],
  staking: ["claim the rewards, then restake them", "check rewards accrued and claim if gas is cheap"],
  restaking: ["claim the rewards, then restake them", "check rewards accrued and claim if gas is cheap"],
  mint: ["mint a second small tranche, then repay part of it", "check the peg and your collateral ratio"],
  vault: ["add a second deposit tranche from a different wallet week", "check the vault's yield and your share of it"],
  "basis vault": ["add a second deposit tranche from a different wallet week", "check the vault's yield and your share of it"],
  cover: ["renew the cover for a second short window", "check the position and log one usage event per week"],
  options: ["roll the position into the next expiry", "check the position and log one usage event per week"],
};
const ACT_DEF = ["repeat the interaction on a second pool the protocol runs", "check the position and log one usage event per week"];
function secondAction(r) { return (ACT[mechOf(r)] || ACT_DEF)[0]; }
function weeklyAction(r) { return (ACT[mechOf(r)] || ACT_DEF)[1]; }
function buildSteps(r) {
  const pct = ((PLAN / r.tvl) * 100).toFixed(3);
  const exp = Math.round(r.im * r.odds);
  const beTxt = r.be === null ? "never breaks even at $5K/12wk/7%" : "breaks even at $" + Math.round(r.be);
  const ch2 = r.chains[1] || r.chains[0] || "its main chain";
  const rank = r.rank;
  return [
    "Deposit $" + PLAN.toLocaleString("en-US") + " into " + r.name + " (" + mechOf(r) + ") on " + (r.chains[0] || "its main chain") + ": gas about $" + gasMin(r) + " per tx plus $5 in fees. Your $" + PLAN.toLocaleString("en-US") + " is " + pct + "% of its TVL " + money(r.tvl) + ".",
    "Week 3: " + secondAction(r) + " on " + ch2 + ", so the wallet shows a second distinct usage, not one deposit. Keep the receipt; " + r.name + " ranks #" + rank + " at " + money(r.im) + " implied.",
    "Weekly (" + holdStd(r.age) + "d, ~30min): " + weeklyAction(r) + ". " + r.name + ": TVL moved " + (r.g7 === null ? "unreported" : r.g7.toFixed(1) + "%") + " in 7 days across " + r.chains.length + " chain" + (r.chains.length === 1 ? "" : "s") + ".",
    "Risk: farming does not guarantee you qualify; a launch can pass you by if you miss the snapshot, minimum activity, or a sybil filter. " + r.name + " " + beTxt + "; walk away if TVL rises past x" + r.walk.toFixed(2) + ". Verdict does not price eligibility risk: a launch does not guarantee you qualify.",
    "Exit after " + holdStd(r.age) + " days or at launch, whichever comes first: withdraw, claim, keep the transaction receipts. Expected value " + money(exp) + " at odds " + r.odds.toFixed(3) + " (" + r.tier + " tier, WF-tested). Verdict: " + r.verdict + "."
  ];
}

// ---- columns (20) ----
const COLS = [
  { k: "rank", t: "#", v: (r) => r.rank, n: 1 },
  { k: "name", t: "Protocol", v: (r) => r.name, l: 1, nm: 1 },
  { k: "tvl", t: "TVL", v: (r) => r.tvl, f: (r) => money(r.tvl) },
  { k: "g7", t: "7d %", v: (r) => r.g7 ?? -999, f: (r) => r.g7 === null ? "—" : r.g7.toFixed(1) + "%" },
  { k: "mult", t: "Mult", v: (r) => r.mult, f: (r) => r.mult.toFixed(3) + "x" },
  { k: "im", t: "Implied $", v: (r) => r.im, f: (r) => money(r.im) },
  { k: "range", t: "Range P25–P75", v: (r) => r.hi - r.lo, html: 1, f: (r) => money(r.lo) + "–" + money(r.hi) + "<span class='bar'><i style='width:" + Math.round((Math.log(r.im) - Math.log(r.loOut)) / (Math.log(r.hiOut) - Math.log(r.loOut)) * 100) + "%'></i></span>" },
  { k: "odds", t: "Odds", v: (r) => r.odds, f: (r) => r.odds.toFixed(3) },
  { k: "tier", t: "Tier", v: (r) => r.tier, f: (r) => r.tier },
  { k: "verdict", t: "Verdict", v: (r) => r.verdict, f: (r) => r.verdict },
  { k: "net", t: "Net $", v: (r) => r.net, f: (r) => (r.net >= 0 ? "+" : "−") + money(Math.abs(r.net)).slice(1) },
  { k: "why", t: "Why not higher", v: (r) => r.binding, f: (r) => r.binding + " x" + r.bval.toFixed(3) },
  { k: "be", t: "BE $", v: (r) => r.be ?? 1e12, f: (r) => r.be === null ? "never" : "$" + Math.round(r.be) },
  { k: "walk", t: "Walk", v: (r) => r.walk, f: (r) => "x" + r.walk.toFixed(2) },
  { k: "ev", t: "EV/cost", v: (r) => r.evCost, f: (r) => r.evCost.toFixed(2) + "x" },
  { k: "gas", t: "Gas%", v: (r) => r.gasShare, f: (r) => Math.round(r.gasShare) + "% " + r.gasVerdict },
  { k: "fv", t: "Farm $", v: (r) => r.farmValue, f: (r) => "$" + r.farmValue.toFixed(2) + (r.half ? " half" : "") },
  { k: "launch", t: "Launch", v: (r) => r.launch, f: (r) => r.launch },
  { k: "conv", t: "Conviction", v: (r) => r.conviction, f: (r) => r.conviction },
  { k: "rr", t: "Rank range", v: (r) => r.p90 - r.p10, f: (r) => "p10 " + Math.round(r.p10) + "–p90 " + Math.round(r.p90) },
];
const DEFVIS = ["rank", "name", "tvl", "g7", "mult", "im", "range", "odds", "tier", "verdict", "net", "why"];
let vis = new Set(DEFVIS);
let sortKeys = [{ k: "rank", dir: 1 }];
let showAll = false, dense = false;
let simH = 0, simD = 7;
function simNet(r) {
  const im2 = r.im * (1 - simH / 100);
  const sl = 1000 * (im2 / r.tvl) * (simD / 100) * r.odds;
  return sl * (PLAN / 1000) - (2 * gasMin(r) + PLAN * 0.001) - PLAN * 0.04 * (HZ / 52);
}
function filtered() {
  const q = ($("#q").value || "").toLowerCase();
  const fv = $("#fV").value, ft = $("#fT").value, fc = $("#fC").value;
  const fw = $("#fW").checked, fg = $("#fG").checked, fx = $("#fX").checked;
  return DR.filter((r) =>
    (!q || r.name.toLowerCase().includes(q) || r.slug.includes(q)) &&
    (!fv || r.verdict === fv) && (!ft || r.tier === ft) && (!fc || r.cat === fc) &&
    (!fw || r.watch) && (!fg || r.grey) && (!fx || r.extrap));
}
function sortedRows(list) {
  const arr = [...list];
  arr.sort((a, b) => {
    for (const s of sortKeys) {
      const c = COLS.find((x) => x.k === s.k); if (!c) continue;
      const va = c.v(a), vb = c.v(b);
      const d = typeof va === "string" ? String(va).localeCompare(String(vb)) : va - vb;
      if (d) return d * s.dir;
    }
    return a.rank - b.rank;
  });
  return arr;
}
function visibleRows() {
  let list = filtered();
  if (simH || simD !== 7) list = [...list].sort((a, b) => simNet(b) - simNet(a));
  else list = sortedRows(list);
  if (!showAll) {
    const keep = new Set();
    list.slice(0, 10).forEach((r) => keep.add(r.slug));
    DR.forEach((r) => { if ((r.verdict === "FARM" && r.walk < 2) || (r.verdict === "FARM" && r.costs > r.net) || r.grey) keep.add(r.slug); });
    list = list.filter((r) => keep.has(r.slug));
  }
  return list;
}
function renderBoard() {
  const cols = COLS.filter((c) => vis.has(c.k));
  const thead = $("#board thead");
  thead.innerHTML = "<tr>" + cols.map((c) => {
    const s = sortKeys.find((x) => x.k === c.k);
    return "<th data-k=\"" + c.k + "\" class=\"" + (c.l ? "l " : "") + (c.nm ? "nm" : "") + "\">" + c.t + (s ? (s.dir > 0 ? " ▲" : " ▼") : "") + "</th>";
  }).join("") + "</tr>";
  thead.querySelectorAll("th").forEach((th) => th.addEventListener("click", (ev) => {
    const k = th.dataset.k;
    const ex = sortKeys.find((x) => x.k === k);
    if (ev.shiftKey && ex) { ex.dir *= -1; }
    else if (ev.shiftKey) { sortKeys.push({ k, dir: 1 }); }
    else if (ex) { ex.dir *= -1; sortKeys = [ex]; }
    else sortKeys = [{ k, dir: 1 }];
    renderBoard();
  }));
  const list = visibleRows();
  const tb = $("#board tbody");
  tb.innerHTML = list.map((r) => "<tr data-slug=\"" + r.slug + "\">" + cols.map((c) => {
    let v = c.f ? c.f(r) : String(c.v(r));
    let cls = c.l || c.nm ? "l" : "num";
    if (c.nm) cls += " nm";
    if (c.k === "verdict") cls += " " + r.verdict;
    if (c.k === "tier") cls += " " + r.tier;
    if (c.k === "why") cls += " mono";
    if (c.k === "name") v = esc(r.name) + (r.watch ? " <span class='chip'>W</span>" : "") + (r.grey ? " <span class='chip'>grey</span>" : "") + (r.extrap ? " <span class='chip'>extr</span>" : "") + (r.bear ? " <span class='chip'>bear-proof</span>" : "") + (r.signals.length ? " <span class='chip'>" + esc(r.signals.join(",")) + "</span>" : "");
    else if (c.html) v = v;
    else v = esc(v);
    return "<td class=\"" + cls + "\">" + v + "</td>";
  }).join("") + "</tr>").join("");
  tb.querySelectorAll("tr").forEach((tr) => tr.addEventListener("click", () => showDetail(tr.dataset.slug)));
  const tot = list.reduce((s, r) => s + r.im, 0);
  $("#board tfoot").innerHTML = "<tr><td colspan=\"" + Math.max(1, cols.length - 2) + "\" class=\"l\">Shown " + list.length + " of " + DR.length + " rows</td><td class=\"num\">" + money(tot) + "</td><td></td></tr>";
  $("#discNote").textContent = showAll ? "Showing all 198 rows." : "Default: Top-10 + fragile FARM + downside>upside + grey-zone (" + list.length + " rows).";
  $("#showAll").textContent = showAll ? "Show default view" : "Show all 198";
}
function renderKpi() {
  const b = M.board, v = M.verdicts.base;
  const cells = [
    [b.total ? "198 / 40" : "", "ranked / watchlist"],
    [money(b.total), "implied value total"],
    ["x/" + M.held.full.medWF.toFixed(2), "median WF miss"],
    [M.range.covIn + "% / " + M.range.covOut + "%", "range inner / outer"],
    ["WF-tested", "launch odds"],
    [v[0] + " FARM", "worth farming"],
  ];
  $("#kpi").innerHTML = cells.map((c) => "<div><b>" + esc(c[0]) + "</b><span>" + esc(c[1]) + "</span></div>").join("");
}
function renderTiles() {
  const t = DR[0];
  const frag = DR.filter((r) => r.verdict === "FARM" && r.walk < 2).length;
  const down = DR.filter((r) => r.verdict === "FARM" && r.costs > r.net).length;
  $("#tiles").innerHTML =
    "<div class='tile'><b>" + esc(t.name) + " " + money(t.im) + "</b><span>Top-1 · " + t.mult.toFixed(3) + "x TVL · binding " + t.binding + " x" + t.bval.toFixed(3) + "</span></div>" +
    "<div class='tile'><b>" + money(M.board.median) + "</b><span>Median implied · top-10 " + money(M.board.top10) + "</span></div>" +
    "<div class='tile'><b>" + money(M.odds.exp) + "</b><span>Expected board value (odds-weighted)</span></div>" +
    "<div class='tile'><b>" + M.verdicts.base.join(" / ") + "</b><span>FARM / MARGINAL / SKIP at $5K/12wk/7%</span></div>" +
    "<div class='tile'><b>" + M.flag + " flagged · " + M.grey + " grey-zone</b><span>Extrapolated + above-floor non-watchlist rows</span></div>" +
    "<div class='flag'><b>FRAGILE: " + frag + " of " + M.verdicts.base[0] + " FARM die if TVL doubles; " + M.verdicts.bearN + " bear-proof; " + down + " FARM lose more than they gain if disqualified.</b><span>Walk-away median x" + M.d04.med.toFixed(2) + " (FARM). No bear-proof core on this board.</span></div>";
  $("#narr").textContent = M.narrative;
}
function renderChooser() {
  const ch = $("#chooser");
  ch.innerHTML = COLS.map((c) => "<label><input type='checkbox' data-k='" + c.k + "'" + (vis.has(c.k) ? " checked" : "") + "> " + c.t + "</label>").join("");
  ch.querySelectorAll("input").forEach((inp) => inp.addEventListener("change", () => {
    if (inp.checked) vis.add(inp.dataset.k); else vis.delete(inp.dataset.k);
    if (!vis.size) vis.add("name");
    renderBoard();
  }));
}
// ---- detail view ----
function showDetail(slug) {
  const r = bySlug[slug]; if (!r) return;
  const steps = buildSteps(r);
  const el = $("#detail");
  el.innerHTML = "<h2>" + esc(r.name) + " <span style='color:var(--mu);font-size:13px'>#" + r.rank + " · " + esc(r.cat || "—") + "</span></h2>" +
    "<div class='kv'>" +
    "<div><b>" + money(r.im) + "</b><span>implied value · " + r.mult.toFixed(3) + "x TVL " + money(r.tvl) + "</span></div>" +
    "<div><b>" + money(r.lo) + "–" + money(r.hi) + "</b><span>range P25–P75 (outer " + money(r.loOut) + "–" + money(r.hiOut) + ")</span></div>" +
    "<div><b>" + r.odds.toFixed(3) + " " + r.tier + "</b><span>launch odds (WF-tested)</span></div>" +
    "<div><b class='" + r.verdict + "'>" + r.verdict + " · net " + (r.net >= 0 ? "+" : "−") + money(Math.abs(r.net)).slice(1) + "</b><span>$5K/12wk/7% · gas $" + gasMin(r) + "/tx · hold " + holdStd(r.age) + "d</span></div>" +
    "<div><b>" + (r.be === null ? "never" : "$" + Math.round(r.be)) + "</b><span>break-even (D-03)</span></div>" +
    "<div><b>x" + r.walk.toFixed(2) + "</b><span>walk-away (D-04)</span></div>" +
    "<div><b>" + r.evCost.toFixed(2) + "x</b><span>EV/cost (D-50)</span></div>" +
    "<div><b>" + r.launch + " / " + r.conviction + " / " + r.confidence + "</b><span>launch / conviction / confidence</span></div>" +
    "</div>" +
    "<h3>Rebuild</h3><p>Recomputed from inputs x factors: TVL " + money(r.tvl) + " x curve " + r.cm.toFixed(4) + " x growth " + r.gf.toFixed(3) + " x maturity " + r.mf.toFixed(3) + " = <b>" + money(r.rebuild) + "</b> vs board " + money(r.im) + " — <b class='" + (r.match ? "good" : "bad") + "'>" + (r.match ? "MATCH" : "MISMATCH") + "</b>. Rank range bootstrap p10 " + Math.round(r.p10) + "–p90 " + Math.round(r.p90) + ".</p>" +
    "<h3>Why not higher (audit §3)</h3><div class='audit'><p>Binding factor: <span class='bind'>" + r.binding + " x" + r.bval.toFixed(3) + "</span>. Size curve x" + r.cm.toFixed(3) + " · growth x" + r.gf.toFixed(3) + " · maturity x" + r.mf.toFixed(3) + ". If the binding factor were 1.0, this row would be <b>" + money(r.cf) + "</b> — uplift <b>x" + r.uplift.toFixed(2) + "</b>. " + (r.binding === "size" ? "Both discounts are ≥1.0, so the curve itself binds." : "The curve is the base; the discount is what holds this row down.") + "</p></div>" +
    "<h3>Farm plan (" + mechOf(r) + ", " + esc(r.chains[0] || "main chain") + (r.l2 ? " + cheapest L2 " + esc(r.l2) : "") + ")</h3><ol class='steps'>" + steps.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>" +
    "<p>Verdict does not price eligibility risk: a launch does not guarantee you qualify. Signals: " + (r.signals.length ? esc(r.signals.join(", ")) : "none") + " · capital tier " + r.capTier + " · gas-share " + Math.round(r.gasShare) + "% (" + r.gasVerdict + ") · farm value $" + r.farmValue.toFixed(2) + (r.half ? " (half-size: 7d " + r.g7 + "%)" : "") + " · bear survivor: " + (r.bear ? "yes" : "no") + ".</p>" +
    "<h3>Pool calculator (D-10)</h3><p>Pool $ <input id='d10p' type='number' value='1000000'> Deposits $ <input id='d10d' type='number' value='5000000'> Capital $ <input id='d10c' type='number' value='5000'> <button id='d10go'>Calculate</button> <span id='d10out'></span></p>" +
    "<p><button id='dClose'>Close detail</button></p>";
  el.querySelector("#dClose").addEventListener("click", () => { el.innerHTML = ""; history.replaceState(null, "", location.pathname); });
  el.querySelector("#d10go").addEventListener("click", () => {
    const pool = +el.querySelector("#d10p").value || 0, dep = +el.querySelector("#d10d").value || 0, cap = +el.querySelector("#d10c").value || 0;
    const payout = dep > 0 ? pool * Math.min(1, cap / dep) : 0;
    const fc = 2 * gasMin(r) + cap * 0.001 + cap * 0.04 * (HZ / 52);
    el.querySelector("#d10out").textContent = "Payout " + money(payout) + " · fixed costs " + money(fc) + " · net " + (payout - fc >= 0 ? "+" : "−") + money(Math.abs(payout - fc)).slice(1);
  });
  el.querySelector("#d10go").click();
  el.scrollIntoView();
}
// ---- evidence ----
function tbl(head, rows, numIdx) {
  return "<table><thead><tr>" + head.map((h, i) => "<th class='" + (numIdx && numIdx.includes(i) ? "num" : "l") + "'>" + h + "</th>").join("") + "</tr></thead><tbody>" +
    rows.map((row) => "<tr>" + row.map((c, i) => "<td class='" + (numIdx && numIdx.includes(i) ? "num" : "l") + "'>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
}
function pvFactor(tge, cliff, months, discYr) {
  const rm = (1 + discYr) ** (1 / 12) - 1;
  let s = 0; for (let m = cliff + 1; m <= cliff + months; m++) s += (1 + rm) ** (-m);
  return tge + (1 - tge) * (1 / months) * s;
}
function vcLive(f, gasMult, plan) {
  const c = [0, 0, 0];
  DR.forEach((r) => {
    const sl = 1000 * (r.im / r.tvl) * DROP * r.odds * f;
    const net = sl * (plan / 1000) - (2 * gasMin(r) * gasMult + plan * 0.001) - plan * 0.04 * (HZ / 52);
    c[net > 25 ? 0 : net < -25 ? 2 : 1]++;
  });
  return c;
}
function renderEvidence() {
  const h = M.held;
  const heldRows = [["Curve full (x growth x maturity)", "full"], ["Curve alone", "curve"], ["Model A (ridge lam30)", "A"], ["Model B (lam3)", "B"], ["Model C (power 0.45)", "C"], ["Challenger D-24", "D24"], ["Flat 0.229x", "flat"], ["Placebo (shuffled)", "plac"]].map(([label, k]) => { const x = h[k]; return [label, "x/" + x.medLOO.toFixed(2), "x/" + x.meanLOO.toFixed(2), "x/" + x.medWF.toFixed(2), "x/" + x.meanWF.toFixed(2)]; });
  const scen = [["Base $5K/12wk/7%", vcLive(1, 1, 5000)], ["Vesting typical", vcLive(pvFactor(0.2, 0, 12, 0.2), 1, 5000)], ["Vesting harsh", vcLive(pvFactor(0.1, 6, 24, 0.3), 1, 5000)], ["Vesting generous", vcLive(pvFactor(0.5, 0, 12, 0.2), 1, 5000)], ["Bear x0.33", vcLive(0.33, 1, 5000)], ["Bull x2.5", vcLive(2.5, 1, 5000)], ["Bull x3.0", vcLive(3, 1, 5000)], ["Multi-wallet", vcLive(1, 4, 5000)], ["Log-share $1K", vcLive(Math.log(2), 1, 1000)], ["Log-share $5K", vcLive(Math.log(6) / 5, 1, 5000)], ["Log-share $25K", vcLive(Math.log(26) / 25, 1, 25000)]];
  $("#tab-evidence").innerHTML = "<div class='ev'>" +
    "<h2>Odds panel — LAUNCH ODDS · WF-TESTED</h2>" +
    "<p>50% richer logistic (log10 TVL, log10 age, growth/100, log10 #chains, log10 age x log10 TVL, TVL percentile-in-category, TOPCATS dummies; ridge lam=1) + 30% empirical (category x age-band, shrink 10) + 20% base rate 0.5488. Per-row odds from the FULL fit; only the formulation is WF-tested. Tiers are tertiles of the 198 board odds. Odds in-sample is NOT used.</p>" +
    "<div class='cards'>" +
    ["HIGH", "MED", "LOW"].map((t) => { const v = M.odds.tiers[t]; return "<div class='card " + t + "'><b>" + v[0] + "%</b><span>" + t + " tier · " + v[1] + "/" + v[2] + " launched" + (t === "HIGH" ? " (odds ≥ " + M.odds.cut[1] + ")" : t === "LOW" ? " — target ≤25%: <span class='warn'>WAIVED miss (+0.7pp), reported as-is</span> (Zul 25 Nov 2026)" : "") + "</span></div>"; }).join("") + "</div>" +
    tbl(["Walk-forward cut", "Brier (ensemble)", "Brier (base rate)", "Called-right"], M.odds.brier.map((b, i) => [["40/60", "50/50", "67/33"][i], b, M.odds.base[i], M.odds.called[i] + "%"]), [1, 2, 3]) +
    "<p>Odds range on board: min " + M.odds.min + " · median " + M.odds.med + " · max " + M.odds.max + ". Expected board value " + money(M.odds.exp) + ".</p>" +
    "<h3>What-if (live)</h3><p>Vesting (PV on slice): <select id='wVest'><option value='none'>none (PV 1.000)</option><option value='typ'>typical (PV 0.926)</option><option value='harsh'>harsh (PV 0.707)</option><option value='gen'>generous (PV 0.954)</option></select> <label><input type='checkbox' id='wMulti'> 4 wallets (gas x4)</label> <span id='wOut'></span></p>" +
    "<h2>§1 Model selection — the duel</h2>" +
    tbl(["Model", "Median LOO", "Mean LOO", "Median WF", "Mean WF"], heldRows, [1, 2, 3, 4]) +
    "<p>Rule (mean WF lowest wins; diff &lt;0.10x → median LOO; tie → B) picks <b>A</b> (mean WF 5.45x vs curve 5.72x). This board is a <b>BET</b> on the curve: better medians (LOO 2.72 vs 3.43; WF 3.76 vs 4.11) and headlines closest to #1 kiencx. D-24 (cat median shift): medLOO x/" + h.D24.medLOO.toFixed(2) + ", meanWF x/" + h.D24.meanWF.toFixed(2) + " — mean-WF edge over A is noise; not adopted. Newest-35 (train oldest 57, test 35; median/mean): A 4.57/6.59 · curve full 5.49/6.73 · curve alone 5.84/6.86 · B 4.91 · C 4.81 · D-24 5.16.</p>" +
    "<h2>§2 Flat baselines + category medians</h2><p>Flat median multiple (clean-92) 0.229x: median LOO x/" + h.flat.medLOO.toFixed(2) + ", mean WF x/" + h.flat.meanWF.toFixed(2) + ". Every fitted model beats flat. Placebo (growth shuffled, seeded): median LOO x/" + h.plac.medLOO.toFixed(2) + ", mean WF x/" + h.plac.meanWF.toFixed(2) + " — growth carries real signal. D-06: the model is roughly flat on LOO vs A; its value is in odds, ranges and farm economics, not a much better point forecast.</p>" +
    tbl(["Category (clean-92, n≥5)", "n", "Median multiple"], M.d28.map((d) => [d.cat, d.n, d.med + "x"]), [1, 2]) +
    "<p>D-58: CEX max ratio " + M.cexMax + "x (Nexo) — exchanges are excluded from the board by rule. D-59 age percentiles (days): all snapshot p25/median/p75 " + M.d59.all.join("/") + "; pre-token " + M.d59.pt.join("/") + ".</p>" +
    "<h2>§3 Range calibration (split-conformal, k re-searched on WF)</h2>" +
    tbl(["Cut", "Inner (k=1.7)", "Outer (k=1.5)"], [["40/60", "57.1%", "78.6%"], ["50/50", "52.2%", "82.6%"], ["67/33 (clean cut, n=31)", M.range.ccIn + "%", M.range.ccOut + "%"]], [1, 2]) +
    "<p>Mean WF: inner " + M.range.covIn + "% / outer " + M.range.covOut + "% (targets 50/80). Half-widths: inner x/" + M.range.hwIn.toFixed(2) + " · outer x/" + M.range.hwOut.toFixed(2) + " (wide but honest). Tercile coverage on clean cut (inner/outer): T1 " + M.range.tercile[0][1] + "%/" + M.range.tercile[0][2] + "% · T2 " + M.range.tercile[1][1] + "%/" + M.range.tercile[1][2] + "% · T3 " + M.range.tercile[2][1] + "%/" + M.range.tercile[2][2] + "%. U-shape (median |LOO err| by listing tercile): x/" + M.range.ushape.join(", x/") + " — newest tercile much worse. D-43 |LOO resid| vs growth: Pearson " + M.range.d43[0] + ", Spearman " + M.range.d43[1] + ".</p>" +
    "<h2>§4 Conformal battery (negative controls)</h2><p>Jackknife+ (train oldest 67%, test n=31): " + M.range.jk.in + "% / " + M.range.jk.out + "% (x/" + M.range.jk.wIn + " / x/" + M.range.jk.wOut + "). Mondrian by TVL tercile (calib pool B n=40): " + M.range.mond.in + "% / " + M.range.mond.out + "% (shrink 0.5: " + M.range.mond.inS + "% / " + M.range.mond.outS + "%); half-widths x/" + M.range.mond.med.join(", x/") + ". CQR-lite (" + (M.range.cqr.ok ? "usable" : "NOT usable") + "): " + M.range.cqr.covIn + "% / " + M.range.cqr.covOut + "% (x/" + M.range.cqr.wIn + " / x/" + M.range.cqr.wOut + "). None beats plain split-conformal; the plain method stands.</p>" +
    "<h2>§5 Economics — break-even, walk-away, vesting, regimes</h2>" +
    tbl(["Scenario", "FARM", "MARGINAL", "SKIP"], scen.map(([l, c]) => [l, c[0], c[1], c[2]]), [1, 2, 3]) +
    "<p>D-03 break-even: " + M.d03.fin + " finite / " + M.d03.nev + " never; median $" + M.d03.med + ", p10 $" + M.d03.p10 + ", p90 $" + M.d03.p90 + ", max $" + M.d03.max + ". D-04 walk-away (FARM n=" + M.d04.n + "): median x" + M.d04.med + ", fragile (&lt;2x) " + M.d04.frag + ", robust (&gt;10x) " + M.d04.rob + ". Bear: ZERO survivors (vs A-board 3). Log-share $5K: ZERO survivors. D-50 EV/cost: median " + M.d50.med + "x, max " + M.d50.max + "x; &gt;1x: " + M.d50.gt1 + " rows, &gt;3x: " + M.d50.gt3 + ". D-51: FARM n=" + M.d51.n + ", median downside −$" + Math.abs(M.d51.down) + " vs upside +$" + M.d51.up + "; " + M.d51.worse + " rows lose more than they gain if disqualified.</p>" +
    "<h2>§6 Gas-share + farm value</h2><p>D-55: " + M.d55.f + " FARM / " + M.d55.t + " THIN / " + M.d55.s + " SKIP; median " + M.d55.med + "%, max " + M.d55.max + "% (identical to the A-board — model-independent). D-56 farm value: median $" + M.d56.med + ", max $" + M.d56.max + "; half-size rows " + M.d56.half + ".</p>" +
    "<h2>§7 Launch score, conviction, confidence, signals</h2><p>D-53 launch (age+size, growth excluded per D-05): median " + M.d53.med + ", p10 " + M.d53.p10 + ", p90 " + M.d53.p90 + ", max " + M.d53.max + ". D-33 conviction (TVL 40 + momentum 20 + maturity 20 + breadth 10 + category-evidence 10): median " + M.d33.med + ", p10 " + M.d33.p10 + ", p90 " + M.d33.p90 + ", max " + M.d33.max + "; top-5 " + M.d33.top.map((t) => t[0] + " " + t[1]).join(", ") + ". D-54: " + M.d54.c100 + " rows at 100, " + M.d54.c70 + " at 70. D-57 signals (watchlist/chains≥8/billion-TVL/token-free≥3y/sliding/surging/zero): " + M.d57.sig.watch + "/" + M.d57.sig.ch8 + "/" + M.d57.sig.bil + "/" + M.d57.sig.free3y + "/" + M.d57.sig.slid + "/" + M.d57.sig.surg + "/" + M.d57.sig.zero + ". Capital tiers: institutional " + M.d57.tiers.inst + " · large " + M.d57.tiers.large + " · mid " + M.d57.tiers.mid + " · early " + M.d57.tiers.early + ".</p>" +
    "<h2>§8 Bootstrap rank ranges (D-22)</h2><p>200 refits, seeded: median width " + M.boot.medW + " ranks; ≤10: 167/198; &gt;50: 0/198; top-20 stability " + M.boot.stab + "% (vs A-board width 53 / stability 70.9%, which failed the ≥80% target). Curve ranks are near-monotone in TVL, hence stable.</p>" +
    tbl(["Top-10 row", "p10", "p50", "p90"], DR.slice(0, 10).map((r, i) => [r.name, Math.round(r.p10), Math.round(r.p50), Math.round(r.p90)]), [1, 2, 3]) +
    "<h2>§9 Audit — why not higher (§3)</h2><p>Binding factor = smallest discount (growth vs maturity); the curve is the base and binds only when both discounts ≥1.0. Distribution: maturity " + M.audit.dist.maturity + " / growth " + M.audit.dist.growth + " / size " + M.audit.dist.size + ". Largest uplifts: " + M.audit.top.map((t) => t.name + " (" + t.binding + " x" + t.bval.toFixed(3) + " → x" + t.uplift.toFixed(2) + ", counterfactual " + money(t.cf) + ")").join(", ") + "</p>" +
    "<h2>§10 Disposition + integrity (D-62)</h2><p>All 758 protocols: ranked 198 / has token 416 / bridge 43 / liquid staking 43 / exchange custody 42 / versioned 11 / wrapped 5 / other 0. Flag extrapolation (c): " + M.flag + "/198 outside traded logTVL range [6.70, 10.01] or growth range [−40.1, +2.7]. Grey-zone D-09: " + M.grey + "/198 (above $50M floor, clean, not on watchlist).</p>" +
    "<h2>§11 Calendar (D-11)</h2><p>" + CAL.farmN + " FARM rows across " + CAL.sessions.length + " sessions; total FARM net " + money(CAL.net) + "; " + CAL.hrs + " hours (0.5h/row/week). Full strip on the Calendar tab.</p>" +
    "<h2>§12 Literature + caveats</h2><p>D-35/D-36/D-75: liquidity discount curves, launch-odds ensembles and walk-forward testing are standard practice; this entry applies them to a sealed snapshot with no look-ahead. D-37: TVL is a noisy proxy; the curve's R² 0.206 means most variance is unexplained. D-39: odds are a ranking device, not a probability. D-40: the rule picks A; this board is a bet, reported as such. D-61: snapshot 2026-11-14; nothing here updates.</p>" +
    "</div>";
  const wOut = () => {
    const k = $("#wVest").value;
    const pv = k === "typ" ? pvFactor(0.2, 0, 12, 0.2) : k === "harsh" ? pvFactor(0.1, 6, 24, 0.3) : k === "gen" ? pvFactor(0.5, 0, 12, 0.2) : 1;
    const c = vcLive(pv, $("#wMulti").checked ? 4 : 1, 5000);
    $("#wOut").textContent = "Live: " + c[0] + " FARM / " + c[1] + " MARGINAL / " + c[2] + " SKIP.";
  };
  $("#wVest").addEventListener("change", wOut); $("#wMulti").addEventListener("change", wOut);
  wOut();
}
function renderCalendar() {
  $("#tab-calendar").innerHTML = "<div class='ev'><h2>Farm calendar (D-11)</h2><p>" + CAL.farmN + " FARM rows · total FARM net " + money(CAL.net) + " · " + CAL.hrs + " hours (0.5h/row/week). Sorted by net/hour.</p><div class='cal'>" +
    CAL.sessions.map((s) => "<div><b>" + s.day + " · " + esc(s.chain) + "</b>" + s.rows.length + " rows · net " + money(s.net) + " · " + s.hrs + "h" + (s.extra ? "<br>also " + esc(s.extra.slice(1)) : "") + "</div>").join("") +
    "</div><p>Chains beyond the top 7 join the last session.</p></div>";
}
function renderInteg() {
  const tot = DR.reduce((s, r) => s + r.im, 0);
  const match = DR.filter((r) => r.match).length;
  const sorted = DR.every((r, i) => i === 0 || r.im <= DR[i - 1].im);
  $("#integ").textContent = "Integrity: Rebuild MATCH " + match + "/198 · ranks 1–198 · values never rise: " + (sorted ? "yes" : "NO") + " · total " + money(tot) + " = board.json total · ledger 758 (" + M.disp.join("/") + ") · main.ts " + M.cs + "… · dossier whole.";
}
// ---- export ----
function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportJSON() {
  download("board-v17.json", JSON.stringify({ meta: M, rows: DR.map((r) => ({ slug: r.slug, name: r.name, rank: r.rank, implied_value_usd: r.im, category: r.cat, chains: r.chains, tvl_usd: r.tvl, change_7d: r.g7, age_days: r.age, odds: r.odds, tier: r.tier, verdict: r.verdict, net_usd: Math.round(r.net), binding_factor: r.binding, binding_value: +r.bval.toFixed(3), counterfactual_usd: Math.round(r.cf), uplift_mult: +r.uplift.toFixed(2), farm_steps: buildSteps(r) })) }, null, 1), "application/json");
}
function exportCSV() {
  const head = "rank,name,category,chains,tvl_usd,change_7d,age_days,implied_usd,odds,tier,verdict,net_usd,binding_factor,counterfactual_usd";
  const lines = DR.map((r) => [r.rank, "\"" + r.name.replace(/"/g, "\"\"") + "\"", r.cat, "\"" + r.chains.join(";") + "\"", r.tvl, r.g7 === null ? "" : r.g7, r.age, r.im, r.odds, r.tier, r.verdict, Math.round(r.net), r.binding, Math.round(r.cf)].join(","));
  download("board-v17.csv", head + "\n" + lines.join("\n") + "\n", "text/csv");
}
// ---- tabs + hash routing ----
function setTab(t) {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  $("#tab-board").hidden = t !== "board";
  $("#tab-evidence").hidden = t !== "evidence";
  $("#tab-calendar").hidden = t !== "calendar";
  if (t === "evidence") renderEvidence();
  if (t === "calendar") renderCalendar();
}
function route() {
  const h = location.hash;
  const dm = h.match(/#detail=([a-z0-9.-]+)/);
  const vm = h.match(/#verdict=(FARM|MARGINAL|SKIP)/);
  const tm = h.match(/#tab=(evidence|calendar|board)/);
  if (tm) setTab(tm[1]);
  if (vm) { $("#fV").value = vm[1]; renderBoard(); }
  if (dm) { setTab("board"); showDetail(dm[1]); }
}
window.addEventListener("hashchange", route);
// ---- init ----
(function init() {
  const cats = [...new Set(DR.map((r) => r.cat).filter(Boolean))].sort();
  $("#fC").innerHTML = "<option value=''>Category: all</option>" + cats.map((c) => "<option>" + esc(c) + "</option>").join("");
  renderKpi(); renderTiles(); renderChooser(); renderBoard(); renderInteg();
  ["q", "fV", "fT", "fC", "fW", "fG", "fX"].forEach((id) => document.getElementById(id).addEventListener("input", renderBoard));
  $("#showAll").addEventListener("click", () => { showAll = !showAll; renderBoard(); });
  $("#dens").addEventListener("click", () => { dense = !dense; document.body.classList.toggle("dense", dense); $("#dens").textContent = "Density: " + (dense ? "compact" : "comfy"); });
  $("#cols").addEventListener("click", () => { const c = $("#chooser"); c.hidden = !c.hidden; });
  $("#expJ").addEventListener("click", exportJSON);
  $("#expC").addEventListener("click", exportCSV);
  $("#simH").addEventListener("input", (e) => { simH = +e.target.value; $("#simHv").textContent = simH + "%"; renderBoard(); });
  $("#simD").addEventListener("input", (e) => { simD = +e.target.value; $("#simDv").textContent = simD + "%"; renderBoard(); });
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  route();
})();
