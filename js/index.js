// Script para cambiar el idioma y cargar estudiantes
const LANGUAGE = 'ES';

// Función para extraer JSON de archivos con declaración de variable
function extractJSON(text) {
    const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
    return match ? JSON.parse(match[0]) : null;
}

// Cargar configuración de idioma
async function loadLanguageConfig(lang) {
    try {
        const response = await fetch(`conf/config${lang}.json`);
        const configText = await response.text();
        return extractJSON(configText);
    } catch (error) {
        console.error('Error cargando idioma:', error);
        return null;
    }
}

function applyTranslations(config) {
    if (!config) return;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key === 'sitio') {
            element.textContent = `${config.sitio[0]}${config.sitio[1]} ${config.sitio[2]}`;
        } else if (config[key]) {
            element.textContent = config[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (config[key]) element.placeholder = config[key];
    });

    document.querySelectorAll('[data-i18n-value]').forEach(element => {
        const key = element.getAttribute('data-i18n-value');
        if (config[key]) element.value = config[key];
    });
}

// Cargar y mostrar estudiantes
async function loadStudents() {
    try {
        const response = await fetch('datos/index.json');
        const estudiantesText = await response.text();
        const estudiantes = extractJSON(estudiantesText);
        
        if (!estudiantes) return;

        const studentGrid = document.querySelector('.student-grid');
        if (!studentGrid) return;

        studentGrid.innerHTML = '';

        estudiantes.forEach((student, index) => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';

            const img = document.createElement('img');
            img.className = `student-img student-img${(index % 6) + 1}`;
            img.src = student.imagen;
            img.alt = `Foto de ${student.nombre}`;
            img.loading = 'lazy';

            const span = document.createElement('span');
            span.textContent = student.nombre;

            studentCard.appendChild(img);
            studentCard.appendChild(span);
            studentGrid.appendChild(studentCard);
        });

    } catch (error) {
        console.error('Error cargando estudiantes:', error);
        const errorElement = document.createElement('p');
        errorElement.textContent = 'No se pudieron cargar los estudiantes. Por favor, recarga la página.';
        errorElement.style.color = 'red';
        errorElement.style.textAlign = 'center';
        errorElement.style.padding = '20px';
        document.querySelector('main').appendChild(errorElement);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener idioma de la URL o usar el valor por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || LANGUAGE;

    const config = await loadLanguageConfig(lang);
    applyTranslations(config);

    loadStudents();
});