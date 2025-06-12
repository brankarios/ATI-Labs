FROM ubuntu:latest

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    FLASK_ENV=development


RUN apt-get update && apt-get install -y \
    python3.12-venv \
    apache2 \
    libapache2-mod-wsgi-py3 \
    curl \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/web_cache_pty_app 

RUN mkdir ATI

COPY . /opt/web_cache_pty_app/ATI

RUN python3.12 -m venv web_cache_pty_env

RUN /opt/web_cache_pty_app/web_cache_pty_env/bin/pip install Flask --no-cache-dir


COPY mod-wsgi.conf /etc/apache2/sites-available/

RUN a2ensite mod-wsgi.conf
RUN a2enmod wsgi
RUN a2enmod rewrite 
RUN a2dissite 000-default.conf

RUN chown -R www-data:www-data /opt/web_cache_pty_app
RUN chmod -R 755 /opt/web_cache_pty_app

EXPOSE 80

CMD ["apache2ctl", "-D", "FOREGROUND"]
