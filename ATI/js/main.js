// ATI-Labs/js/main.js

// Variables globales para la aplicación SPA
let allStudents = []; // Almacena la lista completa de estudiantes
let currentLangConfig = {}; // Almacena la configuración de idioma actual
let profileTemplateHtml = ''; // Almacenará el HTML de perfil.html para inyección dinámica

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DEBUG_JS: DOMContentLoaded ha sido disparado.');

    // Carga el idioma preferido al inicio
    const preferredLang = sessionStorage.getItem('preferredLang') || 'es';
    console.log(`DEBUG_JS: Idioma preferido detectado: ${preferredLang}`);
    await changeLanguage(preferredLang); 
    console.log('DEBUG_JS: changeLanguage completado.');

    // Carga la lista de estudiantes
    console.log('DEBUG_JS: Iniciando loadStudentList().');
    await loadStudentList(); 
    console.log('DEBUG_JS: loadStudentList() completado.');

    // Carga la plantilla HTML del perfil una sola vez
    await loadProfileTemplate();

    // Configura el evento de búsqueda
    console.log('DEBUG_JS: Configurando búsqueda.');
    setupSearch();

    // Notificar al servidor de la visita (para el contador de sesión)
    console.log('DEBUG_JS: Enviando solicitud de visita.');
    fetch('/ATI/api/visit') 
        .then(response => response.json())
        .then(data => console.log('Visitas:', data.visits))
        .catch(error => console.error('Error al registrar visita:', error));
});

// Función para cargar el HTML de perfil.html como una plantilla
async function loadProfileTemplate() {
    try {
        console.log('DEBUG_JS: Cargando plantilla de perfil desde /ATI/perfil.html');
        const response = await fetch('/ATI/perfil.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        profileTemplateHtml = await response.text();
        console.log('DEBUG_JS: Plantilla de perfil cargada. Longitud:', profileTemplateHtml.length);
        if (profileTemplateHtml.length < 50) { // Un umbral arbitrario para verificar si no está vacía
            console.warn('DEBUG_JS_WARN: La plantilla de perfil parece muy corta o vacía.');
        }
    } catch (error) {
        console.error('DEBUG_JS_ERROR: Error al cargar la plantilla de perfil:', error);
        // Podrías poner un mensaje de error en la sección de perfil si la plantilla no carga
        const profileDetailsSection = document.getElementById('profile-details-section');
        if (profileDetailsSection) {
            profileDetailsSection.innerHTML = `<p style="text-align: center; color: red;">${currentLangConfig.error_loading_profile_template || 'Error al cargar la plantilla del perfil.'}</p>`;
        }
    }
}

// Función de utilidad para cambiar el color del link (se mantiene aquí)
function changeLinkColor(link){
    link.style.color = 'red'; 
}

async function changeLanguage(lang_code) {
    console.log(`DEBUG_JS: changeLanguage(${lang_code}) llamado.`);
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = lang_code;
    }

    sessionStorage.setItem('preferredLang', lang_code); 

    try {
        console.log(`DEBUG_JS: Fetching idioma de: /ATI/api/language/${lang_code}`);
        const response = await fetch(`/ATI/api/language/${lang_code}`); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.config) {
            currentLangConfig = data.config; // Almacena la configuración globalmente
            sessionStorage.setItem('langConfig', JSON.stringify(data.config));
            updateTextContent(); 
            console.log('DEBUG_JS: Configuración de idioma cargada y aplicada.');

            // Si el perfil está visible, actualiza sus textos
            const profileDetailsSection = document.getElementById('profile-details-section');
            if (profileDetailsSection && profileDetailsSection.style.display !== 'none') {
                updateProfileTexts(currentLangConfig);
            }

        } else {
            console.error('DEBUG_JS_ERROR: La respuesta de la API de idioma no contiene config.');
            currentLangConfig = JSON.parse(sessionStorage.getItem('langConfig') || '{}'); 
        }
    } catch (error) {
        console.error('DEBUG_JS_ERROR: Error al cargar configuración de idioma:', error);
        currentLangConfig = JSON.parse(sessionStorage.getItem('langConfig') || '{}'); 
    }
    displayStudents(allStudents, currentLangConfig);
}

async function loadStudentList() {
    console.log('DEBUG_JS: loadStudentList() ha sido llamado.');
    const studentGridElem = document.getElementById('student-grid');
    if (!studentGridElem) { 
        console.error('DEBUG_JS_ERROR: Elemento #student-grid no encontrado en loadStudentList().');
        return;
    }
    const firstCard = studentGridElem.querySelector('.student-card');
    if (firstCard) {
        firstCard.innerHTML = '<p style="text-align: center;">Cargando estudiantes...</p>';
        firstCard.style.display = 'flex'; 
    } else {
        studentGridElem.innerHTML = '<p style="text-align: center;">Cargando estudiantes...</p>';
    }

    try {
        console.log('DEBUG_JS: Fetching lista de estudiantes de: /ATI/api/students');
        const response = await fetch('/ATI/api/students');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('DEBUG_JS: Respuesta de la API de estudiantes:', data);

        if (data.students && data.students.length > 0) {
            allStudents = data.students; 
            displayStudents(allStudents, currentLangConfig);
            console.log(`DEBUG_JS: ${allStudents.length} estudiantes cargados.`);
        } else {
            const noResultsMessage = currentLangConfig.no_students_found || 'No se encontraron estudiantes.';
            const firstCard = studentGridElem.querySelector('.student-card');
            if (firstCard) {
                firstCard.innerHTML = `<p style="text-align: center;">${noResultsMessage}</p>`;
                firstCard.style.display = 'flex';
                const allCards = studentGridElem.querySelectorAll('.student-card');
                for (let i = 1; i < allCards.length; i++) {
                    allCards[i].style.display = 'none';
                }
            } else {
                studentGridElem.innerHTML = `<p style="text-align: center;">${noResultsMessage}</p>`;
            }
            allStudents = [];
            console.warn('DEBUG_JS_WARN: No se encontraron estudiantes en la respuesta de la API.');
        }
    } catch (error) {
        console.error('DEBUG_JS_ERROR: Error al cargar la lista de estudiantes:', error);
        studentGridElem.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: red;">${currentLangConfig.error_loading_students || 'Error al cargar estudiantes. Por favor, recarga la página.'}</p>`;
        allStudents = [];
    }
}

function displayStudents(studentsToDisplay, config) {
    console.log('DEBUG_JS: displayStudents() llamado. Estudiantes a mostrar:', studentsToDisplay.length);
    const studentGrid = document.getElementById('student-grid');
    if (!studentGrid) {
        console.error('DEBUG_JS_ERROR: Elemento #student-grid no encontrado en displayStudents(). No se pueden mostrar estudiantes.');
        return;
    }

    // Asegura que el contenedor de la cuadrícula siempre tenga display: grid
    studentGrid.style.display = 'grid'; 

    const allCards = studentGrid.querySelectorAll('.student-card'); 

    // Oculta todas las tarjetas inicialmente
    allCards.forEach(card => card.style.display = 'none');

    if (studentsToDisplay.length === 0) {
        const noResults = config.no_students_found || 'No se encontraron estudiantes.';
        const firstCard = allCards[0];
        if (firstCard) {
            firstCard.innerHTML = `<p style="text-align: center;">${noResults}</p>`;
            firstCard.style.display = 'flex';
            const remainingCards = Array.from(allCards).slice(1);
            remainingCards.forEach(card => card.style.display = 'none');
        } else {
            studentGrid.innerHTML = `<p style="text-align: center;">${noResults}</p>`;
        }
        console.log('DEBUG_JS: No hay estudiantes para mostrar. Mostrando mensaje de no resultados.');
        return;
    }

    studentsToDisplay.forEach((student, index) => {
        if (index < allCards.length) { 
            const studentCard = allCards[index];
            studentCard.style.display = 'flex'; // REINSERTADO: Asegura que cada tarjeta individualmente sea un contenedor flex
            studentCard.innerHTML = ''; // Limpia el contenido previo

            // Asegura que el evento click se asigne solo una vez o se reasigne
            const oldClickListener = studentCard._clickListener;
            if (oldClickListener) {
                studentCard.removeEventListener('click', oldClickListener);
            }
            const newClickListener = () => {
                console.log(`DEBUG_JS: Clic en tarjeta de estudiante. ID: ${student.id}`);
                showProfileDetails(student.id); 
            };
            studentCard.addEventListener('click', newClickListener);
            studentCard._clickListener = newClickListener; // Guarda la referencia

            const img = document.createElement('img');
            img.src = student.photo || 'https://placehold.co/100x100/CCCCCC/000000?text=No+Photo'; 
            img.className = `student-img principal-student`; 
            img.alt = `Foto de ${student.name || student.id}`;
            img.loading = 'lazy';
            img.onerror = () => { 
                console.error(`DEBUG_JS_ERROR: No se pudo cargar la imagen para el estudiante ${student.id} desde: ${img.src}`);
                img.src = 'https://placehold.co/100x100/CCCCCC/000000?text=No+Photo'; 
            };

            const span = document.createElement('span');
            span.textContent = student.name || `ID: ${student.id}`; 

            studentCard.appendChild(img);
            studentCard.appendChild(span);
        } else {
            console.warn(`DEBUG_JS_WARN: Más estudiantes (${studentsToDisplay.length}) que tarjetas fijas (${allCards.length}). Estudiante ${student.id} no se mostrará. Considera añadir más '.student-card' divs en index.html o hacerlos dinámicos.`);
        }
    });

    // Ocultar cualquier tarjeta sobrante que no se haya rellenado con un estudiante
    for (let i = studentsToDisplay.length; i < allCards.length; i++) {
        allCards[i].style.display = 'none';
    }

    console.log('DEBUG_JS: Tarjetas de estudiantes renderizadas en el DOM.');
}

// Nueva función para mostrar los detalles del perfil
async function showProfileDetails(ci) {
    console.log(`DEBUG_JS: showProfileDetails(${ci}) llamado.`);
    const studentGrid = document.getElementById('student-grid');
    const profileDetailsSection = document.getElementById('profile-details-section');
    
    if (!studentGrid || !profileDetailsSection) {
        console.error('DEBUG_JS_ERROR: Elementos de la interfaz (student-grid o profile-details-section) no encontrados.');
        return;
    }

    // Oculta la lista de estudiantes
    studentGrid.style.display = 'none';
    // Muestra la sección de detalles del perfil
    profileDetailsSection.style.display = 'flex'; // o 'block' o 'grid' dependiendo de tu CSS

    // Muestra un mensaje de carga mientras se obtienen los datos
    profileDetailsSection.innerHTML = `<p style="text-align: center;">${currentLangConfig.loading_profile || 'Cargando perfil...'}</p>`;

    try {
        console.log(`DEBUG_JS: Fetching perfil de: /ATI/api/profile/${ci}`);
        const response = await fetch(`/ATI/api/profile/${ci}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const estudiante = data.profile;

        if (!estudiante) {
            console.warn(`DEBUG_JS: No se encontró perfil para CI: ${ci}`);
            profileDetailsSection.innerHTML = `<p style="text-align: center; color: red;">${currentLangConfig.profile_not_found || 'Perfil no encontrado.'}</p>`;
            return;
        }

        console.log('DEBUG_JS: Perfil cargado:', estudiante);

        // Inyecta la plantilla HTML del perfil en la sección
        // Usa innerHTML = '' para limpiar el contenido anterior, luego insertAdjacentHTML
        profileDetailsSection.innerHTML = ''; 
        profileDetailsSection.insertAdjacentHTML('afterbegin', profileTemplateHtml); 

        // ¡IMPORTANTE! Obtén la referencia al contenedor principal dentro de la sección de perfil
        const profileContainer = profileDetailsSection.querySelector('.contenedor-principal');
        if (!profileContainer) {
            console.error('DEBUG_JS_ERROR: No se encontró el contenedor principal del perfil después de inyectar la plantilla.');
            profileDetailsSection.innerHTML = `<p style="text-align: center; color: red;">${currentLangConfig.error_loading_profile || 'Error al cargar el perfil. Contenedor no encontrado.'}</p>`;
            return;
        }

        // --- Nuevos logs de depuración para verificar elementos ---
        console.log('DEBUG_JS: profileContainer existe y es:', profileContainer);
        console.log('DEBUG_JS: Contenido HTML del profileContainer después de inyección (primeros 200 chars):', profileContainer.innerHTML.substring(0, 200));
        console.log('DEBUG_JS: ¿Tiene hijos el profileContainer?', profileContainer.children.length > 0);
        console.log('DEBUG_JS: Elemento #foto-perfil directamente después de querySelector:', profileContainer.querySelector('#foto-perfil'));
        // --- Fin de nuevos logs ---

        // Actualiza los elementos HTML con los datos del estudiante usando querySelector en el contenedor
        // Añadidas comprobaciones de null para evitar TypeError si el elemento no se encuentra
        const fotoPerfil = profileContainer.querySelector('#foto-perfil');
        if (fotoPerfil) {
            fotoPerfil.src = estudiante.photo || 'https://placehold.co/150x150/CCCCCC/000000?text=No+Photo';
            fotoPerfil.alt = `Foto de ${estudiante.nombre || 'Estudiante'}`;
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #foto-perfil no encontrado en la plantilla de perfil.');
        }

        const nombrePerfil = profileContainer.querySelector('#nombre-perfil');
        if (nombrePerfil) {
            nombrePerfil.textContent = estudiante.nombre || 'Nombre no especificado';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #nombre-perfil no encontrado en la plantilla de perfil.');
        }
        
        const descripcionPerfil = profileContainer.querySelector('#descripcion-perfil');
        if (descripcionPerfil) {
            descripcionPerfil.textContent = estudiante.descripcion || 'Descripción no disponible.';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #descripcion-perfil no encontrado en la plantilla de perfil.');
        }

        // La cédula de identidad ha sido eliminada por tu solicitud
        // const ciPerfil = profileContainer.querySelector('#ci-perfil');
        // if (ciPerfil) {
        //     ciPerfil.textContent = estudiante.ci || 'No especificada'; 
        // } else {
        //     console.warn('DEBUG_JS_WARN: Elemento #ci-perfil no encontrado en la plantilla de perfil.');
        // }

        const colorPerfil = profileContainer.querySelector('#color-perfil');
        if (colorPerfil) {
            colorPerfil.textContent = estudiante.color || 'No especificado';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #color-perfil no encontrado en la plantilla de perfil.');
        }

        const libroPerfil = profileContainer.querySelector('#libro-perfil');
        if (libroPerfil) {
            libroPerfil.textContent = estudiante.libro || 'No especificado';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #libro-perfil no encontrado en la plantilla de perfil.');
        }

        const musicaPerfil = profileContainer.querySelector('#musica-perfil');
        if (musicaPerfil) {
            musicaPerfil.textContent = estudiante.musica || 'No especificado';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #musica-perfil no encontrado en la plantilla de perfil.');
        }

        const juegosPerfil = profileContainer.querySelector('#juegos-perfil');
        if (juegosPerfil) {
            juegosPerfil.textContent = estudiante.video_juego ? estudiante.video_juego.join(', ') : 'No especificados';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #juegos-perfil no encontrado en la plantilla de perfil.');
        }

        const lenguajesPerfil = profileContainer.querySelector('#lenguajes-perfil');
        if (lenguajesPerfil) {
            lenguajesPerfil.textContent = estudiante.lenguajes ? estudiante.lenguajes.join(', ') : 'No especificados';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #lenguajes-perfil no encontrado en la plantilla de perfil.');
        }
        
        const emailLink = profileContainer.querySelector('#email-perfil');
        if (emailLink) {
            emailLink.href = `mailto:${estudiante.email || ''}`;
            emailLink.textContent = estudiante.email || 'No disponible';
            emailLink.onclick = function() { changeLinkColor(this); return false; }; 
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #email-perfil no encontrado en la plantilla de perfil.');
        }

        const textoContactoElem = profileContainer.querySelector('#texto-contacto');
        if (textoContactoElem) {
            textoContactoElem.textContent = (currentLangConfig.email_intro || 'Si necesitan comunicarse conmigo pueden escribirme a') + ': ';
        } else {
            console.warn('DEBUG_JS_WARN: Elemento #texto-contacto no encontrado en la plantilla de perfil.');
        }


        // Añadir botón para regresar a la lista (se añade a la sección principal, no al contenedor inyectado)
        const backButton = document.createElement('button');
        backButton.textContent = currentLangConfig.back_to_list || 'Volver a la lista';
        backButton.className = 'back-button'; 
        backButton.onclick = showStudentList;
        profileDetailsSection.appendChild(backButton); 

        // Actualizar textos I18N específicos del perfil después de inyectar el HTML
        updateProfileTexts(currentLangConfig);

    } catch (error) {
        console.error('DEBUG_JS_ERROR: Error al cargar los detalles del perfil:', error);
        profileDetailsSection.innerHTML = `<p style="text-align: center; color: red;">${currentLangConfig.error_loading_profile || 'Error al cargar el perfil. Inténtalo de nuevo.'}</p>`;
    }
}

// Función para volver a mostrar la lista de estudiantes
function showStudentList() {
    console.log('DEBUG_JS: Volviendo a la lista de estudiantes.');
    const studentGrid = document.getElementById('student-grid');
    const profileDetailsSection = document.getElementById('profile-details-section');

    if (studentGrid) {
        studentGrid.style.display = 'grid'; // Asegura que la cuadrícula se muestre como grid
        // Opcional: Forzar un reflow para asegurar que el layout se recalcule
        studentGrid.offsetWidth; 
    }
    if (profileDetailsSection) profileDetailsSection.style.display = 'none';

    // Para asegurar que todas las tarjetas se muestren si están cargadas
    const allCards = studentGrid.querySelectorAll('.student-card');
    allCards.forEach(card => {
        // Solo mostrar si el estudiante correspondiente a esa tarjeta está en la lista actual de estudiantes
        // Esto previene que se muestren tarjetas vacías si el número de estudiantes es menor que el de tarjetas pre-existentes
        const cardIndex = Array.from(allCards).indexOf(card);
        if (cardIndex < allStudents.length) { // allStudents contiene los estudiantes filtrados o completos
            card.style.display = 'flex'; 
        } else {
            card.style.display = 'none';
        }
    });

}


function setupSearch() {
    console.log('DEBUG_JS: setupSearch() llamado.');
    const searchInput = document.getElementById('search-input');
    const searchForm = document.querySelector('.search-form'); 
    
    const performSearch = (query) => {
        console.log(`DEBUG_JS: Realizando búsqueda con query: "${query}"`);
        const filteredStudents = allStudents.filter(student => 
            (student.name && student.name.toLowerCase().includes(query.toLowerCase())) ||
            (student.id && student.id.toLowerCase().includes(query.toLowerCase())) 
        );
        displayStudents(filteredStudents, currentLangConfig);
        if (filteredStudents.length === 0 && query && currentLangConfig.noResults) {
            const studentGrid = document.getElementById('student-grid');
            const firstCard = studentGrid.querySelector('.student-card');
            if (firstCard) {
                firstCard.innerHTML = `<p style="text-align: center;">${currentLangConfig.noResults} "${query}"</p>`;
                firstCard.style.display = 'flex';
                const allCards = studentGrid.querySelectorAll('.student-card');
                for (let i = 1; i < allCards.length; i++) {
                    allCards[i].style.display = 'none';
                }
            } else {
                 studentGrid.innerHTML = `<p style="text-align: center;">${currentLangConfig.noResults} "${query}"</p>`;
            }
        }
    };

    if (searchInput) { 
        searchInput.addEventListener('input', () => {
            performSearch(searchInput.value.trim());
        });
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                performSearch(searchInput.value.trim());
            }
        });
    } else {
        console.error('DEBUG_JS_ERROR: Elemento #search-input no encontrado.');
    }

    if (searchForm) { 
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            performSearch(searchInput.value.trim());
        });
    } else {
        console.error('DEBUG_JS_ERROR: Elemento .search-form no encontrado.');
    }
}

// Función para actualizar los textos de la interfaz principal (header, footer, títulos)
function updateTextContent() {
    console.log('DEBUG_JS: updateTextContent() llamado. Actualizando textos I18N.');
    const langConfig = currentLangConfig; 
    const welcomeMessageElem = document.getElementById('welcome-message');
    if (welcomeMessageElem) welcomeMessageElem.innerText = langConfig.welcome_message || 'Bienvenido, Visitante!';
    
    const studentListTitleElem = document.getElementById('student-list-title'); 
    if (studentListTitleElem) studentListTitleElem.innerText = langConfig.student_list_title || 'Lista de Estudiantes';
    
    const searchInputElem = document.getElementById('search-input');
    if (searchInputElem) searchInputElem.placeholder = langConfig.search_placeholder || 'Buscar estudiante...';

    const footerElem = document.querySelector('footer');
    if (footerElem && langConfig.copyRight) {
         footerElem.textContent = langConfig.copyRight;
    }
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key === 'sitio') { 
            if (langConfig.sitio && Array.isArray(langConfig.sitio) && langConfig.sitio.length >= 3) {
                element.textContent = `${langConfig.sitio[0]}${langConfig.sitio[1]} ${langConfig.sitio[2]}`;
            } else {
                console.warn('DEBUG_JS_WARN: langConfig.sitio no es un array válido o es incompleto. Usando texto por defecto.');
                element.textContent = 'ATI[UCV] 2025-1'; 
            }
        } else if (langConfig[key]) {
            element.textContent = langConfig[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (langConfig[key]) element.placeholder = langConfig[key];
    });

    document.querySelectorAll('[data-i18n-value]').forEach(element => {
        const key = element.getAttribute('data-i18n-value');
        if (langConfig[key]) element.value = langConfig[key];
    });

    if (allStudents.length > 0) {
        displayStudents(allStudents, langConfig);
    }
}

// Nueva función para actualizar los textos dentro de la sección de perfil
// Se llama después de inyectar el HTML del perfil
function updateProfileTexts(config) {
    const profileSection = document.getElementById('profile-details-section');
    if (!profileSection) return;

    // ¡IMPORTANTE! Obtén la referencia al contenedor principal dentro de la sección de perfil
    const profileContainer = profileSection.querySelector('.contenedor-principal');
    if (!profileContainer) {
        console.error('DEBUG_JS_ERROR: No se encontró el contenedor principal del perfil al actualizar textos.');
        return;
    }

    // Eliminado el acceso al elemento #texto-ci
    // const textCiElem = profileContainer.querySelector('#texto-ci');
    // if (textCiElem) textCiElem.textContent = (config.ci_label || 'C.I.') + ': ';

    const textColorElem = profileContainer.querySelector('#texto-color');
    if (textColorElem) textColorElem.textContent = (config.color || 'Mi color favorito es') + ': ';

    const textLibroElem = profileContainer.querySelector('#texto-libro');
    if (textLibroElem) textLibroElem.textContent = (config.libro || 'Mi libro favorito es') + ': ';

    const textMusicaElem = profileContainer.querySelector('#texto-musica');
    if (textMusicaElem) { 
        textMusicaElem.textContent = (config.musica || 'Mi estilo de música preferido') + ': ';
    } else {
        console.warn('DEBUG_JS_WARN: Elemento #texto-musica no encontrado en la plantilla de perfil (al actualizar textos).');
    }

    const textJuegosElem = profileContainer.querySelector('#texto-juegos');
    if (textJuegosElem) textJuegosElem.textContent = (config.video_juego || 'Videojuegos favoritos') + ': ';

    const textLenguajesElem = profileContainer.querySelector('#texto-lenguajes');
    if (textLenguajesElem) textLenguajesElem.textContent = (config.lenguajes || 'Lenguajes aprendidos') + ': ';

    const textContactoElem = profileContainer.querySelector('#texto-contacto');
    if (textContactoElem) textContactoElem.textContent = (config.email_intro || 'Si necesitan comunicarse conmigo pueden escribirme a') + ': ';
}


// Funciones auxiliares para cookies (se mantienen sin cambios)
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/ATI/"; 
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
