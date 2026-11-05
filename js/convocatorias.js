/* Convocatorias para estudiantes: crear una oferta desde un vínculo, publicarla
   en LinkedIn, recibir postulaciones en una página pública y registrar quiénes
   quedan. Se carga antes de app.js; app.js llama a estas vistas desde el router. */

const CONV_TIPOS_VINCULO = ["tal", "emp"];           // Prácticas y memorias, Empleo y oficios
const CONV_TIPOS = ["Práctica profesional", "Memoria", "Práctica de verano"];
// Etapas de la postulación. Después de "Aceptado" la persona sigue en el sistema
// mientras hace su práctica o memoria, hasta que termina (postula → mientras → sale).
const POST_ESTADOS = ["Postuló", "En revisión", "Aceptado", "No aceptado", "En práctica", "Terminó"];
const ACEPTADOS = ["Aceptado", "En práctica", "Terminó"];
// Preguntas que responde el estudiante al terminar (escala de 1 a 5).
const PREGUNTAS_EST = ["¿Qué tan útil fue la práctica o memoria para tu formación?", "¿Cómo fue el acompañamiento de tu tutor o tutora?", "¿Qué tan claras fueron las tareas que te pidieron?", "¿La recomendarías a otros estudiantes?"];
// Etapas de la práctica o memoria que ve el estudiante mientras está en AMSA.
const ETAPAS_PRACTICA = ["Inducción", "Seguimiento a mitad de periodo", "Cierre y evaluación"];
const promEst = p => p.feedbackEstudiante ? p.feedbackEstudiante.respuestas.filter(Boolean).reduce((a, b) => a + +b, 0) / p.feedbackEstudiante.respuestas.filter(Boolean).length : null;
const notasTutor = p => (p.feedbackTutor || []).filter(f => f.nota != null).map(f => +f.nota);
const linkEstudiante = p => location.href.split("#")[0] + "#/mi-postulacion/" + encodeURIComponent(p.correo);
// Datos guardados con las etiquetas anteriores ("Quedó" / "No quedó").
const ESTADO_ANTIGUO = { "Quedó": "Aceptado", "No quedó": "No aceptado" };

function convSemilla(s) {
  const v = s.vinculos.find(x => x.nombre === "Memorias y prácticas UCN");
  if (!v) return [];
  return [{
    id: 1, vinculo: v.id, area: v.area, companias: ["cen"], institucion: v.contraparte, titulo: "Memorias 2027: Ingeniería Civil de Minas",
    tipo: "Memoria", carreras: "Ingeniería Civil de Minas, Ingeniería Civil Industrial",
    cupos: 3, cierre: "2026-12-15", lugar: "Antofagasta, con visitas a faena",
    condiciones: "Seis meses desde marzo, jornada completa, con apoyo económico mensual.",
    descripcion: "Memorias en temas definidos con las gerencias de operación, con un tutor o tutora de la compañía.",
    requisitos: "Haber terminado los cursos del último año y tener tema de memoria aprobado por la universidad.",
    estado: "Abierta", creada: haceDias(30),
    linkedin: { publicada: true, fecha: haceDias(29) },
    postulantes: [
      { nombre: "Camila Rojas", correo: "camila.rojas@ejemplo.cl", universidad: "Universidad Católica del Norte", carrera: "Ingeniería Civil de Minas", fecha: haceDias(28), estado: "En práctica", avisado: "En práctica",
        feedbackTutor: [
          { fecha: haceDias(20), autor: "Rodrigo Salinas (tutor)", texto: "Buena primera semana. Entendió rápido el proceso de planificación de corto plazo y pregunta cuando tiene dudas.", nota: null, propuestas: ["Anotar en una bitácora lo que aprende en cada reunión de turno", "Agendar una visita a la mina con el equipo de geotecnia"] },
          { fecha: haceDias(6), autor: "Rodrigo Salinas (tutor)", texto: "Revisión de mitad de periodo: el modelo de su memoria va bien encaminado. Le falta ordenar los datos de producción antes de seguir.", nota: 6.0, propuestas: ["Limpiar la base de producción de 2025 antes del próximo avance", "Presentar un avance corto al equipo el viernes"] }
        ] },
      { nombre: "Diego Fuentes", correo: "diego.fuentes@ejemplo.cl", universidad: "Universidad de Antofagasta", carrera: "Ingeniería Civil de Minas", fecha: haceDias(14), estado: "En revisión" },
      { nombre: "Valentina Muñoz", correo: CORREO_PRUEBA("postulante"), universidad: "Universidad Católica del Norte", carrera: "Ingeniería Civil Industrial", fecha: haceDias(10), estado: "Postuló" },
      { nombre: "Tomás Herrera", correo: "tomas.herrera@ejemplo.cl", universidad: "Universidad de Chile", carrera: "Ingeniería Civil de Minas", fecha: haceDias(6), estado: "Postuló" }
    ]
  }, {
    id: 2, vinculo: v.id, area: v.area, companias: ["cen"], institucion: v.contraparte, titulo: "Práctica de verano 2026",
    tipo: "Práctica de verano", carreras: "Ingeniería Civil de Minas, Geología",
    cupos: 2, cierre: "2025-11-30", lugar: "Antofagasta", condiciones: "Ocho semanas en enero y febrero.",
    descripcion: "Práctica en las áreas de planificación y geología de la operación.", requisitos: "Estar en cuarto o quinto año.",
    estado: "Cerrada", creada: "2025-10-15", linkedin: { publicada: true, fecha: "2025-10-16" },
    postulantes: [
      { nombre: "Sofía Pizarro", correo: "sofia.pizarro@ejemplo.cl", universidad: "Universidad Católica del Norte", carrera: "Geología", fecha: "2025-10-20", estado: "Terminó", avisado: "Terminó",
        feedbackTutor: [
          { fecha: "2026-01-20", autor: "Carla Fuentes (tutora)", texto: "Se adaptó bien al turno y cumplió con el mapeo del sector norte.", nota: null, propuestas: ["Pedir revisión de sus mapas antes de entregarlos"] },
          { fecha: "2026-02-27", autor: "Carla Fuentes (tutora)", texto: "Cierre: entregó un mapeo ordenado y útil para el equipo. Trabaja con autonomía.", nota: 6.5, propuestas: ["Seguir practicando la presentación de resultados a jefaturas"], final: true }
        ],
        feedbackEstudiante: { respuestas: [5, 4, 4, 5], comentario: "Aprendí mucho en terreno. Me habría servido una inducción más larga en seguridad.", fecha: "2026-03-02" },
        informe: { nombre: "Informe_practica_Sofia_Pizarro.pdf", fecha: "2026-03-05" }, notaUniversidad: 6.6, autorizaVerNota: true },
      { nombre: "Lucas Morales", correo: "lucas.morales@ejemplo.cl", universidad: "Universidad de Chile", carrera: "Geología", fecha: "2025-10-24", estado: "No aceptado", avisado: "No aceptado" }
    ]
  }].concat(convSemillaExtra(s));
}

// Más convocatorias, de distintas áreas y estados, para poder sacar estadísticas.
function convSemillaExtra(s) {
  const por = n => s.vinculos.find(x => x.nombre === n);
  const post = (nombre, correo, universidad, carrera, dias, estado, extra) => Object.assign({ nombre, correo, universidad, carrera, fecha: haceDias(dias), estado }, estado === "Aceptado" || estado === "No aceptado" || estado === "En práctica" || estado === "Terminó" ? { avisado: estado } : {}, extra || {});
  const out = [];
  const ua = por("Práctica profesional U. de Antofagasta");
  if (ua) out.push({
    id: 3, vinculo: ua.id, area: ua.area, companias: ["ant"], institucion: ua.contraparte, titulo: "Práctica profesional invierno 2027",
    tipo: "Práctica profesional", carreras: "Ingeniería Civil de Minas, Ingeniería Civil Industrial",
    cupos: 4, cierre: haceDias(-12), lugar: "Antucoya, con transporte desde Antofagasta",
    condiciones: "Ocho semanas en julio y agosto, con alimentación y traslado.", descripcion: "Práctica en planificación mina y en mantenimiento, con tutor o tutora de la operación.",
    requisitos: "Haber aprobado tercer año y estar inscrito en la práctica de su carrera.",
    estado: "Abierta", creada: haceDias(18), linkedin: { publicada: true, fecha: haceDias(17) },
    postulantes: [
      post("Martina Alfaro", "martina.alfaro@ejemplo.cl", "Universidad de Antofagasta", "Ingeniería Civil de Minas", 15, "En revisión"),
      post("Felipe Guzmán", "felipe.guzman@ejemplo.cl", "Universidad de Antofagasta", "Ingeniería Civil Industrial", 13, "Aceptado"),
      post("Constanza Pino", "constanza.pino@ejemplo.cl", "Universidad Católica del Norte", "Ingeniería Civil de Minas", 11, "Postuló"),
      post("Sebastián Lagos", "sebastian.lagos@ejemplo.cl", "Universidad de Antofagasta", "Ingeniería Civil de Minas", 9, "Postuló"),
      post("Amanda Cortés", "amanda.cortes@ejemplo.cl", "Universidad de Antofagasta", "Ingeniería Civil Industrial", 4, "Postuló")
    ]
  });
  const mu = por("Mentoring a ingenieras");
  if (mu) out.push({
    id: 4, vinculo: mu.id, area: mu.area, companias: ["corp"], institucion: mu.contraparte, titulo: "Mentoring a ingenieras 2027",
    tipo: "Programa", carreras: "Ingeniería Civil de Minas, Ingeniería Civil Industrial, Ingeniería Civil Eléctrica",
    cupos: 10, cierre: haceDias(-30), lugar: "Online, con una visita a Santiago", condiciones: "Seis meses, una sesión al mes con una mentora de AMSA.",
    descripcion: "Acompañamiento de ingenieras de AMSA a estudiantes de ingeniería.", requisitos: "Estar en tercer año o más.",
    estado: "Abierta", creada: haceDias(10), linkedin: { publicada: true, fecha: haceDias(9) },
    postulantes: [
      post("Josefa Núñez", "josefa.nunez@ejemplo.cl", "Pontificia Universidad Católica de Chile", "Ingeniería Civil de Minas", 8, "Postuló"),
      post("Renata Salas", "renata.salas@ejemplo.cl", "Pontificia Universidad Católica de Chile", "Ingeniería Civil Industrial", 7, "Postuló"),
      post("Emilia Fuentes", "emilia.fuentes@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil Eléctrica", 6, "En revisión"),
      post("Trinidad Mora", "trinidad.mora@ejemplo.cl", "Universidad de Concepción", "Ingeniería Civil de Minas", 5, "Postuló"),
      post("Valeria Ibarra", "valeria.ibarra@ejemplo.cl", "Universidad Técnica Federico Santa María", "Ingeniería Civil Industrial", 3, "Postuló"),
      post("Agustina Pérez", "agustina.perez@ejemplo.cl", "Universidad de Santiago de Chile", "Ingeniería Civil Industrial", 2, "Postuló")
    ]
  });
  const mc = por("Memorias U. de Chile");
  if (mc) out.push({
    id: 5, vinculo: mc.id, area: mc.area, companias: ["cen"], institucion: mc.contraparte, titulo: "Memorias 2026: Ingeniería Civil Industrial",
    tipo: "Memoria", carreras: "Ingeniería Civil Industrial, Ingeniería Civil de Minas",
    cupos: 3, cierre: "2026-02-15", lugar: "Santiago y Antofagasta", condiciones: "Seis meses desde marzo, con apoyo económico mensual.",
    descripcion: "Memorias en temas de planificación y productividad.", requisitos: "Tener tema de memoria aprobado por la universidad.",
    estado: "Cerrada", creada: "2026-01-05", linkedin: { publicada: true, fecha: "2026-01-06" },
    postulantes: [
      post("Fernanda Díaz", "fernanda.diaz@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil Industrial", 270, "Terminó", { feedbackTutor: [{ fecha: "2026-08-28", autor: "Pamela Soto (tutora)", texto: "Cierre: su modelo de planificación quedó en uso en el área. Muy autónoma.", nota: 6.2, propuestas: ["Presentar el modelo a otras gerencias"], final: true }], feedbackEstudiante: { respuestas: [5, 5, 4, 5], comentario: "Pude trabajar con datos reales desde el primer mes.", fecha: "2026-09-02" }, notaUniversidad: 6.4, autorizaVerNota: true }),
      post("Joaquín Torres", "joaquin.torres@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil de Minas", 268, "Terminó", { feedbackTutor: [{ fecha: "2026-08-28", autor: "Pamela Soto (tutora)", texto: "Cierre: buen análisis, pero entregó con atraso.", nota: 5.5, propuestas: ["Fijar hitos quincenales"], final: true }], feedbackEstudiante: { respuestas: [3, 4, 3, 3], comentario: "Faltó claridad sobre qué datos podía usar.", fecha: "2026-09-03" }, notaUniversidad: 5.6, autorizaVerNota: false }),
      post("Paulina Rivas", "paulina.rivas@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil Industrial", 265, "Terminó"),
      post("Ignacio Salazar", "ignacio.salazar@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil Industrial", 262, "No aceptado"),
      post("Daniela Rojas", "daniela.rojas@ejemplo.cl", "Universidad de Chile", "Ingeniería Civil de Minas", 260, "No aceptado")
    ]
  });
  return out;
}

// Fecha relativa a hoy, para que los ejemplos no envejezcan.
function haceDias(d) { return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10); }

// Los datos guardados antes de esta versión no traen convocatorias: se agregan.
const _estadoInicialBase = estadoInicial;
estadoInicial = function () { const s = _estadoInicialBase(); s.convocatorias = convSemilla(s); return s; };
if (!S.convocatorias) { S.convocatorias = esEspacioVacio() ? [] : convSemilla(S); guardar(); }
function migrarEstados() {
  let cambio = false;
  (S.convocatorias || []).forEach(c => c.postulantes.forEach(p => { if (ESTADO_ANTIGUO[p.estado]) { p.estado = ESTADO_ANTIGUO[p.estado]; cambio = true; } }));
  if (cambio) guardar();
}
migrarEstados();

const convocatoria = id => S.convocatorias.find(c => c.id === id);
const convArea = c => c.area || (vinculo(c.vinculo) || {}).area;
const convInst = c => c.institucion != null ? c.institucion : (vinculo(c.vinculo) || {}).contraparte || "";
const convComps = c => c.companias || (c.compania ? [c.compania] : compsDe(vinculo(c.vinculo) || {}));
const puedeEditarConv = c => ME && (ME.admin || (ME.rol === "gestor" && descendientes(ME.area).includes(convArea(c))));
const instTxt = c => convInst(c) ? contraparte(convInst(c)).nombre : "Abierta a todas las universidades";
const convVisibles = () => S.convocatorias.filter(c => ME && (ME.admin || descendientes(ME.area).includes(convArea(c))));
const convDe = vid => S.convocatorias.filter(c => c.vinculo === vid);
const urlPostular = c => location.href.split("#")[0] + "#/postular/" + c.id;
const quedaron = c => c.postulantes.filter(p => ACEPTADOS.includes(p.estado));
const pct = (n, d) => d ? Math.round(n / d * 100) : 0;

// Ciclo del estudiante: cuántos postulan, cuántos son aceptados, cuántos están
// haciendo su práctica o memoria y cuántos ya terminaron.
function cicloDe(postulantes) {
  const n = estados => postulantes.filter(p => estados.includes(p.estado)).length;
  const fe = postulantes.map(promEst).filter(x => x != null), ft = postulantes.flatMap(notasTutor);
  return { post: postulantes.length, acept: n(ACEPTADOS), mientras: n(["En práctica"]), sale: n(["Terminó"]), no: n(["No aceptado"]), rev: n(["Postuló", "En revisión"]),
    fbEst: fe.length ? fe.reduce((a, b) => a + b, 0) / fe.length : null, nEst: fe.length, fbTut: ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : null, nTut: ft.length };
}
function cicloHTML(k, nota) {
  const paso = (num, t, sub, extra = "") => `<div class="ciclo-paso ${extra}"><b>${num}</b><span>${t}</span><small>${sub}</small></div>`;
  return `<div class="ciclo">
    ${paso(k.post, "Postula", k.rev ? k.rev + " por revisar" : "todas revisadas")}<i class="ciclo-flecha" aria-hidden="true">→</i>
    ${paso(k.acept, "Aceptados", pct(k.acept, k.post) + "% de quienes postulan", "ok")}<i class="ciclo-flecha" aria-hidden="true">→</i>
    ${paso(k.mientras, "Mientras", "en práctica o memoria")}<i class="ciclo-flecha" aria-hidden="true">→</i>
    ${paso(k.sale, "Sale", pct(k.sale, k.acept) + "% de los aceptados terminó")}
  </div>${k.fbEst != null || k.fbTut != null ? `<div class="ciclo-fb">${k.fbEst != null ? `<span>Los estudiantes evalúan su experiencia con <b>${num1(k.fbEst)} de 5</b> (${k.nEst} ${k.nEst === 1 ? "respuesta" : "respuestas"})</span>` : ""}${k.fbTut != null ? `<span>Nota promedio de los tutores: <b>${num1(k.fbTut)} de 7</b> (${k.nTut} ${k.nTut === 1 ? "nota" : "notas"})</span>` : ""}</div>` : ""}${nota ? `<p class="help">${nota}</p>` : ""}`;
}

// Correo que le llega al estudiante cuando cambia su estado.
function correoEstudiante(c, p) {
  const nombre = p.nombre.split(" ")[0];
  const firma = `\n\nSaludos,\n${nombreArea(convArea(c))}\nAntofagasta Minerals`;
  const txt = {
    "En revisión": [`Tu postulación está en revisión · ${c.titulo}`, `Hola ${nombre}:\n\nRecibimos tu postulación a "${c.titulo}" y la estamos revisando. Puede que te contactemos para una entrevista.\n\nPuedes ver en qué va tu postulación aquí: ${location.href.split("#")[0]}#/mi-postulacion`],
    "Aceptado": [`¡Fuiste aceptado/a! · ${c.titulo}`, `Hola ${nombre}:\n\nTe contamos que fuiste aceptado/a en "${c.titulo}". En los próximos días te escribiremos con tu fecha de ingreso, quién será tu tutor o tutora y qué necesitas para el primer día.\n\nTu página personal, donde verás tu etapa y el feedback de tu tutor: ${linkEstudiante(p)}`],
    "No aceptado": [`Resultado de tu postulación · ${c.titulo}`, `Hola ${nombre}:\n\nGracias por postular a "${c.titulo}". Esta vez no fuiste seleccionado/a. Te invitamos a revisar las otras convocatorias abiertas: ${location.href.split("#")[0]}#/convocatorias`],
    "En práctica": [`Bienvenida/o a Antofagasta Minerals · ${c.titulo}`, `Hola ${nombre}:\n\nTe damos la bienvenida. Desde hoy quedas registrado/a en tu ${c.tipo.toLowerCase()}. En tu página personal vas a ver las etapas y el feedback de tu tutor o tutora:\n${linkEstudiante(p)}`],
    "Terminó": [`Cierre de tu ${c.tipo.toLowerCase()} · ${c.titulo}`, `Hola ${nombre}:\n\nTerminaste tu ${c.tipo.toLowerCase()}. Gracias por tu trabajo. En tu página personal puedes ver el feedback final de tu tutor o tutora, contarnos cómo te fue, subir tu informe y, si quieres, la nota que te puso tu universidad:\n${linkEstudiante(p)}`]
  }[p.estado];
  return txt ? { asunto: txt[0], cuerpo: txt[1] + firma } : null;
}
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
  const ab = cs.filter(c => c.estado === "Abierta").length;
  return fold("Convocatorias para estudiantes", cs.length, `${ed ? `<div class="fold-acts"><button class="link-btn" onclick="location.hash='#/nueva-convocatoria/${v.id}'">+ Crear convocatoria</button></div>` : ""}
    ${cs.length ? cs.map(c => `<a class="conv-row" href="#/convocatoria/${c.id}"><span><b>${esc(c.titulo)}</b><small>${c.postulantes.length} postulantes · ${quedaron(c).length} de ${c.cupos} cupos llenos · ${c.estado === "Abierta" ? "cierra" : "cerró"} el ${fechaTxt(c.cierre)}</small></span>${convPill(c)}</a>`).join("")
      : `<p class="muted small">Aún no hay convocatorias. Crea una para publicar la oferta, recibir postulaciones y registrar a quienes aceptas.</p>`}`, true, ab ? ab + (ab === 1 ? " abierta" : " abiertas") : "");
}

function convMisHTML() {
  const todas = convVisibles().sort((a, b) => (b.cierre || "").localeCompare(a.cierre || ""));
  const ab = todas.filter(c => c.estado === "Abierta"), ce = todas.filter(c => c.estado !== "Abierta");
  if (!todas.length) return puedeCrear() ? `<div class="card conv-card"><p class="conv-t">Convocatorias abiertas</p><p class="muted small">Aún no hay convocatorias. <a class="lnk" href="#/nueva-convocatoria">Crea una</a> para recibir postulaciones.</p></div>` : "";
  const fila = c => `<a class="mini-row" href="#/convocatoria/${c.id}"><b>${esc(c.titulo)}</b><span>${c.postulantes.length} postulantes · cerró el ${fechaTxt(c.cierre)}</span></a>`;
  return `<div class="card conv-card"><p class="conv-t">Convocatorias abiertas <span class="fold-n">${ab.length}</span></p>
    ${ab.length ? ab.map(c => `<a class="conv-open" href="#/convocatoria/${c.id}"><b>${esc(c.titulo)}</b><span>${c.postulantes.length} postulantes${sinRevisar(c).length ? ` · ${sinRevisar(c).length} sin revisar` : ""}</span><span>Cierra el ${fechaTxt(c.cierre)}</span></a>`).join("") : `<p class="muted small">No hay convocatorias abiertas.</p>`}
    ${ce.length ? `<details class="mas"><summary>Ver ${ce.length} ${ce.length === 1 ? "cerrada" : "cerradas"}</summary>${ce.map(fila).join("")}</details>` : ""}
    ${puedeCrear() ? `<a class="lnk small conv-nueva" href="#/nueva-convocatoria">+ Nueva convocatoria</a>` : ""}</div>`;
}


// Convocatorias en un recuadro propio, parecido al de vínculos: una fila por convocatoria.
function convTablaHTML() {
  const todas = convVisibles();
  if (!todas.length && !puedeCrear()) return "";
  const orden = [...todas].sort((x, y) => (x.estado === y.estado ? (y.creada || "").localeCompare(x.creada || "") : x.estado === "Abierta" ? -1 : 1));
  const fila = c => {
    const sr = sinRevisar(c).length, v = vinculo(c.vinculo), cp = contraparte(c.institucion);
    return `<tr class="row" data-conv="${c.id}" tabindex="0"><td><span class="t">${esc(c.titulo)}</span><small>${esc(c.tipo || "")}${v ? " · " + esc(v.nombre) : ""}</small></td><td>${esc(cp.corto)}</td><td><span class="pill-estado ${c.estado === "Abierta" ? "abierta" : "cerrada"}">${esc(c.estado)}</span></td><td data-l="Postulantes"><b>${c.postulantes.length}</b>${sr ? `<small class="falta">${sr} por revisar</small>` : ""}</td><td data-l="Cupos">${c.cupos || "–"}</td><td data-l="Cierre">${c.cierre ? fechaTxt(c.cierre) : "–"}</td></tr>`;
  };
  const ab = todas.filter(c => c.estado === "Abierta").length;
  return `<div class="card" id="tablaConv">
    <div class="tabla-acts"><div><p class="card-title" style="margin:0">Convocatorias para estudiantes</p><span class="muted small">${todas.length ? `${ab} ${ab === 1 ? "abierta" : "abiertas"} de ${todas.length}. Haz clic en una fila para ver sus postulantes.` : "Aún no hay convocatorias."}</span></div>${puedeCrear() ? `<a class="btn-accent sm" href="#/nueva-convocatoria">+ Nueva convocatoria</a>` : ""}</div>
    ${todas.length ? `<div class="table-wrap"><table><thead><tr><th>Convocatoria</th><th>Institución</th><th>Estado</th><th>Postulantes</th><th>Cupos</th><th>Cierre</th></tr></thead><tbody>${orden.map(fila).join("")}</tbody></table></div>` : `<div class="empty">Crea una para publicar la oferta, recibir postulaciones y registrar a quienes aceptas.</div>`}</div>`;
}


// Tira con las convocatorias abiertas, arriba de Mis vínculos, para verlas sin bajar.
function convTiraHTML() {
  const ab = convVisibles().filter(c => c.estado === "Abierta").sort((x, y) => (x.cierre || "").localeCompare(y.cierre || ""));
  if (!ab.length && !puedeCrear()) return "";
  const tarjeta = c => {
    const sr = sinRevisar(c).length, dias = c.cierre ? Math.ceil((new Date(c.cierre) - new Date(hoy())) / 86400000) : null;
    return `<a class="conv-strip-card" href="#/convocatoria/${c.id}"><b>${esc(c.titulo)}</b><span>${esc(contraparte(c.institucion).corto)} · ${c.postulantes.length} postulantes${sr ? ` (${sr} por revisar)` : ""}</span><span class="conv-cierre ${dias != null && dias <= 14 ? "pronto" : ""}">${c.cierre ? (dias != null && dias >= 0 ? `Cierra en ${dias} ${dias === 1 ? "día" : "días"} · ` : "") + fechaTxt(c.cierre) : "Sin fecha de cierre"}</span></a>`;
  };
  return `<section class="conv-strip" aria-label="Convocatorias abiertas"><div class="conv-strip-h"><h2>Convocatorias abiertas <span class="count">${ab.length}</span></h2><span class="conv-strip-acts"><a class="lnk" href="#/mis" data-ir-conv>Ver todas</a>${puedeCrear() ? `<a class="btn-accent sm" href="#/nueva-convocatoria">+ Nueva convocatoria</a>` : ""}</span></div>
    ${ab.length ? `<div class="conv-strip-list">${ab.slice(0, 4).map(tarjeta).join("")}</div>` : `<p class="muted small" style="margin:0">No hay convocatorias abiertas ahora.</p>`}</section>`;
}

/* ---------- Crear convocatoria ---------- */
function vNuevaConv(vid, ce) {
  const v = vid ? vinculo(+vid) : null;
  if (vid && !v) return `<div class="card empty">Ese vínculo no existe.</div>`;
  if (ce ? !puedeEditarConv(ce) : v ? !puedeEditar(v) : !puedeCrear()) return `<div class="card empty">Tu perfil no puede ${ce ? "editar esta convocatoria" : "crear convocatorias"}.</div>`;
  const cp = v ? contraparte(v.contraparte) : null;
  return `<div class="crumbs"><a href="#/mis">Mis vínculos</a> / ${v ? `<a href="#/ficha/${v.id}">${esc(v.nombre)}</a> / ` : ""}${ce ? `<a href="#/convocatoria/${ce.id}">${esc(ce.titulo)}</a> / Editar` : "Crear convocatoria"}</div>
  <h1>${ce ? "Editar convocatoria" : "Crear convocatoria"}</h1><p class="sub">${v ? `Para ${esc(v.nombre)} con ${esc(cp.nombre)}. ` : ""}Los estudiantes postulan desde un link público y tú revisas las postulaciones aquí.</p>
  <div class="grid-main"><div class="card">
    <div class="g2">
      ${v ? "" : `<div><label class="f" for="cInst">Universidad o institución</label><select class="input" id="cInst"><option value="">Abierta a todas las universidades</option>${S.contrapartes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(x => `<option value="${x.id}">${esc(x.nombre)}</option>`).join("")}</select></div>
      <div><label class="f" for="cArea">Área responsable</label><select class="input" id="cArea">${opcionesArea(ME.area)}</select></div>
      `}
      <div class="full"><span class="f">Compañía</span><div class="checks" id="cComps" role="group" aria-label="Compañías">${S.companias.map(x => `<label class="chk-pill"><input type="checkbox" value="${x.id}" ${(v ? compsDe(v) : [ME.compania]).includes(x.id) ? "checked" : ""}><i style="background:${x.color}"></i>${esc(x.nombre)}</label>`).join("")}</div><p class="help">Puedes marcar varias, por ejemplo si los cupos se reparten entre faenas.</p></div>
      <div class="full"><label class="f" for="cTit">Título de la convocatoria *</label><input class="input" id="cTit" placeholder="Ej.: Prácticas profesionales verano 2027"><div class="err" id="eTit">Escribe un título.</div></div>
      <div><label class="f" for="cTipo">Tipo de proyecto</label><select class="input" id="cTipo">${CONV_TIPOS.map(t => `<option>${t}</option>`).join("")}</select></div>
      <div><label class="f" for="cCupos">Cupos</label><input class="input" id="cCupos" type="number" min="1" value="1"></div>
      <div class="full"><span class="f">Carreras</span><div class="checks" id="cCars" role="group" aria-label="Carreras">${CONFIG.carreras.map(x => `<label class="chk-pill"><input type="checkbox" value="${esc(x)}">${esc(x)}</label>`).join("")}</div>
        <input class="input" id="cCarOtra" placeholder="Otras carreras, separadas por coma" aria-label="Otras carreras" style="margin-top:8px"><p class="help">Marca todas las carreras que sirven para el cargo.</p></div>
      <div><label class="f" for="cLugar">Lugar</label><input class="input" id="cLugar" placeholder="Ej.: Faena Centinela, turno 4x4"></div>
      <div><label class="f" for="cCierre">Postulaciones hasta *</label><input class="input" id="cCierre" type="date"><div class="err" id="eCierre">Elige la fecha de cierre.</div></div>
      <div class="full"><label class="f" for="cPortal">Link del portal de postulación de AMSA (opcional)</label><input class="input" id="cPortal" type="url" placeholder="https://…"><p class="help">SIVA no reemplaza el portal de AMSA. Si la convocatoria ya está en el portal, pega su link: los estudiantes postulan allá y tú registras aquí a quienes postularon para darles seguimiento.</p></div>
      <div class="full"><label class="f" for="cCond">Condiciones</label><input class="input" id="cCond" placeholder="Duración, jornada, si hay pago o beneficios"><p class="help">Lo que más piden los estudiantes antes de postular: sueldo o apoyo, turnos, lugar y fechas.</p></div>
      <div class="full"><label class="f" for="cDesc">Descripción general del cargo</label><textarea class="input" id="cDesc" rows="3" placeholder="En qué equipo estará, qué tipo de trabajo hará y con quién"></textarea></div>
      <div class="full"><label class="f" for="cReq">Requisitos</label><textarea class="input" id="cReq" rows="2"></textarea></div>
    </div>
    ${ce ? "" : `<label class="chk li-chk"><input type="checkbox" id="cLi" checked> Publicar también en LinkedIn</label>`}
    <div class="form-actions"><button class="btn-accent" id="cGuardar">${ce ? "Guardar cambios" : "Crear convocatoria"}</button><button class="btn-outline" onclick="${ce ? `location.hash='#/convocatoria/${ce.id}'` : v ? `location.hash='#/ficha/${v.id}'` : "history.back()"}">Cancelar</button></div>
    ${ce ? zonaEliminar("convocatoria", ce.postulantes.length ? `Tiene ${ce.postulantes.length} postulaciones, que también se eliminan. Si solo ya no recibe postulaciones, mejor ciérrala.` : "Si ya no se va a hacer, puedes eliminarla.") : ""}
  </div>
  <aside class="stack sticky-aside"><div class="card" id="liBox"><p class="card-title">Así se verá en LinkedIn</p><div class="li-post" id="liPrev"></div></div></aside></div>`;
}

function leerConv(v) {
  const sel = id => ($("#" + id) || {}).value;
  return {
    vinculo: v ? v.id : null, area: v ? v.area : sel("cArea"), companias: $$("#cComps input:checked").map(i => i.value), institucion: v ? v.contraparte : (sel("cInst") || ""), titulo: $("#cTit").value.trim(), tipo: $("#cTipo").value,
    carreras: [...$$("#cCars input:checked").map(i => i.value), ...$("#cCarOtra").value.split(",").map(x => x.trim()).filter(Boolean)].join(", "), cupos: Math.max(1, +$("#cCupos").value || 1),
    cierre: $("#cCierre").value, lugar: $("#cLugar").value.trim(), condiciones: $("#cCond").value.trim(),
    descripcion: $("#cDesc").value.trim(), requisitos: $("#cReq").value.trim(),
    portal: (x => /^https?:\/\//i.test(x) ? x : x ? "https://" + x : "")((sel("cPortal") || "").trim())
  };
}

let liAbierto = false;
function wireNuevaConv(vid, ce) {
  const v = vid ? vinculo(+vid) : null; if (!$("#cGuardar")) return;
  if (ce) {
    const set = (id, val) => { const el = $("#" + id); if (el && val != null) el.value = val; };
    set("cInst", ce.institucion); set("cArea", ce.area); set("cTit", ce.titulo); set("cTipo", ce.tipo); set("cCupos", ce.cupos);
    set("cLugar", ce.lugar); set("cCierre", ce.cierre); set("cCond", ce.condiciones); set("cDesc", ce.descripcion); set("cReq", ce.requisitos); set("cPortal", ce.portal);
    const cs = convComps(ce); $$("#cComps input").forEach(i => i.checked = cs.includes(i.value));
    const cars = (ce.carreras || "").split(",").map(x => x.trim()).filter(Boolean);
    $$("#cCars input").forEach(i => i.checked = cars.includes(i.value));
    set("cCarOtra", cars.filter(x => !CONFIG.carreras.includes(x)).join(", "));
    wireEliminar(() => eliminarConv(ce));
  }
  const prev = () => {
    const c = Object.assign({ id: ce ? ce.id : "nueva", titulo: "", cupos: 1, cierre: "" }, leerConv(v));
    $("#liPrev").innerHTML = liPostHTML(c);
    $("#liBox").hidden = $("#cLi") ? !$("#cLi").checked : false;
  };
  $$("main input, main select, main textarea").forEach(el => { el.addEventListener("input", prev); el.addEventListener("change", prev); });
  if ($("#cLi")) $("#cLi").onchange = prev; prev();
  $("#cTit").addEventListener("input", () => $("#eTit").classList.remove("show"));
  $("#cCierre").addEventListener("input", () => $("#eCierre").classList.remove("show"));
  $("#cGuardar").onclick = () => {
    const d = leerConv(v);
    $("#eTit").classList.toggle("show", !d.titulo); $("#eCierre").classList.toggle("show", !d.cierre);
    if (!d.titulo || !d.cierre) return;
    if (ce) { if (!ce.vinculo) { d.vinculo = null; } else { delete d.vinculo; delete d.area; delete d.institucion; } Object.assign(ce, d); guardar(); location.hash = "#/convocatoria/" + ce.id; setTimeout(() => toast("Cambios guardados"), 50); return; }
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
    <div class="li-link"><b>${esc(c.titulo || "Título de la convocatoria")}</b><small>Postula en la página de convocatorias de Antofagasta Minerals</small></div>`;
}

/* ---------- Detalle de la convocatoria (interno) ---------- */
function vConvocatoria(id) {
  const c = convocatoria(+id);
  if (!c) return `<div class="card empty">Esa convocatoria no existe.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver</button></div>`;
  const v = vinculo(c.vinculo), ed = puedeEditarConv(c), q = quedaron(c);
  const local = location.protocol === "file:";
  return `<div class="crumbs"><a href="#/mis">Mis vínculos</a> / ${v ? `<a href="#/ficha/${v.id}">${esc(v.nombre)}</a> / ` : ""}Convocatoria</div>
  <div class="head-row"><div><h1>${esc(c.titulo)}</h1><p class="sub">${esc(c.tipo)} · ${esc(instTxt(c))} · ${compTag(convComps(c))} · cierra el ${fechaTxt(c.cierre)}</p></div>${convPill(c)}</div>
  <div class="statbar">
    <div><span class="lbl">Postulantes</span><b class="statnum">${c.postulantes.length}</b></div>
    <div><span class="lbl">Cupos llenos</span><span class="pcell">${barra(Math.min(100, Math.round(q.length / c.cupos * 100)))}<b>${q.length} de ${c.cupos}</b></span></div>
    <div class="actions">${ed && q.length ? `<a class="btn-accent" href="#/correo-aceptados/${c.id}">Correo para aceptados${c.postulantes.filter(p => p.estado === "Aceptado").length ? " (" + c.postulantes.filter(p => p.estado === "Aceptado").length + ")" : ""}</a>` : ""}${ed ? `<a class="btn-outline" href="#/editar-convocatoria/${c.id}">Editar o eliminar</a><button class="btn-outline" id="convEstado">${c.estado === "Abierta" ? "Cerrar convocatoria" : "Reabrir"}</button>` : ""}<a class="btn-outline" href="#/postular/${c.id}" target="_blank" rel="noopener">Ver página de postulación</a></div>
  </div>
  <div class="card"><p class="card-title">Ciclo de las y los estudiantes</p>${cicloHTML(cicloDe(c.postulantes))}</div>
  <div class="grid-main"><div class="stack">
    <div class="card"><div class="head-row"><p class="card-title">Postulantes</p><span class="muted small">Cambia el estado a medida que revisas. Cada cambio prepara el correo para avisarle al estudiante.</span></div>
      ${c.postulantes.length ? `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Universidad y carrera</th><th>Postuló</th><th>Estado</th><th>Aviso y seguimiento</th></tr></thead><tbody>${c.postulantes.map((p, i) => `<tr><td><span class="t">${esc(p.nombre)}</span><small><a class="lnk" href="mailto:${esc(p.correo)}">${esc(p.correo)}</a></small></td><td>${esc(p.universidad)}<small>${esc(p.carrera)}</small></td><td><small style="color:var(--ink)">${fechaTxt(p.fecha)}</small></td><td><select class="input sm est-${POST_ESTADOS.indexOf(p.estado)}" data-post="${i}" ${ed ? "" : "disabled"} aria-label="Estado de ${esc(p.nombre)}">${POST_ESTADOS.map(e => `<option ${p.estado === e ? "selected" : ""}>${e}</option>`).join("")}</select></td><td>${correoEstudiante(c, p) ? (p.avisado === p.estado ? `<span class="aviso-ok">Avisado</span>${ed ? ` <button class="link-btn" data-avisar="${i}">Ver correo</button>` : ""}` : ed ? `<button class="link-btn" data-avisar="${i}">Avisar por correo</button>` : `<span class="muted small">Pendiente</span>`) : `<span class="muted small">No aplica</span>`}${ACEPTADOS.includes(p.estado) ? `<button class="link-btn seg-btn" data-seg="${i}" aria-expanded="${segAbierto === i}">${segAbierto === i ? "Cerrar seguimiento" : "Seguimiento" + ((p.feedbackTutor || []).length ? ` (${p.feedbackTutor.length})` : "")}</button>` : ""}</td></tr>${segAbierto === i && ACEPTADOS.includes(p.estado) ? `<tr class="seg-row"><td colspan="5">${segHTML(c, p, i, ed)}</td></tr>` : ""}`).join("")}</tbody></table></div>`
        : `<div class="empty">Aún no hay postulaciones. Comparte el link de postulación o publícala en LinkedIn.</div>`}
    </div>
    ${ed ? fold("Registrar un postulante a mano", null, `<p class="help">${c.portal ? "Si el estudiante postuló en el portal de AMSA, regístralo aquí para seguirlo en SIVA." : "Para quien postuló por correo u otra vía."}</p><div class="g2"><div><label class="f" for="mNom">Nombre *</label><input class="input" id="mNom"></div><div><label class="f" for="mCor">Correo *</label><input class="input" id="mCor" type="email"></div><div><label class="f" for="mUni">Universidad *</label><input class="input" id="mUni"></div><div><label class="f" for="mCar">Carrera *</label><input class="input" id="mCar"></div></div><div class="err" id="eMan">Completa todos los campos y un correo válido.</div><div class="form-actions"><button class="btn-outline" id="mAgregar">Agregar postulante</button></div>`, false, c.portal ? "postulaciones del portal" : "") : ""}
    ${fold("Detalle de la oferta", null, `<dl class="kv">
      <dt>Carreras</dt><dd class="${c.carreras ? "" : "ph"}">${esc(c.carreras || "No definido")}</dd>
      <dt>Lugar</dt><dd class="${c.lugar ? "" : "ph"}">${esc(c.lugar || "No definido")}</dd>
      <dt>Condiciones</dt><dd class="${c.condiciones ? "" : "ph"}">${esc(c.condiciones || "No definido")}</dd>
      <dt>Descripción del cargo</dt><dd class="${c.descripcion ? "" : "ph"}">${esc(c.descripcion || "No definido")}</dd>
      <dt>Requisitos</dt><dd class="${c.requisitos ? "" : "ph"}">${esc(c.requisitos || "No definido")}</dd></dl>${ed ? `<div class="fold-acts"><a class="link-btn" href="#/editar-convocatoria/${c.id}">Editar la oferta</a></div>` : ""}`, false, [c.carreras ? c.carreras.split(",").length + " carreras" : "", c.lugar].filter(Boolean).join(" · "))}
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
    ${c.portal ? `<div class="card side"><p class="card-title">Portal de AMSA</p><p class="small">Las postulaciones se hacen en el portal de AMSA.</p><a class="btn-outline wide" href="${esc(c.portal)}" target="_blank" rel="noopener">Abrir en el portal</a></div>` : ""}
    <div class="card side"><p class="card-title">Link de postulación</p>
      <div class="inline-form"><input class="input" id="linkPost" value="${esc(urlPostular(c))}" readonly aria-label="Link de postulación"><button class="btn-outline" id="copiarLink">Copiar</button></div>
      ${local ? `<p class="help">Estás viendo la página desde tu computador: este link solo le funcionará a otras personas cuando la página esté publicada (por ejemplo, en GitHub Pages).</p>` : ""}</div>
    <div class="card side"><p class="card-title">Aceptados</p>${q.length ? q.map(p => `<div class="person"><b>${esc(p.nombre)}</b><span>${esc(p.universidad)} · ${esc(p.estado)}</span></div>`).join("") : `<p class="muted small">Todavía nadie. Marca "Aceptado" en la lista de postulantes.</p>`}${ed && q.length ? `<a class="btn-accent wide" style="margin-top:10px;text-decoration:none;text-align:center;display:block" href="#/correo-aceptados/${c.id}">Enviar correo a los aceptados</a>` : ""}</div>
  </aside></div>`;
}

/* ---------- Seguimiento del estudiante (lado AMSA) ---------- */
let segAbierto = null;
const fbTutorHTML = f => `<div class="fb-t"><div class="fb-h"><b>${fechaTxt(f.fecha)}</b>${f.final ? ` <span class="pill p2">Feedback final</span>` : ""}${f.nota != null ? `<span class="fb-nota">Nota ${num1(f.nota)}</span>` : ""}</div><p>${esc(f.texto)}</p>${f.propuestas && f.propuestas.length ? `<p class="lbl2">Propuestas de mejora</p><ul>${f.propuestas.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${f.autor ? `<small class="muted">${esc(f.autor)}</small>` : ""}</div>`;
function segHTML(c, p, i, ed) {
  const fe = p.feedbackEstudiante;
  return `<div class="segui">
    <div class="segui-col">
      <p class="card-title">Feedback al estudiante</p>
      ${(p.feedbackTutor || []).length ? p.feedbackTutor.slice().reverse().map(fbTutorHTML).join("") : `<p class="muted small">Aún no hay feedback. Lo que escribas aquí lo ve ${esc(p.nombre.split(" ")[0])} en su página.</p>`}
      ${ed ? `<div class="segui-form">
        <label class="f" for="sgTxt">Nuevo feedback</label><textarea class="input" id="sgTxt" rows="3" placeholder="Qué está haciendo bien y en qué tiene que poner atención"></textarea>
        <label class="f" for="sgProp">Propuestas de mejora (una por línea)</label><textarea class="input" id="sgProp" rows="2"></textarea>
        <div class="g2"><div><label class="f" for="sgNota">Nota (opcional, de 1 a 7)</label><input class="input" id="sgNota" type="number" min="1" max="7" step="0.1"></div>
        <div><label class="f" for="sgAutor">Tutor o tutora</label><input class="input" id="sgAutor" value="${esc(((p.feedbackTutor || []).slice(-1)[0] || {}).autor || "")}" placeholder="Nombre (tutor/a)"></div></div>
        ${p.estado === "Terminó" ? `<label class="chk"><input type="checkbox" id="sgFinal" checked> Es el feedback final</label>` : ""}
        <div class="form-actions"><button class="btn-accent" data-seg-guardar="${i}">Guardar feedback</button></div></div>` : ""}
    </div>
    <div class="segui-col">
      <p class="card-title">Lo que dejó el estudiante</p>
      ${fe ? `<div class="fb-t"><div class="fb-h"><b>${fechaTxt(fe.fecha)}</b><span class="fb-nota">${num1(promEst(p))} de 5</span></div>${PREGUNTAS_EST.map((q, j) => fe.respuestas[j] ? `<div class="qa"><span>${esc(q)}</span><b>${fe.respuestas[j]}</b></div>` : "").join("")}${fe.comentario ? `<p>${esc(fe.comentario)}</p>` : ""}</div>` : `<p class="muted small">${p.estado === "Terminó" ? "Todavía no deja su feedback." : "Lo deja al terminar su práctica o memoria."}</p>`}
      <p class="lbl2" style="margin-top:12px!important">Informe y nota de la universidad</p>
      ${p.estado !== "Terminó" ? `<p class="muted small">Se suben al terminar.</p>` : p.autorizaVerNota ? `<p class="small">${p.informe ? `Informe: <b>${esc(p.informe.nombre)}</b> (subido el ${fechaTxt(p.informe.fecha)})` : "Aún no sube su informe."}<br>${p.notaUniversidad != null ? `Nota de la universidad: <b>${num1(p.notaUniversidad)}</b>` : "Aún no ingresa su nota."}</p>` : `<p class="small muted">${p.informe || p.notaUniversidad != null ? "El estudiante subió su informe o su nota, pero no autorizó que AMSA los vea." : "Aún no sube su informe ni su nota."}</p>`}
      <p class="help"><a class="lnk" href="${linkEstudiante(p)}" target="_blank" rel="noopener">Ver la página del estudiante</a></p>
    </div></div>`;
}

// Quien queda en una convocatoria pasa a la lista de estudiantes en práctica o memoria.
function sincEstudiante(c, p) {
  S.estudiantes = S.estudiantes.filter(e => !(e.conv === c.id && e.nombre === p.nombre));
  if (ACEPTADOS.includes(p.estado)) {
    const inst = S.contrapartes.find(x => x.nombre === p.universidad);
    S.estudiantes.push({ nombre: p.nombre, tipo: c.tipo, contraparte: inst ? inst.id : "", area: convArea(c), compania: convComps(c)[0] || "", nota: null, conv: c.id, etapa: p.estado });
  }
}

function copiar(txt, msg) {
  const ok = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, ok);
  else { const t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); ok(); }
}

window.addEventListener("hashchange", () => { segAbierto = null; });
function wireConv(id) {
  const c = convocatoria(+id); if (!c) return;
  liAbierto = false;
  $$("[data-post]").forEach(s => s.onchange = e => {
    const p = c.postulantes[+s.dataset.post], antes = p.estado;
    p.estado = e.target.value; sincEstudiante(c, p); guardar(); render();
    const msg = p.estado === "Aceptado" ? `${p.nombre} fue aceptado/a y pasa a Estudiantes. Falta avisarle por correo.` : correoEstudiante(c, p) ? `Estado actualizado. Falta avisarle a ${p.nombre} por correo.` : "Estado actualizado";
    toast(msg, () => { p.estado = antes; sincEstudiante(c, p); guardar(); render(); });
  });
  $$("[data-seg]").forEach(b => b.onclick = () => { const i = +b.dataset.seg; segAbierto = segAbierto === i ? null : i; render(); const r = $(".seg-row"); if (r) r.scrollIntoView({ block: "nearest" }); });
  $$("[data-seg-guardar]").forEach(b => b.onclick = () => {
    const p = c.postulantes[+b.dataset.segGuardar], texto = $("#sgTxt").value.trim();
    if (!texto) { $("#sgTxt").focus(); toast("Escribe el feedback antes de guardar"); return; }
    const nota = $("#sgNota").value ? Math.min(7, Math.max(1, +$("#sgNota").value)) : null;
    const f = { fecha: hoy(), autor: $("#sgAutor").value.trim(), texto, nota, propuestas: $("#sgProp").value.split("\n").map(x => x.trim()).filter(Boolean) };
    if ($("#sgFinal") && $("#sgFinal").checked) f.final = true;
    p.feedbackTutor = (p.feedbackTutor || []).concat(f); guardar(); render();
    toast(`Feedback guardado. ${p.nombre.split(" ")[0]} lo ve en su página.`);
  });
  $$("[data-avisar]").forEach(b => b.onclick = () => {
    const p = c.postulantes[+b.dataset.avisar], m = correoEstudiante(c, p); if (!m) return;
    abrirOutlookWeb(p.correo, m.asunto, m.cuerpo); p.avisado = p.estado; guardar(); render();
    toast(`Se abrió Outlook con el correo para ${p.nombre}. Revísalo y envíalo.`);
  });
  const ma = $("#mAgregar"); if (ma) ma.onclick = () => {
    const d = { nombre: $("#mNom").value.trim(), correo: $("#mCor").value.trim(), universidad: $("#mUni").value.trim(), carrera: $("#mCar").value.trim() };
    const ok = d.nombre && d.universidad && d.carrera && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo);
    $("#eMan").classList.toggle("show", !ok); if (!ok) return;
    c.postulantes.push(Object.assign(d, { fecha: hoy(), estado: "Postuló", via: c.portal ? "portal" : "manual" })); guardar(); render();
    toast(`${d.nombre} quedó registrado/a como postulante`);
  };
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
  const head = `<header class="pub-top"><div class="pub-inner"><a href="#/convocatorias">${logoAmsa()}<span class="prod"><b>Convocatorias</b><span>Prácticas y memorias para estudiantes</span></span></a></div></header>`;
  if (!c) return head + `<main class="pub"><div class="card empty">Esta convocatoria no existe o fue eliminada.</div></main>`;
  const cp = convInst(c) ? contraparte(convInst(c)) : { tipoOrg: "" };
  const unis = S.contrapartes.filter(x => x.tipoOrg === "Universidad" || x.tipoOrg === "Instituto profesional" || x.tipoOrg === "Centro de formación técnica").map(x => x.nombre).sort();
  const det = (k, val) => val ? `<dt>${k}</dt><dd>${esc(val)}</dd>` : "";
  const cuerpo = postEnviado === c.id
    ? `<div class="card ok-box"><h2>¡Recibimos tu postulación!</h2><p>Te escribiremos al correo que dejaste cuando revisemos las postulaciones. La convocatoria cierra el ${fechaTxt(c.cierre)}.</p><p>Puedes ver en qué va tu postulación cuando quieras con tu correo.</p><div class="form-actions"><a class="btn-accent" href="#/mi-postulacion">Ver el estado de mi postulación</a><button class="btn-outline" id="otra">Enviar otra postulación</button></div></div>`
    : c.estado !== "Abierta"
      ? `<div class="card empty">Esta convocatoria ya cerró y no está recibiendo postulaciones.</div>`
      : `<div class="card"><p class="card-title">${c.portal ? "Ya postulé en el portal: seguir mi proceso aquí" : "Postula"}</p><div class="g2">
          <div class="full"><label class="f" for="pNom">Nombre completo *</label><input class="input" id="pNom" autocomplete="name"></div>
          <div class="full"><label class="f" for="pCor">Correo *</label><input class="input" id="pCor" type="email" autocomplete="email"></div>
          <div><label class="f" for="pUni">Universidad o institución *</label><select class="input" id="pUni"><option value=""></option>${unis.map(u => `<option>${esc(u)}</option>`).join("")}<option>Otra</option></select></div>
          <div><label class="f" for="pCar">Carrera *</label><input class="input" id="pCar"></div>
          <div class="full"><label class="f" for="pCv">Link a tu CV o LinkedIn (opcional)</label><input class="input" id="pCv" type="url"></div></div>
          <div class="err" id="ePost">Completa los campos con asterisco y un correo válido.</div>
          <div class="form-actions"><button class="btn-accent" id="pEnviar">Enviar postulación</button></div></div>`;
  const portalBox = c.portal && c.estado === "Abierta" ? `<div class="card portal-box"><p class="card-title">Postula en el portal de AMSA</p><p>Esta convocatoria recibe postulaciones en el portal de empleo de Antofagasta Minerals. Postula allá y después deja tus datos más abajo para seguir tu proceso en esta página.</p><a class="btn-accent" href="${esc(c.portal)}" target="_blank" rel="noopener">Ir al portal de AMSA</a></div>` : "";
  return head + `<main class="pub">
    <a class="lnk small" href="#/convocatorias">← Todas las convocatorias</a>
    <p class="sub">${esc(c.tipo)}${cp.tipoOrg === "Universidad" ? " · en alianza con " + esc(cp.nombre) : ""}</p>
    <h1>${esc(c.titulo)}</h1>
    <div class="card"><dl class="kv">${det("Carreras", c.carreras)}${det("Lugar", c.lugar)}${det("Condiciones", c.condiciones)}${det("Descripción del cargo", c.descripcion)}${det("Requisitos", c.requisitos)}<dt>Cupos</dt><dd>${c.cupos}</dd><dt>Postulaciones hasta</dt><dd>${fechaTxt(c.cierre)}</dd></dl></div>
    <div class="card"><p class="card-title">Cómo sigue el proceso</p>${pasosProceso(null)}</div>
    ${portalBox}${cuerpo}
    <p class="help" style="text-align:center;margin-top:18px"><a class="lnk" href="#/mi-postulacion">¿Ya postulaste? Revisa el estado de tu postulación</a></p></main>${pie()}`;
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
  const volver = typeof ME !== "undefined" && ME ? `<p class="pub-volver"><a class="btn-outline sm" href="${inicioDe(ME)}">← Volver a SIVA</a></p>` : "";
  return `<header class="pub-top"><div class="pub-inner">${logoAmsa()}<span class="prod"><b>Convocatorias</b><span>Prácticas y memorias para estudiantes</span></span></div></header>
  <main class="pub">
    ${volver}
    <h1>Prácticas y memorias en Antofagasta Minerals</h1>
    <p class="sub">Revisa las convocatorias abiertas, con sus condiciones y fechas, y postula sin crear una cuenta. Te avisaremos por correo cómo terminó tu postulación.</p>
    <div class="filters"><div class="chips"><button class="chip-btn ${pubTipo ? "" : "on"}" data-pubtipo="">Todas (${abiertas.length})</button>${CONV_TIPOS.map(t => `<button class="chip-btn ${pubTipo === t ? "on" : ""}" data-pubtipo="${t}">${t} (${abiertas.filter(c => c.tipo === t).length})</button>`).join("")}</div>
    <div class="frow"><input class="input sm" id="pubQ" placeholder="Buscar por carrera o palabra" value="${esc(pubQ)}" aria-label="Buscar convocatoria"></div></div>
    <div class="stack" id="pubLista">${pubLista()}</div>
    <p class="help" style="text-align:center;margin-top:18px"><a class="lnk" href="#/mi-postulacion">¿Ya postulaste? Revisa el estado de tu postulación</a></p>
    ${ME ? "" : `<p class="help" style="text-align:center"><a class="lnk" href="#/login">Trabajo en Antofagasta Minerals: iniciar sesión</a></p>`}
  </main>${pie()}`;
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


/* ---------- Estudiante: estado de su postulación ----------
   El estudiante no tiene cuenta: revisa con su correo. En la versión real
   se le mandaría un link personal por correo (Outlook). */
const PASOS_POST = [
  ["Postulación recibida", "Recibimos tus datos."],
  ["En revisión", "El área revisa las postulaciones. Puede que te contacten para una entrevista."],
  ["Resultado", "Te avisamos por correo si fuiste aceptado/a o no."],
  ["Práctica o memoria", "Si te aceptan, recibes por correo tu fecha de ingreso, tu tutor o tutora y qué llevar el primer día."],
  ["Cierre", "Al terminar te pedimos tu opinión con una encuesta corta."]
];
function pasosProceso(estado) {
  const idx = estado == null ? -1 : { "Postuló": 0, "En revisión": 1, "Aceptado": 3, "No aceptado": 2, "En práctica": 3, "Terminó": 5 }[estado];
  return `<ol class="pasos">${PASOS_POST.map(([t, d], i) => {
    let cls = "";
    if (estado === "No aceptado") cls = i < 2 ? "hecho" : i === 2 ? "actual" : "no";
    else if (idx >= 0) cls = i < idx ? "hecho" : i === idx ? "actual" : "";
    const det = ACEPTADOS.includes(estado) && i === 2 ? "¡Fuiste aceptado/a!" : estado === "Aceptado" && i === 3 ? "Pronto te escribimos con tu fecha de ingreso y tu tutor o tutora." : estado === "En práctica" && i === 3 ? "Estás haciendo tu práctica o memoria." : estado === "No aceptado" && i === 2 ? "Esta vez no fuiste seleccionado/a. Te avisamos por correo y puedes postular a otras convocatorias." : d;
    return `<li class="${cls}"><div><b>${t}</b><span>${det}</span></div></li>`;
  }).join("")}</ol>`;
}
let miCorreo = "";
function vMiPostulacion(p) {
  if (p) { try { miCorreo = decodeURIComponent(p); } catch (e) { miCorreo = p; } }
  return `<header class="pub-top"><div class="pub-inner"><a href="#/convocatorias">${logoAmsa()}<span class="prod"><b>Mi práctica o memoria</b><span>Para estudiantes de Antofagasta Minerals</span></span></a></div></header>
  <main class="pub">
    <a class="lnk small" href="#/convocatorias">← Todas las convocatorias</a>
    <h1>Mi postulación</h1>
    <p class="sub">${p ? "Entraste con el link personal que te llegó al correo." : "Escribe el correo con que postulaste. Normalmente entras con el link personal que te llega al correo."}</p>
    ${p ? "" : `<div class="card"><label class="f" for="mpCor">Correo</label><div class="frow"><input class="input" id="mpCor" type="email" autocomplete="email" value="${esc(miCorreo)}" placeholder="nombre@uc.cl"><button class="btn-accent" id="mpVer">Ver</button></div>
    <p class="help">Para probar: camila.rojas@ejemplo.cl (en práctica), sofia.pizarro@ejemplo.cl (terminó) o diego.fuentes@ejemplo.cl (en revisión)</p></div>`}
    <div class="post-res" id="mpRes">${miPostRes()}</div>
  </main>${pie()}`;
}
function etapasPracticaHTML(p) {
  const n = (p.feedbackTutor || []).length, fin = p.estado === "Terminó";
  return `<ol class="pasos">${ETAPAS_PRACTICA.map((t, i) => `<li class="${fin || i < Math.min(n, 2) ? "hecho" : i === Math.min(n, 2) ? "actual" : ""}"><div><b>${t}</b><span>${["Conoces a tu equipo, tu tutor o tutora y las reglas de seguridad.", "Tu tutor o tutora revisa cómo vas y te deja propuestas de mejora.", "Recibes el feedback final y cuentas cómo te fue."][i]}</span></div></li>`).join("")}</ol>`;
}
function miPostRes() {
  const q = miCorreo.trim().toLowerCase(); if (!q) return "";
  const r = []; S.convocatorias.forEach(c => c.postulantes.forEach((p, i) => { if ((p.correo || "").toLowerCase() === q) r.push({ c, p, i }); }));
  if (!r.length) return `<div class="card empty">No encontramos postulaciones con ese correo. Revisa que esté bien escrito.</div>`;
  return r.map(({ c, p, i }) => {
    const k = c.id + "-" + i, fbs = (p.feedbackTutor || []).slice().reverse(), fin = fbs.find(f => f.final);
    const fase = p.estado === "Terminó" ? 3 : p.estado === "En práctica" ? 2 : 1;
    const tabs = `<div class="fases">${["Postula", "Mientras", "Sale"].map((t, j) => `<span class="${j + 1 < fase ? "hecho" : j + 1 === fase ? "on" : ""}">${j + 1}. ${t}</span>`).join("")}</div>`;
    let cuerpo = "";
    if (p.estado === "En práctica") cuerpo = `<div class="est-sec"><h3 class="h3">Mientras: tu ${esc(c.tipo.toLowerCase())}</h3>${etapasPracticaHTML(p)}</div>
      <div class="est-sec"><h3 class="h3">Feedback de tu tutor o tutora</h3>${fbs.length ? fbs.map(fbTutorHTML).join("") : `<p class="muted small">Todavía no hay feedback. Te avisamos por correo cuando llegue.</p>`}</div>`;
    if (p.estado === "Terminó") {
      const fe = p.feedbackEstudiante;
      cuerpo = `<div class="est-sec"><h3 class="h3">Feedback final de tu tutor o tutora</h3>${fin ? fbTutorHTML(fin) : `<p class="muted small">Tu tutor o tutora todavía no deja el feedback final.</p>`}
        ${fbs.filter(f => !f.final).length ? `<details class="mas"><summary>Ver el feedback anterior (${fbs.filter(f => !f.final).length})</summary>${fbs.filter(f => !f.final).map(fbTutorHTML).join("")}</details>` : ""}</div>
      <div class="est-sec"><h3 class="h3">Cuéntanos cómo te fue</h3>${fe ? `<p class="ok-txt">Gracias, enviaste tu feedback el ${fechaTxt(fe.fecha)}.</p>${PREGUNTAS_EST.map((t, j) => `<div class="qa"><span>${esc(t)}</span><b>${fe.respuestas[j] || "–"}</b></div>`).join("")}${fe.comentario ? `<p class="small">${esc(fe.comentario)}</p>` : ""}`
        : `${PREGUNTAS_EST.map((t, j) => `<div class="preg"><p class="f"><b>${j + 1}.</b> ${esc(t)}</p><div class="escala" role="radiogroup" aria-label="${esc(t)}">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="e${k}-${j}" value="${n}"><span>${n}</span></label>`).join("")}</div><div class="escala-lbl"><span>Muy mal</span><span>Muy bien</span></div></div>`).join("")}
          <label class="f" for="eCom${k}">Comentario (opcional)</label><textarea class="input" id="eCom${k}" rows="2" placeholder="Qué te sirvió y qué cambiarías"></textarea>
          <div class="err" id="eErr${k}">Responde al menos una pregunta.</div>
          <div class="form-actions"><button class="btn-accent" data-est-fb="${k}">Enviar mi feedback</button></div>`}</div>
      <div class="est-sec"><h3 class="h3">Tu informe y tu nota</h3>
        <label class="f" for="eInf${k}">Informe final</label>${p.informe ? `<p class="small">Subiste <b>${esc(p.informe.nombre)}</b> el ${fechaTxt(p.informe.fecha)}.</p>` : ""}
        <input class="input" type="file" id="eInf${k}" accept=".pdf,.doc,.docx">
        <p class="help">En el prototipo solo se guarda el nombre del archivo y la fecha.</p>
        <label class="f" for="eNota${k}">Nota que te puso tu universidad (de 1,0 a 7,0)</label><input class="input sm" id="eNota${k}" type="number" min="1" max="7" step="0.1" value="${p.notaUniversidad != null ? p.notaUniversidad : ""}" style="max-width:140px">
        <label class="chk aut"><input type="checkbox" id="eAut${k}" ${p.autorizaVerNota ? "checked" : ""}> Autorizo que AMSA vea mi nota y mi informe</label>
        <p class="help">Si no marcas la casilla, tu nota y tu informe quedan guardados solo para ti. AMSA no los ve.</p>
        <div class="form-actions"><button class="btn-accent" data-est-inf="${k}">Guardar</button></div></div>`;
    }
    return `<div class="card est-card"><div class="head-row"><div><h3 class="h3" style="margin:0">${esc(c.titulo)}</h3><p class="small muted" style="margin:4px 0 0">Postulaste el ${fechaTxt(p.fecha)} · ${esc(c.tipo)}${c.lugar ? " · " + esc(c.lugar) : ""}</p></div></div>
      ${tabs}
      ${fold("Postula: estado de tu postulación", null, pasosProceso(p.estado), fase === 1, p.estado)}
      ${cuerpo}</div>`;
  }).join("");
}
function wireMiPostulacion() {
  const ver = () => { miCorreo = $("#mpCor").value; $("#mpRes").innerHTML = miPostRes(); wireMiPostulacion(); };
  if ($("#mpVer")) { $("#mpVer").onclick = ver; $("#mpCor").onkeydown = e => { if (e.key === "Enter") ver(); }; }
  const buscar = k => { const [cid, i] = k.split("-").map(Number); return convocatoria(cid).postulantes[i]; };
  const repinta = msg => { $("#mpRes").innerHTML = miPostRes(); wireMiPostulacion(); toast(msg); };
  $$("[data-est-fb]").forEach(b => b.onclick = () => {
    const k = b.dataset.estFb, p = buscar(k);
    const r = PREGUNTAS_EST.map((_, j) => { const x = $(`input[name="e${k}-${j}"]:checked`); return x ? +x.value : null; });
    if (!r.some(Boolean)) { $("#eErr" + k).classList.add("show"); return; }
    p.feedbackEstudiante = { respuestas: r, comentario: $("#eCom" + k).value.trim(), fecha: hoy() }; guardar(); repinta("Gracias por tu feedback");
  });
  $$("[data-est-inf]").forEach(b => b.onclick = () => {
    const k = b.dataset.estInf, p = buscar(k), f = $("#eInf" + k).files[0], n = $("#eNota" + k).value;
    if (f) p.informe = { nombre: f.name, fecha: hoy() };
    p.notaUniversidad = n ? Math.min(7, Math.max(1, +n)) : null;
    p.autorizaVerNota = $("#eAut" + k).checked; guardar();
    repinta(p.autorizaVerNota ? "Guardado. AMSA puede ver tu nota y tu informe." : "Guardado. Tu nota y tu informe quedan solo para ti.");
  });
}
