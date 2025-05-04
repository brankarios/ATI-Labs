// Script para cambiar el idioma
const LANGUAGE = 'ES'; // Puedes cambiar a 'EN' o 'PT'

async function loadConfig(lang) {
    try {
        const response = await fetch(`conf/config${lang}.json`);
        if (!response.ok) throw new Error('Error al cargar el JSON');
        
        // Extraemos el contenido JSON del archivo que contiene "const config" para que no nos de error
        const configText = await response.text();
        const configJsonStr = configText.match(/\{[\s\S]*\}/)[0]; 
        return JSON.parse(configJsonStr);
    } catch (error) {
        console.error('Error cargando el idioma:', error);
        return null;
    }
}

async function applyLanguage(lang) {
    const config = await loadConfig(lang);
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

// Script para cargar estudiantes
async function loadStudents() {
    try {
        const response = await fetch('datos/index.json');
        if (!response.ok) throw new Error('Error al cargar los datos de estudiantes');
        
        // Extremos el array JSON del archivo que contiene "const perfiles" para que no nos de error
        const studentsText = await response.text();
        const studentsJsonStr = studentsText.match(/\[[\s\S]*\]/)[0]; 
        const students = JSON.parse(studentsJsonStr);

        const studentGrid = document.querySelector('.student-grid');
        if (!studentGrid) throw new Error('No se encontró el contenedor .student-grid');

        studentGrid.innerHTML = '';

        students.forEach((student, index) => {
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
        console.error('Error:', error);
        const errorElement = document.createElement('p');
        errorElement.textContent = 'No se pudieron cargar los estudiantes. Por favor, recarga la página.';
        errorElement.style.color = 'red';
        errorElement.style.textAlign = 'center';
        errorElement.style.padding = '20px';
        document.querySelector('main').appendChild(errorElement);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(LANGUAGE);
    loadStudents();
});