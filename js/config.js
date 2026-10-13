/* Configuración inicial: áreas, tipos de vínculo, tipos de organización y etapas.
   En la página, solo un administrador puede agregar o eliminar áreas y tipos
   (pantalla Administración). Estos son los valores con los que parte. */

const CONFIG = {
  // Árbol de áreas. parent = null es una vicepresidencia.
  areas: [
    { id: "vppo",  nombre: "VP Personas y Organización", parent: null },
    { id: "doc",   nombre: "Desarrollo Organizacional y Compensaciones", parent: "vppo" },
    { id: "rys",   nombre: "Reclutamiento y selección", parent: "doc" },
    { id: "aya",   nombre: "Aprendizaje y academia", parent: "doc" },
    { id: "iye",   nombre: "Inclusión y empleo", parent: "vppo" },

    { id: "vpac",  nombre: "VP Asuntos Corporativos", parent: null },
    { id: "apmlp", nombre: "Asuntos Públicos MLP", parent: "vpac" },
    { id: "ilmlp", nombre: "Intermediación laboral (MLP)", parent: "apmlp" },
    { id: "rimlp", nombre: "Relaciones institucionales (MLP)", parent: "apmlp" },
    { id: "apn",   nombre: "Asuntos Públicos Norte", parent: "vpac" },
    { id: "iln",   nombre: "Intermediación laboral (norte)", parent: "apn" },
    { id: "rin",   nombre: "Relaciones institucionales (norte)", parent: "apn" },
    { id: "acds",  nombre: "Asuntos Corporativos y Desarrollo Social", parent: "vpac" },
    { id: "apnac", nombre: "Asuntos Públicos (nacional)", parent: "acds" }
  ],

  // Tipos de vínculo. "hitos" es el plan de trabajo que se propone al crear uno.
  tipos: [
    { id: "conv",   nombre: "Convenio", hitos: ["Definir alcance", "Revisión legal", "Firma", "Plan de trabajo anual", "Seguimiento anual"] },
    { id: "cons",   nombre: "Consejo o directorio", hitos: ["Designar representante", "Participar en sesiones", "Informar acuerdos al área"] },
    { id: "char",   nombre: "Charla o actividad", hitos: ["Coordinar fecha", "Difundir", "Realizar actividad", "Registrar asistentes", "Evaluar resultado"] },
    { id: "tal",    nombre: "Prácticas y memorias", hitos: ["Publicar oferta", "Seleccionar", "Inducción", "Seguimiento a mitad de periodo", "Cierre y evaluación"] },
    { id: "acad",   nombre: "Proyecto académico (Capstone)", hitos: ["Definir desafío", "Kickoff con estudiantes", "Revisión intermedia", "Entrega final", "Evaluar resultado"] },
    { id: "prog",   nombre: "Programa de formación", hitos: ["Diseñar programa", "Convocar participantes", "Ejecutar", "Evaluar resultados"] },
    { id: "emp",    nombre: "Empleo y oficios", hitos: ["Definir perfiles", "Convocar", "Formación", "Contratación", "Seguimiento"] },
    { id: "inn",    nombre: "Proyecto de innovación o I+D", hitos: ["Definir problema", "Acuerdo o NDA", "Ejecución", "Resultados", "Decisión de escalamiento"] }
  ],

  tiposOrg: [
    "Universidad", "Centro de formación técnica", "Instituto profesional", "OTEC",
    "Centro de investigación", "Fundación", "Empresa", "Gremio o asociación", "Organismo público"
  ],

  etapas: ["Exploración", "Formalización", "En ejecución", "Cerrado"],

  // AMSA: el corporativo y sus cuatro compañías mineras. El color siempre va con el nombre.
  companias: [
    { id: "corp", nombre: "Corporativo", color: "#6B5E5A" },
    { id: "mlp", nombre: "Los Pelambres", color: "#2E6B4A" },
    { id: "cen", nombre: "Centinela", color: "#3E6A9A" },
    { id: "ant", nombre: "Antucoya", color: "#A86A12" },
    { id: "zal", nombre: "Zaldívar", color: "#7C3F99" }
  ],

  // Metas a las que puede aportar un vínculo. La jefatura y administración las editan.
  metas: ["Atracción de talento", "Marca empleadora", "Empleo local", "Mujeres en minería", "Formación de talento", "Proveedores locales", "Innovación con la academia"],

  // Perfiles de uso. El estudiante no inicia sesión: usa la página pública de convocatorias.
  roles: {
    gestor: { nombre: "Gestor/a de vinculación", desc: "Registra y actualiza los vínculos de su área y crea convocatorias para estudiantes." },
    jefatura: { nombre: "Jefatura", desc: "Revisa los resultados de su gerencia y define las metas. No registra vínculos." },
    admin: { nombre: "Administración", desc: "Configura compañías, áreas, tipos de vínculo y metas. Ve todo." }
  },

  financiamientos: [
    "Por definir", "Sin aporte monetario", "Financiado por AMSA",
    "Fondos externos (CORFO, ANID, etc.)", "Mixto"
  ],

  // Usuarios de prueba del prototipo.
  usuarios: {
    eduardo:  { id: "eduardo", nombre: "Eduardo", inicial: "E", rol: "gestor", area: "rys", compania: "corp", admin: false },
    daniela:  { id: "daniela", nombre: "Daniela", inicial: "D", rol: "gestor", area: "acds", compania: "cen", admin: false, nota: "Recién llega: aún no tiene vínculos" },
    carolina: { id: "carolina", nombre: "Carolina", inicial: "C", rol: "jefatura", area: "doc", compania: "corp", admin: false },
    admin:    { id: "admin", nombre: "Administración", inicial: "A", rol: "admin", area: null, compania: null, admin: true }
  },

  // Si en el futuro hay un servidor propio (por ejemplo en Flask) que llame a la IA,
  // pon aquí su URL. Debe recibir POST {prompt} y responder JSON.
  aiEndpoint: ""
};
