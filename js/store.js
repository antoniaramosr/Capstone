/* Estado de la aplicación. Se guarda en el navegador (localStorage), así que cada
   persona ve sus propios cambios. Para que el equipo comparta datos de verdad,
   el siguiente paso sería un servidor o base de datos. */

const STORE_KEY = "vinculos-amsa-v2";
const SESSION_KEY = "vinculos-amsa-sesion";

function estadoInicial() {
  const areas = JSON.parse(JSON.stringify(CONFIG.areas));
  const tipos = JSON.parse(JSON.stringify(CONFIG.tipos));
  const vinculos = construirVinculosSemilla(areas, tipos);
  // Ejemplo de historial: una reunión y un cuestionario respondido.
  const ej = vinculos.find(v => v.contraparte === "puc" && v.tipo === "char");
  if (ej) {
    ej.reuniones.push({ fecha: "2026-09-02", fuente: "Notas de reunión", resumen: "Se evaluó la charla de agosto: asistieron 85 estudiantes y 22 postularon a prácticas. La universidad pide repetirla en marzo y sumar a ex alumnos de AMSA como expositores." });
    ej.versiones.push({ v: 2, fecha: "2026-09-02", autor: "Asistente (revisado por Eduardo)", resumen: "Actualizado con la reunión de evaluación: resultados de asistencia y próximos pasos." });
    ej.proximos = "Agendar la charla de marzo y confirmar dos ex alumnos expositores.";
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
    pasantes: JSON.parse(JSON.stringify(SEED.pasantes)),
    leidos: [],
    nextId: vinculos.length + 1
  };
}

// Preguntas que siempre van en el cuestionario a la contraparte.
const PREGUNTAS_BASE = [
  { texto: "Del 1 al 5, ¿qué tan satisfecha/o está con la colaboración con AMSA?", tipo: "escala" },
  { texto: "¿Se están cumpliendo los objetivos que acordamos?", tipo: "opciones", opciones: ["Sí", "Parcialmente", "No"] },
  { texto: "Del 1 al 5, ¿cómo evalúa la comunicación con el equipo de AMSA?", tipo: "escala" },
  { texto: "¿Qué necesita de AMSA para avanzar?", tipo: "abierta" },
  { texto: "¿Sus datos de contacto siguen vigentes? ¿Hay otra persona que debamos incluir?", tipo: "abierta" },
  { texto: "¿Le interesa continuar o ampliar este vínculo?", tipo: "opciones", opciones: ["Sí", "Tal vez", "No"] }
];

let S = cargar();
let ME = cargarSesion();

function cargar() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sin almacenamiento: se usa el estado inicial */ }
  return estadoInicial();
}
function guardar() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ }
}
function restablecer() { S = estadoInicial(); guardar(); }
function cargarSesion() {
  try { const id = localStorage.getItem(SESSION_KEY); return id ? CONFIG.usuarios[id] || null : null; } catch (e) { return null; }
}
function iniciarSesion(id) { ME = CONFIG.usuarios[id]; try { localStorage.setItem(SESSION_KEY, id); } catch (e) {} }
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
const puedeEditar = v => ME && (ME.admin || descendientes(ME.area).includes(v.area));
const areasPermitidas = () => ME.admin ? S.areas : S.areas.filter(a => descendientes(ME.area).includes(a.id));

function progreso(v) { if (!v.hitos.length) return 0; return Math.round(v.hitos.filter(h => h.ok).length / v.hitos.length * 100); }

// Qué tan completo está el README.
const CAMPOS_README = [
  ["objetivo", "Objetivo", v => v.objetivo],
  ["meta", "Meta o para qué sirve", v => v.meta],
  ["alcance", "Alcance", v => v.alcance],
  ["contacto", "Contacto en la contraparte", v => v.contacto.nombre || v.contacto.correo],
  ["responsable", "Responsable en AMSA", v => v.responsable],
  ["financiamiento", "Financiamiento", v => v.financiamiento.tipo && v.financiamiento.tipo !== "Por definir"],
  ["fechas", "Fechas", v => v.inicio],
  ["hitos", "Plan de trabajo", v => v.hitos.length],
  ["siguiente", "Necesidades o próximos pasos", v => v.necesidades || v.proximos]
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

// Genera el README en Markdown para descargar o compartir.
function readmeMarkdown(v) {
  const c = contraparte(v.contraparte);
  const l = [];
  l.push(`# ${v.nombre}`, "");
  l.push(`**Contraparte:** ${c.nombre}${v.sede ? " (" + v.sede + ")" : ""}  `);
  l.push(`**Área AMSA:** ${rutaArea(v.area).map(a => a.nombre).join(" › ")}  `);
  l.push(`**Tipo de vínculo:** ${tipo(v.tipo).nombre}  `);
  l.push(`**Etapa:** ${CONFIG.etapas[v.etapa]} · Progreso ${progreso(v)} %`, "");
  l.push("## Objetivo", v.objetivo || "_Por completar_", "");
  l.push("## Meta: para qué sirve a AMSA", v.meta || "_Por completar_", "");
  l.push("## Alcance", v.alcance || "_Por completar_", "");
  l.push("## Personas", `- Contacto contraparte: ${[v.contacto.nombre, v.contacto.cargo, v.contacto.correo].filter(Boolean).join(", ") || "_Por completar_"}`, `- Responsable en AMSA: ${v.responsable || "_Por completar_"}`, "");
  l.push("## Financiamiento", `${v.financiamiento.tipo}${v.financiamiento.monto ? " · " + v.financiamiento.monto : ""}${v.financiamiento.fuente ? " · Fuente: " + v.financiamiento.fuente : ""}`, "");
  l.push("## Fechas", `Inicio: ${v.inicio ? fechaTxt(v.inicio) : "por definir"} · Término: ${v.termino ? fechaTxt(v.termino) : "por definir"}`, "");
  l.push("## Plan de trabajo", ...v.hitos.map(h => `- [${h.ok ? "x" : " "}] ${h.t}`), "");
  l.push("## Necesidades", v.necesidades || "_Sin registrar_", "");
  l.push("## Próximos pasos", v.proximos || "_Sin registrar_", "");
  l.push("## Evaluación", `Calificación: ${v.calif ? v.calif + " de 5" : "sin calificar"} · ¿Aportó a la meta?: ${{ si: "Sí", parcial: "Parcialmente", no: "No" }[v.aporta] || "sin evaluar"}`, "");
  l.push("## Historial de versiones", ...v.versiones.slice().reverse().map(x => `- v${x.v} (${fechaTxt(x.fecha)}, ${x.autor}): ${x.resumen}`), "");
  return l.join("\n");
}
