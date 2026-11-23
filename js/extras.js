/* Propuestas de noviembre (Ejercicio Individual 2, ideas de Francisca y Allison):
   página de Estudiantes (practicantes y memoristas), página de Ayuda, plantilla de
   correo para aceptados y el contador que usan las métricas del piloto.
   Se carga antes de app.js; app.js llama a estas vistas desde el router. */

/* ---------- Métricas del piloto ---------- */
// Cuenta hechos concretos (por ejemplo, cuántas veces SIVA avisó que otra área ya habla
// con una institución). Estadísticas los muestra en "¿Está funcionando SIVA?".
function registrarMetrica(k) {
  S.metricas = S.metricas || {};
  S.metricas[k] = (S.metricas[k] || 0) + 1;
  guardar();
}

/* ============================ Estudiantes ============================ */
const esMemoria = c => /memoria/i.test(c.tipo);
// Postulaciones de las convocatorias que veo. tab: "practicantes", "memoristas" o todos.
function estudiantesDe(tab, soloAceptados) {
  return convVisibles().flatMap(c => c.postulantes.map(p => ({ c, p })))
    .filter(({ c, p }) => (tab === "memoristas" ? esMemoria(c) : tab === "practicantes" ? !esMemoria(c) : true) && (!soloAceptados || ACEPTADOS.includes(p.estado)));
}
let estEstado = "", estAnio = "", estOrden = "reciente", estAgrupar = false, estQ = "";
const estTexto = x => [x.p.nombre, x.p.correo, x.p.universidad, x.p.carrera, x.c.titulo, x.c.tipo, x.c.lugar, (contraparte(x.c.institucion) || {}).nombre, (contraparte(x.c.institucion) || {}).corto, ...(x.p.feedbackTutor || []).map(f => f.autor), ...(x.p.feedbackEst || []).map(f => f.autor)].filter(Boolean).join(" ").toLowerCase();
const sinTildes = t => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const PILL_POST = ["p0", "p1", "p2", "p3", "p2", "p3"];
const POR_REVISAR = ["Postulación recibida", "En revisión"];
const anioPost = x => (x.p.fecha || "").slice(0, 4);
function vEstudiantes(p) {
  const tab = p === "practicantes" || p === "memoristas" ? p : "todos";
  const todos = estudiantesDe(tab), k = cicloDe(todos.map(x => x.p));
  const anios = [...new Set(todos.map(anioPost).filter(Boolean))].sort().reverse();
  if (estAnio && !anios.includes(estAnio)) estAnio = "";
  const enAnio = todos.filter(x => !estAnio || anioPost(x) === estAnio);
  const pasa = x => !estEstado || (estEstado === "por-revisar" ? POR_REVISAR.includes(x.p.estado) : x.p.estado === estEstado);
  const cmp = (a, b) => (estOrden === "antiguo" ? 1 : -1) * (a.p.fecha || "").localeCompare(b.p.fecha || "");
  if (PAG._estTab !== tab) { PAG.est = 1; PAG._estTab = tab; }
  const qn = sinTildes(estQ.trim());
  const filas = enAnio.filter(pasa).filter(x => !qn || sinTildes(estTexto(x)).includes(qn)).sort(cmp);
  const pg = paginar("est", filas, 10, "estTabla");
  const nTab = t => estudiantesDe(t).length;
  const titulo = tab === "practicantes" ? "Practicantes" : tab === "memoristas" ? "Memoristas" : "Estudiantes";
  // Tarjetas de resumen (mismo estilo que Mis vínculos)
  const rango = anios.length ? (anios.length === 1 ? anios[0] : anios[anios.length - 1] + "–" + anios[0]) : "";
  const abiertas = todos.filter(x => x.c.estado === "Abierta"), nAb = new Set(abiertas.map(x => x.c.id)).size;
  const porRev = abiertas.filter(x => POR_REVISAR.includes(x.p.estado)).length;
  const porIniciar = todos.filter(x => x.p.estado === "Aceptado").length;
  const pl2 = (n, s, pl) => n + " " + (n === 1 ? s : pl);
  const cardRev = porRev
    ? `<button type="button" class="r-link r-pend" data-est-f="por-revisar"><b>${porRev}</b><span>por revisar</span><small class="r-det">de ${pl2(abiertas.length, "postulación", "postulaciones")} en ${pl2(nAb, "convocatoria abierta", "convocatorias abiertas")}</small></button>`
    : `<div class="r-pend ok"><b>${abiertas.length ? "✓" : "0"}</b><span>${abiertas.length ? "Todo revisado" : "convocatorias abiertas"}</span><small class="r-det">${abiertas.length ? pl2(abiertas.length, "postulación", "postulaciones") + " en " + pl2(nAb, "convocatoria abierta", "convocatorias abiertas") : "No hay postulaciones por revisar"}</small></div>`;
  const cardEval = k.fbEst != null
    ? `<div class="r-eval"><b>${num1(k.fbEst)}<small> de 5</small></b><span>calificación promedio de ${pl2(k.nEst, "estudiante", "estudiantes")}</span>
      <details class="como"><summary>¿Cómo se calcula?</summary><p>Al terminar, cada estudiante responde 4 preguntas de 1 a 5: qué tan útil fue la práctica o memoria, el acompañamiento del tutor, la claridad de las tareas y si la recomendaría. Su nota es el promedio de las respuestas, y este número es el promedio de quienes ya respondieron.${k.fbTut != null ? ` Aparte, los tutores ponen una nota de 1 a 7: promedio ${num1(k.fbTut)} (${pl2(k.nTut, "nota", "notas")}).` : ""}</p></details></div>`
    : `<div class="r-eval"><b>–</b><span>calificación de la experiencia</span><small class="r-det">Aún no hay respuestas de estudiantes que terminaron</small></div>`;
  const resumen = `<div class="resumen resumen-4" role="region" aria-label="Resumen de estudiantes">
    <div class="r-total"><b>${k.post}</b><span>postulantes históricos</span>${rango ? `<small class="r-anios" title="Años en que hay postulaciones registradas">${rango}</small>` : ""}
      <p class="r-split"><small><i class="d d-on"></i><strong>${k.acept}</strong> aceptados</small><small title="Aceptados que ya terminaron su práctica o memoria"><i class="d d-off"></i><strong>${k.sale}</strong> ya ${k.sale === 1 ? "terminó" : "terminaron"}</small><small><i class="d d-no"></i><strong>${k.no}</strong> no ${k.no === 1 ? "seleccionado" : "seleccionados"}</small></p></div>
    ${cardRev}
    <div class="r-link-ne"><b>${k.mientras}</b><span>en curso</span><small class="r-det">Haciendo su práctica o memoria${porIniciar ? " · " + pl2(porIniciar, "aceptado por iniciar", "aceptados por iniciar") : ""}</small></div>
    ${cardEval}
  </div>`;
  const chip = (v, t, n) => `<button class="chip-btn ${estEstado === v ? "on" : ""}" data-est-f="${v}">${t}${n == null ? "" : " (" + n + ")"}</button>`;
  const cuerpo = x => `<tr class="row" data-conv="${x.c.id}" tabindex="0"><td><span class="t">${esc(x.p.nombre)}</span><small>${esc(x.p.correo)}</small></td><td>${esc(x.p.universidad)}<small>${esc(x.p.carrera)}</small></td><td>${esc(x.c.titulo)}<small>${logoInst(contraparte(x.c.institucion), "xs")}${esc(x.c.tipo)}</small></td><td><small style="color:var(--ink)">${fechaTxt(x.p.fecha)}${x.p.via === "portal" ? " · portal AMSA" : ""}</small></td><td><span class="pill ${PILL_POST[POST_ESTADOS.indexOf(x.p.estado)] || "p0"}">${x.p.estado}</span></td></tr>`;
  let filasHTML;
  if (estAgrupar && !estAnio) {
    const ys = [...new Set(pg.items.map(anioPost))];
    filasHTML = ys.map(y => { const l = pg.items.filter(x => anioPost(x) === y), tot = filas.filter(x => anioPost(x) === y), r = tot.filter(x => POR_REVISAR.includes(x.p.estado)).length; return `<tr class="grupo-anio"><td colspan="5"><b>${y}</b> · ${pl2(tot.length, "postulación", "postulaciones")}${r ? " · " + r + " por revisar" : ""}</td></tr>${l.map(cuerpo).join("")}`; }).join("");
  } else filasHTML = pg.items.map(cuerpo).join("");
  return hero(titulo, "Quiénes postulan a las convocatorias de tu área, quiénes están haciendo su práctica o memoria y quiénes ya terminaron.", { cards: true, acciones: puedeCrear() ? `<a class="btn-accent" href="#/nueva-convocatoria">+ Nueva convocatoria</a>` : "" })
  + resumen + `
  <div class="tabs" role="tablist"><a class="tab ${tab === "todos" ? "on" : ""}" href="#/estudiantes">Todos (${nTab("todos")})</a><a class="tab ${tab === "practicantes" ? "on" : ""}" href="#/estudiantes/practicantes">Practicantes (${nTab("practicantes")})</a><a class="tab ${tab === "memoristas" ? "on" : ""}" href="#/estudiantes/memoristas">Memoristas (${nTab("memoristas")})</a></div>
  <div class="card" id="estTabla"><div class="chips" style="margin:0 0 12px">${chip("", "Todos los estados")}${chip("por-revisar", "Por revisar", enAnio.filter(x => POR_REVISAR.includes(x.p.estado)).length)}${POST_ESTADOS.map(e => chip(e, e, enAnio.filter(x => x.p.estado === e).length)).join("")}</div>
  <div class="frow" style="margin:0 0 14px"><input class="input sm" id="estQ" type="search" placeholder="Buscar por estudiante, tutor, universidad o convocatoria" value="${esc(estQ)}" aria-label="Buscar estudiantes" autocomplete="off"><select class="input sm" id="estOrden" aria-label="Ordenar postulaciones"><option value="reciente" ${estOrden === "reciente" ? "selected" : ""}>Ordenar: fecha de postulación, más reciente</option><option value="antiguo" ${estOrden === "antiguo" ? "selected" : ""}>Ordenar: fecha de postulación, más antigua</option></select>
    <select class="input sm" id="estAnio" aria-label="Año de postulación"><option value="">Todos los años</option>${anios.map(a => `<option ${estAnio === a ? "selected" : ""}>${a}</option>`).join("")}</select>
    <label class="chk"><input type="checkbox" id="estAgr" ${estAgrupar ? "checked" : ""}> Agrupar por año</label></div>
  ${filas.length ? `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Universidad y carrera</th><th>Convocatoria</th><th>Fecha de postulación</th><th>Estado</th></tr></thead><tbody>${filasHTML}</tbody></table></div>${pg.html}
  <p class="help" style="margin-top:10px">Haz clic en una fila para abrir la convocatoria, cambiar el estado, avisarle por correo o dejarle feedback.</p>`
    : `<div class="empty">No hay estudiantes con estos filtros o con esa búsqueda.${puedeCrear() ? ` <a class="lnk" href="#/nueva-convocatoria">Crea una convocatoria</a> para recibir postulaciones.` : ""}</div>`}</div>`;
}
function wireEstudiantes() {
  $$("[data-est-f]").forEach(b => b.onclick = () => { estEstado = b.dataset.estF; PAG.est = 1; render(); });
  const qe = $("#estQ"); if (qe) qe.oninput = e => { estQ = e.target.value; PAG.est = 1; render(); const n = $("#estQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
  const o = $("#estOrden"), y = $("#estAnio"), g = $("#estAgr");
  if (o) o.onchange = e => { estOrden = e.target.value; PAG.est = 1; render(); };
  if (y) y.onchange = e => { estAnio = e.target.value; PAG.est = 1; render(); };
  if (g) g.onchange = e => { estAgrupar = e.target.checked; PAG.est = 1; render(); };
  $$("[data-conv]").forEach(tr => { const go = () => location.hash = "#/convocatoria/" + tr.dataset.conv; tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
}

/* ============================ Ayuda ============================ */
function vAyuda() {
  const g = (t, d) => `<dt>${t}</dt><dd>${d}</dd>`;
  return hero("Ayuda", "Qué significa cada palabra de SIVA y cómo usarlo. Si algo no se entiende, avísanos: es parte de lo que estamos mejorando.")
  + `<div class="grid-main"><div>
    <div class="card guia-card"><div><p class="card-title" style="margin:0 0 4px">Guía de inicio</p><p class="small muted" style="margin:0">Un recorrido corto por lo esencial de SIVA. Puedes repetirlo las veces que quieras.</p></div><button type="button" class="btn-accent" id="ayudaGuia">Volver a ver la guía</button></div>
    <div class="card"><p class="card-title">Cómo empezar</p><ol class="pasos-ayuda">
      <li><b>Mira Mis vínculos.</b> Las filas amarillas son vínculos por reactivar: conviene retomar el contacto.</li>
      <li><b>Registra algo nuevo</b> con <b>+ Añadir</b>. Se abre un menú para elegir qué tipo de vínculo quieres registrar; en la ficha eliges la institución y, si no está, la agregas ahí.</li>
      <li><b>Escríbele a un contacto</b> con el botón <b>Contactar</b> que está junto a su nombre. Si otra área ya habla con esa institución, SIVA te avisa antes.</li>
      <li><b>Sigue a las y los estudiantes</b> en Estudiantes: quién postula, quién está en práctica y quién terminó.</li>
      <li><b>Revisa Estadísticas</b> para saber cómo van los vínculos y si SIVA está ayudando.</li></ol></div>
    <div class="card"><p class="card-title">Palabras que usamos</p><dl class="kv ayuda-kv">
      ${g("Vínculo", "Una relación concreta entre un área de AMSA y una institución: una charla, un convenio, un grupo de prácticas, un Capstone. Cada vínculo tiene su ficha.")}
      ${g("Institución", "Universidad, centro de formación, OTEC u otra organización con la que trabaja AMSA. Una institución puede tener varios vínculos, con distintas áreas.")}
      ${g("Etapa", CONFIG.etapas.map((e, i) => `<b>${e}</b>: ${esc(CONFIG.etapasAyuda[i].toLowerCase())}`).join(". ") + ". Cada tipo de vínculo explica sus etapas con más detalle.")}
      ${g("Avance", "Qué parte del plan de trabajo ya se hizo (tareas marcadas como hechas). Se ve como una barra.")}
      ${g("Calificación", "De 1 a 5, qué tan bien resultó el vínculo. La pone el área con tres criterios que dependen del tipo. Cada número tiene una descripción: pasa el mouse sobre él en la ficha.")}
      ${g("Estado del vínculo", `<b>Al día</b>: hubo movimiento en los últimos ${CONFIG.salud.alDia} días y hay un contacto alternativo. <b>Por reactivar</b>: falta una de las dos cosas. <b>Sin contacto</b>: más de ${CONFIG.salud.urgente} días sin movimiento.`)}
      ${g("Contacto sin respuesta", `Si la institución no responde el cuestionario en ${DIAS_SIN_RESPUESTA} días, SIVA avisa y sugiere escribirle a otro contacto, para que el vínculo no dependa de una sola persona.`)}
      ${g("Estados de un postulante", "<b>Postulación recibida</b> y <b>En revisión</b>; <b>Aceptado</b> o <b>No seleccionado</b>; si queda, <b>En curso</b> mientras hace su práctica o memoria y <b>Terminado</b> al finalizar. Cada cambio prepara el correo para avisarle.")}
      ${g("Traspaso", "Cuando cambia quién lleva un vínculo, SIVA arma una hoja de traspaso que la nueva persona confirma con «Leí y asumo».")}
      ${g("Metas", "Los objetivos de la empresa a los que puede aportar un vínculo. Quien registra marca una o varias.")}</dl></div>
  </div><aside class="stack">
    <div class="card side"><p class="card-title">Quién usa SIVA</p>
      ${Object.values(CONFIG.roles).map(r => `<p class="lbl2">${esc(r.nombre)}</p><p class="small" style="margin:0 0 8px">${esc(r.desc)}</p>`).join("")}
      <p class="lbl2">Sin cuenta, con un link</p><p class="small" style="margin:0">La institución responde su feedback y la o el estudiante ve en qué va su proceso. No necesitan instalar ni registrarse.</p></div>
    <div class="card side"><p class="card-title">Qué hace y qué no</p><p class="small" style="margin:0">SIVA es la memoria común de los vínculos de AMSA: evita que dos áreas hablen con la misma institución sin saberlo. <b>No reemplaza el portal de postulación de AMSA</b>: si la convocatoria está en el portal, SIVA solo guarda quién postuló y cómo avanza.</p></div>
  </aside></div>`;
}

/* ============================ Correo para aceptados ============================
   Plantilla por área, autocompletable (convocatoria y contacto), con pasos para marcar
   y vista previa. Se guarda para la próxima convocatoria del área. */
const PASOS_CORREO = [
  { id: "confirmar", t: "Confirmar por correo", l: "Confirma por correo antes de [plazo]" },
  { id: "docs", t: "Enviar documentos", l: "Envía tus documentos" },
  { id: "entrevista", t: "Entrevista", l: "Agenda una entrevista con el equipo" },
  { id: "charla", t: "Charla de bienvenida", l: "Asiste a la charla de bienvenida" }
];
const PLAZOS = ["3 días hábiles", "5 días hábiles", "7 días hábiles", "10 días hábiles"];
const PLAZO_SUGERIDO = "5 días hábiles";
let ceEstado = null;
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#/correo-aceptados")) ceEstado = null; });
function plantillaDe(c) {
  const g = (S.plantillasCorreo || {})[convArea(c)] || {};
  return { plazo: g.plazo || PLAZO_SUGERIDO, pasos: g.pasos || ["confirmar", "docs"], otros: g.otros || [], extra: g.extra || "", contacto: g.contacto || (ME && ME.id) };
}
function contactosCorreo(c) {
  const a = convArea(c);
  const afines = Object.values(CONFIG.usuarios).filter(u => u.rol === "gestor" && !u.espacio && u.area && a && (u.area === a || descendientes(a).includes(u.area) || descendientes(u.area).includes(a)));
  return [ME, ...afines].filter((u, i, arr) => u && u.rol !== "jefatura" && arr.findIndex(x => x.id === u.id) === i);
}
const contactoDe = (c, id) => contactosCorreo(c).find(u => u.id === id) || contactosCorreo(c)[0] || ME;
const pasosTexto = e => [...PASOS_CORREO.filter(p => e.pasos.includes(p.id)).map(p => p.l.replace("[plazo]", e.plazo)), ...e.otros.filter(o => o.on).map(o => o.t)];
const asuntoAceptados = c => `¡Fuiste aceptado/a! ${c.titulo}`;
function textoAceptados(c, e, nombre) {
  const u = contactoDe(c, e.contacto), pasos = pasosTexto(e).map(x => "• " + x);
  return `Hola${nombre ? " " + nombre : ""},\n\nGracias por postular a ${c.titulo}. Te contamos que tu postulación fue aceptada.\n\n${pasos.length ? "Próximos pasos\n" + pasos.join("\n") + "\n\n" : ""}Inicio: ${e.fecha ? fechaTxt(e.fecha) : "[fecha por confirmar]"}\nContacto: ${u.nombre} (${u.correo})${e.extra ? "\n\n" + e.extra : ""}\n\nSaludos,\nEquipo de ${nombreArea(convArea(c))}\nAntofagasta Minerals`;
}
function prevAceptadosHTML(c, e) {
  const u = contactoDe(c, e.contacto), pasos = pasosTexto(e);
  return `<p class="mail-asunto">ASUNTO: ${esc(asuntoAceptados(c))}</p>
    <p>Hola [nombre],<br>Gracias por postular a <b>${esc(c.titulo)}</b>. Te contamos que tu postulación <span class="chip-ok">fue aceptada</span>.</p>
    ${pasos.length ? `<p><b>Próximos pasos</b>${pasos.map(x => `<br>• ${esc(x).replace(esc(e.plazo), `<b>${esc(e.plazo)}</b>`)}`).join("")}</p>` : ""}
    <p>Inicio: <b>${e.fecha ? fechaTxt(e.fecha) : "[fecha]"}</b><br>Contacto: ${esc(u.nombre)}</p>
    ${e.extra ? `<p>${esc(e.extra).replace(/\n/g, "<br>")}</p>` : ""}
    <p>Saludos,<br>Equipo de ${esc(nombreArea(convArea(c)))}</p>`;
}
const pendientesAceptados = c => c.postulantes.filter(p => p.estado === "Aceptado" && p.avisado !== "Aceptado");
function vCorreoAceptados(id) {
  const c = convocatoria(+id);
  if (!c) return `<div class="card empty">Esa convocatoria no existe.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver</button></div>`;
  if (!puedeEditarConv(c)) return `<div class="card empty">Este correo lo prepara el área responsable de la convocatoria.</div>`;
  if (!ceEstado || ceEstado.conv !== c.id) { const t = plantillaDe(c); ceEstado = { conv: c.id, fecha: c.fechaInicio || "", plazo: t.plazo, pasos: [...t.pasos], otros: t.otros.map(o => ({ ...o })), extra: t.extra, contacto: t.contacto }; }
  const e = ceEstado, pend = pendientesAceptados(c), us = contactosCorreo(c), yaAv = c.postulantes.filter(p => p.estado === "Aceptado").length - pend.length;
  const tag = (t, oculto) => `<em class="tag-auto" ${oculto ? "hidden" : ""}>${t}</em>`;
  return hero("Correo para aceptados", `Plantilla del área ${esc(nombreArea(convArea(c)))} · se guarda para la próxima convocatoria`, { crumbs: `<a href="#/convocatoria/${c.id}">‹ ${esc(c.titulo)}</a> · Enviar resultados`, cards: true })
  + `<div class="ce-grid">
    <div class="card ce-form">
      <label class="ce-l">Convocatoria</label><div class="ce-ro"><span>${esc(c.titulo)}</span>${tag("autocompletado")}</div>
      <div class="ce-dos"><div><label class="ce-l" for="ceFecha">Fecha de inicio</label><input class="input" id="ceFecha" type="date" value="${esc(e.fecha)}"></div>
        <div><label class="ce-l" for="cePlazo">Plazo para confirmar <span id="cePlazoTag">${tag("sugerido", e.plazo !== PLAZO_SUGERIDO)}</span></label><select class="input" id="cePlazo">${PLAZOS.map(p => `<option ${e.plazo === p ? "selected" : ""}>${p}</option>`).join("")}</select></div></div>
      <label class="ce-l" for="ceContacto">Contacto ${tag("autocompletado")}</label><select class="input" id="ceContacto">${us.map(u => `<option value="${u.id}" ${contactoDe(c, e.contacto).id === u.id ? "selected" : ""}>${esc(u.nombre)} · ${esc(u.correo)}</option>`).join("")}</select>
      <label class="ce-l">Próximos pasos <small>(marca los que apliquen)</small></label>
      <div class="chips ce-chips">${PASOS_CORREO.map(p => `<button type="button" class="chip-sel ${e.pasos.includes(p.id) ? "on" : ""}" data-paso="${p.id}" aria-pressed="${e.pasos.includes(p.id)}">${p.t}</button>`).join("")}${e.otros.map((o, i) => `<button type="button" class="chip-sel ${o.on ? "on" : ""}" data-otro="${i}" aria-pressed="${o.on}">${esc(o.t)}</button>`).join("")}<button type="button" class="chip-sel mas" id="ceOtroBtn">+ Otro</button></div>
      <div class="inline-form" id="ceOtroRow" hidden><input class="input" id="ceOtroIn" placeholder="Ej.: Lleva tu cédula de identidad" aria-label="Otro paso"><button type="button" class="btn-outline" id="ceOtroAdd">Agregar</button></div>
      <label class="ce-l" for="ceExtra">Mensaje adicional <small>(opcional)</small></label><textarea class="input" id="ceExtra" rows="3" placeholder="Escribe una nota breve…">${esc(e.extra)}</textarea>
      <div class="form-actions"><button type="button" class="btn-accent teal" id="ceGuardar">Guardar plantilla</button></div>
    </div>
    <div class="card ce-prev"><p class="card-title" style="margin-bottom:4px">Vista previa del correo</p><p class="help" style="margin:0 0 12px">Se genera con lo que completaste. Datos de ejemplo.</p>
      <div class="mail-box" id="cePrev">${prevAceptadosHTML(c, e)}</div>
      <div class="ce-send"><p class="help" id="ceNota">${pend.length ? `El saludo va sin nombre y los ${pend.length} correos van en copia oculta. Para escribirle a una persona, usa «Avisar por correo» en la lista de postulantes.` : yaAv ? "Ya avisaste a todos los aceptados." : "Aún no hay aceptados. Marca «Aceptado» en la lista de postulantes."}</p>
        <button type="button" class="btn-accent" id="ceEnviar" ${pend.length ? "" : "disabled"}>Enviar a ${pend.length} ${pend.length === 1 ? "aceptado" : "aceptados"}</button></div>
    </div></div>`;
}
function wireCorreoAceptados(id) {
  const c = convocatoria(+id), e = ceEstado; if (!c || !e || !$("#cePrev")) return;
  const pinta = () => { $("#cePrev").innerHTML = prevAceptadosHTML(c, e); const t = $("#cePlazoTag em"); if (t) t.hidden = e.plazo !== PLAZO_SUGERIDO; };
  $("#ceFecha").oninput = ev => { e.fecha = ev.target.value; ev.target.classList.remove("bad"); pinta(); };
  $("#cePlazo").onchange = ev => { e.plazo = ev.target.value; pinta(); };
  $("#ceContacto").onchange = ev => { e.contacto = ev.target.value; pinta(); };
  $("#ceExtra").oninput = ev => { e.extra = ev.target.value; pinta(); };
  $$("[data-paso]").forEach(b => b.onclick = () => { const k = b.dataset.paso; e.pasos = e.pasos.includes(k) ? e.pasos.filter(x => x !== k) : [...e.pasos, k]; b.classList.toggle("on"); b.setAttribute("aria-pressed", e.pasos.includes(k)); pinta(); });
  $$("[data-otro]").forEach(b => b.onclick = () => { const o = e.otros[+b.dataset.otro]; o.on = !o.on; b.classList.toggle("on"); b.setAttribute("aria-pressed", o.on); pinta(); });
  $("#ceOtroBtn").onclick = () => { const r = $("#ceOtroRow"); r.hidden = !r.hidden; if (!r.hidden) $("#ceOtroIn").focus(); };
  const agregar = () => { const t = $("#ceOtroIn").value.trim(); if (!t) return; e.otros.push({ t, on: true }); render(); };
  $("#ceOtroAdd").onclick = agregar;
  $("#ceOtroIn").onkeydown = ev => { if (ev.key === "Enter") { ev.preventDefault(); agregar(); } };
  $("#ceGuardar").onclick = () => {
    S.plantillasCorreo = S.plantillasCorreo || {};
    S.plantillasCorreo[convArea(c)] = { plazo: e.plazo, pasos: [...e.pasos], otros: e.otros.map(o => ({ ...o })), extra: e.extra, contacto: e.contacto };
    c.fechaInicio = e.fecha; guardar();
    toast(`Plantilla guardada para ${nombreArea(convArea(c))}. Se usará en las próximas convocatorias.`);
  };
  $("#ceEnviar").onclick = () => {
    const dest = pendientesAceptados(c); if (!dest.length) return;
    if (!e.fecha) { $("#ceFecha").classList.add("bad"); $("#ceFecha").focus(); toast("Elige la fecha de inicio antes de enviar."); return; }
    const u = contactoDe(c, e.contacto);
    abrirOutlookWeb(u.correo, asuntoAceptados(c), textoAceptados(c, e, ""), dest.map(p => p.correo).join(";"));
    dest.forEach(p => { p.avisado = "Aceptado"; });
    c.fechaInicio = e.fecha; guardar(); render();
    toast(`Se abrió Outlook con ${dest.length} ${dest.length === 1 ? "destinatario" : "destinatarios"} en copia oculta. Revisa y envía; quedaron como «Avisado».`);
  };
}
