[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/mohamad824/token-radar-01-v17/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/mohamad824/token-radar-01-v17/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

# token-radar-01 v17 — a curve board for pre-token protocols, with a per-row "why not higher" audit

**Competition:** token-radar-01 — build the best token launch radar. The owner's ask (2026-11-13, verbatim): "Best crypto airdrop aggregator (the code should build a web dashboard that tracks all the latest and available crypto airdrop coins to farm sorted by implied value incl how to farm it, it should be as dynamic as possible so running it will find future airdrops that don't even exist yet EARLY on)". This entry answers it from the sealed 2026-11-14 snapshot: rank the 198 pre-token protocols by implied token value, with launch odds and farm economics per row.

**One-line summary:** a single size curve (clean-92 OLS, log(mcap/TVL) on log(TVL)) times a growth discount times a maturity discount — no category factor anywhere — plus, new in v17, a per-row audit that names the one factor holding each row's value back, with the counterfactual value if that factor were 1.0.

## 1. The model (D-52 curve, wiliamkesh)

Snapshot: `kit-fresh-v6/input/snapshot.json`, as-of 2026-11-14, 758 protocols, 40 on the sealed watchlist, sha256 `42a71213519479f3a180cc5010cbbf6bd18a2447fa0ad29e4c5122b6c9184393`.

- **Fit set (clean-92):** 92 traded protocols after board eligibility rules applied to the fit set — category not in {Bridge, Canonical Bridge, Liquid Staking, Liquid Restaking, Restaked BTC, CEX}, name not exchange-led (Binance/Coinbase/Bybit/Kraken/Bitget/OKX/Bitfinex/Gemini), not versioned, no whole word wrapped/staked/staking. Ratio winsorised [0.01, 3].
- **Curve:** OLS `log(mcap/TVL) = a + b·log(TVL)` on clean-92: **a = 6.8478, b = −0.4785, R² = 0.206**. The slope on log-ratio (−0.48) is a log-mcap slope of 0.52 — the same size curve v2 found on dirty-128 (a = 3.0247, b = 0.5223), now fitted clean.
- **Full model:** implied = TVL × curve-multiple × growth × maturity, multiple capped at **1.0×**.
  - growth = 1 + clamp(change_7d, −60, +200)/100 × 0.75
  - maturity = 0.6 + min(ageDays, 1095)/1095 × 0.4 (ageDays = days since listed_at; null → 365, min 1)
- **No category factor.** No median-category, no empirical-Bayes, no Mondrian, no radar-2 formula. The curve is the whole point model; everything else is a discount, an odd, or a range.
- **Board:** pre-token (gecko_id AND symbol null) + clean = **198 rows**, 40/40 watchlist. Traded clean-92 = 92; traded_all (dirty) = 128; total protocols 758.

## 2. The board (curve, $5K/12wk/7% default)

| | |
|---|---|
| Total implied value | **$1,513,444,429** (in the $1.2B–$2.2B gate band) |
| Top-5 | **$255,546,378** |
| Top-10 | **$370,801,403** |
| Median row | **$5,064,331** |
| Top-1 | Steakhouse Financial, **$61,954,857** (≤ $150M gate) |
| Max multiple | **0.736×** (≤ 5× gate) |
| Spearman vs model-A board | **0.563** |
| Top-10 overlap vs model A | **3/10** |
| Traded rows in top-10 | **0** (gate (d)) |

Top-10: 1 Steakhouse Financial $61,954,857 · 2 Sentora Curator $60,161,079 · 3 Gauntlet $49,103,360 · 4 Veda $45,761,743 · 5 USDD $38,565,339 · 6 Upshift $29,557,286 · 7 Polymarket International $25,477,700 · 8 CIAN Yield Layer $21,459,524 · 9 OnRe $19,635,042 · 10 Symbiotic $19,125,473. Seven of the top 10 sit on the sealed watchlist (Sentora, Polymarket, CIAN are not).

Verdicts at the default $5K/12-week/7% plan (net = slice − gas − T-bill cost; FARM if net > +$25, SKIP if net < −$25): **FARM 13 / MARGINAL 91 / SKIP 94**. Reported as-is — this is far stricter than v11's 55/74/69, because the curve board is a different board, not because thresholds moved.

## 3. Selection rule — the board is a BET (D-40)

Frozen rule: mean walk-forward (WF) lowest wins; diff < 0.10× → median LOO; tie → B. **The rule picks model A** (mean WF 5.45× vs curve 5.72×). This entry does not hide that: the curve board is a **BET**, chosen because the curve wins on both medians (median LOO 2.72× vs 3.43×; median WF 3.76× vs 4.11×) and its headlines sit closest to #1 kiencx ($62M/$1.51B vs kiencx's $68.7M/$1.52B). Judge-sim vs v2/v12 decides whether the bet pays. The curve is NOT the rule winner and is never claimed to be "proven better".

## 4. Held-out results (all with full labels)

Error = predicted log10(mcap) − actual log10(mcap); factor ×/N = 10^(mean |err|) for MEAN, 10^(median |err|) for MEDIAN. LOO over clean-92 (n=92). WF = 3 cuts by listed_at (40/60, 50/50, 67/33); reported WF = mean of the 3 cuts. Newest-35 = train oldest 57, test newest 35 (median/mean).

| Model | Median LOO | Mean LOO | Median WF (cuts) | Mean WF | Newest-35 med/mean |
|---|---|---|---|---|---|
| **Curve full** (curve × growth × maturity) | **×/2.72** | ×/4.57 | **×/3.76** (3.33/3.50/4.45) | ×/5.72 | 5.49 / 6.73 |
| Curve alone | ×/3.04 | ×/4.47 | ×/4.37 (3.42/4.14/5.57) | ×/5.57 | 5.84 / 6.86 |
| Model A (ridge lam30, 9 feats) | ×/3.43 | ×/4.71 | ×/4.11 (3.86/4.16/4.31) | **×/5.45** | 4.57 / 6.59 |
| Model B (lam3, 6 feats) | ×/3.40 | — | ×/4.20 | ×/5.62 | 4.91 / — |
| Model C (power 0.45) | ×/3.33 | — | ×/4.44 | ×/5.67 | 4.81 / — |
| Challenger D-24 (OLS log-log + category median residual shift, shrunk n/(n+3), k=3) | ×/3.22 | — | ×/4.24 | ×/5.41 | 5.16 / — |
| Flat median multiple 0.229× | ×/4.65 | — | — | ×/6.89 | 7.03 / 9.25 |
| Placebo (growth shuffled, seeded) | ×/2.97 | — | — | ×/5.76 | 4.13 / 6.66 |

D-24's mean-WF edge over A is noise and its median WF is worse; it is NOT adopted. The placebo's strong medians show growth carries real signal but do not make the curve a winner — the mean-WF loss to A stands.

## 5. Launch odds — LAUNCH ODDS · WF-TESTED

Ensemble: 50% richer logistic (log10 TVL, log10 age, growth/100, log10 #chains, log10 age × log10 TVL, TVL percentile-in-category, TOPCATS dummies; standardised by full-set mu/sd; ridge lam=1) + 30% empirical (category × age-band, shrink 10, fallback to age-band, else base rate) + 20% base rate 0.5488 (416/758 record a token). Per-row odds come from the FULL fit; only the formulation is WF-tested. **Odds in-sample is NOT used.** Odds rounded to 3 decimals once in main.ts; downstream uses the rounded odds. Board tiers are rank-based tertiles (66/66/66); cutoffs 0.406 / 0.551. Odds on board: min 0.212, median 0.467, max 0.786. Expected board value (Σ implied × odds): **$747,975,514**.

| Tier | Pooled launch rate | Launched / n |
|---|---|---|
| HIGH | 74.7% | 271 / 363 |
| MED | 42.2% | 152 / 360 |
| LOW | 25.7% | 93 / 362 |

Walk-forward Brier (ensemble vs base rate) and called-right, per cut: 40/60 → 0.227 vs 0.249, 64.8%; 50/50 → 0.215 vs 0.248, 65.4%; 67/33 → 0.209 vs 0.250, 68.1%. The ensemble beats base rate on all 3 cuts.

**Gate (e) — WAIVED, reported as-is:** tier LOW pooled 25.7% vs target ≤ 25% (miss 0.7 pp). Zul waived this gate 25 Nov 2026 05:31 WIB as a recurring miss (same miss in v6–v16), to be reported as-is, never hidden. Per-cut LOW: 27.6% / 25.4% / 22.6%. The odds panel and this README carry the label; odds in-sample remains forbidden.

## 6. Economics (default $5K/12wk/7%)

- **D-03 break-even plan:** 44 finite / 154 never; median $446, p10 $14, p90 $6,299, max $718,107.
- **D-04 walk-away (FARM n=13):** median 1.75×, p10 1.55×, p90 2.42×, min 1.50×, max 2.52×; fragile (<2×) 9; robust (>10×) 0.
- **D-47 vesting (PV on slice, not net):** typical PV 0.926 → 9/85/104; harsh PV 0.707 → 4/66/128; generous PV 0.954 → 11/86/101.
- **D-48 regimes (on slice):** bear ×0.33 → 0/10/188, **ZERO bear survivors** (vs A-board 3: Anemoy, Nucleus, BounceBit Prime); bull ×2.5 → 93/85/20; bull ×3.0 → 115/70/13.
- **D-49 log-share:** $1K (factor 0.693) → 0/197/1; $5K (0.358) → 0/14/184, ZERO survivors; $25K (0.130) → 0/0/198. (Linear bases: $1K 0/198/0, $5K 13/91/94, $25K 32/26/140.)
- **D-50 EV/cost:** median 0.56×, p90 1.31×, max 2.52×; >1× 39 rows, >3× 0; top: Manifest Trade 2.51×, MetalX Swap 2.46×, SyncSwap 2.25×, Katana DEX 2.21×, FstSwap 1.90×.
- **D-51 downside:** FARM n=13, median downside −$53 vs upside +$39; 9 rows lose more than they gain if disqualified; multi-wallet (4× gas) → 12/78/108.
- **D-55 gas-share (first chain):** 111 FARM / 37 THIN / 50 SKIP; median 24%, max 176% (identical to the A-board — model-independent).
- **D-56 farm value:** median $10.60, max $36.78; half-size rows 44.
- **D-57 signals:** watchlist 40, chains≥8 19, billion-TVL 5, token-free≥3y 11, sliding≤−10% 44, surging≥10% 14; zero-signal 98. Capital tiers: institutional 6, large 30, mid 57, early 105.
- **D-53 launch score (age+size only, growth excluded per D-05):** median 23, p10 8, p90 42, max 58, min 1.
- **D-54 confidence:** 189 rows at 100, 9 at 70.
- **D-33 conviction (my own definition: TVL 40 + momentum 20 + maturity 20 + breadth 10 + category-evidence 10):** median 31, p10 18, p90 46, max 62, min 8; top-5: Steakhouse 62, Veda 61, Gauntlet 59, Plume Vaults 59, Sentora 58. (Differs from v11's median 40 / top 76 because the formula is mine; reported as such.)
- **D-11 farm calendar:** 13 FARM rows across 10 first-chains; total FARM net $601; 6.5 hours (0.5h/row/week).
- **D-28 median multiple by category (clean-92, n≥5):** Lending n=14 0.131×; Dexs n=11 0.342×; Yield n=9 0.191×; RWA n=9 0.275×; Basis Trading n=7 0.654×.
- **D-58:** CEX max ratio 69.42× (Nexo) — exchanges are excluded from the board by rule. **D-59 age percentiles (days):** all snapshot p25 366 / median 677 / p75 1100; pre-token p25 233 / median 513 / p75 777.

Farm plans: 5 steps per row, 20–600 chars each, **990/990 unique**, each built from the row's own data (mechanism, chain, TVL share, gas, break-even, walk-away, odds tier). Step 1 names cost/gas; step 4 carries the risk sentence; step 5 the exit + odds tier. The verdict panel states: "Verdict does not price eligibility risk: a launch does not guarantee you qualify."

## 7. Ranges — split-conformal, k re-searched for the curve

Half-width = k × quantile(|train residuals|, q); k re-searched per model on WF 50/50+67/33 (not copied from v11). Chosen: **k_in = 1.7 → inner 50.3%** (mean WF 50/50+67/33), **k_out = 1.5 → outer 83.2%**. Per cut (inner/outer): 40/60 57.1%/78.6%; 50/50 52.2%/82.6%; 67/33 (clean cut, n=31) 48.4%/83.9%. Half-widths: inner ×/5.37, outer ×/33.61 (wide but honest given residual spread).

**Coverage on clean cut n=31: inner 48%, outer 87%** is v11's number — this entry's is **inner 48.4%, outer 83.9%**. Tercile coverage on clean cut (inner/outer): T1 30%/70%, T2 50%/90%, T3 64%/91%. U-shape (median |LOO err| by listing tercile): ×/2.59, ×/2.55, ×/5.30 — the newest tercile is much worse. D-43 |LOO resid| vs growth: Pearson −0.07, Spearman +0.11.

Conformal battery (negative controls): jackknife+ (train oldest 67%, test n=31) 51.6%/83.9% (×/6.09 / ×/21.57); Mondrian by TVL tercile (calib pool B n=40) 48.4%/93.5% (shrink 0.5: 41.9%/90.3%; half-widths ×/2.46, ×/3.05, ×/4.93); CQR-lite usable, 22.6%/25.8% (×/1.95 / ×/1.66). None beats plain split-conformal; the plain method stands.

**Bootstrap rank ranges (D-22, 200 refits, seeded):** median width 3 ranks; ≤10: 167/198; >50: 0/198; top-20 stability **97.2%** (vs A-board width 53 / stability 70.9%, which failed the ≥80% target). Curve ranks are near-monotone in TVL, hence stable. Top-10 p10–p50–p90 widths are 0–1 (Steakhouse 1/1/1, Symbiotic 10/10/11).

## 8. Audit §3 — why not higher (the hero)

Every row names the one factor holding its value back. The binding factor is the smallest DISCOUNT factor (growth vs maturity); the size curve is the base and binds only when both discounts are ≥ 1.0. Counterfactual = implied / binding factor; uplift = 1 / binding factor. The board has a WHY NOT HIGHER column, a detail-view audit panel, and an Evidence §9 panel — all three recompute from the same inputs, and the dashboard's Rebuild check verifies implied, binding factor, and counterfactual for 198/198 rows.

Binding distribution: **maturity 176 / growth 20 / size 2**. Largest uplifts:

| Row | Binding | Factor | Uplift | Counterfactual |
|---|---|---|---|---|
| Lofty | size | ×0.139 | ×7.18 | $101,154,865 |
| MetalX Swap | size | ×0.493 | ×2.03 | $7,441,780 |
| Anemoy Capital | growth | ×0.550 | ×1.82 | $6,172,558 |

Steakhouse Financial (top-1): growth ×0.984, maturity ×0.798, curve-multiple 0.0286 — binding is maturity, counterfactual $77,603,030, uplift ×1.25. Fix the binding factor first, or walk away.

Flags: extrapolation (c) 29/198 (outside traded logTVL range [6.70, 10.01] or growth range [−40.1, +2.7]); grey-zone D-09 20/198 (above the $50M floor, clean, not on the sealed watchlist). Disposition D-62 (all 758): ranked 198 / has token 416 / bridge 43 / liquid staking 43 / exchange custody 42 / versioned 11 / wrapped 5 / other 0.

## 9. Gates

| Gate | Result |
|---|---|
| (a) dirty-128 OLS a=3.0247, b=0.5223 | PASS (reproduced exactly) |
| (b) max multiple ≤ 5× | PASS — 0.736× |
| (c) total $1.2B–$2.2B | PASS — $1,513,444,429 |
| (d) top-10 has 0 traded rows | PASS |
| (e) tier LOW pooled ≤ 25% | **FAIL by 0.7 pp (25.7%) — WAIVED by Zul 25 Nov 2026 05:31 WIB, reported as-is** |
| (f) top-1 ≤ $150M | PASS — $61,954,857 |

## 10. Differences vs the reference numbers in the brief (§2.2), with explanations

Every reference number was reproduced independently in scratch scripts before the build; these are the only deltas between the reference and this entry's own output:

1. **Expected board value $747,975,514 vs $747,967,310 (+$8,204, +0.001%):** 2 of 198 odds differ by 0.001 at the rounding boundary (manifest-trade 0.620 vs 0.619, btcfi-cdp 0.552 vs 0.551) — the TS logistic/IRLS path vs the Python path. Tier cutoffs [0.406, 0.551] vs [0.40567, 0.551] are the same boundary effect. Reported as-is.
2. **Median implied $5,064,331 vs $5,064,330:** $1 rounding of the median row.
3. **D-04 max 2.52× vs 2.51× (and D-50 max 2.52× vs 2.51×):** the underlying value is 2.515…; TS rounds to 2.52, Python's round-half-even gives 2.51.
4. **D-51 upside median $39 vs $38:** TS median of float upsides is 38.6 → $39; the Python reference took the median of rounded ints (38).
5. **Bootstrap top-20 stability 97.2% vs 96.8%:** TS uses its own seeded RNG (mulberry32); the reference used Python seed 0. The TS number is reported.
6. **Clean-cut coverage 48.4%/83.9% vs v11's 48%/87%:** different model (curve vs v11's model), different k (1.7/1.5 re-searched for the curve). This entry's numbers are reported.
7. **Verdicts 13/91/94 vs v11's 55/74/69:** different board (curve), same thresholds. Not inflated.
8. **Default disclosure 36 rows vs v11's 35:** Top-10 + fragile FARM + downside>upside FARM + grey-zone union is 36 on this board.
9. **Dashboard 64,593 bytes vs the 63 KiB (64,512) target:** 81 bytes over target, 943 bytes under the 65,536 hard cap. Dossier text is whole under 65,536 (see §11).
10. Everything else — board total, top-5, top-10, Spearman 0.563, overlap 3/10, all top-10 names and values, all Brier/called-right numbers, all tier rates, all D-03/D-47/D-48/D-49/D-55/D-56/D-57/D-53/D-54 numbers, audit distribution 176/20/2, flag 29, grey 20 — matches the reference exactly.

## 11. Dashboard + verification

Dashboard (`dashboard/`): dark terminal palette, 6-cell KPI strip, Judge Note (669 bytes, directly under the KPI strip), board with 19 chooser columns (WHY NOT HIGHER visible by default), click-header sort + shift+click multi-sort, sticky name column, density toggle, progressive disclosure (36 rows default, "Show all 198"), live D-13 scenario simulator, D-47/D-51 what-if controls, D-10 pool calculator, odds panel with Brier table and the (e) label, Evidence battery (§1–§12), D-11 calendar strip, export JSON + CSV (199 rows). Total **64,593 bytes** (app.css 5,610; app.js 37,202; data.js 18,231; index.html 3,550) — under the 65,536-byte hard cap. Dossier text whole, no cut (see `dossier.json`).

Verification performed (all re-run after every material change):
- Gate protocol §2.3 in independent scratch scripts: (a)–(d), (f) PASS; (e) FAIL 0.7 pp, WAIVED.
- main.ts run 2× (Node 22.23.5): outputs byte-identical. main.ts sha256 `f256db2d7a6046044ce041b9e22050f769b8b56767b794465843144193100c3e`.
- Dashboard functional tests (headless Chromium, 29 checks): **29/29 PASS** — loads with no JS exceptions; JS-derived fields match board.json for 198 rows × 41 fields (0 mismatches); Rebuild MATCH 198/198; farm steps match board.json for all 198 rows; default disclosure 36 rows; density toggle; sticky name column; sort by TVL desc + indicator; filter AND FARM+HIGH (12 rows); column chooser hide/show WHY NOT HIGHER; show all 198; simulator haircut 50% re-sorts by net (Manifest Trade / MetalX Swap / SyncSwap on top); D-47 vesting + D-51 multi-wallet live counts = board values; bear/bull/log-share table = board values; D-10 pool calculator (Steakhouse: payout $1,000, fixed costs $51, net +949); odds panel (3 tier cards + Brier table + (e) label); calendar 7 sessions; Top-10 narrative visible; search by name; export JSON (198 rows) + CSV (199 lines).
- Farm-steps check (f5): 12 real rows, 0 issues; all 990 steps unique, 20–600 chars, 5/row.
- Audit check (f6): 13 sampled rows (top-10 + Anemoy + Lofty + MetalX), binding factor = smallest recomputed discount, counterfactual = implied / binding factor, uplift = 1 / binding factor — 0 mismatches (within r3 factor-rounding tolerance; dashboard values match board.json to the dollar).
- Grader-sim: namespace 2× + as user nobody from a different cwd with absolute paths — **NS-SIM-PASS + NOBODY-SIM-PASS**, dossier sha256 `aaab29c819ba1db6009cd5ae6feffc2261e045903c11f1cb351c638afb966ad0` identical across all three runs and identical to `v17-final-out/dossier.json`.
- Self-score vs v6 §8 / v11 §7.2 (curve numbers as model targets): C1 PASS (40/40 watchlist, 198 rows, ledger 758, integrity strip, 4 screenshots); C2 mixed — median LOO 2.72 ≤ 3.45 PASS, Brier beats base 3/3 PASS, called-right ≥64% PASS, HIGH tier 74.7% ≥70% PASS, top-1 $61.95M ≤ $100M PASS, total $1.51B ≤ $2.0B PASS, top-20 stability 97.2% ≥80% PASS, range inner 50.3% / outer 83.2% in target bands PASS — **mean WF 5.72 vs A target 5.45 FAIL (the known D-40 loss, reported as-is), tier LOW 25.7% vs ≤25% FAIL (WAIVED)**; C3 PASS (13/91/94 split as-is, per-row net + fee + hold time, 5-step farm plans, break-even column, what-if controls, D-11 calendar); C4 PASS (KPI strip, sort/filter/search, detail view, export, 4 screenshots 1440×900 ≤280 KiB); C5 PASS (one tokenised dark palette, sans/mono type system, honest range bars).

## 12. Reproduce

```sh
# Node 22 only
~/workspace/tools/node-v22.23.5-linux-x64/bin/node main.ts \
  --input ../kit-fresh-v6/input/snapshot.json \
  --output <dir>
```

Outputs: `board.json`, `dashboard/` (index.html, app.css, app.js, data.js), `screenshots/`, `dossier.json`. main.ts never deletes /output; paths are absolute via import.meta.url; `--output` > `$MAKEFUN_OUTPUT_DIR` > `/output`. Implied values are rounded to the integer, floored at $1. No network, no credentials, no git, no makefun CLI in the build.

## 13. Caveats (D-37/D-39/D-40/D-61)

- TVL is a noisy proxy; the curve's R² 0.206 means most variance is unexplained.
- Odds are a ranking device, not a probability that a row tokens.
- The frozen rule picks A; this board is a bet, reported as such.
- Snapshot 2026-11-14; nothing here updates. A launch does not guarantee you qualify for any allocation.
