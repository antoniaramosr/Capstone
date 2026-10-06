# Vínculos · AMSA e instituciones

Prototipo de la plataforma interna donde las áreas de Antofagasta Minerals registran y coordinan sus vínculos con universidades, centros de formación, OTEC y otras instituciones.
Proyecto grupal del curso **IDI2025 Tecnología, Emprendimiento y Diseño** (Grupo 2): Francisca López Vallejos, Antonia Ramos Rodríguez y Allison Zapata Inostroza.

## Qué hace

- **Plantilla README** para cada vínculo: objetivo, meta (para qué sirve), alcance, contacto de la contraparte, responsable en AMSA, financiamiento, fechas, plan de trabajo, necesidades y próximos pasos. Muestra qué tan completo está.
- **Asistente**: completa la plantilla a partir de un correo o notas, actualiza el README con la transcripción de una reunión (pegada, en archivo .txt/.vtt o dictada) proponiendo cambios que la persona aprueba, y arma un cuestionario de feedback para la contraparte.
- **Historial de versiones** del README, reuniones registradas y respuestas de la contraparte.
- **Aviso de contacto existente** cuando otra área ya trabaja con la misma institución.
- **Dashboard**: cantidad de vínculos, calificación promedio, qué tipos de vínculo y qué contrapartes sirven más, instituciones compartidas entre áreas.
- **Administración** (solo administradores): agregar áreas, tipos de vínculo, tipos de institución y contrapartes.

## Cómo verlo

Abre `index.html` en el navegador (o publícalo con GitHub Pages: Settings → Pages → rama `main`, carpeta raíz).
Puedes entrar como **Eduardo** (usuario de Reclutamiento y selección) o como **Administración**.
Los cambios se guardan en el navegador de cada persona; Administración → Datos permite restablecer los datos de ejemplo.

### Sobre el asistente

- Publicado como artifact en claude.ai, usa IA real (Claude).
- Abierto desde GitHub Pages o el computador, funciona en **modo demo**: reglas simples para mostrar el flujo.
- Para IA real fuera de claude.ai, se puede montar un servidor (por ejemplo en Flask) que reciba `POST {prompt}` y responda JSON, y poner su URL en `CONFIG.aiEndpoint` (`js/config.js`).
- Transcribir audios todavía no está implementado: se pega la transcripción de Teams/Meet/Zoom o se usa el botón Dictar (Chrome).

## Estructura

```
index.html        Página base
css/styles.css    Estilos; colores en variables de :root
js/config.js      Áreas, tipos de vínculo, tipos de institución, etapas, usuarios de prueba
js/data.js        Vínculos de partida (mapeo ANF-COQ) e instituciones
js/store.js       Estado, guardado en el navegador, cálculos (progreso, completitud, README en Markdown)
js/ai.js          Asistente: prompts, conexión con IA y modo demo
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
