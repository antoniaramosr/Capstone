# SIVA · Sistema de Vínculos AMSA

**Ver el prototipo:** https://antoniaramosr.github.io/Capstone/ (siempre muestra la última versión de `main`)

Prototipo de la plataforma interna donde las áreas de Antofagasta Minerals registran y coordinan sus vínculos con universidades, centros de formación, OTEC y otras instituciones.
Proyecto grupal del curso **IDI2025 Tecnología, Emprendimiento y Diseño** (Grupo 2): Francisca López Vallejos, Antonia Ramos Rodríguez y Allison Zapata Inostroza.

Los datos son de ejemplo, armados a mano: **32 vínculos, 18 instituciones, 5 convocatorias y 8 estudiantes**, repartidos en distintas áreas, tipos, etapas, compañías y años, para poder probar cada flujo de principio a fin. La versión anterior, con los datos del mapeo ANF-COQ, quedó en la rama `Anto`.

## Qué hace

- **Mis vínculos**: el Inicio muestra el resumen y solo lo abierto (vínculos y convocatorias). Las pestañas Vínculos y Convocatorias tienen todo el historial con filtros, y Con otras áreas muestra instituciones donde también trabajan otras áreas.
- **Ficha de cada vínculo**, en secciones plegables (El vínculo, Personas, Seguimiento, Evaluación): objetivo, metas, compañías, alcance, financiamiento, fechas, contactos de la institución, líder y encargado/a, reuniones, feedback e historial de cambios. Avisa qué datos faltan, y se descarga en PDF.
- **Semáforo de salud** y aviso de contacto sin respuesta.
- **Evaluación** por criterios, distintos según el tipo de institución.
- **Asistente de IA**: "Actualizar con IA" propone cambios a la ficha desde una reunión (texto pegado, dictado o archivo Word, PDF o texto) y tú apruebas cada uno; también arma cuestionarios de feedback y un chat responde preguntas sobre los vínculos.
- **Feedback de la institución por link**, sin cuenta; el link se crea y se copia solo.
- **Convocatorias para estudiantes**: se crean desde un vínculo, se publican en LinkedIn, se postula en una página pública (`#/convocatorias`) y cada estudiante ve su estado en "Mi postulación".
- **Instituciones** por tipo, **Estadísticas**, **Metas**, **Zonas** y **Administración**.

## Cómo verlo

Abre https://antoniaramosr.github.io/Capstone/ en Safari o Chrome (no hace falta instalar nada). También se puede abrir `index.html` con un servidor local (por ejemplo `python3 -m http.server`).

Para cargar los datos de partida desde cero usa **https://antoniaramosr.github.io/Capstone/#/reiniciar**. La página guarda lo que haces en el navegador, así que úsalo la primera vez y cada vez que cambien los datos. Si acabas de subir cambios y no los ves, espera unos minutos y recarga con Cmd+Shift+R, o prueba en una ventana privada. Administración → Datos también permite restablecer los datos de ejemplo.

### Para las sesiones de testeo

- Antes de cada participante abrir `https://antoniaramosr.github.io/Capstone/#/reiniciar`: borra lo que registró la persona anterior y reinicia los sandboxes del Perfil 0 y del Perfil 2.
- Dos testeadores en paralelo: uno entra como **Perfil 0** y otro como **Perfil 2** (cada uno con su página vacía separada).
- Testeo AMSA: entrar como **Eduardo**. Testeo estudiantes: abrir `#/convocatorias` (sin iniciar sesión).
- Funciona en celular: las tablas pasan a tarjetas.

## Cómo funcionan los correos

Los correos `antonia.ramos+algo@uc.cl` (por ejemplo `antonia.ramos+ucn@uc.cl`) apuntan a la bandeja de Antonia en la UC. Lo que va después del `+` es una etiqueta: el correo llega al mismo buzón, pero a la página le sirven como direcciones distintas. Si el buzón UC no acepta etiquetas con `+`, el correo rebota; en ese caso se cambian por `antonia.ramos@uc.cl` en `js/data.js` (función `CORREO_PRUEBA`). Así Outlook se abre con un destinatario real y el correo llega de verdad.

Los que terminan en `@ejemplo.cl` o `@amsa.ejemplo.cl` son inventados y no reciben nada. Sirven para ver cómo se ve la página con más gente, sin escribirle a nadie por error.

## Perfiles de AMSA (los que usa quien prueba)

Se cambian desde el avatar de arriba a la derecha. Ninguno pide clave.

| Perfil | Correo | Qué rol tiene | Qué se puede probar con él |
|---|---|---|---|
| Eduardo | antonia.ramos+eduardo@uc.cl | Responsable de vínculos, Reclutamiento y selección | Es el perfil principal. Ve 5 vínculos, crea convocatorias, contacta instituciones, pide feedback y se manda el resumen semanal (llega a su correo). |
| Matías | matias@amsa.ejemplo.cl | Responsable de vínculos, mismo equipo que Eduardo | Recibir un vínculo traspasado por Eduardo, o pasarle uno. Lleva el Capstone PUC y la pasantía INACAP, que son del área de Aprendizaje y academia. |
| Daniela | daniela@amsa.ejemplo.cl | Responsable de vínculos, Asuntos Corporativos y Desarrollo Social | No tiene vínculos. Sirve para ver la bienvenida y registrar su primer vínculo desde cero. |
| Carolina | carolina@amsa.ejemplo.cl | Revisión y metas, Desarrollo Organizacional y Compensaciones | Ve los vínculos de su gerencia, las estadísticas y las metas. No registra vínculos. |
| Administración | admin@amsa.ejemplo.cl | Configuración | Ve todo (incluye el convenio con la U. de Antofagasta, que ningún otro perfil ve) y edita áreas, tipos de vínculo, compañías y metas. |
| Perfil 0 y Perfil 2 | perfil0@amsa.ejemplo.cl, perfil2@amsa.ejemplo.cl | Responsable de vínculos | Entran a una página vacía e independiente, para crear todo a mano. Perfil 2 es para una segunda persona probando al mismo tiempo. |

## Personas de las instituciones (contactos)

Son las personas a las que se les escribe desde el botón "Contactar" o a las que les llega el cuestionario.

| Persona | Institución | Cargo | Correo | Para qué sirve |
|---|---|---|---|---|
| Paula Herrera | UCN | Vinculación con el medio | antonia.ramos+ucn@uc.cl | Contacto del vínculo "Memorias y prácticas UCN". Para probar "Contactar" y el cuestionario de feedback con un correo que sí llega. |
| Rodrigo Castillo | UCN | Jefe de carrera, Ing. Civil de Minas | rcastillo@ucn.ejemplo.cl | Segundo contacto de la UCN, para ver cómo se elige a quién escribirle. |
| Josefina Larraín | PUC | Coordinación de prácticas | antonia.ramos+puc@uc.cl | Contacto de la charla PUC (cerrada, con nota 5). Para probar "Contactar" y reutilizar un cuestionario ya respondido. |
| Tomás Vial | PUC | Profesor Capstone | tvial@ing.ejemplo.cl | Contacto del Capstone PUC. |
| Carla Núñez | U. de Chile | Unidad de empleabilidad, FCFM | cnunez@uchile.ejemplo.cl | Contacto de "Meet the Office", el vínculo que lleva 75 días sin movimiento. |
| Marcela Bravo | USACH | Centro de empleabilidad | mbravo@usach.ejemplo.cl | Contacto de la charla USACH, que tiene un cuestionario enviado hace 22 días sin respuesta. |
| Ignacio Ramírez | UTFSM | Dirección de vinculación | iramirez@usm.ejemplo.cl | Contacto de la charla UTFSM, cerrada, donde el área y la institución califican distinto. |
| Marcelo Pizarro | INACAP | Vicerrectoría | mpizarro@inacap.ejemplo.cl | Contacto de la pasantía docente, cerrada y sin calificar. |
| Felipe Ortiz | U. de Antofagasta | Vinculación con el medio | fortiz@uantof.ejemplo.cl | Contacto de la institución del convenio marco (el vínculo aún no tiene contacto cargado). |

## Estudiantes y postulantes

Postulan desde la página pública de convocatorias (menú del avatar, "Ver la página de estudiantes") o los agrega a mano quien gestiona.

| Persona | Correo | Dónde está | Para qué sirve |
|---|---|---|---|
| Valentina Muñoz | antonia.ramos+postulante@uc.cl | Convocatoria "Memorias 2027", estado *Postuló* | Es la que se acepta o rechaza para ver llegar el correo de verdad. |
| Diego Fuentes | diego.fuentes@ejemplo.cl | Misma convocatoria, *En revisión* | Para probar el paso de revisión a aceptado. También sirve para entrar a "Mi postulación". |
| Tomás Herrera | tomas.herrera@ejemplo.cl | Misma convocatoria, *Postuló* | Postulante extra, para aceptar a varias personas a la vez. |
| Camila Rojas | camila.rojas@ejemplo.cl | Misma convocatoria, *En práctica* | Ya tiene dos feedbacks del tutor. Sirve para ver cómo se ve una práctica en curso y la nota. |
| Sofía Pizarro | sofia.pizarro@ejemplo.cl | "Práctica de verano 2026" (cerrada), *Terminó* | Práctica terminada, con feedback del tutor, del estudiante, informe y nota de la universidad. |
| Felipe Guzmán | felipe.guzman@ejemplo.cl | Convocatoria "Práctica profesional invierno 2027", *Aceptado* | Ejemplo de aceptado dentro de una convocatoria abierta, para armar el correo de aceptados. |
| Lucas Morales | lucas.morales@ejemplo.cl | "Práctica de verano 2026", *No aceptado* | Para ver cómo queda alguien que no quedó. |

## Los 32 vínculos y qué muestran

| Área | Vínculos | Qué hay |
|---|---|---|
| Reclutamiento y selección (Eduardo y Matías) | 11 | Charlas, Meet the Office, memorias y prácticas con UCN, U. de Antofagasta, U. de Chile, PUC, UTFSM, UAI, UdeC, ULS, USACH y PUCV, en todas las etapas. |
| Aprendizaje y academia | 6 | Capstone PUC y UCN, diplomado con UAI, pasantías docentes (INACAP, Duoc UC) y un programa de liderazgo con Fundación Chile. |
| Inclusión y empleo | 2 | Mentoring a ingenieras (PUC) y Beca Mujeres en Minería (UdeC). |
| Asuntos Públicos Norte y MLP | 12 | Convenios, directorio de la Escuela de Negocios Mineros, mesa del Consejo Minero, empleo y oficios (CEDUC, CEIM), proveedores, I+D con CICITEM y Corfo, relaves con la UCN y el acuerdo con CEDUC Los Vilos. |
| Desarrollo Organizacional | 1 | Sesión de relaves en La Serena. |

Casos puestos a propósito para ver cada cosa de la página:

- **Memorias y prácticas UCN**: vínculo al día, con dos convocatorias y un cuestionario reciente.
- **Meet the Office (U. de Chile)**: semáforo en rojo, 75 días sin movimiento.
- **Charla USACH**: cuestionario enviado hace 22 días sin respuesta.
- **Charla UTFSM**: el área califica con 4 y la institución responde bajo ("dos miradas").
- **Charla PUC**: cerrada, nota 5, con reunión y cuestionario respondido.
- **Charla UdeC**: cerrada con nota 2, para tener también un mal resultado.
- **Pasantía docente INACAP**: cerrada y sin calificar.
- **Convenio con la U. de Antofagasta**: ficha casi vacía, para el filtro "con datos por completar".
- **Plataforma Empleo Región y Programa de Proveedores**: asociados a varias compañías a la vez.

Convocatorias: *Memorias 2027* (UCN, abierta), *Práctica profesional invierno 2027* (U. de Antofagasta, abierta, cierra pronto), *Mentoring a ingenieras 2027* (PUC, abierta), *Práctica de verano 2026* (UCN, cerrada) y *Memorias 2026* (U. de Chile, cerrada, con notas y feedback).

## Texto y archivo de ejemplo para "Actualizar con IA"

Sirven para probar el panel "Actualizar con IA" de una ficha sin inventar una reunión cada vez. Están pensados para el vínculo **Feria de empleo PUCV** (entra como Eduardo, está en Mis vínculos, en Exploración).

**Archivos para subir** (botón "Subir archivo (Word, PDF o texto)" del panel), en la carpeta `ejemplos/actualizar-con-ia/`. Los tres tienen las mismas notas de la reunión, en los formatos más comunes:

- `nota-reunion-feria-pucv.docx`: documento de Word.
- `nota-reunion-feria-pucv.pdf`: PDF.
- `nota-reunion-feria-pucv.md`: texto simple (Markdown).

**Texto para pegar** en el cuadro del panel (es el mismo de los archivos):

```
Notas de reunión · Feria de empleo PUCV
Fecha: 4 de noviembre de 2026
Participaron: Sandra Mella (Dirección de asuntos estudiantiles, PUCV) y Eduardo (Reclutamiento y selección, AMSA).

Contacto nuevo: Rodrigo Pizarro, correo rpizarro@pucv.ejemplo.cl. Él va a coordinar la feria desde la universidad.

Nos juntamos para ver cómo participaría AMSA en la feria de empleo de abril. La universidad necesita que confirmemos cuántas personas iríamos al stand y qué carreras queremos atender. Piden también que llevemos información sobre prácticas de verano y memorias.

Quedó listo el tema de la fecha: la feria es el 15 de abril de 2027 y ya está coordinada con el calendario de la universidad. Empezamos a coordinar el stand y el traslado del equipo.

Acordamos enviar la lista de carreras y el número de personas antes del 30 de noviembre. Quedamos en agendar una nueva reunión para la primera semana de diciembre.
```

Qué debería proponer la IA: cambiar el contacto a Rodrigo Pizarro, agregar a los comentarios lo que pide la universidad, marcar "Coordinar fecha" como cumplida, sumar dos próximos pasos (enviar la lista de carreras y agendar la reunión de diciembre) y mover el vínculo de Exploración a En ejecución. Cada cambio se aprueba por separado, y lo que no se aprueba no se guarda. En "Modo demo, sin IA" se aplican reglas simples y la propuesta es más corta; con IA de verdad también completa objetivo y fechas.

Los archivos de audio todavía no se transcriben dentro de la página. Para audio, hay que usar la transcripción de Teams o Meet, o el botón "Dictar notas".

## Asistente de IA (preguntas sobre los vínculos)

El botón de abajo a la derecha, "Asistente de IA", abre un chat donde se le puede preguntar por lo que hay registrado en SIVA. Algunas preguntas para probar:

- ¿Cuántos vínculos están abiertos?
- ¿Cómo va la convocatoria de memorias 2027?
- ¿Cuántos vínculos hay con la UCN? (también con U. de Chile, PUC, Corfo, etc.)
- ¿Qué vínculos piden atención?
- ¿Cuántos postulantes hay en total?
- ¿Cuántas convocatorias están abiertas?
- Cómo va el vínculo Meet the Office
- ¿Cuántas charlas hay? / ¿Cuántos vínculos hay con Centinela?
- ¿Cuántos vínculos hay sin calificar? / ¿Cuáles son los mejor calificados?

Por defecto cuenta los vínculos del perfil con el que se entró, y avisa cuántos hay en todo SIVA. Si la pregunta incluye "en total" o "todos", cuenta todos. Sin IA conectada ("Modo demo, sin IA" arriba del panel) entiende estas preguntas por reglas simples; con IA de verdad entiende preguntas más libres, porque recibe los mismos datos y responde solo con ellos. Para actualizar un vínculo hay que ir a su ficha y usar "Actualizar con IA".

## Evaluación de un vínculo

En la ficha, la sección Evaluación aparece solo cuando el vínculo ya tiene calificación. Si no la tiene, arriba aparece el botón "Evaluar vínculo", que abre la sección. Los criterios dependen del tipo de vínculo y de la institución: con universidades, institutos y centros de formación se habla de estudiantes; con una OTEC, una fundación, un gremio, un centro de investigación o un organismo público se habla de "personas participantes" o "personas invitadas". Para ver la diferencia, compara una charla con la PUC y el programa de liderazgo con Fundación Chile.

## Paso a paso para probar cada cosa

1. **Contactar a una institución.** Entra como Eduardo, ve a Mis vínculos y presiona "Contactar" en la fila de Memorias y prácticas UCN. Se abre Outlook con el correo para Paula Herrera. Si hay otra área trabajando con la misma institución, la ventana lo avisa antes.
2. **Pedir feedback con cuestionario.** Abre la ficha de la charla USACH o de la UCN y presiona "Pedir feedback". El panel muestra una vista previa del correo con el link ya puesto, y el mismo link queda disponible para copiar o abrir en Outlook. Ábrelo en otra pestaña, respóndelo como si fueras la institución y vuelve a la ficha para ver la respuesta.
3. **Aceptar a una postulante.** Entra a la convocatoria "Memorias 2027", pasa a Valentina Muñoz a *En revisión* y luego a *Aceptado*. Después usa "Correo para aceptados": elige el área, ajusta la plantilla y se abre Outlook con los correos de los aceptados en copia oculta. Llega a antonia.ramos+postulante@uc.cl.
4. **Postular como estudiante.** Desde el avatar, "Ver la página de estudiantes". Postula con un correo inventado y luego, como Eduardo, revisa que aparezca en la convocatoria.
5. **Seguir una práctica.** Con el correo de Camila Rojas o de Sofía Pizarro, entra a "Mi postulación" y mira el feedback del tutor.
6. **Traspasar un vínculo.** Como Eduardo, en la ficha de un vínculo usa "Cambiar encargado/a" y pásaselo a Matías (el botón está arriba, junto a "Editar o eliminar", y también en el panel lateral). Cambia de perfil a Matías para verlo llegar.
7. **Empezar de cero.** Entra como Daniela (sin vínculos) o como Perfil 0 (página vacía) y registra el primer vínculo con "+ Añadir".
8. **Actualizar con IA.** En una ficha, "Actualizar con IA" abre un panel aparte del de feedback. Se dicta, se pega una transcripción o se sube un archivo de texto, y se aprueba cada cambio propuesto. Hay un texto y archivos de ejemplo en la sección de arriba.
9. **Descargar la ficha.** El botón "Descargar ficha" baja un PDF con todos los datos del vínculo.
10. **Ver las convocatorias.** En el Inicio de Mis vínculos aparecen las convocatorias abiertas, y la pestaña "Convocatorias" muestra el historial completo, abiertas y cerradas. En Mis vínculos, el "Inicio" solo muestra lo abierto; la pestaña "Vínculos" tiene el historial con filtros. Los menús de la barra de arriba se abren al pasar el mouse por la flechita.
11. **Ver metas y estadísticas.** Entra como Carolina o como Administración.
12. **Evaluar un vínculo.** En la ficha de uno sin calificar, "Evaluar vínculo" abre la sección de evaluación. Después de calificar queda fija.
13. **Preguntarle al asistente.** Botón de abajo a la derecha; hay preguntas de ejemplo más arriba.

## Modo demo e IA real

- Publicado como artifact en claude.ai, usa IA real (Claude).
- Abierto desde GitHub Pages o el computador, funciona en **modo demo**: reglas simples para mostrar el flujo.
- Para IA real fuera de claude.ai, se puede montar un servidor (por ejemplo en Flask) que reciba `POST {prompt}` y responda JSON, y poner su URL en `CONFIG.aiEndpoint` (`js/config.js`).
- Transcribir audios todavía no está implementado: se pega la transcripción de Teams/Meet/Zoom o se usa el botón Dictar (Chrome).

## Estructura

```
index.html        Página base
css/styles.css    Estilos; colores y tipografía de AMSA en variables de :root (siempre fondo blanco)
js/config.js      Áreas, tipos de vínculo, tipos de institución, etapas, usuarios de prueba
js/data.js        Vínculos, instituciones, convocatorias y estudiantes de ejemplo
js/store.js       Estado, guardado en el navegador, cálculos (progreso, completitud, README en Markdown)
js/ai.js          Asistente: prompts, conexión con IA y modo demo
js/convocatorias.js Convocatorias, publicación en LinkedIn y página pública para postular
js/extras.js      Pantallas y utilidades adicionales
js/pdf.js         Ficha del vínculo en PDF
js/vendor/        jsPDF, JSZip y pdf.js (para PDF y archivos Word/PDF)
js/app.js         Pantallas, navegación y eventos
ejemplos/         Archivos de ejemplo para "Actualizar con IA"
```

| Quiero cambiar…                    | Dónde                                             |
| ---------------------------------- | ------------------------------------------------- |
| Áreas o tipos de vínculo iniciales | `js/config.js`                                    |
| Vínculos de ejemplo                | `js/data.js` (lista `filas`)                      |
| Campos del README                  | `vForm` en `app.js` y `CAMPOS_README` en `store.js` |
| Preguntas base del cuestionario    | `PREGUNTAS_BASE` en `js/store.js`                 |
| Lo que se le pide a la IA          | `js/ai.js`                                        |
| Una pantalla                       | `js/app.js`: `vMis`, `vFicha`, `vForm`, `vAreas`, `vContrapartes`, `vDashboard`, `vAdmin` |

Datos: son inventados, salvo los correos `antonia.ramos+algo@uc.cl`. Los vínculos reales del mapeo ANF-COQ están en la rama `Anto`.

## Qué queda por hacer

- Cargar a mano más vínculos y convocatorias a medida que aparezcan casos que no cubre este set.
- Revisar que el resumen semanal y los avisos tengan sentido con tan pocos datos.
- Decidir qué instituciones reales se agregan después, y con qué correos.

## Para trabajar las tres sin pisarnos

`git pull` antes de empezar, una rama por cambio y avisar qué pantalla está tocando cada una.
