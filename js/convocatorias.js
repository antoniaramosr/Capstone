/* Convocatorias para estudiantes: crear una oferta desde un vínculo, publicarla
   en LinkedIn, recibir postulaciones en una página pública y registrar quiénes
   quedan. Se carga antes de app.js; app.js llama a estas vistas desde el router. */

const CONV_TIPOS_VINCULO = ["tal", "emp"];           // Prácticas y memorias, Empleo y oficios
const CONV_TIPOS = ["Práctica profesional", "Memoria", "Práctica de verano"];
const POST_ESTADOS = ["Postuló", "En revisión", "Quedó", "No quedó"];

function convSemilla(s) {
  const v = s.vinculos.find(x => x.nombre === "Búsqueda y difusión de memoristas");
  if (!v) return [];
  return [{
    id: 1, vinculo: v.id, area: v.area, compania: v.compania || "cen", institucion: v.contraparte, titulo: "Memorias 2027: Ingeniería Civil de Minas",
    tipo: "Memoria", carreras: "Ingeniería Civil de Minas, Ingeniería Civil Industrial",
    cupos: 3, cierre: "2026-11-15", lugar: "Antofagasta, con visitas a faena",
    condiciones: "Seis meses desde marzo, jornada completa, con apoyo económico mensual.",
    descripcion: "Memorias en temas definidos con las gerencias de operación, con un tutor o tutora de AMSA.",
    requisitos: "Haber terminado los cursos del último año y tener tema de memoria aprobado por la universidad.",
    estado: "Abierta", creada: "2026-10-01",
    linkedin: { publicada: true, fecha: "2026-10-02" },
    postulantes: [
      { nombre: "Camila Rojas", correo: "camila.rojas@ejemplo.cl", universidad: "Universidad Católica del Norte", carrera: "Ingeniería Civil de Minas", fecha: "2026-10-03", estado: "Quedó" },
      { nombre: "Diego Fuentes", correo: "diego.fuentes@ejemplo.cl", universidad: "Universidad de Antofagasta", carrera: "Ingeniería Civil de Minas", fecha: "2026-10-04", estado: "En revisión" },
      { nombre: "Valentina Muñoz", correo: "valentina.munoz@ejemplo.cl", universidad: "Universidad Católica del Norte", carrera: "Ingeniería Civil Industrial", fecha: "2026-10-06", estado: "Postuló" },
      { nombre: "Tomás Herrera", correo: "tomas.herrera@ejemplo.cl", universidad: "Universidad de Chile", carrera: "Ingeniería Civil de Minas", fecha: "2026-10-07", estado: "Postuló" }
    ]
  }];
}

// Los datos guardados antes de esta versión no traen convocatorias: se agregan.
const _estadoInicialBase = estadoInicial;
estadoInicial = function () { const s = _estadoInicialBase(); s.convocatorias = convSemilla(s); return s; };
if (!S.convocatorias) { S.convocatorias = convSemilla(S); guardar(); }

const convocatoria = id => S.convocatorias.find(c => c.id === id);
const convArea = c => c.area || (vinculo(c.vinculo) || {}).area;
const convInst = c => c.institucion != null ? c.institucion : (vinculo(c.vinculo) || {}).contraparte || "";
const convComp = c => c.compania || (vinculo(c.vinculo) || {}).compania || "";
const puedeEditarConv = c => ME && (ME.admin || (ME.rol === "gestor" && descendientes(ME.area).includes(convArea(c))));
const instTxt = c => convInst(c) ? contraparte(convInst(c)).nombre : "Abierta a todas las universidades";
const convDe = vid => S.convocatorias.filter(c => c.vinculo === vid);
const urlPostular = c => location.href.split("#")[0] + "#/postular/" + c.id;
const quedaron = c => c.postulantes.filter(p => p.estado === "Quedó");
const sinRevisar = c => c.postulantes.filter(p => p.estado === "Postuló");
const convPill = c => `<span class="pill ${c.estado === "Abierta" ? "p2" : "p3"}">${c.estado}</span>`;

function textoLinkedIn(c) {
  const cp = convInst(c) ? contraparte(convInst(c)) : null;
  return [
    `Buscamos estudiantes para ${c.tipo.toLowerCase()} en Antofagasta Minerals.`,
    "",
    c.titulo,
    c.carreras ? `Carreras: ${c.carreras}` : "",
    c.lugar ? `Lugar: ${c.lugar}` : "",
    c.condiciones ? `Condiciones: ${c.condiciones}` : "",
    `Cupos: ${c.cupos}. Postulaciones hasta el ${fechaTxt(c.cierre)}.`,
    cp && cp.tipoOrg === "Universidad" ? `En alianza con ${cp.nombre}.` : "",
    "",
    `Postula aquí: ${urlPostular(c)}`
  ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i > 0)).join("\n");
}

/* ---------- Bloques que se muestran en otras pantallas ---------- */
function convFichaHTML(v, ed) {
  if (!CONV_TIPOS_VINCULO.includes(v.tipo)) return "";
  const cs = convDe(v.id);
  return `<div class="card"><div class="head-row"><p class="card-title">Convocatorias para estudiantes</p>${ed ? `<button class="link-btn" onclick="location.hash='#/nueva-convocatoria/${v.id}'">+ Crear convocatoria</button>` : ""}</div>
    ${cs.length ? cs.map(c => `<a class="conv-row" href="#/convocatoria/${c.id}"><span><b>${esc(c.titulo)}</b><small>${c.postulantes.length} postulantes · ${quedaron(c).length} de ${c.cupos} cupos llenos · cierra el ${fechaTxt(c.cierre)}</small></span>${convPill(c)}</a>`).join("")
      : `<p class="muted small">Aún no hay convocatorias. Crea una para publicar la oferta, recibir postulaciones y registrar quiénes quedan.</p>`}</div>`;
}

function convMisHTML() {
  const cs = S.convocatorias.filter(c => c.estado === "Abierta" && (ME.admin || descendientes(ME.area).includes(convArea(c))));
  if (!cs.length) return "";
  return `<div class="card"><p class="card-title">Convocatorias abiertas</p>${cs.map(c => `<a class="mini-row" href="#/convocatoria/${c.id}"><b>${esc(c.titulo)}</b><span>${c.postulantes.length} postulantes${sinRevisar(c).length ? `, ${sinRevisar(c).length} sin revisar` : ""} · cierra el ${fechaTxt(c.cierre)}</span></a>`).join("")}</div>`;
}

/* ---------- Crear convocatoria ---------- */
function vNuevaConv(vid) {
  const v = vid ? vinculo(+vid) : null;
  if (vid && !v) return `<div class="card empty">Ese vínculo no existe.</div>`;
  if (v ? !puedeEditar(v) : !puedeCrear()) return `<div class="card empty">Tu perfil no puede crear convocatorias.</div>`;
  const cp = v ? contraparte(v.contraparte) : null;
  return `<div class="crumbs"><a href="#/mis">Mis vínculos</a> / ${v ? `<a href="#/ficha/${v.id}">${esc(v.nombre)}</a> / ` : ""}Crear convocatoria</div>
  <h1>Crear convocatoria</h1><p class="sub">${v ? `Para ${esc(v.nombre)} con ${esc(cp.nombre)}. ` : ""}Los estudiantes postulan desde un link público y tú revisas las postulaciones aquí.</p>
  <div class="grid-main"><div class="card">
    <div class="g2">
      ${v ? "" : `<div><label class="f" for="cInst">Universidad o institución</label><select class="input" id="cInst"><option value="">Abierta a todas las universidades</option>${S.contrapartes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(x => `<option value="${x.id}">${esc(x.nombre)}</option>`).join("")}</select></div>
      <div><label class="f" for="cArea">Área responsable</label><select class="input" id="cArea">${opcionesArea(ME.area)}</select></div>
      <div><label class="f" for="cComp">Compañía</label><select class="input" id="cComp">${S.companias.map(x => `<option value="${x.id}" ${ME.compania === x.id ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select></div><div></div>`}
      <div class="full"><label class="f" for="cTit">Título de la convocatoria *</label><input class="input" id="cTit" placeholder="Ej.: Prácticas profesionales verano 2027"><div class="err" id="eTit">Escribe un título.</div></div>
      <div><label class="f" for="cTipo">Tipo</label><select class="input" id="cTipo">${CONV_TIPOS.map(t => `<option>${t}</option>`).join("")}</select></div>
      <div><label class="f" for="cCupos">Cupos</label><input class="input" id="cCupos" type="number" min="1" value="1"></div>
      <div class="full"><label class="f" for="cCar">Carreras</label><input class="input" id="cCar" placeholder="Ej.: Ingeniería Civil de Minas, Geología"></div>
      <div><label class="f" for="cLugar">Lugar</label><input class="input" id="cLugar" placeholder="Ej.: Faena Centinela, turno 4x4"></div>
      <div><label class="f" for="cCierre">Postulaciones hasta *</label><input class="input" id="cCierre" type="date"><div class="err" id="eCierre">Elige la fecha de cierre.</div></div>
      <div class="full"><label class="f" for="cCond">Condiciones</label><input class="input" id="cCond" placeholder="Duración, jornada, si hay pago o beneficios"><p class="help">Lo que más piden los estudiantes antes de postular: sueldo o apoyo, turnos, lugar y fechas.</p></div>
      <div class="full"><label class="f" for="cDesc">Qué hará la o el estudiante</label><textarea class="input" id="cDesc" rows="2"></textarea></div>
      <div class="full"><label class="f" for="cReq">Requisitos</label><textarea class="input" id="cReq" rows="2"></textarea></div>
    </div>
    <label class="chk li-chk"><input type="checkbox" id="cLi" checked> Publicar también en LinkedIn</label>
    <div class="form-actions"><button class="btn-accent" id="cGuardar">Crear convocatoria</button><button class="btn-outline" onclick="${v ? `location.hash='#/ficha/${v.id}'` : "history.back()"}">Cancelar</button></div>
  </div>
  <aside class="stack sticky-aside"><div class="card" id="liBox"><p class="card-title">Así se verá en LinkedIn</p><div class="li-post" id="liPrev"></div></div></aside></div>`;
}

function leerConv(v) {
  const sel = id => ($("#" + id) || {}).value;
  return {
    vinculo: v ? v.id : null, area: v ? v.area : sel("cArea"), compania: v ? (v.compania || "") : sel("cComp"), institucion: v ? v.contraparte : (sel("cInst") || ""), titulo: $("#cTit").value.trim(), tipo: $("#cTipo").value,
    carreras: $("#cCar").value.trim(), cupos: Math.max(1, +$("#cCupos").value || 1),
    cierre: $("#cCierre").value, lugar: $("#cLugar").value.trim(), condiciones: $("#cCond").value.trim(),
    descripcion: $("#cDesc").value.trim(), requisitos: $("#cReq").value.trim()
  };
}

let liAbierto = false;
function wireNuevaConv(vid) {
  const v = vid ? vinculo(+vid) : null; if (!$("#cGuardar")) return;
  const prev = () => {
    const c = Object.assign({ id: "nueva", titulo: "", cupos: 1, cierre: "" }, leerConv(v));
    $("#liPrev").innerHTML = liPostHTML(c);
    $("#liBox").hidden = !$("#cLi").checked;
  };
  $$("main input, main select, main textarea").forEach(el => el.addEventListener("input", prev));
  $("#cLi").onchange = prev; prev();
  $("#cTit").addEventListener("input", () => $("#eTit").classList.remove("show"));
  $("#cCierre").addEventListener("input", () => $("#eCierre").classList.remove("show"));
  $("#cGuardar").onclick = () => {
    const d = leerConv(v);
    $("#eTit").classList.toggle("show", !d.titulo); $("#eCierre").classList.toggle("show", !d.cierre);
    if (!d.titulo || !d.cierre) return;
    const id = S.convocatorias.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    S.convocatorias.push(Object.assign(d, { id, estado: "Abierta", creada: hoy(), linkedin: { publicada: false, fecha: "" }, postulantes: [] }));
    guardar();
    liAbierto = $("#cLi").checked;
    location.hash = "#/convocatoria/" + id;
    setTimeout(() => toast(liAbierto ? "Convocatoria creada. Ahora publícala en LinkedIn." : "Convocatoria creada"), 50);
  };
}

function liPostHTML(c) {
  const t = textoLinkedIn(c).replace(/^Postula aquí: .*$/m, "").trim();
  return `<div class="li-h"><span class="li-logo">AM</span><div><b>Antofagasta Minerals</b><small>Publicación de la empresa</small></div></div>
    <p>${esc(t || "Completa el formulario para ver la publicación.").replace(/\n/g, "<br>")}</p>
    <div class="li-link"><b>${esc(c.titulo || "Título de la convocatoria")}</b><small>Postula en la página de Vínculos AMSA</small></div>`;
}

/* ---------- Detalle de la convocatoria (interno) ---------- */
function vConvocatoria(id) {
  const c = convocatoria(+id);
  if (!c) return `<div class="card empty">Esa convocatoria no existe.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver</button></div>`;
  const v = vinculo(c.vinculo), ed = puedeEditarConv(c), q = quedaron(c);
  const local = location.protocol === "file:";
  return `<div class="crumbs"><a href="#/mis">Mis vínculos</a> / ${v ? `<a href="#/ficha/${v.id}">${esc(v.nombre)}</a> / ` : ""}Convocatoria</div>
  <div class="head-row"><div><h1>${esc(c.titulo)}</h1><p class="sub">${esc(c.tipo)} · ${esc(instTxt(c))} · ${compTag(convComp(c))} · cierra el ${fechaTxt(c.cierre)}</p></div>${convPill(c)}</div>
  <div class="statbar">
    <div><span class="lbl">Postulantes</span><b class="statnum">${c.postulantes.length}</b></div>
    <div><span class="lbl">Cupos llenos</span><span class="pcell">${barra(Math.round(q.length / c.cupos * 100))}<b>${q.length} de ${c.cupos}</b></span></div>
    <div class="actions">${ed ? `<button class="btn-outline" id="convEstado">${c.estado === "Abierta" ? "Cerrar convocatoria" : "Reabrir"}</button>` : ""}<a class="btn-outline" href="#/postular/${c.id}" target="_blank" rel="noopener">Ver página de postulación</a></div>
  </div>
  <div class="grid-main"><div class="stack">
    <div class="card"><div class="head-row"><p class="card-title">Postulantes</p><span class="muted small">Cambia el estado a medida que revisas. Quienes quedan se registran en el vínculo.</span></div>
      ${c.postulantes.length ? `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Universidad y carrera</th><th>Postuló</th><th>Estado</th></tr></thead><tbody>${c.postulantes.map((p, i) => `<tr><td><span class="t">${esc(p.nombre)}</span><small><a class="lnk" href="mailto:${esc(p.correo)}">${esc(p.correo)}</a></small></td><td>${esc(p.universidad)}<small>${esc(p.carrera)}</small></td><td><small style="color:var(--ink)">${fechaTxt(p.fecha)}</small></td><td><select class="input sm est-${POST_ESTADOS.indexOf(p.estado)}" data-post="${i}" ${ed ? "" : "disabled"} aria-label="Estado de ${esc(p.nombre)}">${POST_ESTADOS.map(e => `<option ${p.estado === e ? "selected" : ""}>${e}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Aún no hay postulaciones. Comparte el link de postulación o publícala en LinkedIn.</div>`}
    </div>
    <div class="card"><p class="card-title">Detalle de la oferta</p><dl class="kv">
      <dt>Carreras</dt><dd class="${c.carreras ? "" : "ph"}">${esc(c.carreras || "Por completar")}</dd>
      <dt>Lugar</dt><dd class="${c.lugar ? "" : "ph"}">${esc(c.lugar || "Por completar")}</dd>
      <dt>Condiciones</dt><dd class="${c.condiciones ? "" : "ph"}">${esc(c.condiciones || "Por completar")}</dd>
      <dt>Qué hará</dt><dd class="${c.descripcion ? "" : "ph"}">${esc(c.descripcion || "Por completar")}</dd>
      <dt>Requisitos</dt><dd class="${c.requisitos ? "" : "ph"}">${esc(c.requisitos || "Por completar")}</dd></dl></div>
  </div>
  <aside class="stack">
    <div class="card side"><p class="card-title">LinkedIn</p>
      ${c.linkedin.publicada ? `<p class="li-ok">Publicada el ${fechaTxt(c.linkedin.fecha)}</p>` : `<p class="small">Aún no está publicada.</p>`}
      ${ed ? `<button class="${c.linkedin.publicada ? "btn-outline" : "btn-accent"} wide" id="liToggle">${c.linkedin.publicada ? "Publicar de nuevo" : "Publicar en LinkedIn"}</button>` : ""}
      <div id="liPanel" ${liAbierto ? "" : "hidden"}>
        <label class="f" for="liTxt">Texto de la publicación</label>
        <textarea class="input" id="liTxt" rows="9">${esc(textoLinkedIn(c))}</textarea>
        <div class="form-actions"><button class="btn-accent" id="liAbrir">Abrir LinkedIn</button><button class="btn-outline" id="liCopiar">Copiar texto</button></div>
        <p class="help">Se abre LinkedIn con el texto listo. Revísalo, publícalo y vuelve para marcarla como publicada.</p>
        <button class="link-btn" id="liMarcar">Ya la publiqué</button>
      </div></div>
    <div class="card side"><p class="card-title">Link de postulación</p>
      <div class="inline-form"><input class="input" id="linkPost" value="${esc(urlPostular(c))}" readonly aria-label="Link de postulación"><button class="btn-outline" id="copiarLink">Copiar</button></div>
      ${local ? `<p class="help">Estás viendo la página desde tu computador: este link solo le funcionará a otras personas cuando la página esté publicada (por ejemplo, en GitHub Pages).</p>` : ""}</div>
    <div class="card side"><p class="card-title">Quedaron</p>${q.length ? q.map(p => `<div class="person"><b>${esc(p.nombre)}</b><span>${esc(p.universidad)}</span></div>`).join("") : `<p class="muted small">Todavía nadie. Marca "Quedó" en la lista de postulantes.</p>`}</div>
  </aside></div>`;
}

// Quien queda en una convocatoria pasa a la lista de estudiantes en práctica o memoria.
function sincEstudiante(c, p) {
  S.estudiantes = S.estudiantes.filter(e => !(e.conv === c.id && e.nombre === p.nombre));
  if (p.estado === "Quedó") {
    const inst = S.contrapartes.find(x => x.nombre === p.universidad);
    S.estudiantes.push({ nombre: p.nombre, tipo: c.tipo, contraparte: inst ? inst.id : "", area: convArea(c), compania: convComp(c), nota: null, conv: c.id });
  }
}

function copiar(txt, msg) {
  const ok = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, ok);
  else { const t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); ok(); }
}

function wireConv(id) {
  const c = convocatoria(+id); if (!c) return;
  liAbierto = false;
  $$("[data-post]").forEach(s => s.onchange = e => {
    const p = c.postulantes[+s.dataset.post], antes = p.estado;
    p.estado = e.target.value; sincEstudiante(c, p); guardar(); render();
    const msg = p.estado === "Quedó" ? `${p.nombre} quedó. Se le avisó por correo y pasa a Estudiantes.` : p.estado === "No quedó" ? `Se le avisó por correo a ${p.nombre}.` : "Estado actualizado";
    toast(msg, () => { p.estado = antes; sincEstudiante(c, p); guardar(); render(); });
  });
  const ce = $("#convEstado"); if (ce) ce.onclick = () => { c.estado = c.estado === "Abierta" ? "Cerrada" : "Abierta"; guardar(); render(); toast(c.estado === "Cerrada" ? "Convocatoria cerrada: ya no recibe postulaciones" : "Convocatoria abierta"); };
  const lt = $("#liToggle"); if (lt) lt.onclick = () => { const p = $("#liPanel"); p.hidden = !p.hidden; if (!p.hidden) $("#liTxt").focus(); };
  const la = $("#liAbrir"); if (la) la.onclick = () => window.open("https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent($("#liTxt").value), "_blank", "noopener");
  const lc = $("#liCopiar"); if (lc) lc.onclick = () => copiar($("#liTxt").value, "Texto copiado");
  const lm = $("#liMarcar"); if (lm) lm.onclick = () => { c.linkedin = { publicada: true, fecha: hoy() }; guardar(); render(); toast("Marcada como publicada en LinkedIn"); };
  $("#copiarLink").onclick = () => copiar($("#linkPost").value, "Link copiado");
}

/* ---------- Página pública para postular (sin iniciar sesión) ---------- */
let postEnviado = null;
function vPostular(id) {
  const c = convocatoria(+id);
  const head = `<header class="pub-top"><div class="pub-inner"><a href="#/convocatorias"><b>Antofagasta Minerals</b><span>Convocatorias para estudiantes</span></a></div></header>`;
  if (!c) return head + `<main class="pub"><div class="card empty">Esta convocatoria no existe o fue eliminada.</div></main>`;
  const cp = convInst(c) ? contraparte(convInst(c)) : { tipoOrg: "" };
  const unis = S.contrapartes.filter(x => x.tipoOrg === "Universidad" || x.tipoOrg === "Instituto profesional" || x.tipoOrg === "Centro de formación técnica").map(x => x.nombre).sort();
  const det = (k, val) => val ? `<dt>${k}</dt><dd>${esc(val)}</dd>` : "";
  const cuerpo = postEnviado === c.id
    ? `<div class="card ok-box"><h2>¡Recibimos tu postulación!</h2><p>Te escribiremos al correo que dejaste cuando revisemos las postulaciones. La convocatoria cierra el ${fechaTxt(c.cierre)}.</p><button class="btn-outline" id="otra">Enviar otra postulación</button></div>`
    : c.estado !== "Abierta"
      ? `<div class="card empty">Esta convocatoria ya cerró y no está recibiendo postulaciones.</div>`
      : `<div class="card"><p class="card-title">Postula</p><div class="g2">
          <div class="full"><label class="f" for="pNom">Nombre completo *</label><input class="input" id="pNom" autocomplete="name"></div>
          <div class="full"><label class="f" for="pCor">Correo *</label><input class="input" id="pCor" type="email" autocomplete="email"></div>
          <div><label class="f" for="pUni">Universidad o institución *</label><select class="input" id="pUni"><option value=""></option>${unis.map(u => `<option>${esc(u)}</option>`).join("")}<option>Otra</option></select></div>
          <div><label class="f" for="pCar">Carrera *</label><input class="input" id="pCar"></div>
          <div class="full"><label class="f" for="pCv">Link a tu CV o LinkedIn (opcional)</label><input class="input" id="pCv" type="url"></div></div>
          <div class="err" id="ePost">Completa los campos con asterisco y un correo válido.</div>
          <div class="form-actions"><button class="btn-accent" id="pEnviar">Enviar postulación</button></div></div>`;
  return head + `<main class="pub">
    <a class="lnk small" href="#/convocatorias">← Todas las convocatorias</a>
    <p class="sub">${esc(c.tipo)}${cp.tipoOrg === "Universidad" ? " · en alianza con " + esc(cp.nombre) : ""}</p>
    <h1>${esc(c.titulo)}</h1>
    <div class="card"><dl class="kv">${det("Carreras", c.carreras)}${det("Lugar", c.lugar)}${det("Condiciones", c.condiciones)}${det("Qué harás", c.descripcion)}${det("Requisitos", c.requisitos)}<dt>Cupos</dt><dd>${c.cupos}</dd><dt>Postulaciones hasta</dt><dd>${fechaTxt(c.cierre)}</dd></dl></div>
    ${cuerpo}
    <p class="help" style="text-align:center;margin-top:18px">Prototipo IDI2025 · datos de ejemplo</p></main>`;
}

function wirePostular(id) {
  const c = convocatoria(+id); if (!c) return;
  const o = $("#otra"); if (o) o.onclick = () => { postEnviado = null; render(); };
  const b = $("#pEnviar"); if (!b) return;
  $$("main.pub input, main.pub select").forEach(el => el.addEventListener("input", () => $("#ePost").classList.remove("show")));
  b.onclick = () => {
    const d = { nombre: $("#pNom").value.trim(), correo: $("#pCor").value.trim(), universidad: $("#pUni").value, carrera: $("#pCar").value.trim(), cv: $("#pCv").value.trim() };
    const ok = d.nombre && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo) && d.universidad && d.carrera;
    $("#ePost").classList.toggle("show", !ok);
    if (!ok) return;
    c.postulantes.push(Object.assign(d, { fecha: hoy(), estado: "Postuló" }));
    guardar(); postEnviado = c.id; render();
  };
}


/* ---------- Portal público: todas las convocatorias abiertas ---------- */
let pubTipo = "", pubQ = "";
function vConvPub() {
  const abiertas = S.convocatorias.filter(c => c.estado === "Abierta");
  return `<header class="pub-top"><div class="pub-inner"><b>Antofagasta Minerals</b><span>Convocatorias para estudiantes</span></div></header>
  <main class="pub">
    <h1>Prácticas y memorias en AMSA</h1>
    <p class="sub">Revisa las convocatorias abiertas, con sus condiciones y fechas, y postula sin crear una cuenta. Te avisaremos por correo cómo terminó tu postulación.</p>
    <div class="filters"><div class="chips"><button class="chip-btn ${pubTipo ? "" : "on"}" data-pubtipo="">Todas (${abiertas.length})</button>${CONV_TIPOS.map(t => `<button class="chip-btn ${pubTipo === t ? "on" : ""}" data-pubtipo="${t}">${t} (${abiertas.filter(c => c.tipo === t).length})</button>`).join("")}</div>
    <div class="frow"><input class="input sm" id="pubQ" placeholder="Buscar por carrera o palabra" value="${esc(pubQ)}" aria-label="Buscar convocatoria"></div></div>
    <div class="stack" id="pubLista">${pubLista()}</div>
    ${ME ? "" : `<p class="help" style="text-align:center;margin-top:18px"><a class="lnk" href="#/login">Soy de AMSA: ingresar</a></p>`}
    <p class="help" style="text-align:center">Prototipo IDI2025 · datos de ejemplo</p>
  </main>`;
}
function pubLista() {
  const q = pubQ.toLowerCase();
  const cs = S.convocatorias.filter(c => c.estado === "Abierta" && (!pubTipo || c.tipo === pubTipo) && (!q || (c.titulo + " " + c.carreras + " " + c.descripcion).toLowerCase().includes(q)));
  if (!cs.length) return `<div class="card empty">No hay convocatorias abiertas con ese filtro.</div>`;
  return cs.map(c => `<a class="ecard" href="#/postular/${c.id}"><div class="h"><h3>${esc(c.titulo)}</h3><span class="cnt">${esc(c.tipo)}</span></div>
    <div class="who">${esc(instTxt(c))}${c.lugar ? " · " + esc(c.lugar) : ""}</div><hr>
    ${c.carreras ? `<div class="n"><b>Carreras:</b> ${esc(c.carreras)}</div>` : ""}${c.condiciones ? `<div class="n"><b>Condiciones:</b> ${esc(c.condiciones)}</div>` : ""}
    <div class="n"><b>${c.cupos} ${c.cupos === 1 ? "cupo" : "cupos"}</b> · postulaciones hasta el ${fechaTxt(c.cierre)}</div></a>`).join("");
}
function wireConvPub() {
  $$("[data-pubtipo]").forEach(b => b.onclick = () => { pubTipo = b.dataset.pubtipo; render(); });
  $("#pubQ").oninput = e => { pubQ = e.target.value; $("#pubLista").innerHTML = pubLista(); };
}
