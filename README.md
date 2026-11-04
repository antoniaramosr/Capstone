# SIVA · Sistema de Vínculos AMSA

**Ver el prototipo:** https://antoniaramosr.github.io/Capstone/ (siempre muestra la última versión de `main`)

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

## Perfiles

| Perfil | Ejemplo en el prototipo | Qué hace | Qué ve al entrar |
| --- | --- | --- | --- |
| Gestor/a de vinculación | Eduardo; Daniela (sin vínculos aún) | Registra y actualiza los vínculos de su área, crea convocatorias | Mis vínculos |
| Jefatura | Carolina | Revisa resultados de su gerencia y define metas; no registra | Estadísticas de su gerencia |
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
