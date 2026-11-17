/* SIVA · identidad de marca, logo animado del login, campanita, tutorial y calendario.
   Este archivo solo agrega cosas: no cambia la lógica de vínculos ni de datos. */

/* ============================ Logo y personas ============================ */
const SIVA_COL = { teal: "#186170", light: "#5BB5C0", red: "#D84325", amber: "#E8960F" };
// Degradados de tonos medios (suaves, como el logo de AMSA): claro, medio, profundo.
const SIVA_GRAD = {
  teal: ["#2F8A8F", "#256F7E", "#186170"],
  light: ["#8FD3C9", "#6BC0C0", "#4FA9B8"],
  red: ["#EE8A4A", "#DD5B30", "#C93A22"],
  amber: ["#F6C65A", "#EDA630", "#E08A0C"]
};
const SIVA_LINE = "#C5CDD1";

// Una persona dibujada en una caja de 100 x 130 (anillo, cuerpo, cabeza).
const sivaBody = "M19 73 A31 31 0 0 1 81 73 L81 100 Q81 108 73 108 L27 108 Q19 108 19 100 Z";
const sivaPersonaFlat = k => `<ellipse cx="50" cy="117" rx="47" ry="11" fill="none" stroke="${SIVA_COL[k]}" stroke-width="4"/><path d="${sivaBody}" fill="${SIVA_COL[k]}"/><circle cx="50" cy="20" r="18" fill="${SIVA_COL[k]}"/>`;
const sivaPersonaGrad = (k, id) => `<ellipse cx="50" cy="117" rx="47" ry="11" fill="${SIVA_COL[k]}" fill-opacity=".14" stroke="${SIVA_COL[k]}" stroke-opacity=".55" stroke-width="2.5"/><path d="${sivaBody}" fill="url(#${id}-${k})"/><circle cx="50" cy="20" r="18" fill="url(#${id}-${k})"/>`;
const sivaDefs = id => `<defs>${Object.keys(SIVA_GRAD).map(k => `<linearGradient id="${id}-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SIVA_GRAD[k][0]}"/><stop offset=".5" stop-color="${SIVA_GRAD[k][1]}"/><stop offset="1" stop-color="${SIVA_GRAD[k][2]}"/></linearGradient>`).join("")}</defs>`;

// Línea entre dos anillos que se detiene en el borde de cada círculo.
function sivaBorde(c, s, hacia) {
  const dx = hacia.x - c.x, dy = hacia.y - c.y, rx = 50 * s + 2, ry = 12 * s + 2, t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
const sivaBase = p => ({ x: p.x + 50 * p.s, y: p.y + 117 * p.s });
function sivaLinea(a, b) { const A = sivaBase(a), B = sivaBase(b), p = sivaBorde(A, a.s, B), q = sivaBorde(B, b.s, A); return { x1: p.x, y1: p.y, x2: q.x, y2: q.y }; }

// Logo chico (cabecera): las cuatro personas del logo, planas.
function logoSivaMark(oscuro) {
  const P = { main: { x: 875, y: 470, s: 1.7 }, light: { x: 890, y: 215, s: 1.5 }, red: { x: 640, y: 340, s: 1.5 }, amber: { x: 1130, y: 340, s: 1.5 } };
  const ln = ["light", "red", "amber"].map(k => { const l = sivaLinea(P.main, P[k]); return `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${oscuro ? "#fff" : SIVA_LINE}" stroke-opacity="${oscuro ? .95 : 1}" stroke-width="${oscuro ? 11 : 9}" stroke-linecap="round"/>`; }).join("");
  const pe = ["light", "red", "amber", "main"].map(k => { const c = k === "main" ? "teal" : k; return `<g transform="translate(${P[k].x} ${P[k].y}) scale(${P[k].s})">${oscuro && k === "main" ? sivaPersonaFlat("teal").split(SIVA_COL.teal).join("#fff") : sivaPersonaFlat(c)}</g>`; }).join("");
  return `<svg class="siva-mark" viewBox="625 200 690 505" role="img" aria-label="Logo SIVA">${ln}${pe}</svg>`;
}

/* ============================ Login animado ============================ */
let sivaRaf = null;
function sivaMontarLogin() {
  const host = document.getElementById("loginArt"); if (!host) return;
  if (sivaRaf) cancelAnimationFrame(sivaRaf);
  const W = 760, H = 880, id = "lg";
  const A = { main: { x: 305, y: 300, s: 1.5 }, light: { x: 315, y: 100, s: 1.3 }, red: { x: 130, y: 185, s: 1.3 }, amber: { x: 495, y: 185, s: 1.3 } };
  const B = { main: { x: 420, y: 290, s: 2.4 }, light: { x: 430, y: 70, s: 1.2 }, red: { x: 190, y: 150, s: 1.5 }, amber: { x: 580, y: 150, s: 1.5 } };
  const EX = [[60, 280, 1.0, "teal"], [250, 380, 1.1, "teal"], [640, 330, 0.9, "teal"], [600, 30, 0.7, "light"], [300, 20, 0.8, "teal"], [80, 110, 0.8, "light"], [40, 430, 0.8, "teal"], [330, 530, 0.8, "red"], [620, 500, 1.0, "amber"], [560, 640, 0.8, "teal"]];
  const llaves = ["light", "red", "amber"];
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let html = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${sivaDefs(id)}<g id="lgLines"></g>`;
  EX.forEach((e, i) => { html += `<g class="lg-p" id="lgx${i}"><g class="flat">${sivaPersonaFlat(e[3])}</g><g class="grad">${sivaPersonaGrad(e[3], id)}</g></g>`; });
  [...llaves, "main"].forEach(k => { const c = k === "main" ? "teal" : k; html += `<g class="lg-p" id="lgp-${k}"><g class="flat">${sivaPersonaFlat(c)}</g><g class="grad">${sivaPersonaGrad(c, id)}</g></g>`; });
  html += `</svg>`;
  host.querySelector(".lg-stage").innerHTML = html;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, cl = (v, a, b) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => cl((t - a) / (b - a), 0, 1);
  const lerp = (a, b, k) => a + (b - a) * k;
  const lines = host.querySelector("#lgLines"); const nLines = 3 + EX.length;
  lines.innerHTML = Array.from({ length: nLines }, () => `<line stroke="${SIVA_LINE}" stroke-linecap="round"/>`).join("");
  const lel = Array.from(lines.children);
  const set = (el, x, y, s, op) => { el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`); el.style.opacity = op; };
  const T = { hold: 1000, move: [1300, 2600], extras: [1900, 2900], grad: [3200, 4400] };
  let t0 = null;
  function frame(ts) {
    if (t0 === null) t0 = ts; const t = reduce ? 99999 : ts - t0;
    const k = ease(seg(t, T.move[0], T.move[1])), g = ease(seg(t, T.grad[0], T.grad[1])), ex = ease(seg(t, T.extras[0], T.extras[1]));
    const pos = {}; ["main", ...llaves].forEach((n, i) => {
      const a = A[n], b = B[n], intro = ease(seg(t, 150 + i * 120, 750 + i * 120));
      const s = lerp(a.s, b.s, k) * (0.6 + 0.4 * intro);
      const p = { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) };
      // para crecer desde el centro de la base durante la entrada
      const cx = p.x + 50 * p.s, cy = p.y + 117 * p.s;
      const el = host.querySelector("#lgp-" + n);
      set(el, cx - 50 * s, cy - 117 * s, s, intro);
      el.querySelector(".flat").style.opacity = 1 - g; el.querySelector(".grad").style.opacity = g;
      pos[n] = p;
    });
    EX.forEach((e, i) => {
      const s = e[2] * (0.7 + 0.3 * ex), el = host.querySelector("#lgx" + i), cx = e[0] + 50 * e[2], cy = e[1] + 117 * e[2];
      set(el, cx - 50 * s, cy - 117 * s, s, ex);
      el.querySelector(".flat").style.opacity = 1 - g; el.querySelector(".grad").style.opacity = g;
    });
    // líneas
    llaves.forEach((n, i) => { const l = sivaLinea(pos.main, pos[n]), e = lel[i]; e.setAttribute("x1", l.x1); e.setAttribute("y1", l.y1); e.setAttribute("x2", l.x2); e.setAttribute("y2", l.y2); e.setAttribute("stroke-width", lerp(5, 4, k)); e.style.opacity = seg(t, 650, 1100); });
    EX.forEach((e, i) => { const q = { x: e[0], y: e[1], s: e[2] }, l = sivaLinea(pos.main, q), el = lel[3 + i]; el.setAttribute("x1", l.x1); el.setAttribute("y1", l.y1); el.setAttribute("x2", l.x2); el.setAttribute("y2", l.y2); el.setAttribute("stroke-width", 3); el.style.opacity = ex * 0.7; });
    host.classList.toggle("net", t >= T.move[0]);
    if (t < 5000 && !reduce) sivaRaf = requestAnimationFrame(frame); else sivaRaf = null;
  }
  sivaRaf = requestAnimationFrame(frame);
}

/* ============================ Iconos ============================ */
const SIVA_ICO = {
  bell: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>`,
  link: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`,
  pulse: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4m0 0h11l-2 4 2 4H5"/></svg>`
};

/* ============================ Campanita ============================ */
function sivaBellHTML() {
  const av = calcAvisos(), nuevos = av.filter(a => !S.leidos.includes(a.id));
  return { btn: `<button type="button" class="bell" id="btnBell" aria-haspopup="true" aria-label="Avisos${nuevos.length ? ", " + nuevos.length + " sin leer" : ""}">${SIVA_ICO.bell}${nuevos.length ? `<i class="bell-n">${nuevos.length}</i>` : ""}</button>`,
    pop: `<div class="pop pop-bell" id="popBell" role="dialog" aria-label="Avisos"><div class="bell-h"><h5>Avisos</h5>${nuevos.length ? `<button type="button" class="link-btn" id="bellTodo">Marcar todo como leído</button>` : ""}</div>
      ${av.length ? av.map(a => `<button class="aviso ${S.leidos.includes(a.id) ? "read" : ""}" data-aviso="${a.id}" data-ir="${a.ir}"><b>${esc(a.titulo)}</b>${esc(a.texto)}</button>`).join("") : `<p class="muted small" style="padding:6px 4px 10px">No tienes avisos por ahora.</p>`}</div>`, av };
}

/* ============================ Tutorial ============================ */
const sivaTutKey = () => "siva_tut_" + (ME ? ME.id : "x");
const sivaTutVisto = () => { try { return !!localStorage.getItem(sivaTutKey()); } catch (e) { return true; } };
const sivaTutMarcar = () => { try { localStorage.setItem(sivaTutKey(), "1"); } catch (e) {} };
function sivaTutPasos() {
  const p = [
    { t: "Te damos la bienvenida a SIVA", x: "Aquí registras y sigues los vínculos de tu área con universidades e instituciones. Te mostramos lo esencial en un minuto." },
    { sel: ".nav-item[data-k=mis]", t: "Tus vínculos", x: "Desde aquí entras a los vínculos de tu área. Cada fila abre una ficha con contactos, reuniones y seguimiento." },
    { sel: ".resumen", t: "Un vistazo rápido", x: "Cuántos vínculos tienes (en curso y terminados), cuáles tienen algo pendiente y cuántas convocatorias hay abiertas." },
    { sel: "#tablaMis", t: "Los vínculos abiertos", x: "La columna Estado te avisa cuáles conviene atender primero. Haz clic en una fila para abrir su ficha." },
    { sel: "#btnAdd", t: "Registrar algo nuevo", x: "Con Añadir creas un vínculo, una charla, un convenio o una convocatoria para estudiantes." },
    { sel: "#btnBell", t: "Avisos en la campanita", x: "Aquí llegan los avisos: contactos sin respuesta, calificaciones pendientes o vínculos que te traspasaron." },
    { sel: "#fab", t: "Asistente SIVA", x: "Pregúntale por tus vínculos, o pásale las notas de una reunión y él propone cómo actualizar la ficha. Tú apruebas cada cambio." },
    { sel: ".nav-item[data-k=dashboard]", t: "Estadísticas", x: "Cómo van los vínculos, qué metas aportan y si SIVA te está ahorrando tiempo." },
    { sel: ".nav-item[data-k=calendario]", t: "Calendario", x: "Reuniones, cierres de convocatorias y fechas clave en un mismo lugar." },
    { sel: "#fabGuia", t: "Puedes volver a verla", x: "Con este botón «?», abajo a la derecha, repites esta guía cuando quieras, desde cualquier página. En Ayuda están además las palabras que usamos." }
  ];
  return p.filter(s => !s.sel || document.querySelector(s.sel));
}
let sivaTut = null;
function sivaTutorial() {
  sivaTutCerrar(true);
  const pasos = sivaTutPasos(); if (!pasos.length) return;
  const ov = document.createElement("div"); ov.className = "tut"; ov.id = "tut";
  ov.innerHTML = `<div class="tut-hole" id="tutHole"></div><div class="tut-card" id="tutCard" role="dialog" aria-modal="true" aria-labelledby="tutT"><div class="tut-top"><span class="tut-n" id="tutN"></span><button type="button" class="tut-skip" id="tutSkip">Saltar</button></div><h3 id="tutT"></h3><p id="tutX"></p><div class="tut-dots" id="tutDots"></div><div class="tut-btns"><button type="button" class="btn-outline sm" id="tutPrev">Anterior</button><button type="button" class="btn-accent sm" id="tutNext">Siguiente</button></div></div>`;
  document.body.appendChild(ov);
  sivaTut = { i: 0, pasos, ov };
  const ir = d => { const n = sivaTut.i + d; if (n < 0) return; if (n >= pasos.length) { sivaTutCerrar(); return; } sivaTut.i = n; pinta(); };
  $("#tutSkip").onclick = () => sivaTutCerrar();
  $("#tutPrev").onclick = () => ir(-1); $("#tutNext").onclick = () => ir(1);
  sivaTut.key = e => { if (e.key === "Escape") sivaTutCerrar(); else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); ir(1); } else if (e.key === "ArrowLeft") ir(-1); };
  document.addEventListener("keydown", sivaTut.key, true);
  sivaTut.res = () => pinta(true); window.addEventListener("resize", sivaTut.res);
  function pinta(soloPos) {
    const s = pasos[sivaTut.i], hole = $("#tutHole"), card = $("#tutCard");
    if (!soloPos) {
      $("#tutT").textContent = s.t; $("#tutX").textContent = s.x; $("#tutN").textContent = (sivaTut.i + 1) + " de " + pasos.length;
      $("#tutDots").innerHTML = pasos.map((_, k) => `<i class="${k === sivaTut.i ? "on" : ""}"></i>`).join("");
      $("#tutPrev").hidden = sivaTut.i === 0; $("#tutNext").textContent = sivaTut.i === pasos.length - 1 ? "Empezar" : "Siguiente";
      card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    }
    const el = s.sel ? document.querySelector(s.sel) : null;
    if (el && !soloPos) { const r0 = el.getBoundingClientRect(); if (r0.top < 90 || r0.bottom > innerHeight - 40) el.scrollIntoView({ block: "center" }); }
    if (!el) { hole.style.cssText = "left:50%;top:50%;width:0;height:0;"; card.style.left = Math.max(12, (innerWidth - Math.min(420, innerWidth - 24)) / 2) + "px"; card.style.top = Math.max(12, innerHeight / 2 - 150) + "px"; return; }
    const r = el.getBoundingClientRect(), pad = 8;
    hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;
    const cw = Math.min(380, innerWidth - 24); card.style.width = cw + "px";
    const ch = card.offsetHeight || 220;
    let top = r.bottom + 18; if (top + ch > innerHeight - 12) top = Math.max(12, r.top - ch - 18);
    if (top + ch > innerHeight - 12) top = Math.max(12, innerHeight - ch - 12);
    let left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
    card.style.left = left + "px"; card.style.top = top + "px";
  }
  pinta();
  setTimeout(() => { const n = $("#tutNext"); if (n) n.focus(); }, 50);
}
function sivaTutCerrar(silencio) {
  if (!sivaTut) return;
  document.removeEventListener("keydown", sivaTut.key, true); window.removeEventListener("resize", sivaTut.res);
  sivaTut.ov.remove(); sivaTut = null; if (!silencio) sivaTutMarcar();
}

/* La guía se puede repetir cuando se quiera: siempre arranca desde Mis vínculos, que es donde están los elementos que explica. */
function verGuia() {
  const dentro = /^#\/mis\/?$/.test(location.hash);
  if (!dentro) location.hash = inicioDe(ME);
  setTimeout(sivaTutorial, dentro ? 150 : 450);
}

/* ============================ Logos de instituciones ============================ */
const LOGO_COLS = ["#186170", "#D84325", "#3E8C9B", "#B87A00", "#0A3A46", "#5B7F2A", "#7A4E9E", "#B04A6B"];
function logoSigla(c) {
  if (c.sigla) return c.sigla;
  const s = (c.corto || c.nombre || "?").replace(/\./g, "").trim(), w = s.split(/\s+/);
  if (w.length === 1) return s.length > 7 ? s.slice(0, 5) : s;
  if (w.every(x => x === x.toUpperCase())) return w[0];
  const sig = w.filter(x => !/^(de|del|la|las|los|el|y|e)$/i.test(x));
  return sig.slice(0, 3).map(x => x[0].toUpperCase()).join("") || "?";
}
// Insignia de la institución: su logo si se subió, o sus siglas con un color fijo por institución.
function logoInst(c, tam) {
  if (!c || !c.id) return "";
  const col = LOGO_COLS[[...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % LOGO_COLS.length];
  if (c.logo) return `<span class="logo-i ${tam || ""} con-img" style="--lc:${col}"><img src="${c.logo}" alt=""></span>`;
  const sg = logoSigla(c);
  return `<span class="logo-i ${tam || ""} n${Math.min(sg.length, 5)}" style="--lc:${col}" aria-hidden="true">${esc(sg)}</span>`;
}
function sivaLogoArchivo(f, ok) {
  if (!/^image\//.test(f.type)) { toast("Elige una imagen (PNG, JPG o SVG)"); return; }
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
      const m = 160, k = Math.min(1, m / Math.max(im.width, im.height)), cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
      cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/png"));
    }; im.onerror = () => toast("No pude leer esa imagen"); im.src = r.result; };
  r.readAsDataURL(f);
}

/* ============================ Paginación ============================ */
const PAG = {};
// Devuelve la página pedida de la lista y los controles. `ancla` es el id del recuadro al que se vuelve al cambiar de página.
function paginar(key, arr, tam, ancla) {
  const pags = Math.max(1, Math.ceil(arr.length / tam)), p = Math.min(Math.max(PAG[key] || 1, 1), pags), ini = (p - 1) * tam, items = arr.slice(ini, ini + tam);
  PAG[key] = p;
  if (pags < 2) return { items, html: "", p, pags };
  const nums = [];
  for (let i = 1; i <= pags; i++) { if (i === 1 || i === pags || Math.abs(i - p) <= 1) nums.push(i); else if (nums[nums.length - 1] !== "…") nums.push("…"); }
  const b = (to, txt, cls, lbl) => `<button type="button" class="pag-b ${cls}" data-pag="${key}" data-pag-a="${ancla || ""}" data-to="${to}" aria-label="${lbl}">${txt}</button>`;
  const html = `<nav class="pag" aria-label="Páginas de resultados"><span class="pag-info">Mostrando ${ini + 1} a ${ini + items.length} de ${arr.length}</span><div class="pag-btns">
    ${p > 1 ? b(p - 1, "Anterior", "pag-nav", "Página anterior") : `<span class="pag-b pag-nav off">Anterior</span>`}
    ${nums.map(n => n === "…" ? `<span class="pag-gap">…</span>` : n === p ? `<span class="pag-b on" aria-current="page">${n}</span>` : b(n, n, "", "Ir a la página " + n)).join("")}
    ${p < pags ? b(p + 1, "Siguiente", "pag-nav", "Página siguiente") : `<span class="pag-b pag-nav off">Siguiente</span>`}</div></nav>`;
  return { items, html, p, pags };
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-pag]"); if (!b) return;
  PAG[b.dataset.pag] = +b.dataset.to; render();
  const a = b.dataset.pagA && document.getElementById(b.dataset.pagA); if (a) a.scrollIntoView({ block: "start" });
});

/* ============================ Calendario ============================ */
const CAL_TIPOS = { reunion: { n: "Reuniones", c: "#186170" }, cierre: { n: "Cierre de convocatoria", c: "#D84325" }, inicio: { n: "Inicio de vínculo", c: "#3E8C9B" }, termino: { n: "Término de vínculo", c: "#C89900" }, cuest: { n: "Cuestionarios enviados", c: "#7C3F99" } };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
let cal = { y: null, m: null, off: {} };
function calEventos() {
  const ev = [], mios = misVinculos(), ok = f => /^\d{4}-\d{2}-\d{2}$/.test(f || "");
  mios.forEach(v => {
    const c = contraparte(v.contraparte).corto, ir = "#/ficha/" + v.id;
    if (ok(v.inicio)) ev.push({ f: v.inicio, t: "inicio", txt: v.nombre, sub: c, ir });
    if (ok(v.termino)) ev.push({ f: v.termino, t: "termino", txt: v.nombre, sub: c, ir });
    (v.reuniones || []).forEach(r => { if (ok(r.fecha)) ev.push({ f: r.fecha, t: "reunion", txt: v.nombre, sub: c, ir }); });
    (v.cuestionarios || []).forEach(q => { const f = q.fechaEnvio || (q.estado !== "borrador" ? q.fecha : ""); if (ok(f) && q.estado !== "borrador") ev.push({ f, t: "cuest", txt: v.nombre, sub: c, ir }); });
  });
  convVisibles().forEach(c => { if (ok(c.cierre)) ev.push({ f: c.cierre, t: "cierre", txt: c.titulo, sub: contraparte(c.institucion).corto, ir: "#/convocatoria/" + c.id }); });
  return ev.sort((a, b) => a.f.localeCompare(b.f));
}
function vCalendario() {
  const h = hoy(); if (cal.y == null) { cal.y = +h.slice(0, 4); cal.m = +h.slice(5, 7) - 1; }
  const todos = calEventos(), vis = todos.filter(e => !cal.off[e.t]);
  const prim = new Date(cal.y, cal.m, 1), dias = new Date(cal.y, cal.m + 1, 0).getDate(), ini = (prim.getDay() + 6) % 7;
  const mm = String(cal.m + 1).padStart(2, "0"), pref = cal.y + "-" + mm + "-";
  const porDia = {}; vis.filter(e => e.f.startsWith(pref)).forEach(e => (porDia[+e.f.slice(8)] = porDia[+e.f.slice(8)] || []).push(e));
  let celdas = ""; for (let i = 0; i < ini; i++) celdas += `<div class="cal-d vacio"></div>`;
  for (let d = 1; d <= dias; d++) {
    const es = porDia[d] || [], f = pref + String(d).padStart(2, "0");
    celdas += `<div class="cal-d ${f === h ? "hoy" : ""} ${es.length ? "con" : ""}"><span class="cal-n">${d}</span>${es.slice(0, 3).map(e => `<a class="cal-ev" href="${e.ir}" style="--c:${CAL_TIPOS[e.t].c}" title="${esc(CAL_TIPOS[e.t].n + " · " + e.txt + " · " + e.sub)}"><i></i><span>${esc(e.txt)}</span></a>`).join("")}${es.length > 3 ? `<span class="cal-mas">+${es.length - 3} más</span>` : ""}</div>`;
  }
  const lim = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const prox = vis.filter(e => e.f >= h && e.f <= lim).slice(0, 12);
  const mesTxt = MESES[cal.m] + " " + cal.y;
  return hero("Calendario", "Reuniones, cierres de convocatorias y fechas clave de tus vínculos en un solo lugar.") + `<div class="grid-main cal-grid"><div>
    <div class="card cal-card"><div class="cal-top"><div class="cal-nav"><button type="button" class="cal-b" data-cal="-1" aria-label="Mes anterior">‹</button><h2 class="cal-mes" aria-live="polite">${mesTxt}</h2><button type="button" class="cal-b" data-cal="1" aria-label="Mes siguiente">›</button></div><button type="button" class="btn-outline sm" data-cal="0">Hoy</button></div>
      <div class="cal-leg">${Object.entries(CAL_TIPOS).map(([k, t]) => `<button type="button" class="cal-chip ${cal.off[k] ? "off" : ""}" data-cal-tipo="${k}" style="--c:${t.c}" aria-pressed="${!cal.off[k]}"><i></i>${t.n}</button>`).join("")}</div>
      <div class="cal-sem"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
      <div class="cal-g">${celdas}</div></div></div>
    <aside class="stack"><div class="card"><p class="card-title">Próximos 30 días</p>${prox.length ? prox.map(e => `<a class="cal-prox" href="${e.ir}" style="--c:${CAL_TIPOS[e.t].c}"><span class="cal-f"><b>${+e.f.slice(8)}</b>${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][+e.f.slice(5, 7) - 1]}</span><span class="cal-t"><b>${esc(e.txt)}</b><small>${CAL_TIPOS[e.t].n} · ${esc(e.sub)}</small></span></a>`).join("") : `<p class="muted small">No hay fechas en los próximos 30 días.</p>`}</div></aside></div>`;
}
function sivaWireCalendario() {
  $$("[data-cal]").forEach(b => b.onclick = () => {
    const d = +b.dataset.cal; if (!d) { cal.y = null; } else { cal.m += d; if (cal.m < 0) { cal.m = 11; cal.y--; } if (cal.m > 11) { cal.m = 0; cal.y++; } }
    render();
  });
  $$("[data-cal-tipo]").forEach(b => b.onclick = () => { cal.off[b.dataset.calTipo] = !cal.off[b.dataset.calTipo]; render(); });
}

/* ============================ Después de dibujar ============================ */
function sivaContar() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  $$(".resumen b, .kpis b").forEach(b => {
    const txt = b.textContent.trim(); if (!/^\d+$/.test(txt)) return;
    const n = +txt, t0 = performance.now(), dur = 700; b.textContent = "0";
    const paso = ts => { const k = Math.min(1, (ts - t0) / dur); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  });
}
function sivaDespues(ruta) {
  document.body.dataset.ruta = ruta || "";
  if (ruta === "login" || !ruta) sivaMontarLogin();
  if (sivaTut && ruta !== "mis") sivaTutCerrar(true);
  if (ruta === "calendario") sivaWireCalendario();
  sivaContar();
  if (ME && ruta === "mis" && !sivaTutVisto() && !sivaTut) setTimeout(() => { if (!sivaTut && !sivaTutVisto() && location.hash.startsWith("#/mis")) sivaTutorial(); }, 900);
}

/* ============================ Rediseño v2 ============================ */
const SIVA_SI = "#1FA8BA", SIVA_PAR = "#F2A516", SIVA_NO = "#D84325";
const sivaFecha = f => new Date(f + "T12:00:00");

// Tarjetas de indicadores: número, etiqueta de estado y mini gráfico.
function sivaTarjetasResumen(mios, nInst, activos, incom, sinCal, convA, cierranPronto) {
  const hoyD = new Date(), n = mios.length;
  const finMes = k => new Date(hoyD.getFullYear(), hoyD.getMonth() - k + 1, 0, 23, 59);
  const serie = [5, 4, 3, 2, 1, 0].map(k => mios.filter(v => v.inicio && sivaFecha(v.inicio) <= finMes(k)).length);
  const mx = Math.max(1, ...serie), mn = Math.min(...serie), rango = Math.max(1, mx - mn);
  const pts = serie.map((v, i) => `${i * 20},${(26 - (v - mn) / rango * 22).toFixed(1)}`).join(" ");
  const nuevos = mios.filter(v => v.inicio && diasDesde(v.inicio) <= 30 && diasDesde(v.inicio) >= 0).length;
  const barra = (frac, col) => `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="11" width="100" height="8" rx="4" fill="#DCE8EA"/><rect x="0" y="11" width="${Math.max(frac * 100, frac ? 6 : 0).toFixed(1)}" height="8" rx="4" fill="${col}"/></svg>`;
  const puntos = col => `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22 H100" stroke="${col}" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  const chip = (t, c) => `<em class="sv-chip" style="--c:${c}">${t}</em>`;
  const tile = (tag, attrs, num, chipHTML, lbl, graf, col) => `<${tag} ${attrs} class="sv-k ${tag === "div" ? "" : "r-link"}" style="--c:${col}"><span class="sv-top"><b>${num}</b>${chipHTML}</span><span class="sv-l">${lbl}</span>${graf}</${tag}>`;
  return `<div class="resumen sv-resumen" role="region" aria-label="Resumen">
    ${tile("div", "", n, chip(nuevos ? "+" + nuevos + " este mes" : "sin cambios", "#186170"), `vínculos con ${nInst} ${nInst === 1 ? "institución" : "instituciones"}`, `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="svk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#186170" stop-opacity=".3"/><stop offset="1" stop-color="#186170" stop-opacity="0"/></linearGradient></defs><polygon points="${pts} 100,30 0,30" fill="url(#svk1)"/><polyline points="${pts}" fill="none" stroke="#186170" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`, "#186170")}
    ${tile("div", "", activos, chip(n ? Math.round(activos / n * 100) + "%" : "–", SIVA_SI), "en curso", barra(n ? activos / n : 0, SIVA_SI), SIVA_SI)}
    ${tile("button", 'data-ir-f="inc"', incom, chip(incom ? incom + (incom === 1 ? " pendiente" : " pendientes") : "al día", incom ? "#B97800" : "#B97800"), "con datos por completar", incom ? barra(incom / (n || 1), SIVA_PAR) : puntos(SIVA_PAR), SIVA_PAR)}
    ${tile("div", "", sinCal, chip(sinCal ? "por calificar" : "al día", SIVA_NO), "terminados sin calificar", sinCal ? barra(sinCal / (n || 1), SIVA_NO) : puntos(SIVA_NO), SIVA_NO)}
    ${tile("a", 'href="#/mis/convocatorias"', convA, chip(cierranPronto ? cierranPronto + " cierra pronto" : "sin cierres cerca", "#2A8F9C"), "convocatorias abiertas", barra(convA ? Math.min(1, convA / 5) : 0, "#5BB5C0"), "#5BB5C0")}
  </div>`;
}

// Línea de tiempo del resumen semanal: cinta de meses con burbujas colgadas.
function sivaTimelineHTML(d) {
  const SIVA_NO = "#C8604A", SIVA_PAR = "#DDA545", SIVA_SI = "#4FA3AE";
  const hoyD = sivaFecha(hoy());
  const items = [
    ...d.rojos.map(v => { const f = ultimoMovimiento(v), dias = f ? diasDesde(f) : 120; return { f: f || hoy(), dias, c: SIVA_NO, s: Math.min(100, 56 + dias * .6), t: v.nombre, x: `${contraparte(v.contraparte).corto} · sin movimiento hace ${dias} días`, href: "#/ficha/" + v.id }; }),
    ...d.cierran.map(c => { const dias = -diasDesde(c.cierre); return { f: c.cierre, dias, c: SIVA_PAR, s: Math.max(52, 92 - dias * 3), t: "Cierra: " + c.titulo, x: `${fechaTxt(c.cierre)} · ${c.postulantes.length} postulantes`, href: "#/convocatoria/" + c.id }; }),
    ...d.sinResp.map(({ v, q }) => { const f = q.fechaEnvio || q.fecha, dias = diasDesde(f); return { f, dias, c: dias > 14 ? SIVA_PAR : SIVA_SI, s: Math.min(92, 44 + dias * 1.2), t: "Cuestionario " + contraparte(v.contraparte).corto, x: `Enviado el ${fechaTxt(f)} · sin respuesta`, href: "#/ficha/" + v.id }; })
  ].map(i => ({ ...i, d: sivaFecha(i.f) }));
  if (!items.length) return `<div class="sv-tl-vacio"><b>Todo al día</b><span>No hay vínculos urgentes, cierres cercanos ni cuestionarios pendientes.</span></div>`;
  const DAY = 86400000, minD = new Date(Math.max(Math.min(hoyD - 30 * DAY, ...items.map(i => i.d)), hoyD - 150 * DAY));
  const ini = new Date(minD.getFullYear(), minD.getMonth(), 1), maxD = new Date(Math.max(+hoyD + 30 * DAY, ...items.map(i => +i.d + 10 * DAY)));
  const fin = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 1), tot = fin - ini, px = dt => Math.min(99.2, Math.max(.8, (dt - ini) / tot * 100));
  const meses = []; for (let m = new Date(ini); m < fin; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) meses.push({ n: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m.getMonth()], w: (new Date(m.getFullYear(), m.getMonth() + 1, 1) - m) / tot * 100 });
  items.sort((a, b) => a.d - b.d);
  const ult = []; items.forEach(i => { i.p = px(i.d); let l = 0; while (ult[l] != null && i.p - ult[l] < 17) l++; ult[l] = i.p; i.l = l; });
  const H = 125, niveles = ult.length, alto = 62 + (niveles - 1) * H + 150;
  const pasado = items.filter(i => i.d <= hoyD).sort((a, b) => a.d - b.d);
  const hoyP = px(hoyD), primero = Math.min(...items.map(i => i.p));
  const tramos = pasado.length ? `<i style="left:${Math.min(primero, hoyP)}%;width:${Math.max(0, hoyP - Math.min(primero, hoyP))}%;background:${SIVA_NO};opacity:.45"></i>` : "";
  const prox = items.filter(i => i.d > hoyD), fut = prox.length ? `<i style="left:${hoyP}%;width:${Math.max(0, Math.max(...prox.map(i => i.p)) - hoyP)}%;background:${SIVA_SI};opacity:.55"></i>` : "";
  return `<div class="sv-tl-wrap"><div class="sv-tl" style="height:${alto}px">
    <div class="sv-meses">${meses.map(m => `<span style="flex:${m.w}">${m.n}</span>`).join("")}</div>
    <div class="sv-bar">${tramos}${fut}</div>
    <div class="sv-hoy" style="left:${hoyP}%"><span>Hoy</span></div>
    ${items.map(i => { const top = 62 + i.l * H; return `<a class="sv-hang" href="${i.href}" style="left:${i.p}%;--c:${i.c};top:48px;height:${top - 48 + i.s}px"><span class="sv-bub" style="--d:${i.s}px;top:${top - 48}px"><b>${i.dias}</b><small>días</small></span><span class="sv-txt" style="top:${top - 48 + i.s + 6}px"><strong>${esc(i.t)}</strong>${esc(i.x)}</span></a>`; }).join("")}
  </div></div>
  <p class="help sv-tl-ley">Cliquea el círculo para abrir.</p>`;
}

// ¿Ayudó a cumplir las metas?: cifra, barra apilada y personas.
function sivaMetasHTML(si, par, no) {
  const tot = si + par + no; if (!tot) return `<p class="muted small">Sin datos con este filtro.</p>`;
  const cols = [SIVA_SI, SIVA_PAR, SIVA_NO], cn = [si, par, no], nm = ["Sí", "Parcialmente", "No"];
  const persona = c => `<svg viewBox="0 0 100 130" aria-hidden="true"><ellipse cx="50" cy="117" rx="47" ry="11" fill="none" stroke="${c}" stroke-width="5"/><path d="M19 73 A31 31 0 0 1 81 73 L81 100 Q81 108 73 108 L27 108 Q19 108 19 100 Z" fill="${c}"/><circle cx="50" cy="20" r="18" fill="${c}"/></svg>`;
  const gente = tot <= 30 ? `<div class="sv-gente">${cn.map((c, i) => Array.from({ length: c }, () => persona(cols[i])).join("")).join("")}</div>` : "";
  return `<div class="sv-metas"><div><span class="sv-big" style="color:${SIVA_SI}">${Math.round(si / tot * 100)}%</span> <span class="muted">cumplió las metas</span></div>
    <div class="sv-stack" role="img" aria-label="${nm.map((t, i) => t + " " + cn[i]).join(", ")}">${cn.map((c, i) => c ? `<span style="flex:${c};background:${cols[i]}" title="${nm[i]}: ${c}">${c}</span>` : "").join("")}</div>
    ${gente}
    <ul class="sv-ley">${nm.map((t, i) => `<li><i style="background:${cols[i]}"></i>${t} <b>${cn[i]}</b> <small>${Math.round(cn[i] / tot * 100)}%</small></li>`).join("")}</ul></div>`;
}

// Calificación por tipo: columnas con colores por nota.
function sivaColumnasNota(rows) {
  const col = v => v >= 4 ? SIVA_SI : v >= 3.5 ? SIVA_PAR : SIVA_NO;
  return `<div class="sv-cols">${rows.map(r => { const c = r.p ? col(r.p) : "#C5D3D7"; return `<div title="${esc(r.n)}${r.s ? " · " + esc(r.s) : ""}"><b>${r.p ? num1(r.p) : "–"}</b><span style="height:${r.p ? Math.max(8, r.p / 5 * 100) : 6}%;background:linear-gradient(${c},color-mix(in srgb,${c} 55%,#fff))"></span><em>${esc(r.n)}</em><small>${r.s || ""}</small></div>`; }).join("")}</div>`;
}
