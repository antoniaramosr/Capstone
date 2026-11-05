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
  S.vinculos.filter(v => v.traspaso && !v.traspaso.leido && v.traspaso.para === ME.nombre).forEach(v => r.push({ id: "tp-" + v.id + "-" + v.traspaso.fecha, titulo: "Te traspasaron un vínculo", texto: `${v.traspaso.de} te dejó "${v.nombre}" con ${contraparte(v.contraparte).corto}. Lee la hoja de traspaso.`, ir: "#/ficha/" + v.id }));
  mios.filter(puedeEditar).forEach(v => { const sr = sinRespuesta(v); if (sr) r.push({ id: "sr-" + v.id + "-" + sr.dias, titulo: sr.titulo, texto: `"${v.nombre}" con ${contraparte(v.contraparte).corto}: ${sr.texto.charAt(0).toLowerCase() + sr.texto.slice(1)}`, ir: "#/ficha/" + v.id }); });
  const inc = mios.filter(v => completitud(v).pct < 50);
  if (inc.length) r.push({ id: "inc-" + inc.length, titulo: "Datos por completar", texto: `A ${inc.length} ${inc.length === 1 ? "vínculo le faltan" : "vínculos les faltan"} datos importantes de la ficha.`, ir: "#/mis/incompletos" });
  const prio = a => a.id.startsWith("tp-") ? 2 : a.id.startsWith("sr-") ? 1 : 0;
  return r.sort((a, b) => prio(b) - prio(a)).slice(0, 8);
}

// Continuidad del vínculo: si la institución no responde, se avisa para que no
// dependa de una sola persona (un cuestionario sin respuesta por más de 14 días).
const DIAS_SIN_RESPUESTA = 14;
const diasDesde = f => Math.floor((Date.now() - new Date(f + "T12:00:00")) / 86400000);
function sinRespuesta(v) {
  if (v.etapa === 3) return null;
  const pend = v.cuestionarios.filter(q => q.estado === "enviado" && diasDesde(q.fechaEnvio || q.fecha) > DIAS_SIN_RESPUESTA);
  if (!pend.length) return null;
  const dias = Math.max(...pend.map(q => diasDesde(q.fechaEnvio || q.fecha)));
  return { dias, titulo: "Contacto sin respuesta", texto: `${v.contacto.nombre || "La institución"} no ha respondido el cuestionario hace ${dias} días.` };
}

/* Salud del vínculo: verde "Al día" si hubo movimiento en los últimos días y hay
   un contacto alternativo; amarillo "Atender" si falta una de las dos; rojo "Urgente"
   si pasó mucho tiempo sin movimiento. Los plazos están en CONFIG.salud. */
function ultimoMovimiento(v) {
  const f = [...v.reuniones.map(r => r.fecha), ...v.cuestionarios.flatMap(q => [q.fecha, q.fechaEnvio, q.fechaResp]), ...v.versiones.map(x => x.fecha)].filter(Boolean).sort();
  return f.length ? f[f.length - 1] : null;
}
const tieneAlternativo = v => contactosDe(v.contraparte).some(k => k.nombre && k.nombre !== v.contacto.nombre);
function saludDe(v) {
  if (v.etapa === 3) return { k: "cerrado", t: "Cerrado", orden: 3, motivo: "El vínculo terminó." };
  const um = ultimoMovimiento(v), dias = um ? diasDesde(um) : 999, alt = tieneAlternativo(v);
  const mov = um ? `Último movimiento hace ${dias} ${dias === 1 ? "día" : "días"}` : "Sin movimientos registrados";
  if (dias > CONFIG.salud.urgente) return { k: "rojo", t: "Urgente", orden: 0, dias, motivo: `${mov}.` };
  if (dias <= CONFIG.salud.alDia && alt) return { k: "verde", t: "Al día", orden: 2, dias, motivo: `${mov} y hay un contacto alternativo.` };
  return { k: "amarillo", t: "Atender", orden: 1, dias, motivo: `${mov}${alt ? "" : ". Falta un contacto alternativo"}.` };
}
const saludHTML = v => { const x = saludDe(v); return `<span class="salud s-${x.k}" title="${esc(x.motivo)}"><i aria-hidden="true"></i>${x.t}</span>`; };

/* ============================ Shell ============================ */
function megaHTML(k) {
  // Los submenús son cortos: una explicación y pocos enlaces. El detalle está en la página.
  if (k === "mis") {
    const mios = misVinculos();
    const lista = CONFIG.etapas.map((et, i) => `<li><a href="#/mis/etapa-${i}"><b>${et}</b><span class="mini-n">${mios.filter(v => v.etapa === i).length}</span><small>${esc(CONFIG.etapasAyuda[i])}</small></a></li>`).join("");
    return `<div class="mega-intro"><h3>${ME.admin ? "Todos los vínculos" : "Mis vínculos"}</h3><p>${ME.admin ? "Todos los vínculos registrados" : "Los vínculos de " + esc(nombreArea(ME.area))}, ordenados según cómo van. Elige una etapa para ver solo esos.</p><a href="#/mis">Ver la lista completa</a></div><ul class="mega-list">${lista}</ul>`;
  }
  if (k === "areas") {
    const cols = S.areas.filter(a => !a.parent).map(vp => `<div class="mega-col"><h4><a href="#/area/${vp.id}">${esc(vp.nombre)}</a></h4><ul>${hijos(vp.id).map(g => `<li><a href="#/area/${g.id}" class="g">${esc(g.nombre)}${g.id === ME.area ? '<span class="tag-mine">Mi área</span>' : ""}</a></li>`).join("")}</ul></div>`).join("");
    return `<div class="mega-intro"><h3>Áreas</h3><p>Vicepresidencias y gerencias que gestionan vínculos.</p><a href="#/areas">Ver todas las áreas</a></div><div class="mega-cols">${cols}</div>`;
  }
  if (k === "contrapartes") {
    return `<div class="mega-intro"><h3>Instituciones</h3><p>Universidades, centros de formación, OTEC y otras instituciones con las que trabajan las áreas.</p><a href="#/contrapartes">Ver todas (${S.contrapartes.length})</a></div>
      <div class="mega-inst"><input class="input sm" id="megaQ" type="search" placeholder="Buscar institución" aria-label="Buscar institución" autocomplete="off"><p class="lbl2" id="megaCpT">Con más vínculos</p><ul class="mega-list one" id="megaCp">${megaCpLista("")}</ul></div>`;
  }
  if (k === "estudiantes") {
    const cs = convVisibles(), pr = estudiantesDe("practicantes").length, me = estudiantesDe("memoristas").length;
    return `<div class="mega-intro"><h3>Estudiantes</h3><p>Quiénes postulan a tus convocatorias, quiénes están haciendo su práctica o memoria y quiénes ya terminaron.</p><a href="#/estudiantes">Ver a todas y todos</a></div>
      <ul class="mega-list"><li><a href="#/estudiantes/practicantes"><b>Practicantes</b><span class="mini-n">${pr}</span><small>Práctica profesional o de verano</small></a></li><li><a href="#/estudiantes/memoristas"><b>Memoristas</b><span class="mini-n">${me}</span><small>Memoria o proyecto de título</small></a></li><li><a href="#/mis"><b>Convocatorias abiertas</b><span class="mini-n">${cs.filter(c => c.estado === "Abierta").length}</span><small>Se administran desde el vínculo o la lista de Mis vínculos</small></a></li></ul>`;
  }
  return "";
}
// Instituciones del submenú: las que más vínculos tienen o las que coinciden con lo escrito.
function megaCpLista(q) {
  q = (q || "").toLowerCase().trim();
  const filas = S.contrapartes.map(c => ({ c, n: S.vinculos.filter(v => v.contraparte === c.id).length }))
    .filter(r => q ? (r.c.nombre + " " + r.c.corto).toLowerCase().includes(q) : r.n > 0).sort((a, b) => b.n - a.n).slice(0, q ? 8 : 5);
  return filas.length ? filas.map(r => `<li><a href="#/contraparte/${r.c.id}"><b>${esc(r.c.corto)}</b><span class="mini-n">${r.n}</span><small>${esc(r.c.tipoOrg)}</small></a></li>`).join("") : `<li><span class="muted small">No hay instituciones con ese nombre.</span></li>`;
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
const perfilTxt = u => u.admin ? CONFIG.roles.admin.nombre : (u.rol === "jefatura" ? CONFIG.roles.jefatura.nombre + " · " : "") + nombreArea(u.area) + (u.compania ? " · " + compania(u.compania).nombre : "");
const etiquetaEspacioVacio = () => (ESPACIO === "vacio2" ? "Página vacía · Perfil 2" : "Página vacía · Perfil 0");
const usuarioEspacioVacio = u => u.espacio && esEspacioVacio(u.espacio);
// Logo de AMSA; si la imagen no carga, se muestra el nombre en texto.
const logoAmsa = (blanco = false) => `<img class="${blanco ? "brand-logo" : ""}" src="${blanco ? CONFIG.logos.blanco : CONFIG.logos.color}" alt="Antofagasta Minerals" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'logo-txt '+this.className,textContent:'Antofagasta Minerals'}))">`;
const pie = () => `<footer class="foot"><div class="foot-inner">${logoAmsa(true).replace('class="brand-logo"', "")}<span>Prototipo IDI2025 · Grupo 2 · datos de ejemplo</span></div></footer>`;
const vinculosContactables = () => misVinculos().filter(puedeEditar);
// Contactar vive junto a cada contacto (ficha, institución y lista), no en la barra de arriba:
// así el nombre y el correo ya vienen elegidos. Se abre como una ventana al centro.
let contactoPara = null;
function contactShellBits() {
  const edit = vinculosContactables();
  if (!edit.length) return { btn: "", pop: "" };
  const opts = edit.map(v => `<option value="${v.id}">${esc(v.nombre)} · ${esc(contraparte(v.contraparte).corto)}</option>`).join("");
  return {
    btn: "",
    pop: `<div class="pop pop-contact pop-form" id="popContact" role="dialog" aria-modal="true" aria-labelledby="contactPopTit">
      <h5 id="contactPopTit">Escribir a la institución</h5>
      <p class="pop-lead">Arma el mensaje y se abre <b>Outlook en la web</b> con el destinatario y el texto listos. Tú revisas y envías desde tu cuenta corporativa.</p>
      <label class="f" for="contactSel">Vínculo</label>
      <select class="input" id="contactSel">${opts}</select>
      <p class="help contact-to" id="contactTo" aria-live="polite"></p>
      <div class="contact-dup" id="contactDup" hidden></div>
      <label class="f" for="contactMsg">Tu mensaje</label>
      <textarea class="input" id="contactMsg" rows="5" placeholder="Ej.: Queríamos coordinar la fecha de la charla y confirmar cupos…"></textarea>
      <div class="form-actions"><button type="button" class="btn-accent" id="contactGo">Abrir en Outlook</button><button type="button" class="btn-outline" id="contactCancel">Cancelar</button></div>
    </div>`
  };
}
// Otras áreas que ya hablan con la misma institución (para no duplicar el contacto).
const otrasAreasCon = v => [...new Set(S.vinculos.filter(x => x.contraparte === v.contraparte && !misVinculos().includes(x)).map(x => nombreArea(x.area)))];
function hintContactoTo() {
  const sel = $("#contactSel"), hint = $("#contactTo"), dup = $("#contactDup");
  if (!sel || !hint) return;
  const v = vinculo(+sel.value);
  if (!v) { hint.textContent = ""; return; }
  const nom = contactoPara ? contactoPara.nombre : v.contacto.nombre, cor = contactoPara ? contactoPara.correo : v.contacto.correo;
  hint.textContent = cor ? `Para: ${nom ? nom + " · " : ""}${cor}` : "Falta el correo del contacto en la ficha; al continuar te llevamos a completarlo.";
  const as = otrasAreasCon(v);
  if (dup) { dup.hidden = !as.length; dup.innerHTML = as.length ? `<b>Antes de escribir</b>${esc(as.slice(0, 2).join(" y "))}${as.length > 2 ? " y otras áreas" : ""} también ${as.length > 1 ? "trabajan" : "trabaja"} con ${esc(contraparte(v.contraparte).corto)}. Revisa con ${as.length > 1 ? "ellas" : "esa área"} para no duplicar la conversación. <a class="lnk" href="#/contraparte/${v.contraparte}">Ver quién la lleva</a>` : ""; }
}
function abrirFormContacto(vid, para) {
  const pop = $("#popContact");
  if (!pop) return;
  closePops(); cerrarMega();
  contactoPara = para && (para.correo || para.nombre) ? para : null;
  const sel = $("#contactSel");
  if (sel && vid) sel.value = String(vid);
  hintContactoTo();
  const v = sel ? vinculo(+sel.value) : null;
  if (v && otrasAreasCon(v).length) registrarMetrica("duplicados");
  pop.classList.add("show");
  const msg = $("#contactMsg");
  if (msg) msg.focus();
}
function borradorCorreoInst(v, extraMsg, para) {
  const to = ((para ? para.correo : v.contacto.correo) || "").trim();
  const subject = v.nombre + " · Antofagasta Minerals";
  const body = textoCorreoInst(v, extraMsg, para);
  return { to, subject, body };
}
function outlookWebHref(to, subject, body, bcc) {
  const q = { to, subject, body }; if (bcc) q.bcc = bcc;
  // encodeURIComponent deja los espacios como %20 (URLSearchParams los dejaba como "+" y Outlook los mostraba tal cual).
  return "https://outlook.office.com/mail/deeplink/compose?" + Object.entries(q).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}
function abrirOutlookWeb(to, subject, body, bcc) {
  to = (to || "").trim();
  if (!to && !bcc) return false;
  window.open(outlookWebHref(to, subject, body, bcc), "_blank", "noopener,noreferrer");
  return true;
}
function wireContactPop() {
  const sel = $("#contactSel"), msg = $("#contactMsg"), go = $("#contactGo");
  if (!sel) return;
  sel.onchange = () => { contactoPara = null; hintContactoTo(); };
  const no = $("#contactCancel"); if (no) no.onclick = () => closePops();
  if (go) go.onclick = () => {
    const v = vinculo(+sel.value);
    if (!v) return;
    const extra = ((msg || {}).value || "").trim();
    const d = borradorCorreoInst(v, extra, contactoPara);
    if (!d.to) { toast("Agrega el correo del contacto en la ficha."); closePops(); location.hash = "#/editar/" + v.id; return; }
    abrirOutlookWeb(d.to, d.subject, d.body);
    closePops();
    toast("Se abrió Outlook en una pestaña nueva. Inicia sesión si te lo pide y envía el correo.");
  };
}
function shell(active) {
  const contact = contactShellBits();
  const navs = ME.rol === "jefatura"
    ? [{ k: "dashboard", t: "Estadísticas" }, { k: "mis", t: "Vínculos de mi gerencia", mega: 1 }, { k: "contrapartes", t: "Instituciones", mega: 1 }, { k: "metas", t: "Metas" }]
    : [{ k: "mis", t: ME.admin ? "Vínculos" : "Mis vínculos", mega: 1 }, { k: "areas", t: "Áreas", mega: 1 }, { k: "contrapartes", t: "Instituciones", mega: 1 }, { k: "estudiantes", t: "Estudiantes", mega: 1 }, { k: "dashboard", t: "Estadísticas" }];
  if (ME.admin) navs.push({ k: "admin", t: "Configuración" });
  navs.push({ k: "ayuda", t: "Ayuda" });
  const otros = Object.values(CONFIG.usuarios).filter(u => u.id !== ME.id);
  return `
  <header class="top">
    <div class="top-inner">
      <a class="logo" href="${inicioDe(ME)}" aria-label="${CONFIG.app.sigla}, inicio"><span class="logo-chip">${logoAmsa()}</span><span class="prod"><b>${CONFIG.app.sigla}</b><span>${CONFIG.app.nombre}</span></span></a>${esEspacioVacio() ? `<span class="modo-vacio" title="Estás en la página de prueba: lo que registres aquí no se mezcla con los datos de ejemplo">${etiquetaEspacioVacio()}</span>` : ""}
      <nav class="nav" aria-label="Secciones">${navs.map(n => `<div class="nav-item ${active === n.k ? "on" : ""}" data-k="${n.k}" ${n.mega ? 'data-mega="1"' : ""}><a class="nav-btn ${active === n.k ? "active" : ""}" href="#/${n.k}" ${active === n.k ? 'aria-current="page"' : ""}>${n.t}</a>${n.mega ? `<button type="button" class="nav-more" aria-haspopup="true" aria-expanded="false" aria-label="Abrir el submenú de ${esc(n.t)}"><i class="caret"></i></button>` : ""}</div>`).join("")}</nav>
      <div class="top-right">
        ${puedeCrear() ? `<button type="button" class="btn-accent" id="btnAdd" aria-haspopup="true">+ Añadir <i class="caret light"></i></button>` : ""}
        <button class="user" id="btnUser" aria-haspopup="true"><span class="avatar">${ME.inicial}</span><div><b>${esc(ME.nombre)}</b><small>${esc(perfilTxt(ME))}</small></div></button>
      </div>
    </div>
    <div class="mega" id="mega"><div class="mega-inner" id="megaInner"></div></div>
    ${contact.pop}
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

// Los submenús se abren al pasar el mouse por la flecha junto a cada sección (o al hacer clic en ella).
// Hacer clic en el nombre de la sección lleva directo a su página.
function cerrarMega() {
  const m = $("#mega"); if (!m) return;
  m.classList.remove("show");
  $$(".nav-item").forEach(n => { n.classList.remove("open"); const b = n.querySelector(".nav-more"); if (b) b.setAttribute("aria-expanded", "false"); });
}
function wireShell() {
  const mega = $("#mega"), inner = $("#megaInner");
  let openK = null;
  const close = () => { cerrarMega(); openK = null; };
  let cierre = null;
  const cierraLuego = () => { clearTimeout(cierre); cierre = setTimeout(close, 220); };
  mega.onmouseenter = () => clearTimeout(cierre);
  mega.onmouseleave = cierraLuego;
  const open = (k, item) => {
    close(); closePops();
    inner.innerHTML = megaHTML(k);
    item.classList.add("open"); item.querySelector(".nav-more").setAttribute("aria-expanded", "true");
    mega.classList.add("show"); openK = k;
    const mq = $("#megaQ");
    if (mq) mq.oninput = () => { $("#megaCp").innerHTML = megaCpLista(mq.value); $("#megaCpT").textContent = mq.value.trim() ? "Resultados" : "Con más vínculos"; };
  };
  $$(".nav-item").forEach(item => {
    const k = item.dataset.k, a = item.querySelector("a"), more = item.querySelector(".nav-more");
    if (more) {
      more.onclick = e => { e.stopPropagation(); openK === k ? close() : open(k, item); };
      more.addEventListener("mouseenter", () => { clearTimeout(cierre); if (openK !== k) open(k, item); });
      more.addEventListener("keydown", e => { if (e.key === "ArrowDown") { e.preventDefault(); if (openK !== k) open(k, item); const f = mega.querySelector("a, input"); if (f) f.focus(); } });
    }
    item.addEventListener("mouseleave", () => { if (openK === k) cierraLuego(); });
    item.addEventListener("mouseenter", () => clearTimeout(cierre));
    a.addEventListener("click", e => {
      close(); if (k === "mis") { filtro.etapa = -1; filtro.inc = false; }
      if (location.hash === "#/" + k) { e.preventDefault(); filtro.etapa = -1; render(); }
    });
  });
  mega.addEventListener("click", e => { if (e.target.closest("a")) close(); });
  const ba = $("#btnAdd"); if (ba) ba.onclick = e => { e.stopPropagation(); close(); togglePop("#popAdd"); };
  const bu = $("#btnUser");
  if (bu) bu.onclick = e => { e.stopPropagation(); close(); togglePop("#popUser"); };
  wireContactPop();
  $$("[data-cambiar]").forEach(b => b.onclick = () => { const id = b.dataset.cambiar; iniciarSesion(id, !CONFIG.usuarios[id].espacio); filtro.comp = ""; location.hash = inicioDe(ME); render(); });
  const vac = $("#vaciar"); if (vac) vac.onclick = () => { const antes = JSON.stringify(S); restablecer(); closePops(); location.hash = inicioDe(ME); render(); toast("Página de prueba vacía otra vez", () => { S = JSON.parse(antes); guardar(); render(); }); };
  $("#salir").onclick = () => { cerrarSesion(); location.hash = "#/login"; render(); };
}
function closePops() { $$(".pop").forEach(p => p.classList.remove("show")); }
// El menú de usuario se abre justo bajo su botón, alineado a su borde derecho.
const BTN_DE_POP = { popUser: "#btnUser", popAdd: "#btnAdd" };
function ubicarPop(p) {
  const b = $(BTN_DE_POP[p.id] || ""); if (!b || window.innerWidth <= 760) { p.style.right = ""; return; }
  p.style.right = Math.max(8, document.documentElement.clientWidth - b.getBoundingClientRect().right) + "px";
}
function togglePop(sel) { const p = $(sel), was = p.classList.contains("show"); closePops(); if (!was) { ubicarPop(p); p.classList.add("show"); } }
function abrirAviso(id, ir) { if (!S.leidos.includes(id)) S.leidos.push(id); if (id.startsWith("cx-")) registrarMetrica("duplicados"); guardar(); closePops(); if (location.hash === ir) render(); else location.hash = ir; }
document.addEventListener("click", e => {
  const ic = e.target.closest("[data-ir-conv]");
  if (ic) { e.preventDefault(); const enMis = /^#\/mis(\/convocatorias)?$/.test(location.hash) || location.hash === ""; if (enMis && $("#tablaConv")) $("#tablaConv").scrollIntoView({ behavior: "smooth", block: "start" }); else { irConv = true; if (location.hash === "#/mis") render(); else location.hash = "#/mis"; } }
});
document.addEventListener("click", e => { if (!e.target.closest(".pop")) closePops(); if (!e.target.closest(".mega, .nav-more")) cerrarMega(); });
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("f-sec")) { d.open ? fCerradas.delete(d.id) : fCerradas.add(d.id); } }, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closePops(); cerrarMega(); cerrarAsistente(); } });

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

/* Tarjeta plegable: título, contador y contenido. Baja el ruido visual. */
const fold = (titulo, cnt, cuerpo, abierta = false, extra = "") => `<details class="card fold" ${abierta ? "open" : ""}><summary><span class="fold-t">${titulo}</span>${cnt != null ? `<span class="fold-n">${cnt}</span>` : ""}${extra ? `<span class="fold-x">${extra}</span>` : ""}</summary><div class="fold-b">${cuerpo}</div></details>`;

/* ============================ Mis vínculos ============================ */
let filtro = { etapa: -1, tipo: "", q: "", inc: false, comp: "", orden: "reciente", anio: "", agrupar: false, salud: "" };
const ORDENES = { salud: "salud (urgentes primero)", reciente: "fecha de inicio, más reciente", antiguo: "fecha de inicio, más antigua", nombre: "nombre (A-Z)", etapa: "etapa" };
function ordenar(list) {
  const f = v => v.inicio || (filtro.orden === "antiguo" ? "9999" : "0000");
  const by = { reciente: (a, b) => f(b).localeCompare(f(a)), antiguo: (a, b) => f(a).localeCompare(f(b)), nombre: (a, b) => (a.nombre + contraparte(a.contraparte).corto).localeCompare(b.nombre + contraparte(b.contraparte).corto), etapa: (a, b) => a.etapa - b.etapa || f(b).localeCompare(f(a)), salud: (a, b) => saludDe(a).orden - saludDe(b).orden || (saludDe(b).dias || 0) - (saludDe(a).dias || 0) }[filtro.orden] || (() => 0);
  return list.slice().sort(by);
}
/* Encabezado de color de cada página: migas ("Estás en"), título, descripción corta y acciones.
   Si la página tiene tarjetas de resumen, estas quedan montadas sobre el borde del encabezado. */
const hero = (titulo, sub, o = {}) => `<div class="hero ${o.cards ? "hero-cards" : ""}">${o.crumbs ? `<div class="crumbs">${o.crumbs}</div>` : ""}<div class="hero-row"><div><h1>${titulo}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>${o.acciones ? `<div class="hero-acts">${o.acciones}</div>` : ""}</div></div>`;
const anioDe = v => (v.inicio || "").slice(0, 4) || "Sin fecha";
const LEYENDA_TABLA = `<div class="leyenda-tabla"><b class="ley-t">Cómo leer la tabla</b><div class="ley-grid">
  <div class="ley-it"><span class="ley-ic"><span class="dots"><i></i><i></i><i></i><i class="off"></i><i class="off"></i></span></span><p><b>Calificación</b>Qué tan bien resultó el vínculo, de 1 a 5. La pone el área.</p></div>
  <div class="ley-it"><span class="ley-ic"><span class="prog sm"><i style="width:60%"></i></span></span><p><b>Avance</b>Qué parte del plan de trabajo ya se hizo.</p></div>
  <div class="ley-it"><span class="ley-ic"><span class="ley-fila"></span></span><p><b>Fila amarilla</b>Vínculo que conviene atender.</p></div></div></div>`;
function filasVinculos(list, opts = {}) {
  if (!list.length) return `<div class="empty">${opts.vacio || "No hay vínculos para mostrar."}</div>`;
  const mailCol = opts.mail !== false && vinculosContactables().length;
  const ncol = 6 + (opts.area ? 1 : 0) + (mailCol ? 1 : 0);
  const fila = v => {
    const c = contraparte(v.contraparte), comp = completitud(v), pr = progreso(v), sal = saludDe(v);
    const falta = comp.pct < 50 ? `<small class="falta" title="Falta: ${esc(comp.faltan.join(", "))}">Faltan ${comp.faltan.length} datos de la ficha</small>` : "";
    const mail = mailCol && puedeEditar(v) ? `<button type="button" class="link-btn" data-contact-v="${v.id}" data-contact-n="${esc(v.contacto.nombre)}" data-contact-c="${esc(v.contacto.correo)}" title="${esc(v.contacto.nombre ? "Escribirle a " + v.contacto.nombre : "Escribir a la institución")}">Contactar</button>` : "";
    return `<tr class="row ${sal.k === "rojo" || sal.k === "amarillo" ? "atender" : ""}" data-ficha="${v.id}" tabindex="0"><td><span class="t">${esc(v.nombre)}</span> <span class="anio" title="Año de inicio">${anioDe(v)}</span><small>${esc(tipo(v.tipo).nombre)} ${compTag(compsDe(v))}${v.inicio ? `<span class="fecha-row">desde ${fechaTxt(v.inicio)}</span>` : ""}</small></td><td>${esc(c.corto)}<small>${esc(v.sede)}</small></td>${opts.area ? `<td><small style="color:var(--ink)">${esc(nombreArea(v.area))}</small></td>` : ""}<td data-l="Salud">${saludHTML(v)}<small class="salud-m">${esc(sal.motivo)}</small></td><td>${pill(v.etapa, v.tipo)}</td><td data-l="Avance"><span class="pcell">${barra(pr)}<b>${pr}%</b></span>${falta}</td><td data-l="Calificación">${dots(v.calif)}${v.calif ? ` <span class="muted small">${num1(v.calif)}</span>` : ""}</td>${mailCol ? `<td data-l="Contactar" class="td-mail">${mail}</td>` : ""}</tr>`;
  };
  let cuerpo;
  if (opts.agrupar) {
    const anios = [...new Set(list.map(anioDe))].sort((a, b) => filtro.orden === "antiguo" ? a.localeCompare(b) : b.localeCompare(a));
    cuerpo = anios.map(a => { const l = list.filter(v => anioDe(v) === a); return `<tr class="grupo-anio"><td colspan="${ncol}"><b>${a}</b> · ${l.length} ${l.length === 1 ? "vínculo" : "vínculos"} · ${l.filter(v => v.etapa < 3).length} vigentes</td></tr>${l.map(fila).join("")}`; }).join("");
  } else cuerpo = list.map(fila).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Vínculo</th><th>Institución</th>${opts.area ? "<th>Área</th>" : ""}<th>Salud</th><th>Etapa</th><th>Avance</th><th title="Qué tan bien resultó el vínculo, de 1 a 5">Calificación</th>${mailCol ? "<th>Contactar</th>" : ""}</tr></thead><tbody>${cuerpo}</tbody></table></div>${LEYENDA_TABLA}`;
}
function listaFiltrada() {
  const q = filtro.q.toLowerCase();
  return ordenar(misVinculos().filter(v => (!filtro.comp || compsDe(v).includes(filtro.comp)) && (!filtro.anio || anioDe(v) === filtro.anio) && (!filtro.salud || saludDe(v).k === filtro.salud) && (filtro.etapa < 0 || v.etapa === filtro.etapa) && (!filtro.tipo || v.tipo === filtro.tipo) && (!filtro.inc || completitud(v).pct < 50) &&
    (!q || (v.nombre + " " + contraparte(v.contraparte).nombre + " " + contraparte(v.contraparte).corto + " " + v.sede).toLowerCase().includes(q))));
}
const opcionesTabla = () => ({ area: ME.admin || hijos(ME.area).length, agrupar: filtro.agrupar, vacio: "No hay vínculos con estos filtros." });
let irConv = false;
function vMis(p) {
  if (p === "incompletos") filtro.inc = true;
  if (p && p.startsWith("etapa-")) { filtro.etapa = +p.slice(6); filtro.inc = false; }
  const mios = misVinculos();
  const misCp = [...new Set(mios.map(v => v.contraparte))];
  const av = calcAvisos();
  if (!mios.length && !ME.admin) return vBienvenida();
  const activos = mios.filter(v => v.etapa < 3).length, sinCal = mios.filter(v => v.etapa === 3 && !v.calif).length;
  const incom = mios.filter(v => completitud(v).pct < 50).length, convA = S.convocatorias.filter(c => c.estado === "Abierta" && (ME.admin || descendientes(ME.area).includes(convArea(c)))).length;
  const nInst = misCp.length, comp = misCp.filter(cp => S.vinculos.some(v => v.contraparte === cp && !mios.includes(v))).length;
  const otrasTab = p === "otras" && !ME.admin;
  const vista = otrasTab ? "otras" : p === "convocatorias" ? "conv" : !p || p === "inicio" ? "inicio" : "vinc";
  const nConv = convVisibles().length;
  const nOtras = ME.admin ? 0 : [...new Set(S.vinculos.filter(v => !mios.includes(v)).map(v => v.contraparte))].length;
  const titulo = ME.admin ? "Todos los vínculos" : ME.rol === "jefatura" ? "Vínculos de mi gerencia" : "Mis vínculos";
  const head = hero(titulo, ME.admin ? "Aquí ves todos los vínculos registrados en SIVA." : "Aquí ves y gestionas los vínculos de tu área con universidades e instituciones. <span class=\"hero-ruta\">" + rutaTxt(ME.area) + "</span>", { cards: true }) + `
  <div class="resumen" role="region" aria-label="Resumen">
    <div><b>${mios.length}</b><span>vínculos con ${nInst} instituciones</span></div>
    <div><b>${activos}</b><span>activos (no cerrados)</span></div>
    <button class="r-link" data-ir-f="inc"><b>${incom}</b><span>con datos por completar</span></button>
    <div><b>${sinCal}</b><span>cerrados sin calificar</span></div>
    ${ME.admin ? `<div><b>${convA}</b><span>convocatorias abiertas</span></div>` : `<a class="r-link" href="#/mis/otras"><b>${comp}</b><span>instituciones compartidas con otras áreas</span></a>`}
  </div>
  <div class="tabs" role="tablist">${[["inicio", "#/mis", "Inicio"], ["vinc", "#/mis/vinculos", (ME.admin ? "Todos los vínculos" : "Vínculos") + " (" + mios.length + ")"], ["conv", "#/mis/convocatorias", "Convocatorias (" + nConv + ")"]].concat(ME.admin ? [] : [["otras", "#/mis/otras", "Con otras áreas (" + nOtras + " instituciones)"]]).map(([k, h, t]) => `<a class="tab ${vista === k ? "on" : ""}" href="${h}" role="tab" aria-selected="${vista === k}">${t}</a>`).join("")}</div>`;
  if (otrasTab) return head + vOtrasAreas(mios, misCp);
  if (vista === "conv") return head + convTablaHTML();
  if (vista === "inicio") {
    const rk = { rojo: 0, amarillo: 1, verde: 2, cerrado: 3 }, abiertos = mios.filter(v => v.etapa < 3).sort((x, y) => rk[saludDe(x).k] - rk[saludDe(y).k]), nCer = mios.length - abiertos.length;
    const avV = av.slice(0, 3), avM = av.slice(3), avH = a => `<button class="aviso ${S.leidos.includes(a.id) ? "read" : ""}" data-aviso="${a.id}" data-ir="${a.ir}"><b>${esc(a.titulo)}</b>${esc(a.texto)}</button>`;
    return head + resumenSemanaHTML(mios) + `<div class="grid-main"><div>
      <div class="card" id="tablaMis"><div class="tabla-acts"><div><p class="card-title" style="margin:0">Vínculos abiertos</p><span class="muted small">${abiertos.length} ${abiertos.length === 1 ? "vínculo en curso" : "vínculos en curso"}. Haz clic en una fila para abrir su ficha.</span></div><span class="tabla-btns">${nCer ? `<a class="lnk" href="#/mis/vinculos">Ver historial (${nCer} ${nCer === 1 ? "cerrado" : "cerrados"}) →</a>` : ""}${puedeCrear() ? `<button type="button" class="btn-accent sm" data-abrir-add aria-haspopup="true">+ Añadir vínculo</button>` : ""}</span></div>${filasVinculos(abiertos, { ...opcionesTabla(), agrupar: false, vacio: "No tienes vínculos abiertos." })}</div>
      ${convTablaHTML(true)}
    </div>
    <aside class="stack">
      ${fold("Avisos", av.length, av.length ? avV.map(avH).join("") + (avM.length ? `<details class="mas"><summary>Ver ${avM.length} ${avM.length === 1 ? "aviso más" : "avisos más"}</summary>${avM.map(avH).join("")}</details>` : "") : `<p class="muted small">No tienes avisos.</p>`, true)}
    </aside></div>`;
  }
  const anios = [...new Set(mios.map(anioDe))].sort().reverse();
  const avVis = av.slice(0, 3), avMas = av.slice(3);
  const avHTML = a => `<button class="aviso ${S.leidos.includes(a.id) ? "read" : ""}" data-aviso="${a.id}" data-ir="${a.ir}"><b>${esc(a.titulo)}</b>${esc(a.texto)}</button>`;
  return head + `<div class="grid-main"><div>
    <div class="filters">
      <div class="chips">${["Todos", ...CONFIG.etapas].map((t, i) => `<button class="chip-btn ${filtro.etapa === i - 1 ? "on" : ""}" data-etapa-f="${i - 1}">${t} (${i ? mios.filter(v => v.etapa === i - 1).length : mios.length})</button>`).join("")}</div>
      <div class="frow"><input class="input sm" id="fq" placeholder="Buscar vínculo o institución" value="${esc(filtro.q)}" aria-label="Buscar">
      <select class="input sm" id="fo" aria-label="Ordenar">${Object.entries(ORDENES).map(([k, t]) => `<option value="${k}" ${filtro.orden === k ? "selected" : ""}>Ordenar: ${t}</option>`).join("")}</select>
      <select class="input sm" id="fa" aria-label="Año de inicio"><option value="">Todos los años</option>${anios.map(a => `<option ${filtro.anio === a ? "selected" : ""}>${a}</option>`).join("")}</select>
      <select class="input sm" id="fs" aria-label="Salud del vínculo"><option value="">Toda la salud</option>${[["verde", "Al día"], ["amarillo", "Atender"], ["rojo", "Urgente"], ["cerrado", "Cerrado"]].map(([k, t]) => `<option value="${k}" ${filtro.salud === k ? "selected" : ""}>${t} (${mios.filter(v => saludDe(v).k === k).length})</option>`).join("")}</select>
      <select class="input sm" id="fc" aria-label="Compañía"><option value="">Todas las compañías</option>${S.companias.map(c => `<option value="${c.id}" ${filtro.comp === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select>
      <select class="input sm" id="ft" aria-label="Tipo de vínculo"><option value="">Todos los tipos</option>${S.tipos.map(t => `<option value="${t.id}" ${filtro.tipo === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select>
      <label class="chk"><input type="checkbox" id="fag" ${filtro.agrupar ? "checked" : ""}> Agrupar por año</label>
      <label class="chk"><input type="checkbox" id="finc" ${filtro.inc ? "checked" : ""}> Con datos por completar</label></div>
    </div>
    <div class="card" id="tablaMis">${puedeCrear() ? `<div class="tabla-acts"><span class="muted small">Historial completo: abiertos y cerrados. Haz clic en una fila para abrir su ficha.</span><button type="button" class="btn-accent sm" data-abrir-add aria-haspopup="true">+ Añadir vínculo</button></div>` : ""}<div id="tablaMisCuerpo">${filasVinculos(listaFiltrada(), opcionesTabla())}</div></div>
  </div>
  <aside class="stack">
    ${fold("Avisos", av.length, av.length ? avVis.map(avHTML).join("") + (avMas.length ? `<details class="mas"><summary>Ver ${avMas.length} ${avMas.length === 1 ? "aviso más" : "avisos más"}</summary>${avMas.map(avHTML).join("")}</details>` : "") : `<p class="muted small">No tienes avisos.</p>`, true)}
  </aside></div>`;
}

/* Resumen de la semana. Sin servidor no se puede mandar solo: se muestra al
   entrar y el botón abre Outlook con el texto listo. */
function datosSemana(mios) {
  const rojos = mios.filter(v => saludDe(v).k === "rojo");
  const cierran = S.convocatorias.filter(c => c.estado === "Abierta" && (ME.admin || descendientes(ME.area).includes(convArea(c))) && c.cierre && diasDesde(c.cierre) <= 0 && diasDesde(c.cierre) >= -14);
  const sinResp = mios.flatMap(v => v.cuestionarios.filter(q => q.estado === "enviado").map(q => ({ v, q })));
  return { rojos, cierran, sinResp };
}
function textoSemana(mios) {
  const d = datosSemana(mios);
  return [`Hola ${ME.nombre}:`, "", "Tu resumen de la semana en SIVA.", "",
    `Vínculos urgentes (${d.rojos.length}):`, ...(d.rojos.length ? d.rojos.map(v => `- ${v.nombre} con ${contraparte(v.contraparte).corto}: ${saludDe(v).motivo}`) : ["- Ninguno"]), "",
    `Convocatorias que cierran en las próximas dos semanas (${d.cierran.length}):`, ...(d.cierran.length ? d.cierran.map(c => `- ${c.titulo}: cierra el ${fechaTxt(c.cierre)}, ${c.postulantes.length} postulantes`) : ["- Ninguna"]), "",
    `Cuestionarios sin respuesta (${d.sinResp.length}):`, ...(d.sinResp.length ? d.sinResp.map(({ v, q }) => `- ${contraparte(v.contraparte).corto}, "${v.nombre}": enviado el ${fechaTxt(q.fechaEnvio || q.fecha)}`) : ["- Ninguno"]), "",
    `Ver en SIVA: ${location.href.split("#")[0]}#/mis`].join("\n");
}
function resumenSemanaHTML(mios) {
  const d = datosSemana(mios), tot = d.rojos.length + d.cierran.length + d.sinResp.length;
  const col = (t, items, vacio) => `<div class="sem-col"><p class="lbl2">${t} <span class="fold-n">${items.length}</span></p>${items.length ? items.slice(0, 4).join("") + (items.length > 4 ? `<p class="muted small">y ${items.length - 4} más</p>` : "") : `<p class="muted small">${vacio}</p>`}</div>`;
  return fold("Resumen de la semana", tot, `<div class="sem">
    ${col("Vínculos urgentes", d.rojos.map(v => `<a class="mini-row" href="#/ficha/${v.id}"><b>${esc(v.nombre)}</b><span>${esc(contraparte(v.contraparte).corto)} · ${esc(saludDe(v).motivo)}</span></a>`), "Ningún vínculo urgente.")}
    ${col("Convocatorias que cierran pronto", d.cierran.map(c => `<a class="mini-row" href="#/convocatoria/${c.id}"><b>${esc(c.titulo)}</b><span>Cierra el ${fechaTxt(c.cierre)} · ${c.postulantes.length} postulantes</span></a>`), "Ninguna cierra en las próximas dos semanas.")}
    ${col("Cuestionarios sin respuesta", d.sinResp.map(({ v, q }) => `<a class="mini-row" href="#/ficha/${v.id}"><b>${esc(contraparte(v.contraparte).corto)}</b><span>${esc(v.nombre)} · enviado el ${fechaTxt(q.fechaEnvio || q.fecha)}</span></a>`), "No hay cuestionarios pendientes.")}
  </div><div class="sem-acts"><button class="btn-outline" id="semMail">Enviarme este resumen</button><span class="help">Abre Outlook con el resumen listo para ${esc(ME.correo)}. En el prototipo el envío semanal automático se simula con este botón.</span></div>`, true, d.rojos.length ? d.rojos.length + (d.rojos.length === 1 ? " urgente" : " urgentes") : "todo al día");
}

/* Vínculos con otras áreas: mis instituciones que también trabajan con otras
   áreas, y las instituciones con que trabajan otras áreas y yo todavía no. */
function vOtrasAreas(mios, misCp) {
  const otros = S.vinculos.filter(v => !mios.includes(v));
  const fila = v => `<a class="o-row" href="#/ficha/${v.id}"><span><b>${esc(v.nombre)}</b><small>${esc(nombreArea(v.area))}${v.responsable ? " · lo lleva " + esc(v.responsable) : ""}</small></span>${pill(v.etapa, v.tipo)}</a>`;
  const grupo = (cp, lista, mias) => { const c = contraparte(cp), as = [...new Set(lista.map(v => v.area))];
    return `<details class="o-inst"><summary><span><b>${esc(c.nombre)}</b><small>${esc(c.tipoOrg)}${c.zona ? " · zona " + esc(c.zona) : ""}</small></span><span class="o-n">${as.length} ${as.length === 1 ? "área" : "áreas"} · ${lista.length} ${lista.length === 1 ? "vínculo" : "vínculos"}</span></summary>
      <div class="o-body">${mias ? `<p class="lbl2">Mis vínculos con esta institución</p>${mias.map(v => `<a class="tag" href="#/ficha/${v.id}">${esc(v.nombre)}</a>`).join(" ")}<p class="lbl2" style="margin-top:10px">De otras áreas</p>` : ""}${lista.map(fila).join("")}
      <div class="o-acts"><a class="lnk small" href="#/contraparte/${cp}">Ver la institución completa</a></div></div></details>`; };
  const comp = misCp.map(cp => ({ cp, l: otros.filter(v => v.contraparte === cp) })).filter(r => r.l.length).sort((a, b) => b.l.length - a.l.length);
  const nuevas = [...new Set(otros.map(v => v.contraparte))].filter(cp => !misCp.includes(cp)).map(cp => ({ cp, l: otros.filter(v => v.contraparte === cp) })).sort((a, b) => b.l.length - a.l.length);
  return `<div class="o-sec"><h2 class="h-sec">Mis instituciones que también trabajan con otras áreas <span class="fold-n">${comp.length}</span></h2>
    <p class="sub">Antes de escribirle a una de estas instituciones, revisa quién más la contacta para no duplicar conversaciones.</p>
    ${comp.length ? `<div class="card o-list">${comp.map(r => grupo(r.cp, r.l, mios.filter(v => v.contraparte === r.cp))).join("")}</div>` : `<div class="card empty">Ninguna otra área trabaja con tus instituciones.</div>`}</div>
  <div class="o-sec"><h2 class="h-sec">Instituciones de otras áreas con las que yo no trabajo <span class="fold-n">${nuevas.length}</span></h2>
    <p class="sub">Contactos que ya existen en AMSA. Si te sirve alguna, pídele el contacto al área que la lleva.</p>
    ${nuevas.length ? `<div class="card o-list">${nuevas.map(r => grupo(r.cp, r.l)).join("")}</div>` : `<div class="card empty">No hay otras instituciones.</div>`}</div>`;
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
const contactarBtn = (vid, nombre, correo) => vid && (nombre || correo) ? `<button type="button" class="link-btn contactar" data-contact-v="${vid}" data-contact-n="${esc(nombre)}" data-contact-c="${esc(correo)}">Contactar${nombre ? " a " + esc(nombre.split(" ")[0]) : ""}</button>` : "";
const kv = (k, val, html) => `<dt>${k}</dt><dd class="${val ? "" : "ph"}">${val ? (html ? val : esc(val).replace(/\n/g, "<br>")) : "No definido"}</dd>`;
const fCerradas = new Set();
const fAb = id => fCerradas.has(id) ? "" : "open";
function contactoCard(k, vid, principal) {
  const ini = ((k.nombre || "?").trim()[0] || "?").toUpperCase();
  return `<div class="cc ${principal ? "main" : ""}"><div class="cc-head"><span class="cc-av" aria-hidden="true">${esc(ini)}</span><div class="cc-id"><b>${esc(k.nombre || "Contacto")}</b>${k.cargo ? `<span class="cc-role">${esc(k.cargo)}</span>` : ""}${principal ? `<span class="cc-badge">Contacto principal</span>` : ""}</div></div>
    ${k.correo || k.telefono ? `<div class="cc-lines">${k.correo ? `<div class="cc-line"><span class="cc-l">Correo</span><a class="mail" href="mailto:${esc(k.correo)}">${esc(k.correo)}</a></div>` : ""}${k.telefono ? `<div class="cc-line"><span class="cc-l">Teléfono</span><a class="mail" href="tel:${esc(k.telefono.replace(/\s/g, ""))}">${esc(k.telefono)}</a></div>` : ""}</div>` : ""}
    ${contactarBtn(vid, k.nombre, k.correo)}</div>`;
}
function vFicha(id) {
  const v = vinculo(+id);
  if (!v) return `<div class="card empty">Ese vínculo no existe.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver</button></div>`;
  const c = contraparte(v.contraparte), ed = puedeEditar(v), comp = completitud(v), pr = progreso(v);
  const otras = S.vinculos.filter(x => x.contraparte === v.contraparte && x.area !== v.area);
  const fin = v.financiamiento, hechos = v.hitos.filter(h => h.ok).length;
  const resp = v.cuestionarios.filter(q => q.estado === "respondido" && +q.respuestas[0]);
  const satis = resp.length ? resp.reduce((s, q) => s + (+q.respuestas[0] || 0), 0) / resp.length : null;
  const evalVisible = !!v.calif || evaluando === v.id;
  const crits = criteriosDe(v.tipo, v.contraparte), cv = v.criterios || {};
  const otrosCont = contactosDe(v.contraparte).filter(k => k.nombre !== v.contacto.nombre).slice(0, 3);
  const sinResp = sinRespuesta(v);
  return `<div class="crumbs"><a href="#/mis">${ME.admin ? "Vínculos" : "Mis vínculos"}</a> / ${rutaArea(v.area).map(a => `<a href="#/area/${a.id}">${esc(a.nombre)}</a>`).join(" / ")} / ${esc(v.nombre)}</div>
  <div class="head-row"><div><h1>${esc(v.nombre)}</h1><p class="sub"><a href="#/contraparte/${c.id}" class="lnk">${esc(c.nombre)}</a>${v.sede ? ", " + esc(v.sede) : ""} · ${esc(tipo(v.tipo).nombre)} · ${compTag(compsDe(v))}</p></div>
    <div><div class="stepper">${CONFIG.etapas.map((e, i) => `${i ? '<i class="bar"></i>' : ""}<button class="step ${i === v.etapa ? "cur" : i < v.etapa ? "done" : ""}" data-etapa="${i}" ${ed ? "" : "disabled"} title="${esc(e + ": " + etapaAyuda(i, v.tipo))}"><span>${i < v.etapa ? "✓" : i + 1}</span>${e}</button>`).join("")}</div>
    <p class="etapa-ayuda">${CONFIG.etapas[v.etapa]}: ${esc(etapaAyuda(v.etapa, v.tipo).toLowerCase())}</p></div></div>
  ${v.traspaso && !v.traspaso.leido ? hojaTraspasoHTML(v, true) : ""}
  ${ed ? "" : `<div class="banner">Este vínculo lo edita ${esc(nombreArea(v.area))}. Puedes verlo completo; si necesitas cambiar algo, escríbele a ${esc(v.responsable || "esa área")}.</div>`}
  <div class="statbar">
    <div><span class="lbl">Avance del plan de trabajo</span><span class="pcell">${barra(pr)}<b>${pr}%</b></span><span class="faltan">${hechos} de ${v.hitos.length} tareas hechas</span></div>
    ${comp.faltan.length ? `<div><span class="lbl">Datos por completar</span><span class="faltan" style="margin-top:0">${comp.faltan.join(", ")}</span></div>` : `<div><span class="lbl">Ficha</span><span class="faltan" style="margin-top:0">Todos los datos importantes están completos</span></div>`}
    <div class="actions">${ed ? `<button class="btn-outline" onclick="location.hash='#/editar/${v.id}'">Editar o eliminar</button><button class="btn-accent" onclick="abrirAsistente(${v.id},'reunion')">Actualizar con IA</button><button class="btn-outline" onclick="abrirAsistente(${v.id},'cuestionario')">Pedir feedback</button>${evalVisible ? "" : `<button class="btn-outline" onclick="abrirEvaluacion(${v.id})">Evaluar vínculo</button>`}<button class="btn-outline" onclick="abrirTraspaso(${v.id})">Cambiar encargado/a</button>` : ""}<button class="btn-outline" id="dlReadme">Descargar ficha</button></div>
  </div>
  <nav class="ficha-nav" aria-label="Secciones de la ficha"><button type="button" data-scroll="f-vinculo">El vínculo</button><button type="button" data-scroll="f-personas">Personas</button><button type="button" data-scroll="f-seg">Seguimiento</button>${evalVisible ? `<button type="button" data-scroll="f-eval">Evaluación</button>` : ""}<span class="ficha-nav-r"><button type="button" class="link-btn" data-fsec-todo="1">Abrir todo</button><button type="button" class="link-btn" data-fsec-todo="0">Plegar todo</button></span></nav>
  <details class="f-sec" id="f-vinculo" ${fAb("f-vinculo")}><summary class="f-h"><span>1</span><div>El vínculo<small>Qué se busca lograr y cómo va el trabajo</small></div><i class="chev" aria-hidden="true"></i></summary><div class="f-body">
    <div class="f-grid2">
    <div class="card"><p class="card-title">Ficha del vínculo</p><dl class="kv">
      ${kv("Objetivo", v.objetivo)}
      ${kv("Metas a las que busca aportar", metasDe(v).map(m => `<span class="tag">${esc(m)}</span>`).join(""), true)}
      ${kv("Alcance", v.alcance)}
      ${kv("Financiamiento", fin.tipo === "No definido" ? "" : fin.tipo + (fin.fuente ? " (" + fin.fuente + ")" : "") + (fin.monto ? ". Monto aproximado: " + fin.monto : ""))}
      ${kv("Fechas", v.inicio ? fechaTxt(v.inicio) + (v.termino ? " al " + fechaTxt(v.termino) : ", sin fecha de término") : "")}
      ${kv("Comentarios adicionales", v.comentarios)}</dl></div>
          <div class="card plan"><div class="head-row"><p class="card-title" style="margin:0">Plan de trabajo</p><span class="pcell">${barra(pr)}<b>${hechos} de ${v.hitos.length}</b></span></div>
      <p class="help" style="margin:4px 0 6px">Marca las tareas a medida que se cumplen: el avance se calcula solo.</p>
      ${v.hitos.map((h, i) => `<label class="hito ${h.ok ? "ok" : ""}"><input type="checkbox" data-hito="${i}" ${h.ok ? "checked" : ""} ${ed ? "" : "disabled"}><span>${esc(h.t)}</span></label>`).join("") || `<p class="muted small">Sin tareas.</p>`}
      ${ed ? `<div class="inline-form"><input class="input" id="nuevoHito" placeholder="Agregar una tarea" aria-label="Nueva tarea"><button class="btn-outline" id="addHito">Agregar</button></div>` : ""}</div>
    </div>
  </div></details>
  <details class="f-sec" id="f-personas" ${fAb("f-personas")}><summary class="f-h"><span>2</span><div>Personas<small>Quién está de cada lado: la institución y Antofagasta Minerals</small></div><i class="chev" aria-hidden="true"></i></summary><div class="f-body">
    <div class="f-grid3">
    <div class="card side"><p class="card-title">La institución</p><h4><a class="lnk" href="#/contraparte/${c.id}">${esc(c.nombre)}</a></h4><p>${esc(c.tipoOrg)}${v.sede ? ", " + esc(v.sede) : ""}</p>
      ${sinResp ? `<div class="alerta-cont"><b>${esc(sinResp.titulo)}</b><span>${esc(sinResp.texto)}</span>${otrosCont.length ? `<span>Puedes escribirle a otro contacto de la institución (abajo) para que el vínculo no dependa de una sola persona.</span>` : ed ? `<span>Agrega un segundo contacto en la ficha para que el vínculo no dependa de una sola persona.</span>` : ""}</div>` : ""}
      ${otras.length ? `<details class="note dd"><summary><b>${[...new Set(otras.map(x => x.area))].length} ${[...new Set(otras.map(x => x.area))].length === 1 ? "otra área trabaja" : "otras áreas trabajan"} con esta institución</b></summary>${otras.slice(0, 6).map(x => `<a href="#/ficha/${x.id}"><b>${esc(nombreArea(x.area))}</b>${esc(x.nombre)} · ${CONFIG.etapas[x.etapa]}${x.responsable ? `<br><span class="muted">Lo lleva: ${esc(x.responsable)}</span>` : ""}</a>`).join("")}</details>` : ""}</div>
    <div class="card side"><p class="card-title">Contactos en la institución</p>
      <p class="help" style="margin:0 0 12px">Personas de ${esc(c.corto || c.nombre)} con quienes se trabaja este vínculo.</p>
      <div class="cc-grid">${v.contacto.nombre || v.contacto.cargo || v.contacto.correo ? contactoCard(v.contacto, ed ? v.id : 0, true) : `<div class="cc main empty"><span class="muted">Contacto principal no definido</span></div>`}${otrosCont.map(k => contactoCard(k, ed ? v.id : 0, false)).join("")}</div></div>
    <div class="card side"><p class="card-title">En Antofagasta Minerals</p>
      <p class="lbl2">Líder de la iniciativa</p><h4>${esc(v.lider || "No definido")}</h4>
      <p class="lbl2">Encargado/a del día a día</p><h4>${esc(v.responsable || "No definido")}</h4><p>${rutaTxt(v.area)}</p>
      ${ed ? (traspasoAbierto === v.id ? traspasoFormHTML(v) : `<button class="btn-outline wide" id="tpAbrir" style="margin-top:12px">Cambiar encargado/a</button>`) : ""}</div>
    </div>
  </div></details>
  <details class="f-sec" id="f-seg" ${fAb("f-seg")}><summary class="f-h"><span>3</span><div>Seguimiento<small>Reuniones, respuestas de la institución y cambios</small></div><i class="chev" aria-hidden="true"></i></summary><div class="f-body">
    <div class="stack">
    ${fold("Reuniones", v.reuniones.length, `${ed ? `<div class="fold-acts"><button class="link-btn" onclick="abrirAsistente(${v.id},'reunion')">+ Agregar reunión</button></div>` : ""}
      ${v.reuniones.length ? v.reuniones.slice().reverse().map(r => `<div class="fb"><b>${fechaTxt(r.fecha)}</b> · <span class="muted">${esc(r.fuente)}</span><br>${esc(r.resumen)}</div>`).join("") : `<p class="muted small">Aún no hay reuniones registradas. Pega la transcripción o tus notas en el asistente y se agregan aquí con un resumen.</p>`}`, false, v.reuniones.length ? "última: " + fechaTxt(v.reuniones[v.reuniones.length - 1].fecha) : "")}
    ${fold("Feedback de la institución", v.cuestionarios.length, `${ed ? `<div class="fold-acts"><button class="link-btn" onclick="abrirAsistente(${v.id},'cuestionario')">+ Nuevo cuestionario</button></div>` : ""}
      <p class="help">La institución responde en un link, sin cuenta y sin correos de ida y vuelta. Sus respuestas llegan solas a esta ficha.</p>
      ${v.cuestionarios.length ? v.cuestionarios.slice().reverse().map(q => cuestionarioHTML(v, q, ed)).join("") : `<p class="muted small">Aún no se ha preparado un cuestionario para la institución.</p>`}`, v.cuestionarios.some(q => q.estado !== "respondido"), v.cuestionarios.some(q => q.estado !== "respondido") ? "esperando respuesta" : satis ? "nos califican " + num1(satis) + " de 5" : "")}
    ${v.traspaso && v.traspaso.leido ? fold("Hoja de traspaso", null, hojaTraspasoHTML(v, false), false, `${esc(v.traspaso.de)} → ${esc(v.traspaso.para)}, ${fechaTxt(v.traspaso.fecha)}`) : ""}
    ${fold("Historial de cambios", v.versiones.length, v.versiones.slice().reverse().map(x => `<div class="ver"><span class="vn">v${x.v}</span><div><b>${fechaTxt(x.fecha)}</b> · <span class="muted">${esc(x.autor)}</span><br>${esc(x.resumen)}</div></div>`).join(""))}
    </div>
  </div></details>
  ${evalVisible ? `<details class="f-sec" id="f-eval" ${fAb("f-eval")}><summary class="f-h"><span>4</span><div>Evaluación<small>Cómo resultó el vínculo, de 1 a 5</small></div><i class="chev" aria-hidden="true"></i></summary><div class="f-body">
    <div class="card eval-card"><div class="eval-izq"><p class="card-title">Criterios</p>
      <div class="calif-big"><b>${v.calif ? num1(v.calif) : "–"}</b><span>${v.calif ? "de 5, promedio de los criterios" : "Sin calificar"}</span></div>
      <p class="help" style="margin:2px 0 10px">Se califica de 1 (muy mal) a 5 (muy bien). Los criterios dependen del tipo de vínculo.</p>
      ${crits.map((k, j) => { const rb = CONFIG.rubrica[k] || []; return `<p class="lbl2">${esc(k)}</p><div class="rate ${ed ? "" : "locked"}">${[1, 2, 3, 4, 5].map(i => `<button data-crit="${j}" data-rate="${i}" class="${cv[k] && i <= cv[k] ? "on" : ""}" aria-label="${esc(k)}: ${i} de 5${rb[i - 1] ? ", " + esc(rb[i - 1]) : ""}" title="${i}: ${esc(rb[i - 1] || "")}" ${ed ? "" : "disabled"}>${i}</button>`).join("")}</div><p class="rubrica">${cv[k] && rb[cv[k] - 1] ? `<b>${cv[k]}:</b> ${esc(rb[cv[k] - 1])}` : `<span class="muted">Pasa el mouse por un número para ver qué significa.</span>`}</p>`; }).join("")}
      </div><div class="eval-der"><p class="card-title">Resultado</p>
      <p class="lbl2">¿Ayudó a cumplir sus metas?</p>
      <div class="seg">${["si", "parcial", "no"].map(a => `<button data-aporta="${a}" class="${v.aporta === a ? "on" : ""}" ${ed ? "" : "disabled"}>${ACORTAR[a]}</button>`).join("")}</div>
      <div class="dos-miradas"><p class="lbl2">Dos miradas</p>
        <div class="dm"><div><b>${v.calif ? num1(v.calif) : "–"}</b><span>Nota del área</span></div><div><b>${satis ? num1(satis) : "–"}</b><span>Nota de la institución${resp.length ? ` (${resp.length} ${resp.length === 1 ? "cuestionario" : "cuestionarios"})` : ""}</span></div></div>
        ${v.calif && satis && Math.abs(v.calif - satis) >= 2 ? `<p class="conversar">Las notas difieren en ${num1(Math.abs(v.calif - satis))} puntos. Vale la pena conversarlo con la institución.</p>` : !satis ? `<p class="help">La nota de la institución sale de la primera pregunta de su cuestionario de feedback.</p>` : ""}</div>
    </div></div>
  </div></details>` : ""}`;
}
function cuestionarioHTML(v, q, ed) {
  if (q.estado === "respondido") return `<details class="cq"><summary><b>${fechaTxt(q.fechaResp || q.fecha)}</b> <span class="pill p2">Respondido${q.via === "link" ? " en el link" : ""}</span></summary>${q.preguntas.map((p, i) => q.respuestas[i] ? `<div class="qa"><span>${esc(p)}</span><b>${esc(q.respuestas[i])}</b></div>` : "").join("")}${q.comentario ? `<div class="fb" style="margin-top:8px"><b>Respuesta o comentario</b><br>${esc(q.comentario).replace(/\n/g, "<br>")}</div>` : ""}</details>`;
  const preparado = q.estado === "preparado";
  return `<div class="cq"><div class="head-row"><span><b>${fechaTxt(q.fecha)}</b> <span class="pill ${preparado ? "p0" : "p1"}">${preparado ? "Preparado, falta confirmar el envío" : "Enviado, esperando respuesta"}</span></span>
    ${ed ? `<span class="cq-acts">${preparado ? `<button class="link-btn" data-enviado="${q.id}">Ya lo envié</button>` : ""}<button class="link-btn" data-registrar="${q.id}">Registrar a mano</button></span>` : ""}</div>
    ${preparado ? `<p class="help">Se abrió Outlook con el link listo. La página no puede saber si lo enviaste: confírmalo con "Ya lo envié".</p>` : `<p class="help">Enviado el ${fechaTxt(q.fechaEnvio || q.fecha)}. Cuando la institución responda en el link, sus respuestas aparecen aquí.</p>`}
    <div class="inline-form link-cq"><input class="input" value="${esc(urlResponder(v, q))}" readonly aria-label="Link del cuestionario"><button class="btn-outline" data-copiar-cq="${q.id}">Copiar link</button><a class="btn-outline" href="#/responder/${v.id}.${q.id}" target="_blank" rel="noopener">Ver como la institución</a></div>
    <div id="reg-${q.id}" hidden>
      <p class="help">¿Te respondieron por otra vía (correo, teléfono o en una reunión)? Regístralo aquí.</p><label class="f" for="com-${q.id}">Respuesta o comentario general</label><textarea class="input" id="com-${q.id}" rows="3" placeholder="Ej.: Respondieron que la charla fue muy útil y piden repetirla en marzo."></textarea>
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
      ${v ? zonaEliminar("vínculo", `Si este vínculo ya no se va a hacer, puedes eliminarlo.${convDe(v.id).length ? ` También se eliminan sus ${convDe(v.id).length} convocatorias.` : ""} Si ya terminó, mejor márcalo como Cerrado para que siga en las estadísticas.`) : ""}
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
function textoCorreoInst(v, extra, para) {
  const c = contraparte(v.contraparte);
  const nomC = para ? para.nombre : v.contacto.nombre;
  const sal = nomC ? `Hola ${nomC},` : "Hola,";
  const cuerpo = extra || "[Escribe aquí tu mensaje: coordinación, fechas, próximos pasos…]";
  return `${sal}\n\nEscribo desde ${nombreArea(v.area)} de Antofagasta Minerals respecto del vínculo «${v.nombre}» (${tipo(v.tipo).nombre}) con ${c.nombre}.\n\n${cuerpo}\n\nSaludos cordiales,\n${ME.nombre}\n${ME.correo || "Antofagasta Minerals"}`;
}
/* ============================ Áreas ============================ */
function vAreas() {
  return hero("Áreas", `Vicepresidencias, gerencias y subáreas que gestionan vínculos.${ME.admin ? ` <a class="lnk" href="#/admin/areas">Configurar áreas</a>` : ""}`) + `
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
  return hero("Instituciones", "Cada institución, las áreas que trabajan con ella y cómo han resultado esos vínculos.") + `
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
  const cal = vs.filter(v => v.aporta), si = cal.filter(v => v.aporta === "si").length, mio = misVinculos().find(x => x.contraparte === id && puedeEditar(x));
  return `<div class="crumbs"><a href="#/contrapartes">Instituciones</a> / ${esc(c.corto)}</div>
  <div class="head-row"><div><h1>${esc(c.nombre)}</h1><p class="sub">${esc(c.tipoOrg)}${c.locacion ? ", " + esc(c.locacion) : ""}${c.zona ? " · Zona " + esc(c.zona) : ""}</p></div>${puedeCrear() ? `<button class="btn-accent" id="nuevoCon" data-cp="${c.id}">+ Añadir vínculo con esta institución</button>` : ""}</div>
  <div class="grid-main"><div class="card">${filasVinculos(vs, { area: true })}</div>
  <aside class="stack"><div class="card side"><p class="card-title">Resumen</p><p style="color:var(--ink)"><b>${as.length}</b> ${as.length === 1 ? "área" : "áreas"} en contacto</p><p>Calificación promedio: <b style="color:var(--ink)">${num1(promedio(vs))}</b> de 5</p><p>${cal.length ? `Ayudó a la meta en ${si} de ${cal.length} vínculos evaluados` : "Sin vínculos evaluados"}</p><p>${S.estudiantes.filter(e => e.contraparte === id).length} estudiantes en práctica o memoria hoy</p>
    <div style="margin-top:10px">${as.map(a => `<a class="tag" href="#/area/${a}">${esc(nombreArea(a))}</a>`).join("")}</div></div>
    ${(c.contactos || []).length ? `<div class="card side"><p class="card-title">Contactos registrados</p>${c.contactos.map(k => contactoCard(k, mio ? mio.id : 0, false)).join("")}</div>` : ""}
  </aside></div>`;
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
  const ciclo = cicloDe(S.convocatorias.filter(c => (!raiz || descendientes(raiz).includes(convArea(c))) && (!dashComp || convComps(c).includes(dashComp))).flatMap(c => c.postulantes));
  const mx = (rows) => Math.max(1, ...rows.map(r => r.v));
  const mejor = porTipo.find(r => r.p);
  const frases = [
    `Hay <b>${base.length} vínculos</b> con <b>${cps.length} instituciones</b>; <b>${activos}</b> siguen activos.`,
    mejor ? `El tipo de vínculo mejor evaluado es <b>${esc(mejor.t.nombre)}</b> (${num1(mejor.p)} de 5, con ${mejor.nc} ${mejor.nc === 1 ? "vínculo calificado" : "vínculos calificados"}).` : "",
    pctSi != null ? `De los vínculos evaluados, <b>${pctSi}%</b> ayudó a cumplir sus metas.` : "",
    compartidas.length ? `<b>${compartidas.length} ${compartidas.length === 1 ? "institución trabaja" : "instituciones trabajan"}</b> con más de un área: conviene coordinarse.` : ""
  ].filter(Boolean);
  const sec = (titulo, sub, cuerpo, abierta = true) => `<details class="dash-sec" ${abierta ? "open" : ""}><summary><span><b>${titulo}</b><small>${sub}</small></span></summary><div class="dash-body">${cuerpo}</div></details>`;
  const porAnio = [...new Set(base.map(anioDe))].sort().map(a => ({ n: a, v: base.filter(v => anioDe(v) === a).length }));
  const detalle = cps.map(id => { const l = base.filter(v => v.contraparte === id); return { id, n: l.length, as: [...new Set(l.map(v => v.area))], p: promedio(l) }; }).sort((a, b) => b.n - a.n);
  // ¿Está funcionando SIVA? Indicadores del piloto, a partir de lo que la plataforma ya registra.
  const areasReg = [...new Set(base.map(v => v.area))];
  const areasMes = areasReg.filter(a => base.some(v => v.area === a && v.versiones.some(x => x.fecha && diasDesde(x.fecha) <= 30)));
  const vivos = base.filter(v => v.etapa < 3), alDia = vivos.filter(v => saludDe(v).k === "verde").length;
  const dSin = vivos.map(v => { const u = ultimoMovimiento(v); return u ? diasDesde(u) : null; }).filter(x => x != null);
  const promSin = dSin.length ? Math.round(dSin.reduce((a, b) => a + b, 0) / dSin.length) : null;
  const revisiones = (S.metricas || {}).duplicados || 0;
  const pilotoHTML = sec("¿Está funcionando SIVA?", "Cuatro indicadores para saber si la plataforma ayuda a las áreas", `<div class="piloto">
    <div class="kpi"><b>${revisiones}</b><span>veces que SIVA avisó que otra área ya habla con una institución, antes de escribirle</span></div>
    <div class="kpi"><b>${areasMes.length}<small> de ${areasReg.length}</small></b><span>áreas que registraron o actualizaron un vínculo en los últimos 30 días</span></div>
    <div class="kpi"><b>${vivos.length ? Math.round(alDia / vivos.length * 100) : 0}<small>%</small></b><span>de los vínculos activos están al día (${alDia} de ${vivos.length})</span></div>
    <div class="kpi"><b>${promSin == null ? "–" : promSin}<small> días</small></b><span>sin movimiento, en promedio, en los vínculos activos</span></div></div>
    <p class="help">Para el piloto proponemos mirar esto cada mes. El primer indicador cuenta los avisos de contacto compartido: es una forma de medir conversaciones que no se duplicaron. Hoy ${compartidas.length} ${compartidas.length === 1 ? "institución trabaja" : "instituciones trabajan"} con más de un área.</p>`);
  const detalleHTML = sec("Detalle por institución y por área", `${detalle.length} instituciones`, `<div class="card"><div class="table-wrap"><table><thead><tr><th>Institución</th><th>Vínculos</th><th>Áreas que trabajan con ella</th><th>Calificación</th></tr></thead><tbody>${detalle.map(r => `<tr><td class="t"><a class="lnk" href="#/contraparte/${r.id}">${esc(contraparte(r.id).nombre)}</a></td><td>${r.n}</td><td>${r.as.map(a => `<span class="tag">${esc(nombreArea(a))}</span>`).join("")}</td><td>${r.p ? dots(r.p) + " " + num1(r.p) : '<span class="muted">Sin calificar</span>'}</td></tr>`).join("")}</tbody></table></div></div>`, false);
  return hero("Estadísticas", jef ? "Resultados de " + esc(nombreArea(ME.area)) + "." : "Cuántos vínculos hay, cómo van y si SIVA está funcionando.", { cards: true, acciones: `<div class="frow">${jef ? "" : `<select class="input sm" id="dashVP" style="width:auto" aria-label="Vicepresidencia"><option value="">Todas las vicepresidencias</option>${vps.map(a => `<option value="${a.id}" ${dashVP === a.id ? "selected" : ""}>${esc(a.nombre)}</option>`).join("")}</select>`}
    <select class="input sm" id="dashComp" style="width:auto" aria-label="Compañía"><option value="">Todas las compañías</option>${S.companias.map(c => `<option value="${c.id}" ${dashComp === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></div>` }) + `
  <div class="kpis k4 kpis-float">
    <div class="kpi"><b>${base.length}</b><span>vínculos registrados</span></div>
    <div class="kpi"><b>${activos}</b><span>activos (no cerrados)</span></div>
    <div class="kpi"><b>${cps.length}</b><span>instituciones</span></div>
    <div class="kpi"><b>${num1(promedio(base))}<small> de 5</small></b><span>calificación promedio de ${cal.length} vínculos</span>
      <details class="como"><summary>¿Cómo se calcula?</summary><p>Cada área califica sus vínculos de 1 a 5 en tres criterios que dependen del tipo. Por ejemplo, en prácticas y memorias: calidad de las y los estudiantes, rapidez de respuesta de la institución y calidad del trabajo. La nota del vínculo es el promedio de sus criterios, y este número es el promedio de todos los vínculos calificados.</p></details></div>
  </div>
  <div class="dash-blocks"><div class="card resumen-txt"><p class="card-title">En resumen</p><ul>${frases.map(f => `<li>${f}</li>`).join("")}</ul><p class="help">Los datos vienen del mapeo de instituciones; las calificaciones son de ejemplo.</p></div>
  </div>
  ${pilotoHTML}
  ${sec("¿Qué funciona mejor?", "Calificación promedio (de 1 a 5) y si ayudó a cumplir las metas", `<div class="bars2">
    <div class="card"><p class="card-title">Calificación por tipo de vínculo</p>${barrasNota(porTipo.map(r => ({ n: r.t.nombre, p: r.p, s: r.nc ? r.nc + " calificados" : "Sin calificar" })))}</div>
    <div class="card"><p class="card-title">¿Ayudó a cumplir las metas?</p>${torta([{ n: "Sí", v: ev.filter(v => v.aporta === "si").length, color: "#156451" }, { n: "Parcialmente", v: ev.filter(v => v.aporta === "parcial").length, color: "#C89900" }, { n: "No", v: ev.filter(v => v.aporta === "no").length, color: "#AD1900" }], "Ayudó a cumplir las metas")}</div>
    <div class="card wide-card"><p class="card-title">Instituciones mejor evaluadas</p>${topCp.length ? topCp.map((r, i) => `<a class="rank" href="#/contraparte/${r.id}"><span class="pos">${i + 1}</span><span class="nm">${esc(contraparte(r.id).nombre)}<small>${r.nc} ${r.nc === 1 ? "vínculo calificado" : "vínculos calificados"} de ${r.n}</small></span>${dots(r.p)}<b>${num1(r.p)}</b></a>`).join("") : `<p class="muted small">Aún no hay calificaciones.</p>`}</div></div>`)}
  ${sec("¿Dónde están los vínculos?", "Por etapa, compañía, área, meta y tipo de institución", `<div class="bars2">
    <div class="card"><p class="card-title">Por etapa</p>${torta(porEtapa, "Vínculos por etapa")}</div>
    <div class="card"><p class="card-title">Por compañía</p>${torta(porComp, "Vínculos por compañía")}<p class="help">Un vínculo de varias compañías cuenta en cada una.</p></div>
    <div class="card"><p class="card-title">Por área</p>${barras(hojas, mx(hojas))}</div>
    <div class="card"><p class="card-title">Por año de inicio</p>${barras(porAnio, mx(porAnio), false)}<p class="help">Sirve para comparar un año con otro.</p></div>
    <div class="card"><p class="card-title">Por meta a la que aporta</p>${porMeta.length ? barras(porMeta, mx(porMeta)) : `<p class="muted small">Ningún vínculo tiene metas asignadas.</p>`}</div>
    <div class="card"><p class="card-title">Por tipo de institución</p>${torta(porOrg, "Vínculos por tipo de institución")}</div>
    <div class="card"><p class="card-title">Instituciones por zona</p>${torta(porZona, "Instituciones por zona")}<p class="help"><a class="lnk" href="#/contrapartes">Ver instituciones por zona</a></p></div></div>`)}
  ${sec("Coordinación entre áreas", `${compartidas.length} instituciones compartidas`, `<div class="card"><p class="small muted" style="margin-top:0">Donde conviene coordinarse para no duplicar contactos.</p>${compartidas.length ? compartidas.slice(0, 8).map(r => `<a class="rank" href="#/contraparte/${r.id}"><span class="pos">${r.as.length}</span><span class="nm">${esc(contraparte(r.id).nombre)}<small>${r.as.map(a => esc(nombreArea(a))).join(", ")}</small></span></a>`).join("") : `<p class="muted small">Ninguna institución se comparte entre áreas.</p>`}</div>`, false)}
  ${sec("Financiamiento", "Quién financia los vínculos", `<div class="card">${torta(porFin, "Financiamiento")}</div>`, false)}
  ${sec("Estudiantes: postula, mientras, sale", `${ciclo.post} postulaciones · ${ciclo.acept} aceptados · ${ciclo.sale} terminaron`, `<div class="card"><p class="card-title">Ciclo en las convocatorias</p>${cicloHTML(ciclo, "Cuenta las postulaciones recibidas en SIVA. Los porcentajes ayudan a ver cuántos estudiantes llegan y cuántos terminan su práctica o memoria.")}</div>
    <div class="card"><div class="est-grid"><div class="kpi flat"><b>${est.length}</b><span>estudiantes hoy · nota promedio ${num1(notaProm(est))} (de 1 a 7, la pone la o el tutor)</span></div>
      <div>${barras(estTipo, mx(estTipo), false)}</div></div>
      ${estUni.length ? `<div class="table-wrap"><table><thead><tr><th>Universidad o institución</th><th>Estudiantes</th><th>Nota promedio</th></tr></thead><tbody>${estUni.map(r => `<tr><td class="t">${esc(contraparte(r.id).nombre)}</td><td>${r.n}</td><td>${r.p == null ? '<span class="muted">Sin evaluar</span>' : num1(r.p)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">No hay estudiantes con este filtro.</p>`}
      <p class="card-title" style="margin-top:14px">Feedback de instituciones (respondido en el link)</p><p class="small">${resp.length ? `${resp.length} ${resp.length === 1 ? "cuestionario respondido" : "cuestionarios respondidos"}; las instituciones nos califican con <b>${num1(resp.reduce((s, q) => s + (+q.respuestas[0] || 0), 0) / resp.length)} de 5</b>.` : "Aún no hay cuestionarios respondidos."}</p></div>`, true)}
  ${detalleHTML}`;
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
  return `<h1>Configuración</h1><p class="sub">Configura las áreas, los tipos de vínculo (con sus criterios de calificación), las metas y las instituciones disponibles para todos.</p>
  <div class="tabs">${tabs.map(([k, t]) => `<a class="tab ${tab === k ? "on" : ""}" href="${k === "metas" ? "#/metas" : "#/admin/" + k}">${t}</a>`).join("")}</div><div class="stack">${body}</div>`;
}

/* ============================ Asistente ============================ */
const asis = { vid: null, tab: "reunion", chat: [], pensando: false, texto: "", fuente: "Transcripción pegada", propuesta: null, cargando: false, extra: [], base: PREGUNTAS_BASE.map(() => true), error: "" };
let reco = null;
function abrirAsistente(vid, tab) {
  if (tab === "chat") { asis.tab = "chat"; asis.vid = vid || null; $("#drawer").classList.add("show"); $("#drawerBg").classList.add("show"); renderAsistente(); return; }
  if (vid) asis.vid = vid; if (tab) asis.tab = tab;
  if (!asis.vid || !vinculo(asis.vid) || !puedeEditar(vinculo(asis.vid))) { const m = misVinculos().filter(puedeEditar); asis.vid = m.length ? m[0].id : null; }
  if (asis.vid !== asis._ultimo) { asis.propuesta = null; asis.extra = []; asis.error = ""; asis.creado = null; asis._ultimo = asis.vid; }
  $("#drawer").classList.add("show"); $("#drawerBg").classList.add("show"); renderAsistente();
}
function cerrarAsistente() { const d = $("#drawer"); if (!d) return; asis.creado = null; d.classList.remove("show"); $("#drawerBg").classList.remove("show"); if (reco) { try { reco.stop(); } catch (e) {} } }
const urlResponder = (v, q) => location.href.split("#")[0] + "#/responder/" + v.id + "." + q.id;
function textoCuestionario(v, preguntas, q) {
  const link = q ? urlResponder(v, q) : "[el link se genera al abrir Outlook]";
  return `Hola${v.contacto.nombre ? " " + v.contacto.nombre : ""}:\n\nDesde ${nombreArea(v.area)} de Antofagasta Minerals queremos saber cómo va "${v.nombre}". ¿Nos ayudas respondiendo ${preguntas.length} preguntas cortas? Toma menos de 5 minutos y no necesitas crear una cuenta:\n\n${link}\n\nMuchas gracias,\n${v.responsable || ME.nombre}\nAntofagasta Minerals`;
}
const SUGERENCIAS_CHAT = ["¿Cuántos vínculos están abiertos?", "¿Cómo va la convocatoria de memorias 2027?", "¿Cuántos vínculos hay con la UCN?", "¿Qué vínculos piden atención?", "¿Cuántos postulantes hay en total?"];
function chatMd(t) {
  const lineas = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split("\n");
  let out = "", lista = false;
  lineas.forEach(l => { if (/^- /.test(l)) { if (!lista) { out += "<ul>"; lista = true; } out += "<li>" + l.slice(2) + "</li>"; } else { if (lista) { out += "</ul>"; lista = false; } out += l ? "<p>" + l + "</p>" : ""; } });
  return out + (lista ? "</ul>" : "");
}
function renderChat() {
  const d = $("#drawerBody"); if (!d) return;
  $("#aiModo").textContent = AI.etiqueta();
  const tit = $("#drawerTit"); if (tit) tit.textContent = "Asistente de IA";
  const msgs = asis.chat;
  d.innerHTML = `<div class="chat">
    <div class="chat-log" id="chatLog" aria-live="polite">
      ${msgs.length ? msgs.map(m => `<div class="msg ${m.r === "u" ? "yo" : "ia"}">${m.r === "u" ? esc(m.t) : chatMd(m.t)}</div>`).join("") : `<div class="msg ia"><p>Hola, soy el asistente de SIVA. Pregúntame por tus vínculos, convocatorias e instituciones.</p></div>`}
      ${asis.pensando ? `<div class="msg ia pensando">Pensando…</div>` : ""}
    </div>
    ${msgs.length ? "" : `<div class="chat-sugs"><p class="lbl2">Prueba preguntando</p>${SUGERENCIAS_CHAT.map(s => `<button type="button" class="chip-btn" data-sug="${esc(s)}">${esc(s)}</button>`).join("")}</div>`}
    <form class="chat-form" id="chatForm"><input class="input" id="chatIn" placeholder="Escribe tu pregunta" autocomplete="off" aria-label="Pregunta para el asistente" ${asis.pensando ? "disabled" : ""}><button class="btn-accent" ${asis.pensando ? "disabled" : ""}>Preguntar</button></form>
    <p class="help">Responde solo con lo que está registrado en SIVA. ${msgs.length ? `<button type="button" class="link-btn" id="chatLimpiar">Borrar la conversación</button>` : ""}</p>
    <p class="help">Para actualizar un vínculo con notas, un archivo o dictado, abre su ficha y presiona "Actualizar con IA".</p>
  </div>`;
  const log = $("#chatLog"); if (log) log.scrollTop = log.scrollHeight;
  const enviar = async texto => {
    texto = (texto || "").trim(); if (!texto || asis.pensando) return;
    asis.chat.push({ r: "u", t: texto }); asis.pensando = true; renderChat();
    try { const r = await AI.preguntar(texto, asis.chat.slice(0, -1), asis.vid); asis.chat.push({ r: "a", t: r }); }
    catch (e) { asis.chat.push({ r: "a", t: e && e.code === "rate_limited" ? "Hiciste muchas consultas seguidas. Espera un momento e intenta de nuevo." : "No pude responder ahora. Intenta de nuevo." }); }
    asis.pensando = false; renderChat(); const i = $("#chatIn"); if (i) i.focus();
  };
  $("#chatForm").onsubmit = e => { e.preventDefault(); enviar($("#chatIn").value); };
  $$("[data-sug]").forEach(b => b.onclick = () => enviar(b.dataset.sug));
  const lim = $("#chatLimpiar"); if (lim) lim.onclick = () => { asis.chat = []; renderChat(); };
  const i = $("#chatIn"); if (i && !asis.pensando) i.focus();
}
function renderAsistente() {
  if (asis.tab === "chat") { renderChat(); return; }
  const d = $("#drawerBody"); if (!d) return;
  const editables = misVinculos().filter(puedeEditar);
  const v = vinculo(asis.vid);
  $("#aiModo").textContent = AI.etiqueta();
  if (!v) { d.innerHTML = `<p class="muted">No tienes vínculos que puedas editar.</p>`; return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let html = `<label class="f" for="asV">Vínculo</label><select class="input" id="asV">${editables.map(x => `<option value="${x.id}" ${x.id === v.id ? "selected" : ""}>${esc(x.nombre)}, ${esc(contraparte(x.contraparte).corto)}</option>`).join("")}</select>
`;
  const tit = $("#drawerTit"); if (tit) tit.textContent = asis.tab === "reunion" ? "Actualizar con IA" : "Pedir feedback";
  if (asis.tab === "reunion") {
    html += `<p class="small muted">Cuéntale a la IA qué pasó con este vínculo: dicta, pega una transcripción o tus notas, o sube un archivo (Word, PDF o texto). Ella propone cambios a la ficha y tú apruebas cada uno.</p>
      ${SR ? `<button class="mic-big ${reco ? "on" : ""}" id="asMic"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z"/></svg><span>${reco ? "Detener dictado" : "Dictar notas"}</span></button>` : `<p class="help">Este navegador no permite dictar. Puedes pegar el texto o usar el dictado del teclado del celular.</p>`}
      <textarea class="input" id="asTxt" rows="6" placeholder="O pega aquí la transcripción de Teams, Meet o Zoom, o tus notas…">${esc(asis.texto)}</textarea>
      <div class="as-tools"><label class="btn-outline sm">Subir archivo (Word, PDF o texto)<input type="file" id="asFile" accept=".docx,.pdf,.md,.txt,.vtt,.srt,text/plain,audio/*" hidden></label><span class="small muted" id="asInfo"></span></div>
      <div class="form-actions"><button class="btn-accent" id="asGo" ${asis.cargando ? "disabled" : ""}>${asis.cargando ? "Procesando…" : "Procesar con IA"}</button></div>
      ${asis.error ? `<div class="err show">${esc(asis.error)}</div>` : ""}`;
    const p = asis.propuesta;
    if (p) {
      html += `<div class="prop"><p class="card-title">Resumen</p><p class="small">${esc(p.resumen)}</p>
        <div class="apr-top"><span class="small muted">Aprueba lo que corresponda. Lo que no apruebes no se guarda.</span><button class="link-btn" id="asTodo">Aprobar todo</button></div><p class="card-title">Cambios a la ficha (contacto, objetivo y otros)</p>${p.cambios.length ? p.cambios.map((c, i) => `<label class="diff apr-row"><input type="checkbox" data-cambio="${i}"><span><b>${esc(c.etiqueta)}</b>${c.antes ? `<s>${esc(c.antes)}</s>` : ""}<ins>${esc(c.despues)}</ins></span><span class="apr" aria-hidden="true"></span></label>`).join("") : `<p class="small muted">Sin cambios a los campos.</p>`}
        ${p.completados.length ? `<p class="card-title">Tareas cumplidas</p>${p.completados.map((t, i) => `<label class="diff apr-row"><input type="checkbox" data-comp="${i}"><span>${esc(t)}</span><span class="apr" aria-hidden="true"></span></label>`).join("")}` : ""}
        ${p.nuevos.length ? `<p class="card-title">Próximos pasos</p>${p.nuevos.map((t, i) => `<label class="diff apr-row"><input type="checkbox" data-nuevo="${i}"><span>${esc(t)}</span><span class="apr" aria-hidden="true"></span></label>`).join("")}` : ""}
        ${p.etapa != null ? `<p class="card-title">Estado</p><label class="diff apr-row"><input type="checkbox" id="asEtapa"><span>Mover de ${CONFIG.etapas[v.etapa]} a <b>${CONFIG.etapas[p.etapa]}</b></span><span class="apr" aria-hidden="true"></span></label>` : ""}
        <div class="form-actions"><button class="btn-accent" id="asAplicar">Guardar lo aprobado</button><button class="btn-outline" id="asDescartar">Descartar</button></div></div>`;
    }
  } else {
    const preguntas = PREGUNTAS_BASE.filter((_, i) => asis.base[i]).map(p => p.texto).concat(asis.extra);
    if (asis.creado && asis.creado.v === v.id) {
      const q = v.cuestionarios.find(x => x.id === asis.creado.q);
      if (q) html += `<div class="link-listo"><p class="card-title">Link del cuestionario listo</p><p class="help">Quien tenga este link responde sin crear cuenta. Puedes pegarlo en Teams, WhatsApp o un correo, no solo en Outlook.</p>
        <div class="inline-form"><input class="input" id="asLinkIn" readonly value="${esc(urlResponder(v, q))}" aria-label="Link del cuestionario"><button class="btn-accent" id="asLinkCopiar">Copiar link</button></div>
        <div class="form-actions"><button class="btn-outline" id="asLinkOutlook">Abrir en Outlook</button><button class="btn-outline" id="asLinkFicha">Ir a la ficha</button></div></div>`;
    }
    html += `<div class="pasos-cq"><b>Cómo funciona</b><ol><li>Eliges las preguntas.</li><li>Creas el link y se copia solo. Lo pegas en un correo, Teams o WhatsApp para ${v.contacto.correo ? esc(v.contacto.correo) : "la institución"}, o abres Outlook con el texto listo. Tú lo envías.</li><li>La institución responde en el link, sin cuenta. Sus respuestas llegan solas a la ficha.</li><li>Si no responde en ${DIAS_SIN_RESPUESTA} días, SIVA te avisa.</li></ol></div>
      <p class="card-title">Preguntas generales</p>${PREGUNTAS_BASE.map((p, i) => `<label class="diff"><input type="checkbox" data-base="${i}" ${asis.base[i] ? "checked" : ""}><span>${esc(p.texto)}</span></label>`).join("")}
      <p class="card-title">Preguntas específicas de este vínculo</p>${asis.extra.map((p, i) => `<div class="diff"><span style="flex:1">${esc(p)}</span><button class="link-btn danger" data-quitar="${i}">Quitar</button></div>`).join("") || `<p class="small muted">Puedes sugerirlas con el asistente o escribirlas.</p>`}
      <div class="form-actions"><button class="btn-outline sm" id="asSug" ${asis.cargando ? "disabled" : ""}>${asis.cargando ? "Pensando…" : "Sugerir con el asistente"}</button></div>
      <div class="inline-form"><input class="input" id="asPreg" placeholder="Escribe otra pregunta"><button class="btn-outline" id="asAddP">Agregar</button></div>
      ${asis.error ? `<div class="err show">${esc(asis.error)}</div>` : ""}
      <p class="card-title" style="margin-top:16px">Vista previa del correo</p><textarea class="input" id="asPrev" rows="10" readonly>${esc(textoCuestionario(v, preguntas))}</textarea>
      <div class="form-actions"><button class="btn-accent" id="asLink">Crear link y copiarlo</button><button class="btn-outline" id="asEnviar">Crear y abrir en Outlook</button><button class="btn-outline" id="asCopiar">Copiar texto del correo</button></div>
      <p class="help">El link se copia solo: pégalo en Outlook, Teams o WhatsApp. La página no envía nada por ti; queda como "preparado" hasta que confirmes que lo mandaste.</p>`;
  }
  d.innerHTML = html;
  wireAsistente(v);
}
// Lee Word (.docx), PDF y texto plano (.md, .txt, .vtt, .srt) y devuelve solo el texto.
async function leerArchivo(f) {
  const n = f.name.toLowerCase();
  if (n.endsWith(".docx")) {
    const z = await JSZip.loadAsync(await f.arrayBuffer());
    const xml = await z.file("word/document.xml").async("string");
    return xml.replace(/<w:tab\/>/g, " ").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{2,}/g, "\n").trim();
  }
  if (n.endsWith(".pdf")) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js";
    const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const items = (await (await doc.getPage(i)).getTextContent()).items; let y = null;
      for (const it of items) { if (y !== null && Math.abs(it.transform[5] - y) > 2) out += "\n"; else if (y !== null) out += " "; out += it.str; y = it.transform[5]; }
      out += "\n";
    }
    return out.trim();
  }
  return (await f.text()).replace(/^WEBVTT.*$/m, "").replace(/^\d+$/gm, "").replace(/^\d{2}:\d{2}[:.,\d]* --> .*$/gm, "").replace(/\n{2,}/g, "\n").trim();
}
function setPath(obj, path, val) { const k = path.split("."); let o = obj; while (k.length > 1) o = o[k.shift()]; o[k[0]] = val; }
function wireAsistente(v) {
  $("#asV").onchange = e => { asis.vid = +e.target.value; asis.propuesta = null; asis.extra = []; asis.error = ""; asis._ultimo = asis.vid; renderAsistente(); };
  if (asis.tab === "reunion") {
    const txt = $("#asTxt"); txt.oninput = () => asis.texto = txt.value;
    $("#asFile").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.type.startsWith("audio/")) { $("#asInfo").textContent = "Los audios aún no se transcriben aquí. Usa la transcripción automática de Teams, Meet o Zoom y pégala, o usa Dictar."; return; }
      let t = "";
      try { t = await leerArchivo(f); } catch (err) { $("#asInfo").textContent = "No pudimos leer ese archivo. Prueba con otro o pega el texto."; return; }
      if (!t.trim()) { $("#asInfo").textContent = "El archivo no tiene texto que se pueda leer (¿es una imagen escaneada?). Pega el texto a mano."; return; }
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
      try { reco.start(); mic.classList.add("on"); mic.querySelector("span").textContent = "Detener dictado"; $("#asInfo").textContent = "Escuchando… habla con normalidad."; } catch (e) { reco = null; }
    };
    const todo = $("#asTodo"); if (todo) todo.onclick = () => $$(".apr-row input").forEach(i => i.checked = true);
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
    const crear = () => { const ps = preguntas(); if (!ps.length) return null; const q = { id: Date.now(), fecha: hoy(), estado: "preparado", preguntas: ps, respuestas: [] }; v.cuestionarios.push(q); guardar(); asis.creado = { v: v.id, q: q.id }; asis.extra = []; return q; };
    const outlookDe = q => { const to = (v.contacto.correo || "").trim(); if (!to) { toast("Agrega el correo del contacto en la ficha para abrir Outlook."); return false; } abrirOutlookWeb(to, "Cómo va " + v.nombre + " · Antofagasta Minerals", textoCuestionario(v, q.preguntas, q)); return true; };
    $("#asEnviar").onclick = () => { const q = crear(); if (!q) return; try { navigator.clipboard.writeText(urlResponder(v, q)); } catch (e) {} const ok = outlookDe(q); renderAsistente(); if (ok) toast("Se abrió Outlook. El link queda aquí abajo por si lo quieres mandar por otro medio."); };
    $("#asLink").onclick = async () => { const q = crear(); if (!q) { toast("Elige al menos una pregunta."); return; } const url = urlResponder(v, q); let ok = true; try { await navigator.clipboard.writeText(url); } catch (e) { ok = false; } renderAsistente(); toast(ok ? "Link creado y copiado. Pégalo donde quieras enviarlo." : "Link creado. Cópialo desde el cuadro de abajo."); };
  }
  const lc = $("#asLinkCopiar");
  if (lc) {
    const q = v.cuestionarios.find(x => asis.creado && x.id === asis.creado.q);
    lc.onclick = async () => { const t = $("#asLinkIn"); try { await navigator.clipboard.writeText(t.value); toast("Link copiado"); } catch (e) { t.select(); toast("Selecciona y copia el link (Cmd + C)"); } };
    $("#asLinkOutlook").onclick = () => { if (q && outlookDeVinculo(v, q)) toast("Se abrió Outlook"); };
    $("#asLinkFicha").onclick = () => { cerrarAsistente(); if (location.hash !== "#/ficha/" + v.id) location.hash = "#/ficha/" + v.id; else render(); };
  }
}
function outlookDeVinculo(v, q) { const to = (v.contacto.correo || "").trim(); if (!to) { toast("Agrega el correo del contacto en la ficha para abrir Outlook."); return false; } abrirOutlookWeb(to, "Cómo va " + v.nombre + " · Antofagasta Minerals", textoCuestionario(v, q.preguntas, q)); return true; }

/* ============================ Router ============================ */
function render() {
  const [ruta, p] = (location.hash || "#/login").replace(/^#\//, "").split("/");
  const app = $("#app");
  if (ruta === "convocatorias") { app.innerHTML = vConvPub(); wireConvPub(); window.scrollTo(0, 0); return; }
  if (ruta === "postular") { app.innerHTML = vPostular(p); wirePostular(p); window.scrollTo(0, 0); return; }
  if (ruta === "mi-postulacion") { app.innerHTML = vMiPostulacion(p); wireMiPostulacion(); window.scrollTo(0, 0); return; }
  if (ruta === "responder") { app.innerHTML = vResponder(p); wireResponder(p); window.scrollTo(0, 0); return; }
  migrarEstados();
  if (ruta === "reiniciar") { restablecerTodo(); cerrarSesion(); location.hash = "#/login"; setTimeout(() => toast("Listo: datos de ejemplo restablecidos y páginas vacías del Perfil 0 y Perfil 2"), 50); return; }
  if (!ME && ruta !== "login") { location.hash = "#/login"; return; }
  if (ruta === "login" || !ruta) {
    if (ME) { location.hash = inicioDe(ME); return; }
    app.innerHTML = vLogin();
    $("#btnSso").onclick = () => { loginAbierto = !loginAbierto; const c = $("#cuentas"); c.hidden = !loginAbierto; $("#btnSso").setAttribute("aria-expanded", loginAbierto); if (loginAbierto) c.querySelector("button").focus(); };
    $$("[data-login]").forEach(b => b.onclick = () => { iniciarSesion(b.dataset.login); loginAbierto = false; filtro.comp = ""; location.hash = inicioDe(ME); });
    return;
  }
  const activo = { mis: "mis", ficha: "mis", nuevo: "", editar: "mis", areas: "areas", area: "areas", contrapartes: "contrapartes", contraparte: "contrapartes", dashboard: "dashboard", admin: "admin", convocatoria: "mis", "nueva-convocatoria": "", "editar-convocatoria": "mis", metas: ME.admin ? "admin" : "metas", estudiantes: "estudiantes", "correo-aceptados": "estudiantes", ayuda: "ayuda" }[ruta];
  const vistas = { mis: vMis, ficha: vFicha, nuevo: p => vForm(null, p), editar: p => vForm(p), areas: vAreas, area: vArea, contrapartes: vContrapartes, contraparte: vContraparte, dashboard: vDashboard, admin: vAdmin, convocatoria: vConvocatoria, "nueva-convocatoria": vNuevaConv, "editar-convocatoria": p => { const c = convocatoria(+p); return c ? vNuevaConv(c.vinculo, c) : `<div class="card empty">Esa convocatoria no existe.</div>`; }, metas: vMetas, estudiantes: vEstudiantes, "correo-aceptados": vCorreoAceptados, ayuda: vAyuda };
  let body = vistas[ruta] ? vistas[ruta](p) : `<div class="card empty">No encontramos esta página.<br><button class="btn-outline" onclick="location.hash='#/mis'">Ir a Mis vínculos</button></div>`;
  // Indicador de ubicación: las páginas sin migas muestran igual en qué sección estás.
  const SECCION = { mis: ME.admin ? "Vínculos" : ME.rol === "jefatura" ? "Vínculos de mi gerencia" : "Mis vínculos", areas: "Áreas", contrapartes: "Instituciones", dashboard: "Estadísticas", admin: "Configuración", metas: "Metas", nuevo: "Añadir vínculo", "nueva-convocatoria": "Nueva convocatoria", estudiantes: "Estudiantes", ayuda: "Ayuda" };
  const CON_VOLVER = { ficha: "#/mis", nuevo: "#/mis", editar: "#/mis", area: "#/areas", contraparte: "#/contrapartes", convocatoria: "#/mis", "nueva-convocatoria": "#/mis", "editar-convocatoria": "#/mis", "correo-aceptados": "#/estudiantes" };
  if (CON_VOLVER[ruta]) body = `<div class="volver-bar"><button type="button" class="btn-back" onclick="volver('${CON_VOLVER[ruta]}')"><span aria-hidden="true">←</span> Volver</button></div>` + body;
  app.innerHTML = shell(activo) + `<main class="${body.includes('class="hero') ? "has-hero" : ""}">${body}</main>${pie()}
    <button class="fab" id="fab" aria-label="Asistente de IA"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4.5 21l4.3-2.2c1 .3 2.1.4 3.2.4 5.5 0 10-3.6 10-8S17.5 3 12 3Zm-4 9.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z"/></svg><span>Asistente de IA</span></button>
    <div class="drawer-bg" id="drawerBg"></div>
    <aside class="drawer" id="drawer" aria-label="Asistente"><div class="drawer-h"><div><b id="drawerTit">Asistente de IA</b><span class="ai-tag" id="aiModo"></span></div><button class="x" id="drawerX" aria-label="Cerrar">×</button></div><div class="drawer-b" id="drawerBody"></div></aside>
`;
  wireShell(); wireVista(ruta, p);
  $("#fab").onclick = () => abrirAsistente(ruta === "ficha" ? +p : null, "chat");
  $("#drawerX").onclick = cerrarAsistente; $("#drawerBg").onclick = cerrarAsistente;
  window.scrollTo(0, 0);
  if (irConv) { irConv = false; setTimeout(() => { const t = $("#tablaConv") || $("#convTira"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }
}

function wireContactLinks() {
  $$("[data-contact-v]").forEach(b => b.onclick = e => { e.stopPropagation(); e.preventDefault(); abrirFormContacto(+b.dataset.contactV, b.dataset.contactC || b.dataset.contactN ? { nombre: b.dataset.contactN || "", correo: b.dataset.contactC || "" } : null); });
}
function wireVista(ruta, p) {
  $$("[data-conv]").forEach(tr => { const go = () => location.hash = "#/convocatoria/" + tr.dataset.conv; tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
  $$("[data-ficha]").forEach(tr => { const go = () => location.hash = "#/ficha/" + tr.dataset.ficha; tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
  wireContactLinks();
  $$("[data-abrir-add]").forEach(b => b.onclick = e => { e.stopPropagation(); togglePop("#popAdd"); });
  if (ruta === "estudiantes") wireEstudiantes();
  if (ruta === "correo-aceptados") wireCorreoAceptados(p);
  $$("main [data-aviso]").forEach(b => b.onclick = () => abrirAviso(b.dataset.aviso, b.dataset.ir));
  const ca = $("[data-cambiar-admin]"); if (ca) ca.onclick = () => { iniciarSesion("admin", true); render(); };

  const sv = $("#sinVinc"); if (sv) sv.onclick = () => { S.sinVinculos = [...new Set([...(S.sinVinculos || []), ME.id])]; guardar(); render(); toast("Anotado. No tienes que registrar nada más."); };
  const sm = $("#semMail"); if (sm) sm.onclick = () => { abrirOutlookWeb(ME.correo, "Tu resumen de la semana en SIVA", textoSemana(misVinculos())); toast("Se abrió Outlook con tu resumen"); };
  $$("[data-ir-f]").forEach(b => b.onclick = () => { filtro.inc = true; if (location.hash === "#/mis/vinculos") render(); else location.hash = "#/mis/vinculos"; });
  if (ruta === "mis" && $("#fq")) {
    const pinta = () => { $("#tablaMisCuerpo").innerHTML = filasVinculos(listaFiltrada(), opcionesTabla()); wireVista("_tabla"); };
    $$("[data-etapa-f]").forEach(b => b.onclick = () => { filtro.etapa = +b.dataset.etapaF; render(); });
    $("#fq").oninput = e => { filtro.q = e.target.value; pinta(); };
    $("#ft").onchange = e => { filtro.tipo = e.target.value; pinta(); };
    $("#fo").onchange = e => { filtro.orden = e.target.value; pinta(); };
    $("#fs").onchange = e => { filtro.salud = e.target.value; pinta(); };
    $("#fa").onchange = e => { filtro.anio = e.target.value; pinta(); };
    $("#fag").onchange = e => { filtro.agrupar = e.target.checked; pinta(); };
    $("#fc").onchange = e => { filtro.comp = e.target.value; pinta(); };
    $("#finc").onchange = e => { filtro.inc = e.target.checked; if (!filtro.inc && p === "incompletos") location.hash = "#/mis"; else pinta(); };
  }

  if (ruta === "ficha") {
    const v = vinculo(+p); if (!v) return;
    $("#dlReadme").onclick = () => descargarFichaPDF(v);
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
      const k = criteriosDe(v.tipo, v.contraparte)[+b.dataset.crit], antes = JSON.stringify(v.criterios || {}), califAntes = v.calif;
      v.criterios = Object.assign({}, v.criterios); v.criterios[k] = +b.dataset.rate; v.calif = califDe(v.criterios);
      guardar(); render();
      toast(`${k}: ${b.dataset.rate} de 5. Calificación del vínculo: ${num1(v.calif)}`, () => { v.criterios = JSON.parse(antes); v.calif = califAntes; guardar(); render(); });
    });
    const tpA = $("#tpAbrir"); if (tpA) tpA.onclick = () => { traspasoAbierto = v.id; render(); setTimeout(() => $("#tpPara").focus(), 0); };
    const tpN = $("#tpNo"); if (tpN) tpN.onclick = () => { traspasoAbierto = null; render(); };
    const tpP = $("#tpPara"); if (tpP) tpP.onchange = () => { $("#tpOtra").hidden = tpP.value !== "__otra"; };
    const tpO = $("#tpOk"); if (tpO) tpO.onclick = () => {
      const para = tpP.value === "__otra" ? $("#tpOtra").value.trim() : tpP.value;
      if (!para) { $("#tpOtra").focus(); return; }
      v.traspaso = armarTraspaso(v, para, $("#tpProm").value.trim()); const de = v.traspaso.de;
      v.responsable = para; nuevaVersion(v, ME.nombre, `Traspaso: ${de} le dejó el vínculo a ${para}. Se generó la hoja de traspaso.`);
      traspasoAbierto = null; guardar(); render(); toast(`Listo. ${para} verá la hoja de traspaso al entrar.`);
    };
    const tpL = $("#tpLeido"); if (tpL) tpL.onclick = () => {
      const t = v.traspaso; t.leido = true; t.fechaLeido = hoy();
      nuevaVersion(v, t.para, `${t.para} leyó la hoja de traspaso y asumió el vínculo.`); guardar(); render(); toast("Quedó registrado en el historial");
    };
    $$("[data-crit]").forEach(b => { const box = b.parentElement.nextElementSibling, orig = box.innerHTML, k = criteriosDe(v.tipo, v.contraparte)[+b.dataset.crit], rb = CONFIG.rubrica[k] || [];
      b.onmouseenter = b.onfocus = () => { if (rb[b.dataset.rate - 1]) box.innerHTML = `<b>${b.dataset.rate}:</b> ${esc(rb[b.dataset.rate - 1])}`; };
      b.onmouseleave = b.onblur = () => { box.innerHTML = orig; }; });
    $$("[data-fsec-todo]").forEach(b => b.onclick = () => { const ab = b.dataset.fsecTodo === "1"; $$("details.f-sec").forEach(d => { d.open = ab; }); });
    $$("[data-scroll]").forEach(b => b.onclick = () => { const e = document.getElementById(b.dataset.scroll); if (e && e.tagName === "DETAILS") e.open = true; if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); });
    $$("[data-aporta]").forEach(b => b.onclick = () => { v.aporta = v.aporta === b.dataset.aporta ? null : b.dataset.aporta; guardar(); render(); });
    $$("[data-registrar]").forEach(b => b.onclick = () => { const box = $("#reg-" + b.dataset.registrar); box.hidden = !box.hidden; if (!box.hidden) box.querySelector("textarea").focus(); });
    $$("[data-enviado]").forEach(b => b.onclick = () => { const q = v.cuestionarios.find(x => x.id === +b.dataset.enviado); q.estado = "enviado"; q.fechaEnvio = hoy(); guardar(); render(); toast("Marcado como enviado"); });
    $$("[data-copiar-cq]").forEach(b => b.onclick = () => { const q = v.cuestionarios.find(x => x.id === +b.dataset.copiarCq); copiar(urlResponder(v, q), "Link copiado. Puedes pegarlo en un correo o en WhatsApp."); });
    $$("[data-guardar-resp]").forEach(b => b.onclick = () => {
      const q = v.cuestionarios.find(x => x.id === +b.dataset.guardarResp);
      q.respuestas = q.preguntas.map((_, i) => ($(`#reg-${q.id} [data-resp="${i}"]`) || {}).value || "");
      q.comentario = $("#com-" + q.id).value.trim();
      if (!q.comentario && !q.respuestas.some(Boolean)) { toast("Pega la respuesta o completa al menos una pregunta"); return; }
      q.estado = "respondido"; q.fechaResp = hoy(); q.via = "manual";
      nuevaVersion(v, ME.nombre, "Se registraron las respuestas del cuestionario de la institución.");
      guardar(); render(); toast("Respuestas guardadas");
    });
  }

  if (ruta === "nuevo" || ruta === "editar") {
    const base = ruta === "editar" ? vinculo(+p) : null;
    if (ruta === "editar" && (!base || !puedeEditar(base))) return;
    if (!$("#guardar")) return;
    if (base) wireEliminar(() => eliminarVinculo(base));
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
          ${ks.length ? `<div class="contact-grid">${ks.map(tarjeta).join("")}</div>` : `<p class="help inner">Todavía no hay contactos guardados. Lo que escribas abajo quedará para las otras áreas.</p>`}
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
  if (ruta === "editar-convocatoria") { const c = convocatoria(+p); if (c) wireNuevaConv(c.vinculo, c); }
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

/* ============================ Traspaso de vínculo ============================
   Cuando cambia el encargado/a, SIVA arma una hoja con lo que hay que saber.
   El nuevo encargado/a la lee y confirma con "Leí y asumo". */
let traspasoAbierto = null;
let evaluando = null;
function abrirEvaluacion(id) { evaluando = id; render(); setTimeout(() => { const e = $("#f-eval"); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); }
function abrirTraspaso(id) { traspasoAbierto = id; render(); setTimeout(() => { const e = $("#tpPara"); if (e) { e.scrollIntoView({ block: "center" }); e.focus(); } }, 0); }
const candidatosTraspaso = v => Object.values(CONFIG.usuarios).filter(u => u.rol === "gestor" && !u.espacio && u.area && descendientes(u.area).includes(v.area) && u.nombre !== v.responsable);
function traspasoFormHTML(v) {
  const cs = candidatosTraspaso(v);
  return `<div class="tp-form"><label class="f" for="tpPara">Nuevo encargado/a</label>
    <select class="input" id="tpPara">${cs.map(u => `<option>${esc(u.nombre)}</option>`).join("")}<option value="__otra">Otra persona…</option></select>
    <input class="input" id="tpOtra" placeholder="Nombre" hidden style="margin-top:6px">
    <label class="f" for="tpProm">Qué se le prometió a la institución</label><textarea class="input" id="tpProm" rows="3" placeholder="Compromisos que siguen abiertos">${esc(v.comentarios || "")}</textarea>
    <p class="help">Con esto y los datos de la ficha se arma la hoja de traspaso.</p>
    <div class="form-actions"><button class="btn-accent" id="tpOk">Traspasar</button><button class="btn-outline" id="tpNo">Cancelar</button></div></div>`;
}
function armarTraspaso(v, para, prometido) {
  const sr = sinRespuesta(v), comp = completitud(v), alts = contactosDe(v.contraparte).filter(k => k.nombre !== v.contacto.nombre).slice(0, 2);
  const alertas = [sr ? sr.texto : "", comp.faltan.length ? "Faltan datos de la ficha: " + comp.faltan.join(", ") + "." : "", saludDe(v).k === "rojo" ? saludDe(v).motivo : ""].filter(Boolean);
  return { fecha: hoy(), de: v.responsable || "Sin encargado/a", para, prometido,
    reuniones: v.reuniones.slice(-3).reverse(), pendientes: v.hitos.filter(h => !h.ok).map(h => h.t),
    contacto: Object.assign({}, v.contacto), alternativos: alts.map(k => ({ nombre: k.nombre, cargo: k.cargo || "", correo: k.correo || "" })), alertas, leido: false };
}
function hojaTraspasoHTML(v, pendiente) {
  const t = v.traspaso, persona = k => `<div class="person"><b>${esc(k.nombre || "Sin nombre")}</b>${k.cargo ? `<span>${esc(k.cargo)}</span>` : ""}${k.correo ? `<a class="mail" href="mailto:${esc(k.correo)}">${esc(k.correo)}</a>` : ""}</div>`;
  const cuerpo = `<div class="tp-grid">
    <div><p class="lbl2">Últimas reuniones</p>${t.reuniones.length ? t.reuniones.map(r => `<div class="fb"><b>${fechaTxt(r.fecha)}</b><br>${esc(r.resumen)}</div>`).join("") : `<p class="muted small">No hay reuniones registradas.</p>`}
      <p class="lbl2">Qué se prometió</p><p class="small">${t.prometido ? esc(t.prometido).replace(/\n/g, "<br>") : `<span class="muted">No se anotó nada.</span>`}</p></div>
    <div><p class="lbl2">Qué falta del plan de trabajo</p>${t.pendientes.length ? `<ul class="tp-list">${t.pendientes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted small">El plan de trabajo está completo.</p>`}
      <p class="lbl2">Contacto principal</p>${t.contacto.nombre || t.contacto.correo ? persona(t.contacto) : `<p class="muted small">No hay contacto principal.</p>`}
      <p class="lbl2">Contacto alternativo</p>${t.alternativos.length ? t.alternativos.map(persona).join("") : `<p class="muted small">No hay. Conviene conseguir uno.</p>`}
      <p class="lbl2">Alertas abiertas</p>${t.alertas.length ? `<ul class="tp-list tp-alert">${t.alertas.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted small">Sin alertas.</p>`}</div></div>`;
  if (!pendiente) return cuerpo + `<p class="help">${esc(t.para)} la leyó y asumió el vínculo el ${fechaTxt(t.fechaLeido)}.</p>`;
  return `<div class="card tp-card"><div class="head-row"><div><p class="card-title">Hoja de traspaso</p><p class="small" style="margin:0">${esc(t.de)} le traspasó este vínculo a <b>${esc(t.para)}</b> el ${fechaTxt(t.fecha)}.</p></div>
    ${puedeEditar(v) ? `<button class="btn-accent" id="tpLeido">Leí y asumo${ME.nombre === t.para ? "" : ` (como ${esc(t.para)})`}</button>` : ""}</div>${cuerpo}
    ${ME.nombre === t.para ? "" : `<p class="help">Lo confirma ${esc(t.para)} al entrar. En el prototipo puedes confirmarlo desde cualquier perfil del área, o cambiar al perfil de Matías.</p>`}</div>`;
}

/* ============================ Eliminar ============================
   Pide confirmar en la misma página (sin ventanas del navegador) y deja deshacer. */
let confirmarEliminar = false;
const zonaEliminar = (que, txt) => `<div class="zona-eliminar"><div><b>Eliminar ${que}</b><p class="help">${txt}</p></div>${confirmarEliminar ? `<div class="form-actions"><button class="btn-danger" id="elimSi">Sí, eliminar</button><button class="btn-outline" id="elimNo">Cancelar</button></div>` : `<button class="btn-outline danger" id="elim">Eliminar ${que}</button>`}</div>`;
function wireEliminar(fn) {
  const a = $("#elim"); if (a) a.onclick = () => { confirmarEliminar = true; render(); setTimeout(() => { const b = $("#elimSi"); if (b) b.scrollIntoView({ block: "center" }); }, 0); };
  const no = $("#elimNo"); if (no) no.onclick = () => { confirmarEliminar = false; render(); };
  const si = $("#elimSi"); if (si) si.onclick = () => { confirmarEliminar = false; fn(); };
}
function snapshot() { const k = JSON.stringify({ v: S.vinculos, c: S.convocatorias, e: S.estudiantes }); return () => { const o = JSON.parse(k); S.vinculos = o.v; S.convocatorias = o.c; S.estudiantes = o.e; guardar(); render(); }; }
function eliminarVinculo(v) {
  const undo = snapshot(), ids = convDe(v.id).map(c => c.id);
  S.vinculos = S.vinculos.filter(x => x.id !== v.id);
  S.convocatorias = S.convocatorias.filter(c => c.vinculo !== v.id);
  S.estudiantes = S.estudiantes.filter(e => !ids.includes(e.conv));
  guardar(); location.hash = "#/mis"; setTimeout(() => toast(`Se eliminó "${v.nombre}"`, undo), 30);
}
function eliminarConv(c) {
  const undo = snapshot();
  S.convocatorias = S.convocatorias.filter(x => x.id !== c.id);
  S.estudiantes = S.estudiantes.filter(e => e.conv !== c.id);
  guardar(); location.hash = c.vinculo ? "#/ficha/" + c.vinculo : "#/mis"; setTimeout(() => toast(`Se eliminó la convocatoria "${c.titulo}"`, undo), 30);
}
// Pila de páginas visitadas dentro de la app, para el botón "Volver".
const pilaNav = [];
let volviendo = false;
window.addEventListener("hashchange", () => {
  confirmarEliminar = false; traspasoAbierto = null; evaluando = null;
  const h = location.hash;
  if (volviendo) { volviendo = false; return; }
  if (pilaNav[pilaNav.length - 2] === h) pilaNav.pop(); else if (pilaNav[pilaNav.length - 1] !== h) pilaNav.push(h);
});
pilaNav.push(location.hash);
function volver(porDefecto) {
  if (pilaNav.length > 1) { pilaNav.pop(); volviendo = true; location.hash = pilaNav[pilaNav.length - 1]; }
  else location.hash = porDefecto || "#/mis";
}

/* ============================ Feedback de la institución (página pública) ============================
   La contraparte responde en un link, sin cuenta y sin correos de ida y vuelta.
   En el prototipo las respuestas se guardan en el navegador; en la versión real
   llegarían al servidor de SIVA. Ruta: #/responder/<vínculo>.<cuestionario> */
let respEnviado = null;
function buscarCuestionario(p) {
  const [vid, qid] = String(p || "").split(".").map(Number);
  const v = vinculo(vid), q = v && v.cuestionarios.find(x => x.id === qid);
  return { v, q };
}
function vResponder(p) {
  const { v, q } = buscarCuestionario(p);
  const head = `<header class="pub-top"><div class="pub-inner">${logoAmsa()}<span class="prod"><b>Feedback</b><span>Para instituciones que trabajan con Antofagasta Minerals</span></span></div></header>`;
  if (!v || !q) return head + `<main class="pub"><div class="card empty">Este link no es válido o el cuestionario fue eliminado.</div></main>${pie()}`;
  const c = contraparte(v.contraparte);
  const intro = `<p class="sub">${esc(c.nombre)} · ${esc(tipo(v.tipo).nombre)}</p><h1>¿Cómo va "${esc(v.nombre)}"?</h1>
    <p class="small">${esc(nombreArea(v.area))} de Antofagasta Minerals quiere saber cómo ha funcionado este trabajo conjunto. Son ${q.preguntas.length} preguntas y toma menos de 5 minutos. No necesitas crear una cuenta.</p>`;
  if (q.estado === "respondido" || respEnviado === p) return head + `<main class="pub">${intro}<div class="card ok-box"><h2>¡Gracias por responder!</h2><p>Tus respuestas le llegaron a ${esc(v.responsable || nombreArea(v.area))}. Si necesitas algo más, puedes responder el correo con que te llegó este link.</p></div>${resumenInstHTML(v)}</main>${pie()}`;
  const campo = (txt, i) => {
    const b = PREGUNTAS_BASE.find(x => x.texto === txt);
    if (b && b.tipo === "escala") return `<div class="escala" role="radiogroup" aria-label="${esc(txt)}">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="r${i}" value="${n}" data-r="${i}"><span>${n}</span></label>`).join("")}</div><div class="escala-lbl"><span>Muy mal</span><span>Muy bien</span></div>`;
    if (b && b.tipo === "opciones") return `<div class="resp-seg">${b.opciones.map(o => `<label><input type="radio" name="r${i}" value="${esc(o)}" data-r="${i}"><span>${esc(o)}</span></label>`).join("")}</div>`;
    return `<textarea class="input" rows="2" data-r="${i}"></textarea>`;
  };
  return head + `<main class="pub">${intro}
    <div class="card">${q.preguntas.map((t, i) => `<div class="preg"><p class="f"><b>${i + 1}.</b> ${esc(t)}</p>${campo(t, i)}</div>`).join("")}
      <div class="preg"><label class="f" for="rCom">¿Algo más que quieras contarnos? (opcional)</label><textarea class="input" id="rCom" rows="3"></textarea></div>
      <div class="err" id="eResp">Responde al menos una pregunta.</div>
      <div class="form-actions"><button class="btn-accent" id="rEnviar">Enviar respuestas</button></div></div>
    <p class="help" style="text-align:center">Tus respuestas solo las ve el equipo de Antofagasta Minerals que lleva este vínculo.</p></main>${pie()}`;
}
/* Lo que recibe la institución a cambio de su feedback: cuántos de sus
   estudiantes postularon, fueron aceptados, están en práctica y terminaron.
   Cuenta las convocatorias de este vínculo y a quienes postularon desde esa institución. Sin nombres. */
function resumenInstHTML(v) {
  const c = contraparte(v.contraparte);
  const ps = S.convocatorias.flatMap(cv => cv.postulantes.filter(p => cv.vinculo === v.id || p.universidad === c.nombre));
  const k = cicloDe(ps);
  return `<div class="card"><p class="card-title">Tus estudiantes en Antofagasta Minerals</p>
    ${ps.length ? cicloHTML(k) + `<p class="help">Cifras de las convocatorias de AMSA en que postularon estudiantes de ${esc(c.nombre)}. No incluye nombres.</p>` : `<p class="small muted">Todavía no hay estudiantes de ${esc(c.nombre)} que hayan postulado por SIVA.</p>`}</div>`;
}
function wireResponder(p) {
  const { v, q } = buscarCuestionario(p); const b = $("#rEnviar"); if (!b) return;
  b.onclick = () => {
    const r = q.preguntas.map((_, i) => { const sel = $(`input[data-r="${i}"]:checked`); const ta = $(`textarea[data-r="${i}"]`); return sel ? sel.value : ta ? ta.value.trim() : ""; });
    const com = $("#rCom").value.trim();
    if (!r.some(Boolean) && !com) { $("#eResp").classList.add("show"); return; }
    Object.assign(q, { respuestas: r, comentario: com, estado: "respondido", fechaResp: hoy(), via: "link" });
    nuevaVersion(v, contraparte(v.contraparte).corto + " (respondió en el link)", "La institución respondió el cuestionario de feedback.");
    guardar(); respEnviado = p; render();
  };
}

// Arranque: al final del archivo, cuando ya existen todas las variables de las vistas
// (si no, abrir directo un link como #/ficha/3 fallaba).
window.addEventListener("hashchange", render);
render();
AI.iniciar();
