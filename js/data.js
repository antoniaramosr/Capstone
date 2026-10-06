/* Datos ficticios del prototipo.
   Para agregar áreas, universidades o vínculos, edita solo este archivo. */
/* ===================== Datos ficticios ===================== */
const ETAPAS = ["Contacto inicial","En curso","Cerrado"];
const USER = { nombre:"Eduardo", area:"inn" };
const TIPOS = [
  { id:"pm",  nombre:"Prácticas y memorias", desc:"Estudiantes en etapa formativa dentro de AMSA." },
  { id:"cap", nombre:"Capstone", desc:"Desafíos de AMSA desarrollados por estudiantes en un curso." },
  { id:"id",  nombre:"Investigación y docentes", desc:"Proyectos de I+D o consultorías con académicos." },
  { id:"ini", nombre:"Iniciativas y programas", desc:"Becas, charlas, visitas guiadas o ferias laborales." }
];
const tipo = id => TIPOS.find(t=>t.id===id);

const AREAS = [
  { id:"inn", nombre:"Innovación", correo:"innovacion@ejemplo.cl" },
  { id:"iye", nombre:"Inclusión y Empleo", correo:"inclusion.empleo@ejemplo.cl" },
  { id:"aco", nombre:"Asuntos Corporativos", correo:"asuntos.corporativos@ejemplo.cl" },
  { id:"aba", nombre:"Abastecimiento", correo:"abastecimiento@ejemplo.cl" }
];
const UNIS = [
  { id:"ucn", nombre:"Universidad Católica del Norte", corto:"U. Católica del Norte", contacto:"Dirección de vinculación", correo:"vinculacion@ucn.ejemplo.cl" },
  { id:"ua",  nombre:"Universidad de Antofagasta", corto:"U. de Antofagasta", contacto:"Coordinación de prácticas", correo:"practicas@ua.ejemplo.cl" },
  { id:"uch", nombre:"Universidad de Chile", corto:"U. de Chile", contacto:"Escuela de Ingeniería", correo:"ingenieria@uch.ejemplo.cl" },
  { id:"puc", nombre:"Pontificia Universidad Católica", corto:"Pontificia U. Católica", contacto:"Centro de innovación", correo:"innovacion@puc.ejemplo.cl" }
];
const PASANTES = { total:6, porUni:{ua:2,ucn:2,uch:1,puc:1}, porArea:{inn:3,iye:2,aba:1,aco:0} };

const vacio = () => ({ objetivo:"", alcance:"", plazo:"", resultado:"" });
let nextId = 8;
let vinculos = [
  { id:1, nombre:"Convenio de investigación aplicada", tipo:"id", area:"inn", uni:"ucn", etapa:1, calif:null,
    contacto:"Dirección de vinculación", objetivos:{ objetivo:"Desarrollar un proyecto conjunto de investigación.", alcance:"Un equipo académico y un equipo interno de Innovación.", plazo:"", resultado:"" },
    readme:null, reportes:["Reporte de avance 1"],
    feedback:[{t:"Buena disposición del equipo académico. Los plazos internos de la universidad son lentos.", q:"Eduardo"}],
    saben:["Eduardo (responsable)","Jefatura de Innovación"] },
  { id:2, nombre:"Desafío de innovación abierta con estudiantes", tipo:"cap", area:"inn", uni:"uch", etapa:2, calif:4,
    contacto:"Escuela de Ingeniería", objetivos:{ objetivo:"Resolver un desafío operacional con equipos de estudiantes.", alcance:"Tres equipos de estudiantes de ingeniería.", plazo:"Un semestre.", resultado:"Prototipos evaluados por Innovación." },
    readme:"readme_desafio.pdf", reportes:["Informe final"], feedback:[{t:"Buen nivel de los equipos. Repetiríamos el formato.", q:"Eduardo"}], saben:["Eduardo (responsable)"] },
  { id:3, nombre:"Exploración de laboratorio conjunto", tipo:"id", area:"inn", uni:"puc", etapa:0, calif:null,
    contacto:"Centro de innovación", objetivos:vacio(), readme:null, reportes:[], feedback:[], saben:["Eduardo (responsable)"] },
  { id:4, nombre:"Charlas y ferias de carrera", tipo:"ini", area:"iye", uni:"ucn", etapa:2, calif:3,
    contacto:"Dirección de vinculación", objetivos:{ objetivo:"Presentar AMSA a estudiantes de último año.", alcance:"Dos ferias al año.", plazo:"Anual.", resultado:"Postulantes a prácticas." },
    readme:null, reportes:["Resumen feria 2026"], feedback:[], saben:["Jefatura de Inclusión y Empleo"] },
  { id:5, nombre:"Programa de prácticas y memorias", tipo:"pm", area:"iye", uni:"ua", etapa:1, calif:null,
    contacto:"Coordinación de prácticas", objetivos:vacio(), readme:null, reportes:[], feedback:[], saben:["Jefatura de Inclusión y Empleo"] },
  { id:6, nombre:"Relacionamiento institucional", tipo:"ini", area:"aco", uni:"uch", etapa:0, calif:null,
    contacto:"Escuela de Ingeniería", objetivos:vacio(), readme:null, reportes:[], feedback:[], saben:["Asuntos Corporativos"] },
  { id:7, nombre:"Desarrollo de proveedores locales", tipo:"ini", area:"aba", uni:"ua", etapa:1, calif:null,
    contacto:"Coordinación de prácticas", objetivos:vacio(), readme:null, reportes:[], feedback:[], saben:["Abastecimiento"] }
];
let avisos = [
  { id:1, titulo:"Contacto existente", texto:"Inclusión y Empleo también tiene un vínculo con la U. Católica del Norte.", ir:"#/uni/ucn", leido:false },
  { id:2, titulo:"Calificación pendiente", texto:"El convenio de investigación aplicada todavía no tiene calificación.", ir:"#/ficha/1", leido:false },
  { id:3, titulo:"Vínculo nuevo en otra área", texto:"Asuntos Corporativos registró un contacto inicial con la Universidad de Chile.", ir:"#/ficha/6", leido:false }
];
