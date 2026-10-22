/* Datos de partida, tomados del "Mapeo instituciones formativas ANF - COQ".
   La subárea de cada actividad de VP Personas es una asignación propuesta
   (el mapeo solo indica la VP). Calificaciones, financiamiento y avances
   son DATOS DE EJEMPLO para la demo. */

const SEED = {
  contrapartes: [
    { id: "ucn",    nombre: "Universidad Católica del Norte", corto: "UCN", tipoOrg: "Universidad", locacion: "Antofagasta y Coquimbo", zona: "Norte", contactos: [{ nombre: "Paula Herrera", cargo: "Vinculación con el medio", correo: "pherrera@ucn.ejemplo.cl", telefono: "+56 9 5237 2511" }, { nombre: "Ivo Fadic", cargo: "Escuela de Negocios Mineros", correo: "ifadic@ucn.ejemplo.cl", telefono: "+56 9 5374 2822" }, { nombre: "Rodrigo Castillo", cargo: "Jefe de carrera, Ingeniería Civil de Minas", correo: "rcastillo@ucn.ejemplo.cl", telefono: "+56 9 5511 3133" }] },
    { id: "ceduc",  nombre: "CEDUC UCN", corto: "CEDUC UCN", tipoOrg: "Centro de formación técnica", locacion: "Antofagasta y Los Vilos", zona: "Norte", contactos: [{ nombre: "Andrea Rivera", cargo: "Dirección de sede Los Vilos", correo: "arivera@ceduc.ejemplo.cl", telefono: "+56 9 5648 3444" }] },
    { id: "ua",     nombre: "Universidad de Antofagasta", corto: "U. de Antofagasta", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [{ nombre: "Felipe Ortiz", cargo: "Vinculación con el medio", correo: "fortiz@uantof.ejemplo.cl", telefono: "+56 9 5785 3755" }] },
    { id: "ust",    nombre: "Universidad Santo Tomás", corto: "U. Santo Tomás", tipoOrg: "Universidad", locacion: "Antofagasta", zona: "Norte", contactos: [] },
    { id: "ceim",   nombre: "Centro de Entrenamiento Industrial y Minero (CEIM)", corto: "CEIM", tipoOrg: "OTEC", locacion: "Antofagasta", zona: "Norte", contactos: [] },
    { id: "inacap", nombre: "INACAP", corto: "INACAP", tipoOrg: "Instituto profesional", locacion: "Nacional", zona: "Nacional", contactos: [{ nombre: "Marcelo Pizarro", cargo: "Vicerrectoría INACAP", correo: "mpizarro@inacap.ejemplo.cl", telefono: "+56 9 5922 4066" }] },
    { id: "duoc",   nombre: "Duoc UC", corto: "Duoc UC", tipoOrg: "Instituto profesional", locacion: "Nacional", zona: "Nacional", contactos: [] },
    { id: "uch",    nombre: "Universidad de Chile", corto: "U. de Chile", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [{ nombre: "Carla Núñez", cargo: "Unidad de empleabilidad, FCFM", correo: "cnunez@uchile.ejemplo.cl", telefono: "+56 9 6059 4377" }] },
    { id: "puc",    nombre: "Pontificia Universidad Católica de Chile", corto: "PUC", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [{ nombre: "Josefina Larraín", cargo: "Coordinación de prácticas, Ingeniería", correo: "practicas@ing.ejemplo.cl", telefono: "+56 9 6196 4688" }, { nombre: "Tomás Vial", cargo: "Profesor Capstone, Ingeniería", correo: "tvial@ing.ejemplo.cl", telefono: "+56 9 6333 4999" }] },
    { id: "usach",  nombre: "Universidad de Santiago de Chile", corto: "USACH", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [] },
    { id: "utfsm",  nombre: "Universidad Técnica Federico Santa María", corto: "UTFSM", tipoOrg: "Universidad", locacion: "Santiago y Valparaíso", zona: "Centro", contactos: [] },
    { id: "pucv",   nombre: "Pontificia Universidad Católica de Valparaíso", corto: "PUCV", tipoOrg: "Universidad", locacion: "Valparaíso", zona: "Centro", contactos: [] },
    { id: "uai",    nombre: "Universidad Adolfo Ibáñez", corto: "UAI", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [] },
    { id: "udd",    nombre: "Universidad del Desarrollo", corto: "UDD", tipoOrg: "Universidad", locacion: "Santiago", zona: "Centro", contactos: [] },
    { id: "udec",   nombre: "Universidad de Concepción", corto: "UdeC", tipoOrg: "Universidad", locacion: "Biobío", zona: "Sur", contactos: [] },
    { id: "uls",    nombre: "Universidad de La Serena", corto: "U. de La Serena", tipoOrg: "Universidad", locacion: "Coquimbo", zona: "Norte", contactos: [] }
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
     extras: c = calificación, a = ¿aportó a la meta? (si | parcial | no),
             h = hitos completados, f = financiamiento, k = contacto, n = comentarios */
  filas: [
    // VP Asuntos Corporativos · Asuntos Públicos Norte
    ["ucn", "Antofagasta", "rin", "conv", "Convenio marco 2026-2027", "Por definir", 2, { k: { cargo: "Vinculación con el medio" }, f: "Sin aporte monetario" }],
    ["ucn", "Antofagasta", "rin", "conv", "Convenio de colaboración Antofagasta Minerals", "Por definir", 2, { k: { cargo: "Vinculación con el medio" } }],
    ["ucn", "Antofagasta", "iln", "emp", "Plataforma Empleo Región", "Empleo y proveedores", 2, { k: { cargo: "IDEAR" }, c: 4, a: "si" }],
    ["ucn", "Antofagasta", "iln", "prog", "Programa Proveedores para un futuro mejor", "Empleo y proveedores", 2, { k: { cargo: "Escuela de Negocios Mineros" }, f: "Mixto", c: 4, a: "parcial" }],
    ["ucn", "Antofagasta", "rin", "cons", "Directorio Escuela de Negocios Mineros", "Empleo y proveedores", 0, { k: { nombre: "Ivo Fadic", cargo: "Escuela de Negocios Mineros" }, n: "Confirmar la participación de AMSA en el directorio." }],
    ["ceduc", "Antofagasta", "rin", "cons", "Consejo consultivo", "Por definir", 0, { n: "Confirmar vigencia de la participación." }],
    ["ceduc", "Antofagasta", "iln", "emp", "Pre contratos oficios mineros (aprendices)", "Empleo y proveedores", 0, {}],
    ["ua", "Antofagasta", "rin", "cons", "Consejo consultivo", "Por definir", 0, {}],
    ["ua", "Antofagasta", "rin", "conv", "Convenio marco de vinculación con el medio", "Por definir", 0, {}],
    ["ust", "Antofagasta", "rin", "char", "Participación en seminario y actividades de vinculación", "Por definir", 0, { n: "Responder la solicitud de la universidad." }],
    ["ceim", "Antofagasta", "iln", "emp", "Pre contratos oficios mineros (aprendices)", "Empleo y proveedores", 0, {}],
    ["inacap", "Antofagasta", "rin", "cons", "Consejo Regional Productivo", "Formación", 2, { k: { cargo: "Vicerrectoría INACAP" } }],
    ["inacap", "Antofagasta", "iln", "emp", "Pre contratos oficios mineros (aprendices)", "Empleo y proveedores", 1, { k: { cargo: "Vicerrectoría INACAP" } }],
    // VP Asuntos Corporativos · Asuntos Públicos MLP
    ["ceduc", "Los Vilos", "rimlp", "conv", "Acuerdo de colaboración CEDUC UCN Los Vilos", "Formación", 2, { n: "En evaluación la continuidad del acuerdo.", c: 3, a: "parcial" }],

    // VP Personas y Organización · Reclutamiento y selección
    ["uch", "Santiago", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 4, a: "si", f: "Sin aporte monetario" }],
    ["puc", "Santiago", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 5, a: "si", f: "Sin aporte monetario", k: { nombre: "Josefina Larraín", cargo: "Coordinación de prácticas, Ingeniería", correo: "practicas@ing.ejemplo.cl", telefono: "+56 9 6470 5310" } }],
    ["usach", "Santiago", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 3, a: "parcial" }],
    ["utfsm", "Santiago", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 4, a: "si" }],
    ["utfsm", "Valparaíso", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 2, {}],
    ["pucv", "Valparaíso", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 2, a: "no" }],
    ["ucn", "Antofagasta", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 4, a: "si" }],
    ["ucn", "Coquimbo", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 2, {}],
    ["uai", "Santiago", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 1, {}],
    ["udec", "Biobío", "rys", "char", "Charla JP, prácticas y memorias", "Atracción de talento", 3, { c: 3, a: "parcial" }],
    ["uch", "Santiago", "rys", "char", "Meet the Office", "Marca empleadora", 3, { c: 4, a: "parcial" }],
    ["usach", "Santiago", "rys", "char", "Meet the Office", "Marca empleadora", 2, {}],
    ["udd", "Santiago", "rys", "char", "Meet the Office", "Marca empleadora", 3, { c: 2, a: "no" }],
    ["ucn", "Antofagasta", "rys", "tal", "Búsqueda y difusión de memoristas", "Atracción de talento", 2, { n: "Definir temas de memoria con las gerencias de operación." }],

    // VP Personas · Desarrollo Organizacional (sin subárea asignada)
    ["uch", "Santiago", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, { c: 3, a: "parcial" }],
    ["usach", "Santiago", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, {}],
    ["ucn", "Antofagasta", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, {}],
    ["ucn", "Coquimbo", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, {}],
    ["uls", "Coquimbo", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, {}],
    ["ua", "Antofagasta", "doc", "char", "Invitación sesión de Relaves", "Vinculación sectorial", 3, {}],

    // VP Personas · Aprendizaje y academia
    ["puc", "Santiago", "aya", "acad", "Capstone Ingeniería – GIO MLP", "Formación", 3, { c: 5, a: "si", f: "Sin aporte monetario" }],
    ["puc", "Santiago", "aya", "acad", "Capstone Ingeniería – VPPO", "Formación", 2, { f: "Sin aporte monetario" }],
    ["ucn", "Coquimbo", "aya", "acad", "Capstone Ingeniería – MLP", "Formación", 2, {}],
    ["uai", "Santiago", "aya", "prog", "Diplomado Jóvenes Profesionales", "Desarrollo de talento", 2, { f: "Financiado por AMSA" }],
    ["inacap", "Nacional", "aya", "prog", "Pasantía docente", "Formación", 3, { c: 4, a: "si" }],
    ["duoc", "Nacional", "aya", "prog", "Pasantía docente", "Formación", 2, {}],
    ["inacap", "Nacional", "aya", "cons", "Participación en el consejo sectorial", "Formación", 2, {}],

    // VP Personas · Inclusión y empleo
    ["puc", "Santiago", "iye", "prog", "Mentoring a ingenieras", "Diversidad e inclusión", 2, { f: "Sin aporte monetario" }]
  ]
};

// Estudiantes en práctica o memoria hoy (DATOS DE EJEMPLO). La nota la pone la o el tutor al terminar.
SEED.estudiantes = [
  { nombre: "Ignacia Soto", tipo: "Memoria", contraparte: "ucn", area: "rys", compania: "cen", nota: 6.5 },
  { nombre: "Martín Araya", tipo: "Práctica profesional", contraparte: "ua", area: "iln", compania: "cen", nota: 5.8 },
  { nombre: "Fernanda Díaz", tipo: "Práctica profesional", contraparte: "uch", area: "aya", compania: "corp", nota: 6.2 },
  { nombre: "Benjamín Rojas", tipo: "Memoria", contraparte: "puc", area: "aya", compania: "corp", nota: 6.8 },
  { nombre: "Antonia Vega", tipo: "Práctica de verano", contraparte: "ucn", area: "rimlp", compania: "mlp", nota: null },
  { nombre: "Joaquín Torres", tipo: "Memoria", contraparte: "usach", area: "doc", compania: "corp", nota: 5.5 }
];

// Meta sugerida según la temática del mapeo.
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
      lider: "", responsable: area === "rys" ? "Eduardo" : "Equipo " + nombreArea(area),
      objetivo, metas: meta ? [meta] : [], alcance: "",
      financiamiento: { tipo: FIN_SEMILLA[x.f] || "No definido", monto: "", fuente: "" },
      inicio: etapa >= 2 ? "2026-03-01" : "", termino: etapa === 3 ? "2026-08-31" : "",
      hitos: (t ? t.hitos : []).map((h, j) => ({ t: h, ok: j < hechos })),
      comentarios: x.n || "",
      criterios: crit, calif: x.c ? +(Object.values(crit).reduce((a, b) => a + b, 0) / Object.values(crit).length).toFixed(1) : null, aporta: x.a || null,
      versiones: [{ v: 1, fecha: "2026-09-15", autor: "Mapeo ANF-COQ", resumen: "Registro inicial importado desde el mapeo de instituciones formativas." }],
      reuniones: [], cuestionarios: []
    };
  });
}
