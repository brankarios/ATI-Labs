const LANGUAGE = 'ES';

async function loadConfig(lang) {
    try {
        const response = await fetch(`conf/config${lang}.json`);
        if (!response.ok) throw new Error('Error al cargar el JSON');
        return await response.json();
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

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(LANGUAGE); 
});