/* Asistente. Usa IA de verdad cuando está disponible:
   1) Publicado como artifact en claude.ai (capacidad "sample").
   2) Un servidor propio configurado en CONFIG.aiEndpoint.
   Si no hay ninguno (por ejemplo, abierto desde GitHub Pages), funciona en
   "modo demo": reglas simples sobre el texto, para poder mostrar el flujo. */

const AI = {
  modo: "demo", // "claude" | "servidor" | "demo"
  _sample: null,

  async iniciar() {
    if (CONFIG.aiEndpoint) this.modo = "servidor";
    try {
      if (window.claude && typeof window.claude.use === "function") {
        const s = await window.claude.use("sample");
        if (s) { this._sample = s; this.modo = "claude"; }
      }
    } catch (e) { /* sin IA: modo demo */ }
    document.dispatchEvent(new Event("ai-listo"));
  },

  etiqueta() {
    return { claude: "Con IA (Claude)", servidor: "Con IA (servidor)", demo: "Modo demo, sin IA" }[this.modo];
  },

  async json(prompt, demoFn) {
    if (this.modo === "claude") {
      try { return await this._sample.json(prompt, { modelTier: "default" }); }
      catch (e) {
        if (e && e.code === "not_granted") { this.modo = "demo"; return demoFn(); }
        throw e;
      }
    }
    if (this.modo === "servidor") {
      const r = await fetch(CONFIG.aiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!r.ok) throw new Error("El servidor del asistente respondió con error " + r.status);
      return await r.json();
    }
    await new Promise(r => setTimeout(r, 700));
    return demoFn();
  },

  /* ---------- Actualizar un vínculo con una reunión ---------- */
  async procesarReunion(v, texto) {
    const actual = {
      nombre: v.nombre, contraparte: contraparte(v.contraparte).nombre, tipo: tipo(v.tipo).nombre,
      etapa: CONFIG.etapas[v.etapa], objetivo: v.objetivo, metas: metasDe(v), alcance: v.alcance,
      contacto: v.contacto, responsable: v.responsable, financiamiento: v.financiamiento,
      inicio: v.inicio, termino: v.termino, hitos: v.hitos, comentarios: v.comentarios
    };
    const prompt = `Eres el asistente de una plataforma interna de Antofagasta Minerals (AMSA) que registra sus vínculos con universidades e instituciones. Debes actualizar el README de un vínculo a partir de una reunión con la contraparte.

README actual (JSON):
${JSON.stringify(actual, null, 1)}

Transcripción o notas de la reunión:
"""
${texto.slice(0, 12000)}
"""

Responde SOLO con un objeto JSON, sin texto adicional, con esta forma:
{
 "resumen": "resumen de la reunión en 3 a 5 oraciones, en español",
 "cambios": { "objetivo": "", "alcance": "", "comentarios": "", "contacto_nombre": "", "contacto_cargo": "", "contacto_correo": "", "financiamiento_tipo": "", "financiamiento_monto": "", "inicio": "AAAA-MM-DD", "termino": "AAAA-MM-DD" },
 "hitos_completados": ["texto exacto de hitos existentes que la reunión da por cumplidos"],
 "hitos_nuevos": ["nuevos hitos acordados"],
 "etapa": "una de: ${CONFIG.etapas.join(", ")}; o null si no cambia"
}
Reglas: en "cambios" incluye solo los campos que la reunión realmente agrega o modifica; omite el resto. "financiamiento_tipo" debe ser uno de: ${CONFIG.financiamientos.join(", ")}. Para comentarios, escribe el texto completo actualizado (no solo lo nuevo). Lo que haya que hacer después va como hito nuevo del plan de trabajo. No inventes datos que no estén en la reunión.`;
    const r = await this.json(prompt, () => demoReunion(v, texto));
    return normalizarPropuesta(v, r);
  },

  /* ---------- Preguntas sobre los vínculos ---------- */
  async preguntar(pregunta, historial, vid) {
    const ctx = contextoAsistente(vid);
    const prompt = `Eres el asistente de SIVA, la plataforma interna de Antofagasta Minerals (AMSA) que registra vínculos con universidades e instituciones. Respondes preguntas de quien la usa, SOLO con los datos de abajo. Si el dato no está, dilo sin inventar. Escribe en español de Chile, claro y breve (máximo 6 líneas; si hay una lista, hasta 8 ítems con "- "). Hoy es ${hoy()}.

Datos (JSON). "vinculos" son todos los vínculos visibles; "mios" son los ids de los que lleva la persona que pregunta:
${JSON.stringify(ctx)}

Conversación anterior:
${(historial || []).slice(-6).map(m => (m.r === "u" ? "Persona: " : "Asistente: ") + m.t).join("\n")}

Pregunta: ${pregunta}

Responde SOLO con JSON: {"respuesta":"texto de la respuesta"}`;
    const r = await this.json(prompt, () => ({ respuesta: demoPregunta(pregunta, vid) }));
    return String((r && r.respuesta) || "No pude armar una respuesta. Intenta de nuevo.");
  },

  /* ---------- Completar la plantilla al crear un vínculo ---------- */
  async completarPlantilla(texto) {
    const prompt = `Eres el asistente de una plataforma interna de Antofagasta Minerals (AMSA). A partir de un correo, notas o descripción, completa la plantilla de un vínculo con una institución.

Texto:
"""
${texto.slice(0, 10000)}
"""

Contrapartes ya registradas: ${S.contrapartes.map(c => c.nombre).join("; ")}
Tipos de vínculo: ${S.tipos.map(t => t.id + " = " + t.nombre).join("; ")}
Financiamiento posible: ${CONFIG.financiamientos.join("; ")}

Responde SOLO con un objeto JSON, sin texto adicional:
{"nombre":"","tipo":"id del tipo","contraparte":"nombre de la institución","sede":"","contacto_nombre":"","contacto_cargo":"","contacto_correo":"","objetivo":"","meta":"para qué le sirve a la compañía","alcance":"","financiamiento_tipo":"","financiamiento_monto":"","inicio":"AAAA-MM-DD","termino":"AAAA-MM-DD","comentarios":""}
Deja como "" lo que el texto no diga. No inventes datos.`;
    return await this.json(prompt, () => demoPlantilla(texto));
  },

  /* ---------- Preguntas específicas para el cuestionario ---------- */
  async preguntasCuestionario(v) {
    const prompt = `Eres el asistente de una plataforma interna de Antofagasta Minerals (AMSA). Propón de 2 a 4 preguntas específicas y breves para un cuestionario de feedback que se enviará a la contraparte de este vínculo. Ya se incluyen preguntas generales sobre satisfacción, cumplimiento de objetivos, comunicación, necesidades, datos de contacto e interés en continuar: no las repitas.

Vínculo: ${v.nombre}
Contraparte: ${contraparte(v.contraparte).nombre}
Tipo: ${tipo(v.tipo).nombre} · Etapa: ${CONFIG.etapas[v.etapa]}
Objetivo: ${v.objetivo || "sin definir"}
Metas: ${metasDe(v).join(", ") || "sin definir"}
Plan de trabajo: ${v.hitos.map(h => (h.ok ? "[hecho] " : "[pendiente] ") + h.t).join("; ")}
Comentarios: ${v.comentarios || "sin registrar"}

Responde SOLO con JSON: {"preguntas":["...","..."]}`;
    const r = await this.json(prompt, () => demoPreguntas(v));
    return (r.preguntas || []).filter(Boolean).slice(0, 4);
  }
};

function normalizarPropuesta(v, r) {
  r = r || {};
  const c = r.cambios || {};
  const cambios = [];
  const add = (campo, etiqueta, antes, despues) => {
    if (despues && String(despues).trim() && String(despues).trim() !== String(antes || "").trim()) cambios.push({ campo, etiqueta, antes: antes || "", despues: String(despues).trim() });
  };
  add("objetivo", "Objetivo", v.objetivo, c.objetivo);
  add("alcance", "Alcance", v.alcance, c.alcance);
  add("comentarios", "Comentarios adicionales", v.comentarios, c.comentarios || [c.necesidades, c.proximos].filter(Boolean).join(" "));
  add("contacto.nombre", "Contacto: nombre", v.contacto.nombre, c.contacto_nombre);
  add("contacto.cargo", "Contacto: cargo o unidad", v.contacto.cargo, c.contacto_cargo);
  add("contacto.correo", "Contacto: correo", v.contacto.correo, c.contacto_correo);
  if (CONFIG.financiamientos.includes(c.financiamiento_tipo)) add("financiamiento.tipo", "Financiamiento", v.financiamiento.tipo, c.financiamiento_tipo);
  add("financiamiento.monto", "Monto", v.financiamiento.monto, c.financiamiento_monto);
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.inicio || "")) add("inicio", "Fecha de inicio", v.inicio, c.inicio);
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.termino || "")) add("termino", "Fecha de término", v.termino, c.termino);
  const completados = (r.hitos_completados || []).filter(t => v.hitos.some(h => h.t === t && !h.ok));
  const nuevos = (r.hitos_nuevos || []).filter(t => t && !v.hitos.some(h => h.t === t));
  const e = CONFIG.etapas.indexOf(r.etapa);
  return { resumen: r.resumen || "", cambios, completados, nuevos, etapa: e >= 0 && e !== v.etapa ? e : null };
}

/* ---------- Modo demo: reglas simples ---------- */
function oraciones(t) { return t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(s => s.length > 3); }
function buscar(t, palabras) { return oraciones(t).filter(s => palabras.some(p => s.toLowerCase().includes(p))); }

function demoReunion(v, texto) {
  const os = oraciones(texto);
  const correo = ((texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || "").replace(/\.+$/, "");
  const nomCont = ((texto.match(/contacto(?: nuevo)?:\s*([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)?)/i) || [])[1] || "");
  const nec = buscar(texto, ["necesit", "piden", "solicit", "requier", "falta"]);
  const prox = buscar(texto, ["próxim", "proxim", "vamos a", "quedamos", "agendar", "enviar", "acordamos"]);
  const low = texto.toLowerCase();
  let etapa = null;
  if (/(firmamos|firmado|se firmó|firma del convenio)/.test(low)) etapa = "Formalización";
  if (/(comenzamos|empezamos|en marcha|arrancó|kickoff|pasamos a ejecución|pasamos a ejecucion)/.test(low)) etapa = "En ejecución";
  if (/(terminamos|cerramos|finalizó|se cerró)/.test(low)) etapa = "Cerrado";
  if (etapa && CONFIG.etapas.indexOf(etapa) <= v.etapa) etapa = null;
  const completados = v.hitos.filter(h => !h.ok && low.includes(h.t.toLowerCase().split(" ")[0]) && /(listo|hecho|realizad|complet|termin)/.test(low)).map(h => h.t).slice(0, 2);
  return {
    resumen: os.slice(0, 3).join(" ") || "Reunión registrada.",
    cambios: {
      comentarios: nec.length ? [v.comentarios, ...nec].filter(Boolean).join(" ") : "",
      contacto_correo: v.contacto.correo ? "" : correo,
      contacto_nombre: nomCont && nomCont !== v.contacto.nombre ? nomCont : ""
    },
    hitos_completados: completados, hitos_nuevos: prox.slice(0, 2).map(t => t.replace(/[.!?]$/, "").slice(0, 90)), etapa
  };
}

function demoPlantilla(texto) {
  const low = texto.toLowerCase();
  const cp = S.contrapartes.find(c => low.includes(c.nombre.toLowerCase()) || low.includes(c.corto.toLowerCase()));
  const tp = S.tipos.find(t => low.includes(t.nombre.toLowerCase().split(" ")[0])) ||
    (low.includes("charla") ? S.tipos.find(t => t.id === "char") : low.includes("convenio") ? S.tipos.find(t => t.id === "conv") : null);
  const os = oraciones(texto);
  return {
    nombre: (os[0] || "").slice(0, 70),
    tipo: tp ? tp.id : "", contraparte: cp ? cp.nombre : "",
    contacto_correo: (texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || "",
    objetivo: os.slice(0, 2).join(" "),
    meta: buscar(texto, ["para ", "busca", "objetivo", "meta"]).slice(0, 1).join(" "),
    comentarios: buscar(texto, ["necesit", "piden", "solicit", "próxim", "proxim", "quedamos", "agendar"]).join(" ")
  };
}

function demoPreguntas(v) {
  const p = [];
  const pend = v.hitos.find(h => !h.ok);
  if (pend) p.push(`¿Cómo ve el avance en "${pend.t}"? ¿Hay algo que lo esté frenando?`);
  if (v.tipo === "char") p.push("¿Qué temas le gustaría que Antofagasta Minerals aborde en la próxima actividad?");
  if (v.tipo === "acad" || v.tipo === "tal") p.push("¿Cómo evalúa el acompañamiento de Antofagasta Minerals a los estudiantes?");
  p.push("¿Qué otra área o unidad de su institución podría beneficiarse de trabajar con Antofagasta Minerals?");
  return { preguntas: p.slice(0, 3) };
}


/* ---------- Asistente de preguntas: datos y modo demo ---------- */
const normT = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function contextoAsistente(vid) {
  const mios = misVinculos().map(v => v.id);
  return {
    persona: { nombre: ME.nombre, area: ME.area ? nombreArea(ME.area) : "Administración" }, vinculo_abierto_en_pantalla: vid || null, mios,
    etapas: CONFIG.etapas,
    vinculos: S.vinculos.map(v => ({ id: v.id, nombre: v.nombre, institucion: contraparte(v.contraparte).corto, tipo_institucion: contraparte(v.contraparte).tipoOrg, area: nombreArea(v.area), tipo: tipo(v.tipo).nombre, etapa: CONFIG.etapas[v.etapa], companias: compsTxt(compsDe(v)), avance_pct: progreso(v), salud: saludDe(v).k, motivo_salud: saludDe(v).motivo, calificacion: v.calif, aporta_a_metas: v.aporta, inicio: v.inicio, termino: v.termino, responsable: v.responsable, contacto: v.contacto.nombre, tareas_pendientes: v.hitos.filter(h => !h.ok).map(h => h.t), comentarios: (v.comentarios || "").slice(0, 160) })),
    convocatorias: S.convocatorias.map(c => ({ id: c.id, titulo: c.titulo, institucion: contraparte(c.institucion).corto, vinculo: (vinculo(c.vinculo) || {}).nombre, tipo: c.tipo, estado: c.estado, cupos: c.cupos, cierre: c.cierre, postulantes: c.postulantes.length, por_estado: c.postulantes.reduce((o, p) => { o[p.estado] = (o[p.estado] || 0) + 1; return o; }, {}) })),
    instituciones: S.contrapartes.map(c => ({ nombre: c.corto, tipo: c.tipoOrg, zona: c.zona }))
  };
}
function demoPregunta(pregunta, vid) {
  const q = normT(pregunta), todos = S.vinculos, mios = misVinculos();
  const pl = (n, s, p) => n + " " + (n === 1 ? s : p);
  const lista = (arr, f) => arr.slice(0, 8).map(f).map(t => "- " + t).join("\n") + (arr.length > 8 ? "\n- y " + (arr.length - 8) + " más" : "");
  const dias = f => f ? Math.ceil((new Date(f) - new Date(hoy())) / 86400000) : null;
  const tiene = (...p) => p.some(x => q.includes(x));
  const esc2 = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const palabra = t => new RegExp("(?<![a-z0-9])" + esc2(normT(t)) + "(?![a-z0-9])").test(q);

  // 1) Convocatoria concreta
  if (tiene("convocatoria", "postulant", "postulacion", "cupos", "memorias", "practica de ", "mentoring")) {
    const toks = q.split(/[^a-z0-9]+/).filter(t => t.length > 3 && !["convocatoria", "como", "cuantos", "cuantas", "postulantes", "hay", "tiene", "esta", "para", "estudiantes"].includes(t));
    const punt = c => { const base = normT(c.titulo + " " + contraparte(c.institucion).corto + " " + c.tipo); return toks.filter(t => base.includes(t)).length; };
    const orden = [...S.convocatorias].sort((x, y) => punt(y) - punt(x) || (x.estado === "Abierta" ? -1 : 1));
    const c = orden[0];
    if (c && punt(c) > 0 && !tiene("cuantas convocatorias", "convocatorias abiertas", "cuantas estan abiertas")) {
      const por = c.postulantes.reduce((o, p) => { o[p.estado] = (o[p.estado] || 0) + 1; return o; }, {}), d = dias(c.cierre);
      return `**${c.titulo}** (${contraparte(c.institucion).corto}) está ${c.estado === "Abierta" ? "abierta" : "cerrada"}.\n- ${pl(c.postulantes.length, "postulante", "postulantes")} para ${pl(c.cupos || 0, "cupo", "cupos")}.\n- Por estado: ${Object.entries(por).map(([k, n]) => n + " " + k.toLowerCase()).join(", ") || "sin postulantes"}.\n- ${c.cierre ? (d != null && d >= 0 ? "Cierra en " + pl(d, "día", "días") + " (" + fechaTxt(c.cierre) + ")." : "Cerró el " + fechaTxt(c.cierre) + ".") : "Sin fecha de cierre."}`;
    }
  }
  if (tiene("convocatorias")) {
    const ab = S.convocatorias.filter(c => c.estado === "Abierta");
    return `Hay ${pl(S.convocatorias.length, "convocatoria", "convocatorias")}: ${ab.length} ${ab.length === 1 ? "abierta" : "abiertas"} y ${S.convocatorias.length - ab.length} ${S.convocatorias.length - ab.length === 1 ? "cerrada" : "cerradas"}.\n` + lista(ab, c => `${c.titulo} (${contraparte(c.institucion).corto}): ${pl(c.postulantes.length, "postulante", "postulantes")}${c.cierre ? ", cierra el " + fechaTxt(c.cierre) : ""}`);
  }
  // 2) Institución concreta
  const cp = S.contrapartes.find(c => palabra(c.corto) || palabra(c.nombre) || palabra(c.id));
  if (cp) {
    const l = todos.filter(v => v.contraparte === cp.id), ab = l.filter(v => v.etapa < 3);
    if (!l.length) return `No hay vínculos registrados con ${cp.corto}.`;
    return `Con ${cp.corto} hay ${pl(l.length, "vínculo", "vínculos")}: ${ab.length} ${ab.length === 1 ? "abierto" : "abiertos"} y ${l.length - ab.length} ${l.length - ab.length === 1 ? "cerrado" : "cerrados"}.\n` + lista(l, v => `${v.nombre} (${CONFIG.etapas[v.etapa]}, ${nombreArea(v.area)})`);
  }
  // 3) Un vínculo concreto
  const toks2 = q.split(/[^a-z0-9]+/).filter(t => t.length > 3 && !["como", "esta", "vinculo", "cuantos", "cuantas", "tiene", "hay", "para", "estan"].includes(t));
  const sc = v => { const b = normT(v.nombre); return toks2.filter(t => b.includes(t)).length + (q.includes(b) ? 100 : 0) - b.length / 1000; };
  const mejor = [...todos].sort((x, y) => sc(y) - sc(x))[0];
  if (tiene("como va", "como esta", "estado de", "que pasa con", "cuentame") && (vid || (mejor && sc(mejor) > 0.5))) {
    const v = (mejor && sc(mejor) > 0.5) ? mejor : vinculo(vid), s = saludDe(v), pend = v.hitos.filter(h => !h.ok).map(h => h.t);
    return `**${v.nombre}** (${contraparte(v.contraparte).corto}) está en ${CONFIG.etapas[v.etapa]}, con ${progreso(v)} % de avance.\n- Salud: ${s.k === "verde" ? "al día" : s.k === "amarillo" ? "conviene atenderlo" : s.k === "rojo" ? "urgente" : "cerrado"}. ${s.motivo}\n- ${v.calif ? "Calificación del área: " + num1(v.calif) + " de 5." : "Todavía sin calificar."}\n- ${pend.length ? "Falta: " + pend.slice(0, 3).join(", ") + (pend.length > 3 ? " y " + (pend.length - 3) + " más" : "") + "." : "Todas las tareas del plan están hechas."}\n- Lo lleva ${v.responsable || "alguien sin definir"}.`;
  }
  // 4) Conteos
  const alcance = tiene("todos", "en total", "en siva", "toda la") ? todos : mios;
  const nota = alcance === mios && mios.length !== todos.length ? `\n(Son los de tu área; en todo SIVA hay ${todos.length}.)` : "";
  const porEtapa = n => alcance.filter(v => v.etapa === n);
  if (tiene("urgente", "atender", "atencion", "sin movimiento", "en rojo", "riesgo", "piden")) {
    const u = alcance.filter(v => ["rojo", "amarillo"].includes(saludDe(v).k));
    return u.length ? `${pl(u.length, "vínculo pide", "vínculos piden")} atención:\n` + lista(u, v => `${v.nombre} (${saludDe(v).k === "rojo" ? "urgente" : "atender"}): ${saludDe(v).motivo}`) + nota : "Ningún vínculo pide atención ahora." + nota;
  }
  if (tiene("sin calificar", "sin evaluar")) { const l = alcance.filter(v => v.etapa === 3 && !v.calif); return `${pl(l.length, "vínculo cerrado sin calificar", "vínculos cerrados sin calificar")}.` + (l.length ? "\n" + lista(l, v => v.nombre) : "") + nota; }
  if (tiene("mejor", "mas alta", "mejor calificad", "promedio", "calificacion")) {
    const c = alcance.filter(v => v.calif);
    if (!c.length) return "Todavía no hay vínculos calificados.";
    const prom = c.reduce((s, v) => s + v.calif, 0) / c.length, top = [...c].sort((a, b) => b.calif - a.calif).slice(0, 3);
    return `${pl(c.length, "vínculo calificado", "vínculos calificados")}, con un promedio de ${num1(prom)} de 5.\nLos mejores:\n` + lista(top, v => `${v.nombre} (${contraparte(v.contraparte).corto}): ${num1(v.calif)}`) + nota;
  }
  if (tiene("estudiante", "postulantes", "practicantes", "memoristas")) {
    const ps = S.convocatorias.flatMap(c => c.postulantes), n = e => ps.filter(p => p.estado === e).length;
    return `Entre todas las convocatorias hay ${pl(ps.length, "postulante", "postulantes")}: ${n("Postuló") + n("En revisión")} por revisar, ${n("Aceptado")} aceptados, ${n("En práctica")} en práctica o memoria, ${n("Terminó")} que ya terminaron y ${n("No aceptado")} no aceptados.`;
  }
  const etapaPorNombre = [["exploracion", 0], ["formalizacion", 1], ["ejecucion", 2], ["cerrad", 3]].find(([k]) => q.includes(k));
  if (etapaPorNombre) { const l = porEtapa(etapaPorNombre[1]); return `Hay ${pl(l.length, "vínculo", "vínculos")} en ${CONFIG.etapas[etapaPorNombre[1]]}.` + (l.length && l.length <= 8 ? "\n" + lista(l, v => `${v.nombre} (${contraparte(v.contraparte).corto})`) : "") + nota; }
  const comp = S.companias.find(c => q.includes(normT(c.nombre)));
  if (comp) { const l = alcance.filter(v => compsDe(v).includes(comp.id)); return `Con ${comp.nombre} hay ${pl(l.length, "vínculo", "vínculos")} (${l.filter(v => v.etapa < 3).length} ${l.filter(v => v.etapa < 3).length === 1 ? "abierto" : "abiertos"}).` + nota; }
  const tp = S.tipos.find(t => q.includes(normT(t.nombre).split(" ")[0]) && normT(t.nombre).split(" ")[0].length > 4) || (tiene("charla") ? S.tipos.find(t => t.id === "char") : null);
  if (tp) { const l = alcance.filter(v => v.tipo === tp.id); return `Hay ${pl(l.length, "vínculo", "vínculos")} de tipo ${tp.nombre.toLowerCase()} (${l.filter(v => v.etapa < 3).length} ${l.filter(v => v.etapa < 3).length === 1 ? "abierto" : "abiertos"}).` + nota; }
  if (tiene("cuantos vinculos", "cuantos hay", "vinculos hay", "numero de vinculos", "abiertos", "activos", "vigentes")) {
    const ab = alcance.filter(v => v.etapa < 3);
    return `Hay ${pl(alcance.length, "vínculo", "vínculos")}: ${ab.length} ${tiene("abiertos", "activos", "vigentes") ? "abiertos" : "abiertos (no cerrados)"} y ${alcance.length - ab.length} cerrados.\nPor etapa: ` + ["en exploración", "en formalización", "en ejecución", "cerrados"].map((e, i) => `${porEtapa(i).length} ${e}`).join(", ") + "." + nota;
  }
  if (tiene("quien lleva", "responsable", "encargad")) {
    const v = mejor && sc(mejor) > 0.5 ? mejor : vid ? vinculo(vid) : null;
    if (v) return `${v.nombre} lo lleva ${v.responsable || "alguien sin definir"} (${nombreArea(v.area)}).`;
  }
  return "No estoy seguro de haber entendido. Puedo contar vínculos (por etapa, institución, compañía o tipo), contarte cómo va una convocatoria o un vínculo, y decirte cuáles piden atención. Por ejemplo: \"cómo va la convocatoria de memorias 2027\" o \"cuántos vínculos hay con la UCN\".";
}
