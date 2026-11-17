# Cambios de diseño SIVA (rediseño visual, sin cambios de lógica)
Archivos nuevos: css/siva.css, js/siva.js
Archivos modificados: index.html, js/app.js, js/extras.js
- Login con logo animado (animación 1), rojo #D84325 en acción principal, paleta AMSA, DM Sans + Plus Jakarta Sans
- Campanita de avisos (reemplaza bloque Avisos), "Con otras áreas" eliminado, Salud→Estado, Asistente de IA→Asistente SIVA
- Logo SIVA en esquina, Calendario nuevo (derivado de datos existentes), tutorial guiado (se muestra una vez por perfil; menú usuario → "Ver tutorial")
- Resumen y estadísticas con tarjetas/íconos, animaciones (respetan prefers-reduced-motion)

## Ronda 2
- Resumen de la semana: línea de tiempo con burbujas (tamaño = urgencia), datos reales
- Tarjetas de indicadores con mini gráfico y etiqueta de estado
- Estadísticas: columnas de calificación, barra apilada + personas para metas, colores vivos (turquesa, ámbar, rojo)
- Tipografía: sin mayúsculas sostenidas, títulos de tarjeta con subtítulo

## Ronda 3 (16 nov): tarjetas de resumen de Mis vínculos
- De 5 a 3 tarjetas. Totales: "11 vínculos con 10 instituciones", rango de años de inicio (ej. 2025–2026) y desglose "en curso / terminados".
- "Con datos por completar" y "cerrados sin calificar" se unen en una sola tarjeta "vínculos con pendientes" (con el detalle abajo). Si no hay nada pendiente dice "Todo al día". Al hacer clic abre la lista filtrada.
- El filtro "Con datos por completar" pasa a llamarse "Solo con pendientes" y también incluye cerrados sin calificar.
- "Activos (no cerrados)" pasa a "en curso" (también en Estadísticas). Texto del tutorial actualizado.
- Archivos: js/app.js, js/siva.js, css/siva.css, index.html (cache v=45).

## Ronda 4 (16 nov): "terminado" y tarjetas de Estudiantes
- "Cerrado" pasa a "Terminado" cuando habla del fin de un vínculo (etapa, filtro de estado, avisos, tarjetas, Asistente SIVA, ayuda). Las convocatorias siguen "Abierta / Cerrada" (cierran las postulaciones) y el hito "Cierre y evaluación" se dejó igual.
- Dato de ejemplo: la charla UAI (terminada) quedó sin calificación (js/data.js), para que Mis vínculos muestre "1 vínculo con pendientes · 1 terminado sin calificar".
- Estudiantes: 4 tarjetas nuevas (mismo estilo que Mis vínculos): postulantes históricos con rango de años y desglose (aceptados, ya terminaron, no aceptados) · por revisar (de las convocatorias abiertas; al hacer clic filtra la lista) · en práctica o memoria · evaluación de la experiencia.
- Estudiantes: filtro por año de postulación, orden (más reciente / más antigua), "Agrupar por año" y chip "Por revisar" (Postuló + En revisión).
- Archivos: js/extras.js, js/app.js, js/ai.js, js/config.js, js/data.js, js/siva.js, css/siva.css, index.html (cache v=46).

## Ronda 5 (17 nov): etiquetas de postulantes y tarjetas de Estadísticas
- Estados de postulantes: Postulación recibida · En revisión · Aceptado · No seleccionado · En curso · Terminado. Los datos guardados con los nombres antiguos se migran solos (js/convocatorias.js, ESTADO_ANTIGUO). Las columnas "Postuló" pasan a "Fecha de postulación".
- También se renombró el ciclo "Postula / Mientras / Sale" a "Postulan / En curso / Terminaron" (Estadísticas y página del estudiante).
- Estudiantes: la 4.ª tarjeta ahora es "calificación promedio" con "de 5" y "¿Cómo se calcula?", igual que Estadísticas.
- Estadísticas: 3 tarjetas (vínculos históricos con años y desglose en curso/terminados · instituciones · calificación promedio). Bajo el título aparece qué se está viendo: "Viendo: toda la empresa / VP ..., todas las compañías / solo la compañía ...".
- Cache v=47.

## Ronda 6 (17 nov): resumen de Estadísticas más corto
- "En resumen" ya no repite las tarjetas: se quitó "Hay N vínculos con N instituciones" y la frase de instituciones compartidas pasó a la tarjeta 2 ("conviene coordinarse").
- El "tipo mejor evaluado" solo aparece si tiene al menos 3 vínculos calificados. Se agregó "N vínculos terminados aún no se califican" cuando corresponde.
- Cache v=48.

## Ronda 7 (17 nov): "Uso de SIVA" en Estadísticas
- "Indicadores de áreas" pasa a "Uso de SIVA" (subtítulo: ¿Las áreas lo usan y mantienen sus vínculos al día?), en dos grupos: Adopción (Duplicados evitados, Áreas activas este mes) y Calidad de los datos (Vínculos al día, Días sin movimiento).
- Cada indicador tiene título corto + descripción, y un desplegable "¿Qué significa cada indicador?" con la definición (por ejemplo, "al día" = movimiento en los últimos 30 días y contacto alternativo).
- Cache v=49.

## Ronda 8 (17 nov): recuadros de "Uso de SIVA"
- Adopción y Calidad de los datos ahora son un recuadro mayor cada uno, con su título, una pregunta corta y sus dos tarjetas dentro.
- Dato de ejemplo: "Duplicados evitados" parte en 3 (js/store.js, metricas.duplicados). En vivo sube solo cuando SIVA avisa que otra área ya habla con una institución.
- Cache v=50.

## Ronda 9 (17 nov)
- Se quitó la pregunta bajo "Uso de SIVA" (cada recuadro ya tiene la suya). Cache v=51.
