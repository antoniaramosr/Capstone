/* Datos de partida de la rama "nuevo": un set corto y coherente, armado a mano para probar.
   Son ficticios, salvo los correos con "+" de la cuenta de prueba (llegan a la bandeja de Antonia),
   para poder abrir Outlook y recibir de verdad los correos. El detalle de quién es cada persona
   y para qué sirve está en el README. */

const CORREO_PRUEBA = (alias) => "antonia.sramosrodriguez+" + alias + "@gmail.com";

const SEED = {
  contrapartes: [
    { id: "ucn",    nombre: "Universidad Católica del Norte", corto: "UCN", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [
      { nombre: "Paula Herrera", cargo: "Vinculación con el medio", correo: CORREO_PRUEBA("ucn"), telefono: "+56 9 5237 2511" },
      { nombre: "Rodrigo Castillo", cargo: "Jefe de carrera, Ingeniería Civil de Minas", correo: "rcastillo@ucn.ejemplo.cl", telefono: "+56 9 5511 3133" }] },
    { id: "ua",     nombre: "Universidad de Antofagasta", corto: "U. de Antofagasta", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [
      { nombre: "Felipe Ortiz", cargo: "Vinculación con el medio", correo: "fortiz@uantof.ejemplo.cl", telefono: "+56 9 5785 3755" }] },
    { id: "uch",    nombre: "Universidad de Chile", corto: "U. de Chile", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Carla Núñez", cargo: "Unidad de empleabilidad, FCFM", correo: "cnunez@uchile.ejemplo.cl", telefono: "+56 9 5120 4418" }] },
    { id: "puc",    nombre: "Pontificia Universidad Católica de Chile", corto: "PUC", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Josefina Larraín", cargo: "Coordinación de prácticas, Ingeniería", correo: CORREO_PRUEBA("puc"), telefono: "+56 9 6470 5310" },
      { nombre: "Tomás Vial", cargo: "Profesor Capstone, Ingeniería", correo: "tvial@ing.ejemplo.cl", telefono: "+56 9 6333 4999" }] },
    { id: "usach",  nombre: "Universidad de Santiago de Chile", corto: "USACH", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [
      { nombre: "Marcela Bravo", cargo: "Centro de empleabilidad", correo: "mbravo@usach.ejemplo.cl", telefono: "+56 9 5902 7731" }] },
    { id: "utfsm",  nombre: "Universidad Técnica Federico Santa María", corto: "UTFSM", tipoOrg: "Universidad", locacion: "Santiago y Valparaíso", zona: "Centro", contactos: [
      { nombre: "Ignacio Ramírez", cargo: "Dirección de vinculación", correo: "iramirez@usm.ejemplo.cl", telefono: "+56 9 5440 1288" }] },
    { id: "inacap", nombre: "INACAP", corto: "INACAP", tipoOrg: "Instituto profesional", locacion: "Nacional", zona: "Nacional", contactos: [
      { nombre: "Marcelo Pizarro", cargo: "Vicerrectoría INACAP", correo: "mpizarro@inacap.ejemplo.cl", telefono: "+56 9 5920 6150" }] }
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
             k = contacto del vínculo, n = comentarios, i = inicio, t = término,
             d = días desde el último movimiento, r = responsable, al = alcance */
  filas: [
    // Equipo de Eduardo (Reclutamiento y selección)
    ["ucn", "Antofagasta", "rys", "tal", "Memorias y prácticas UCN", "Atracción de talento", 2,
      { k: { nombre: "Paula Herrera", cargo: "Vinculación con el medio", correo: CORREO_PRUEBA("ucn"), telefono: "+56 9 5237 2511" }, f: "Sin aporte monetario", i: "2026-08-10", d: 4, al: "Dos convocatorias al año (memorias y práctica de verano) para Ingeniería Civil de Minas, Industrial y Geología.", n: "Definir temas de memoria con las gerencias de operación." }],
    ["puc", "Santiago", "rys", "char", "Charla de prácticas y memorias PUC", "Atracción de talento", 3,
      { k: { nombre: "Josefina Larraín", cargo: "Coordinación de prácticas, Ingeniería", correo: CORREO_PRUEBA("puc"), telefono: "+56 9 6470 5310" }, c: 5, a: "si", f: "Sin aporte monetario", i: "2026-04-25", t: "2026-08-28", d: 60 }],
    ["uch", "Santiago", "rys", "char", "Meet the Office", "Marca empleadora", 2,
      { k: { nombre: "Carla Núñez", cargo: "Unidad de empleabilidad, FCFM", correo: "cnunez@uchile.ejemplo.cl", telefono: "+56 9 5120 4418" }, i: "2026-05-12", d: 75, n: "Sin respuesta de la universidad desde agosto." }],
    ["usach", "Santiago", "rys", "char", "Charla de prácticas y memorias USACH", "Atracción de talento", 1,
      { k: { nombre: "Marcela Bravo", cargo: "Centro de empleabilidad", correo: "mbravo@usach.ejemplo.cl", telefono: "+56 9 5902 7731" }, i: "2026-10-01", d: 22 }],
    ["utfsm", "Valparaíso", "rys", "char", "Charla de prácticas y memorias UTFSM", "Atracción de talento", 3,
      { k: { nombre: "Ignacio Ramírez", cargo: "Dirección de vinculación", correo: "iramirez@usm.ejemplo.cl", telefono: "+56 9 5440 1288" }, c: 4, a: "si", i: "2026-03-18", t: "2026-06-30", d: 120 }],

    // Aprendizaje y academia
    ["puc", "Santiago", "aya", "acad", "Capstone Ingeniería PUC", "Formación", 2,
      { k: { nombre: "Tomás Vial", cargo: "Profesor Capstone, Ingeniería", correo: "tvial@ing.ejemplo.cl", telefono: "+56 9 6333 4999" }, f: "Sin aporte monetario", i: "2026-08-24", d: 9, r: "Matías" }],
    ["inacap", "Nacional", "aya", "prog", "Pasantía docente INACAP", "Formación", 3,
      { k: { nombre: "Marcelo Pizarro", cargo: "Vicerrectoría INACAP", correo: "mpizarro@inacap.ejemplo.cl", telefono: "+56 9 5920 6150" }, i: "2026-03-02", t: "2026-07-31", d: 95, r: "Matías" }],

    // Asuntos Públicos Norte: vínculo recién abierto y con la ficha a medias, para probar "datos por completar"
    ["ua", "Antofagasta", "rin", "conv", "Convenio marco con la U. de Antofagasta", "Por definir", 0,
      { d: 6, r: "Equipo Relaciones institucionales (norte)" }]
  ]
};

// Estudiantes en práctica o memoria hoy. La nota la pone la o el tutor al terminar.
SEED.estudiantes = [
  { nombre: "Camila Rojas", tipo: "Memoria", contraparte: "ucn", area: "rys", compania: "cen", nota: null },
  { nombre: "Sofía Pizarro", tipo: "Práctica de verano", contraparte: "ucn", area: "rys", compania: "cen", nota: 6.5 },
  { nombre: "Benjamín Rojas", tipo: "Memoria", contraparte: "puc", area: "aya", compania: "corp", nota: 6.8 }
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
    // Si el vínculo tiene calificación de ejemplo, cada criterio parte con esa nota (±1 para que no sean todas iguales).
    const crit = {};
    if (x.c && t && t.criterios) t.criterios.forEach((c, j) => { crit[c] = Math.max(1, Math.min(5, x.c + [0, 1, -1][j % 3] * (x.c === 5 || x.c === 1 ? 0 : 1) * (i % 2))); });
    return {
      id: i + 1,
      nombre, contraparte, sede, area, tipo, etapa, tema,
      companias: VARIAS_COMP.includes(nombre) ? ["cen", "ant", "zal"] : [comp],
      contacto: Object.assign({ nombre: "", cargo: "", correo: "", telefono: "" }, x.k || {}),
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
