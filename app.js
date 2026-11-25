/* Español en marcha – study companion (offline, single file app) */
(function () {
  "use strict";
  const D = window.DATA;
  const $view = document.getElementById("view");
  const $title = document.getElementById("title");
  const $back = document.getElementById("backBtn");
  const DAY = 86400000;

  /* ------------------------------------------------------------------ storage */
  const KEY = "esp-en-marcha-v1";
  const defaults = () => ({
    unit: 0, srs: {}, topGroup: 1, groupScore: {}, topTenses: ["pres"], bookTenses: null,
    dir: null, lang: "both", rate: 0.9, mode: "bank", sessionLen: 15, streak: { last: "", days: 0 }, learned: 0,
  });
  let S;
  try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch (e) { S = defaults(); }
  if (S.dir === "mix") S.dir = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }

  /* ------------------------------------------------------------------ helpers */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const units = D.units;
  const unitByN = Object.fromEntries(units.map((u) => [u.n, u]));
  const maxUnit = units[units.length - 1].n;
  const tenseName = (t) => D.tenses[t].es;
  const tenseFull = (t) => `${D.tenses[t].es} · ${D.tenses[t].en}`;
  const PERS_SHORT = ["yo", "tú", "él / ella / usted", "nosotros/as", "vosotros/as", "ellos / ellas / ustedes"];
  const IMP_PERS = [null, "tú", "usted", "nosotros/as", "vosotros/as", "ustedes"];
  const personLabel = (t, i) => (t === "imp" || t === "impneg") ? IMP_PERS[i] : PERS_SHORT[i];
  function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800); }

  function bumpStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (S.streak.last === today) return;
    const y = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    S.streak.days = S.streak.last === y ? S.streak.days + 1 : 1;
    S.streak.last = today;
  }

  /* ------------------------------------------------------------------ speech */
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === "es-ES" && /Mónica|Monica|Jorge|Marisol|Google/i.test(v.name)) || vs.find((v) => v.lang === "es-ES") || vs.find((v) => /^es/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!("speechSynthesis" in window)) { toast("Speech is not available on this device"); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\(.*?\)\s*/g, " ").replace(/\//g, ","));
    u.lang = "es-ES"; if (voice) u.voice = voice; u.rate = S.rate || 0.9;
    speechSynthesis.speak(u);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) { e.stopPropagation(); speak(b.getAttribute("data-say")); }
  });
  const sayBtn = (t, big) => `<button class="speak${big ? " big" : ""}" data-say="${esc(t)}" aria-label="Listen">🔊</button>`;

  /* ------------------------------------------------------------------ answer checking */
  const PRON = "yo|tú|él|ella|usted|nosotros|nosotras|vosotros|vosotras|ellos|ellas|ustedes";
  function norm(s) {
    return String(s).toLowerCase().replace(/[¿?¡!.,;:"'«»“”()…\-–—]/g, " ").replace(/\s+/g, " ").trim();
  }
  function bare(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function variants(s) {
    const n = norm(s);
    const out = new Set([n]);
    out.add(n.replace(new RegExp(`(^|\\b(?:ayer|hoy|antes|mañana|ahora|ojalá|cinco|tiempo|semana)\\s)(?:${PRON})\\s`), "$1"));
    out.add(n.replace(new RegExp(`(^|\\s)a (?:mí|mi|ti|él|ella|usted|nosotros|nosotras|vosotros|vosotras|ellos|ellas|ustedes)\\s`), "$1"));
    out.add(n.replace(new RegExp(`^(?:${PRON})\\s`), ""));
    return [...out].map((x) => x.trim());
  }
  function check(user, answers) {
    const uv = variants(user);
    if (!norm(user)) return { ok: false, level: "no" };
    for (const a of answers) {
      const av = variants(a);
      if (uv.some((x) => av.includes(x))) return { ok: true, level: "ok" };
    }
    const ub = uv.map(bare);
    for (const a of answers) {
      const ab = variants(a).map(bare);
      if (ub.some((x) => ab.includes(x))) return { ok: true, level: "almost" };
    }
    return { ok: false, level: "no" };
  }
  const splitForms = (f) => f.split(/\s*\(|\)\s*/).map((x) => x.trim()).filter(Boolean);

  /* ------------------------------------------------------------------ SRS (SM-2 style) */
  function grade(id, q) {
    const now = Date.now();
    const s = S.srs[id] || { e: 2.5, i: 0, r: 0, d: now, l: 0, seen: 0 };
    s.seen = (s.seen || 0) + 1;
    if (q === 0) { s.r = 0; s.l++; s.i = 0; s.d = now + 10 * 60000; }
    else {
      s.r++;
      if (s.r === 1) s.i = q === 3 ? 3 : q === 1 ? 0.5 : 1;
      else if (s.r === 2) s.i = q === 3 ? 7 : q === 1 ? 2 : 3;
      else s.i = Math.round(s.i * (q === 1 ? 1.2 : s.e * (q === 3 ? 1.3 : 1)) * 10) / 10;
      s.d = now + s.i * DAY;
    }
    s.e = Math.max(1.3, s.e + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)));
    S.srs[id] = s;
  }
  function inScope(id) {
    const p = id.split("|");
    if (p[0] === "bv" || p[0] === "bs" || p[0] === "bp") return +p[1] <= S.unit;
    if (p[0] === "bc") { const v = D.bookVerbs[p[1]]; return v && v.unit <= S.unit && (D.tenseUnlock[p[2]] ?? 99) <= S.unit; }
    if (p[0] === "tc" || p[0] === "tx" || p[0] === "tm") { const v = topBy[p[1]]; return v && v.g <= S.topGroup; }
    return false;
  }
  function dueIds() { const now = Date.now(); return Object.keys(S.srs).filter((id) => S.srs[id].d <= now && inScope(id)); }
  function updateBadge() { const n = dueIds().length; document.getElementById("dueBadge").textContent = n ? (n > 99 ? "99+" : n) : ""; }

  /* ------------------------------------------------------------------ item builders */
  const topBy = Object.fromEntries(D.top.map((v) => [v.es, v]));
  const showEn = () => S.lang !== "fa", showFa = () => S.lang !== "en";
  const meaning = (en, fa) => [showEn() ? `<span class="en">${esc(en)}</span>` : "", showFa() && fa ? `<span class="fa">${esc(fa)}</span>` : ""].filter(Boolean).join(" · ") || `<span class="en">${esc(en)}</span>`;
  const promptOf = (en, fa) => (showEn() || !fa) ? { prompt: en, sub: showFa() ? fa : "" } : { prompt: fa, sub: "" };
  const stripArt = (es) => es.replace(/^(el|la|los|las)\s+/i, "");

  function vocabItem(u, i, kind) {
    const v = unitByN[u].vocab[i];
    const [es, en, fa] = v;
    const id = `bv|${u}|${i}`;
    const dir = S.dir || "es";
    if (kind === "quiz") {
      const pool = vocabPool(S.unit).filter((x) => x.v[0] !== es);
      const opts = shuffle([v, ...shuffle(pool).slice(0, 3).map((x) => x.v)]);
      if (dir === "es") return { id, type: "mc", label: "What does it mean?", prompt: es, say: es, options: opts.map((o) => ({ html: meaning(o[1], o[2]), ok: o === v })), reveal: es };
      return { id, type: "mc", label: "Choose the Spanish word", ...promptOf(en, fa), options: opts.map((o) => ({ html: `<span class="es">${esc(o[0])}</span>`, ok: o === v, say: o[0] })), reveal: es };
    }
    if (kind === "type") {
      return { id, type: "type", label: "Write it in Spanish", ...promptOf(en, fa), answers: es.split(/\s*\/\s*(?=el |la |los |las )/).concat([es, stripArt(es)]), reveal: es };
    }
    return { id, type: "card", dir, es, en, fa };
  }
  function vocabPool(maxU, onlyU) {
    const out = [];
    for (const u of units) {
      if (u.n > maxU || (onlyU != null && u.n !== onlyU)) continue;
      u.vocab.forEach((v, i) => out.push({ u: u.n, i, v }));
    }
    return out;
  }
  function sentencePool(maxU, onlyU) {
    const out = [];
    for (const u of units) {
      if (u.n > maxU || (onlyU != null && u.n !== onlyU)) continue;
      u.sentences.forEach((s, i) => out.push({ u: u.n, i, s }));
    }
    return out;
  }
  function distractorWords(maxU, exclude) {
    const ex = new Set(exclude.map((w) => bare(norm(w))));
    const words = new Set();
    for (const x of sentencePool(maxU)) for (const w of x.s[1][0].split(/\s+/)) {
      const c = w.replace(/[¿?¡!.,;:"]/g, "");
      if (c && /^[A-ZÁÉÍÓÚÑ]/.test(c) && x.s[1][0].indexOf(c) > 0) continue; // proper noun
      if (c && !ex.has(bare(norm(c)))) words.add(c.toLowerCase());
    }
    return shuffle([...words]);
  }
  function sentenceItem(u, i, mode, prefix) {
    const [en, es] = unitByN[u].sentences[i];
    return translateItem(`${prefix || "bs"}|${u}|${i}`, en, es, mode, S.unit, `Unit ${u}`);
  }
  function translateItem(id, en, answers, mode, maxU, tag) {
    if (mode === "listen") return { id, type: "type", label: "Listen and write", listen: answers[0], prompt: "", answers, reveal: answers[0], extra: en };
    if (mode === "bank") {
      const enWords = new Set(norm(en).split(" "));
      const words = answers[0].replace(/[¿?¡!.,;:"]/g, " ").split(/\s+/).filter(Boolean)
        .map((w, k) => (k === 0 && !enWords.has(w.toLowerCase()) ? w.toLowerCase() : w));
      const extra = distractorWords(maxU, words).slice(0, Math.min(4, Math.max(2, Math.round(words.length / 2))));
      return { id, type: "bank", label: "Translate into Spanish", prompt: en, tag, tiles: shuffle(words.concat(extra)), answers, reveal: answers[0] };
    }
    return { id, type: "type", label: "Translate into Spanish", prompt: en, tag, answers, reveal: answers[0] };
  }
  function conjItem(src, verb, t, p) {
    const V = src === "book" ? D.bookVerbs[verb] : topBy[verb];
    const form = V.t[t][p];
    const id = `${src === "book" ? "bc" : "tc"}|${verb}|${t}|${p}`;
    return { id, type: "type", label: tenseFull(t), prompt: `${verb}`, sub: `${personLabel(t, p)} — ${V.en}`, answers: splitForms(form).concat([form]), reveal: form, conj: true };
  }
  function topExampleItem(verb, t, p, mode) {
    const V = topBy[verb];
    const ex = V.ex[t] && V.ex[t][p];
    if (!ex) return null;
    return translateItem(`tx|${verb}|${t}|${p}`, ex[1], [ex[0]], mode, maxUnit, tenseName(t));
  }
  function topMeaningItem(verb) {
    const V = topBy[verb];
    const dir = S.dir || "es";
    return { id: `tm|${verb}`, type: "card", dir, es: V.es, en: V.en, fa: V.fa };
  }
  function itemFromId(id) {
    const p = id.split("|");
    try {
      if (p[0] === "bv") return vocabItem(+p[1], +p[2], Math.random() < 0.7 ? "card" : "type");
      if (p[0] === "bs") return sentenceItem(+p[1], +p[2], S.mode);
      if (p[0] === "bp") return sentenceItem(+p[1], +p[2], "listen", "bp");
      if (p[0] === "bc") return conjItem("book", p[1], p[2], +p[3]);
      if (p[0] === "tc") return conjItem("top", p[1], p[2], +p[3]);
      if (p[0] === "tx") return topExampleItem(p[1], p[2], +p[3], S.mode);
      if (p[0] === "tm") return topMeaningItem(p[1]);
    } catch (e) { return null; }
    return null;
  }

  /* ------------------------------------------------------------------ session engine */
  let session = null;
  function startSession(items, title, onDone) {
    items = items.filter(Boolean);
    if (!items.length) { toast("Nothing to practise here yet"); return; }
    session = { items, i: 0, right: 0, wrong: 0, title, onDone, results: [] };
    bumpStreak(); save();
    if (location.hash === "#/session") renderSession(); else location.hash = "#/session";
  }
  function renderSession() {
    if (!session) { location.hash = "#/"; return; }
    setTitle(session.title, true);
    const it = session.items[session.i];
    const pct = Math.round((session.i / session.items.length) * 100);
    let html = `<div class="row small muted"><span>${session.i + 1} / ${session.items.length}</span><span class="spacer"></span><span>✓ ${session.right} · ✗ ${session.wrong}</span></div><div class="progress"><i style="width:${pct}%"></i></div>`;
    html += `<div class="card" id="qcard">${renderItem(it)}</div><div id="fb"></div><div id="actions" class="sticky-actions"></div>`;
    $view.innerHTML = html;
    bindItem(it);
  }
  function renderItem(it) {
    let h = `<div class="q-label">${esc(it.label || "")}${it.tag ? ` · <span class="tag">${esc(it.tag)}</span>` : ""}</div>`;
    if (it.type === "card") {
      const mean = (big) => `${showEn() || !it.fa ? `<div style="font-size:${big ? "1.3rem;font-weight:800" : "1.05rem"}">${esc(it.en)}</div>` : ""}${showFa() && it.fa ? `<div class="fa" style="font-size:${big ? "1.35rem;font-weight:700" : "1.15rem"};margin-top:6px">${esc(it.fa)}</div>` : ""}`;
      const front = it.dir === "es" ? `<div class="front">${esc(it.es)}</div>` : `<div class="front">${mean(true)}</div>`;
      const back = it.dir === "es" ? mean(false) : `<div class="es" style="font-size:1.4rem">${esc(it.es)}</div>`;
      return `<div class="q-label">Flashcard · ${it.dir === "es" ? "Spanish → meaning" : "meaning → Spanish"}</div>
        <div class="flash" id="flash">${front}<div class="back" id="flashBack" hidden>${back}<div style="margin-top:10px">${sayBtn(it.es)}</div></div><div class="hint" id="flashHint">Tap to show the answer</div></div>`;
    }
    if (it.listen) h += `<div style="text-align:center;margin:10px 0 16px">${sayBtn(it.listen, true)}<div class="small muted" style="margin-top:6px">Tap to listen again</div></div>`;
    else h += `<div class="prompt">${esc(it.prompt)}${it.sub ? `<span class="sub ${/[؀-ۿ]/.test(it.sub) ? "fa" : ""}">${esc(it.sub)}</span>` : ""}${it.say ? " " + sayBtn(it.say) : ""}</div>`;
    if (it.type === "mc") h += `<div class="options">${it.options.map((o, k) => `<button class="opt" data-k="${k}">${o.html}</button>`).join("")}</div>`;
    if (it.type === "bank") h += `<div class="bank-target" id="target"></div><div class="bank" id="bank">${it.tiles.map((t, k) => `<button class="tok" data-k="${k}">${esc(t)}</button>`).join("")}</div>`;
    if (it.type === "type") h += `<input class="answer-input" id="ans" lang="es" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${it.conj ? "Type the verb form…" : "Type in Spanish…"}" enterkeyhint="done"><div class="accents">${"á é í ó ú ñ ü ¿ ¡".split(" ").map((c) => `<button data-ch="${c}">${c}</button>`).join("")}</div>`;
    return h;
  }
  function bindItem(it) {
    const act = document.getElementById("actions");
    if (it.type === "card") {
      const flip = () => {
        document.getElementById("flashBack").hidden = false; document.getElementById("flashHint").hidden = true;
        if (it.dir === "en") speak(it.es);
        act.innerHTML = `<div class="rate"><button class="r0" data-q="0">Again</button><button class="r1" data-q="1">Hard</button><button class="r2" data-q="2">Good</button><button class="r3" data-q="3">Easy</button></div>`;
        act.querySelectorAll("[data-q]").forEach((b) => b.onclick = () => finish(+b.dataset.q >= 2 || +b.dataset.q === 1, +b.dataset.q, true));
      };
      document.getElementById("flash").onclick = flip;
      if (it.dir === "es") speak(it.es);
      act.innerHTML = `<button class="btn block secondary" id="showBtn">Show answer</button>`;
      document.getElementById("showBtn").onclick = flip;
      return;
    }
    if (it.listen) setTimeout(() => speak(it.listen), 250);
    if (it.type === "mc") {
      document.querySelectorAll(".opt").forEach((b) => b.onclick = () => {
        const o = it.options[+b.dataset.k];
        document.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (it.options[+x.dataset.k].ok) x.classList.add("right"); });
        if (!o.ok) b.classList.add("wrong");
        speak(it.reveal);
        showFeedback(o.ok ? "ok" : "no", it);
      });
      return;
    }
    if (it.type === "bank") {
      const target = document.getElementById("target");
      const chosen = [];
      document.querySelectorAll("#bank .tok").forEach((b) => b.onclick = () => {
        if (b.classList.contains("used")) return;
        b.classList.add("used"); chosen.push(+b.dataset.k);
        const t = document.createElement("button"); t.className = "tok"; t.textContent = it.tiles[+b.dataset.k];
        t.onclick = () => { chosen.splice(chosen.indexOf(+b.dataset.k), 1); b.classList.remove("used"); t.remove(); };
        target.appendChild(t);
      });
      act.innerHTML = `<div class="row"><button class="btn ghost" id="toType">⌨︎ Type</button><button class="btn block" id="chk">Check</button></div>`;
      document.getElementById("toType").onclick = () => { it.type = "type"; document.getElementById("qcard").innerHTML = renderItem(it); bindItem(it); };
      document.getElementById("chk").onclick = () => {
        const user = [...target.children].map((x) => x.textContent).join(" ");
        const r = check(user, it.answers); showFeedback(r.level, it, user);
      };
      return;
    }
    if (it.type === "type") {
      const inp = document.getElementById("ans");
      document.querySelectorAll("[data-ch]").forEach((b) => b.onclick = () => {
        const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? inp.value.length;
        inp.value = inp.value.slice(0, s) + b.dataset.ch + inp.value.slice(e); inp.focus(); inp.setSelectionRange(s + 1, s + 1);
      });
      act.innerHTML = `<div class="row"><button class="btn ghost" id="skip">Don't know</button><button class="btn block" id="chk">Check</button></div>`;
      const go = () => { const r = check(inp.value, it.answers); showFeedback(r.level, it, inp.value); };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
      document.getElementById("chk").onclick = go;
      document.getElementById("skip").onclick = () => showFeedback("no", it, "");
      if (!("ontouchstart" in window)) setTimeout(() => inp.focus(), 50);
    }
  }
  function showFeedback(level, it, user) {
    const fb = document.getElementById("fb"), act = document.getElementById("actions");
    document.querySelectorAll("#qcard button:not(.speak), #qcard input").forEach((x) => x.disabled = true);
    const titles = { ok: "¡Correcto!", almost: "Almost — check the accents", no: "Not quite" };
    let h = `<div class="feedback ${level}"><div class="fb-title">${titles[level]}</div>`;
    if (level !== "ok" || it.listen) h += `<div class="row"><div class="es" style="flex:1">${esc(it.reveal)}</div>${sayBtn(it.reveal)}</div>`;
    if (it.extra) h += `<div class="small muted" style="margin-top:4px">${esc(it.extra)}</div>`;
    if (level === "no" && it.answers && it.answers.length > 1 && !it.conj) {
      const others = [...new Set(it.answers.slice(1))].filter((a) => a !== it.reveal).slice(0, 2);
      if (others.length) h += `<div class="small muted" style="margin-top:6px">Also accepted: ${others.map(esc).join(" · ")}</div>`;
    }
    h += `</div>`;
    fb.innerHTML = h;
    if (level !== "no" && !it.listen && it.type !== "mc") speak(it.reveal);
    act.innerHTML = `<div class="row">${level === "no" && user ? `<button class="btn ghost" id="override">I was right</button>` : ""}<button class="btn block" id="next">Continue</button></div>`;
    document.getElementById("next").onclick = () => finish(level !== "no", level === "ok" ? 2 : level === "almost" ? 1 : 0);
    const ov = document.getElementById("override");
    if (ov) ov.onclick = () => finish(true, 2);
    document.getElementById("next").focus();
  }
  function finish(ok, q, isCard) {
    const it = session.items[session.i];
    grade(it.id, q);
    if (ok) session.right++; else session.wrong++;
    session.results.push({ id: it.id, ok });
    if (!ok && !session.requeued) session.requeued = 0;
    if (!ok && session.items.length < 60) { // see it again later in the same session
      const again = itemFromId(it.id) || it; session.items.splice(Math.min(session.items.length, session.i + 4), 0, again);
    }
    S.learned = Object.keys(S.srs).length;
    save(); updateBadge();
    session.i++;
    if (session.i >= session.items.length) return renderSummary();
    renderSession();
    window.scrollTo(0, 0);
  }
  function renderSummary() {
    const total = session.right + session.wrong;
    const score = total ? Math.round((session.right / total) * 100) : 0;
    let extra = "";
    if (session.onDone) extra = session.onDone(score, session) || "";
    save();
    $view.innerHTML = `<div class="card" style="text-align:center"><div class="big" style="font-size:2.6rem">${score >= 80 ? "🎉" : score >= 50 ? "💪" : "📚"}</div>
      <div class="bigscore">${score}%</div><p class="muted">${session.right} correct · ${session.wrong} to review</p>${extra}</div>
      <div class="grid2"><button class="btn secondary" id="again">Practise again</button><a class="btn" href="#/">Home</a></div>`;
    const redo = session.redo;
    document.getElementById("again").onclick = () => { if (redo) redo(); else history.back(); };
    session = null;
  }

  /* ------------------------------------------------------------------ direction chooser */
  function askIf(cond, cb) { if (cond) askDirection(cb); else cb(); }
  function askDirection(cb) {
    if (S.dirAlways && S.dir) return cb();
    const el = document.createElement("div");
    el.className = "sheet-back";
    let d = S.dir, l = S.lang || "both";
    const draw = () => {
      el.innerHTML = `<div class="sheet" role="dialog" aria-label="Choose direction">
        <h3>How do you want to practise the words?</h3>
        <div class="q-label">Direction</div>
        <div class="dir-opts">
          <button class="dir-opt ${d === "en" ? "on" : ""}" data-d="en"><b>${l === "fa" ? "فارسی" : l === "en" ? "English" : "English / فارسی"} → Español</b><span>You see the meaning and recall the Spanish word</span></button>
          <button class="dir-opt ${d === "es" ? "on" : ""}" data-d="es"><b>Español → ${l === "fa" ? "فارسی" : l === "en" ? "English" : "English / فارسی"}</b><span>You see the Spanish word and recall the meaning</span></button>
        </div>
        <div class="q-label">Show the meaning in</div>
        <div class="chips wrap"><button class="chip ${l === "en" ? "on" : ""}" data-l="en">English</button><button class="chip ${l === "fa" ? "on" : ""}" data-l="fa">فارسی</button><button class="chip ${l === "both" ? "on" : ""}" data-l="both">Both</button></div>
        <div class="row" style="margin-top:14px"><button class="btn ghost" data-x>Cancel</button><button class="btn block" data-go ${d ? "" : "disabled"}>Start</button></div></div>`;
      el.querySelectorAll("[data-d]").forEach((b) => b.onclick = () => { d = b.dataset.d; draw(); });
      el.querySelectorAll("[data-l]").forEach((b) => b.onclick = () => { l = b.dataset.l; draw(); });
      el.querySelector("[data-x]").onclick = () => el.remove();
      el.querySelector("[data-go]").onclick = () => { S.dir = d; S.lang = l; save(); el.remove(); cb(); };
    };
    draw();
    el.addEventListener("click", (e) => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
  }

  /* ------------------------------------------------------------------ book pages + viewer */
  const pageSrc = (p) => `pages/p${String(p).padStart(3, "0")}.jpg`;
  function unitPages(u) {
    const [a, b] = u.pages.split("-").map(Number);
    const lesson = []; for (let p = a; p <= b; p++) lesson.push(p);
    const annex = u.n >= 1 ? [204 + 2 * (u.n - 1), 205 + 2 * (u.n - 1)] : [];
    return { lesson, annex };
  }
  function unitLesson(u) {
    const { lesson, annex } = unitPages(u);
    const fig = (p, k) => `<figure class="pg" data-k="${k}"><img loading="lazy" src="${pageSrc(p)}" alt="Page ${p}"><figcaption>p. ${p}</figcaption></figure>`;
    return `<p class="small muted" style="margin:0 4px 10px">Read the lesson from the book first. Tap a page to open it full screen — pinch or double-tap to zoom, swipe for the next page.</p>
      <div class="section-title">Lesson · pages ${lesson[0]}–${lesson[lesson.length - 1]}</div>
      <div class="pages">${lesson.map((p, k) => fig(p, k)).join("")}</div>
      ${annex.length ? `<div class="section-title">Grammar & vocabulary summary · pages ${annex[0]}–${annex[1]}</div><div class="pages">${annex.map((p, k) => fig(p, lesson.length + k)).join("")}</div>` : ""}
      <a class="btn block" style="margin-top:16px" href="#/book/u/${u.n}/practice">Done reading → Practice</a>`;
  }
  function openViewer(list, start) {
    const ov = document.createElement("div");
    ov.className = "viewer";
    ov.innerHTML = `<div class="v-top"><button class="v-btn" data-close aria-label="Close">✕</button><span class="v-count"></span><span class="spacer"></span><button class="v-btn" data-zo aria-label="Zoom out">−</button><button class="v-btn" data-zi aria-label="Zoom in">+</button></div>
      <div class="v-scroll"><div class="v-inner"><img class="v-img" alt=""></div></div>
      <button class="v-nav v-prev" aria-label="Previous page">‹</button><button class="v-nav v-next" aria-label="Next page">›</button>`;
    document.body.appendChild(ov);
    document.body.classList.add("noscroll");
    const sc = ov.querySelector(".v-scroll"), img = ov.querySelector(".v-img"), cnt = ov.querySelector(".v-count");
    let i = start, z = 1;
    const fitW = () => Math.min(sc.clientWidth, (sc.clientHeight - 8) / 1.33);
    function zoomTo(nz, cx, cy) {
      nz = Math.max(1, Math.min(5, nz));
      if (cx == null) { cx = sc.clientWidth / 2; cy = sc.clientHeight / 2; }
      const w0 = img.offsetWidth || 1, h0 = img.offsetHeight || 1;
      const r = img.getBoundingClientRect(), s = sc.getBoundingClientRect();
      const fx = (cx + s.left - r.left) / w0, fy = (cy + s.top - r.top) / h0;
      z = nz; img.style.width = fitW() * z + "px";
      const r2 = img.getBoundingClientRect();
      sc.scrollLeft += (r2.left - s.left) + fx * img.offsetWidth - cx;
      sc.scrollTop += (r2.top - s.top) + fy * img.offsetHeight - cy;
    }
    function show(k) {
      i = Math.max(0, Math.min(list.length - 1, k));
      z = 1; img.style.width = fitW() + "px"; img.src = pageSrc(list[i]);
      sc.scrollTop = 0; sc.scrollLeft = 0;
      cnt.textContent = `p. ${list[i]} · ${i + 1}/${list.length}`;
      ov.querySelector(".v-prev").disabled = i === 0; ov.querySelector(".v-next").disabled = i === list.length - 1;
    }
    function close() { ov.remove(); document.body.classList.remove("noscroll"); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(i + 1); if (e.key === "ArrowLeft") show(i - 1); if (e.key === "+") zoomTo(z * 1.4); if (e.key === "-") zoomTo(z / 1.4); }
    document.addEventListener("keydown", onKey);
    ov.querySelector("[data-close]").onclick = close;
    ov.querySelector("[data-zi]").onclick = () => zoomTo(z * 1.5);
    ov.querySelector("[data-zo]").onclick = () => zoomTo(z / 1.5);
    ov.querySelector(".v-prev").onclick = () => show(i - 1);
    ov.querySelector(".v-next").onclick = () => show(i + 1);
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const rel = (x, y) => { const s = sc.getBoundingClientRect(); return [x - s.left, y - s.top]; };
    let pinch = null, sw = null, lastTap = 0;
    sc.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) { pinch = { d: dist(e.touches), z }; sw = null; }
      else if (e.touches.length === 1) sw = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }, { passive: true });
    sc.addEventListener("touchmove", (e) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const [cx, cy] = rel((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
        zoomTo(pinch.z * dist(e.touches) / pinch.d, cx, cy);
      }
    }, { passive: false });
    sc.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) pinch = null;
      if (!sw || e.touches.length) return;
      const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y, dt = Date.now() - sw.t;
      if (z <= 1.02 && Math.abs(dx) > 60 && Math.abs(dy) < 60 && dt < 600) { show(i + (dx < 0 ? 1 : -1)); sw = null; return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
        if (Date.now() - lastTap < 320) { const [cx, cy] = rel(t.clientX, t.clientY); zoomTo(z > 1.05 ? 1 : 2.5, cx, cy); lastTap = 0; }
        else lastTap = Date.now();
      }
      sw = null;
    });
    ov.addEventListener("gesturestart", (e) => e.preventDefault());
    sc.addEventListener("dblclick", (e) => { const [cx, cy] = rel(e.clientX, e.clientY); zoomTo(z > 1.05 ? 1 : 2.5, cx, cy); });
    sc.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); const [cx, cy] = rel(e.clientX, e.clientY); zoomTo(z * (e.deltaY < 0 ? 1.15 : 0.87), cx, cy); } }, { passive: false });
    window.addEventListener("resize", () => { if (document.body.contains(ov)) img.style.width = fitW() * z + "px"; });
    show(start);
  }

  /* ------------------------------------------------------------------ views */
  function setTitle(t, showBack) {
    $title.textContent = t; $back.hidden = !showBack;
    document.getElementById("unitPill").textContent = `Unidad ${S.unit}`;
  }
  $back.onclick = () => { if (location.hash.startsWith("#/session")) { if (confirm("Leave this practice session?")) { session = null; history.back(); } } else history.back(); };

  function viewHome() {
    setTitle("Español en marcha", false);
    const due = dueIds().length;
    const u = unitByN[S.unit];
    const gScore = S.groupScore[S.topGroup];
    $view.innerHTML = `
      <div class="hero"><h2>¡Hola! 👋</h2><p>You are on <b>Unidad ${S.unit}</b> · ${esc(u.title)} <span class="fa">${esc(u.title_fa)}</span></p>
        <div class="stats"><div><b>${due}</b><span>to review</span></div><div><b>${Object.keys(S.srs).length}</b><span>items studied</span></div><div><b>${S.streak.days || 0}</b><span>day streak</span></div></div></div>
      <div class="grid2">
        <a class="tile primary" href="#/book/u/${S.unit}"><span class="t-ic">📖</span><span class="t-title">Unidad ${S.unit}</span><span class="t-sub">${esc(u.title_en)} — vocabulary, grammar, practice</span></a>
        <a class="tile" href="#/review"><span class="t-ic">↻</span><span class="t-title">Review</span><span class="t-sub">${due ? `${due} items are due` : "All caught up"}</span></a>
        <a class="tile" href="#/verbs/g/${S.topGroup}"><span class="t-ic">⚡</span><span class="t-title">Top 100 verbs</span><span class="t-sub">Group ${S.topGroup} of 10${gScore != null ? ` · best ${gScore}%` : ""}</span></a>
        <button class="tile" id="quickMix"><span class="t-ic">🎲</span><span class="t-title">Quick mix</span><span class="t-sub">Sentences from units 0–${S.unit}</span></button>
      </div>
      <div class="section-title">Where are you in class?</div>
      <div class="card"><div class="unit-picker">${units.map((x) => `<button data-u="${x.n}" class="${x.n === S.unit ? "on" : ""}">${x.n}</button>`).join("")}</div>
      <p class="small muted" style="margin:10px 0 0">Units after the one you choose stay hidden, so practice only uses what you have learned.</p></div>`;
    $view.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => { setUnit(+b.dataset.u); viewHome(); });
    document.getElementById("quickMix").onclick = () => {
      const pool = shuffle(sentencePool(S.unit)).slice(0, S.sessionLen);
      startSession(pool.map((x) => sentenceItem(x.u, x.i, S.mode)), "Quick mix");
    };
  }
  function setUnit(n) { S.unit = n; S.bookTenses = null; save(); updateBadge(); toast(`Now studying up to Unidad ${n}`); }

  function viewBook() {
    setTitle("Libro · units", false);
    $view.innerHTML = `<p class="muted small" style="margin:0 4px 12px">${esc(D.book)}</p><div class="list">${units.map((u) => {
      const locked = u.n > S.unit;
      const seen = u.vocab.filter((_, i) => S.srs[`bv|${u.n}|${i}`]).length;
      const pct = Math.round((seen / Math.max(1, u.vocab.length)) * 100);
      return `<div class="li ${locked ? "locked" : ""}" data-u="${u.n}"><div class="num ${pct >= 90 ? "done" : ""}">${locked ? "🔒" : u.n}</div><div class="main"><div class="l1">${esc(u.title)}</div><div class="l2">${esc(u.title_en)} · <span class="fa">${esc(u.title_fa)}</span>${locked ? "" : ` · ${pct}% of words seen`}</div></div><span class="chev">›</span></div>`;
    }).join("")}</div>`;
    $view.querySelectorAll(".li").forEach((el) => el.onclick = () => {
      const n = +el.dataset.u;
      if (n > S.unit) { if (confirm(`You are on Unidad ${S.unit}. Move your progress to Unidad ${n}?`)) { setUnit(n); location.hash = `#/book/u/${n}`; } return; }
      location.hash = `#/book/u/${n}`;
    });
  }

  function viewUnit(n, tab) {
    const u = unitByN[n];
    if (!u || n > S.unit) { location.hash = "#/book"; return; }
    tab = tab || "lesson";
    setTitle(`Unidad ${n} · ${u.title}`, true);
    const tabs = [["lesson", "📄 Lesson"], ["practice", "Practice"], ["vocab", "Vocabulary"], ["grammar", "Grammar"], ["phrases", "Phrases"], ["verbs", "Verbs"]];
    let h = `<div class="chips">${tabs.map(([k, l]) => `<a class="chip ${k === tab ? "on" : ""}" href="#/book/u/${n}/${k}">${l}</a>`).join("")}</div>`;
    if (tab === "vocab") h += unitVocab(u);
    else if (tab === "grammar") h += unitGrammar(u);
    else if (tab === "phrases") h += `<div class="list">${u.phrases.map((p) => `<div class="vocab-row" data-say="${esc(p[0])}"><span class="es">${esc(p[0])}</span><span class="fa">${esc(p[2])}</span><span class="en">${esc(p[1])}</span></div>`).join("")}</div>`;
    else if (tab === "verbs") h += unitVerbs(u);
    else if (tab === "lesson") h += unitLesson(u);
    else h += unitPractice(u);
    $view.innerHTML = h;
    if (tab === "vocab") bindVocabFilter(u);
    if (tab === "practice") bindUnitPractice(u);
    if (tab === "lesson") { const { lesson, annex } = unitPages(u); const all = lesson.concat(annex); $view.querySelectorAll(".pg").forEach((f) => f.onclick = () => openViewer(all, +f.dataset.k)); }
  }
  function unitVocab(u) {
    const cats = [...new Set(u.vocab.map((v) => v[3]))];
    return `<input class="field search" id="vsearch" placeholder="Search Spanish, English or فارسی…">
      <div class="chips" id="vcats"><button class="chip on" data-c="">All (${u.vocab.length})</button>${cats.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="list" id="vlist">${vocabRows(u.vocab)}</div>`;
  }
  function vocabRows(list) {
    let h = "", cat = null;
    for (const v of list) {
      if (v[3] !== cat) { cat = v[3]; h += `<div class="cat-h">${esc(cat)}</div>`; }
      h += `<div class="vocab-row" data-say="${esc(v[0])}"><span class="es">${esc(v[0])}</span><span class="fa">${esc(v[2])}</span><span class="en">${esc(v[1])}</span></div>`;
    }
    return h || `<div class="empty">No words found</div>`;
  }
  function bindVocabFilter(u) {
    let cat = "", q = "";
    const run = () => {
      const qq = bare(q.toLowerCase());
      document.getElementById("vlist").innerHTML = vocabRows(u.vocab.filter((v) => (!cat || v[3] === cat) && (!qq || bare(v.join(" ").toLowerCase()).includes(qq))));
    };
    document.getElementById("vsearch").oninput = (e) => { q = e.target.value; run(); };
    document.querySelectorAll("#vcats .chip").forEach((b) => b.onclick = () => { document.querySelectorAll("#vcats .chip").forEach((x) => x.classList.remove("on")); b.classList.add("on"); cat = b.dataset.c; run(); });
  }
  function unitGrammar(u) {
    return u.grammar.map((g) => `<div class="card gram"><h3>${esc(g.title)}</h3>${g.fa ? `<span class="fa">${esc(g.fa)}</span>` : ""}
      ${g.tables.map((t) => `<div class="gtable"><b>${esc(t.verb)}</b>: ${t.forms.map(esc).join(" · ")}</div>`).join("")}
      ${g.ex.map((e) => `<div class="ex" data-say="${esc(e.es)}"><span class="es">${esc(e.es)}</span><span class="en">${esc(e.en)}</span></div>`).join("")}</div>`).join("") || `<div class="empty">No grammar notes</div>`;
  }
  function unitVerbs(u) {
    if (!u.verbs.length) return `<div class="empty">No verbs in this unit</div>`;
    const tl = unlockedTenses();
    return `<p class="small muted" style="margin:0 4px 10px">Tenses unlocked up to Unidad ${S.unit}: ${tl.map(tenseName).join(", ")}</p><div class="list">${u.verbs.map((v) => {
      const V = D.bookVerbs[v];
      return `<a class="li" href="#/verb/book/${encodeURIComponent(v)}"><div class="main"><div class="l1">${esc(v)}</div><div class="l2">${esc(V.en)} · <span class="fa">${esc(V.fa)}</span></div></div><span class="chev">›</span></a>`;
    }).join("")}</div>`;
  }
  function unlockedTenses() { return D.tenseOrder.filter((t) => (D.tenseUnlock[t] ?? 99) <= S.unit); }

  function unitPractice(u) {
    const scope = S.scope || "unit";
    const tl = unlockedTenses();
    const bt = (S.bookTenses || tl).filter((t) => tl.includes(t));
    return `
      <div class="card"><div class="q-label">Practise from</div>
        <div class="chips wrap" id="scope"><button class="chip ${scope === "unit" ? "on" : ""}" data-s="unit">This unit only</button><button class="chip ${scope === "upto" ? "on" : ""}" data-s="upto">Units 0–${u.n} mixed</button></div></div>
      <div class="grid2">
        <button class="tile" data-p="flash"><span class="t-ic">🃏</span><span class="t-title">Flashcards</span><span class="t-sub">Words · Spanish ⇄ English / فارسی</span></button>
        <button class="tile" data-p="quiz"><span class="t-ic">✅</span><span class="t-title">Word quiz</span><span class="t-sub">Multiple choice</span></button>
        <button class="tile primary" data-p="translate"><span class="t-ic">✍️</span><span class="t-title">Translate</span><span class="t-sub">English → Spanish sentences</span></button>
        <button class="tile" data-p="listen"><span class="t-ic">🎧</span><span class="t-title">Listen & write</span><span class="t-sub">Dictation</span></button>
        <button class="tile" data-p="write"><span class="t-ic">⌨︎</span><span class="t-title">Spell the word</span><span class="t-sub">English → type Spanish</span></button>
        <button class="tile" data-p="conj"><span class="t-ic">🔁</span><span class="t-title">Conjugate</span><span class="t-sub">Book verbs, unlocked tenses</span></button>
      </div>
      <div class="section-title">Tenses for "Conjugate"</div>
      <div class="chips wrap" id="btenses">${tl.map((t) => `<button class="chip ${bt.includes(t) ? "on" : ""}" data-t="${t}">${tenseName(t)}</button>`).join("")}</div>
      <div class="section-title">Sentence mode</div>
      <div class="chips wrap" id="smode"><button class="chip ${S.mode === "bank" ? "on" : ""}" data-m="bank">Word tiles</button><button class="chip ${S.mode === "type" ? "on" : ""}" data-m="type">Type it</button></div>`;
  }
  function bindUnitPractice(u) {
    document.querySelectorAll("#scope .chip").forEach((b) => b.onclick = () => { S.scope = b.dataset.s; save(); viewUnit(u.n, "practice"); });
    document.querySelectorAll("#smode .chip").forEach((b) => b.onclick = () => { S.mode = b.dataset.m; save(); viewUnit(u.n, "practice"); });
    document.querySelectorAll("#btenses .chip").forEach((b) => b.onclick = () => {
      const tl = unlockedTenses(); let cur = (S.bookTenses || tl).filter((t) => tl.includes(t));
      cur = cur.includes(b.dataset.t) ? cur.filter((t) => t !== b.dataset.t) : cur.concat(b.dataset.t);
      if (!cur.length) { toast("Keep at least one tense"); return; }
      S.bookTenses = cur; save(); viewUnit(u.n, "practice");
    });
    document.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => runUnitPractice(u, b.dataset.p));
  }
  function runUnitPractice(u, kind, asked) {
    if ((kind === "flash" || kind === "quiz") && !asked) return askDirection(() => runUnitPractice(u, kind, true));
    const only = (S.scope || "unit") === "unit" ? u.n : null;
    const N = S.sessionLen;
    const title = only != null ? `Unidad ${u.n}` : `Units 0–${u.n}`;
    let items = [];
    const redo = () => runUnitPractice(u, kind, true);
    if (kind === "flash" || kind === "quiz" || kind === "write") {
      const pool = prioritise(vocabPool(u.n, only), (x) => `bv|${x.u}|${x.i}`, N);
      items = pool.map((x) => vocabItem(x.u, x.i, kind === "flash" ? "card" : kind === "quiz" ? "quiz" : "type"));
    } else if (kind === "translate" || kind === "listen") {
      const pool = prioritise(sentencePool(u.n, only), (x) => `${kind === "listen" ? "bp" : "bs"}|${x.u}|${x.i}`, N);
      items = pool.map((x) => kind === "listen" ? sentenceItem(x.u, x.i, "listen", "bp") : sentenceItem(x.u, x.i, S.mode));
    } else if (kind === "conj") {
      const tl = unlockedTenses();
      const tenses = (S.bookTenses || tl).filter((t) => tl.includes(t));
      const verbs = only != null ? u.verbs : Object.keys(D.bookVerbs).filter((v) => D.bookVerbs[v].unit <= u.n);
      const cands = [];
      for (const v of verbs) for (const t of tenses) { const f = D.bookVerbs[v].t[t]; if (!f) continue; f.forEach((x, p) => { if (x) cands.push({ v, t, p }); }); }
      items = prioritise(cands, (x) => `bc|${x.v}|${x.t}|${x.p}`, N).map((x) => conjItem("book", x.v, x.t, x.p));
    }
    startSession(items, title);
    if (session) session.redo = redo;
  }
  // new items first, then weak/due ones, then the rest — and shuffle
  function prioritise(pool, idf, n) {
    const now = Date.now();
    const scored = pool.map((x) => { const s = S.srs[idf(x)]; return { x, k: !s ? 1 + Math.random() : s.d <= now ? 0.5 + Math.random() * 0.5 : Math.random() * 0.4 }; });
    scored.sort((a, b) => b.k - a.k);
    return shuffle(scored.slice(0, n).map((o) => o.x));
  }

  function viewVerbPage(src, verb) {
    const V = src === "book" ? D.bookVerbs[verb] : topBy[verb];
    if (!V) { history.back(); return; }
    setTitle(verb, true);
    const tl = src === "book" ? unlockedTenses() : D.tenseOrder;
    const chosen = src === "book" ? tl : S.topTenses;
    const show = D.tenseOrder.filter((t) => V.t[t] && (src === "book" ? tl.includes(t) : true));
    const sel = S.verbViewTense && show.includes(S.verbViewTense) ? S.verbViewTense : (chosen.find((t) => show.includes(t)) || show[0]);
    let h = `<div class="card"><div class="verb-head"><span class="es">${esc(verb)}</span>${sayBtn(verb)}<span class="tag">${V.type === "reflexive" ? "reflexive" : V.type === "gustar" ? "like gustar" : "verb"}</span></div>
      <div>${esc(V.en)} · <span class="fa">${esc(V.fa)}</span></div><div class="small muted" style="margin-top:6px">gerundio: <b>${esc(V.ger)}</b> · participio: <b>${esc(V.part)}</b></div>${V.note ? `<div class="small muted">${esc(V.note)}</div>` : ""}</div>
      <div class="chips">${show.map((t) => `<button class="chip ${t === sel ? "on" : ""}" data-t="${t}">${tenseName(t)}</button>`).join("")}</div>
      <div class="card"><div class="q-label">${esc(tenseFull(sel))}</div><div class="table-wrap"><table class="conj">${V.t[sel].map((f, i) => f ? `<tr><td class="p">${esc(personLabel(sel, i))}</td><td class="f">${esc(f)}</td><td style="width:44px">${sayBtn(f)}</td></tr>` : "").join("")}</table></div></div>`;
    if (src === "top" && V.ex[sel]) {
      h += `<div class="section-title">Examples</div>${V.ex[sel].map((e, i) => e ? `<div class="ex" data-say="${esc(e[0])}"><span class="es">${esc(e[0])}</span><span class="en">${esc(e[1])}</span></div>` : "").join("")}`;
    }
    $view.innerHTML = h;
    $view.querySelectorAll("[data-t]").forEach((b) => b.onclick = () => { S.verbViewTense = b.dataset.t; save(); viewVerbPage(src, verb); });
  }

  function groupPct(g) {
    const vs = D.top.filter((v) => v.g === g);
    let seen = 0, total = 0;
    for (const v of vs) for (const t of S.topTenses) { if (!v.t[t]) continue; v.t[t].forEach((f, p) => { if (!f) return; total++; const s = S.srs[`tc|${v.es}|${t}|${p}`]; if (s && s.r >= 1) seen++; }); }
    return total ? Math.round((seen / total) * 100) : 0;
  }
  function tenseChips(id) {
    return `<div class="chips wrap" id="${id}">${D.tenseOrder.map((t) => `<button class="chip ${S.topTenses.includes(t) ? "on" : ""}" data-t="${t}">${tenseName(t)}</button>`).join("")}</div>`;
  }
  function bindTenseChips(id, rerender) {
    document.querySelectorAll(`#${id} .chip`).forEach((b) => b.onclick = () => {
      let cur = S.topTenses.slice();
      cur = cur.includes(b.dataset.t) ? cur.filter((t) => t !== b.dataset.t) : D.tenseOrder.filter((t) => cur.includes(t) || t === b.dataset.t);
      if (!cur.length) { toast("Keep at least one tense"); return; }
      S.topTenses = cur; save(); rerender();
    });
  }
  function viewVerbs() {
    setTitle("Top 100 verbs", false);
    let h = `<div class="card"><div class="q-label">Tenses I'm studying</div>${tenseChips("vt")}<p class="small muted" style="margin:6px 0 0">All tenses are in the app — pick only the ones you want to practise now.</p></div><div class="list">`;
    for (let g = 1; g <= 10; g++) {
      const vs = D.top.filter((v) => v.g === g);
      const locked = g > S.topGroup;
      const best = S.groupScore[g];
      h += `<div class="li ${locked ? "locked" : ""}" data-g="${g}"><div class="num ${best >= 80 ? "done" : ""}">${locked ? "🔒" : g}</div><div class="main"><div class="l1">Group ${g} <span class="muted small">· verbs ${(g - 1) * 10 + 1}–${g * 10}</span></div><div class="l2">${vs.map((v) => esc(v.es)).join(", ")}</div>${locked ? "" : `<div class="meter"><i style="width:${groupPct(g)}%"></i></div>`}</div><span class="chev">›</span></div>`;
    }
    h += `</div>`;
    $view.innerHTML = h;
    bindTenseChips("vt", viewVerbs);
    $view.querySelectorAll("[data-g]").forEach((el) => el.onclick = () => {
      const g = +el.dataset.g;
      if (g > S.topGroup) { if (confirm(`Unlock group ${g}? (Recommended: score 80% on group ${S.topGroup} first.)`)) { S.topGroup = g; save(); location.hash = `#/verbs/g/${g}`; } return; }
      location.hash = `#/verbs/g/${g}`;
    });
  }
  function viewGroup(g) {
    if (g > S.topGroup) { location.hash = "#/verbs"; return; }
    setTitle(`Verbs · group ${g}`, true);
    const vs = D.top.filter((v) => v.g === g);
    const best = S.groupScore[g];
    let h = `<div class="card"><div class="q-label">Tenses</div>${tenseChips("gt")}</div>
      <div class="grid2">
        <button class="tile primary" data-m="conj"><span class="t-ic">🔁</span><span class="t-title">Conjugate</span><span class="t-sub">Type the right form</span></button>
        <button class="tile" data-m="sent"><span class="t-ic">✍️</span><span class="t-title">Sentences</span><span class="t-sub">English → Spanish examples</span></button>
        <button class="tile" data-m="flash"><span class="t-ic">🃏</span><span class="t-title">Meanings</span><span class="t-sub">Verb flashcards</span></button>
        <button class="tile" data-m="mix"><span class="t-ic">🎯</span><span class="t-title">Group test</span><span class="t-sub">20 questions · 80% unlocks the next group</span></button>
      </div>
      ${g > 1 ? `<button class="btn secondary block" id="revPrev" style="margin:4px 0 12px">↻ Review groups 1–${g - 1}</button>` : ""}
      <div class="row small muted" style="margin:4px 4px 8px"><span>Best test score: <b>${best != null ? best + "%" : "—"}</b></span><span class="spacer"></span>${g === S.topGroup && g < 10 ? `<button class="btn ghost" id="unlockNext" style="min-height:36px;padding:6px 12px">Unlock group ${g + 1}</button>` : ""}</div>
      <div class="section-title">Learn</div><div class="list">${vs.map((v) => `<a class="li" href="#/verb/top/${encodeURIComponent(v.es)}"><div class="main"><div class="l1">${v.es}</div><div class="l2">${esc(v.en)} · <span class="fa">${esc(v.fa)}</span></div></div><span class="chev">›</span></a>`).join("")}</div>`;
    $view.innerHTML = h;
    bindTenseChips("gt", () => viewGroup(g));
    $view.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => runGroup(g, b.dataset.m, false));
    const rp = document.getElementById("revPrev"); if (rp) rp.onclick = () => runGroup(g, "mix", true);
    const un = document.getElementById("unlockNext"); if (un) un.onclick = () => { S.topGroup = g + 1; save(); toast(`Group ${g + 1} unlocked`); viewGroup(g); };
  }
  function runGroup(g, mode, previous, asked) {
    if (mode === "flash" && !asked) return askDirection(() => runGroup(g, mode, previous, true));
    const vs = D.top.filter((v) => previous ? v.g < g : v.g === g);
    const tenses = S.topTenses;
    const N = mode === "mix" ? 20 : S.sessionLen;
    const conj = [], sent = [];
    for (const v of vs) for (const t of tenses) {
      if (!v.t[t]) continue;
      v.t[t].forEach((f, p) => { if (f) conj.push({ v: v.es, t, p }); });
      if (v.ex[t]) v.ex[t].forEach((e, p) => { if (e) sent.push({ v: v.es, t, p }); });
    }
    let items;
    if (mode === "conj") items = prioritise(conj, (x) => `tc|${x.v}|${x.t}|${x.p}`, N).map((x) => conjItem("top", x.v, x.t, x.p));
    else if (mode === "sent") items = prioritise(sent, (x) => `tx|${x.v}|${x.t}|${x.p}`, N).map((x) => topExampleItem(x.v, x.t, x.p, S.mode));
    else if (mode === "flash") items = shuffle(vs).map((v) => topMeaningItem(v.es));
    else {
      const a = prioritise(conj, (x) => `tc|${x.v}|${x.t}|${x.p}`, Math.ceil(N * 0.6)).map((x) => conjItem("top", x.v, x.t, x.p));
      const b = prioritise(sent, (x) => `tx|${x.v}|${x.t}|${x.p}`, Math.floor(N * 0.4)).map((x) => topExampleItem(x.v, x.t, x.p, S.mode));
      items = shuffle(a.concat(b));
    }
    const isTest = mode === "mix" && !previous;
    startSession(items, previous ? `Review · groups 1–${g - 1}` : `Group ${g}`, isTest ? (score, ses) => {
      const first = ses.results.slice(0, ses.items.length);
      S.groupScore[g] = Math.max(S.groupScore[g] || 0, score);
      if (score >= 80 && g === S.topGroup && g < 10) { S.topGroup = g + 1; return `<p><b>Group ${g + 1} unlocked!</b> 🔓</p>`; }
      if (score < 80) return `<p class="small muted">Score 80% or more to unlock the next group.</p>`;
      return "";
    } : null);
    if (session) session.redo = () => runGroup(g, mode, previous, true);
  }

  function viewReview() {
    setTitle("Review", false);
    const due = dueIds();
    const studied = Object.keys(S.srs).filter(inScope);
    const kinds = { bv: "Words", bs: "Sentences", bp: "Dictation", bc: "Book verbs", tc: "Verb forms", tx: "Verb sentences", tm: "Verb meanings" };
    const counts = {};
    due.forEach((id) => { const k = id.split("|")[0]; counts[k] = (counts[k] || 0) + 1; });
    const nextDue = studied.map((id) => S.srs[id].d).filter((d) => d > Date.now()).sort((a, b) => a - b)[0];
    let h = `<div class="card" style="text-align:center"><div class="bigscore">${due.length}</div><p class="muted" style="margin-top:0">items due for review</p>
      ${Object.keys(counts).map((k) => `<span class="tag" style="margin:2px">${kinds[k]}: ${counts[k]}</span>`).join("")}
      <div style="margin-top:16px">${due.length ? `<button class="btn block" id="go">Start review (${Math.min(due.length, 30)})</button>` : `<p class="muted">${studied.length ? `Nothing due. Next review ${nextDue ? "in " + humanTime(nextDue - Date.now()) : "later"}.` : "Practise a unit or a verb group first — what you study comes back here at the right time."}</p>`}</div></div>
      <div class="card"><div class="q-label">Extra practice</div><p class="small muted" style="margin-top:0">Your weakest ${Math.min(20, studied.length)} items, even if they are not due yet.</p><button class="btn secondary block" id="weak" ${studied.length ? "" : "disabled"}>Practise weak items</button></div>`;
    $view.innerHTML = h;
    const go = document.getElementById("go");
    const needsDir = (ids) => ids.some((id) => /^(bv|tm)\|/.test(id));
    if (go) go.onclick = () => askIf(needsDir(due), () => { startSession(shuffle(due).slice(0, 30).map(itemFromId), "Review"); if (session) session.redo = () => { location.hash = "#/review"; }; });
    document.getElementById("weak").onclick = () => {
      const w = studied.slice().sort((a, b) => (S.srs[b].l - S.srs[a].l) || (S.srs[a].e - S.srs[b].e)).slice(0, 20);
      askIf(needsDir(w), () => startSession(shuffle(w).map(itemFromId), "Weak items"));
    };
  }
  function humanTime(ms) { const m = ms / 60000; if (m < 60) return Math.max(1, Math.round(m)) + " min"; const hh = m / 60; if (hh < 24) return Math.round(hh) + " h"; return Math.round(hh / 24) + " days"; }

  function viewSettings() {
    setTitle("Settings", false);
    $view.innerHTML = `
      <div class="section-title">My class</div>
      <div class="card"><div class="q-label">Current unit</div><div class="unit-picker">${units.map((x) => `<button data-u="${x.n}" class="${x.n === S.unit ? "on" : ""}">${x.n}</button>`).join("")}</div></div>
      <div class="section-title">Practice</div>
      <div class="list">
        <div class="toggle-row"><span>Flashcard direction</span><select id="dir"><option value="">Ask me each time</option><option value="es">Spanish → meaning</option><option value="en">Meaning → Spanish</option></select></div>
        <div class="toggle-row"><span>Meaning in</span><select id="lang"><option value="en">English</option><option value="fa">فارسی</option><option value="both">Both</option></select></div>
        <div class="toggle-row"><span>Sentences</span><select id="mode"><option value="bank">Word tiles</option><option value="type">Type it</option></select></div>
        <div class="toggle-row"><span>Questions per session</span><select id="len">${[10, 15, 20, 30].map((n) => `<option ${S.sessionLen === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="toggle-row"><span>Speech speed</span><select id="rate"><option value="0.7">Slow</option><option value="0.9">Normal</option><option value="1.05">Fast</option></select></div>
        <div class="toggle-row"><span>Test the voice</span>${sayBtn("¡Hola! Estoy aprendiendo español.")}</div>
      </div>
      <div class="section-title">Backup</div>
      <div class="card"><p class="small muted" style="margin-top:0">Your progress is saved on this device. Export it to keep a copy or move it to your phone.</p>
        <div class="row"><button class="btn secondary" id="exp">Export</button><label class="btn ghost" style="cursor:pointer">Import<input type="file" id="imp" accept="application/json" hidden></label><span class="spacer"></span><button class="btn ghost" id="reset" style="color:var(--bad)">Reset</button></div></div>
      <p class="small muted" style="text-align:center">${esc(D.book)} · ${units.length} units · ${units.reduce((a, u) => a + u.vocab.length, 0)} words · ${units.reduce((a, u) => a + u.sentences.length, 0)} sentences · ${Object.keys(D.bookVerbs).length} book verbs · 100 top verbs</p>`;
    $view.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => { setUnit(+b.dataset.u); viewSettings(); });
    const dir = document.getElementById("dir"); dir.value = S.dir || ""; dir.onchange = () => { S.dir = dir.value || null; S.dirAlways = !!dir.value; save(); };
    const lang = document.getElementById("lang"); lang.value = S.lang || "both"; lang.onchange = () => { S.lang = lang.value; save(); };
    const mode = document.getElementById("mode"); mode.value = S.mode; mode.onchange = () => { S.mode = mode.value; save(); };
    const len = document.getElementById("len"); len.onchange = () => { S.sessionLen = +len.value; save(); };
    const rate = document.getElementById("rate"); rate.value = String(S.rate); if (!rate.value) rate.value = "0.9"; rate.onchange = () => { S.rate = +rate.value; save(); };
    document.getElementById("exp").onclick = () => {
      const blob = new Blob([JSON.stringify(S)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `espanol-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    };
    document.getElementById("imp").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { const o = JSON.parse(t); if (!o || typeof o.srs !== "object") throw new Error(); S = Object.assign(defaults(), o); save(); updateBadge(); toast("Progress imported"); viewSettings(); }).catch(() => toast("That file doesn't look like a backup"));
    };
    document.getElementById("reset").onclick = () => { if (confirm("Delete all progress on this device?")) { S = defaults(); save(); updateBadge(); viewSettings(); } };
  }

  /* ------------------------------------------------------------------ router */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
    const parts = h.split("/").filter(Boolean);
    const tab = parts[0] === "verbs" || parts[0] === "verb" ? "verbs" : parts[0] === "book" ? "book" : parts[0] || "home";
    document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    if (parts[0] !== "session" && session) session = null;
    window.scrollTo(0, 0);
    if (!parts.length) return viewHome();
    if (parts[0] === "book" && parts[1] === "u") return viewUnit(+parts[2], parts[3]);
    if (parts[0] === "book") return viewBook();
    if (parts[0] === "verbs" && parts[1] === "g") return viewGroup(+parts[2]);
    if (parts[0] === "verbs") return viewVerbs();
    if (parts[0] === "verb") return viewVerbPage(parts[1], parts.slice(2).join("/"));
    if (parts[0] === "review") return viewReview();
    if (parts[0] === "settings") return viewSettings();
    if (parts[0] === "session") return renderSession();
    viewHome();
  }
  window.addEventListener("hashchange", route);
  updateBadge();
  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
