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

  // Nombre de la plataforma.
  app: { sigla: "SIVA", nombre: "Sistema de Vínculos AMSA" },

  // Tipos de vínculo. "hitos" es el plan de trabajo que se propone al crear uno.
  // "criterios" es lo que se califica (de 1 a 5) al evaluar un vínculo de ese tipo.
  // "etapas" explica qué significa cada etapa en ese tipo de vínculo.
  tipos: [
    { id: "conv",   nombre: "Convenio", hitos: ["Definir alcance", "Revisión legal", "Firma", "Plan de trabajo anual", "Seguimiento anual"], criterios: ["Cumplimiento de lo acordado", "Rapidez de respuesta de la institución", "Utilidad para el área"], etapas: ["Conversando, sin acuerdo", "Revisión legal o firma", "Convenio vigente", "Convenio terminado"] },
    { id: "cons",   nombre: "Consejo o directorio", hitos: ["Designar representante", "Participar en sesiones", "Informar acuerdos al área"], criterios: ["Utilidad de las sesiones para el área", "Información que llega al área", "Relación con la institución"] },
    { id: "char",   nombre: "Charla o actividad", hitos: ["Coordinar fecha", "Difundir", "Realizar actividad", "Registrar asistentes", "Evaluar resultado"], criterios: ["Asistencia e interés de estudiantes", "Coordinación con la institución", "Postulaciones o contactos que generó"], etapas: ["Por coordinar con la institución", "Fecha y lugar confirmados", "Difusión o día de la actividad", "Ya se realizó"] },
    { id: "tal",    nombre: "Prácticas y memorias", hitos: ["Publicar oferta", "Seleccionar", "Inducción", "Seguimiento a mitad de periodo", "Cierre y evaluación"], criterios: ["Calidad de las y los estudiantes", "Rapidez de respuesta de la institución", "Calidad del trabajo entregado"], etapas: ["Definiendo cupos y temas", "Convocatoria publicada", "Estudiantes trabajando", "Terminó el periodo"] },
    { id: "acad",   nombre: "Proyecto académico (Capstone)", hitos: ["Definir desafío", "Kickoff con estudiantes", "Revisión intermedia", "Entrega final", "Evaluar resultado"], criterios: ["Calidad de lo entregado", "Compromiso de estudiantes y profesores", "Utilidad para el área"], etapas: ["Definiendo el desafío", "Acordado con el curso", "Estudiantes trabajando", "Entrega final hecha"] },
    { id: "prog",   nombre: "Programa de formación", hitos: ["Diseñar programa", "Convocar participantes", "Ejecutar", "Evaluar resultados"], criterios: ["Calidad del programa", "Participación", "Aplicación en el trabajo"] },
    { id: "emp",    nombre: "Empleo y oficios", hitos: ["Definir perfiles", "Convocar", "Formación", "Contratación", "Seguimiento"], criterios: ["Calidad de las y los candidatos", "Rapidez de respuesta de la institución", "Contrataciones logradas"] },
    { id: "inn",    nombre: "Proyecto de innovación o I+D", hitos: ["Definir problema", "Acuerdo o NDA", "Ejecución", "Resultados", "Decisión de escalamiento"], criterios: ["Calidad de los resultados", "Cumplimiento de plazos", "Potencial de escalamiento"] }
  ],

  // Rúbrica: qué significa cada nivel (1 a 5) de cada criterio de calificación.
  rubrica: {
    "Cumplimiento de lo acordado": ["No se cumplió casi nada", "Se cumplió menos de la mitad", "Se cumplió más o menos la mitad", "Se cumplió casi todo", "Se cumplió todo lo acordado"],
    "Rapidez de respuesta de la institución": ["No respondió", "Respondió después de un mes", "Respondió en dos a cuatro semanas", "Respondió en una semana", "Respondió en menos de tres días"],
    "Utilidad para el área": ["No le sirvió al área", "Sirvió poco y con mucho esfuerzo", "Sirvió en parte", "Sirvió para lo que se buscaba", "Sirvió más de lo esperado"],
    "Utilidad de las sesiones para el área": ["Las sesiones no aportaron", "Aportaron muy poco", "Aportaron a veces", "Casi siempre aportaron algo útil", "Cada sesión dejó algo útil"],
    "Información que llega al área": ["No llega información", "Llega tarde o incompleta", "Llega a veces", "Llega casi siempre", "Llega a tiempo y completa"],
    "Relación con la institución": ["La relación se cortó", "Hay roces o poca confianza", "Relación correcta, sin más", "Buena relación y confianza", "Relación muy cercana, se proponen cosas nuevas"],
    "Asistencia e interés de estudiantes": ["Casi nadie asistió", "Asistieron pocos y con poco interés", "Asistencia media", "Buena asistencia y preguntas", "Sala llena y mucho interés"],
    "Coordinación con la institución": ["No hubo coordinación", "Hubo que insistir mucho", "Coordinación con algunos problemas", "Coordinación fluida", "La institución tomó la iniciativa"],
    "Postulaciones o contactos que generó": ["No generó nada", "Uno o dos contactos", "Algunos contactos o postulaciones", "Varias postulaciones", "Muchas postulaciones de calidad"],
    "Calidad de las y los estudiantes": ["No cumplieron lo mínimo", "Cumplieron con mucha ayuda", "Cumplieron lo esperado con ayuda", "Buen nivel y autonomía", "Nivel destacado, se les quiere contratar"],
    "Calidad del trabajo entregado": ["No entregaron trabajo útil", "El trabajo no se pudo usar", "Se usó una parte", "Se usó casi todo", "Se usó completo y aportó ideas nuevas"],
    "Calidad de lo entregado": ["No entregaron nada útil", "Poco se pudo usar", "Se usó una parte", "Se usó casi todo", "Se usó completo y aportó ideas nuevas"],
    "Compromiso de estudiantes y profesores": ["Faltaron a casi todo", "Poco compromiso", "Compromiso irregular", "Buen compromiso", "Muy comprometidos de principio a fin"],
    "Calidad del programa": ["El programa no sirvió", "Muchos problemas de contenido", "Programa correcto", "Buen programa", "Programa excelente, se recomienda repetirlo"],
    "Participación": ["Casi nadie participó", "Menos de la mitad de los cupos", "Alrededor de la mitad de los cupos", "Casi todos los cupos", "Cupos llenos y lista de espera"],
    "Aplicación en el trabajo": ["No se aplica", "Se aplica muy poco", "Se aplica a veces", "Se aplica seguido", "Se aplica todos los días"],
    "Calidad de las y los candidatos": ["No cumplían los perfiles", "Pocos cumplían", "La mitad cumplía", "Casi todos cumplían", "Todos cumplían y algunos destacaron"],
    "Contrataciones logradas": ["Ninguna", "Menos de un cuarto de lo esperado", "Cerca de la mitad de lo esperado", "Casi todo lo esperado", "Se superó lo esperado"],
    "Calidad de los resultados": ["Sin resultados útiles", "Resultados débiles", "Resultados aceptables", "Buenos resultados", "Resultados que se pueden aplicar ya"],
    "Cumplimiento de plazos": ["No se cumplió ningún plazo", "Atrasos grandes", "Algunos atrasos", "Casi todo a tiempo", "Todo a tiempo"],
    "Potencial de escalamiento": ["No se puede escalar", "Muy difícil de escalar", "Se podría escalar con cambios grandes", "Se puede escalar con ajustes", "Listo para escalar a otras faenas"],
    "Calidad del resultado": ["Sin resultado útil", "Resultado débil", "Resultado aceptable", "Buen resultado", "Resultado destacado"]
  },

  tiposOrg: [
    "Universidad", "Centro de formación técnica", "Instituto profesional", "OTEC",
    "Centro de investigación", "Fundación", "Empresa", "Gremio o asociación", "Organismo público"
  ],

  // Salud del vínculo (semáforo en Mis vínculos). Días sin movimiento: reuniones,
  // cuestionarios o cambios en la ficha. Es una propuesta: falta validarla con la contraparte.
  salud: { alDia: 30, urgente: 60 },

  etapas: ["Exploración", "Formalización", "En ejecución", "Cerrado"],
  // Qué significa cada etapa cuando el tipo de vínculo no trae su propia explicación.
  etapasAyuda: ["Conversando, aún sin acuerdo", "Se está confirmando o firmando", "En marcha", "Terminó"],

  // Zonas para ver las instituciones por región.
  zonas: ["Norte", "Centro", "Sur", "Nacional"],

  // Carreras que se ofrecen en las convocatorias (se puede escribir otra).
  carreras: ["Ingeniería Civil de Minas", "Ingeniería Civil Industrial", "Ingeniería Civil Mecánica", "Ingeniería Civil Eléctrica", "Ingeniería Civil Química", "Ingeniería Civil Metalúrgica", "Geología", "Ingeniería Ambiental", "Ingeniería Comercial", "Psicología"],

  // AMSA: el corporativo y sus cuatro compañías mineras. El color siempre va con el nombre.
  companias: [
    { id: "corp", nombre: "Corporativo", color: "#6B5E5A" },
    { id: "mlp", nombre: "Los Pelambres", color: "#2E6B4A" },
    { id: "cen", nombre: "Centinela", color: "#3E6A9A" },
    { id: "ant", nombre: "Antucoya", color: "#A86A12" },
    { id: "zal", nombre: "Zaldívar", color: "#7C3F99" }
  ],

  // Metas a las que puede aportar un vínculo. La jefatura y administración las editan.
  // Una meta desactivada no aparece al registrar vínculos nuevos, pero se sigue viendo en Estadísticas.
  metas: ["Atracción de talento", "Marca empleadora", "Empleo local", "Mujeres en minería", "Formación de talento", "Proveedores locales", "Innovación con la academia"],

  // Perfiles de uso. El estudiante no inicia sesión: usa la página pública de convocatorias.
  roles: {
    // Los perfiles se nombran por lo que hacen en la plataforma, no por su cargo en la empresa.
    gestor: { nombre: "Responsable de vínculos", desc: "Registra y actualiza los vínculos de su área y crea convocatorias para estudiantes." },
    jefatura: { nombre: "Revisión y metas", desc: "Define las metas de su gerencia y revisa si los vínculos aportan a ellas. No registra vínculos." },
    admin: { nombre: "Configuración", desc: "Configura compañías, áreas, tipos de vínculo y metas. Ve todos los vínculos." }
  },

  // Quién financia el vínculo. "Presupuesto del área" pide además de qué partida sale.
  financiamientos: [
    "No definido", "Sin costo", "Presupuesto del área", "La institución",
    "Fondo externo (CORFO, ANID u otro)", "Mixto"
  ],

  // Usuarios de prueba del prototipo.
  usuarios: {
    eduardo:  { id: "eduardo", nombre: "Eduardo", correo: "antonia.sramosrodriguez+eduardo@gmail.com", inicial: "E", rol: "gestor", area: "rys", compania: "corp", admin: false },
    matias:   { id: "matias", nombre: "Matías", correo: "matias@amsa.ejemplo.cl", inicial: "M", rol: "gestor", area: "rys", compania: "corp", admin: false, nota: "Del mismo equipo que Eduardo: para probar el traspaso de un vínculo" },
    daniela:  { id: "daniela", nombre: "Daniela", correo: "daniela@amsa.ejemplo.cl", inicial: "D", rol: "gestor", area: "acds", compania: "cen", admin: false, nota: "Recién llega: aún no tiene vínculos" },
    carolina: { id: "carolina", nombre: "Carolina", correo: "carolina@amsa.ejemplo.cl", inicial: "C", rol: "jefatura", area: "doc", compania: "corp", admin: false },
    perfil0:  { id: "perfil0", nombre: "Perfil 0", correo: "perfil0@amsa.ejemplo.cl", inicial: "0", rol: "gestor", area: "rys", compania: "corp", admin: false, espacio: "vacio", nota: "Entra a la página vacía, sin ningún vínculo registrado, para probar desde cero" },
    perfil2:  { id: "perfil2", nombre: "Perfil 2", correo: "perfil2@amsa.ejemplo.cl", inicial: "2", rol: "gestor", area: "rys", compania: "corp", admin: false, espacio: "vacio2", nota: "Otra página vacía independiente del Perfil 0, para un segundo testeador en paralelo" },
    admin:    { id: "admin", nombre: "Administración", correo: "admin@amsa.ejemplo.cl", inicial: "A", rol: "admin", area: null, compania: null, admin: true }
  },

  // Si en el futuro hay un servidor propio (por ejemplo en Flask) que llame a la IA,
  // pon aquí su URL. Debe recibir POST {prompt} y responder JSON.
  aiEndpoint: "",

  // Logos oficiales (se cargan desde aminerals.cl). Si se guardan en assets/,
  // basta cambiar estas rutas, por ejemplo "assets/logo-amsa.png".
  logos: {
    color: "https://www.aminerals.cl/images/default-source/logos-amsa/logo-amsa.svg",
    blanco: "https://www.aminerals.cl/images/default-source/logos-amsa/antofagasta-mineralswt.png"
  }
};
