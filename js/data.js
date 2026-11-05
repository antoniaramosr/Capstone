/* Datos de partida de la rama "nuevo": un set corto y coherente, armado a mano para probar.
   Son ficticios, salvo los correos con "+" de la cuenta de prueba (llegan a la bandeja de Antonia),
   para poder abrir Outlook y recibir de verdad los correos. El detalle de quién es cada persona
   y para qué sirve está en el README. */

const CORREO_PRUEBA = (alias) => "antonia.ramos+" + alias + "@uc.cl";

const SEED = {
  contrapartes: [
    { id: "ucn",    nombre: "Universidad Católica del Norte", corto: "UCN", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [
      { nombre: "Paula Herrera", cargo: "Vinculación con el medio", correo: CORREO_PRUEBA("ucn"), telefono: "+56 9 5237 2511" },
      { nombre: "Rodrigo Castillo", cargo: "Jefe de carrera, Ingeniería Civil de Minas", correo: "rcastillo@ucn.ejemplo.cl", telefono: "+56 9 5511 3133" }] },
    { id: "ua",     nombre: "Universidad de Antofagasta", corto: "U. de Antofagasta", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [
      { nombre: "Felipe Ortiz", cargo: "Vinculación con el medio", correo: "fortiz@uantof.ejemplo.cl", telefono: "+56 9 5785 3755" }] },
    { id: "uls",    nombre: "Universidad de La Serena", corto: "U. de La Serena", tipoOrg: "Universidad", locacion: "Coquimbo", zona: "Norte", contactos: [
      { nombre: "Héctor Araya", cargo: "Dirección de extensión", correo: "haraya@userena.ejemplo.cl", telefono: "+56 9 5330 8120" }] },
    { id: "ceduc",  nombre: "CEDUC UCN", corto: "CEDUC UCN", tipoOrg: "Centro de formación técnica", locacion: "Antofagasta y Los Vilos", zona: "Norte", contactos: [
      { nombre: "Andrea Rivera", cargo: "Dirección de sede Los Vilos", correo: "arivera@ceduc.ejemplo.cl", telefono: "+56 9 5648 3444" }] },
    { id: "uch",    nombre: "Universidad de Chile", corto: "U. de Chile", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Carla Núñez", cargo: "Unidad de empleabilidad, FCFM", correo: "cnunez@uchile.ejemplo.cl", telefono: "+56 9 5120 4418" }] },
    { id: "puc",    nombre: "Pontificia Universidad Católica de Chile", corto: "PUC", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Josefina Larraín", cargo: "Coordinación de prácticas, Ingeniería", correo: CORREO_PRUEBA("puc"), telefono: "+56 9 6470 5310" },
      { nombre: "Tomás Vial", cargo: "Profesor Capstone, Ingeniería", correo: "tvial@ing.ejemplo.cl", telefono: "+56 9 6333 4999" }] },
    { id: "usach",  nombre: "Universidad de Santiago de Chile", corto: "USACH", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Marcela Bravo", cargo: "Centro de empleabilidad", correo: "mbravo@usach.ejemplo.cl", telefono: "+56 9 5902 7731" }] },
    { id: "utfsm",  nombre: "Universidad Técnica Federico Santa María", corto: "UTFSM", tipoOrg: "Universidad", locacion: "Santiago y Valparaíso", zona: "Centro", contactos: [
      { nombre: "Ignacio Ramírez", cargo: "Dirección de vinculación", correo: "iramirez@usm.ejemplo.cl", telefono: "+56 9 5440 1288" }] },
    { id: "pucv",   nombre: "Pontificia Universidad Católica de Valparaíso", corto: "PUCV", tipoOrg: "Universidad", locacion: "Valparaíso", zona: "Centro", contactos: [
      { nombre: "Sandra Mella", cargo: "Dirección de asuntos estudiantiles", correo: "smella@pucv.ejemplo.cl", telefono: "+56 9 5322 9044" }] },
    { id: "uai",    nombre: "Universidad Adolfo Ibáñez", corto: "UAI", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Daniela Soto", cargo: "Educación ejecutiva", correo: "dsoto@uai.ejemplo.cl", telefono: "+56 9 5871 2230" }] },
    { id: "udec",   nombre: "Universidad de Concepción", corto: "UdeC", tipoOrg: "Universidad", locacion: "Biobío", zona: "Sur", contactos: [
      { nombre: "Pablo Vera", cargo: "Dirección de egresados y empleabilidad", correo: "pvera@udec.ejemplo.cl", telefono: "+56 9 5412 6677" }] },
    { id: "inacap", nombre: "INACAP", corto: "INACAP", tipoOrg: "Instituto profesional", locacion: "Nacional", zona: "Nacional", contactos: [
      { nombre: "Marcelo Pizarro", cargo: "Vicerrectoría INACAP", correo: "mpizarro@inacap.ejemplo.cl", telefono: "+56 9 5920 6150" }] },
    { id: "duoc",   nombre: "Duoc UC", corto: "Duoc UC", tipoOrg: "Instituto profesional", locacion: "Nacional", zona: "Nacional", contactos: [
      { nombre: "Natalia Rubio", cargo: "Vinculación con la industria", correo: "nrubio@duoc.ejemplo.cl", telefono: "+56 9 5221 3085" }] }
  ],

  // Objetivo y meta sugeridos según la temática del mapeo.
  temas: {
    "Atracción de talento": ["Presentar el programa Jóvenes Profesionales, prácticas y memorias a estudiantes de la universidad.", "Aumentar las postulaciones de calidad a prácticas, memorias y JP."],
    "Marca empleadora": ["Recibir a estudiantes en las oficinas de AMSA para mostrar cómo trabajan sus equipos.", "Posicionar a AMSA como un empleador atractivo entre estudiantes de último año."],
    "Vinculación sectorial": ["Invitar a académicos y estudiantes a la sesión sobre relaves.", "Compartir los desafíos de relaves y abrir posibles colaboraciones con la academia."],
    "Formación": ["Desarrollar un proyecto o programa formativo junto a la institución.", "Formar talento con conocimiento real de la operación minera."],
    "Desarrollo de talento": ["Ofrecer un diplomado a jóvenes profesionales de AMSA.", "Acelerar el desarrollo de los jóvenes profesionales."],
    "Diversidad e inclusión": ["Acompañar a estudiantes de ingeniería con mentoras de AMSA.", "Aumentar la participación de mujeres en ingeniería y en AMSA."],
    "Empleo y proveedores": ["Desarrollar empleo y proveedores locales junto a la institución.", "Fortalecer el empleo local y la cadena de proveedores de la región."],
    "Por definir": ["", ""]
  },

  /* Filas: [contraparte, sede, área, tipo, nombre, temática, etapa (0-3), extras]
     extras: c = calificación, a = ¿aportó a la meta? (si | parcial | no), f = financiamiento,
             k = contacto del vínculo (si falta, se usa el primero de la institución; nk = sin contacto),
             n = comentarios, i = inicio, t = término, d = días desde el último movimiento,
             r = responsable, al = alcance, co = compañías */
  filas: [
    // Reclutamiento y selección (equipo de Eduardo y Matías)
    ["ucn", "Antofagasta", "rys", "tal", "Memorias y prácticas UCN", "Atracción de talento", 2, { f: "Sin aporte monetario", i: "2026-08-10", d: 4, co: ["cen"], al: "Dos convocatorias al año (memorias y práctica de verano) para Ingeniería Civil de Minas, Industrial y Geología.", n: "Definir temas de memoria con las gerencias de operación." }],
    ["ua", "Antofagasta", "rys", "tal", "Práctica profesional U. de Antofagasta", "Atracción de talento", 2, { f: "Sin aporte monetario", i: "2026-09-15", d: 3, co: ["ant"], al: "Prácticas de invierno para Ingeniería Civil de Minas e Industrial." }],
    ["uch", "Santiago", "rys", "tal", "Memorias U. de Chile", "Atracción de talento", 3, { c: 4, a: "si", f: "Sin aporte monetario", i: "2026-03-02", t: "2026-09-30", d: 35, co: ["cen"] }],
    ["puc", "Santiago", "rys", "char", "Charla de prácticas y memorias PUC", "Atracción de talento", 3, { c: 5, a: "si", f: "Sin aporte monetario", i: "2026-04-25", t: "2026-08-28", d: 60, co: ["corp"] }],
    ["utfsm", "Valparaíso", "rys", "char", "Charla de prácticas y memorias UTFSM", "Atracción de talento", 3, { c: 4, a: "si", i: "2026-03-18", t: "2026-06-30", d: 120, co: ["zal"] }],
    ["uai", "Santiago", "rys", "char", "Charla de prácticas y memorias UAI", "Atracción de talento", 3, { c: 3, a: "parcial", i: "2025-10-08", t: "2025-11-12", d: 150, co: ["corp"] }],
    ["udec", "Biobío", "rys", "char", "Charla de prácticas y memorias UdeC", "Atracción de talento", 3, { c: 2, a: "no", i: "2025-09-03", t: "2025-10-15", d: 170, co: ["corp"], n: "Asistieron muy pocas personas; la fecha chocó con pruebas." }],
    ["uls", "Coquimbo", "rys", "char", "Meet the Office La Serena", "Marca empleadora", 3, { c: 4, a: "si", i: "2026-05-06", t: "2026-05-27", d: 150, co: ["mlp"] }],
    ["uch", "Santiago", "rys", "char", "Meet the Office", "Marca empleadora", 2, { i: "2026-05-12", d: 75, co: ["corp"], n: "Sin respuesta de la universidad desde agosto." }],
    ["usach", "Santiago", "rys", "char", "Charla de prácticas y memorias USACH", "Atracción de talento", 1, { i: "2026-10-01", d: 22, co: ["corp"] }],
    ["pucv", "Valparaíso", "rys", "char", "Feria de empleo PUCV", "Marca empleadora", 0, { d: 12, co: ["corp"], n: "Falta confirmar fecha y cupos del stand." }],

    // Aprendizaje y academia
    ["puc", "Santiago", "aya", "acad", "Capstone Ingeniería PUC", "Formación", 2, { k: 1, f: "Sin aporte monetario", i: "2026-08-24", d: 9, r: "Matías", co: ["corp"] }],
    ["ucn", "Coquimbo", "aya", "acad", "Capstone Ingeniería UCN", "Formación", 3, { c: 5, a: "si", f: "Sin aporte monetario", i: "2026-03-09", t: "2026-07-17", d: 100, r: "Matías", co: ["mlp"] }],
    ["uai", "Santiago", "aya", "prog", "Diplomado Jóvenes Profesionales", "Desarrollo de talento", 2, { f: "Financiado por AMSA", i: "2026-06-01", d: 14, r: "Matías", co: ["corp"] }],
    ["inacap", "Nacional", "aya", "prog", "Pasantía docente INACAP", "Formación", 3, { i: "2026-03-02", t: "2026-07-31", d: 95, r: "Matías", co: ["corp"] }],
    ["duoc", "Nacional", "aya", "prog", "Pasantía docente Duoc UC", "Formación", 1, { i: "2026-10-12", d: 18, r: "Matías", co: ["corp"] }],

    // Inclusión y empleo
    ["puc", "Santiago", "iye", "prog", "Mentoring a ingenieras", "Diversidad e inclusión", 2, { f: "Sin aporte monetario", i: "2026-05-04", d: 8, co: ["corp"] }],
    ["udec", "Biobío", "iye", "prog", "Beca Mujeres en Minería", "Diversidad e inclusión", 3, { c: 4, a: "si", f: "Financiado por AMSA", i: "2026-01-12", t: "2026-08-14", d: 80, co: ["corp"] }],

    // Asuntos Públicos Norte y MLP
    ["ucn", "Antofagasta", "rin", "conv", "Convenio marco UCN 2026-2027", "Por definir", 2, { f: "Sin aporte monetario", i: "2026-04-01", d: 20 }],
    ["ua", "Antofagasta", "rin", "conv", "Convenio marco con la U. de Antofagasta", "Por definir", 0, { d: 6, nk: true, r: "Equipo Relaciones institucionales (norte)" }],
    ["ucn", "Antofagasta", "rin", "cons", "Directorio Escuela de Negocios Mineros", "Empleo y proveedores", 2, { k: { nombre: "Ivo Fadic", cargo: "Escuela de Negocios Mineros", correo: "ifadic@ucn.ejemplo.cl", telefono: "+56 9 5374 2822" }, i: "2026-02-10", d: 45, n: "Confirmar la participación de AMSA en el directorio." }],
    ["ucn", "Antofagasta", "iln", "emp", "Plataforma Empleo Región", "Empleo y proveedores", 2, { c: 4, a: "si", i: "2026-01-20", d: 11 }],
    ["ucn", "Antofagasta", "iln", "prog", "Programa Proveedores para un futuro mejor", "Empleo y proveedores", 3, { c: 4, a: "parcial", f: "Mixto", i: "2025-08-18", t: "2026-03-20", d: 200 }],
    ["ceduc", "Antofagasta", "iln", "emp", "Pre contratos oficios mineros (aprendices)", "Empleo y proveedores", 1, { i: "2026-09-21", d: 16, co: ["ant"] }],
    ["ceduc", "Los Vilos", "rimlp", "conv", "Acuerdo de colaboración CEDUC UCN Los Vilos", "Formación", 2, { c: 3, a: "parcial", i: "2026-02-02", d: 52, n: "En evaluación la continuidad del acuerdo." }],
    ["ucn", "Antofagasta", "rin", "inn", "Proyecto de relaves con la UCN", "Vinculación sectorial", 2, { f: "Fondo externo (CORFO, ANID u otro)", i: "2026-07-06", d: 7, co: ["cen"], al: "Prueba piloto de recuperación de agua en relaves, con tesistas de la UCN." }],
    ["uls", "Coquimbo", "doc", "char", "Sesión de relaves La Serena", "Vinculación sectorial", 3, { c: 3, a: "parcial", i: "2026-06-09", t: "2026-06-10", d: 130, co: ["mlp"] }]
  ]
};

// Estudiantes en práctica o memoria hoy. La nota la pone la o el tutor al terminar.
SEED.estudiantes = [
  { nombre: "Camila Rojas", tipo: "Memoria", contraparte: "ucn", area: "rys", compania: "cen", nota: null },
  { nombre: "Sofía Pizarro", tipo: "Práctica de verano", contraparte: "ucn", area: "rys", compania: "cen", nota: 6.5 },
  { nombre: "Martín Araya", tipo: "Práctica profesional", contraparte: "ua", area: "rys", compania: "ant", nota: 5.8 },
  { nombre: "Fernanda Díaz", tipo: "Memoria", contraparte: "uch", area: "rys", compania: "cen", nota: 6.2 },
  { nombre: "Benjamín Rojas", tipo: "Memoria", contraparte: "puc", area: "aya", compania: "corp", nota: 6.8 },
  { nombre: "Antonia Vega", tipo: "Práctica de verano", contraparte: "ucn", area: "rimlp", compania: "mlp", nota: null },
  { nombre: "Joaquín Torres", tipo: "Memoria", contraparte: "uch", area: "doc", compania: "corp", nota: 5.5 },
  { nombre: "Isidora Campos", tipo: "Práctica profesional", contraparte: "udec", area: "iye", compania: "corp", nota: 6.0 }
];

const META_DE_TEMA = { "Atracción de talento": "Atracción de talento", "Marca empleadora": "Marca empleadora", "Vinculación sectorial": "Innovación con la academia", "Formación": "Formación de talento", "Desarrollo de talento": "Formación de talento", "Diversidad e inclusión": "Mujeres en minería", "Empleo y proveedores": "Empleo local" };

// Compañía de cada vínculo: asignación propuesta para la demo (el mapeo no la trae).
function companiaDe(area, sede, i) {
  if (["apmlp", "ilmlp", "rimlp"].includes(area) || ["Los Vilos", "Coquimbo"].includes(sede)) return "mlp";
  if (["apn", "iln", "rin"].includes(area)) return ["cen", "ant", "zal"][i % 3];
  return "corp";
}

// Varias compañías para los vínculos del norte que comparten las tres operaciones.
const VARIAS_COMP = ["Plataforma Empleo Región", "Programa Proveedores para un futuro mejor", "Consejo Regional Productivo"];
const FIN_SEMILLA = { "Sin aporte monetario": "Sin costo", "Financiado por AMSA": "Presupuesto del área", "Mixto": "Mixto" };

function construirVinculosSemilla(areas, tipos) {
  const nombreArea = id => (areas.find(a => a.id === id) || {}).nombre || "";
  return SEED.filas.map((f, i) => {
    const [contraparte, sede, area, tipo, nombre, tema, etapa, x] = f;
    const t = tipos.find(t => t.id === tipo);
    const total = t ? t.hitos.length : 0;
    const hechos = x.h != null ? x.h : etapa === 3 ? total : etapa === 2 ? Math.ceil(total / 2) : etapa === 1 ? 1 : 0;
    const [objetivo] = SEED.temas[tema] || [""];
    const meta = META_DE_TEMA[tema];
    const comp = companiaDe(area, sede, i);
    const cpo = SEED.contrapartes.find(c => c.id === contraparte) || { contactos: [] };
    const kBase = x.nk ? {} : typeof x.k === "number" ? cpo.contactos[x.k] : x.k || cpo.contactos[0] || {};
    // Si el vínculo tiene calificación de ejemplo, cada criterio parte con esa nota (±1 para que no sean todas iguales).
    const crit = {};
    if (x.c && t && t.criterios) t.criterios.forEach((c, j) => { crit[c] = Math.max(1, Math.min(5, x.c + [0, 1, -1][j % 3] * (x.c === 5 || x.c === 1 ? 0 : 1) * (i % 2))); });
    return {
      id: i + 1,
      nombre, contraparte, sede, area, tipo, etapa, tema,
      companias: VARIAS_COMP.includes(nombre) ? ["cen", "ant", "zal"] : (x.co || [comp]),
      contacto: Object.assign({ nombre: "", cargo: "", correo: "", telefono: "" }, kBase),
      lider: x.l || "", responsable: x.r || (area === "rys" ? "Eduardo" : "Equipo " + nombreArea(area)),
      objetivo, metas: meta ? [meta] : [], alcance: x.al || "",
      financiamiento: { tipo: FIN_SEMILLA[x.f] || "No definido", monto: "", fuente: "" },
      // Fechas de ejemplo repartidas para poder ordenar por fecha.
      inicio: x.i || "",
      termino: x.t || "",
      hitos: (t ? t.hitos : []).map((h, j) => ({ t: h, ok: j < hechos })),
      comentarios: x.n || "",
      criterios: crit, calif: x.c ? +(Object.values(crit).reduce((a, b) => a + b, 0) / Object.values(crit).length).toFixed(1) : null, aporta: x.a || null,
      // Fecha del último cambio, relativa a hoy, para que el semáforo de salud tenga los tres colores.
      versiones: [{ v: 1, fecha: new Date(Date.now() - (x.d != null ? x.d : 10) * 86400000).toISOString().slice(0, 10), autor: "Equipo del vínculo", resumen: "Registro inicial del vínculo." }],
      reuniones: [], cuestionarios: []
    };
  });
}
