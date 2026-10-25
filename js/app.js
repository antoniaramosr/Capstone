/* Vistas, navegación (router por #/ruta) y eventos.
   Depende de: config.js, data.js, store.js, ai.js (cargados antes). */

const ACORTAR = { si: "Sí", parcial: "Parcialmente", no: "No" };
const pill = (e, tipoId) => `<span class="pill p${e}" title="${esc(etapaAyuda(e, tipoId))}">${CONFIG.etapas[e]}</span>`;
const dots = n => n ? `<span class="dots" aria-label="${num1(n)} de 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.round(n) ? "" : "off"}"></i>`).join("")}</span>` : `<span class="muted">Sin calificar</span>`;
const barra = (pct, cls = "") => `<span class="prog ${cls}" title="${pct} %"><i style="width:${pct}%"></i></span>`;
const rutaTxt = id => rutaArea(id).map(a => esc(a.nombre)).join(" › ");

let toastT, undoFn = null;
function toast(msg, undo) {
  $("#toastMsg").textContent = msg; undoFn = undo || null; $("#toastUndo").hidden = !undo;
  $("#toast").classList.add("show"); clearTimeout(toastT);
  toastT = setTimeout(() => $("#toast").classList.remove("show"), undo ? 6000 : 3200);
}

async function descargar(nombre, contenido, mime) {
  try {
    if (window.claude && window.claude.use) {
      const d = await window.claude.use("downloads");
      if (d) { await d.save({ filename: nombre, data: contenido }); return; }
    }
  } catch (e) { if (e && e.code === "cancelled") return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenido], { type: mime }));
  a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
}

/* ============================ Avisos ============================ */
function calcAvisos() {
  const r = [], mios = misVinculos();
  if (!ME.admin) {
    [...new Set(mios.map(v => v.contraparte))].forEach(cp => {
      const otras = S.vinculos.filter(v => v.contraparte === cp && !mios.includes(v));
      if (otras.length) {
        const as = [...new Set(otras.map(v => nombreArea(v.area)))];
        r.push({ id: "cx-" + cp + "-" + otras.length, titulo: "Contacto existente", texto: `${as.slice(0, 2).join(" y ")}${as.length > 2 ? " y otras áreas" : ""} también ${as.length > 1 ? "trabajan" : "trabaja"} con ${contraparte(cp).corto}.`, ir: "#/contraparte/" + cp });
      }
    });
  }
  mios.filter(v => v.etapa === 3 && !v.calif).forEach(v => r.push({ id: "cal-" + v.id, titulo: "Calificación pendiente", texto: `"${v.nombre}" con ${contraparte(v.contraparte).corto} está cerrado y no tiene calificación.`, ir: "#/ficha/" + v.id }));
  const inc = mios.filter(v => completitud(v).pct < 50);
  if (inc.length) r.push({ id: "inc-" + inc.length, titulo: "Datos por completar", texto: `A ${inc.length} ${inc.length === 1 ? "vínculo le faltan" : "vínculos les faltan"} datos importantes de la ficha.`, ir: "#/mis/incompletos" });
  return r.slice(0, 8);
}

/* ============================ Shell ============================ */
function megaHTML(k) {
  if (k === "mis") {
    const mios = misVinculos();
    const cols = CONFIG.etapas.map((et, i) => {
      const vs = mios.filter(v => v.etapa === i);
      return `<div class="mega-col"><h4><a href="#/mis/etapa-${i}">${et} <span class="mini-n">${vs.length}</span></a></h4><ul>${vs.slice(0, 5).map(v => `<li><a href="#/ficha/${v.id}">${esc(v.nombre)}<span class="mini">${esc(contraparte(v.contraparte).corto)}</span></a></li>`).join("") || `<li><span>Sin vínculos</span></li>`}${vs.length > 5 ? `<li><a href="#/mis">y ${vs.length - 5} más</a></li>` : ""}</ul></div>`;
    }).join("");
    return `<div class="mega-intro"><h3>${ME.admin ? "Todos los vínculos" : "Mis vínculos"}</h3><p>${ME.admin ? "Todos los vínculos registrados" : "Los vínculos de " + esc(nombreArea(ME.area))}, ordenados por etapa.</p><a href="#/mis">Ver la lista completa</a></div><div class="mega-cols">${cols}</div>`;
  }
  if (k === "areas") {
    const cols = S.areas.filter(a => !a.parent).map(vp => `<div class="mega-col"><h4><a href="#/area/${vp.id}">${esc(vp.nombre)}</a></h4><ul>${hijos(vp.id).map(g => `<li><a href="#/area/${g.id}" class="g">${esc(g.nombre)}</a></li>${hijos(g.id).map(s => `<li><a href="#/area/${s.id}" class="s">${esc(s.nombre)}${s.id === ME.area ? '<span class="tag-mine">Mi área</span>' : ""}</a></li>`).join("")}`).join("")}</ul></div>`).join("");
    return `<div class="mega-intro"><h3>Áreas</h3><p>Vicepresidencias, gerencias y subáreas que gestionan vínculos.</p><a href="#/areas">Ver todas las áreas</a></div><div class="mega-cols">${cols}</div>`;
  }
  if (k === "contrapartes") {
    const tiposCon = S.tiposOrg.filter(t => S.contrapartes.some(c => c.tipoOrg === t)).slice(0, 4);
    const cols = tiposCon.map(t => {
      const cs = S.contrapartes.filter(c => c.tipoOrg === t);
      return `<div class="mega-col"><h4><a href="#/contrapartes/${encodeURIComponent(t)}">${esc(t)}</a></h4><ul>${cs.slice(0, 7).map(c => `<li><a href="#/contraparte/${c.id}">${esc(c.corto)}<span class="mini">${S.vinculos.filter(v => v.contraparte === c.id).length} vínculos</span></a></li>`).join("")}${cs.length > 7 ? `<li><a href="#/contrapartes/${encodeURIComponent(t)}">y ${cs.length - 7} más</a></li>` : ""}</ul></div>`;
    }).join("");
    return `<div class="mega-intro"><h3>Instituciones</h3><p>Universidades, centros de formación, OTEC y otras instituciones con las que trabajan las áreas.</p><a href="#/contrapartes">Ver todas las instituciones</a></div><div class="mega-cols">${cols}</div>`;
  }
  return "";
}

// Etiqueta de compañías: si son todas, se dice así; si son muchas, se muestran dos y "+n".
const compTag = ids => {
  ids = Array.isArray(ids) ? ids : ids ? [ids] : [];
  if (!ids.length) return "";
  if (ids.length === S.companias.length) return `<span class="comp"><i style="background:var(--brand-2)"></i>Todas las compañías</span>`;
  const t = ids.slice(0, 2).map(id => { const c = compania(id); return `<span class="comp"><i style="background:${c.color}"></i>${esc(c.nombre)}</span>`; }).join(" ");
  return t + (ids.length > 2 ? ` <span class="comp" title="${esc(compsTxt(ids))}">+${ids.length - 2}</span>` : "");
};
const inicioDe = u => u && u.rol === "gestor" ? "#/mis" : "#/dashboard";
const perfilTxt = u => u.admin ? "Administración" : (u.rol === "jefatura" ? "Jefatura · " : "") + nombreArea(u.area) + (u.compania ? " · " + compania(u.compania).nombre : "");
const etiquetaEspacioVacio = () => (ESPACIO === "vacio2" ? "Página vacía · Perfil 2" : "Página vacía · Perfil 0");
const usuarioEspacioVacio = u => u.espacio && esEspacioVacio(u.espacio);
// Logo de AMSA; si la imagen no carga, se muestra el nombre en texto.
const logoAmsa = (blanco = false) => `<img class="${blanco ? "brand-logo" : ""}" src="${blanco ? CONFIG.logos.blanco : CONFIG.logos.color}" alt="Antofagasta Minerals" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'logo-txt '+this.className,textContent:'Antofagasta Minerals'}))">`;
const pie = () => `<footer class="foot"><div class="foot-inner">${logoAmsa(true).replace('class="brand-logo"', "")}<span>Prototipo IDI2025 · Grupo 2 · datos de ejemplo</span></div></footer>`;
function shell(active) {
  const av = calcAvisos(), unread = av.filter(a => !S.leidos.includes(a.id)).length;
  const navs = ME.rol === "jefatura"
    ? [{ k: "dashboard", t: "Estadísticas" }, { k: "mis", t: "Vínculos de mi gerencia", mega: 1 }, { k: "contrapartes", t: "Instituciones", mega: 1 }, { k: "metas", t: "Metas" }]
    : [{ k: "mis", t: ME.admin ? "Vínculos" : "Mis vínculos", mega: 1 }, { k: "areas", t: "Áreas", mega: 1 }, { k: "contrapartes", t: "Instituciones", mega: 1 }, { k: "dashboard", t: "Estadísticas" }];
  if (ME.admin) navs.push({ k: "admin", t: "Administración" });
  const otros = Object.values(CONFIG.usuarios).filter(u => u.id !== ME.id);
  return `
  <header class="top">
    <div class="top-inner">
      <a class="logo" href="${inicioDe(ME)}" aria-label="${CONFIG.app.sigla}, inicio">${logoAmsa()}<span class="prod"><b>${CONFIG.app.sigla}</b><span>${CONFIG.app.nombre}</span></span></a>${esEspacioVacio() ? `<span class="modo-vacio" title="Estás en la página de prueba: lo que registres aquí no se mezcla con los datos de ejemplo">${etiquetaEspacioVacio()}</span>` : ""}
      <nav class="nav" aria-label="Secciones">${navs.map(n => `<div class="nav-item" data-k="${n.k}" ${n.mega ? 'data-mega="1"' : ""}><a class="nav-btn ${active === n.k ? "active" : ""}" href="#/${n.k}" ${active === n.k ? 'aria-current="page"' : ""} ${n.mega ? 'aria-haspopup="true" aria-expanded="false"' : ""}>${n.t}${n.mega ? '<i class="caret"></i>' : ""}</a></div>`).join("")}</nav>
      <div class="top-right">
        <button class="btn-ghost-dark" id="btnAvisos" aria-haspopup="true">Avisos <span class="badge ${unread ? "" : "zero"}">${unread}</span></button>
        ${puedeCrear() ? `<button class="btn-accent" id="btnAdd" aria-haspopup="true">+ Añadir <i class="caret light"></i></button>` : ""}
        <button class="user" id="btnUser" aria-haspopup="true"><span class="avatar">${ME.inicial}</span><div><b>${esc(ME.nombre)}</b><small>${esc(perfilTxt(ME))}</small></div></button>
      </div>
    </div>
    <div class="mega" id="mega"><div class="mega-inner" id="megaInner"></div></div>
    <div class="pop pop-avisos" id="popAvisos"><h5>Avisos</h5>${av.length ? av.map(a => `<button class="pop-item ${S.leidos.includes(a.id) ? "read" : ""}" data-aviso="${a.id}" data-ir="${a.ir}"><i class="dot"></i><div><b>${esc(a.titulo)}</b><small>${esc(a.texto)}</small></div></button>`).join("") : `<div class="pop-empty">No tienes avisos.</div>`}</div>
    ${puedeCrear() ? `<div class="pop pop-add" id="popAdd"><h5>¿Qué quieres registrar?</h5>
      <a class="pop-item" href="#/nueva-convocatoria"><div><b>Convocatoria para estudiantes</b><small>Prácticas o memorias. Se puede publicar en LinkedIn.</small></div></a>
      <a class="pop-item" href="#/nuevo/char"><div><b>Charla o actividad</b><small>Charlas, ferias o visitas a nuestras oficinas u operaciones.</small></div></a>
      <a class="pop-item" href="#/nuevo/acad"><div><b>Proyecto académico (Capstone)</b><small>Un desafío nuestro trabajado por estudiantes en un curso.</small></div></a>
      <a class="pop-item" href="#/nuevo/conv"><div><b>Convenio</b><small>Un acuerdo formal con una institución.</small></div></a>
      <a class="pop-item" href="#/nuevo"><div><b>Otro tipo de vínculo</b><small>Consejos, programas de formación, empleo, I+D y más.</small></div></a></div>` : ""}
    <div class="pop pop-user" id="popUser">
      <p class="pop-lbl">Cambiar de perfil (prototipo)${esEspacioVacio() ? " · sigues en la página vacía" : ""}</p>
      ${otros.map(u => `<button class="pop-item" data-cambiar="${u.id}"><span class="avatar">${u.inicial}</span><div><b>${esc(u.nombre)}</b><small>${esc(CONFIG.roles[u.rol].nombre)}</small></div></button>`).join("")}
      <a class="pop-item" href="#/convocatorias">Ver la página de estudiantes</a>
      ${esEspacioVacio() ? `<button class="pop-item" id="vaciar">Vaciar de nuevo la página de prueba</button>` : ""}
      <button class="pop-item" id="salir">Cerrar sesión</button>
    </div>
  </header>`;
}

// Barra de arriba: al pasar el mouse se despliega la lista; al hacer clic se abre la página.
// En celular (sin mouse) el primer toque despliega la lista y el enlace "Ver todo" abre la página.
let navRecienClic = null;
function wireShell() {
  const mega = $("#mega"), inner = $("#megaInner");
  let hideT, showT, openK = null;
  const close = () => { clearTimeout(showT); mega.classList.remove("show"); $$(".nav-item").forEach(n => { n.classList.remove("open"); const a = n.querySelector("a"); if (n.dataset.mega) a.setAttribute("aria-expanded", "false"); }); openK = null; };
  const open = (k, item) => {
    clearTimeout(hideT); if (openK === k) return;
    inner.innerHTML = megaHTML(k);
    $$(".nav-item").forEach(n => { n.classList.remove("open"); if (n.dataset.mega) n.querySelector("a").setAttribute("aria-expanded", "false"); });
    item.classList.add("open"); item.querySelector("a").setAttribute("aria-expanded", "true");
    mega.classList.add("show"); openK = k; closePops();
  };
  const desktop = () => window.matchMedia("(min-width:761px) and (hover:hover)").matches;
  $$(".nav-item").forEach(item => {
    const k = item.dataset.k, a = item.querySelector("a");
    item.addEventListener("mouseenter", () => {
      if (!desktop()) return;
      if (!item.dataset.mega) { close(); return; }
      if (navRecienClic === k) return;               // recién abierta con clic: no tapar la página
      clearTimeout(showT); showT = setTimeout(() => open(k, item), openK ? 0 : 120);
    });
    item.addEventListener("mouseleave", () => { if (!desktop()) return; clearTimeout(showT); if (navRecienClic === k) navRecienClic = null; hideT = setTimeout(close, 200); });
    a.addEventListener("click", e => {
      if (item.dataset.mega && !desktop()) { e.preventDefault(); openK === k ? close() : open(k, item); return; }
      navRecienClic = k; close(); if (k === "mis") { filtro.etapa = -1; filtro.inc = false; }
      if (location.hash === "#/" + k) { e.preventDefault(); filtro.etapa = -1; render(); }
    });
    a.addEventListener("keydown", e => { if (item.dataset.mega && e.key === "ArrowDown") { e.preventDefault(); open(k, item); const f = mega.querySelector("a"); if (f) f.focus(); } });
  });
  mega.addEventListener("mouseenter", () => clearTimeout(hideT));
  mega.addEventListener("mouseleave", () => { if (desktop()) hideT = setTimeout(close, 200); });
  mega.addEventListener("click", e => { if (e.target.closest("a")) close(); });
  // Avisos, Añadir y el menú de usuario: se despliegan al pasar el mouse y también con clic.
  const hoverPop = (btnSel, popSel) => {
    const btn = $(btnSel), pop = $(popSel); if (!btn) return;
    let t;
    btn.onclick = e => { e.stopPropagation(); close(); if (desktop() && pop.classList.contains("show")) return; togglePop(popSel); };
    const entrar = () => { if (!desktop()) return; clearTimeout(t); close(); if (!pop.classList.contains("show")) { closePops(); ubicarPop(pop); pop.classList.add("show"); } };
    const salir = () => { if (!desktop()) return; t = setTimeout(() => pop.classList.remove("show"), 250); };
    btn.addEventListener("mouseenter", entrar); btn.addEventListener("mouseleave", salir);
    pop.addEventListener("mouseenter", () => clearTimeout(t)); pop.addEventListener("mouseleave", salir);
  };
  hoverPop("#btnAvisos", "#popAvisos"); hoverPop("#btnAdd", "#popAdd"); hoverPop("#btnUser", "#popUser");
  $$("[data-aviso]").forEach(b => b.onclick = () => abrirAviso(b.dataset.aviso, b.dataset.ir));
  $$("[data-cambiar]").forEach(b => b.onclick = () => { const id = b.dataset.cambiar; iniciarSesion(id, !CONFIG.usuarios[id].espacio); filtro.comp = ""; location.hash = inicioDe(ME); render(); });
  const vac = $("#vaciar"); if (vac) vac.onclick = () => { const antes = JSON.stringify(S); restablecer(); closePops(); location.hash = inicioDe(ME); render(); toast("Página de prueba vacía otra vez", () => { S = JSON.parse(antes); guardar(); render(); }); };
  $("#salir").onclick = () => { cerrarSesion(); location.hash = "#/login"; render(); };
}
function closePops() { $$(".pop").forEach(p => p.classList.remove("show")); }
// Cada menú se abre justo bajo su botón, alineado a su borde derecho.
const BTN_DE_POP = { popAvisos: "#btnAvisos", popAdd: "#btnAdd", popUser: "#btnUser" };
function ubicarPop(p) {
  const b = $(BTN_DE_POP[p.id] || ""); if (!b || window.innerWidth <= 760) { p.style.right = ""; return; }
  p.style.right = Math.max(8, document.documentElement.clientWidth - b.getBoundingClientRect().right) + "px";
}
function togglePop(sel) { const p = $(sel), was = p.classList.contains("show"); closePops(); if (!was) { ubicarPop(p); p.classList.add("show"); } }
function abrirAviso(id, ir) { if (!S.leidos.includes(id)) S.leidos.push(id); guardar(); closePops(); if (location.hash === ir) render(); else location.hash = ir; }
document.addEventListener("click", e => { if (!e.target.closest(".pop")) closePops(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { closePops(); cerrarAsistente(); } });

/* ============================ Login ============================ */
let loginAbierto = false;
function vLogin() {
  const us = Object.values(CONFIG.usuarios);
  return `<div class="login">
    <div class="login-art">
      <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => { const r = 40 + i * 30; return `<path d="M${300 - r} 300 C ${300 - r} ${300 - r * 0.9}, ${300 + r * 0.7} ${300 - r * 1.05}, ${300 + r} ${300 - r * 0.2} S ${300 + r * 0.6} ${300 + r * 1.1}, ${300 - r * 0.3} ${300 + r * 0.85} S ${300 - r} ${300 + r * 0.3}, ${300 - r} 300Z" fill="none" stroke="#fff" stroke-width="1"/>`; }).join("")}</svg>
      <div class="txt">${logoAmsa(true)}</div>
      <div class="txt"><h2>${CONFIG.app.sigla}</h2><p class="login-full">${CONFIG.app.nombre}</p>
        <p>Registra los vínculos de tu área con universidades e instituciones, revisa quién más trabaja con ellas y mide qué colaboraciones sirven.</p></div>
    </div>
    <div class="login-form"><div class="login-box">
      ${logoAmsa()}
      <h1>Iniciar sesión</h1>
      <p class="sub">Entra con tu cuenta corporativa de Antofagasta Minerals.</p>
      <button class="btn-accent sso" id="btnSso" aria-expanded="${loginAbierto}" aria-controls="cuentas">Iniciar sesión</button>
      <div class="cuentas" id="cuentas" ${loginAbierto ? "" : "hidden"}>
        <p class="pop-lbl">Elige una cuenta</p>
        <p class="grupo-l">Con datos de ejemplo</p>
        ${us.filter(u => !usuarioEspacioVacio(u)).map(u => `<button class="login-opt" data-login="${u.id}"><span class="avatar big">${u.inicial}</span><span><b>${esc(u.nombre)}</b><span class="mail-l">${esc(u.correo)}</span><small class="role-desc">${esc(CONFIG.roles[u.rol].nombre)}${u.area ? " · " + esc(nombreArea(u.area)) : ""}${u.nota ? ". " + esc(u.nota) : ""}</small></span></button>`).join("")}
        <p class="grupo-l">Para probar desde cero</p>
        ${us.filter(usuarioEspacioVacio).map(u => `<button class="login-opt vacio" data-login="${u.id}"><span class="avatar big">${u.inicial}</span><span><b>${esc(u.nombre)} · página vacía</b><span class="mail-l">${esc(u.correo)}</span><small class="role-desc">${esc(u.nota)}. Entras como gestor/a de ${esc(nombreArea(u.area))}; desde tu perfil puedes cambiar a jefatura o administración sin salir de la página vacía.</small></span></button>`).join("")}
        <p class="help">En el prototipo cada cuenta muestra un perfil distinto. En la versión real se entra con la cuenta de Microsoft de la empresa y el perfil viene asignado.</p>
      </div>
      <div class="login-extra">
        <a class="login-stu" href="#/convocatorias">¿Eres estudiante? Ver convocatorias abiertas</a>
        <p class="help"><a class="lnk" href="#/reiniciar">Restablecer todo</a>: vuelve a los datos de ejemplo y vacía las páginas del Perfil 0 y del Perfil 2 (antes de cada sesión de testeo)</p>
      </div>
    </div></div>
  </div>`;
}

/* ============================ Mis vínculos ============================ */
let filtro = { etapa: -1, tipo: "", q: "", inc: false, comp: "" };
function filasVinculos(list, opts = {}) {
  if (!list.length) return `<div class="empty">${opts.vacio || "No hay vínculos para mostrar."}</div>`;
  const mailCol = opts.mail !== false && puedeCrear();
  return `<div class="table-wrap"><table><thead><tr><th>Vínculo</th><th>Institución</th>${opts.area ? "<th>Área</th>" : ""}<th>Etapa</th><th>Avance</th><th>Calificación</th>${mailCol ? "<th>Correo</th>" : ""}</tr></thead><tbody>${list.map(v => {
    const c = contraparte(v.contraparte), comp = completitud(v), pr = progreso(v);
    const falta = comp.pct < 50 ? `<small class="falta" title="Falta: ${esc(comp.faltan.join(", "))}">Faltan ${comp.faltan.length} datos de la ficha</small>` : "";
    const mail = mailCol && puedeEditar(v) ? (v.contacto.correo ? `<button type="button" class="link-btn" data-mail-v="${v.id}">Escribir</button>` : `<span class="muted small">Sin correo</span>`) : "";
    return `<tr class="row" data-ficha="${v.id}" tabindex="0"><td><span class="t">${esc(v.nombre)}</span><small>${esc(tipo(v.tipo).nombre)} ${compTag(compsDe(v))}</small></td><td>${esc(c.corto)}<small>${esc(v.sede)}</small></td>${opts.area ? `<td><small style="color:var(--ink)">${esc(nombreArea(v.area))}</small></td>` : ""}<td>${pill(v.etapa, v.tipo)}</td><td data-l="Avance"><span class="pcell">${barra(pr)}<b>${pr}%</b></span>${falta}</td><td data-l="Calificación">${dots(v.calif)}${v.calif ? ` <span class="muted small">${num1(v.calif)}</span>` : ""}</td>${mailCol ? `<td data-l="Correo" class="td-mail">${mail}</td>` : ""}</tr>`;
  }).join("")}</tbody></table></div>`;
}
function listaFiltrada() {
  const q = filtro.q.toLowerCase();
  return misVinculos().filter(v => (!filtro.comp || compsDe(v).includes(filtro.comp)) && (filtro.etapa < 0 || v.etapa === filtro.etapa) && (!filtro.tipo || v.tipo === filtro.tipo) && (!filtro.inc || completitud(v).pct < 50) &&
    (!q || (v.nombre + " " + contraparte(v.contraparte).nombre + " " + contraparte(v.contraparte).corto + " " + v.sede).toLowerCase().includes(q)));
}
function vMis(p) {
  if (p === "incompletos") filtro.inc = true;
  if (p && p.startsWith("etapa-")) { filtro.etapa = +p.slice(6); filtro.inc = false; }
  const mios = misVinculos();
  const misCp = [...new Set(mios.map(v => v.contraparte))];
  const otras = ME.admin ? [] : S.vinculos.filter(v => !mios.includes(v) && misCp.includes(v.contraparte));
  const av = calcAvisos();
  if (!mios.length && !ME.admin) return vBienvenida();
  const activos = mios.filter(v => v.etapa < 3).length, sinCal = mios.filter(v => v.etapa === 3 && !v.calif).length;
  const incom = mios.filter(v => completitud(v).pct < 50).length, convA = S.convocatorias.filter(c => c.estado === "Abierta" && (ME.admin || descendientes(ME.area).includes(convArea(c)))).length;
  const nInst = misCp.length, comp = misCp.filter(cp => S.vinculos.some(v => v.contraparte === cp && !mios.includes(v))).length;
  return `<div class="head-row"><div><h1>${ME.admin ? "Todos los vínculos" : ME.rol === "jefatura" ? "Vínculos de mi gerencia" : "Mis vínculos"}</h1><p class="sub">${ME.admin ? "Vista de administración" : rutaTxt(ME.area)}</p></div></div>
  <div class="resumen" role="region" aria-label="Resumen">
    <div><b>${mios.length}</b><span>vínculos con ${nInst} instituciones</span></div>
    <div><b>${activos}</b><span>activos (no cerrados)</span></div>
    <button class="r-link" data-ir-f="inc"><b>${incom}</b><span>con datos por completar</span></button>
    <div><b>${sinCal}</b><span>cerrados sin calificar</span></div>
    ${ME.admin ? `<div><b>${convA}</b><span>convocatorias abiertas</span></div>` : `<div><b>${comp}</b><span>instituciones que también ven otras áreas</span></div>`}
  </div>
  <div class="grid-main"><div>
    <div class="filters">
      <div class="chips">${["Todos", ...CONFIG.etapas].map((t, i) => `<button class="chip-btn ${filtro.etapa === i - 1 ? "on" : ""}" data-etapa-f="${i - 1}">${t} (${i ? mios.filter(v => v.etapa === i - 1).length : mios.length})</button>`).join("")}</div>
      <div class="frow"><input class="input sm" id="fq" placeholder="Buscar vínculo o institución" value="${esc(filtro.q)}" aria-label="Buscar">
      <select class="input sm" id="fc" aria-label="Compañía"><option value="">Todas las compañías</option>${S.companias.map(c => `<option value="${c.id}" ${filtro.comp === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select>
      <select class="input sm" id="ft" aria-label="Tipo de vínculo"><option value="">Todos los tipos</option>${S.tipos.map(t => `<option value="${t.id}" ${filtro.tipo === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select>
      <label class="chk"><input type="checkbox" id="finc" ${filtro.inc ? "checked" : ""}> Con datos por completar</label></div>
    </div>
    <div class="card" id="tablaMis">${filasVinculos(listaFiltrada(), { area: ME.admin || hijos(ME.area).length, vacio: "No hay vínculos con estos filtros." })}</div>
  </div>
  <aside class="stack">
    ${mailInstCardHTML(mios)}
    ${convMisHTML()}
    <div class="card"><p class="card-title">Avisos</p>${av.length ? av.map(a => `<button class="aviso ${S.leidos.includes(a.id) ? "read" : ""}" data-aviso="${a.id}" data-ir="${a.ir}"><b>${esc(a.titulo)}</b>${esc(a.texto)}</button>`).join("") : `<p class="muted small">No tienes avisos.</p>`}</div>
    ${ME.admin ? "" : `<div class="card"><p class="card-title">Otras áreas con mis instituciones</p>${otras.length ? otras.slice(0, 8).map(v => `<a class="mini-row" href="#/ficha/${v.id}"><b>${esc(contraparte(v.contraparte).corto)}</b><span>${esc(nombreArea(v.area))}: ${esc(v.nombre)}</span></a>`).join("") + (otras.length > 8 ? `<p class="muted small">y ${otras.length - 8} más</p>` : "") : `<p class="muted small">Ninguna otra área trabaja con tus instituciones.</p>`}</div>`}
  </aside></div>`;
}

function vBienvenida() {
  const listo = (S.sinVinculos || []).includes(ME.id);
  return `<div class="welcome card"><h1>Hola, ${esc(ME.nombre)}</h1>
    <p>Aquí registras los vínculos de tu área con universidades e instituciones, ves si otra área ya trabaja con ellas y publicas convocatorias para estudiantes.</p>
    <p><b>${esc(nombreArea(ME.area))}</b> todavía no tiene vínculos registrados.</p>
    <div class="welcome-acts">
      <a class="btn-accent" href="#/nuevo">Registrar mi primer vínculo</a>
      <a class="btn-outline" href="#/nueva-convocatoria">Crear una convocatoria</a>
      <a class="btn-outline" href="#/contrapartes">Ver qué hacen otras áreas</a>
    </div>
    <div class="welcome-none">${listo ? `<b>Anotado: tu área no tiene vínculos por ahora.</b> Te avisaremos si otra área registra un vínculo con una institución que te pueda interesar.` : `¿Tu área no se relaciona con universidades por ahora? <button class="link-btn" id="sinVinc">Mi área no tiene vínculos</button>`}</div>
  </div>`;
}

/* ============================ Ficha ============================ */
// Campos opcionales vacíos: "No definido" (no "por completar", que suena a error).
const kv = (k, val, html) => `<dt>${k}</dt><dd class="${val ? "" : "ph"}">${val ? (html ? val : esc(val).replace(/\n/g, "<br>")) : "No definido"}</dd>`;
function vFicha(id) {
  const v = vinculo(+id);
  if (!v) return `<div class="card empty">Ese vínculo no existe.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver</button></div>`;
  const c = contraparte(v.contraparte), ed = puedeEditar(v), comp = completitud(v), pr = progreso(v);
  const otras = S.vinculos.filter(x => x.contraparte === v.contraparte && x.area !== v.area);
  const fin = v.financiamiento, hechos = v.hitos.filter(h => h.ok).length;
  const resp = v.cuestionarios.filter(q => q.estado === "respondido" && +q.respuestas[0]);
  const satis = resp.length ? resp.reduce((s, q) => s + (+q.respuestas[0] || 0), 0) / resp.length : null;
  const crits = criteriosDe(v.tipo), cv = v.criterios || {};
  const otrosCont = contactosDe(v.contraparte).filter(k => k.nombre !== v.contacto.nombre).slice(0, 3);
  return `<div class="crumbs"><a href="#/mis">${ME.admin ? "Vínculos" : "Mis vínculos"}</a> / ${rutaArea(v.area).map(a => `<a href="#/area/${a.id}">${esc(a.nombre)}</a>`).join(" / ")} / ${esc(v.nombre)}</div>
  <div class="head-row"><div><h1>${esc(v.nombre)}</h1><p class="sub"><a href="#/contraparte/${c.id}" class="lnk">${esc(c.nombre)}</a>${v.sede ? ", " + esc(v.sede) : ""} · ${esc(tipo(v.tipo).nombre)} · ${compTag(compsDe(v))}</p></div>
    <div><div class="stepper">${CONFIG.etapas.map((e, i) => `${i ? '<i class="bar"></i>' : ""}<button class="step ${i === v.etapa ? "cur" : i < v.etapa ? "done" : ""}" data-etapa="${i}" ${ed ? "" : "disabled"} title="${esc(e + ": " + etapaAyuda(i, v.tipo))}"><span>${i < v.etapa ? "✓" : i + 1}</span>${e}</button>`).join("")}</div>
    <p class="etapa-ayuda">${CONFIG.etapas[v.etapa]}: ${esc(etapaAyuda(v.etapa, v.tipo).toLowerCase())}</p></div></div>
  ${ed ? "" : `<div class="banner">Este vínculo lo edita ${esc(nombreArea(v.area))}. Puedes verlo completo; si necesitas cambiar algo, escríbele a ${esc(v.responsable || "esa área")}.</div>`}
  <div class="statbar">
    <div><span class="lbl">Avance del plan de trabajo</span><span class="pcell">${barra(pr)}<b>${pr}%</b></span><span class="faltan">${hechos} de ${v.hitos.length} tareas hechas</span></div>
    ${comp.faltan.length ? `<div><span class="lbl">Datos por completar</span><span class="faltan" style="margin-top:0">${comp.faltan.join(", ")}</span></div>` : `<div><span class="lbl">Ficha</span><span class="faltan" style="margin-top:0">Todos los datos importantes están completos</span></div>`}
    <div class="actions">${ed ? `<button class="btn-outline" onclick="location.hash='#/editar/${v.id}'">Editar ficha</button><button class="btn-accent" onclick="abrirAsistente(${v.id},'reunion')">Actualizar con reunión</button><button class="btn-outline" onclick="abrirAsistente(${v.id},'cuestionario')">Pedir feedback</button>` : ""}<button class="btn-outline" id="dlReadme">Descargar ficha</button></div>
  </div>
  <div class="grid-main"><div class="stack">
    <div class="card"><p class="card-title">Ficha del vínculo</p><dl class="kv">
      ${kv("Objetivo", v.objetivo)}
      ${kv("Metas a las que busca aportar", metasDe(v).map(m => `<span class="tag">${esc(m)}</span>`).join(""), true)}
      ${kv("Alcance", v.alcance)}
      ${kv("Financiamiento", fin.tipo === "No definido" ? "" : fin.tipo + (fin.fuente ? " (" + fin.fuente + ")" : "") + (fin.monto ? ". Monto aproximado: " + fin.monto : ""))}
      ${kv("Fechas", v.inicio ? fechaTxt(v.inicio) + (v.termino ? " al " + fechaTxt(v.termino) : ", sin fecha de término") : "")}
      ${kv("Comentarios adicionales", v.comentarios)}</dl>
      <div class="plan"><div class="head-row"><p class="card-title" style="margin:0">Plan de trabajo</p><span class="pcell">${barra(pr)}<b>${hechos} de ${v.hitos.length}</b></span></div>
      <p class="help" style="margin:4px 0 6px">Marca las tareas a medida que se cumplen: el avance se calcula solo.</p>
      ${v.hitos.map((h, i) => `<label class="hito ${h.ok ? "ok" : ""}"><input type="checkbox" data-hito="${i}" ${h.ok ? "checked" : ""} ${ed ? "" : "disabled"}><span>${esc(h.t)}</span></label>`).join("") || `<p class="muted small">Sin tareas.</p>`}
      ${ed ? `<div class="inline-form"><input class="input" id="nuevoHito" placeholder="Agregar una tarea" aria-label="Nueva tarea"><button class="btn-outline" id="addHito">Agregar</button></div>` : ""}</div></div>
    ${convFichaHTML(v, ed)}
    <div class="card"><div class="head-row"><p class="card-title">Reuniones</p>${ed ? `<button class="link-btn" onclick="abrirAsistente(${v.id},'reunion')">+ Agregar reunión</button>` : ""}</div>
      ${v.reuniones.length ? v.reuniones.slice().reverse().map(r => `<div class="fb"><b>${fechaTxt(r.fecha)}</b> · <span class="muted">${esc(r.fuente)}</span><br>${esc(r.resumen)}</div>`).join("") : `<p class="muted small">Aún no hay reuniones registradas. Pega la transcripción o tus notas en el asistente y se agregan aquí con un resumen.</p>`}</div>
    <div class="card"><div class="head-row"><p class="card-title">Feedback de la institución</p>${ed ? `<button class="link-btn" onclick="abrirAsistente(${v.id},'cuestionario')">+ Nuevo cuestionario</button>` : ""}</div>
      <p class="help" style="margin:-4px 0 10px">El cuestionario se prepara aquí y se manda desde tu correo. Cuando la institución responda, registra sus respuestas o pega su correo.</p>
      ${v.cuestionarios.length ? v.cuestionarios.slice().reverse().map(q => cuestionarioHTML(v, q, ed)).join("") : `<p class="muted small">Aún no se ha preparado un cuestionario para la institución.</p>`}</div>
    <details class="card"><summary class="card-title sum">Historial de cambios (${v.versiones.length})</summary>
      ${v.versiones.slice().reverse().map(x => `<div class="ver"><span class="vn">v${x.v}</span><div><b>${fechaTxt(x.fecha)}</b> · <span class="muted">${esc(x.autor)}</span><br>${esc(x.resumen)}</div></div>`).join("")}</details>
  </div>
  <aside class="stack">
    <div class="card side"><p class="card-title">Con quién</p><h4><a class="lnk" href="#/contraparte/${c.id}">${esc(c.nombre)}</a></h4><p>${esc(c.tipoOrg)}${v.sede ? ", " + esc(v.sede) : ""}</p>
      <div class="person">${v.contacto.nombre || v.contacto.cargo || v.contacto.correo ? `<b>${esc(v.contacto.nombre || "Contacto")}</b>${v.contacto.cargo ? `<span>${esc(v.contacto.cargo)}</span>` : ""}${v.contacto.correo ? `<a class="mail" href="mailto:${esc(v.contacto.correo)}">${esc(v.contacto.correo)}</a>` : ""}${v.contacto.telefono ? `<a class="mail" href="tel:${esc(v.contacto.telefono.replace(/\s/g, ""))}">${esc(v.contacto.telefono)}</a>` : ""}` : `<span class="muted">Contacto no definido</span>`}</div>
      ${otrosCont.length ? `<p class="lbl2" style="margin-top:12px!important">Otros contactos registrados</p>${otrosCont.map(k => `<div class="person"><b>${esc(k.nombre)}</b><span>${esc(k.cargo)}</span>${k.correo ? `<a class="mail" href="mailto:${esc(k.correo)}">${esc(k.correo)}</a>` : ""}${k.telefono ? `<a class="mail" href="tel:${esc(k.telefono.replace(/\s/g, ""))}">${esc(k.telefono)}</a>` : ""}</div>`).join("")}` : ""}
      ${otras.length ? `<details class="note dd"><summary><b>${[...new Set(otras.map(x => x.area))].length} ${[...new Set(otras.map(x => x.area))].length === 1 ? "otra área trabaja" : "otras áreas trabajan"} con esta institución</b></summary>${otras.slice(0, 6).map(x => `<a href="#/ficha/${x.id}"><b>${esc(nombreArea(x.area))}</b>${esc(x.nombre)} · ${CONFIG.etapas[x.etapa]}${x.responsable ? `<br><span class="muted">Lo lleva: ${esc(x.responsable)}</span>` : ""}</a>`).join("")}</details>` : ""}</div>
    <div class="card side"><p class="card-title">Personas a cargo</p>
      <p class="lbl2">Líder de la iniciativa</p><h4>${esc(v.lider || "No definido")}</h4>
      <p class="lbl2">Encargado/a del día a día</p><h4>${esc(v.responsable || "No definido")}</h4><p>${rutaTxt(v.area)}</p></div>
    <div class="card side"><p class="card-title">Evaluación</p>
      <div class="calif-big"><b>${v.calif ? num1(v.calif) : "–"}</b><span>${v.calif ? "de 5, promedio de los criterios" : "Sin calificar"}</span></div>
      <p class="help" style="margin:2px 0 10px">Se califica de 1 (muy mal) a 5 (muy bien). Los criterios dependen del tipo de vínculo.</p>
      ${crits.map((k, j) => `<p class="lbl2">${esc(k)}</p><div class="rate ${ed ? "" : "locked"}">${[1, 2, 3, 4, 5].map(i => `<button data-crit="${j}" data-rate="${i}" class="${cv[k] && i <= cv[k] ? "on" : ""}" aria-label="${esc(k)}: ${i} de 5" ${ed ? "" : "disabled"}>${i}</button>`).join("")}</div>`).join("")}
      <p class="lbl2">¿Ayudó a cumplir sus metas?</p>
      <div class="seg">${["si", "parcial", "no"].map(a => `<button data-aporta="${a}" class="${v.aporta === a ? "on" : ""}" ${ed ? "" : "disabled"}>${ACORTAR[a]}</button>`).join("")}</div>
      ${satis ? `<p class="small" style="margin-top:12px">La institución nos califica con <b>${num1(satis)} de 5</b> (${resp.length} ${resp.length === 1 ? "cuestionario" : "cuestionarios"})</p>` : ""}
    </div>
  </aside></div>`;
}
function cuestionarioHTML(v, q, ed) {
  if (q.estado === "respondido") return `<details class="cq"><summary><b>${fechaTxt(q.fecha)}</b> <span class="pill p2">Respondido</span></summary>${q.preguntas.map((p, i) => q.respuestas[i] ? `<div class="qa"><span>${esc(p)}</span><b>${esc(q.respuestas[i])}</b></div>` : "").join("")}${q.comentario ? `<div class="fb" style="margin-top:8px"><b>Respuesta o comentario</b><br>${esc(q.comentario).replace(/\n/g, "<br>")}</div>` : ""}</details>`;
  const preparado = q.estado === "preparado";
  return `<div class="cq"><div class="head-row"><span><b>${fechaTxt(q.fecha)}</b> <span class="pill ${preparado ? "p0" : "p1"}">${preparado ? "Preparado, falta confirmar el envío" : "Enviado, esperando respuesta"}</span></span>
    ${ed ? `<span class="cq-acts">${preparado ? `<button class="link-btn" data-enviado="${q.id}">Ya lo envié</button>` : ""}<button class="link-btn" data-registrar="${q.id}">Registrar respuestas</button></span>` : ""}</div>
    ${preparado ? `<p class="help">Se abrió tu correo con el texto listo. La página no puede saber si lo mandaste: confírmalo con "Ya lo envié".</p>` : ""}
    <div id="reg-${q.id}" hidden>
      <label class="f" for="com-${q.id}">Pega aquí la respuesta del correo o un comentario general</label><textarea class="input" id="com-${q.id}" rows="3" placeholder="Ej.: Respondieron que la charla fue muy útil y piden repetirla en marzo."></textarea>
      <details class="more"><summary>Registrar pregunta por pregunta (opcional)</summary>
      ${q.preguntas.map((p, i) => { const base = PREGUNTAS_BASE.find(b => b.texto === p); const campo = base && base.tipo === "escala" ? `<select class="input" data-resp="${i}"><option></option>${[1, 2, 3, 4, 5].map(n => `<option>${n}</option>`).join("")}</select>` : base && base.tipo === "opciones" ? `<select class="input" data-resp="${i}"><option></option>${base.opciones.map(o => `<option>${o}</option>`).join("")}</select>` : `<input class="input" data-resp="${i}">`; return `<label class="f">${esc(p)}</label>${campo}`; }).join("")}</details>
    <div class="form-actions"><button class="btn-accent" data-guardar-resp="${q.id}">Guardar respuestas</button></div></div></div>`;
}

/* ============================ Plantilla (crear / editar) ============================ */
function opcionesArea(sel) {
  const permit = areasPermitidas().map(a => a.id);
  const opt = (a, nivel) => (permit.includes(a.id) ? `<option value="${a.id}" ${sel === a.id ? "selected" : ""}>${"\u00a0\u00a0\u00a0".repeat(nivel)}${esc(a.nombre)}</option>` : "") + hijos(a.id).map(h => opt(h, nivel + 1)).join("");
  return S.areas.filter(a => !a.parent).map(vp => opt(vp, 0)).join("");
}
let preCp = "";
const opcionesEtapa = (tipoId, sel) => CONFIG.etapas.map((e, i) => `<option value="${i}" ${sel === i ? "selected" : ""}>${e}: ${esc(etapaAyuda(i, tipoId).toLowerCase())}</option>`).join("");
const planFila = (h, i) => `<div class="plan-row"><input type="checkbox" ${h.ok ? "checked" : ""} aria-label="Hecha"><input class="input" value="${esc(h.t)}" aria-label="Tarea ${i + 1}"><button type="button" class="link-btn danger" data-quitar-tarea aria-label="Quitar tarea">Quitar</button></div>`;
function vForm(id, tipoPre) {
  const v = id ? vinculo(+id) : null;
  if (v && !puedeEditar(v)) return `<div class="card empty">Este vínculo lo edita ${esc(nombreArea(v.area))}. Si necesitas cambiar algo, escríbele a ${esc(v.responsable || "esa área")}.</div>`;
  if (!v && !puedeCrear()) return `<div class="card empty">Tu perfil puede revisar los vínculos, pero no registrarlos.</div>`;
  const tPre = S.tipos.find(t => t.id === tipoPre);
  const d = v || { nombre: "", tipo: tPre ? tPre.id : "", companias: ME.compania ? [ME.compania] : [], area: ME.admin ? "" : ME.area, etapa: 0, contraparte: preCp, sede: "", contacto: { nombre: "", cargo: "", correo: "" }, lider: "", responsable: ME.admin ? "" : ME.nombre, objetivo: "", metas: [], alcance: "", financiamiento: { tipo: "No definido", monto: "", fuente: "" }, inicio: "", termino: "", hitos: tPre ? tPre.hitos.map(t => ({ t, ok: false })) : [], comentarios: "" };
  preCp = "";
  const comps = compsDe(d), metas = metasDe(d);
  const metasOpc = [...new Set([...metasActivas(), ...metas])];
  const sec = (n, t, sub) => `<div class="sec-h"><span>${n}</span><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ""}</div></div>`;
  return `<div class="crumbs"><a href="#/mis">${ME.admin ? "Vínculos" : "Mis vínculos"}</a> / ${v ? `<a href="#/ficha/${v.id}">${esc(v.nombre)}</a> / Editar ficha` : "Añadir vínculo"}</div>
  <h1>${v ? "Editar ficha" : tPre ? "Añadir: " + esc(tPre.nombre) : "Añadir vínculo"}</h1>${v ? `<p class="sub">Los cambios quedan como una nueva versión en el historial.</p>` : ""}
  <div class="grid-main form-grid-main"><div class="stack form-sections">
    ${v ? "" : `<details class="card ai-card"><summary><span>Completar desde un correo o notas</span><span class="ai-tag" data-ai-tag>${AI.etiqueta()}</span></summary>
      <p class="small muted" style="margin:0 0 8px">Pega un correo, notas o la descripción del vínculo y el asistente llena la plantilla. Revisa y corrige antes de guardar.</p>
      <textarea class="input" id="aiTxt" rows="3" placeholder="Ej.: Hoy hablé con María Soto, coordinadora de prácticas de la UCN (msoto@ucn.ejemplo.cl). Quieren hacer una charla de prácticas en marzo para estudiantes de Minas…"></textarea>
      <div class="form-actions"><button class="btn-outline" id="aiFill">Completar plantilla</button><span class="small muted" id="aiEstado"></span></div></details>`}
    <div class="card">
      ${sec(1, "Lo básico")}
      <div class="g2"><div class="full"><label class="f" for="fNombre">Nombre del vínculo *</label><input class="input" id="fNombre" value="${esc(d.nombre)}" placeholder="Ej.: Charla de prácticas y memorias 2027"><div class="err" id="eNombre">Escribe un nombre para reconocer el vínculo.</div></div>
      <div><label class="f" for="fTipo">Tipo de vínculo *</label><select class="input" id="fTipo"><option value="">Elige un tipo</option>${S.tipos.map(t => `<option value="${t.id}" ${d.tipo === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select><div class="err" id="eTipo">Elige el tipo de vínculo.</div></div>
      <div><label class="f" for="fArea">Área responsable *</label><select class="input" id="fArea"><option value="">Elige un área</option>${opcionesArea(d.area)}</select><div class="err" id="eArea">Elige el área responsable.</div></div>
      <div class="full"><label class="f" for="fEtapa">Etapa</label><select class="input" id="fEtapa">${opcionesEtapa(d.tipo, d.etapa)}</select><p class="help">Cada etapa se explica según el tipo de vínculo. Puedes cambiarla después desde la ficha.</p></div>
      <div class="full"><span class="f">Compañía</span><div class="checks" id="fComps" role="group" aria-label="Compañías">
        <label class="chk-pill todas"><input type="checkbox" id="fCompTodas" ${comps.length === S.companias.length ? "checked" : ""}> Todas</label>
        ${S.companias.map(c => `<label class="chk-pill"><input type="checkbox" value="${c.id}" ${comps.includes(c.id) ? "checked" : ""}><i style="background:${c.color}"></i>${esc(c.nombre)}</label>`).join("")}</div>
        <p class="help">Marca todas las que participan. Si es para todo el grupo, marca "Todas".</p></div></div>
      <div id="secConQuien">${sec(2, "Con quién", "La institución y la persona con quien hablas")}</div>
      <div class="g2"><div><label class="f" for="fCp">Institución *</label><select class="input" id="fCp"><option value="">Elige una institución</option>${S.contrapartes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(c => `<option value="${c.id}" ${d.contraparte === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}<option value="__nueva">+ Otra institución…</option></select><div class="err" id="eCp">Elige o agrega la institución.</div></div>
      <div><label class="f" for="fSede">Sede o ciudad</label><input class="input" id="fSede" value="${esc(d.sede)}" placeholder="Ej.: Antofagasta"></div></div>
      <div id="contBox" class="cont-box"></div>
      <div class="g2"><div class="full nueva-cp" id="nuevaCp" hidden><div class="g2"><div><label class="f" for="fCpNom">Nombre de la institución</label><input class="input" id="fCpNom"></div><div><label class="f" for="fCpTipo">Tipo de organización</label><select class="input" id="fCpTipo">${S.tiposOrg.map(t => `<option>${esc(t)}</option>`).join("")}</select></div></div></div>
      <div><label class="f" for="fCNom">Nombre del contacto</label><input class="input" id="fCNom" value="${esc(d.contacto.nombre)}" placeholder="Escribe o elige uno registrado" list="contList" autocomplete="off"><datalist id="contList"></datalist></div>
      <div><label class="f" for="fCCar">Cargo o unidad</label><input class="input" id="fCCar" value="${esc(d.contacto.cargo)}" placeholder="Ej.: Coordinación de prácticas"></div>
      <div><label class="f" for="fCCor">Correo del contacto</label><input class="input" id="fCCor" type="email" value="${esc(d.contacto.correo)}" placeholder="nombre@institucion.cl"></div>
      <div><label class="f" for="fCTel">Teléfono (opcional)</label><input class="input" id="fCTel" type="tel" value="${esc(d.contacto.telefono || "")}" placeholder="+56 9 1234 5678"></div></div>
      ${sec(3, "Personas a cargo", "Quién impulsa el vínculo y quién lo coordina")}
      <div class="g2"><div><label class="f" for="fLider">Líder de la iniciativa</label><input class="input" id="fLider" value="${esc(d.lider || "")}" placeholder="Ej.: jefatura que lo impulsa"><p class="help">Quien decide y responde por el vínculo.</p></div>
      <div><label class="f" for="fResp">Encargado/a del día a día</label><input class="input" id="fResp" value="${esc(d.responsable)}" placeholder="Nombre de quien coordina"><p class="help">Quien habla con la institución y actualiza la ficha.</p></div></div>
      ${sec(4, "Para qué", "Lo más importante")}
      <label class="f" for="fObj">Objetivo: qué se va a hacer</label><textarea class="input" id="fObj" rows="2" placeholder="Ej.: Realizar una charla para presentar prácticas, memorias y el programa JP.">${esc(d.objetivo)}</textarea>
      <span class="f">Metas a las que busca aportar</span><div class="checks" id="fMetas" role="group" aria-label="Metas">${metasOpc.map(m => `<label class="chk-pill"><input type="checkbox" value="${esc(m)}" ${metas.includes(m) ? "checked" : ""}>${esc(m)}</label>`).join("")}</div>
      <p class="help">Puedes marcar varias. Las metas las define la jefatura.</p>
      <details class="more" ${v ? "open" : ""}><summary>Más detalles (opcional): alcance, financiamiento, fechas y plan de trabajo</summary>
      <label class="f" for="fAlc">Alcance</label><textarea class="input" id="fAlc" rows="2" placeholder="Ej.: Estudiantes de 4.º y 5.º año, una charla presencial y difusión por correo.">${esc(d.alcance)}</textarea>
      ${sec(5, "Recursos y plazos")}
      <div class="g2"><div><label class="f" for="fFinT">¿Quién lo financia?</label><select class="input" id="fFinT">${[...new Set([...CONFIG.financiamientos, d.financiamiento.tipo])].map(f => `<option ${d.financiamiento.tipo === f ? "selected" : ""}>${esc(f)}</option>`).join("")}</select></div>
      <div><label class="f" for="fFinM">Monto aproximado (opcional)</label><input class="input" id="fFinM" value="${esc(d.financiamiento.monto)}" placeholder="Ej.: $2.000.000"></div>
      <div class="full" id="finFuenteBox"><label class="f" for="fFinF" id="fFinFLbl">Presupuesto del área: partida o centro de costo</label><input class="input" id="fFinF" value="${esc(d.financiamiento.fuente)}" placeholder="Ej.: Presupuesto 2027 de Reclutamiento y selección"></div>
      <div><label class="f" for="fIni">Fecha de inicio</label><input class="input" id="fIni" type="date" value="${esc(d.inicio)}"></div>
      <div><label class="f" for="fTer">Fecha de término</label><input class="input" id="fTer" type="date" value="${esc(d.termino)}"></div></div>
      ${sec(6, "Plan de trabajo", "Lista de tareas. Al marcarlas en la ficha se calcula el avance")}
      <div id="planBox" ${v ? "" : 'data-auto="1"'}>${d.hitos.map(planFila).join("")}</div>
      <div class="inline-form"><input class="input" id="fNuevaTarea" placeholder="Agregar una tarea" aria-label="Nueva tarea"><button type="button" class="btn-outline" id="fAddTarea">Agregar</button></div>
      <label class="f" for="fCom">Comentarios adicionales</label><textarea class="input" id="fCom" rows="2" placeholder="Lo que pide la institución, acuerdos o cualquier otra nota">${esc(d.comentarios || "")}</textarea>
      </details>
      <div class="form-actions"><button class="btn-accent" id="guardar">${v ? "Guardar cambios" : "Crear vínculo"}</button><button class="btn-outline" onclick="history.length > 1 ? history.back() : location.hash='#/mis'">Cancelar</button></div>
    </div>
  </div>
  <aside class="form-aside" id="formAside">
    <div class="card"><p class="card-title">Datos importantes</p><div id="compBox"></div></div>
    <div id="dupAside"></div>
  </aside></div>`;
}
function leerForm(base) {
  const val = id => ($("#" + id) || {}).value || "";
  const hitos = $$("#planBox .plan-row").map(r => ({ t: r.querySelector(".input").value.trim(), ok: r.querySelector("input[type=checkbox]").checked })).filter(h => h.t);
  return {
    nombre: val("fNombre").trim(), tipo: val("fTipo"), area: val("fArea"), companias: $$("#fComps input[value]:checked").map(i => i.value), etapa: +val("fEtapa"), contraparte: val("fCp"), sede: val("fSede").trim(),
    contacto: { nombre: val("fCNom").trim(), cargo: val("fCCar").trim(), correo: val("fCCor").trim(), telefono: val("fCTel").trim() }, lider: val("fLider").trim(), responsable: val("fResp").trim(),
    objetivo: val("fObj").trim(), metas: $$("#fMetas input:checked").map(i => i.value), alcance: val("fAlc").trim(),
    financiamiento: { tipo: val("fFinT"), monto: val("fFinM").trim(), fuente: ["Presupuesto del área", "Mixto", "Fondo externo (CORFO, ANID u otro)"].includes(val("fFinT")) ? val("fFinF").trim() : "" }, inicio: val("fIni"), termino: val("fTer"),
    hitos, comentarios: val("fCom").trim()
  };
}
function dupAsideHTML(cp, areaId, propioId) {
  if (!cp || cp === "__nueva") return "";
  const vs = S.vinculos.filter(v => v.contraparte === cp && v.id !== propioId);
  const c = contraparte(cp);
  if (!vs.length) return "";
  const as = [...new Set(vs.map(v => v.area))];
  const filaDup = v => `<div class="it"><b class="it-t">${esc(nombreArea(v.area))}${v.area === areaId ? " (esta área)" : ""}</b><p class="it-sub">${esc(v.nombre)}</p><p class="it-meta">${esc(CONFIG.etapas[v.etapa])}</p>${v.id ? `<a class="panel-link" href="#/ficha/${v.id}" target="_blank" rel="noopener">Ver ficha</a>` : ""}</div>`;
  return `<details class="panel-warn-light dd" open id="dupCard"><summary><span class="k">Ya hay contacto con esta institución</span><b>${as.length} ${as.length > 1 ? "áreas trabajan" : "área trabaja"} con ${esc(c.corto)}</b><span class="o">Ver detalle</span></summary>
    ${vs.slice(0, 5).map(filaDup).join("")}
    ${vs.length > 5 ? `<p class="help inner">y ${vs.length - 5} vínculos más.</p>` : ""}
    <p class="help inner">Conviene hablar con estas áreas antes de escribirle a la institución. Puedes crear el vínculo igual.</p>
    <button type="button" class="link-btn sm dup-ocultar" id="dupCerrar">Ocultar aviso</button></details>`;
}
function dupAsideReabrirHTML(cp) {
  const c = contraparte(cp);
  return `<button type="button" class="aviso-pill" id="dupReabrir">Mostrar aviso · otras áreas en ${esc(c.corto)}</button>`;
}
function textoCorreoInst(v, extra) {
  const c = contraparte(v.contraparte);
  const sal = v.contacto.nombre ? `Hola ${v.contacto.nombre},` : "Hola,";
  const cuerpo = extra || "[Escribe aquí tu mensaje: coordinación, fechas, próximos pasos…]";
  return `${sal}\n\nEscribo desde ${nombreArea(v.area)} de Antofagasta Minerals respecto del vínculo «${v.nombre}» (${tipo(v.tipo).nombre}) con ${c.nombre}.\n\n${cuerpo}\n\nSaludos cordiales,\n${ME.nombre}\n${ME.correo || "Antofagasta Minerals"}`;
}
function abrirCorreoInst(v, extra) {
  const to = (v.contacto.correo || "").trim();
  if (!to) { toast("Agrega el correo del contacto en la ficha del vínculo."); location.hash = "#/editar/" + v.id; return; }
  const a = document.createElement("a");
  a.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(v.nombre + " · Antofagasta Minerals")}&body=${encodeURIComponent(textoCorreoInst(v, extra))}`;
  a.target = "_blank"; document.body.appendChild(a); a.click(); a.remove();
  toast("Se abrió tu correo con el texto listo. Tú envías el mensaje.");
}
function mailInstCardHTML(mios) {
  if (!puedeCrear() || !mios.length) return "";
  const edit = mios.filter(puedeEditar);
  if (!edit.length) return "";
  return `<div class="card"><p class="card-title">Correo a la institución</p>
    <label class="f" for="mailSel">Vínculo</label>
    <select class="input" id="mailSel">${edit.map(v => `<option value="${v.id}">${esc(v.nombre)} · ${esc(contraparte(v.contraparte).corto)}</option>`).join("")}</select>
    <label class="f" for="mailMsg">Mensaje</label>
    <textarea class="input" id="mailMsg" rows="4" placeholder="Ej.: Queríamos coordinar la fecha de la charla y confirmar cupos…"></textarea>
    <button type="button" class="btn-accent wide" id="mailGo">Abrir en mi correo</button>
    <p class="help">Abre Outlook o tu cliente de correo con el destinatario y el texto listos (como el cuestionario de feedback).</p></div>`;
}

/* ============================ Áreas ============================ */
function vAreas() {
  return `<h1>Áreas</h1><p class="sub">Vicepresidencias, gerencias y subáreas que gestionan vínculos.${ME.admin ? ` <a class="lnk" href="#/admin/areas">Administrar áreas</a>` : ""}</p>
  <div class="cards2">${S.areas.filter(a => !a.parent).map(vp => {
    const n = S.vinculos.filter(v => descendientes(vp.id).includes(v.area)).length;
    const fila = (a, nivel) => { const k = S.vinculos.filter(v => descendientes(a.id).includes(v.area)).length; return `<a class="tree-row l${nivel}" href="#/area/${a.id}"><span>${esc(a.nombre)}${a.id === ME.area ? ' <span class="mine">Mi área</span>' : ""}</span><b>${k}</b></a>` + hijos(a.id).map(h => fila(h, nivel + 1)).join(""); };
    return `<div class="card"><div class="head-row"><h3 class="h3"><a class="lnk" href="#/area/${vp.id}">${esc(vp.nombre)}</a></h3><span class="cnt">${n} vínculos</span></div>${hijos(vp.id).map(h => fila(h, 0)).join("") || `<p class="muted small">Sin gerencias.</p>`}</div>`;
  }).join("")}</div>`;
}
function vArea(id) {
  const a = area(id); if (!a) return vAreas();
  const ids = descendientes(id), list = S.vinculos.filter(v => ids.includes(v.area));
  const cps = [...new Set(list.map(v => v.contraparte))], p = promedio(list);
  return `<div class="crumbs"><a href="#/areas">Áreas</a> / ${rutaArea(id).map(x => x.id === id ? esc(x.nombre) : `<a href="#/area/${x.id}">${esc(x.nombre)}</a>`).join(" / ")}</div>
  <h1>${esc(a.nombre)}</h1><p class="sub">${list.length} vínculos con ${cps.length} instituciones · Calificación promedio ${num1(p)} de 5</p>
  ${hijos(id).length ? `<div class="chips">${hijos(id).map(h => `<a class="chip-btn" href="#/area/${h.id}">${esc(h.nombre)} (${S.vinculos.filter(v => descendientes(h.id).includes(v.area)).length})</a>`).join("")}</div>` : ""}
  <div class="card">${filasVinculos(list, { area: hijos(id).length > 0 })}</div>`;
}

/* ============================ Contrapartes ============================ */
let cpq = "", cpTipoV = "", cpZona = "";
function vContrapartes(tipoSel) {
  tipoSel = tipoSel ? decodeURIComponent(tipoSel) : "";
  const tipos = S.tiposOrg.filter(t => S.contrapartes.some(c => c.tipoOrg === t));
  return `<h1>Instituciones</h1><p class="sub">Cada institución, las áreas que trabajan con ella y cómo han resultado esos vínculos.</p>
  <div class="filters"><div class="chips"><a class="chip-btn ${tipoSel ? "" : "on"}" href="#/contrapartes">Todas (${S.contrapartes.length})</a>${tipos.map(t => `<a class="chip-btn ${tipoSel === t ? "on" : ""}" href="#/contrapartes/${encodeURIComponent(t)}">${esc(t)} (${S.contrapartes.filter(c => c.tipoOrg === t).length})</a>`).join("")}</div>
  <div class="frow"><input class="input sm" id="cpq" placeholder="Buscar institución" value="${esc(cpq)}" aria-label="Buscar institución"><select class="input sm" id="cpZona" aria-label="Filtrar por zona"><option value="">Todas las zonas</option>${CONFIG.zonas.map(z => `<option ${cpZona === z ? "selected" : ""}>${z}</option>`).join("")}</select><select class="input sm" id="cpTipoV" aria-label="Filtrar por tipo de vínculo"><option value="">Todos los tipos de vínculo</option>${S.tipos.map(t => `<option value="${t.id}" ${cpTipoV === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></div></div>
  <p class="small muted" id="cpRes"></p>
  <div class="cards2" id="cpGrid" data-tipo="${esc(tipoSel)}">${cpCards(tipoSel)}</div>`;
}
function cpCards(tipoSel) {
  const q = cpq.toLowerCase();
  const cs = S.contrapartes.filter(c => (!tipoSel || c.tipoOrg === tipoSel) && (!cpZona || c.zona === cpZona) && (!q || (c.nombre + " " + c.corto + " " + (c.locacion || "")).toLowerCase().includes(q)))
    .map(c => ({ c, vs: S.vinculos.filter(v => v.contraparte === c.id && (!cpTipoV || v.tipo === cpTipoV)) })).filter(x => !cpTipoV || x.vs.length).sort((a, b) => b.vs.length - a.vs.length);
  setTimeout(() => { const r = $("#cpRes"); if (r) r.textContent = [cpZona ? `${cs.length} ${cs.length === 1 ? "institución" : "instituciones"} en la zona ${cpZona}.` : "", cpTipoV ? `Con vínculos de tipo "${tipo(cpTipoV).nombre}"; se muestran solo las áreas que los llevan.` : ""].filter(Boolean).join(" "); }, 0);
  if (!cs.length) return `<div class="empty">No hay instituciones con ese filtro.</div>`;
  return cs.map(({ c, vs }) => { const as = [...new Set(vs.map(v => v.area))]; return `<a class="ecard" href="#/contraparte/${c.id}"><div class="h"><h3>${esc(c.nombre)}</h3>${as.length > 1 ? `<span class="cnt">${as.length} áreas</span>` : ""}</div>
    <div class="who">${esc(c.tipoOrg)}${c.locacion ? ", " + esc(c.locacion) : ""}${c.zona ? ` · <span class="zona">Zona ${esc(c.zona)}</span>` : ""}</div><hr><div class="lbl">Áreas que trabajan con ella</div>${as.map(a => `<span class="tag">${esc(nombreArea(a))}</span>`).join("") || '<span class="muted small">Ninguna aún</span>'}
    <div class="n">${vs.length} ${vs.length === 1 ? "vínculo" : "vínculos"} · ${dots(promedio(vs))}</div></a>`; }).join("");
}
function vContraparte(id) {
  const c = S.contrapartes.find(x => x.id === id); if (!c) return vContrapartes();
  const vs = S.vinculos.filter(v => v.contraparte === id), as = [...new Set(vs.map(v => v.area))];
  const cal = vs.filter(v => v.aporta), si = cal.filter(v => v.aporta === "si").length;
  return `<div class="crumbs"><a href="#/contrapartes">Instituciones</a> / ${esc(c.corto)}</div>
  <div class="head-row"><div><h1>${esc(c.nombre)}</h1><p class="sub">${esc(c.tipoOrg)}${c.locacion ? ", " + esc(c.locacion) : ""}${c.zona ? " · Zona " + esc(c.zona) : ""}</p></div>${puedeCrear() ? `<button class="btn-accent" id="nuevoCon" data-cp="${c.id}">+ Añadir vínculo con esta institución</button>` : ""}</div>
  <div class="grid-main"><div class="card">${filasVinculos(vs, { area: true })}</div>
  <aside class="stack"><div class="card side"><p class="card-title">Resumen</p><p style="color:var(--ink)"><b>${as.length}</b> ${as.length === 1 ? "área" : "áreas"} en contacto</p><p>Calificación promedio: <b style="color:var(--ink)">${num1(promedio(vs))}</b> de 5</p><p>${cal.length ? `Ayudó a la meta en ${si} de ${cal.length} vínculos evaluados` : "Sin vínculos evaluados"}</p><p>${S.estudiantes.filter(e => e.contraparte === id).length} estudiantes en práctica o memoria hoy</p>
    <div style="margin-top:10px">${as.map(a => `<a class="tag" href="#/area/${a}">${esc(nombreArea(a))}</a>`).join("")}</div></div>
    ${(c.contactos || []).length ? `<div class="card side"><p class="card-title">Contactos registrados</p>${c.contactos.map(k => `<div class="person"><b>${esc(k.nombre)}</b><span>${esc(k.cargo)}</span>${k.correo ? `<a class="mail" href="mailto:${esc(k.correo)}">${esc(k.correo)}</a>` : ""}${k.telefono ? `<a class="mail" href="tel:${esc(k.telefono.replace(/\s/g, ""))}">${esc(k.telefono)}</a>` : ""}</div>`).join("")}</div>` : ""}
    ${as.length > 1 ? `<div class="note"><b>Oportunidad de coordinación</b>Varias áreas trabajan con esta institución. Conviene acordar quién lleva cada tema para no duplicar contactos.</div>` : ""}</aside></div>`;
}

/* ============================ Dashboard ============================ */
let dashVP = "", dashComp = "";
const PALETA = ["#0A3A46", "#186170", "#C89900", "#5B9AA6", "#AD1900", "#156451", "#8A7F7A", "#B8D3D8"];
function barras(rows, max, extra = true) {
  return rows.map(r => `<div class="brow ${extra ? "" : "short"}"><span class="nm">${esc(r.n)}</span><span class="track"><i style="width:${max ? r.v / max * 100 : 0}%"></i></span><span class="v">${r.v}</span>${extra ? `<span class="s">${r.s || ""}</span>` : ""}</div>`).join("");
}
// Gráfico de torta (anillo) con su leyenda. Cada fila: { n, v, color? }.
function torta(rows, titulo) {
  rows = rows.filter(r => r.v);
  const tot = rows.reduce((a, r) => a + r.v, 0);
  if (!tot) return `<p class="muted small">Sin datos con este filtro.</p>`;
  let ang = 0;
  const R = 52, C = 2 * Math.PI * R;
  const arcos = rows.map((r, i) => { const largo = r.v / tot * C, el = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${r.color || PALETA[i % PALETA.length]}" stroke-width="26" stroke-dasharray="${largo} ${C - largo}" stroke-dashoffset="${-ang}"><title>${esc(r.n)}: ${r.v}</title></circle>`; ang += largo; return el; }).join("");
  return `<div class="torta"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(titulo)}: ${rows.map(r => esc(r.n) + " " + r.v).join(", ")}"><g transform="rotate(-90 70 70)">${arcos}</g><text x="70" y="66" text-anchor="middle" class="t-num">${tot}</text><text x="70" y="84" text-anchor="middle" class="t-lbl">total</text></svg>
    <ul class="leyenda">${rows.map((r, i) => `<li><i style="background:${r.color || PALETA[i % PALETA.length]}"></i><span>${esc(r.n)}</span><b>${r.v}</b><small>${Math.round(r.v / tot * 100)}%</small></li>`).join("")}</ul></div>`;
}
// Barras de calificación promedio (escala de 1 a 5).
function barrasNota(rows) {
  return rows.map(r => `<div class="brow nota"><span class="nm">${esc(r.n)}</span><span class="track"><i style="width:${r.p ? r.p / 5 * 100 : 0}%"></i></span><span class="v">${r.p ? num1(r.p) : "–"}</span><span class="s">${r.s || ""}</span></div>`).join("");
}
function vDashboard() {
  const vps = S.areas.filter(a => !a.parent);
  const jef = ME.rol === "jefatura", raiz = jef ? ME.area : dashVP;
  const base = S.vinculos.filter(v => (!raiz || descendientes(raiz).includes(v.area)) && (!dashComp || compsDe(v).includes(dashComp)));
  const est = S.estudiantes.filter(e => (!raiz || descendientes(raiz).includes(e.area)) && (!dashComp || e.compania === dashComp));
  const porMeta = S.metas.map(m => { const l = base.filter(v => metasDe(v).includes(m.nombre)); return { n: m.nombre + (m.activa ? "" : " (desactivada)"), v: l.length, s: l.some(v => v.calif) ? "Prom. " + num1(promedio(l)) : "" }; }).filter(r => r.v).sort((a, b) => b.v - a.v);
  const porComp = S.companias.map(c => ({ n: c.nombre, v: base.filter(v => compsDe(v).includes(c.id)).length, color: c.color }));
  const notaProm = l => { const n = l.filter(e => e.nota != null); return n.length ? n.reduce((a, e) => a + e.nota, 0) / n.length : null; };
  const estTipo = [...new Set(est.map(e => e.tipo))].map(t => ({ n: t, v: est.filter(e => e.tipo === t).length }));
  const estUni = [...new Set(est.map(e => e.contraparte))].map(id => { const l = est.filter(e => e.contraparte === id); return { id, n: l.length, p: notaProm(l) }; }).sort((a, b) => b.n - a.n);
  const cal = base.filter(v => v.calif), ev = base.filter(v => v.aporta);
  const pctSi = ev.length ? Math.round(ev.filter(v => v.aporta === "si").length / ev.length * 100) : null;
  const cps = [...new Set(base.map(v => v.contraparte))];
  const activos = base.filter(v => v.etapa < 3).length;
  const porTipo = S.tipos.map(t => { const l = base.filter(v => v.tipo === t.id), e = l.filter(v => v.aporta); return { t, n: l.length, nc: l.filter(v => v.calif).length, p: promedio(l), si: e.filter(v => v.aporta === "si").length, pa: e.filter(v => v.aporta === "parcial").length, no: e.filter(v => v.aporta === "no").length }; })
    .filter(r => r.n).sort((a, b) => (b.p || 0) - (a.p || 0) || b.n - a.n);
  const topCp = cps.map(id => { const l = base.filter(v => v.contraparte === id); return { id, p: promedio(l), nc: l.filter(v => v.calif).length, n: l.length }; }).filter(r => r.p).sort((a, b) => b.p - a.p || b.nc - a.nc).slice(0, 6);
  const compartidas = cps.map(id => ({ id, as: [...new Set(base.filter(v => v.contraparte === id).map(v => v.area))] })).filter(r => r.as.length > 1).sort((a, b) => b.as.length - a.as.length);
  const hojas = S.areas.filter(a => base.some(v => v.area === a.id)).map(a => ({ n: a.nombre, v: base.filter(v => v.area === a.id).length, s: "Prom. " + num1(promedio(base.filter(v => v.area === a.id))) })).sort((a, b) => b.v - a.v);
  const porEtapa = CONFIG.etapas.map((e, i) => ({ n: e, v: base.filter(v => v.etapa === i).length }));
  const porOrg = S.tiposOrg.map(t => ({ n: t, v: base.filter(v => contraparte(v.contraparte).tipoOrg === t).length })).sort((a, b) => b.v - a.v);
  const porZona = CONFIG.zonas.map(z => ({ n: z, v: cps.filter(id => contraparte(id).zona === z).length }));
  const porFin = [...new Set(base.map(v => v.financiamiento.tipo))].map(f => ({ n: f, v: base.filter(v => v.financiamiento.tipo === f).length })).sort((a, b) => b.v - a.v);
  const resp = base.flatMap(v => v.cuestionarios.filter(q => q.estado === "respondido" && +q.respuestas[0]));
  const mx = (rows) => Math.max(1, ...rows.map(r => r.v));
  const mejor = porTipo.find(r => r.p);
  const frases = [
    `Hay <b>${base.length} vínculos</b> con <b>${cps.length} instituciones</b>; <b>${activos}</b> siguen activos.`,
    mejor ? `El tipo de vínculo mejor evaluado es <b>${esc(mejor.t.nombre)}</b> (${num1(mejor.p)} de 5, con ${mejor.nc} ${mejor.nc === 1 ? "vínculo calificado" : "vínculos calificados"}).` : "",
    pctSi != null ? `De los vínculos evaluados, <b>${pctSi}%</b> ayudó a cumplir sus metas.` : "",
    compartidas.length ? `<b>${compartidas.length} ${compartidas.length === 1 ? "institución trabaja" : "instituciones trabajan"}</b> con más de un área: conviene coordinarse.` : ""
  ].filter(Boolean);
  const sec = (titulo, sub, cuerpo, abierta = true) => `<details class="dash-sec" ${abierta ? "open" : ""}><summary><span><b>${titulo}</b><small>${sub}</small></span></summary><div class="dash-body">${cuerpo}</div></details>`;
  return `<div class="head-row"><div><h1>Estadísticas</h1><p class="sub">${jef ? "Resultados de " + esc(nombreArea(ME.area)) + "." : "Cuántos vínculos hay, cómo van y cuáles sirven más."}</p></div>
    <div class="frow">${jef ? "" : `<select class="input sm" id="dashVP" style="width:auto" aria-label="Vicepresidencia"><option value="">Todas las vicepresidencias</option>${vps.map(a => `<option value="${a.id}" ${dashVP === a.id ? "selected" : ""}>${esc(a.nombre)}</option>`).join("")}</select>`}
    <select class="input sm" id="dashComp" style="width:auto" aria-label="Compañía"><option value="">Todas las compañías</option>${S.companias.map(c => `<option value="${c.id}" ${dashComp === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></div></div>
  <div class="card resumen-txt"><p class="card-title">En resumen</p><ul>${frases.map(f => `<li>${f}</li>`).join("")}</ul><p class="help">Los datos vienen del mapeo de instituciones; las calificaciones son de ejemplo.</p></div>
  <div class="kpis k4">
    <div class="kpi"><b>${base.length}</b><span>vínculos registrados</span></div>
    <div class="kpi"><b>${activos}</b><span>activos (no cerrados)</span></div>
    <div class="kpi"><b>${cps.length}</b><span>instituciones</span></div>
    <div class="kpi"><b>${num1(promedio(base))}<small> de 5</small></b><span>calificación promedio de ${cal.length} vínculos</span>
      <details class="como"><summary>¿Cómo se calcula?</summary><p>Cada área califica sus vínculos de 1 a 5 en tres criterios que dependen del tipo. Por ejemplo, en prácticas y memorias: calidad de las y los estudiantes, rapidez de respuesta de la institución y calidad del trabajo. La nota del vínculo es el promedio de sus criterios, y este número es el promedio de todos los vínculos calificados.</p></details></div>
  </div>
  ${sec("¿Qué funciona mejor?", "Calificación promedio (de 1 a 5) y si ayudó a cumplir las metas", `<div class="bars2">
    <div class="card"><p class="card-title">Calificación por tipo de vínculo</p>${barrasNota(porTipo.map(r => ({ n: r.t.nombre, p: r.p, s: r.nc ? r.nc + " calificados" : "Sin calificar" })))}</div>
    <div class="card"><p class="card-title">¿Ayudó a cumplir las metas?</p>${torta([{ n: "Sí", v: ev.filter(v => v.aporta === "si").length, color: "#156451" }, { n: "Parcialmente", v: ev.filter(v => v.aporta === "parcial").length, color: "#C89900" }, { n: "No", v: ev.filter(v => v.aporta === "no").length, color: "#AD1900" }], "Ayudó a cumplir las metas")}</div>
    <div class="card wide-card"><p class="card-title">Instituciones mejor evaluadas</p>${topCp.length ? topCp.map((r, i) => `<a class="rank" href="#/contraparte/${r.id}"><span class="pos">${i + 1}</span><span class="nm">${esc(contraparte(r.id).nombre)}<small>${r.nc} ${r.nc === 1 ? "vínculo calificado" : "vínculos calificados"} de ${r.n}</small></span>${dots(r.p)}<b>${num1(r.p)}</b></a>`).join("") : `<p class="muted small">Aún no hay calificaciones.</p>`}</div></div>`)}
  ${sec("¿Dónde están los vínculos?", "Por etapa, compañía, área, meta y tipo de institución", `<div class="bars2">
    <div class="card"><p class="card-title">Por etapa</p>${torta(porEtapa, "Vínculos por etapa")}</div>
    <div class="card"><p class="card-title">Por compañía</p>${torta(porComp, "Vínculos por compañía")}<p class="help">Un vínculo de varias compañías cuenta en cada una.</p></div>
    <div class="card"><p class="card-title">Por área</p>${barras(hojas, mx(hojas))}</div>
    <div class="card"><p class="card-title">Por meta a la que aporta</p>${porMeta.length ? barras(porMeta, mx(porMeta)) : `<p class="muted small">Ningún vínculo tiene metas asignadas.</p>`}</div>
    <div class="card"><p class="card-title">Por tipo de institución</p>${torta(porOrg, "Vínculos por tipo de institución")}</div>
    <div class="card"><p class="card-title">Instituciones por zona</p>${torta(porZona, "Instituciones por zona")}<p class="help"><a class="lnk" href="#/contrapartes">Ver instituciones por zona</a></p></div></div>`)}
  ${sec("Coordinación entre áreas", `${compartidas.length} instituciones compartidas`, `<div class="card"><p class="small muted" style="margin-top:0">Donde conviene coordinarse para no duplicar contactos.</p>${compartidas.length ? compartidas.slice(0, 8).map(r => `<a class="rank" href="#/contraparte/${r.id}"><span class="pos">${r.as.length}</span><span class="nm">${esc(contraparte(r.id).nombre)}<small>${r.as.map(a => esc(nombreArea(a))).join(", ")}</small></span></a>`).join("") : `<p class="muted small">Ninguna institución se comparte entre áreas.</p>`}</div>`, false)}
  ${sec("Financiamiento", "Quién financia los vínculos", `<div class="card">${torta(porFin, "Financiamiento")}</div>`, false)}
  ${sec("Estudiantes y feedback de instituciones", `${est.length} estudiantes en práctica o memoria`, `<div class="card"><div class="est-grid"><div class="kpi flat"><b>${est.length}</b><span>estudiantes hoy · nota promedio ${num1(notaProm(est))} (de 1 a 7, la pone la o el tutor)</span></div>
      <div>${barras(estTipo, mx(estTipo), false)}</div></div>
      ${estUni.length ? `<div class="table-wrap"><table><thead><tr><th>Universidad o institución</th><th>Estudiantes</th><th>Nota promedio</th></tr></thead><tbody>${estUni.map(r => `<tr><td class="t">${esc(contraparte(r.id).nombre)}</td><td>${r.n}</td><td>${r.p == null ? '<span class="muted">Sin evaluar</span>' : num1(r.p)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">No hay estudiantes con este filtro.</p>`}
      <p class="card-title" style="margin-top:14px">Feedback de instituciones</p><p class="small">${resp.length ? `${resp.length} ${resp.length === 1 ? "cuestionario respondido" : "cuestionarios respondidos"}; las instituciones nos califican con <b>${num1(resp.reduce((s, q) => s + (+q.respuestas[0] || 0), 0) / resp.length)} de 5</b>.` : "Aún no hay cuestionarios respondidos."}</p></div>`, false)}`;
}

/* ============================ Metas ============================ */
function vMetas() {
  if (!(ME.admin || ME.rol === "jefatura")) return `<div class="card empty">Las metas las define la jefatura o administración.</div>`;
  return `<h1>Metas</h1><p class="sub">Las metas a las que puede aportar cada vínculo. Quien registra un vínculo marca una o varias, y en Estadísticas se ve cuánto aporta cada una.</p>
  <div class="card">${S.metas.map((m, i) => { const n = S.vinculos.filter(v => metasDe(v).includes(m.nombre)).length; return `<div class="meta-row ${m.activa ? "" : "off"}"><span><b>${esc(m.nombre)}</b><small>${n} ${n === 1 ? "vínculo" : "vínculos"}${m.activa ? "" : " · desactivada: no aparece al registrar vínculos nuevos, pero sigue en los gráficos"}</small></span><button class="${m.activa ? "btn-outline" : "btn-accent"} sm" data-tg-meta="${i}">${m.activa ? "Desactivar" : "Activar"}</button></div>`; }).join("")}
    <div class="inline-form"><input class="input" id="nuevaMeta" placeholder="Ej.: Retención de talento joven" aria-label="Nueva meta"><button class="btn-accent" id="addMeta">Agregar meta</button></div>
    <p class="help">Las metas no se eliminan, para no perder el historial. Si una ya no se usa, desactívala.</p></div>`;
}

/* ============================ Administración ============================ */
let adminConfirm = false;
function vAdmin(tab) {
  if (!ME.admin) return `<div class="card empty">Esta sección es solo para administración.<br><button class="btn-outline" data-cambiar-admin>Entrar como administración (prototipo)</button></div>`;
  tab = tab || "areas";
  const tabs = [["areas", "Áreas"], ["tipos", "Tipos de vínculo"], ["org", "Tipos de institución"], ["contrapartes", "Instituciones"], ["metas", "Metas"], ["datos", "Datos"]];
  let body = "";
  if (tab === "areas") {
    const nodo = (a, nivel) => { const usados = S.vinculos.filter(v => v.area === a.id).length, borrable = !usados && !hijos(a.id).length;
      return `<div class="tree-admin l${nivel}"><span class="nm">${esc(a.nombre)} <span class="muted small">${(n => n + (n === 1 ? " vínculo" : " vínculos"))(S.vinculos.filter(v => descendientes(a.id).includes(v.area)).length)}</span></span>
      <span class="acts">${nivel < 2 ? `<button class="link-btn" data-add-sub="${a.id}">+ ${nivel === 0 ? "Gerencia" : "Subárea"}</button>` : ""}<button class="link-btn danger" data-del-area="${a.id}" ${borrable ? "" : `disabled title="Tiene vínculos o subáreas"`}>Eliminar</button></span></div>
      <div class="add-sub" id="add-${a.id}" hidden><input class="input sm" placeholder="Nombre" data-sub-in="${a.id}"><button class="btn-accent sm" data-sub-ok="${a.id}">Agregar</button></div>` + hijos(a.id).map(h => nodo(h, nivel + 1)).join(""); };
    body = `<p class="small muted">Solo administración puede crear áreas. No se puede eliminar un área que tenga vínculos o subáreas.</p>
      <div class="inline-form" style="margin:0 0 16px"><input class="input" id="nuevaVP" placeholder="Nueva vicepresidencia o gerencia de primer nivel"><button class="btn-accent" id="addVP">Agregar</button></div>
      ${S.areas.filter(a => !a.parent).map(a => nodo(a, 0)).join("")}`;
  } else if (tab === "tipos") {
    body = `<div class="cards2">${S.tipos.map(t => { const n = S.vinculos.filter(v => v.tipo === t.id).length; return `<div class="card"><div class="head-row"><h3 class="h3">${esc(t.nombre)}</h3><button class="link-btn danger" data-del-tipo="${t.id}" ${n ? "disabled title=\"Hay vínculos de este tipo\"" : ""}>Eliminar</button></div><p class="small muted">${n} vínculos · plan de trabajo sugerido:</p>${t.hitos.map(h => `<span class="tag">${esc(h)}</span>`).join("")}
      <p class="small muted" style="margin-top:10px">Qué se califica (de 1 a 5):</p>${criteriosDe(t.id).map(c => `<span class="tag crit">${esc(c)}</span>`).join("")}
      <div class="inline-form"><input class="input sm" data-crit-in="${t.id}" placeholder="Agregar criterio" aria-label="Nuevo criterio para ${esc(t.nombre)}"><button class="btn-outline sm" data-crit-ok="${t.id}">Agregar</button></div></div>`; }).join("")}</div>
      <div class="card" style="margin-top:16px"><p class="card-title">Nuevo tipo de vínculo</p><label class="f" for="ntNom">Nombre</label><input class="input" id="ntNom" placeholder="Ej.: Beca"><label class="f" for="ntHit">Plan de trabajo sugerido (un hito por línea)</label><textarea class="input" id="ntHit" rows="4" placeholder="Definir requisitos&#10;Convocar&#10;Seleccionar&#10;Seguimiento"></textarea><div class="form-actions"><button class="btn-accent" id="addTipo">Agregar tipo</button></div></div>`;
  } else if (tab === "org") {
    body = `<div class="chips">${S.tiposOrg.map(t => { const n = S.contrapartes.filter(c => c.tipoOrg === t).length; return `<span class="tagx">${esc(t)} <small>${n}</small>${n ? "" : `<button data-del-org="${esc(t)}" aria-label="Eliminar ${esc(t)}">×</button>`}</span>`; }).join("")}</div>
      <div class="inline-form"><input class="input" id="nuevoOrg" placeholder="Ej.: Liceo técnico"><button class="btn-accent" id="addOrg">Agregar</button></div>`;
  } else if (tab === "contrapartes") {
    body = `<div class="card"><p class="card-title">Nueva institución</p><div class="g2"><div><label class="f" for="ncNom">Nombre</label><input class="input" id="ncNom"></div><div><label class="f" for="ncCor">Nombre corto</label><input class="input" id="ncCor" placeholder="Ej.: UCN"></div><div><label class="f" for="ncTipo">Tipo</label><select class="input" id="ncTipo">${S.tiposOrg.map(t => `<option>${esc(t)}</option>`).join("")}</select></div><div><label class="f" for="ncLoc">Ubicación</label><input class="input" id="ncLoc"></div><div><label class="f" for="ncZona">Zona</label><select class="input" id="ncZona">${CONFIG.zonas.map(z => `<option>${z}</option>`).join("")}</select></div></div><div class="form-actions"><button class="btn-accent" id="addCp">Agregar institución</button></div></div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Institución</th><th>Tipo</th><th>Ubicación</th><th>Vínculos</th></tr></thead><tbody>${S.contrapartes.map(c => `<tr><td class="t">${esc(c.nombre)}</td><td>${esc(c.tipoOrg)}</td><td>${esc(c.locacion)}${c.zona ? `<small>Zona ${esc(c.zona)}</small>` : ""}</td><td>${S.vinculos.filter(v => v.contraparte === c.id).length}</td></tr>`).join("")}</tbody></table></div></div>`;
  } else {
    body = `<div class="card"><p class="card-title">Respaldo</p><p class="small">Descarga todos los datos en JSON, por ejemplo para compartirlos o pasarlos a una base de datos.</p><button class="btn-outline" id="dlJson">Descargar respaldo JSON</button></div>
      <div class="card"><p class="card-title">Restablecer</p><p class="small">${esEspacioVacio() ? "Deja la página de prueba vacía otra vez. Se pierde lo que registraste en ella." : "Vuelve a los datos de ejemplo del mapeo. Se pierden los cambios hechos en este navegador."}</p>${adminConfirm ? `<div class="form-actions"><button class="btn-accent" id="resetOk">Sí, restablecer</button><button class="btn-outline" id="resetNo">Cancelar</button></div>` : `<button class="btn-outline" id="reset">${esEspacioVacio() ? "Vaciar la página de prueba" : "Restablecer datos de ejemplo"}</button>`}</div>`;
  }
  return `<h1>Administración</h1><p class="sub">Configura las áreas, los tipos de vínculo (con sus criterios de calificación), las metas y las instituciones disponibles para todos.</p>
  <div class="tabs">${tabs.map(([k, t]) => `<a class="tab ${tab === k ? "on" : ""}" href="${k === "metas" ? "#/metas" : "#/admin/" + k}">${t}</a>`).join("")}</div><div class="stack">${body}</div>`;
}

/* ============================ Asistente ============================ */
const asis = { vid: null, tab: "reunion", texto: "", fuente: "Transcripción pegada", propuesta: null, cargando: false, extra: [], base: PREGUNTAS_BASE.map(() => true), error: "" };
let reco = null;
function abrirAsistente(vid, tab) {
  if (vid) asis.vid = vid; if (tab) asis.tab = tab;
  if (!asis.vid || !vinculo(asis.vid) || !puedeEditar(vinculo(asis.vid))) { const m = misVinculos().filter(puedeEditar); asis.vid = m.length ? m[0].id : null; }
  if (asis.vid !== asis._ultimo) { asis.propuesta = null; asis.extra = []; asis.error = ""; asis._ultimo = asis.vid; }
  $("#drawer").classList.add("show"); $("#drawerBg").classList.add("show"); renderAsistente();
}
function cerrarAsistente() { const d = $("#drawer"); if (!d) return; d.classList.remove("show"); $("#drawerBg").classList.remove("show"); if (reco) { try { reco.stop(); } catch (e) {} } }
function textoCuestionario(v, preguntas) {
  return `Hola${v.contacto.nombre ? " " + v.contacto.nombre : ""}:\n\nDesde ${nombreArea(v.area)} de Antofagasta Minerals queremos saber cómo va "${v.nombre}". ¿Nos ayudas respondiendo estas preguntas? Toma menos de 5 minutos.\n\n${preguntas.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nMuchas gracias,\n${v.responsable || ME.nombre}\nAntofagasta Minerals`;
}
function renderAsistente() {
  const d = $("#drawerBody"); if (!d) return;
  const editables = misVinculos().filter(puedeEditar);
  const v = vinculo(asis.vid);
  $("#aiModo").textContent = AI.etiqueta();
  if (!v) { d.innerHTML = `<p class="muted">No tienes vínculos que puedas editar.</p>`; return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let html = `<label class="f" for="asV">Vínculo</label><select class="input" id="asV">${editables.map(x => `<option value="${x.id}" ${x.id === v.id ? "selected" : ""}>${esc(x.nombre)}, ${esc(contraparte(x.contraparte).corto)}</option>`).join("")}</select>
    <div class="tabs sm"><button class="tab ${asis.tab === "reunion" ? "on" : ""}" data-astab="reunion">Actualizar con reunión</button><button class="tab ${asis.tab === "cuestionario" ? "on" : ""}" data-astab="cuestionario">Cuestionario de feedback</button></div>`;
  if (asis.tab === "reunion") {
    html += `<p class="small muted">Pega la transcripción o tus notas de una reunión con la contraparte. El asistente propone cambios a la ficha y tú eliges cuáles aplicar.</p>
      <textarea class="input" id="asTxt" rows="7" placeholder="Pega aquí la transcripción de Teams, Meet o Zoom, o tus notas…">${esc(asis.texto)}</textarea>
      <div class="as-tools"><label class="btn-outline sm">Subir archivo<input type="file" id="asFile" accept=".txt,.vtt,.srt,.md,text/plain,audio/*" hidden></label>${SR ? `<button class="btn-outline sm" id="asMic">${reco ? "Detener dictado" : "Dictar"}</button>` : ""}<span class="small muted" id="asInfo"></span></div>
      <div class="form-actions"><button class="btn-accent" id="asGo" ${asis.cargando ? "disabled" : ""}>${asis.cargando ? "Procesando…" : "Procesar reunión"}</button></div>
      ${asis.error ? `<div class="err show">${esc(asis.error)}</div>` : ""}`;
    const p = asis.propuesta;
    if (p) {
      html += `<div class="prop"><p class="card-title">Resumen</p><p class="small">${esc(p.resumen)}</p>
        <p class="card-title">Cambios propuestos a la ficha</p>${p.cambios.length ? p.cambios.map((c, i) => `<label class="diff"><input type="checkbox" data-cambio="${i}" checked><span><b>${esc(c.etiqueta)}</b>${c.antes ? `<s>${esc(c.antes)}</s>` : ""}<ins>${esc(c.despues)}</ins></span></label>`).join("") : `<p class="small muted">Sin cambios a los campos.</p>`}
        ${p.completados.length ? `<p class="card-title">Hitos cumplidos</p>${p.completados.map((t, i) => `<label class="diff"><input type="checkbox" data-comp="${i}" checked><span>${esc(t)}</span></label>`).join("")}` : ""}
        ${p.nuevos.length ? `<p class="card-title">Hitos nuevos</p>${p.nuevos.map((t, i) => `<label class="diff"><input type="checkbox" data-nuevo="${i}" checked><span>${esc(t)}</span></label>`).join("")}` : ""}
        ${p.etapa != null ? `<p class="card-title">Etapa</p><label class="diff"><input type="checkbox" id="asEtapa" checked><span>Mover de ${CONFIG.etapas[v.etapa]} a <b>${CONFIG.etapas[p.etapa]}</b></span></label>` : ""}
        <div class="form-actions"><button class="btn-accent" id="asAplicar">Aplicar y guardar versión</button><button class="btn-outline" id="asDescartar">Descartar</button></div></div>`;
    }
  } else {
    const preguntas = PREGUNTAS_BASE.filter((_, i) => asis.base[i]).map(p => p.texto).concat(asis.extra);
    html += `<div class="pasos-cq"><b>Cómo funciona</b><ol><li>Eliges las preguntas.</li><li>Se abre tu correo con el texto listo para ${v.contacto.correo ? esc(v.contacto.correo) : "la institución (agrega su correo en la ficha)"}. Tú lo envías.</li><li>Cuando respondan, pegas su respuesta en la ficha, en "Feedback de la institución".</li></ol></div>
      <p class="card-title">Preguntas generales</p>${PREGUNTAS_BASE.map((p, i) => `<label class="diff"><input type="checkbox" data-base="${i}" ${asis.base[i] ? "checked" : ""}><span>${esc(p.texto)}</span></label>`).join("")}
      <p class="card-title">Preguntas específicas de este vínculo</p>${asis.extra.map((p, i) => `<div class="diff"><span style="flex:1">${esc(p)}</span><button class="link-btn danger" data-quitar="${i}">Quitar</button></div>`).join("") || `<p class="small muted">Puedes sugerirlas con el asistente o escribirlas.</p>`}
      <div class="form-actions"><button class="btn-outline sm" id="asSug" ${asis.cargando ? "disabled" : ""}>${asis.cargando ? "Pensando…" : "Sugerir con el asistente"}</button></div>
      <div class="inline-form"><input class="input" id="asPreg" placeholder="Escribe otra pregunta"><button class="btn-outline" id="asAddP">Agregar</button></div>
      ${asis.error ? `<div class="err show">${esc(asis.error)}</div>` : ""}
      <p class="card-title" style="margin-top:16px">Vista previa del correo</p><textarea class="input" id="asPrev" rows="8" readonly>${esc(textoCuestionario(v, preguntas))}</textarea>
      <div class="form-actions"><button class="btn-accent" id="asEnviar">Abrir en mi correo</button><button class="btn-outline" id="asCopiar">Copiar texto</button></div>
      <p class="help">La página no envía el correo por ti: queda guardado como "preparado" hasta que confirmes que lo mandaste.</p>`;
  }
  d.innerHTML = html;
  wireAsistente(v);
}
function setPath(obj, path, val) { const k = path.split("."); let o = obj; while (k.length > 1) o = o[k.shift()]; o[k[0]] = val; }
function wireAsistente(v) {
  $("#asV").onchange = e => { asis.vid = +e.target.value; asis.propuesta = null; asis.extra = []; asis.error = ""; asis._ultimo = asis.vid; renderAsistente(); };
  $$("[data-astab]").forEach(b => b.onclick = () => { asis.tab = b.dataset.astab; asis.error = ""; renderAsistente(); });
  if (asis.tab === "reunion") {
    const txt = $("#asTxt"); txt.oninput = () => asis.texto = txt.value;
    $("#asFile").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.type.startsWith("audio/")) { $("#asInfo").textContent = "Los audios aún no se transcriben aquí. Usa la transcripción automática de Teams, Meet o Zoom y pégala, o usa Dictar."; return; }
      let t = await f.text();
      t = t.replace(/^WEBVTT.*$/m, "").replace(/^\d+$/gm, "").replace(/^\d{2}:\d{2}[:.,\d]* --> .*$/gm, "").replace(/\n{2,}/g, "\n").trim();
      asis.texto = (asis.texto ? asis.texto + "\n" : "") + t; asis.fuente = "Archivo " + f.name; renderAsistente();
    };
    const mic = $("#asMic");
    if (mic) mic.onclick = () => {
      if (reco) { reco.stop(); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      reco = new SR(); reco.lang = "es-CL"; reco.continuous = true; reco.interimResults = false;
      reco.onresult = ev => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) asis.texto += (asis.texto ? " " : "") + ev.results[i][0].transcript; const t = $("#asTxt"); if (t) t.value = asis.texto; };
      reco.onerror = ev => { $("#asInfo").textContent = ev.error === "not-allowed" ? "El navegador no dio permiso para usar el micrófono." : "No se pudo dictar: " + ev.error; };
      reco.onend = () => { reco = null; asis.fuente = "Dictado"; renderAsistente(); };
      try { reco.start(); mic.textContent = "Detener dictado"; $("#asInfo").textContent = "Escuchando… habla con normalidad."; } catch (e) { reco = null; }
    };
    $("#asGo").onclick = async () => {
      if (!asis.texto.trim()) { asis.error = "Pega o dicta el contenido de la reunión primero."; renderAsistente(); return; }
      asis.cargando = true; asis.error = ""; renderAsistente();
      try { asis.propuesta = await AI.procesarReunion(v, asis.texto); }
      catch (e) { asis.error = e && e.code === "rate_limited" ? "Demasiadas consultas seguidas. Espera un momento e intenta de nuevo." : "No se pudo procesar la reunión. Intenta de nuevo."; }
      asis.cargando = false; renderAsistente();
    };
    const ap = $("#asAplicar");
    if (ap) ap.onclick = () => {
      const p = asis.propuesta, aplicados = [];
      p.cambios.forEach((c, i) => { if ($(`[data-cambio="${i}"]`).checked) { setPath(v, c.campo, c.despues); aplicados.push(c.etiqueta.toLowerCase()); } });
      p.completados.forEach((t, i) => { if ($(`[data-comp="${i}"]`).checked) { const h = v.hitos.find(h => h.t === t); if (h) { h.ok = true; aplicados.push("hito cumplido"); } } });
      p.nuevos.forEach((t, i) => { if ($(`[data-nuevo="${i}"]`).checked) { v.hitos.push({ t, ok: false }); aplicados.push("hito nuevo"); } });
      if (p.etapa != null && $("#asEtapa").checked) { v.etapa = p.etapa; aplicados.push("etapa"); }
      v.reuniones.push({ fecha: hoy(), fuente: asis.fuente, resumen: p.resumen });
      nuevaVersion(v, `Asistente (revisado por ${ME.nombre})`, `Actualizado con reunión del ${fechaTxt(hoy())}${aplicados.length ? ": " + [...new Set(aplicados)].join(", ") : ""}.`);
      guardar(); asis.propuesta = null; asis.texto = ""; cerrarAsistente(); toast("Ficha actualizada. Quedó como nueva versión."); location.hash = "#/ficha/" + v.id; render();
    };
    const ds = $("#asDescartar"); if (ds) ds.onclick = () => { asis.propuesta = null; renderAsistente(); };
  } else {
    $$("[data-base]").forEach(c => c.onchange = () => { asis.base[+c.dataset.base] = c.checked; renderAsistente(); });
    $$("[data-quitar]").forEach(b => b.onclick = () => { asis.extra.splice(+b.dataset.quitar, 1); renderAsistente(); });
    $("#asSug").onclick = async () => {
      asis.cargando = true; asis.error = ""; renderAsistente();
      try { const ps = await AI.preguntasCuestionario(v); asis.extra = [...new Set([...asis.extra, ...ps])]; }
      catch (e) { asis.error = "No se pudieron sugerir preguntas. Intenta de nuevo."; }
      asis.cargando = false; renderAsistente();
    };
    const addP = () => { const t = $("#asPreg").value.trim(); if (t) { asis.extra.push(t); renderAsistente(); } };
    $("#asAddP").onclick = addP; $("#asPreg").onkeydown = e => { if (e.key === "Enter") addP(); };
    const preguntas = () => PREGUNTAS_BASE.filter((_, i) => asis.base[i]).map(p => p.texto).concat(asis.extra);
    $("#asCopiar").onclick = async () => { const t = $("#asPrev"); try { await navigator.clipboard.writeText(t.value); toast("Texto copiado"); } catch (e) { t.select(); toast("Selecciona y copia el texto (Cmd + C)"); } };
    $("#asEnviar").onclick = () => {
      const ps = preguntas(); if (!ps.length) return;
      const q = { id: Date.now(), fecha: hoy(), estado: "preparado", preguntas: ps, respuestas: [] };
      v.cuestionarios.push(q); guardar();
      const a = document.createElement("a"); a.href = `mailto:${encodeURIComponent(v.contacto.correo || "")}?subject=${encodeURIComponent("Cómo va " + v.nombre + " · Antofagasta Minerals")}&body=${encodeURIComponent(textoCuestionario(v, ps))}`; a.target = "_blank"; document.body.appendChild(a); a.click(); a.remove();
      asis.extra = []; cerrarAsistente(); toast("Se abrió tu correo. Cuando lo mandes, márcalo como enviado en la ficha."); if (location.hash !== "#/ficha/" + v.id) location.hash = "#/ficha/" + v.id; else render();
    };
  }
}

/* ============================ Router ============================ */
function render() {
  const [ruta, p] = (location.hash || "#/login").replace(/^#\//, "").split("/");
  const app = $("#app");
  if (ruta === "convocatorias") { app.innerHTML = vConvPub(); wireConvPub(); window.scrollTo(0, 0); return; }
  if (ruta === "postular") { app.innerHTML = vPostular(p); wirePostular(p); window.scrollTo(0, 0); return; }
  if (ruta === "mi-postulacion") { app.innerHTML = vMiPostulacion(); wireMiPostulacion(); window.scrollTo(0, 0); return; }
  if (ruta === "reiniciar") { restablecerTodo(); cerrarSesion(); location.hash = "#/login"; setTimeout(() => toast("Listo: datos de ejemplo restablecidos y páginas vacías del Perfil 0 y Perfil 2"), 50); return; }
  if (!ME && ruta !== "login") { location.hash = "#/login"; return; }
  if (ruta === "login" || !ruta) {
    if (ME) { location.hash = inicioDe(ME); return; }
    app.innerHTML = vLogin();
    $("#btnSso").onclick = () => { loginAbierto = !loginAbierto; const c = $("#cuentas"); c.hidden = !loginAbierto; $("#btnSso").setAttribute("aria-expanded", loginAbierto); if (loginAbierto) c.querySelector("button").focus(); };
    $$("[data-login]").forEach(b => b.onclick = () => { iniciarSesion(b.dataset.login); loginAbierto = false; filtro.comp = ""; location.hash = inicioDe(ME); });
    return;
  }
  const activo = { mis: "mis", ficha: "mis", nuevo: "", editar: "mis", areas: "areas", area: "areas", contrapartes: "contrapartes", contraparte: "contrapartes", dashboard: "dashboard", admin: "admin", convocatoria: "mis", "nueva-convocatoria": "", metas: ME.admin ? "admin" : "metas" }[ruta];
  const vistas = { mis: vMis, ficha: vFicha, nuevo: p => vForm(null, p), editar: p => vForm(p), areas: vAreas, area: vArea, contrapartes: vContrapartes, contraparte: vContraparte, dashboard: vDashboard, admin: vAdmin, convocatoria: vConvocatoria, "nueva-convocatoria": vNuevaConv, metas: vMetas };
  const body = vistas[ruta] ? vistas[ruta](p) : `<div class="card empty">No encontramos esta página.<br><button class="btn-outline" onclick="location.hash='#/mis'">Ir a Mis vínculos</button></div>`;
  app.innerHTML = shell(activo) + `<main>${body}</main>${pie()}
    <button class="fab" id="fab" aria-label="Abrir asistente"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4.5 21l4.3-2.2c1 .3 2.1.4 3.2.4 5.5 0 10-3.6 10-8S17.5 3 12 3Zm-4 9.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z"/></svg><span>Asistente</span></button>
    <div class="drawer-bg" id="drawerBg"></div>
    <aside class="drawer" id="drawer" aria-label="Asistente"><div class="drawer-h"><div><b>Asistente</b><span class="ai-tag" id="aiModo"></span></div><button class="x" id="drawerX" aria-label="Cerrar">×</button></div><div class="drawer-b" id="drawerBody"></div></aside>
`;
  wireShell(); wireVista(ruta, p);
  $("#fab").onclick = () => abrirAsistente(ruta === "ficha" ? +p : null);
  $("#drawerX").onclick = cerrarAsistente; $("#drawerBg").onclick = cerrarAsistente;
  window.scrollTo(0, 0);
}

function wireVista(ruta, p) {
  $$("[data-ficha]").forEach(tr => { const go = () => location.hash = "#/ficha/" + tr.dataset.ficha; tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
  $$("[data-mail-v]").forEach(b => b.onclick = e => { e.stopPropagation(); const v = vinculo(+b.dataset.mailV); if (v) abrirCorreoInst(v, ""); });
  $$("main [data-aviso]").forEach(b => b.onclick = () => abrirAviso(b.dataset.aviso, b.dataset.ir));
  const ca = $("[data-cambiar-admin]"); if (ca) ca.onclick = () => { iniciarSesion("admin", true); render(); };

  const sv = $("#sinVinc"); if (sv) sv.onclick = () => { S.sinVinculos = [...new Set([...(S.sinVinculos || []), ME.id])]; guardar(); render(); toast("Anotado. No tienes que registrar nada más."); };
  if (ruta === "mis" && $("#fq")) {
    const pinta = () => { $("#tablaMis").innerHTML = filasVinculos(listaFiltrada(), { area: ME.admin || hijos(ME.area).length, vacio: "No hay vínculos con estos filtros." }); wireVista("_tabla"); };
    const mg = $("#mailGo");
    if (mg) mg.onclick = () => { const v = vinculo(+$("#mailSel").value); if (v) abrirCorreoInst(v, $("#mailMsg").value.trim()); };
    $$("[data-etapa-f]").forEach(b => b.onclick = () => { filtro.etapa = +b.dataset.etapaF; render(); });
    $("#fq").oninput = e => { filtro.q = e.target.value; pinta(); };
    $("#ft").onchange = e => { filtro.tipo = e.target.value; pinta(); };
    $("#fc").onchange = e => { filtro.comp = e.target.value; pinta(); };
    $("#finc").onchange = e => { filtro.inc = e.target.checked; if (!filtro.inc && p === "incompletos") location.hash = "#/mis"; else pinta(); };
    $$("[data-ir-f]").forEach(b => b.onclick = () => { filtro.inc = true; render(); });
  }

  if (ruta === "ficha") {
    const v = vinculo(+p); if (!v) return;
    $("#dlReadme").onclick = () => descargar(`README-${v.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}.md`, readmeMarkdown(v), "text/markdown");
    if (!puedeEditar(v)) return;
    $$("[data-etapa]").forEach(b => b.onclick = () => {
      const n = +b.dataset.etapa, antes = v.etapa; if (n === antes) return;
      v.etapa = n; nuevaVersion(v, ME.nombre, `Etapa cambiada de ${CONFIG.etapas[antes]} a ${CONFIG.etapas[n]}.`); guardar(); render();
      toast(`Etapa cambiada a ${CONFIG.etapas[n]}`, () => { v.etapa = antes; v.versiones.pop(); guardar(); render(); });
    });
    $$("[data-hito]").forEach(c => c.onchange = () => { v.hitos[+c.dataset.hito].ok = c.checked; guardar(); render(); });
    const addH = () => { const t = $("#nuevoHito").value.trim(); if (!t) return; v.hitos.push({ t, ok: false }); nuevaVersion(v, ME.nombre, `Hito agregado: ${t}.`); guardar(); render(); };
    $("#addHito").onclick = addH; $("#nuevoHito").onkeydown = e => { if (e.key === "Enter") addH(); };
    $$("[data-rate]").forEach(b => b.onclick = () => {
      const k = criteriosDe(v.tipo)[+b.dataset.crit], antes = JSON.stringify(v.criterios || {}), califAntes = v.calif;
      v.criterios = Object.assign({}, v.criterios); v.criterios[k] = +b.dataset.rate; v.calif = califDe(v.criterios);
      guardar(); render();
      toast(`${k}: ${b.dataset.rate} de 5. Calificación del vínculo: ${num1(v.calif)}`, () => { v.criterios = JSON.parse(antes); v.calif = califAntes; guardar(); render(); });
    });
    $$("[data-aporta]").forEach(b => b.onclick = () => { v.aporta = v.aporta === b.dataset.aporta ? null : b.dataset.aporta; guardar(); render(); });
    $$("[data-registrar]").forEach(b => b.onclick = () => { const box = $("#reg-" + b.dataset.registrar); box.hidden = !box.hidden; if (!box.hidden) box.querySelector("textarea").focus(); });
    $$("[data-enviado]").forEach(b => b.onclick = () => { const q = v.cuestionarios.find(x => x.id === +b.dataset.enviado); q.estado = "enviado"; guardar(); render(); toast("Marcado como enviado"); });
    $$("[data-guardar-resp]").forEach(b => b.onclick = () => {
      const q = v.cuestionarios.find(x => x.id === +b.dataset.guardarResp);
      q.respuestas = q.preguntas.map((_, i) => ($(`#reg-${q.id} [data-resp="${i}"]`) || {}).value || "");
      q.comentario = $("#com-" + q.id).value.trim();
      if (!q.comentario && !q.respuestas.some(Boolean)) { toast("Pega la respuesta o completa al menos una pregunta"); return; }
      q.estado = "respondido";
      nuevaVersion(v, ME.nombre, "Se registraron las respuestas del cuestionario de la institución.");
      guardar(); render(); toast("Respuestas guardadas");
    });
  }

  if (ruta === "nuevo" || ruta === "editar") {
    const base = ruta === "editar" ? vinculo(+p) : null;
    if (ruta === "editar" && (!base || !puedeEditar(base))) return;
    if (!$("#guardar")) return;
    const comp = () => {
      const d = leerForm(base), c = completitud(Object.assign({ contacto: {}, financiamiento: {}, hitos: [] }, d));
      $("#compBox").innerHTML = `<div class="comp-head"><span class="pcell">${barra(c.pct, c.pct < 50 ? "low" : "ok")}<b>${c.pct}%</b></span></div><ul class="check check-aside">${CAMPOS_README.map(x => `<li class="${x[2](d) ? "ok" : ""}">${x[1]}</li>`).join("")}</ul><p class="help">No es obligatorio llenarlo todo ahora. Lo que falte se muestra en la ficha.</p>`;
    };
    // Contactos ya registrados en la institución: se muestran a la derecha (en celular, bajo la institución)
    // y se sugieren al escribir el nombre.
    const usar = k => { $("#fCNom").value = k.nombre; $("#fCCar").value = k.cargo || ""; $("#fCCor").value = k.correo || ""; $("#fCTel").value = k.telefono || ""; comp(); contactos(); toast(`Contacto: ${k.nombre}`); };
    const contactos = () => {
      const cp = $("#fCp").value, ks = contactosDe(cp), inst = S.contrapartes.find(c => c.id === cp), actual = $("#fCNom").value.trim().toLowerCase();
      $("#contList").innerHTML = ks.map(k => `<option value="${esc(k.nombre)}">${esc(k.cargo)}</option>`).join("");
      const tarjeta = k => {
        const sel = k.nombre.toLowerCase() === actual;
        const dl = [];
        if (k.correo) dl.push(`<div class="contact-field"><span class="contact-lbl">Correo</span><a class="contact-val" href="mailto:${esc(k.correo)}">${esc(k.correo)}</a></div>`);
        if (k.telefono) dl.push(`<div class="contact-field"><span class="contact-lbl">Teléfono</span><a class="contact-val" href="tel:${esc(k.telefono.replace(/\s/g, ""))}">${esc(k.telefono)}</a></div>`);
        return `<article class="contact-card${sel ? " sel" : ""}">
          <h4 class="contact-name">${esc(k.nombre)}</h4>
          ${k.cargo ? `<p class="contact-cargo">${esc(k.cargo)}</p>` : ""}
          ${dl.length ? `<div class="contact-fields">${dl.join("")}</div>` : ""}
          ${sel ? `<p class="contact-badge">Contacto de este vínculo</p>` : `<button type="button" class="btn-outline sm contact-use" data-usar="${esc(k.nombre)}">Usar este contacto</button>`}
        </article>`;
      };
      const box = $("#contBox");
      if (!box) return;
      if (!cp || cp === "__nueva") {
        box.innerHTML = `<details class="panel-brand-light dd"><summary><span class="k">Contactos de la institución</span><b>Elige una institución</b><span class="o">Ver detalle</span></summary><p class="help inner">Al elegir la institución aparecen aquí las personas ya registradas, con correo y teléfono.</p></details>`;
      } else {
        box.innerHTML = `<details class="panel-brand-light dd" open><summary><span class="k">Contactos en ${esc(inst.corto)}</span><b>${ks.length ? ks.length + (ks.length === 1 ? " persona registrada" : " personas registradas") : "Sin contactos aún"}</b><span class="o">Ver detalle</span></summary>
          ${ks.length ? ks.map(tarjeta).join("") : `<p class="help inner">Todavía no hay contactos guardados. Lo que escribas abajo quedará para las otras áreas.</p>`}
          ${ks.length ? `<p class="help inner">Pulsa «Usar este contacto» o completa los campos de abajo.</p>` : ""}</details>`;
      }
      $$("[data-usar]").forEach(b => b.onclick = () => usar(ks.find(k => k.nombre === b.dataset.usar)));
    };
    $("#fCNom").addEventListener("change", () => { const k = contactosDe($("#fCp").value).find(x => x.nombre === $("#fCNom").value); if (k) { if (!$("#fCCar").value) $("#fCCar").value = k.cargo || ""; if (!$("#fCCor").value) $("#fCCor").value = k.correo || ""; if (!$("#fCTel").value) $("#fCTel").value = k.telefono || ""; comp(); } contactos(); });
    const dup = () => {
      $("#nuevaCp").hidden = $("#fCp").value !== "__nueva";
      const cp = $("#fCp").value, aside = $("#dupAside");
      if (!cp || cp === "__nueva") { aside.innerHTML = ""; return; }
      const key = "siva-ocultar-dup-" + cp;
      if (sessionStorage.getItem(key)) {
        aside.innerHTML = dupAsideReabrirHTML(cp);
        $("#dupReabrir").onclick = () => { sessionStorage.removeItem(key); dup(); };
        return;
      }
      aside.innerHTML = dupAsideHTML(cp, $("#fArea").value, base ? base.id : null);
      const x = $("#dupCerrar");
      if (x) x.onclick = e => { e.preventDefault(); e.stopPropagation(); sessionStorage.setItem(key, "1"); dup(); };
    };
    const fin = () => { const t = $("#fFinT").value; $("#finFuenteBox").hidden = !["Presupuesto del área", "Mixto", "Fondo externo (CORFO, ANID u otro)"].includes(t); $("#fFinFLbl").textContent = t === "Fondo externo (CORFO, ANID u otro)" ? "¿Qué fondo?" : "Presupuesto del área: partida o centro de costo"; };
    $("main").addEventListener("input", comp); $("main").addEventListener("change", comp);
    $("#fCp").addEventListener("change", () => { dup(); contactos(); }); $("#fArea").addEventListener("change", dup);
    $("#fFinT").addEventListener("change", fin);
    // Compañías: "Todas" marca o desmarca todas.
    const todas = $("#fCompTodas"), cks = $$("#fComps input[value]");
    todas.onchange = () => cks.forEach(c => c.checked = todas.checked);
    cks.forEach(c => c.addEventListener("change", () => todas.checked = cks.every(x => x.checked)));
    // Plan de trabajo como lista de tareas.
    const pb = $("#planBox");
    const wirePlan = () => $$("[data-quitar-tarea]").forEach(b => b.onclick = () => { b.closest(".plan-row").remove(); delete pb.dataset.auto; comp(); });
    pb.addEventListener("input", () => delete pb.dataset.auto);
    const addT = () => { const t = $("#fNuevaTarea").value.trim(); if (!t) return; pb.insertAdjacentHTML("beforeend", planFila({ t, ok: false }, pb.children.length)); delete pb.dataset.auto; $("#fNuevaTarea").value = ""; wirePlan(); comp(); };
    $("#fAddTarea").onclick = addT; $("#fNuevaTarea").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); addT(); } };
    const tipoCambio = () => {
      const t = S.tipos.find(t => t.id === $("#fTipo").value), et = +$("#fEtapa").value;
      $("#fEtapa").innerHTML = opcionesEtapa($("#fTipo").value, et);
      if (t && pb.dataset.auto) { pb.innerHTML = t.hitos.map((h, i) => planFila({ t: h, ok: false }, i)).join(""); wirePlan(); }
      comp();
    };
    $("#fTipo").addEventListener("change", tipoCambio);
    ["fNombre", "fTipo", "fArea", "fCp"].forEach(id => $("#" + id).addEventListener("input", () => { $("#" + id).classList.remove("bad"); $("#e" + id.slice(1)).classList.remove("show"); }));
    dup(); contactos(); fin(); wirePlan(); comp();
    const fill = $("#aiFill");
    if (fill) fill.onclick = async () => {
      const t = $("#aiTxt").value.trim(); if (!t) { $("#aiEstado").textContent = "Pega primero un texto."; return; }
      fill.disabled = true; $("#aiEstado").textContent = "Leyendo el texto…";
      try {
        const r = await AI.completarPlantilla(t) || {};
        const set = (id, val) => { if (val && !$("#" + id).value) { $("#" + id).value = val; $("#" + id).classList.add("hl"); } };
        set("fNombre", r.nombre);
        if (r.tipo && S.tipos.some(x => x.id === r.tipo) && !$("#fTipo").value) { $("#fTipo").value = r.tipo; $("#fTipo").classList.add("hl"); tipoCambio(); }
        if (r.contraparte && !$("#fCp").value) {
          const n = r.contraparte.toLowerCase(), c = S.contrapartes.find(c => c.nombre.toLowerCase() === n || c.corto.toLowerCase() === n || n.includes(c.corto.toLowerCase()) || c.nombre.toLowerCase().includes(n));
          if (c) $("#fCp").value = c.id; else { $("#fCp").value = "__nueva"; $("#fCpNom").value = r.contraparte; }
          $("#fCp").classList.add("hl"); dup(); contactos();
        }
        set("fSede", r.sede); set("fCNom", r.contacto_nombre); set("fCCar", r.contacto_cargo); set("fCCor", r.contacto_correo);
        set("fObj", r.objetivo); set("fAlc", r.alcance);
        if (r.meta) { const rm = r.meta.toLowerCase(); $$("#fMetas input").forEach(i => { const m = i.value.toLowerCase(); if (rm.includes(m) || m.includes(rm)) i.checked = true; }); }
        set("fFinM", r.financiamiento_monto);
        if (CONFIG.financiamientos.includes(r.financiamiento_tipo) && $("#fFinT").value === "No definido") { $("#fFinT").value = r.financiamiento_tipo; $("#fFinT").classList.add("hl"); fin(); }
        if (/^\d{4}-\d{2}-\d{2}$/.test(r.inicio || "")) set("fIni", r.inicio);
        if (/^\d{4}-\d{2}-\d{2}$/.test(r.termino || "")) set("fTer", r.termino);
        set("fCom", r.comentarios || [r.necesidades, r.proximos].filter(Boolean).join(" "));
        comp(); $("#aiEstado").textContent = "Listo. Los campos destacados los completó el asistente: revísalos.";
      } catch (e) { $("#aiEstado").textContent = "No se pudo completar. Intenta de nuevo o llena la plantilla a mano."; }
      fill.disabled = false;
    };
    $("#guardar").onclick = () => {
      const d = leerForm(base); let ok = true;
      [["fNombre", d.nombre], ["fTipo", d.tipo], ["fArea", d.area], ["fCp", d.contraparte === "__nueva" ? $("#fCpNom").value.trim() : d.contraparte]].forEach(([id, val]) => { if (!val) { $("#" + id).classList.add("bad"); $("#e" + id.slice(1)).classList.add("show"); ok = false; } });
      if (!ok) { const b = $(".input.bad"); b && b.focus(); return; }
      if (d.contraparte === "__nueva") {
        const nom = $("#fCpNom").value.trim(), id = "c" + Date.now().toString(36);
        S.contrapartes.push({ id, nombre: nom, corto: nom.length > 24 ? nom.slice(0, 22) + "…" : nom, tipoOrg: $("#fCpTipo").value, locacion: d.sede, zona: "", contactos: [] });
        d.contraparte = id;
      }
      // El contacto nuevo queda guardado en la institución para que otras áreas lo encuentren.
      const inst = S.contrapartes.find(c => c.id === d.contraparte);
      if (inst && d.contacto.nombre && !(inst.contactos || []).some(k => k.nombre.toLowerCase() === d.contacto.nombre.toLowerCase())) inst.contactos = [...(inst.contactos || []), Object.assign({}, d.contacto)];
      if (base) {
        const nombres = { nombre: "nombre", tipo: "tipo", area: "área", companias: "compañías", etapa: "etapa", contraparte: "institución", sede: "sede", contacto: "contacto", lider: "líder", responsable: "encargado/a", objetivo: "objetivo", metas: "metas", alcance: "alcance", financiamiento: "financiamiento", inicio: "fecha de inicio", termino: "fecha de término", hitos: "plan de trabajo", comentarios: "comentarios" };
        const cambios = Object.keys(nombres).filter(k => JSON.stringify(base[k]) !== JSON.stringify(d[k]));
        Object.assign(base, d);
        if (cambios.length) nuevaVersion(base, ME.nombre, "Edición manual: " + cambios.map(k => nombres[k]).join(", ") + ".");
        guardar(); location.hash = "#/ficha/" + base.id; toast(cambios.length ? "Ficha guardada como nueva versión" : "Sin cambios");
      } else {
        const v = Object.assign({ id: S.nextId++, tema: "", calif: null, criterios: {}, aporta: null, versiones: [], reuniones: [], cuestionarios: [] }, d);
        nuevaVersion(v, ME.nombre, "Creación del vínculo.");
        S.vinculos.push(v); guardar(); location.hash = "#/ficha/" + v.id; setTimeout(() => toast("Vínculo creado"), 50);
      }
    };
  }

  if (ruta === "metas") {
    const am = $("#addMeta"); if (am) am.onclick = () => { const n = $("#nuevaMeta").value.trim(); if (!n || S.metas.some(m => m.nombre.toLowerCase() === n.toLowerCase())) return; S.metas.push({ nombre: n, activa: true }); guardar(); render(); toast("Meta agregada"); };
    $$("[data-tg-meta]").forEach(b => b.onclick = () => { const m = S.metas[+b.dataset.tgMeta]; m.activa = !m.activa; guardar(); render(); toast(m.activa ? "Meta activada" : "Meta desactivada. Sigue en los gráficos.", () => { m.activa = !m.activa; guardar(); render(); }); });
  }
  if (ruta === "convocatoria") wireConv(p);
  if (ruta === "nueva-convocatoria") wireNuevaConv(p);
  if (ruta === "contrapartes") {
    $("#cpq").oninput = e => { cpq = e.target.value; $("#cpGrid").innerHTML = cpCards($("#cpGrid").dataset.tipo); };
    $("#cpTipoV").onchange = e => { cpTipoV = e.target.value; $("#cpGrid").innerHTML = cpCards($("#cpGrid").dataset.tipo); };
    $("#cpZona").onchange = e => { cpZona = e.target.value; $("#cpGrid").innerHTML = cpCards($("#cpGrid").dataset.tipo); };
  }
  if (ruta === "contraparte") {
    if ($("#nuevoCon")) $("#nuevoCon").onclick = e => { preCp = e.currentTarget.dataset.cp; location.hash = "#/nuevo"; };
  }
  if (ruta === "dashboard") {
    const dv = $("#dashVP"); if (dv) dv.onchange = e => { dashVP = e.target.value; render(); };
    $("#dashComp").onchange = e => { dashComp = e.target.value; render(); };
  }
  if (ruta === "admin" && ME.admin) {
    const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 20) + "-" + Date.now().toString(36).slice(-4);
    const addVP = $("#addVP"); if (addVP) addVP.onclick = () => { const n = $("#nuevaVP").value.trim(); if (!n) return; S.areas.push({ id: slug(n), nombre: n, parent: null }); guardar(); render(); toast("Área agregada"); };
    $$("[data-add-sub]").forEach(b => b.onclick = () => { const box = $("#add-" + b.dataset.addSub); box.hidden = !box.hidden; if (!box.hidden) box.querySelector("input").focus(); });
    $$("[data-sub-ok]").forEach(b => b.onclick = () => { const n = $(`[data-sub-in="${b.dataset.subOk}"]`).value.trim(); if (!n) return; S.areas.push({ id: slug(n), nombre: n, parent: b.dataset.subOk }); guardar(); render(); toast("Área agregada"); });
    $$("[data-del-area]").forEach(b => b.onclick = () => { const id = b.dataset.delArea; S.areas = S.areas.filter(a => a.id !== id); guardar(); render(); toast("Área eliminada"); });
    const at = $("#addTipo"); if (at) at.onclick = () => { const n = $("#ntNom").value.trim(); if (!n) { $("#ntNom").classList.add("bad"); return; } S.tipos.push({ id: slug(n), nombre: n, hitos: $("#ntHit").value.split("\n").map(s => s.trim()).filter(Boolean) }); guardar(); render(); toast("Tipo de vínculo agregado"); };
    $$("[data-del-tipo]").forEach(b => b.onclick = () => { S.tipos = S.tipos.filter(t => t.id !== b.dataset.delTipo); guardar(); render(); });
    $$("[data-crit-ok]").forEach(b => b.onclick = () => { const t = S.tipos.find(x => x.id === b.dataset.critOk), n = $(`[data-crit-in="${t.id}"]`).value.trim(); if (!n) return; t.criterios = [...criteriosDe(t.id), n]; guardar(); render(); toast("Criterio agregado"); });
    const ao = $("#addOrg"); if (ao) ao.onclick = () => { const n = $("#nuevoOrg").value.trim(); if (n && !S.tiposOrg.includes(n)) { S.tiposOrg.push(n); guardar(); render(); } };
    $$("[data-del-org]").forEach(b => b.onclick = () => { S.tiposOrg = S.tiposOrg.filter(t => t !== b.dataset.delOrg); guardar(); render(); });
    const ac = $("#addCp"); if (ac) ac.onclick = () => { const n = $("#ncNom").value.trim(); if (!n) { $("#ncNom").classList.add("bad"); return; } S.contrapartes.push({ id: slug(n), nombre: n, corto: $("#ncCor").value.trim() || n, tipoOrg: $("#ncTipo").value, locacion: $("#ncLoc").value.trim(), zona: $("#ncZona").value, contactos: [] }); guardar(); render(); toast("Institución agregada"); };
    const dj = $("#dlJson"); if (dj) dj.onclick = () => descargar("siva-respaldo.json", JSON.stringify(S, null, 2), "application/json");
    const rs = $("#reset"); if (rs) rs.onclick = () => { adminConfirm = true; render(); };
    const rn = $("#resetNo"); if (rn) rn.onclick = () => { adminConfirm = false; render(); };
    const ro = $("#resetOk"); if (ro) ro.onclick = () => { adminConfirm = false; restablecer(); render(); toast("Datos restablecidos"); };
  }
}

$("#toastUndo").onclick = () => { if (undoFn) { undoFn(); undoFn = null; } $("#toast").classList.remove("show"); };
document.addEventListener("ai-listo", () => { const m = $("#aiModo"); if (m) m.textContent = AI.etiqueta(); $$("[data-ai-tag]").forEach(t => t.textContent = AI.etiqueta()); });
window.addEventListener("hashchange", render);
render();
AI.iniciar();
