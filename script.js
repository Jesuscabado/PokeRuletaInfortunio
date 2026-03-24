// --- CONSTANTES Y VARIABLES ---
const colores_tipos = {
    1: "#A8A77A", 2: "#C22E28", 3: "#A98FF3", 4: "#A33EA1", 5: "#E2BF65", 6: "#B6A136",
    7: "#A8B820", 8: "#735797", 9: "#B7B7CE", 10: "#EE8130", 11: "#6390F0", 12: "#7AC74C",
    13: "#F7D02C", 14: "#F95587", 15: "#96D9D6", 16: "#6F35FC", 17: "#705746", 18: "#D685AD"
};
const nombres_tipos_go = {
    1: "NORMAL", 2: "FIGHTING", 3: "FLYING", 4: "POISON", 5: "GROUND", 6: "ROCK",
    7: "BUG", 8: "GHOST", 9: "STEEL", 10: "FIRE", 11: "WATER", 12: "GRASS",
    13: "ELECTRIC", 14: "PSYCHIC", 15: "ICE", 16: "DRAGON", 17: "DARK", 18: "FAIRY"
};
const rangos_generaciones = {
    1: [1, 151], 2: [152, 251], 3: [252, 386],
    4: [387, 493], 5: [494, 649], 6: [650, 721],
    7: [722, 809], 8: [810, 905], 9: [906, 1025]
};

let participantes_base = []; 
let participantes_activos = [];
let historialNombres = new Set();
let historialUI = [];
let cacheIconos = {}; 

let anguloActual = 0;
let girando = false;
let ganadorActual = null;

let cantidadGrupos = 4;
let indiceGrupoActual = 0;
let miembrosGrupos = [];

const canvas = document.getElementById("canvasRuleta");
const ctx = canvas.getContext("2d");
const cx = canvas.width / 2;
const cy = canvas.height / 2;
const radio = 270;

// --- INICIALIZACIÓN Y LOCALSTORAGE ---
function inicializarUI() {
    cargarDesdeLocalStorage();

    let editorHTML = "";
    for (let i = 0; i < 18; i++) {
        editorHTML += `
            <div class="editor-row">
                <span style="width:20px; text-align:right;">${i+1}.</span>
                <input type="text" id="editNom_${i}" placeholder="Nombre">
                <span>Bias:</span>
                <input type="number" step="0.1" id="editBias_${i}" placeholder="1.0">
            </div>`;
    }
    document.getElementById("editorContainer").innerHTML = editorHTML;

    let opcionesHTML = `
        <div class="botones-gens">
            <button class="btn-small" onclick="toggleGeneraciones(true)">Todas</button>
            <button class="btn-small" onclick="toggleGeneraciones(false)">Ninguna</button>
        </div>`;
    for (let i = 1; i <= 9; i++) {
        opcionesHTML += `<label><input type="checkbox" id="chkGen_${i}" checked> Generación ${i}</label>`;
    }
    document.getElementById("opcionesGens").innerHTML = opcionesHTML;
    
    inicializarGrupos();
    prepararDatos();
}

function cargarDesdeLocalStorage() {
    const guardados = localStorage.getItem('ruleta_participantes');
    if (guardados) {
        try {
            participantes_base = JSON.parse(guardados);
        } catch(e) {
            console.error("Error leyendo localStorage", e);
            participantes_base = [];
        }
    }
}

// --- GRUPOS Y OPCIONES ---
function toggleGeneraciones(estado) {
    for (let i = 1; i <= 9; i++) {
        let chk = document.getElementById(`chkGen_${i}`);
        if (chk) chk.checked = estado;
    }
}

function inicializarGrupos() {
    let valorInput = parseInt(document.getElementById('numGrupos').value);
    cantidadGrupos = isNaN(valorInput) ? 0 : valorInput; // Si hay error, por defecto 0 (Individual)
    indiceGrupoActual = 0;
    
    const contenedor = document.getElementById('contenedorGrupos');
    
    if (cantidadGrupos > 0) {
        miembrosGrupos = Array.from({length: cantidadGrupos}, () => []);
        contenedor.style.display = "flex"; // Mostrar tarjetas
        renderizarGrupos();
    } else {
        miembrosGrupos = [];
        contenedor.style.display = "none"; // Ocultar tarjetas en modo individual
        contenedor.innerHTML = "";
    }
}

function renderizarGrupos() {
    const contenedor = document.getElementById('contenedorGrupos');
    contenedor.innerHTML = "";
    for (let i = 0; i < cantidadGrupos; i++) {
        let html = `<div class="grupo-card">
            <div class="grupo-titulo">Grupo ${i + 1}</div>
            <ul class="grupo-lista">`;
        miembrosGrupos[i].forEach(miembro => {
            html += `<li><img src="${miembro.img}" alt="${miembro.poke}"> ${miembro.nombre}</li>`;
        });
        html += `</ul></div>`;
        contenedor.innerHTML += html;
    }
}

// --- LÓGICA DE PREPARACIÓN DE RULETA ---
function prepararDatos() {
    participantes_activos = [];
    if (participantes_base.length === 0) {
        document.getElementById("estado").innerText = "Añade Participantes";
        dibujarRuleta();
        return;
    }

    let tiposDisponibles = Array.from({length: 18}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    while(tiposDisponibles.length < participantes_base.length) {
        let extra = Array.from({length: 18}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        tiposDisponibles = tiposDisponibles.concat(extra);
    }

    let promesasImagenes = [];

    participantes_base.forEach((p, i) => {
        let pClon = {...p};
        pClon.type_id = tiposDisponibles[i];
        pClon.color = colores_tipos[pClon.type_id];
        participantes_activos.push(pClon);

        if (!cacheIconos[pClon.type_id]) {
            let nombre_tipo = nombres_tipos_go[pClon.type_id];
            let url = `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_${nombre_tipo}.png`;
            let img = new Image();
            img.src = url;
            
            let promesa = new Promise((resolve) => {
                img.onload = () => { cacheIconos[pClon.type_id] = img; resolve(); };
                img.onerror = () => { cacheIconos[pClon.type_id] = null; resolve(); }; 
            });
            promesasImagenes.push(promesa);
        }
    });

    Promise.all(promesasImagenes).then(() => {
        document.getElementById("estado").innerText = "¡Todo listo para Asignar!";
        dibujarRuleta();
    });
}

function dibujarRuleta() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const total = participantes_activos.length;
    
    if (total === 0) {
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "gray";
        ctx.textAlign = "center";
        ctx.fillText("No hay participantes", cx, cy);
        return;
    }

    const radPorSeccion = (2 * Math.PI) / total;

    participantes_activos.forEach((p, i) => {
        const inicio = (anguloActual * Math.PI / 180) + (i * radPorSeccion);
        const fin = inicio + radPorSeccion;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, inicio, fin);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.stroke();

        const anguloMedio = inicio + (radPorSeccion / 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anguloMedio);
        
        ctx.font = "bold " + (total === 1 ? "20px" : "14px") + " Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "black";
        ctx.strokeText(p.nombre, 140, 0); 
        ctx.fillStyle = "white";
        ctx.fillText(p.nombre, 140, 0);   

        if (cacheIconos[p.type_id]) {
            ctx.drawImage(cacheIconos[p.type_id], 200, -22, 45, 45);
        }

        ctx.restore();
    });
}

// --- LÓGICA DE GIRO ---
function iniciarGiro() {
    if (girando || participantes_activos.length === 0) return;
    girando = true;
    estadoBotones(true);
    document.getElementById("estado").innerText = "Girando...";

    let sumaPesos = participantes_activos.reduce((sum, p) => sum + p.bias, 0);
    let rnd = Math.random() * sumaPesos;
    let indexGanador = 0;
    
    for (let i = 0; i < participantes_activos.length; i++) {
        rnd -= participantes_activos[i].bias;
        if (rnd <= 0) { indexGanador = i; break; }
    }
    ganadorActual = participantes_activos[indexGanador];

    const gradosPorSeccion = 360 / participantes_activos.length;
    const anguloDestino = 360 - (indexGanador * gradosPorSeccion + gradosPorSeccion / 2);
    
    const giroNecesario = (anguloDestino - anguloActual) % 360;
    const vueltasExtra = Math.floor(Math.random() * (9 - 4 + 1)) + 4; 
    
    let giroRestante = (giroNecesario < 0 ? 360 + giroNecesario : giroNecesario) + (360 * vueltasExtra);

    function animar() {
        if (giroRestante > 0) {
            let paso = Math.max(0.5, giroRestante / 20); 
            if (giroRestante < 0.5) {
                anguloActual = (anguloActual + giroRestante) % 360;
                giroRestante = 0;
            } else {
                anguloActual = (anguloActual + paso) % 360;
                giroRestante -= paso;
            }
            dibujarRuleta();
            requestAnimationFrame(animar); 
        } else {
            buscarPokemonGanador();
        }
    }
    animar();
}

async function buscarPokemonGanador() {
    document.getElementById("estado").innerText = `Buscando acompañante para ${ganadorActual.nombre}...`;
    
    try {
        let resTipo = await fetch(`https://pokeapi.co/api/v2/type/${ganadorActual.type_id}`);
        let datosTipo = await resTipo.json();
        let listaTodos = datosTipo.pokemon;
        
        let listaFiltrada = [];
        let megasPermitidos = document.getElementById("chkMegas").checked;
        let regionalesPermitidos = document.getElementById("chkRegionales").checked;

        listaTodos.forEach(p => {
            let urlPoke = p.pokemon.url;
            let nombrePoke = p.pokemon.name;
            let idParts = urlPoke.split('/').filter(Boolean);
            let pokeId = parseInt(idParts[idParts.length - 1]);
            if (isNaN(pokeId)) return;

            let incluir = false;

            if (pokeId <= 1025) {
                for (let [gen, rango] of Object.entries(rangos_generaciones)) {
                    if (pokeId >= rango[0] && pokeId <= rango[1]) {
                        if (document.getElementById(`chkGen_${gen}`).checked) incluir = true;
                        break;
                    }
                }
            } else {
                let esRegional = false;
                let genRegional = null;
                const mapaRegiones = {"-alola": 7, "-galar": 8, "-hisui": 8, "-paldea": 9};
                
                for (let [sufijo, gen] of Object.entries(mapaRegiones)) {
                    if (nombrePoke.includes(sufijo)) {
                        esRegional = true; genRegional = gen; break;
                    }
                }

                if (esRegional) {
                    if (regionalesPermitidos && document.getElementById(`chkGen_${genRegional}`).checked) {
                        incluir = true;
                    }
                } else {
                    if (megasPermitidos) {
                        if (nombrePoke.includes("-mega") || nombrePoke.includes("-primal") || nombrePoke.includes("-gmax")) {
                            incluir = true;
                        }
                    }
                }
            }
            if (incluir) listaFiltrada.push(p);
        });

        let listaSinRepetir = listaFiltrada.filter(p => !historialNombres.has(p.pokemon.name));

        if (listaSinRepetir.length === 0) {
            listaSinRepetir = listaTodos.filter(p => {
                let id = parseInt(p.pokemon.url.split('/').filter(Boolean).pop());
                return id <= 1025 && !historialNombres.has(p.pokemon.name);
            });
            if (listaSinRepetir.length === 0) listaSinRepetir = listaTodos;
        }

        let pokeElegido = listaSinRepetir[Math.floor(Math.random() * listaSinRepetir.length)].pokemon;
        historialNombres.add(pokeElegido.name);

        let resDetalle = await fetch(pokeElegido.url);
        let datosPoke = await resDetalle.json();

        let urlImagen = datosPoke.sprites.other["official-artwork"].front_default;
        if (!urlImagen) urlImagen = datosPoke.sprites.front_default;

        let nombreFormateado = datosPoke.name.charAt(0).toUpperCase() + datosPoke.name.slice(1).replace(/-/g, " ");

       // --- ASIGNACIÓN (GRUPOS O INDIVIDUAL) ---
        let textoHistorial = "";
        let textoResultado = "";

        if (cantidadGrupos > 0) {
            // Modo Grupos
            let grupoAsignado = indiceGrupoActual;
            miembrosGrupos[grupoAsignado].push({
                nombre: ganadorActual.nombre,
                poke: nombreFormateado,
                img: urlImagen
            });
            renderizarGrupos();
            indiceGrupoActual = (indiceGrupoActual + 1) % cantidadGrupos;
            
            textoHistorial = `► [Grupo ${grupoAsignado + 1}] ${ganadorActual.nombre} - ${nombreFormateado}`;
            textoResultado = `ASIGNADO AL GRUPO ${grupoAsignado + 1}: ${ganadorActual.nombre}`;
        } else {
            // Modo Individual
            textoHistorial = `► ${ganadorActual.nombre} - ${nombreFormateado}`;
            textoResultado = `A PRESENTAR: ${ganadorActual.nombre}`;
        }

        // Historial y UI
        historialUI.push(textoHistorial);
        let listHTML = historialUI.map(t => `<div style="padding: 5px 0; border-bottom: 1px solid #eee;">${t}</div>`).join('');
        document.getElementById("listaHistorial").innerHTML = listHTML;

        document.getElementById("resNombre").innerText = textoResultado;
        document.getElementById("resPoke").innerText = `¡Te acompaña ${nombreFormateado}!`;
        document.getElementById("resImg").src = urlImagen;
        document.getElementById("estado").innerText = "¡Listo!";
        
        document.getElementById("modalResultado").style.display = "flex";

        participantes_base = participantes_base.filter(p => p.nombre !== ganadorActual.nombre);
        // Guardar el estado actual en LocalStorage tras eliminar al ganador
        localStorage.setItem('ruleta_participantes', JSON.stringify(participantes_base));

    } catch (error) {
        document.getElementById("estado").innerText = "(Error conectando a PokeAPI)";
        console.error(error);
        estadoBotones(false);
        girando = false;
    }
}

// --- MANEJO DE MODALES Y GUARDADO ---
function mostrarModal(id) {
    if (girando) return;
    document.getElementById(id).style.display = "flex";
    if (id === 'modalEditar') cargarEditorDesdeBase();
}

function cerrarModal(id, redibujar = false) {
    document.getElementById(id).style.display = "none";
    if (redibujar) {
        estadoBotones(false);
        document.getElementById("estado").innerText = "¡Haz clic en 'Girar' para el siguiente!";
        girando = false;
        prepararDatos(); 
    }
}

function estadoBotones(desactivar) {
    document.getElementById("btnGirar").disabled = desactivar;
    document.getElementById("btnEditar").disabled = desactivar;
    document.getElementById("btnOpciones").disabled = desactivar;
    document.getElementById("btnHistorial").disabled = desactivar;
}

function cargarEditorDesdeBase() {
    for (let i = 0; i < 18; i++) {
        let iptNom = document.getElementById(`editNom_${i}`);
        let iptBias = document.getElementById(`editBias_${i}`);
        if (i < participantes_base.length) {
            iptNom.value = participantes_base[i].nombre;
            iptBias.value = participantes_base[i].bias;
        } else {
            iptNom.value = "";
            iptBias.value = "";
        }
    }
}

function guardarParticipantes() {
    let nuevaBase = [];
    for (let i = 0; i < 18; i++) {
        let nom = document.getElementById(`editNom_${i}`).value.trim();
        let biasStr = document.getElementById(`editBias_${i}`).value.trim();
        if (nom !== "") {
            let biasNum = parseFloat(biasStr);
            if (isNaN(biasNum)) biasNum = 1.0;
            nuevaBase.push({nombre: nom, bias: biasNum});
        }
    }
    participantes_base = nuevaBase;
    
    // Guardar en LocalStorage
    localStorage.setItem('ruleta_participantes', JSON.stringify(participantes_base));
    
    cerrarModal('modalEditar');
    prepararDatos();
}

// Arranque Inicial
inicializarUI();