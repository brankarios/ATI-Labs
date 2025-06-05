# Se usa la versión más reciente de Ubuntu para la imagen
FROM ubuntu:latest

# Se actualizan los paquetes necesarios y se instala Apache
RUN apt-get update && apt-get install -y apache2

# Se copian los archivos del proyecto al directorio de Apache
COPY ./ /var/www/html/

# Apache por defecto escucha en el puerto 80. EXPOSE simplemente documenta esto y es una buena práctica
# para que otros sepan qué puerto se debe usar.
EXPOSE 80

# Comando de inicio
CMD ["apachectl", "-D", "FOREGROUND"]