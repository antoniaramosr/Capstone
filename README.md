# SIVA · Sistema de Vínculos AMSA

**Ver el prototipo de esta rama (Anto):** https://raw.githack.com/antoniaramosr/Capstone/Anto/index.html

**Ver la versión del equipo (`main`):** https://antoniaramosr.github.io/Capstone/ (GitHub Pages solo publica `main`)

Prototipo de la plataforma interna donde las áreas de Antofagasta Minerals registran y coordinan sus vínculos con universidades, centros de formación, OTEC y otras instituciones.
Proyecto grupal del curso **IDI2025 Tecnología, Emprendimiento y Diseño** (Grupo 2): Francisca López Vallejos, Antonia Ramos Rodríguez y Allison Zapata Inostroza.

## Qué hace

- **Ficha de cada vínculo**: objetivo, metas a las que busca aportar (varias), compañías (varias o todas), alcance, contacto de la institución (sugiere los contactos ya registrados), líder de la iniciativa y encargado/a, financiamiento con monto aproximado, fechas, plan de trabajo como lista de tareas y comentarios adicionales. Avisa qué datos importantes faltan.
- **Calificación por criterios**: cada tipo de vínculo tiene tres criterios que se califican de 1 a 5 (administración los edita). La nota del vínculo es el promedio.
- **Asistente**: completa la plantilla a partir de un correo o notas, actualiza el README con la transcripción de una reunión (pegada, en archivo .txt/.vtt o dictada) proponiendo cambios que la persona aprueba, y arma un cuestionario de feedback para la contraparte.
- **Historial de versiones** del README, reuniones registradas y respuestas de la contraparte.
- **Convocatorias para estudiantes**: desde un vínculo de prácticas y memorias o de empleo se crea una convocatoria, se publica en LinkedIn (abre LinkedIn con el texto listo), los estudiantes postulan en una página pública (`#/postular/<id>`, sin iniciar sesión) y se marca quién quedó.
- **Estado de la postulación** para estudiantes (`#/mi-postulacion`): con su correo ven en qué etapa va (recibida, en revisión, resultado, inducción). La página de cada convocatoria explica cómo sigue el proceso.
- **Instituciones por tipo de vínculo**: en Instituciones se filtra, por ejemplo, con qué universidades se han hecho Capstone y qué áreas los llevan.
- **Aviso de contacto existente** cuando otra área ya trabaja con la misma institución.
- **Estadísticas**: resumen en palabras arriba, gráficos de torta y barras, y secciones que se abren y cierran.
- **Metas**: se desactivan en vez de eliminarse, así siguen en los gráficos.
- **Instituciones por zona** (norte, centro, sur, nacional).
- **Administración** (solo administradores): agregar áreas, tipos de vínculo, tipos de institución y contrapartes.

## Cambios en la rama `Anto` (después del feedback de la GE2)

Propuesta individual de Antonia para el Ejercicio Individual 2. Si al equipo le gustan, se pasan a `main`.

- **Etiquetas**: "Quedó / No quedó" pasa a "Aceptado / No aceptado".
- **Ciclo del estudiante (postula → mientras → sale)**: después de "Aceptado" vienen "En práctica" y "Terminó". La convocatoria y Estadísticas muestran cuántos postulan, cuántos son aceptados, cuántos están en práctica y cuántos terminaron, con porcentajes.
- **Aviso al estudiante**: cada cambio de estado prepara el correo que le llega al estudiante (botón "Avisar por correo"). Queda marcado como "Avisado". La página de estado del estudiante suma las etapas "Práctica o memoria" y "Cierre".
- **Feedback de la institución por link, sin correos de ida y vuelta**: el cuestionario se responde en `#/responder/<vínculo>.<cuestionario>`, sin cuenta. Las respuestas llegan solas a la ficha. Sigue existiendo "Registrar a mano" para respuestas por otra vía.
- **Contacto sin respuesta**: si la institución no responde el cuestionario en 14 días, la ficha y los avisos lo muestran y sugieren escribirle a otro contacto, para que el vínculo no dependa de una sola persona.
- **Indicador de ubicación**: barra "Estás en" más grande en todas las páginas.
- **Roles**: "Jefatura" se muestra como "Gestor/a de metas (jefatura)".
- **Mis vínculos**: se puede ordenar por fecha de inicio (más reciente o más antigua), por nombre o por etapa. El panel de convocatorias muestra también las cerradas.
- **Pestaña "Con otras áreas"**: mis instituciones que también trabajan con otras áreas, y las instituciones de otras áreas con las que yo no trabajo. Cada institución se abre y se cierra.
- **Editar y eliminar**: las convocatorias se pueden editar ("Editar o eliminar"). Vínculos y convocatorias se pueden eliminar con confirmación y opción de deshacer.
- **Menos ruido visual**: Reuniones, Feedback, Historial, Detalle de la oferta, Convocatorias y Avisos son plegables. Espaciado e interlineado parejos en todas las páginas.

### Tres vistas, una por actor (noviembre, después del informe del Ejercicio Individual 2)

| | AMSA | Institución | Estudiante |
|---|---|---|---|
| Cómo entra | Cuenta de AMSA (usuarios de prueba) | Link exclusivo del vínculo, sin cuenta | Link personal en su correo, sin cuenta |
| Qué hace | Registra, gestiona, hace seguimiento, ve estadísticas | Responde el feedback del vínculo | Postula, ve su avance y su feedback, y al salir deja el suyo |
| Qué recibe | Qué vínculos atender primero y cuántos estudiantes hay en cada etapa | Cuántos de sus estudiantes postularon, entraron y terminaron | En qué etapa va y el feedback de su tutor/a |

- **Vista del estudiante** (`#/mi-postulacion/<correo>`): tres pasos, Postula, Mientras y Sale. Mientras está en práctica ve las etapas y el feedback de su tutor/a con propuestas de mejora. Al terminar ve el feedback final, responde 4 preguntas de 1 a 5, sube su informe (en el prototipo se guarda solo el nombre del archivo) y la nota de su universidad, y decide con una casilla si AMSA puede verlos. Los correos de aviso traen este link.
- **Seguimiento desde AMSA**: en la tabla de postulantes, "Seguimiento" abre una fila para escribirle feedback al estudiante (texto, propuestas, nota opcional) y ver lo que él dejó. La nota y el informe aparecen solo si el estudiante lo autorizó. La franja del ciclo muestra el promedio del feedback de estudiantes y tutores.
- **Institución**: después de responder el cuestionario ve un resumen de sus estudiantes en AMSA (postularon, aceptados, en práctica, terminaron), sin nombres.
- **Salud del vínculo**: punto de color con palabra en Mis vínculos. "Al día" si hubo movimiento en los últimos 30 días y hay contacto alternativo, "Atender" si falta una de las dos, "Urgente" si pasaron más de 60 días. Los plazos están en `CONFIG.salud` (`js/config.js`) y falta validarlos con la contraparte. Se puede ordenar por salud.
- **Resumen de la semana**: panel en Mis vínculos con vínculos urgentes, convocatorias que cierran pronto y cuestionarios sin respuesta. "Enviarme este resumen" abre Outlook con el texto. El envío automático semanal no existe en el prototipo.
- **Rúbrica**: cada criterio tiene una frase por nivel (`CONFIG.rubrica`). Al pasar el mouse por un número se ve qué significa.
- **Dos miradas**: en la ficha, la nota del área al lado de la nota de la institución. Si difieren en 2 puntos o más aparece "Vale la pena conversarlo".
- **Traspaso**: "Cambiar encargado/a" arma una hoja de traspaso (últimas reuniones, lo prometido, lo que falta del plan, contactos y alertas). El nuevo encargado/a la ve al entrar y confirma con "Leí y asumo". Para probarlo: traspasar a Matías y cambiar a su perfil.
- **Notas de reunión desde el celular**: el asistente tiene un botón grande para dictar y cada cambio propuesto se aprueba por separado.
- La pestaña "Con otras áreas" ahora se llama "Qué hacen otras áreas".

Para probar desde cero: abre el link con `#/reiniciar` al final. Estudiantes de prueba: camila.rojas@ejemplo.cl (en práctica), sofia.pizarro@ejemplo.cl (terminó, autorizó), matias.contreras@ejemplo.cl (terminó, no autorizó), javiera.castillo@ejemplo.cl (terminó, sin datos).

## Perfiles

| Perfil | Ejemplo en el prototipo | Qué hace | Qué ve al entrar |
| --- | --- | --- | --- |
| Gestor/a de vinculación | Eduardo; Matías (mismo equipo, para el traspaso); Daniela (sin vínculos aún) | Registra y actualiza los vínculos de su área, crea convocatorias | Mis vínculos |
| Gestor/a de metas (jefatura) | Carolina | Revisa resultados de su gerencia y define metas; no registra | Estadísticas de su gerencia |
| Administración | Administración | Configura compañías, áreas, tipos, metas e instituciones; ve todo | Estadísticas de toda la empresa |
| Perfil 0 / Perfil 2 (sandbox) | Perfil 0; Perfil 2 | Misma experiencia que un gestor, en una página vacía guardada aparte | Mis vínculos (sin datos) |
| Estudiante (externo) | Página pública | Ve convocatorias abiertas y postula sin cuenta | Convocatorias (`#/convocatorias`) |

La compañía de cada vínculo (Corporativo, Los Pelambres, Centinela, Antucoya, Zaldívar) es una asignación propuesta para la demo.

## Cómo verlo

Abre `index.html` en el navegador y aprieta "Iniciar sesión" para elegir una cuenta (o publícalo con GitHub Pages: Settings → Pages → rama `main`, carpeta raíz).
Puedes entrar como **Eduardo** (usuario de Reclutamiento y selección) o como **Administración**.
Para probar desde cero están el **Perfil 0** y el **Perfil 2**: cada uno entra a su propia página vacía (sin vínculos, contactos ni convocatorias), independiente de los datos de ejemplo y del otro perfil vacío. Desde el menú de tu perfil puedes cambiar a jefatura o administración sin salir de la página vacía, y vaciarla otra vez cuando quieras.
Si después de un push la página se ve igual, es el caché del navegador: sube el número `?v=` de los archivos en `index.html` (por ejemplo de `?v=2` a `?v=3`) y vuelve a hacer push.
Los cambios se guardan en el navegador de cada persona; Administración → Datos permite restablecer los datos de ejemplo.

### Para las sesiones de testeo

- Antes de cada participante abrir `https://antoniaramosr.github.io/Capstone/#/reiniciar` (o el link "Restablecer todo" en el ingreso): borra lo que registró la persona anterior y reinicia los sandboxes del Perfil 0 y del Perfil 2.
- Dos testeadores en paralelo: uno entra como **Perfil 0** y otro como **Perfil 2** (cada uno con su página vacía separada).
- Testeo AMSA: entrar como **Eduardo**. Testeo estudiantes: abrir `#/convocatorias` (sin iniciar sesión).
- Funciona en celular: las tablas pasan a tarjetas.

### Sobre el asistente

- Publicado como artifact en claude.ai, usa IA real (Claude).
- Abierto desde GitHub Pages o el computador, funciona en **modo demo**: reglas simples para mostrar el flujo.
- Para IA real fuera de claude.ai, se puede montar un servidor (por ejemplo en Flask) que reciba `POST {prompt}` y responda JSON, y poner su URL en `CONFIG.aiEndpoint` (`js/config.js`).
- Transcribir audios todavía no está implementado: se pega la transcripción de Teams/Meet/Zoom o se usa el botón Dictar (Chrome).

## Estructura

```
index.html        Página base
css/styles.css    Estilos; colores y tipografía de AMSA en variables de :root (siempre fondo blanco)
js/config.js      Áreas, tipos de vínculo, tipos de institución, etapas, usuarios de prueba
js/data.js        Vínculos de partida (mapeo ANF-COQ) e instituciones
js/store.js       Estado, guardado en el navegador, cálculos (progreso, completitud, README en Markdown)
js/ai.js          Asistente: prompts, conexión con IA y modo demo
js/convocatorias.js Convocatorias, publicación en LinkedIn y página pública para postular
js/app.js         Pantallas, navegación y eventos
```

| Quiero cambiar…                    | Dónde                                             |
| ---------------------------------- | ------------------------------------------------- |
| Áreas o tipos de vínculo iniciales | `js/config.js`                                    |
| Vínculos de ejemplo                | `js/data.js` (lista `filas`)                      |
| Campos del README                  | `vForm` en `app.js` y `CAMPOS_README` en `store.js` |
| Preguntas base del cuestionario    | `PREGUNTAS_BASE` en `js/store.js`                 |
| Lo que se le pide a la IA          | `js/ai.js`                                        |
| Una pantalla                       | `js/app.js`: `vMis`, `vFicha`, `vForm`, `vAreas`, `vContrapartes`, `vDashboard`, `vAdmin` |

Datos: los vínculos vienen del *Mapeo instituciones formativas ANF - COQ*. La subárea de las actividades de VP Personas es una asignación propuesta. Calificaciones, avances y financiamiento son de ejemplo.

## Para trabajar las tres sin pisarnos

`git pull` antes de empezar, una rama por cambio y avisar qué pantalla está tocando cada una.

### Propuestas de Francisca y Allison (Ejercicio Individual 2), sumadas en la rama `Anto`

Se juntaron las ideas de los tres informes. Todo lo de abajo funciona en el prototipo.

**De Francisca**

- **Encabezado de color** (su Propuesta A): barra y título en degradado petróleo, pestaña activa en blanco, tarjetas de resumen que se montan sobre el borde, amarillo para lo que pide atención (filas de la tabla y tarjeta de convocatorias abiertas) y rojo solo para "+ Añadir".
- **Correo para aceptados** (`#/correo-aceptados/<convocatoria>`): plantilla por área con convocatoria y contacto autocompletados, fecha de inicio, plazo para confirmar (5 días hábiles sugerido), próximos pasos como botones para marcar (más "+ Otro"), mensaje adicional, vista previa en vivo y "Enviar a N aceptados". Se guarda por área y se reutiliza en la siguiente convocatoria. Abre Outlook con los correos en copia oculta y deja a cada estudiante como "Avisado". Se entra desde el detalle de la convocatoria.
- **Instituciones simplificado**: el submenú muestra un buscador y las 5 con más vínculos, y "Ver todas".
- **Descripción corta al inicio de cada sección** y botón **+ Añadir vínculo** también dentro de Mis vínculos.
- **Roles por lo que hacen**: Responsable de vínculos, Revisión y metas, Configuración.
- **Estadísticas con jerarquía**: tarjetas arriba, resumen en palabras, gráficos, y el "Detalle por institución y por área" plegado.

**De Allison**

- **Submenús solo al presionar**: ya no se abren al pasar el mouse. La flecha junto a cada sección los abre; el nombre lleva directo a la página. Los submenús son cortos: Mis vínculos por etapa y Estudiantes (Practicantes y Memoristas).
- **Un solo "+ Añadir"** que lleva directo a la ficha, donde se elige el tipo de vínculo y la institución (con "+ Otra institución").
- **Contactar junto a cada contacto** (ficha, institución y lista), ya no arriba. Se abre en una ventana al centro y avisa si otra área ya habla con esa institución.
- **Año en cada vínculo**, filtro por año y "Agrupar por año".
- **Ayuda** (`#/ayuda`): primeros pasos, glosario (vínculo, etapa, avance, calificación, salud, aceptado…), quién usa SIVA y que SIVA no reemplaza el portal de AMSA.
- **Leyenda de calificación y avance** bajo la tabla de vínculos.
- **Nexo con el portal de AMSA**: una convocatoria puede llevar el link de su portal. La página pública manda a postular allá, y en el detalle se puede registrar a mano a quien postuló por el portal.
- **Métricas del piloto** en Estadísticas ("¿Está funcionando SIVA?"): avisos de contacto compartido, áreas que registraron algo en los últimos 30 días, % de vínculos al día y días promedio sin movimiento.

**Página nueva de Estudiantes** (`#/estudiantes`, con Practicantes y Memoristas): quién postula, quién está en práctica y quién terminó, con número y porcentaje.

**Corrección**: abrir directo un link como `#/ficha/3` fallaba por un error de orden al arrancar. Ya se arregló.

**Lo que no se hizo, y por qué**: Allison propone dejar solo dos roles (encargado del área y miembros), pero la retroalimentación de la GE2 pidió un usuario administrador y uno de solo lectura, así que se mantuvieron los tres perfiles, solo con nombres por función. Queda para que el grupo lo converse.
