# ATI-Labs/Dockerfile

# Utiliza la imagen base de Ubuntu más reciente
FROM ubuntu:latest

# Establece variables de entorno para Python y para evitar preguntas interactivas durante apt
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    # Habilita el modo de desarrollo de Flask para logs detallados. ¡CRUCIAL PARA DEPURAR!
    FLASK_ENV=development

# Actualiza los paquetes e instala todas las dependencias necesarias:
# - python3.12-venv: Para crear entornos virtuales con Python 3.12
# - apache2: Servidor web Apache
# - libapache2-mod-wsgi-py3: Módulo de Apache para integrar con aplicaciones Python WSGI
# - curl: Utilidad para realizar peticiones web (útil para depuración o descargas)
# - build-essential: Herramientas de compilación (necesarias para algunas instalaciones de pip)
# - python3-dev: Cabeceras y bibliotecas de desarrollo de Python (necesarias para compilar algunos paquetes)
RUN apt-get update && apt-get install -y \
    python3.12-venv \
    apache2 \
    libapache2-mod-wsgi-py3 \
    curl \
    build-essential \
    python3-dev \
    # Elimina los archivos de lista de apt para reducir el tamaño de la imagen final
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo base para la aplicación dentro del contenedor.
# Aquí es donde se copiará el contenido de tu proyecto local ATI-Labs.
WORKDIR /opt/web_cache_pty_app 

# Crea la subcarpeta 'ATI' dentro del directorio de trabajo.
# Esto es para que tu aplicación se encuentre en /opt/web_cache_pty_app/ATI/ dentro del contenedor.
RUN mkdir ATI

# Copia todo el contenido de tu directorio local (ATI-Labs) a la subcarpeta 'ATI'
# dentro del directorio de trabajo del contenedor.
COPY . /opt/web_cache_pty_app/ATI

# Crear el entorno virtual en la nueva ubicación
RUN python3.12 -m venv web_cache_pty_env

# Instala la biblioteca Flask dentro del entorno virtual.
# Usamos la ruta completa al 'pip' del entorno virtual para asegurar que se instale allí.
RUN /opt/web_cache_pty_app/web_cache_pty_env/bin/pip install Flask --no-cache-dir

# --- Configuración de Apache y mod_wsgi ---

# Copia tu archivo de configuración WSGI mod-wsgi.conf
# Se copia a la ubicación estándar de Apache para sitios disponibles.
COPY mod-wsgi.conf /etc/apache2/sites-available/

# Habilita el sitio de Apache configurado en mod-wsgi.conf
RUN a2ensite mod-wsgi.conf
# Habilita el módulo WSGI para Apache
RUN a2enmod wsgi
# Habilita el módulo de reescritura de Apache (mod_rewrite)
RUN a2enmod rewrite 
# Deshabilita el sitio por defecto de Apache para evitar conflictos
RUN a2dissite 000-default.conf

# Configurar los permisos: Aseguramos que se apliquen *después* de todas las copias y creaciones de directorios.
# Aseguramos que todo lo que está bajo /opt/web_cache_pty_app/ pertenezca a www-data y sea legible/ejecutable.
RUN chown -R www-data:www-data /opt/web_cache_pty_app
RUN chmod -R 755 /opt/web_cache_pty_app

# Expone el puerto 80 del contenedor, que es donde Apache estará escuchando.
# Este puerto será mapeado al puerto del host (ej. 8080) cuando inicies el contenedor.
EXPOSE 80

# Define el comando principal que se ejecutará cuando el contenedor se inicie.
# Esto inicia el servidor Apache en primer plano para que el contenedor permanezca en ejecución.
CMD ["apache2ctl", "-D", "FOREGROUND"]
