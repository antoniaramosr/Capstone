/* Estado de la aplicación. Se guarda en el navegador (localStorage), así que cada
   persona ve sus propios cambios. Para que el equipo comparta datos de verdad,
   el siguiente paso sería un servidor o base de datos. */

/* Tres espacios de datos separados:
   - "ejemplo": los vínculos del mapeo ANF-COQ, para mostrar la página llena.
   - "vacio": página sin vínculos (Perfil 0).
   - "vacio2": otro sandbox vacío independiente (Perfil 2).
   Cambiar de perfil dentro de la página mantiene el espacio en que se entró. */
const STORE_KEYS = { ejemplo: "siva-v4", vacio: "siva-v4-vacio", vacio2: "siva-v4-vacio-2" };
const SESSION_KEY = "siva-sesion";
const ESPACIO_KEY = "siva-espacio";
function esEspacioVacio(esp = ESPACIO) { return esp === "vacio" || esp === "vacio2"; }
let ESPACIO = (() => {
  try {
    const g = localStorage.getItem(ESPACIO_KEY);
    return g && STORE_KEYS[g] ? g : "ejemplo";
  } catch (e) { return "ejemplo"; }
})();

// Página vacía: mantiene la configuración (áreas, tipos, metas, compañías) y la lista
// de instituciones, pero sin vínculos, contactos, convocatorias ni estudiantes.
function estadoVacio() {
  return {
    areas: JSON.parse(JSON.stringify(CONFIG.areas)),
    tipos: JSON.parse(JSON.stringify(CONFIG.tipos)),
    tiposOrg: [...CONFIG.tiposOrg],
    contrapartes: SEED.contrapartes.map(c => Object.assign({}, c, { contactos: [] })),
    vinculos: [],
    companias: JSON.parse(JSON.stringify(CONFIG.companias)),
    metas: CONFIG.metas.map(nombre => ({ nombre, activa: true })),
    estudiantes: [], convocatorias: [], leidos: [], nextId: 1
  };
}

function estadoInicial() {
  const areas = JSON.parse(JSON.stringify(CONFIG.areas));
  const tipos = JSON.parse(JSON.stringify(CONFIG.tipos));
  const vinculos = construirVinculosSemilla(areas, tipos);
  // Ejemplo de historial: una reunión y un cuestionario respondido.
  const ej = vinculos.find(v => v.contraparte === "puc" && v.tipo === "char");
  if (ej) {
    ej.reuniones.push({ fecha: "2026-09-02", fuente: "Notas de reunión", resumen: "Se evaluó la charla de agosto: asistieron 85 estudiantes y 22 postularon a prácticas. La universidad pide repetirla en marzo y sumar a ex alumnos de AMSA como expositores." });
    ej.versiones.push({ v: 2, fecha: "2026-09-02", autor: "Asistente (revisado por Eduardo)", resumen: "Actualizado con la reunión de evaluación: resultados de asistencia y próximos pasos." });
    ej.comentarios = "Agendar la charla de marzo y confirmar dos ex alumnos expositores.";
    ej.cuestionarios.push({
      id: 1, fecha: "2026-09-05", estado: "respondido",
      preguntas: PREGUNTAS_BASE.map(p => p.texto),
      respuestas: ["5", "Sí", "4", "Más anticipación para difundir la charla.", "Sí, siguen vigentes.", "Sí"]
    });
  }
  return {
    areas, tipos,
    tiposOrg: [...CONFIG.tiposOrg],
    contrapartes: JSON.parse(JSON.stringify(SEED.contrapartes)),
    vinculos,
    companias: JSON.parse(JSON.stringify(CONFIG.companias)),
    metas: CONFIG.metas.map(nombre => ({ nombre, activa: true })),
    estudiantes: JSON.parse(JSON.stringify(SEED.estudiantes)),
    leidos: [],
    nextId: vinculos.length + 1
  };
}

// Preguntas que siempre van en el cuestionario a la contraparte.
const PREGUNTAS_BASE = [
  { texto: "Del 1 al 5, ¿qué tan satisfecha/o está con la colaboración con Antofagasta Minerals?", tipo: "escala" },
  { texto: "¿Se están cumpliendo los objetivos que acordamos?", tipo: "opciones", opciones: ["Sí", "Parcialmente", "No"] },
  { texto: "Del 1 al 5, ¿cómo evalúa la comunicación con nuestro equipo?", tipo: "escala" },
  { texto: "¿Qué necesita de nosotros para avanzar?", tipo: "abierta" },
  { texto: "¿Sus datos de contacto siguen vigentes? ¿Hay otra persona que debamos incluir?", tipo: "abierta" },
  { texto: "¿Le interesa continuar o ampliar este vínculo?", tipo: "opciones", opciones: ["Sí", "Tal vez", "No"] }
];

let S = cargar();
let ME = cargarSesion();

function cargar() {
  try {
    const raw = localStorage.getItem(STORE_KEYS[ESPACIO]);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sin almacenamiento: se usa el estado inicial */ }
  return esEspacioVacio() ? estadoVacio() : estadoInicial();
}
function guardar() {
  try { localStorage.setItem(STORE_KEYS[ESPACIO], JSON.stringify(S)); } catch (e) { /* ignorar */ }
}
// Vuelve al estado de partida del espacio actual (con ejemplos o vacío).
function restablecer() { S = esEspacioVacio() ? estadoVacio() : estadoInicial(); guardar(); }
// Antes de cada testeo: deja los tres espacios como nuevos.
function restablecerTodo() {
  try { localStorage.removeItem(STORE_KEYS.vacio); localStorage.removeItem(STORE_KEYS.vacio2); } catch (e) {}
  usarEspacio("ejemplo"); S = estadoInicial(); guardar();
}
function usarEspacio(esp) {
  if (esp === ESPACIO) return;
  ESPACIO = esp; try { localStorage.setItem(ESPACIO_KEY, esp); } catch (e) {}
  S = cargar();
}
function cargarSesion() {
  try { const id = localStorage.getItem(SESSION_KEY); return id ? CONFIG.usuarios[id] || null : null; } catch (e) { return null; }
}
// Al entrar desde el inicio de sesión se elige el espacio según la cuenta (Perfil 0 = vacío).
// Al cambiar de perfil dentro de la página se mantiene el espacio actual.
function iniciarSesion(id, mantenerEspacio) {
  ME = CONFIG.usuarios[id];
  if (!mantenerEspacio) usarEspacio(ME.espacio || "ejemplo");
  try { localStorage.setItem(SESSION_KEY, id); } catch (e) {}
}
function cerrarSesion() { ME = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hoy = () => new Date().toISOString().slice(0, 10);
const fechaTxt = f => { if (!f) return ""; const [y, m, d] = f.split("-"); return `${+d} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][+m - 1]} ${y}`; };

const area = id => S.areas.find(a => a.id === id);
const tipo = id => S.tipos.find(t => t.id === id) || { nombre: "Sin tipo", hitos: [] };
const contraparte = id => S.contrapartes.find(c => c.id === id) || { nombre: "Sin contraparte", corto: "?", tipoOrg: "" };
const vinculo = id => S.vinculos.find(v => v.id === id);
const hijos = id => S.areas.filter(a => a.parent === id);
function descendientes(id) { const r = [id]; hijos(id).forEach(h => r.push(...descendientes(h.id))); return r; }
function rutaArea(id) { const r = []; let a = area(id); while (a) { r.unshift(a); a = area(a.parent); } return r; }
const vpDe = id => rutaArea(id)[0];
const nombreArea = id => (area(id) || {}).nombre || "Área eliminada";

const misVinculos = () => ME.admin ? S.vinculos : S.vinculos.filter(v => descendientes(ME.area).includes(v.area));
const puedeEditar = v => ME && (ME.admin || (ME.rol === "gestor" && descendientes(ME.area).includes(v.area)));
const puedeCrear = () => ME && (ME.admin || ME.rol === "gestor");
const compania = id => S.companias.find(c => c.id === id) || { id: "", nombre: "Sin compañía", color: "#999" };
// Un vínculo puede ser de varias compañías y aportar a varias metas.
const compsDe = v => v.companias || (v.compania ? [v.compania] : []);
const metasDe = v => v.metas || (v.meta ? [v.meta] : []);
const compsTxt = ids => ids.length && ids.length === S.companias.length ? "Todas las compañías" : ids.map(id => compania(id).nombre).join(", ");
const metasActivas = () => S.metas.filter(m => m.activa).map(m => m.nombre);
const etapaAyuda = (i, tipoId) => (tipo(tipoId).etapas || CONFIG.etapasAyuda)[i];
const criteriosDe = tipoId => tipo(tipoId).criterios || ["Cumplimiento de lo acordado", "Rapidez de respuesta de la institución", "Calidad del resultado"];
// Calificación del vínculo: promedio de los criterios calificados (1 a 5).
function califDe(crit) { const n = Object.values(crit || {}).filter(x => x); return n.length ? +(n.reduce((a, b) => a + b, 0) / n.length).toFixed(1) : null; }
// Contactos conocidos de una institución: los registrados en ella y los de sus vínculos.
function contactosDe(cpId) {
  const c = S.contrapartes.find(x => x.id === cpId); if (!c) return [];
  const todos = [...(c.contactos || []), ...S.vinculos.filter(v => v.contraparte === cpId).map(v => v.contacto)];
  const vistos = new Set();
  return todos.filter(k => k && k.nombre && !vistos.has(k.nombre.toLowerCase()) && vistos.add(k.nombre.toLowerCase()));
}
const areasPermitidas = () => ME.admin ? S.areas : S.areas.filter(a => descendientes(ME.area).includes(a.id));

function progreso(v) { if (!v.hitos.length) return 0; return Math.round(v.hitos.filter(h => h.ok).length / v.hitos.length * 100); }

// Qué tan completa está la ficha del vínculo.
const CAMPOS_README = [
  ["objetivo", "Objetivo", v => v.objetivo],
  ["meta", "Metas a las que busca aportar", v => metasDe(v).length],
  ["alcance", "Alcance", v => v.alcance],
  ["contacto", "Contacto en la institución", v => v.contacto.nombre || v.contacto.correo],
  ["responsable", "Encargado/a", v => v.responsable],
  ["financiamiento", "Financiamiento", v => v.financiamiento.tipo && v.financiamiento.tipo !== "No definido"],
  ["fechas", "Fechas", v => v.inicio],
  ["hitos", "Plan de trabajo", v => v.hitos.length]
];
function completitud(v) {
  const faltan = CAMPOS_README.filter(c => !c[2](v)).map(c => c[1]);
  return { pct: Math.round((CAMPOS_README.length - faltan.length) / CAMPOS_README.length * 100), faltan };
}

function promedio(lista) { const c = lista.filter(v => v.calif); return c.length ? c.reduce((s, v) => s + v.calif, 0) / c.length : null; }
const num1 = n => n == null ? "–" : n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

function nuevaVersion(v, autor, resumen) {
  const n = (v.versiones[v.versiones.length - 1] || { v: 0 }).v + 1;
  v.versiones.push({ v: n, fecha: hoy(), autor, resumen });
}

// Genera la ficha en Markdown para descargar o compartir.
function readmeMarkdown(v) {
  const c = contraparte(v.contraparte);
  const l = [];
  l.push(`# ${v.nombre}`, "");
  l.push(`**Institución:** ${c.nombre}${v.sede ? " (" + v.sede + ")" : ""}  `);
  l.push(`**Compañía:** ${compsTxt(compsDe(v)) || "No definida"}  `);
  l.push(`**Área responsable:** ${rutaArea(v.area).map(a => a.nombre).join(" › ")}  `);
  l.push(`**Tipo de vínculo:** ${tipo(v.tipo).nombre}  `);
  l.push(`**Etapa:** ${CONFIG.etapas[v.etapa]} · Progreso ${progreso(v)} %`, "");
  l.push("## Objetivo", v.objetivo || "_No definido_", "");
  l.push("## Metas a las que busca aportar", metasDe(v).map(m => "- " + m).join("\n") || "_No definidas_", "");
  l.push("## Alcance", v.alcance || "_No definido_", "");
  l.push("## Personas", `- Contacto en la institución: ${[v.contacto.nombre, v.contacto.cargo, v.contacto.correo].filter(Boolean).join(", ") || "_No definido_"}`, `- Líder de la iniciativa: ${v.lider || "_No definido_"}`, `- Encargado/a: ${v.responsable || "_No definido_"}`, "");
  l.push("## Financiamiento", `${v.financiamiento.tipo}${v.financiamiento.monto ? " · Monto aproximado: " + v.financiamiento.monto : ""}${v.financiamiento.fuente ? " · " + v.financiamiento.fuente : ""}`, "");
  l.push("## Fechas", `Inicio: ${v.inicio ? fechaTxt(v.inicio) : "por definir"} · Término: ${v.termino ? fechaTxt(v.termino) : "por definir"}`, "");
  l.push("## Plan de trabajo", ...v.hitos.map(h => `- [${h.ok ? "x" : " "}] ${h.t}`), "");
  l.push("## Comentarios adicionales", v.comentarios || "_Sin comentarios_", "");
  l.push("## Evaluación", `Calificación: ${v.calif ? v.calif + " de 5 (promedio de los criterios)" : "sin calificar"} · ¿Aportó a las metas?: ${{ si: "Sí", parcial: "Parcialmente", no: "No" }[v.aporta] || "sin evaluar"}`, ...Object.entries(v.criterios || {}).map(([k, n]) => `- ${k}: ${n} de 5`), "");
  l.push("## Historial de cambios", ...v.versiones.slice().reverse().map(x => `- v${x.v} (${fechaTxt(x.fecha)}, ${x.autor}): ${x.resumen}`), "");
  return l.join("\n");
}
