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
  const correo = (texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || "";
  const nec = buscar(texto, ["necesit", "piden", "solicit", "requier", "falta"]);
  const prox = buscar(texto, ["próxim", "proxim", "vamos a", "quedamos", "agendar", "enviar", "acordamos"]);
  const low = texto.toLowerCase();
  let etapa = null;
  if (/(firmamos|firmado|se firmó|firma del convenio)/.test(low)) etapa = "Formalización";
  if (/(comenzamos|empezamos|en marcha|arrancó|kickoff)/.test(low)) etapa = "En ejecución";
  if (/(terminamos|cerramos|finalizó|se cerró)/.test(low)) etapa = "Cerrado";
  if (etapa && CONFIG.etapas.indexOf(etapa) <= v.etapa) etapa = null;
  const completados = v.hitos.filter(h => !h.ok && low.includes(h.t.toLowerCase().split(" ")[0]) && /(listo|hecho|realizad|complet|termin)/.test(low)).map(h => h.t).slice(0, 2);
  return {
    resumen: os.slice(0, 3).join(" ") || "Reunión registrada.",
    cambios: {
      comentarios: nec.length ? [v.comentarios, ...nec].filter(Boolean).join(" ") : "",
      contacto_correo: v.contacto.correo ? "" : correo
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
