FROM ubuntu:latest

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    FLASK_ENV=development 

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.12-venv \
    apache2 \
    libapache2-mod-wsgi-py3 \
    curl \
    build-essential \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/web_cache_pty_app

RUN git clone https://github.com/brankarios/ATI-Labs.git /opt/web_cache_pty_app

RUN python3.12 -m venv web_cache_pty_env

RUN /opt/web_cache_pty_app/web_cache_pty_env/bin/pip install Flask --no-cache-dir

RUN cat <<EOF > /etc/apache2/sites-available/ati_app.conf
<VirtualHost *:80>
    ServerName localhost
    ServerAdmin webmaster@localhost

    DocumentRoot /var/www/html/ 

    RedirectMatch ^/\$ /ATI/

    WSGIDaemonProcess myapp python-home=/opt/web_cache_pty_app/web_cache_pty_env user=www-data group=www-data processes=2 threads=15

    WSGIScriptAlias /ATI /opt/web_cache_pty_app/ATI/app.py process-group=myapp application-group=%{GLOBAL}

    <Directory /opt/web_cache_pty_app/ATI/>
        Options +FollowSymLinks -MultiViews -Indexes 
        Require all granted 
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined

</VirtualHost>
EOF

RUN a2ensite ati_app.conf && \
    a2enmod wsgi && \
    a2enmod rewrite && \
    a2dissite 000-default.conf

RUN chown -R www-data:www-data /opt/web_cache_pty_app
RUN chmod -R 755 /opt/web_cache_pty_app

EXPOSE 80

CMD ["apache2ctl", "-D", "FOREGROUND"]
