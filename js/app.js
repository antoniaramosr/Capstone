/* Lógica del prototipo: navegación (router), vistas y eventos.
   Depende de js/data.js, que se carga antes. */
/* ===================== Utilidades ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const area = id => AREAS.find(a => a.id === id);
const uni = id => UNIS.find(u => u.id === id);
const pill = e => `<span class="pill p${e}">${ETAPAS[e]}</span>`;
const dots = n => n ? `<span class="dots" aria-label="${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"":"off"}"></i>`).join("")}</span>` : `<span class="muted">Sin calificar</span>`;
const mios = () => vinculos.filter(v => v.area === USER.area);
const unisDeArea = aid => [...new Set(vinculos.filter(v=>v.area===aid).map(v=>v.uni))];
const areasDeUni = uid => [...new Set(vinculos.filter(v=>v.uni===uid).map(v=>v.area))];
const prom = arr => { const c = arr.filter(v=>v.calif); return c.length ? (c.reduce((s,v)=>s+v.calif,0)/c.length) : null; };
const fmt = n => n==null ? "Sin calificar" : "Promedio " + n.toLocaleString("es-CL",{maximumFractionDigits:1}) + " de 5";

let toastTimer, undoFn = null;
function toast(msg, undo){
  $("#toastMsg").textContent = msg;
  undoFn = undo || null;
  $("#toastUndo").hidden = !undo;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>$("#toast").classList.remove("show"), undo ? 6000 : 3200);
}
$("#toastUndo").onclick = () => { if(undoFn){ undoFn(); undoFn=null; } $("#toast").classList.remove("show"); };

/* ===================== Shell (header + mega menú) ===================== */
let logged = false, filtro = 0, filtroTipo = ""; // 0 = todos, 1..3 etapa+1

function megaHTML(kind){
  if(kind === "mis"){
    const cols = ETAPAS.map((et,i)=>{
      const vs = mios().filter(v=>v.etapa===i);
      return `<div class="mega-col"><h4>${et}</h4><ul>${vs.length ? vs.map(v=>`<li><a href="#/ficha/${v.id}">${esc(v.nombre)}<span class="mini">${esc(uni(v.uni).corto)}</span></a></li>`).join("") : `<li><span>Sin vínculos en esta etapa</span></li>`}</ul></div>`;
    }).join("");
    return `<div class="mega-intro"><h3>Mis vínculos</h3><p>Tus vínculos de ${esc(area(USER.area).nombre)}, ordenados por etapa.</p><a href="#/mis">Ver todos mis vínculos</a></div><div class="mega-cols">${cols}</div>`;
  }
  if(kind === "areas"){
    const cols = AREAS.map(a=>{
      const us = unisDeArea(a.id);
      return `<div class="mega-col"><h4><a href="#/area/${a.id}">${esc(a.nombre)}</a>${a.id===USER.area?'<span class="tag-mine">Mi área</span>':''}</h4><ul>
        ${us.map(u=>`<li><a href="#/uni/${u}">${esc(uni(u).corto)}</a></li>`).join("") || `<li><span>Sin universidades</span></li>`}
        <li><a href="mailto:${a.correo}">${esc(a.correo)}<span class="mini">Correo de contacto</span></a></li></ul></div>`;
    }).join("");
    return `<div class="mega-intro"><h3>Áreas de AMSA</h3><p>Cada área con las universidades con las que trabaja y su correo.</p><a href="#/areas">Ver todas las áreas</a></div><div class="mega-cols">${cols}</div>`;
  }
  if(kind === "unis"){
    const cols = UNIS.map(u=>{
      const as = areasDeUni(u.id);
      return `<div class="mega-col"><h4><a href="#/uni/${u.id}">${esc(u.corto)}</a></h4><ul>
        ${as.map(a=>`<li><a href="#/area/${a}">${esc(area(a).nombre)}</a></li>`).join("")}
        <li><a href="mailto:${u.correo}">${esc(u.contacto)}<span class="mini">${esc(u.correo)}</span></a></li></ul></div>`;
    }).join("");
    return `<div class="mega-intro"><h3>Universidades</h3><p>Cada universidad, su contacto y las áreas de AMSA que ya se relacionan con ella.</p><a href="#/unis">Ver todas las universidades</a></div><div class="mega-cols">${cols}</div>`;
  }
  return "";
}

function shell(active){
  const unread = avisos.filter(a=>!a.leido).length;
  const navs = [
    {k:"mis", t:"Mis vínculos", mega:true},
    {k:"areas", t:"Áreas", mega:true},
    {k:"unis", t:"Universidades", mega:true},
    {k:"stats", t:"Estadísticas"},
    {k:"pasantes", t:"Pasantes"}
  ];
  return `
  <header class="top" id="top">
    <div class="top-inner">
      <a class="logo" href="#/mis"><b>Vínculos</b><span>AMSA y universidades</span></a>
      <nav class="nav" aria-label="Secciones">
        ${navs.map(n=>`<div class="nav-item" data-k="${n.k}" ${n.mega?'data-mega="1"':''}>
          <button class="nav-btn ${active===n.k?"active":""}" data-go="${n.k}" ${n.mega?'aria-haspopup="true" aria-expanded="false"':''}>${n.t}${n.mega?'<i class="caret"></i>':''}</button></div>`).join("")}
      </nav>
      <div class="top-right">
        <button class="btn-ghost-dark" id="btnAvisos" aria-haspopup="true">Avisos <span class="badge ${unread?"":"zero"}">${unread}</span></button>
        <button class="btn-accent" onclick="location.hash='#/add'">+ Añadir vínculo</button>
        <button class="user" id="btnUser" aria-haspopup="true"><span class="avatar">E</span><div><b>${USER.nombre}</b><small>${esc(area(USER.area).nombre)}</small></div></button>
      </div>
    </div>
    <div class="mega" id="mega"><div class="mega-inner" id="megaInner"></div></div>
    <div class="pop pop-avisos" id="popAvisos"><h5>Avisos</h5>${avisos.length ? avisos.map(a=>`
      <button class="pop-item ${a.leido?"read":""}" data-aviso="${a.id}"><i class="dot"></i><div><b>${esc(a.titulo)}</b><small>${esc(a.texto)}</small></div></button>`).join("") : `<div class="pop-empty">No tienes avisos.</div>`}
    </div>
    <div class="pop pop-user" id="popUser">
      <button class="pop-item" onclick="toast('Perfil: disponible en la siguiente versión')">Perfil</button>
      <button class="pop-item" id="userAvisos">Avisos (${unread})</button>
      <button class="pop-item" onclick="logout()">Cerrar sesión</button>
    </div>
  </header>`;
}

function wireShell(){
  const mega = $("#mega"), inner = $("#megaInner");
  let hideT, openK = null;
  const close = () => { mega.classList.remove("show"); document.querySelectorAll(".nav-item").forEach(n=>{n.classList.remove("open"); n.querySelector("button").setAttribute("aria-expanded", n.dataset.mega?"false":null)}); openK=null; };
  const open = (k, item) => {
    clearTimeout(hideT);
    if(openK === k) return;
    inner.innerHTML = megaHTML(k);
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("open"));
    item.classList.add("open"); item.querySelector("button").setAttribute("aria-expanded","true");
    mega.classList.add("show"); openK = k;
    closePops();
  };
  const desktop = () => window.matchMedia("(min-width:761px) and (hover:hover)").matches;
  document.querySelectorAll(".nav-item").forEach(item=>{
    const k = item.dataset.k, btn = item.querySelector("button");
    if(item.dataset.mega){
      item.addEventListener("mouseenter", ()=>{ if(desktop()) open(k,item); });
      item.addEventListener("mouseleave", ()=>{ hideT = setTimeout(close, 180); });
    }
    btn.addEventListener("click", ()=>{
      if(item.dataset.mega && !desktop()){ openK===k ? close() : open(k,item); return; }
      close(); location.hash = "#/" + k;
    });
    btn.addEventListener("keydown", e=>{ if(item.dataset.mega && (e.key==="ArrowDown")){ e.preventDefault(); open(k,item); const f = inner.querySelector("a"); f && f.focus(); } });
  });
  mega.addEventListener("mouseenter", ()=>clearTimeout(hideT));
  mega.addEventListener("mouseleave", ()=>{ hideT = setTimeout(close,180); });
  mega.addEventListener("click", e=>{ if(e.target.closest("a")) close(); });

  $("#btnAvisos").onclick = e => { e.stopPropagation(); close(); togglePop("#popAvisos"); };
  $("#btnUser").onclick = e => { e.stopPropagation(); close(); togglePop("#popUser"); };
  $("#userAvisos").onclick = e => { e.stopPropagation(); closePops(); togglePop("#popAvisos"); };
  document.querySelectorAll("[data-aviso]").forEach(b=> b.onclick = () => abrirAviso(+b.dataset.aviso));
  document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ close(); closePops(); } });
}
function closePops(){ document.querySelectorAll(".pop").forEach(p=>p.classList.remove("show")); }
function togglePop(sel){ const p = $(sel); const was = p.classList.contains("show"); closePops(); if(!was) p.classList.add("show"); }
document.addEventListener("click", e=>{ if(!e.target.closest(".pop")) closePops(); });
function abrirAviso(id){ const a = avisos.find(x=>x.id===id); a.leido = true; closePops(); if(location.hash===a.ir) render(); else location.hash = a.ir; }
function logout(){ logged=false; location.hash="#/login"; render(); }

/* ===================== Vistas ===================== */
function vLogin(){
  return `<div class="login">
    <div class="login-art">
      <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        ${Array.from({length:14},(_,i)=>{const r=40+i*30;return `<path d="M${300-r} 300 C ${300-r} ${300-r*0.9}, ${300+r*0.7} ${300-r*1.05}, ${300+r} ${300-r*0.2} S ${300+r*0.6} ${300+r*1.1}, ${300-r*0.3} ${300+r*0.85} S ${300-r} ${300+r*0.3}, ${300-r} 300Z" fill="none" stroke="#fff" stroke-width="1"/>`}).join("")}
      </svg>
      <div class="txt"><b style="font-size:18px">Vínculos</b><br><span style="font-size:12px;opacity:.7">AMSA y universidades</span></div>
      <div class="txt"><h2>Quién en AMSA ya trabaja con cada universidad</h2>
        <p>Registra tus vínculos, revisa qué hacen otras áreas antes de escribirle a una universidad y califica cómo resultó cada colaboración.</p></div>
    </div>
    <div class="login-form"><div class="login-box">
      <h1>Ingresa</h1><p class="sub">Usa tu cuenta corporativa de AMSA. No necesitas crear una cuenta nueva.</p>
      <label class="f" for="lmail">Correo AMSA</label>
      <input class="input" id="lmail" value="eduardo@ejemplo.cl" autocomplete="off">
      <button class="btn-accent sso" id="btnLogin">Ingresar con cuenta AMSA</button>
      <p class="help" style="margin-top:14px">Prototipo: los datos son ficticios.</p>
    </div></div>
  </div>`;
}

function filaVinculo(v, opts={}){
  const u = uni(v.uni);
  return `<tr class="row" data-ficha="${v.id}" tabindex="0">
    <td><span class="t">${esc(v.nombre)}</span><small>${opts.area?esc(area(v.area).nombre)+", ":""}${esc(tipo(v.tipo).nombre)}</small></td>
    <td>${esc(u.corto)}<small>${esc(v.contacto)}</small></td>
    <td>${pill(v.etapa)}</td>
    <td>${dots(v.calif)}</td></tr>`;
}
function tablaVinculos(list, opts={}){
  if(!list.length) return `<div class="empty">${opts.vacio || "No hay vínculos para mostrar."}</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Vínculo</th><th>Universidad y contacto</th><th>Etapa</th><th>Calificación</th></tr></thead>
    <tbody>${list.map(v=>filaVinculo(v,opts)).join("")}</tbody></table></div>`;
}
function avisosCard(){
  return `<div class="card"><p class="card-title">Avisos</p>${avisos.length ? avisos.map(a=>`
    <button class="aviso ${a.leido?"read":""}" data-aviso="${a.id}"><b>${esc(a.titulo)}</b>${esc(a.texto)}</button>`).join("") : `<p class="muted" style="margin:0;font-size:12.5px">No tienes avisos.</p>`}</div>`;
}

function vMis(){
  const mine = mios();
  const counts = [mine.length, ...ETAPAS.map((_,i)=>mine.filter(v=>v.etapa===i).length)];
  const list = (filtro===0 ? mine : mine.filter(v=>v.etapa===filtro-1)).filter(v=>!filtroTipo || v.tipo===filtroTipo);
  const misUnis = [...new Set(mine.map(v=>v.uni))];
  const otras = vinculos.filter(v=>v.area!==USER.area && misUnis.includes(v.uni));
  return `<h1>Mis vínculos</h1><p class="sub">Área ${esc(area(USER.area).nombre)}. ${mine.length} vínculos con universidades.</p>
  <div class="grid-main"><div>
    <div class="chips" role="tablist">${["Todos",...ETAPAS].map((t,i)=>`<button class="chip-btn ${filtro===i?"on":""}" data-filtro="${i}" role="tab" aria-selected="${filtro===i}">${t} (${counts[i]})</button>`).join("")}
      <select class="input" id="fTipoFiltro" style="width:auto;margin-left:auto;padding:5px 10px;font-size:12px;border-radius:20px" aria-label="Filtrar por tipo de vínculo"><option value="">Todos los tipos</option>${TIPOS.map(t=>`<option value="${t.id}" ${filtroTipo===t.id?"selected":""}>${t.nombre}</option>`).join("")}</select></div>
    <div class="card">${tablaVinculos(list,{vacio:`No tienes vínculos con este filtro.`})}</div>
    <div class="card"><p class="card-title">Otras áreas con mis universidades</p>
      <p class="sub" style="margin-top:-6px">Lo que otras áreas de AMSA ya están haciendo con las universidades donde tienes vínculos.</p>
      ${otras.length ? `<div class="table-wrap"><table><tbody>${otras.map(v=>`<tr class="row" data-ficha="${v.id}" tabindex="0"><td class="t">${esc(uni(v.uni).corto)}</td><td>${esc(area(v.area).nombre)}</td><td>${esc(v.nombre)}</td><td>${pill(v.etapa)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Ninguna otra área trabaja con tus universidades.</div>`}
    </div>
  </div>
  <aside>${avisosCard()}</aside></div>`;
}

function vFicha(id){
  const v = vinculos.find(x=>x.id===id);
  if(!v) return `<div class="card empty">Ese vínculo no existe o fue eliminado.<br><button class="btn-outline" onclick="location.hash='#/mis'">Volver a Mis vínculos</button></div>`;
  const u = uni(v.uni), mio = v.area===USER.area;
  const otras = vinculos.filter(x=>x.uni===v.uni && x.id!==v.id);
  const o = v.objetivos;
  const kv = (k,val) => `<dt>${k}</dt><dd class="${val?"":"ph"}">${val?esc(val):"[por definir]"}</dd>`;
  return `<div class="crumbs"><a href="#/${mio?"mis":"area/"+v.area}">${mio?"Mis vínculos":esc(area(v.area).nombre)}</a> / ${esc(v.nombre)}</div>
  <div class="head-row"><div><h1>${esc(v.nombre)}</h1><p class="sub">${esc(tipo(v.tipo).nombre)}. Área ${esc(area(v.area).nombre)} con la ${esc(u.nombre)}</p></div>
    <div class="stepper" aria-label="Etapa del vínculo">${ETAPAS.map((e,i)=>`${i?'<i class="bar"></i>':""}<button class="step ${i===v.etapa?"cur":i<v.etapa?"done":""}" data-etapa="${i}" ${mio?"":"disabled"} title="${mio?"Mover a "+e:"Solo el área responsable cambia la etapa"}"><span>${i<v.etapa?"✓":i+1}</span>${e}</button>`).join("")}</div>
  </div>
  <div class="grid-main"><div>
    <div class="card"><div class="head-row"><p class="card-title">Objetivos del proyecto (README)</p>${mio?`<button class="link-btn" id="editObj">Editar</button>`:""}</div>
      <div id="objView"><dl class="kv">${kv("Objetivo",o.objetivo)}${kv("Alcance",o.alcance)}${kv("Plazo",o.plazo)}${kv("Resultado esperado",o.resultado)}</dl></div>
      <div id="objEdit" hidden>${["objetivo","alcance","plazo","resultado"].map(k=>`<label class="f" for="o_${k}">${k==="resultado"?"Resultado esperado":k[0].toUpperCase()+k.slice(1)}</label><input class="input" id="o_${k}" value="${esc(o[k])}">`).join("")}
        <div class="form-actions"><button class="btn-accent" id="saveObj">Guardar objetivos</button><button class="btn-outline" id="cancelObj">Cancelar</button></div></div>
      <div class="file-row"><span>${v.readme?`README adjunto: <b>${esc(v.readme)}</b>`:"Sin archivo README adjunto"}</span>${mio?`<label class="link-btn" style="cursor:pointer">${v.readme?"Reemplazar":"Subir README"}<input type="file" id="readmeFile" hidden></label>`:""}</div>
    </div>
    <div class="card"><p class="card-title">Reportes</p>
      ${v.reportes.length ? v.reportes.map(r=>`<div class="list-row"><span>${esc(r)}</span><button class="link-btn" onclick="toast('Vista previa del reporte (no incluida en el prototipo)')">Ver</button></div>`).join("") : `<p class="muted" style="margin:0 0 4px;font-size:12.5px">Aún no hay reportes.</p>`}
      ${mio?`<div id="repBox"><button class="btn-outline" style="margin-top:12px" id="addRep">Agregar reporte</button></div>`:""}
    </div>
    <div class="card"><p class="card-title">Feedback</p>
      ${v.feedback.map(f=>`<div class="fb">${esc(f.t)}<small>${esc(f.q)}</small></div>`).join("") || `<p class="muted" style="margin:0;font-size:12.5px">Todavía no hay comentarios sobre esta colaboración.</p>`}
      <div class="inline-form"><input class="input" id="fbIn" placeholder="Escribe cómo va la colaboración"><button class="btn-accent" id="fbSave">Guardar</button></div>
    </div>
  </div>
  <aside>
    <div class="card side"><p class="card-title">Con quién</p><h4>${esc(u.nombre)}</h4><p>${esc(v.contacto)}</p><a class="mail" href="mailto:${u.correo}">${esc(u.correo)}</a>
      ${otras.length?otras.map(x=>`<div class="note"><b>Otra área con esta universidad</b>${esc(area(x.area).nombre)}: ${esc(x.nombre)}</div>`).join(""):""}
    </div>
    <div class="card side"><p class="card-title">Quiénes en AMSA tienen conocimiento</p>${v.saben.map(s=>`<p style="color:var(--ink);margin-bottom:4px">${esc(s)}</p>`).join("")}</div>
    <div class="card side"><p class="card-title">Calificación de la colaboración</p>
      <div class="rate ${v.etapa===2&&mio?"":"locked"}">${[1,2,3,4,5].map(i=>`<button data-rate="${i}" class="${v.calif&&i<=v.calif?"on":""}" aria-label="Calificar ${i} de 5" ${v.etapa===2&&mio?"":"disabled"}>${i}</button>`).join("")}</div>
      <p>${v.etapa!==2?"Se califica de 1 a 5 al cerrar el vínculo.":v.calif?`Calificado con ${v.calif} de 5.`:"Elige de 1 a 5 cómo resultó la colaboración."}</p>
    </div>
  </aside></div>`;
}

function vAreas(){
  return `<h1>Áreas</h1><p class="sub">Cada área de AMSA, su correo de contacto y las universidades con las que se vincula.</p>
  <div class="cards2">${AREAS.map(a=>{const us=unisDeArea(a.id), n=vinculos.filter(v=>v.area===a.id).length;
    return `<button class="ecard" onclick="location.hash='#/area/${a.id}'"><div class="h"><h3>${esc(a.nombre)}</h3>${a.id===USER.area?'<span class="mine">Mi área</span>':""}</div>
    <div class="mail">${esc(a.correo)}</div><hr><div class="lbl">Universidades</div>${us.map(u=>`<span class="tag">${esc(uni(u).corto)}</span>`).join("")||'<span class="muted">Ninguna</span>'}<div class="n">${n} ${n===1?"vínculo":"vínculos"}</div></button>`}).join("")}</div>`;
}
function vUnis(){
  return `<h1>Universidades</h1><p class="sub">Cada universidad, su contacto y las áreas de AMSA que ya se relacionan con ella.</p>
  <div class="cards2">${UNIS.map(u=>{const as=areasDeUni(u.id), n=vinculos.filter(v=>v.uni===u.id).length;
    return `<button class="ecard" onclick="location.hash='#/uni/${u.id}'"><div class="h"><h3>${esc(u.nombre)}</h3>${as.length>1?`<span class="cnt">${as.length} áreas en contacto</span>`:""}</div>
    <div class="who">${esc(u.contacto)}</div><div class="mail">${esc(u.correo)}</div><hr><div class="lbl">Áreas de AMSA</div>${as.map(a=>`<span class="tag">${esc(area(a).nombre)}</span>`).join("")}<div class="n">${n} ${n===1?"vínculo":"vínculos"}</div></button>`}).join("")}</div>`;
}
function vArea(id){
  const a = area(id); if(!a) return vAreas();
  const list = vinculos.filter(v=>v.area===id);
  return `<div class="crumbs"><a href="#/areas">Áreas</a> / ${esc(a.nombre)}</div>
  <h1>${esc(a.nombre)}</h1><p class="sub"><a class="mail" style="color:var(--accent)" href="mailto:${a.correo}">${esc(a.correo)}</a> · ${list.length} vínculos · ${fmt(prom(list))}</p>
  <div class="card">${tablaVinculos(list)}</div>`;
}
function vUni(id){
  const u = uni(id); if(!u) return vUnis();
  const list = vinculos.filter(v=>v.uni===id);
  return `<div class="crumbs"><a href="#/unis">Universidades</a> / ${esc(u.corto)}</div>
  <div class="head-row"><div><h1>${esc(u.nombre)}</h1><p class="sub">${esc(u.contacto)}, <a style="color:var(--accent)" href="mailto:${u.correo}">${esc(u.correo)}</a></p></div>
  <button class="btn-accent" onclick="nuevoCon('${id}')">+ Añadir vínculo con esta universidad</button></div>
  <div class="grid-main"><div class="card">${tablaVinculos(list,{area:true})}</div>
  <aside><div class="card side"><p class="card-title">Resumen</p><p style="color:var(--ink)">${areasDeUni(id).length} áreas en contacto</p><p>${fmt(prom(list))}</p><p>${PASANTES.porUni[id]||0} pasantes y memoristas hoy</p><div style="margin-top:10px">${[...new Set(list.map(v=>v.tipo))].map(t=>`<span class="tag">${esc(tipo(t).nombre)}</span>`).join("")}</div></div></aside></div>`;
}

function barras(rows, max, conS=true){
  return rows.map(r=>`<div class="brow"><span class="nm">${esc(r.n)}</span><span class="track"><i style="width:${max?r.v/max*100:0}%"></i></span><span class="v">${r.v}</span>${conS?`<span class="s">${r.s}</span>`:""}</div>`).join("");
}
function vStats(){
  const calif = vinculos.filter(v=>v.calif);
  const pa = AREAS.map(a=>{const l=vinculos.filter(v=>v.area===a.id);return {n:a.nombre,v:l.length,s:fmt(prom(l))}}).sort((x,y)=>y.v-x.v);
  const pu = UNIS.map(u=>{const l=vinculos.filter(v=>v.uni===u.id);return {n:u.corto,v:l.length,s:fmt(prom(l))}}).sort((x,y)=>y.v-x.v);
  const max = Math.max(...pa.map(r=>r.v),...pu.map(r=>r.v));
  const areasCon = AREAS.filter(a=>vinculos.some(v=>v.area===a.id)).length;
  const p = prom(vinculos);
  return `<h1>Estadísticas</h1><p class="sub">Cuántos vínculos hay y cómo resultaron, por área y por universidad.</p>
  <div class="kpis"><div class="kpi"><b>${vinculos.length}</b><span>vínculos registrados</span></div>
    <div class="kpi"><b>${areasCon}</b><span>áreas con vínculos</span></div>
    <div class="kpi"><b>${p?p.toLocaleString("es-CL",{maximumFractionDigits:1}):"–"}</b><span>calificación promedio, sobre ${calif.length} vínculos calificados</span></div></div>
  <div class="bars2"><div class="card"><p class="card-title">Vínculos por área</p>${barras(pa,max)}</div>
    <div class="card"><p class="card-title">Vínculos por universidad</p>${barras(pu,max)}</div>
    <div class="card"><p class="card-title">Vínculos por tipo</p>${barras(TIPOS.map(t=>{const l=vinculos.filter(v=>v.tipo===t.id);return {n:t.nombre,v:l.length,s:fmt(prom(l))}}).sort((x,y)=>y.v-x.v),max)}</div></div>`;
}
function vPasantes(){
  const pu = UNIS.map(u=>({n:u.corto,v:PASANTES.porUni[u.id]||0})).sort((a,b)=>b.v-a.v);
  const pa = AREAS.map(a=>({n:a.nombre,v:PASANTES.porArea[a.id]||0})).sort((a,b)=>b.v-a.v);
  const max = Math.max(...pu.map(r=>r.v),...pa.map(r=>r.v));
  return `<h1>Pasantes</h1><p class="sub">Cuántos pasantes y memoristas hay hoy en AMSA, de qué universidad vienen y qué área los maneja.</p>
  <div class="pas"><div><div class="kpi"><b>${PASANTES.total}</b><span>pasantes y memoristas hoy</span></div>
    <div class="note" style="margin-top:12px"><b>Solo cantidades</b>La plataforma no guarda datos de cada estudiante ni sigue su proceso.</div></div>
    <div class="card"><p class="card-title">Por universidad</p>${barras(pu,max,false)}</div>
    <div class="card"><p class="card-title">Por área</p>${barras(pa,max,false)}</div></div>`;
}

let preUni = "";
function nuevoCon(id){ preUni = id; location.hash = "#/add"; }
const PLANTILLA = "Objetivo: \nAlcance: \nPlazo: \nResultado esperado: ";
function vAdd(){
  return `<div class="crumbs"><a href="#/mis">Mis vínculos</a> / Añadir vínculo</div>
  <h1>Añadir vínculo</h1><p class="sub">Registrar toma menos de un minuto. El vínculo se crea en la etapa Contacto inicial.</p>
  <div class="grid-main" style="grid-template-columns:minmax(0,1fr) 340px"><div class="card">
    <label class="f" for="fNom">Nombre del vínculo</label>
    <input class="input" id="fNom" placeholder="Ej.: Mesa de trabajo con carreras de ingeniería">
    <div class="err" id="eNom">Escribe un nombre para reconocer el vínculo.</div>
    <label class="f" id="lTipo">Tipo de vínculo</label>
    <div class="tipos" role="radiogroup" aria-labelledby="lTipo">${TIPOS.map(t=>`<label class="tipo"><input type="radio" name="fTipo" value="${t.id}"><span><b>${t.nombre}</b>${t.desc}</span></label>`).join("")}</div>
    <div class="err" id="eTipo">Elige qué tipo de vínculo es.</div>
    <label class="f" for="fUni">Universidad</label>
    <select class="input" id="fUni"><option value="">Elige una universidad</option>${UNIS.map(u=>`<option value="${u.id}" ${preUni===u.id?"selected":""}>${esc(u.nombre)}</option>`).join("")}</select>
    <div class="err" id="eUni">Elige la universidad para revisar si otra área ya tiene contacto.</div>
    <label class="f" for="fCon">Contacto en la universidad</label>
    <input class="input" id="fCon" placeholder="Unidad o persona, y su correo">
    <label class="f" for="fObj">Objetivos del proyecto (plantilla README)</label>
    <textarea class="input" id="fObj">${PLANTILLA}</textarea>
    <div class="help">Puedes dejar campos en blanco y completarlos después en la ficha.</div>
    <label class="f">Subir README (opcional)</label>
    <label class="drop" id="dropLbl"><span id="dropTxt">Arrastra el archivo aquí o elige uno</span><input type="file" id="fFile" hidden></label>
    <div class="form-actions"><button class="btn-accent" id="crear">Crear vínculo</button><button class="btn-outline" onclick="history.length>1?history.back():location.hash='#/mis'">Cancelar</button></div>
  </div>
  <aside id="dupBox"></aside></div>`;
}
function dupHTML(uid){
  if(!uid) return `<div class="calm"><b>Revisión de contacto</b>Al elegir la universidad te mostramos si otra área de AMSA ya trabaja con ella.</div>`;
  const vs = vinculos.filter(v=>v.uni===uid);
  const u = uni(uid);
  if(!vs.length) return `<div class="calm"><b>Sin contactos previos</b>Nadie en AMSA tiene vínculos registrados con la ${esc(u.nombre)}. Serás el primer punto de contacto.</div>`;
  const as = [...new Set(vs.map(v=>v.area))];
  const num = ["","Un área","Dos áreas","Tres áreas","Cuatro áreas"][as.length] || as.length+" áreas";
  return `<div class="warn"><div class="k">YA HAY CONTACTO CON ESTA UNIVERSIDAD</div><h3>${num} ya ${as.length>1?"trabajan":"trabaja"} con la ${esc(u.nombre)}.</h3>
    ${vs.map(v=>`<div class="it"><b>${esc(area(v.area).nombre)}${v.area===USER.area?" (tu área)":""}</b>${esc(v.nombre)}. ${esc(tipo(v.tipo).nombre)}, ${ETAPAS[v.etapa].toLowerCase()}.${v.area!==USER.area?`<br><a class="warn-link" href="mailto:${area(v.area).correo}?subject=${encodeURIComponent("Vínculo con "+u.corto)}">Escribir a ${esc(area(v.area).nombre)}</a>`:""}</div>`).join("")}
    <p>Antes de escribirle a la universidad, conviene hablar con estas áreas. Es solo un aviso: puedes crear el vínculo igual.</p></div>`;
}

/* ===================== Router ===================== */
function render(){
  const h = location.hash || "#/login";
  const [ , r, p ] = h.split("/");
  const app = $("#app");
  if(!logged && r!=="login"){ location.hash = "#/login"; return; }
  if(r==="login" || !r){
    app.innerHTML = vLogin();
    $("#btnLogin").onclick = () => { logged = true; location.hash = "#/mis"; };
    return;
  }
  const activeMap = {mis:"mis",ficha:"mis",add:"",areas:"areas",area:"areas",unis:"unis",uni:"unis",stats:"stats",pasantes:"pasantes"};
  let body = "";
  switch(r){
    case "mis": body = vMis(); break;
    case "ficha": body = vFicha(+p); break;
    case "areas": body = vAreas(); break;
    case "area": body = vArea(p); break;
    case "unis": body = vUnis(); break;
    case "uni": body = vUni(p); break;
    case "stats": body = vStats(); break;
    case "pasantes": body = vPasantes(); break;
    case "add": body = vAdd(); break;
    default: body = `<div class="card empty">No encontramos esta página.<br><button class="btn-outline" onclick="location.hash='#/mis'">Ir a Mis vínculos</button></div>`;
  }
  app.innerHTML = shell(activeMap[r]) + `<main id="main">${body}</main><div class="proto">Prototipo IDI2025 · datos ficticios</div>`;
  wireShell();
  wireView(r, p);
  window.scrollTo(0,0);
}

function wireView(r, p){
  document.querySelectorAll("[data-ficha]").forEach(tr=>{
    const go = () => location.hash = "#/ficha/" + tr.dataset.ficha;
    tr.onclick = go; tr.onkeydown = e => { if(e.key==="Enter") go(); };
  });
  document.querySelectorAll("main [data-aviso]").forEach(b=> b.onclick = () => abrirAviso(+b.dataset.aviso));
  document.querySelectorAll("[data-filtro]").forEach(b=> b.onclick = () => { filtro = +b.dataset.filtro; render(); });
  const ftf = $("#fTipoFiltro"); if(ftf) ftf.onchange = () => { filtroTipo = ftf.value; render(); };

  if(r==="ficha"){
    const v = vinculos.find(x=>x.id===+p); if(!v) return;
    document.querySelectorAll("[data-etapa]").forEach(b=> b.onclick = () => {
      const nueva = +b.dataset.etapa, antes = v.etapa;
      if(nueva===antes) return;
      v.etapa = nueva;
      let avisoNuevo = null;
      if(nueva===2 && !v.calif){ avisoNuevo = { id:Date.now(), titulo:"Calificación pendiente", texto:`Cerraste "${v.nombre}". Califica cómo resultó la colaboración.`, ir:"#/ficha/"+v.id, leido:false }; avisos.unshift(avisoNuevo); }
      render();
      toast(`Etapa cambiada a ${ETAPAS[nueva]}`, () => { v.etapa = antes; if(avisoNuevo) avisos = avisos.filter(a=>a!==avisoNuevo); render(); });
    });
    const ed = $("#editObj");
    if(ed){
      ed.onclick = () => { $("#objView").hidden = true; $("#objEdit").hidden = false; ed.hidden = true; $("#o_objetivo").focus(); };
      $("#cancelObj").onclick = () => render();
      $("#saveObj").onclick = () => { ["objetivo","alcance","plazo","resultado"].forEach(k=> v.objetivos[k] = $("#o_"+k).value.trim()); render(); toast("Objetivos guardados"); };
    }
    const rf = $("#readmeFile"); if(rf) rf.onchange = () => { if(rf.files[0]){ v.readme = rf.files[0].name; render(); toast("README subido"); } };
    const ar = $("#addRep");
    if(ar) ar.onclick = () => {
      $("#repBox").innerHTML = `<div class="inline-form"><input class="input" id="repIn" placeholder="Nombre del reporte, ej.: Reporte de avance ${v.reportes.length+1}"><button class="btn-accent" id="repOk">Agregar reporte</button></div>`;
      $("#repIn").focus();
      const ok = () => { const t = $("#repIn").value.trim() || `Reporte de avance ${v.reportes.length+1}`; v.reportes.push(t); render(); toast("Reporte agregado"); };
      $("#repOk").onclick = ok; $("#repIn").onkeydown = e => { if(e.key==="Enter") ok(); };
    };
    const save = () => { const t = $("#fbIn").value.trim(); if(!t){ $("#fbIn").classList.add("bad"); $("#fbIn").placeholder="Escribe un comentario antes de guardar"; $("#fbIn").focus(); return; } v.feedback.push({t, q:USER.nombre+" · hoy"}); render(); toast("Feedback guardado"); };
    $("#fbSave").onclick = save; $("#fbIn").onkeydown = e => { if(e.key==="Enter") save(); };
    document.querySelectorAll("[data-rate]").forEach(b=> b.onclick = () => {
      const antes = v.calif; v.calif = +b.dataset.rate;
      avisos.forEach(a=>{ if(a.ir==="#/ficha/"+v.id && a.titulo==="Calificación pendiente") a.leido = true; });
      render(); toast(`Calificado con ${v.calif} de 5`, () => { v.calif = antes; render(); });
    });
  }

  if(r==="add"){
    const sel = $("#fUni"), box = $("#dupBox"), con = $("#fCon");
    const upd = () => {
      box.innerHTML = dupHTML(sel.value);
      const u = uni(sel.value);
      if(u && (!con.value || con.dataset.auto)){ con.value = `${u.contacto}, ${u.correo}`; con.dataset.auto = "1"; }
      if(sel.value){ sel.classList.remove("bad"); $("#eUni").classList.remove("show"); }
    };
    sel.onchange = upd; con.oninput = () => delete con.dataset.auto; upd(); preUni = "";
    document.querySelectorAll('input[name="fTipo"]').forEach(r=> r.onchange = () => { $(".tipos").classList.remove("bad"); $("#eTipo").classList.remove("show"); });
    $("#fNom").oninput = () => { $("#fNom").classList.remove("bad"); $("#eNom").classList.remove("show"); };
    const ff = $("#fFile");
    ff.onchange = () => { if(ff.files[0]) $("#dropTxt").innerHTML = `Archivo listo: <b>${esc(ff.files[0].name)}</b>`; };
    const dl = $("#dropLbl");
    dl.ondragover = e => { e.preventDefault(); dl.style.borderColor = "var(--accent)"; };
    dl.ondragleave = () => dl.style.borderColor = "";
    dl.ondrop = e => { e.preventDefault(); dl.style.borderColor=""; const f = e.dataTransfer.files[0]; if(f){ dl.dataset.file = f.name; $("#dropTxt").innerHTML = `Archivo listo: <b>${esc(f.name)}</b>`; } };
    $("#crear").onclick = () => {
      const nom = $("#fNom").value.trim(); let ok = true;
      if(!nom){ $("#fNom").classList.add("bad"); $("#eNom").classList.add("show"); ok = false; }
      const tp = document.querySelector('input[name="fTipo"]:checked');
      if(!tp){ $(".tipos").classList.add("bad"); $("#eTipo").classList.add("show"); ok = false; }
      if(!sel.value){ sel.classList.add("bad"); $("#eUni").classList.add("show"); ok = false; }
      if(!ok){ (!nom ? $("#fNom") : !tp ? document.querySelector('input[name="fTipo"]') : sel).focus(); return; }
      const txt = $("#fObj").value, get = k => { const m = txt.match(new RegExp(k+":\\s*(.*)","i")); return m ? m[1].trim() : ""; };
      const nuevo = { id:nextId++, nombre:nom, tipo:tp.value, area:USER.area, uni:sel.value, etapa:0, calif:null,
        contacto: (con.value.split(",")[0] || uni(sel.value).contacto).trim(),
        objetivos:{ objetivo:get("Objetivo"), alcance:get("Alcance"), plazo:get("Plazo"), resultado:get("Resultado esperado") },
        readme: (ff.files[0] && ff.files[0].name) || dl.dataset.file || null, reportes:[], feedback:[], saben:[USER.nombre+" (responsable)"] };
      vinculos.push(nuevo);
      location.hash = "#/ficha/" + nuevo.id;
      setTimeout(()=>toast("Vínculo creado en la etapa Contacto inicial"), 50);
    };
  }
}

window.addEventListener("hashchange", render);
render();
