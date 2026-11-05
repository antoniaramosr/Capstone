/* Ficha del vínculo en PDF. Usa jsPDF (js/vendor/jspdf.umd.min.js), que se descarga con la página,
   así que funciona sin internet. Si por algún motivo no cargó, se baja la ficha en Markdown. */
function fichaPDF(v) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 48, ANCHO = W - M * 2;
  const BRAND = [10, 58, 70], TEAL = [24, 97, 112], INK = [33, 37, 41], MUTED = [93, 86, 86], LINE = [217, 217, 214];
  let y = 0;
  const c = contraparte(v.contraparte);
  const nl = (n, s) => { doc.setFontSize(s); return n * s * 1.35; };

  const pie = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal");
      doc.text("SIVA · Antofagasta Minerals · Ficha generada el " + fechaTxt(hoy()), M, H - 26);
      doc.text("Página " + i + " de " + n, W - M, H - 26, { align: "right" });
    }
  };
  const salto = alto => { if (y + alto > H - 60) { doc.addPage(); y = M; } };

  // Encabezado de color
  doc.setFillColor(...BRAND); doc.rect(0, 0, W, 112, "F");
  doc.setFillColor(...TEAL); doc.rect(0, 112, W, 4, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  const tit = doc.splitTextToSize(v.nombre, ANCHO);
  doc.text(tit, M, 52);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11.5);
  doc.text(c.nombre + (v.sede ? " · " + v.sede : ""), M, 52 + tit.length * 24 - 2);
  doc.setFontSize(10); doc.setTextColor(200, 220, 225);
  doc.text(tipo(v.tipo).nombre + "  ·  Etapa: " + CONFIG.etapas[v.etapa] + "  ·  Avance " + progreso(v) + " %", M, 100);
  y = 146;

  const titulo = t => {
    salto(48); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...TEAL);
    doc.text(t.toUpperCase(), M, y); y += 6; doc.setDrawColor(...LINE); doc.setLineWidth(0.8); doc.line(M, y, W - M, y); y += 18;
  };
  const parrafo = (t, o = {}) => {
    doc.setFont("helvetica", o.bold ? "bold" : "normal"); doc.setFontSize(o.s || 11); doc.setTextColor(...(o.color || INK));
    doc.splitTextToSize(t, o.ancho || ANCHO).forEach(l => { salto(16); doc.text(l, o.x || M, y); y += 15.5; });
  };
  const fila = (k, val) => {
    const lineas = doc.splitTextToSize(val || "No definido", ANCHO - 140);
    salto(lineas.length * 15.5 + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...MUTED); doc.text(k, M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...INK);
    lineas.forEach(l => { doc.text(l, M + 140, y); y += 15.5; });
    y += 3;
  };

  titulo("Datos generales");
  fila("Institución", c.nombre + (v.sede ? " (" + v.sede + ")" : ""));
  fila("Compañía", compsTxt(compsDe(v)) || "No definida");
  fila("Área responsable", rutaArea(v.area).map(a => a.nombre).join(" › "));
  fila("Tipo de vínculo", tipo(v.tipo).nombre);
  fila("Etapa", CONFIG.etapas[v.etapa] + " · avance " + progreso(v) + " %");
  fila("Fechas", "Inicio: " + (v.inicio ? fechaTxt(v.inicio) : "por definir") + " · Término: " + (v.termino ? fechaTxt(v.termino) : "por definir"));
  fila("Financiamiento", v.financiamiento.tipo + (v.financiamiento.monto ? " · monto aproximado " + v.financiamiento.monto : "") + (v.financiamiento.fuente ? " · " + v.financiamiento.fuente : ""));
  y += 8;

  titulo("Objetivo y metas");
  parrafo(v.objetivo || "No definido."); y += 4;
  fila("Metas", metasDe(v).join(", ") || "No definidas");
  fila("Alcance", v.alcance || "No definido");
  y += 8;

  titulo("Personas");
  fila("Contacto", [v.contacto.nombre, v.contacto.cargo].filter(Boolean).join(", ") || "No definido");
  if (v.contacto.correo || v.contacto.telefono) fila("", [v.contacto.correo, v.contacto.telefono].filter(Boolean).join("  ·  "));
  fila("Líder", v.lider || "No definido");
  fila("Encargado/a", v.responsable || "No definido");
  y += 8;

  titulo("Plan de trabajo");
  v.hitos.forEach(h => {
    salto(20);
    doc.setDrawColor(...TEAL); doc.setLineWidth(1); doc.rect(M, y - 9, 10, 10);
    if (h.ok) { doc.setLineWidth(1.6); doc.line(M + 2, y - 4, M + 4.5, y - 1.5); doc.line(M + 4.5, y - 1.5, M + 8.5, y - 7.5); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...(h.ok ? MUTED : INK)); doc.text(h.t, M + 20, y); y += 18;
  });
  if (!v.hitos.length) parrafo("Sin tareas registradas.", { color: MUTED });
  y += 6;

  titulo("Comentarios adicionales");
  parrafo(v.comentarios || "Sin comentarios."); y += 8;

  titulo("Evaluación");
  fila("Calificación", v.calif ? v.calif + " de 5 (promedio de los criterios)" : "Sin calificar");
  fila("¿Aportó a las metas?", { si: "Sí", parcial: "Parcialmente", no: "No" }[v.aporta] || "Sin evaluar");
  Object.entries(v.criterios || {}).forEach(([k, n]) => fila(k, n + " de 5"));
  y += 8;

  if (v.reuniones.length) {
    titulo("Reuniones");
    v.reuniones.slice().reverse().forEach(r => { parrafo(fechaTxt(r.fecha) + " · " + r.fuente, { bold: true, s: 10.5, color: MUTED }); parrafo(r.resumen); y += 4; });
    y += 4;
  }
  titulo("Historial de cambios");
  v.versiones.slice().reverse().forEach(x => parrafo("v" + x.v + " (" + fechaTxt(x.fecha) + ", " + x.autor + "): " + x.resumen, { s: 10.5 }));
  pie();
  return doc;
}
function descargarFichaPDF(v) {
  const slug = v.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!window.jspdf) { descargar("ficha-" + slug + ".md", readmeMarkdown(v), "text/markdown"); toast("No se pudo armar el PDF; se bajó la ficha en texto."); return; }
  fichaPDF(v).save("ficha-" + slug + ".pdf");
}
