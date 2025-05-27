function changeLinkColor(link){
        link.style.color = 'red'; 
    }

// Función para extraer JSON de archivos con declaración de variable

function extractJSON(text) {
    const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
    return match ? JSON.parse(match[0]) : null;
}

function updateInterfaceTexts(config) {
    if (!config) return;
    
    document.getElementById('texto-color').textContent = config.color + ': ';
    document.getElementById('texto-libro').textContent = config.libro + ': ';
    document.getElementById('texto-musica').textContent = config.musica + ': ';
    document.getElementById('texto-juegos').textContent = config.video_juego + ': ';
    document.getElementById('texto-lenguajes').textContent = config.lenguajes + ': ';
    document.getElementById('texto-contacto').textContent = config.email.split('[email]')[0];
}

async function loadStudentProfile(ci) {
    try {

        const estudiantes = perfiles;

        if (!estudiantes) return;

        const estudiante = estudiantes.find(e => e.ci == ci);
        if (!estudiante) return;

        const perfilJSON = document.createElement('script');
        perfilJSON.src = `${estudiante["ci"]}/perfil.json`;
        document.head.appendChild(perfilJSON);
        document.head.insertBefore(perfilJSON, document.head.firstChild);

        document.getElementById('foto-perfil').src = estudiante.imagen;
        document.getElementById('nombre-perfil').textContent = estudiante.nombre;
        document.title = `${estudiante.nombre}`;

        perfilJSON.onload = function(){

            // Agregamos un console.log para ver qué es 'this' en este contexto
            console.log("This en perfilJSON.onload:", this); 

            document.getElementById('descripcion-perfil').textContent = perfil.descripcion;
            document.getElementById('color-perfil').textContent = perfil.color;
            document.getElementById('libro-perfil').textContent = perfil.libro;
            document.getElementById('musica-perfil').textContent = perfil.musica;
            document.getElementById('juegos-perfil').textContent = perfil.video_juego;
            document.getElementById('lenguajes-perfil').textContent = perfil.lenguajes;
             if (perfil.email) {
                document.getElementById('email-perfil').textContent = perfil.email;
                document.getElementById('email-perfil').href = `mailto:${perfil.email}`;
            }

        }

        /*try {
            const perfil = extractJSON(await perfilResponse.text());
            if (!perfil) return;
            
        } catch (e) {
            console.log('No se encontró perfil específico');
        }*/
    } catch (error) {
        console.log('Error cargando perfil:', error);
    }
}

        
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'ES';
    const ci = urlParams.get('ci') || '30136117';

    // Cargar y aplicar idioma
    let config;

    if(lang.toUpperCase() == 'EN'){

        config = configEN;
    }

    else if(lang.toUpperCase() == 'PT'){

        config = configPT;
    }

    else{

        config = configES;
    }

    updateInterfaceTexts(config);

    if (ci) loadStudentProfile(ci);
});

//Script para poder ejecutar en local los archivos

window.onload = function(){

    console.log("This en window.onload:", this); // Otro this para el reto 05

    const urlParams = new URLSearchParams(window.location.search);
    const ci = urlParams.get('ci');
    const lang = urlParams.get('lang');

    if(ci !== null){ 

        const perfil = pefiles.find(p => p.ci === ci);
        const perfilJSON = document.createElement('script');
        perfilJSON.src = '${perfil["ci"]}/perfil.json';
        perfilJSON.type = "text/javascript";
        document.head.appendChild(perfilJSON);
        console.log(perfil);

    }
}