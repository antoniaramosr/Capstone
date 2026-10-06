# Vínculos · AMSA y universidades

Prototipo interactivo de la plataforma interna para registrar y coordinar los vínculos entre las áreas de AMSA y las universidades.
Proyecto grupal del curso **IDI2025 Tecnología, Emprendimiento y Diseño** (Grupo 2).

Equipo: Francisca López Vallejos, Antonia Ramos Rodríguez y Allison Zapata Inostroza.

## Cómo verlo

- **En línea:** se publica con GitHub Pages (ver más abajo).
- **En tu computador:** abre `index.html` en el navegador. No necesita instalar nada.
  Si usas VS Code, la extensión *Live Server* recarga la página cada vez que guardas.

## Estructura

```
index.html        Página base (header, contenedor y carga de archivos)
css/styles.css    Todos los estilos; los colores están como variables en :root
js/data.js        Datos ficticios: áreas, universidades, tipos, vínculos, avisos y pasantes
js/app.js         Navegación, vistas (pantallas) y eventos
```

## Dónde cambiar cada cosa

| Quiero cambiar…                         | Archivo y lugar                                  |
| --------------------------------------- | ------------------------------------------------ |
| Colores o tipografía                    | `css/styles.css`, bloque `:root`                 |
| Áreas, universidades o vínculos de ejemplo | `js/data.js`                                  |
| Tipos de vínculo                        | `js/data.js`, constante `TIPOS`                  |
| Una pantalla                            | `js/app.js`, funciones `vMis`, `vFicha`, `vAreas`, `vUnis`, `vArea`, `vUni`, `vStats`, `vPasantes`, `vAdd`, `vLogin` |
| Contenido de los mega‑menús             | `js/app.js`, función `megaHTML`                  |
| Menú superior                           | `js/app.js`, función `shell`                     |

Las pantallas se navegan con la URL (`#/mis`, `#/ficha/1`, `#/add`, etc.), así que el botón Atrás del navegador funciona.
Los datos viven en memoria: al recargar la página vuelven a los de ejemplo.

## Publicar con GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
3. En un par de minutos queda en `https://<usuario>.github.io/<repositorio>/`.

## Para trabajar las tres sin pisarnos

- Antes de empezar: `git pull`.
- Cada una trabaja en su rama (`git checkout -b nombre-del-cambio`) y la une con un *Pull Request*.
- Intentemos no editar la misma función al mismo tiempo; avisen por el grupo qué pantalla están tocando.
