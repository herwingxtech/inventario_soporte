#!/bin/bash

echo "=== Script de Instalación - Sistema de Soporte ==="
echo "Configurando aplicación para el prefijo /soporte/"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "Error: No se encontró server.js. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

echo "1. Verificando dependencias..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no está instalado. Instala Node.js primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm no está instalado. Instala npm primero."
    exit 1
fi

echo "2. Instalando dependencias de Node.js..."
npm install

echo "3. Verificando archivo .env..."
if [ ! -f ".env" ]; then
    echo "Creando archivo .env..."
    cat > .env << 'EOF'
# Configuración de la base de datos
DB_HOST=192.168.0.140
DB_USER=herwingx
DB_PASSWORD=LDSinf08l$
DB_NAME=inventario_soporte
DB_PORT=3306

# Configuración del servidor
PORT=3000
NODE_ENV=production

# Configuración JWT
JWT_SECRET=KnLEgII2PGV1cxNy8aCFA1x4CP10mFwTt7GLSqjJ3X0lhWP4kf
JWT_EXPIRE=24h

# Configuración de la aplicación
APP_URL=http://localhost/soporte
API_URL=http://localhost/soporte/api
EOF
    echo "Archivo .env creado con configuración para /soporte/"
else
    echo "Archivo .env ya existe. Verifica que tenga la configuración correcta para /soporte/"
fi

echo "4. Verificando configuración de Apache..."
if command -v apache2ctl &> /dev/null; then
    echo "Apache detectado. Creando configuración..."
    
    # Crear configuración de Apache
    sudo tee /etc/apache2/sites-available/soporte.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    
    # DocumentRoot principal (para otros sistemas)
    DocumentRoot /var/www/html
    
    # Configuración del proxy reverso
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy para la API - MÁS ESPECÍFICO PRIMERO
    ProxyPass /soporte/api/ http://localhost:3000/api/
    ProxyPassReverse /soporte/api/ http://localhost:3000/api/
    
    # Proxy para la aplicación principal - MÁS GENERAL DESPUÉS
    ProxyPass /soporte/ http://localhost:3000/soporte/
    ProxyPassReverse /soporte/ http://localhost:3000/soporte/
    
    # Headers necesarios para el proxy
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    RequestHeader set X-Forwarded-Prefix "/soporte"
    
    # Configuración para archivos estáticos del soporte
    <Directory /var/www/html/inventario_soporte/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Alias para archivos estáticos del soporte
    Alias /soporte /var/www/html/inventario_soporte/public
    
    # Configuración de MIME types
    <IfModule mod_mime.c>
        AddType text/css .css
        AddType application/javascript .js
        AddType image/svg+xml .svg
        AddType image/png .png
        AddType image/jpeg .jpg .jpeg
        AddType image/gif .gif
        AddType image/x-icon .ico
        AddType application/font-woff .woff
        AddType application/font-woff2 .woff2
        AddType application/x-font-ttf .ttf
        AddType application/vnd.ms-fontobject .eot
    </IfModule>
    
    # Configuración de headers para MIME types
    <IfModule mod_headers.c>
        <FilesMatch "\.css$">
            Header set Content-Type "text/css"
        </FilesMatch>
        
        <FilesMatch "\.js$">
            Header set Content-Type "application/javascript"
        </FilesMatch>
        
        <FilesMatch "\.svg$">
            Header set Content-Type "image/svg+xml"
        </FilesMatch>
    </IfModule>
</VirtualHost>
EOF

    # Habilitar módulos necesarios
    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo a2enmod headers
    sudo a2enmod mime
    sudo a2enmod rewrite
    sudo a2enmod ssl

    # Deshabilitar sitio por defecto y habilitar el nuevo
    sudo a2dissite 000-default.conf
    sudo a2ensite soporte.conf

    # Verificar configuración
    sudo apache2ctl configtest

    # Reiniciar Apache
    sudo service apache2 restart
    echo "Configuración de Apache completada."
else
    echo "Apache no detectado. Configura manualmente el proxy reverso para /soporte/"
fi

echo "5. Creando servicio systemd..."
sudo tee /etc/systemd/system/soporte.service > /dev/null << 'EOF'
[Unit]
Description=Sistema de Soporte
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/inventario_soporte
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=DB_HOST=192.168.0.140
Environment=DB_USER=herwingx
Environment=DB_PASSWORD=LDSinf08l$
Environment=DB_NAME=inventario_soporte
Environment=DB_PORT=3306
Environment=JWT_SECRET=KnLEgII2PGV1cxNy8aCFA1x4CP10mFwTt7GLSqjJ3X0lhWP4kf
Environment=JWT_EXPIRE=24h
Environment=APP_URL=http://localhost/soporte
Environment=API_URL=http://localhost/soporte/api

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable soporte.service

echo "6. Copiando archivos al directorio web..."
if [ ! -d "/var/www/html/inventario_soporte" ]; then
    sudo mkdir -p /var/www/html/inventario_soporte
fi

sudo cp -r * /var/www/html/inventario_soporte/
sudo chown -R www-data:www-data /var/www/html/inventario_soporte
sudo chmod -R 755 /var/www/html/inventario_soporte
sudo chmod 644 /var/www/html/inventario_soporte/.env

echo "7. Iniciando servicio..."
sudo systemctl start soporte.service

echo ""
echo "=== Instalación Completada ==="
echo ""
echo "La aplicación está configurada para funcionar bajo el prefijo /soporte/"
echo ""
echo "URLs de acceso:"
echo "- Aplicación: http://localhost/soporte"
echo "- API: http://localhost/soporte/api"
echo "- Dashboard: http://localhost/soporte/home"
echo ""
echo "Comandos útiles:"
echo "- Ver estado: sudo systemctl status soporte"
echo "- Reiniciar: sudo systemctl restart soporte"
echo "- Ver logs: sudo journalctl -u soporte -f"
echo "- Reiniciar Apache: sudo service apache2 restart"
echo ""
echo "Credenciales de prueba:"
echo "- Usuario: linea"
echo "- Contraseña: digital"
echo ""
echo "¡Instalación completada exitosamente!" 