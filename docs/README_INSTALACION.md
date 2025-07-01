# Guía de Instalación - Sistema de Inventario Soporte
## Ubuntu Server - IP: 192.168.0.54

### Requisitos Previos
- Ubuntu Server 20.04 LTS o superior
- Acceso SSH con permisos de sudo
- Conexión a internet
- Base de datos MySQL en servidor remoto (192.168.0.140)

---

## Paso 1: Preparación del Sistema

### 1.1 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar dependencias básicas
```bash
sudo apt install curl wget git unzip -y
```

---

## Paso 2: Instalación de Node.js

### 2.1 Agregar repositorio de Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

### 2.2 Instalar Node.js
```bash
sudo apt-get install -y nodejs
```

### 2.3 Verificar instalación
```bash
node --version
npm --version
```

---

## Paso 3: Instalación de Apache2

### 3.1 Instalar Apache2
```bash
sudo apt install apache2 -y
```

### 3.2 Habilitar módulos necesarios
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod mime
sudo a2enmod rewrite
sudo a2enmod ssl
```

### 3.3 Reiniciar Apache
```bash
sudo service apache2 restart
```

---

## Paso 4: Despliegue de la Aplicación

### 4.1 Crear directorio para la aplicación
```bash
sudo mkdir -p /var/www/html/inventario_soporte
sudo chown -R $USER:$USER /var/www/html/inventario_soporte
```

### 4.2 Copiar archivos de la aplicación
```bash
# Copiar todos los archivos del proyecto al directorio
sudo cp -r * /var/www/html/inventario_soporte/
```

### 4.3 Instalar dependencias de Node.js
```bash
cd /var/www/html/inventario_soporte
npm install
```

### 4.4 Crear archivo .env
```bash
sudo tee .env > /dev/null << 'EOF'
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
APP_URL=http://192.168.0.54/inventario
API_URL=http://192.168.0.54/inventario/api
EOF
```

### 4.5 Configurar permisos
```bash
sudo chown -R www-data:www-data /var/www/html/inventario_soporte
sudo chmod -R 755 /var/www/html/inventario_soporte
sudo chmod 644 /var/www/html/inventario_soporte/.env
```

---

## Paso 5: Configuración de Apache2

### 5.1 Crear archivo de configuración de Apache
```bash
sudo tee /etc/apache2/sites-available/inventario.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName 192.168.0.54
    
    # DocumentRoot principal (para otros sistemas)
    DocumentRoot /var/www/html
    
    # Configuración del proxy reverso
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy para la API - MÁS ESPECÍFICO PRIMERO
    ProxyPass /inventario/api/ http://localhost:3000/api/
    ProxyPassReverse /inventario/api/ http://localhost:3000/api/
    
    # Proxy para la aplicación principal - MÁS GENERAL DESPUÉS
    ProxyPass /inventario/ http://localhost:3000/inventario/
    ProxyPassReverse /inventario/ http://localhost:3000/inventario/
    
    # Headers necesarios para el proxy
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    RequestHeader set X-Forwarded-Prefix "/inventario"
    
    # Configuración para archivos estáticos del inventario
    <Directory /var/www/html/inventario_soporte/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Alias para archivos estáticos del inventario
    Alias /inventario /var/www/html/inventario_soporte/public
    
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
```

### 5.2 Habilitar el sitio
```bash
sudo a2dissite 000-default.conf
sudo a2ensite inventario.conf
```

### 5.3 Verificar configuración
```bash
sudo apache2ctl configtest
```

### 5.4 Reiniciar Apache
```bash
sudo service apache2 restart
```

---

## Paso 6: Configuración del Servicio Node.js

### 6.1 Crear servicio systemd
```bash
sudo tee /etc/systemd/system/inventario-soporte.service > /dev/null << 'EOF'
[Unit]
Description=Sistema de Inventario Soporte
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
Environment=APP_URL=http://192.168.0.54/inventario
Environment=API_URL=http://192.168.0.54/inventario/api

[Install]
WantedBy=multi-user.target
EOF
```

### 6.2 Habilitar e iniciar el servicio
```bash
sudo systemctl daemon-reload
sudo systemctl enable inventario-soporte.service
sudo systemctl start inventario-soporte.service
```

### 6.3 Verificar estado del servicio
```bash
sudo systemctl status inventario-soporte.service
```

---

## ⚠️ Importante: Configuración del Prefijo `/inventario/`

### ¿Por qué necesitamos esta configuración?

La aplicación está configurada para funcionar bajo el prefijo `/inventario/` para no interferir con otros sistemas en el servidor. Esto permite:

- **Acceso a la aplicación**: `http://192.168.0.54/inventario/`
- **Acceso a la API**: `http://192.168.0.54/inventario/api/`
- **Otras aplicaciones**: `http://192.168.0.54/` (sin interferencia)

### 🔧 Configuración en server.js

El archivo `server.js` incluye un middleware especial que maneja el prefijo:

```javascript
// * Middleware para manejar el prefijo /inventario/ en producción
app.use((req, res, next) => {
  // Si la URL comienza con /inventario/, la removemos para el procesamiento interno
  if (req.url.startsWith('/inventario/')) {
    req.url = req.url.replace('/inventario', '');
    // Si queda solo /, lo convertimos a /
    if (req.url === '') {
      req.url = '/';
    }
  }
  next();
});
```

### 📋 URLs de acceso correctas:

- **Login**: `http://192.168.0.54/inventario/`
- **Dashboard**: `http://192.168.0.54/inventario/home`
- **Equipos**: `http://192.168.0.54/inventario/equipos`
- **API Login**: `http://192.168.0.54/inventario/api/auth/login`

---

## ⚠️ CRÍTICO: Corrección de Rutas del Frontend

### 🔍 Problema identificado:

Si después del login te redirige a `192.168.0.54/home` (sin `/inventario/`) o al logout te manda a `192.168.0.54/`, es porque el frontend tiene rutas hardcodeadas que necesitan ser corregidas.

### 🛠️ Solución: Corregir archivos JavaScript

#### 6.4 Corregir main.js
```bash
# Hacer backup
sudo cp /var/www/html/inventario_soporte/public/js/main.js /var/www/html/inventario_soporte/public/js/main.js.backup

# Editar el archivo
sudo nano /var/www/html/inventario_soporte/public/js/main.js
```

**Cambios necesarios en main.js:**

```javascript
// Línea ~173: Cambiar
window.location.replace('/');
// Por:
window.location.replace('/inventario/');

// Línea ~353: Cambiar
window.location.replace('/');
// Por:
window.location.replace('/inventario/');

// Línea ~150: Cambiar
let url = '/' + viewName;
// Por:
let url = '/inventario/' + viewName;

// Línea ~155: Cambiar
if ((currentPath === '/home' || currentPath === '/') && history.length === 1) {
    history.pushState({ viewName: 'home', params: null }, '', '/home');
}
// Por:
if ((currentPath === '/inventario/home' || currentPath === '/inventario/') && history.length === 1) {
    history.pushState({ viewName: 'home', params: null }, '', '/inventario/home');
}

// Línea ~230: Cambiar
const path = window.location.pathname.replace(/^\//, '');
// Por:
const path = window.location.pathname.replace(/^\/inventario\/?/, '');

// Línea ~235: Cambiar
history.replaceState({ viewName: 'home', params: null }, '', '/home');
// Por:
history.replaceState({ viewName: 'home', params: null }, '', '/inventario/home');

// Línea ~250: Cambiar
const pathFromPop = window.location.pathname.replace(/^\//, '');
// Por:
const pathFromPop = window.location.pathname.replace(/^\/inventario\/?/, '');
```

#### 6.5 Corregir loginView.js
```bash
# Hacer backup
sudo cp /var/www/html/inventario_soporte/public/js/views/loginView.js /var/www/html/inventario_soporte/public/js/views/loginView.js.backup

# Editar el archivo
sudo nano /var/www/html/inventario_soporte/public/js/views/loginView.js
```

**Cambios necesarios en loginView.js:**

```javascript
// Línea ~25: Cambiar
<a href="/">
// Por:
<a href="/inventario/">

// Línea ~50: Cambiar
<a class="text-primary" href="/" id="sign-up-link">Regístrate</a>
// Por:
<a class="text-primary" href="/inventario/" id="sign-up-link">Regístrate</a>

// Línea ~115: Cambiar
window.location.href = '/';
// Por:
window.location.href = '/inventario/';
```

#### 6.6 Corregir index.html
```bash
# Hacer backup
sudo cp /var/www/html/inventario_soporte/public/index.html /var/www/html/inventario_soporte/public/index.html.backup

# Editar el archivo
sudo nano /var/www/html/inventario_soporte/public/index.html
```

**Cambios necesarios en index.html:**

```html
<!-- Línea ~70: Cambiar -->
<a href="/" class="brand-logo">
<!-- Por: -->
<a href="/inventario/" class="brand-logo">

<!-- Línea ~71: Cambiar -->
<img src="/assets/logo-white.svg" alt="" srcset="">
<!-- Por: -->
<img src="/inventario/assets/logo-white.svg" alt="" srcset="">
```

### 🔄 Script automatizado para aplicar correcciones:

```bash
# Script para aplicar todas las correcciones automáticamente
sudo tee /tmp/corregir_rutas.sh > /dev/null << 'EOF'
#!/bin/bash

echo "Aplicando correcciones de rutas..."

# Backup de archivos
sudo cp /var/www/html/inventario_soporte/public/js/main.js /var/www/html/inventario_soporte/public/js/main.js.backup
sudo cp /var/www/html/inventario_soporte/public/js/views/loginView.js /var/www/html/inventario_soporte/public/js/views/loginView.js.backup
sudo cp /var/www/html/inventario_soporte/public/index.html /var/www/html/inventario_soporte/public/index.html.backup

# Corregir main.js
sudo sed -i 's|window\.location\.replace('\''/'\'')|window.location.replace('\''/inventario/'\'')|g' /var/www/html/inventario_soporte/public/js/main.js
sudo sed -i 's|let url = '\''/'\'' + viewName|let url = '\''/inventario/'\'' + viewName|g' /var/www/html/inventario_soporte/public/js/main.js
sudo sed -i 's|currentPath === '\''/home'\'' \|\| currentPath === '\''/'\''|currentPath === '\''/inventario/home'\'' \|\| currentPath === '\''/inventario/'\''|g' /var/www/html/inventario_soporte/public/js/main.js
sudo sed -i 's|history\.pushState.*'\''/home'\''|history.pushState({ viewName: '\''home'\'', params: null }, '\'''\''', '\''/inventario/home'\'')|g' /var/www/html/inventario_soporte/public/js/main.js
sudo sed -i 's|window\.location\.pathname\.replace(/^\/, '\'''\''')|window.location.pathname.replace(/^\/inventario\/?/, '\'''\''')|g' /var/www/html/inventario_soporte/public/js/main.js
sudo sed -i 's|history\.replaceState.*'\''/home'\''|history.replaceState({ viewName: '\''home'\'', params: null }, '\'''\''', '\''/inventario/home'\'')|g' /var/www/html/inventario_soporte/public/js/main.js

# Corregir loginView.js
sudo sed -i 's|href="/"|href="/inventario/"|g' /var/www/html/inventario_soporte/public/js/views/loginView.js
sudo sed -i 's|window\.location\.href = '\''/'\''|window.location.href = '\''/inventario/'\''|g' /var/www/html/inventario_soporte/public/js/views/loginView.js

# Corregir index.html
sudo sed -i 's|href="/" class="brand-logo"|href="/inventario/" class="brand-logo"|g' /var/www/html/inventario_soporte/public/index.html
sudo sed -i 's|src="/assets/|src="/inventario/assets/|g' /var/www/html/inventario_soporte/public/index.html

echo "Correcciones aplicadas. Reiniciando servicios..."

# Reiniciar servicios
sudo systemctl restart inventario-soporte
sudo service apache2 restart

echo "¡Correcciones completadas!"
EOF

# Hacer ejecutable y ejecutar
sudo chmod +x /tmp/corregir_rutas.sh
sudo /tmp/corregir_rutas.sh
```

---

## ⚠️ Importante: Métodos de Ejecución de Node.js

### ¿Por qué usar systemctl en lugar de `node server.js &`?

Aunque es posible ejecutar la aplicación con `node server.js &`, **NO es recomendado para producción**. Aquí las diferencias:

#### ❌ `node server.js &` (NO recomendado para producción)
```bash
cd /var/www/html/inventario_soporte
node server.js &
```
**Desventajas:**
- **Se detiene cuando cierras la terminal** o haces logout
- **No se reinicia automáticamente** si se cae
- **No inicia automáticamente** cuando arranca el servidor
- **Difícil de gestionar** (start/stop/status)
- **Sin logs centralizados**
- **No sobrevive a reinicios del servidor**

#### ✅ `systemctl` (Recomendado para producción)
```bash
sudo systemctl start inventario-soporte
sudo systemctl enable inventario-soporte
```
**Ventajas:**
- **Se reinicia automáticamente** si se cae
- **Inicia automáticamente** cuando arranca el servidor
- **Fácil de gestionar**: `start/stop/restart/status/enable/disable`
- **Logs centralizados** con `journalctl -u inventario-soporte -f`
- **Persistencia**: Sobrevive a reinicios del servidor
- **Monitoreo profesional**: `sudo systemctl status inventario-soporte`

#### 📋 Comandos de gestión del servicio:
```bash
# Iniciar servicio
sudo systemctl start inventario-soporte

# Detener servicio
sudo systemctl stop inventario-soporte

# Reiniciar servicio
sudo systemctl restart inventario-soporte

# Ver estado
sudo systemctl status inventario-soporte

# Habilitar inicio automático
sudo systemctl enable inventario-soporte

# Ver logs en tiempo real
sudo journalctl -u inventario-soporte -f
```

**En resumen:**
- `node server.js &` = **Desarrollo/Testing temporal**
- `systemctl` = **Producción profesional**

---

## Paso 7: Configuración de Archivos Estáticos

### 7.1 Crear archivo .htaccess
```bash
sudo tee /var/www/html/inventario_soporte/public/.htaccess > /dev/null << 'EOF'
# Configuración de MIME types para archivos estáticos
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

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType application/font-woff "access plus 1 month"
    ExpiresByType application/font-woff2 "access plus 1 month"
    ExpiresByType application/x-font-ttf "access plus 1 month"
</IfModule>

# Configuración de compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Configuración de seguridad
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Configuración para SPA (Single Page Application)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Si el archivo o directorio no existe, redirige a index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>
EOF
```

### 7.2 Corregir rutas en index.html
```bash
# Hacer una copia de seguridad
sudo cp /var/www/html/inventario_soporte/public/index.html /var/www/html/inventario_soporte/public/index.html.backup

# Corregir las rutas para usar el prefijo /inventario/
sudo sed -i 's|href="/|href="/inventario/|g' /var/www/html/inventario_soporte/public/index.html
sudo sed -i 's|src="/|src="/inventario/|g' /var/www/html/inventario_soporte/public/index.html
```

### 7.3 Corregir rutas en api.js
```bash
# Corregir la URL de la API
sudo sed -i 's|const API_URL = window.location.origin + '\''/api'\'';|const API_URL = window.location.origin + '\''/inventario/api'\'';|g' /var/www/html/inventario_soporte/public/js/api.js
```

---

## Paso 8: Verificación de la Instalación

### 8.1 Verificar servicios
```bash
# Verificar estado de Apache
sudo service apache2 status

# Verificar estado del servicio Node.js
sudo systemctl status inventario-soporte.service

# Verificar puertos
sudo netstat -tlnp | grep -E ":(80|3000)"
```

### 8.2 Verificar conectividad a la base de datos
```bash
# Probar conexión a la base de datos
mysql -h 192.168.0.140 -u herwingx -p'LDSinf08l$' -e "SELECT 1;"
```

### 8.3 Probar archivos estáticos
```bash
# Probar archivos CSS
curl -I http://192.168.0.54/inventario/css/style.css

# Probar archivos JS
curl -I http://192.168.0.54/inventario/js/main.js
```

### 8.4 Probar API
```bash
# Probar API de login
curl -X POST http://192.168.0.54/inventario/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linea","password":"digital"}'
```

### 8.5 Probar aplicación completa
```bash
# Probar acceso a la aplicación
curl -I http://192.168.0.54/inventario/

# Verificar que el middleware del prefijo funciona
curl -I http://192.168.0.54/inventario/home
```

### 8.6 Verificar navegación completa
```bash
# Probar flujo completo de login y navegación
echo "1. Abrir http://192.168.0.54/inventario/"
echo "2. Hacer login con usuario: linea, password: digital"
echo "3. Verificar que redirige a http://192.168.0.54/inventario/home"
echo "4. Navegar a diferentes secciones"
echo "5. Hacer logout y verificar que va a http://192.168.0.54/inventario/"
```

---

## Paso 9: Configuración de Usuario en Base de Datos

### 9.1 Crear usuario en la base de datos (si no existe)
```bash
mysql -h 192.168.0.140 -u herwingx -p'LDSinf08l$' inventario_soporte << 'EOF'
-- Verificar si el usuario existe
SELECT * FROM usuarios_sistema WHERE username = 'linea';

-- Si no existe, crearlo
INSERT INTO usuarios_sistema (username, password, email, rol_id, activo, created_at, updated_at) 
VALUES ('linea', 'digital', 'linea@linea-digital.com', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    password = 'digital',
    updated_at = NOW();

-- Verificar que se creó
SELECT username, email, activo FROM usuarios_sistema WHERE username = 'linea';
EOF
```

---

## Paso 10: Acceso a la Aplicación

### 10.1 URLs de acceso
- **Aplicación:** http://192.168.0.54/inventario
- **API:** http://192.168.0.54/inventario/api
- **Dashboard:** http://192.168.0.54/inventario/home
- **Equipos:** http://192.168.0.54/inventario/equipos

### 10.2 Credenciales de login
- **Usuario:** `linea`
- **Contraseña:** `digital`

---

## Comandos Útiles

### Reiniciar servicios
```bash
# Reiniciar Apache
sudo service apache2 restart

# Reiniciar aplicación Node.js
sudo systemctl restart inventario-soporte
```

### Ver logs
```bash
# Logs de Apache
sudo tail -f /var/log/apache2/inventario_error.log
sudo tail -f /var/log/apache2/inventario_access.log

# Logs de la aplicación
sudo journalctl -u inventario-soporte.service -f
```

### Verificar estado
```bash
# Estado de servicios
sudo service apache2 status
sudo systemctl status inventario-soporte.service

# Puertos en uso
sudo netstat -tlnp | grep -E ":(80|3000)"
```

### Verificar procesos Node.js
```bash
# Ver todos los procesos de Node.js
ps aux | grep node

# Ver procesos en el puerto 3000
sudo lsof -i :3000

# Cerrar todos los procesos de Node.js (si es necesario)
sudo pkill -f node
```

---

## Solución de Problemas

### Error de MIME type
- Verificar configuración de Apache
- Verificar archivo .htaccess
- Verificar módulos habilitados

### Error de conexión a base de datos
- Verificar credenciales en .env
- Verificar conectividad a 192.168.0.140:3306
- Verificar permisos del usuario en MySQL

### Error 404 en archivos estáticos
- Verificar rutas en index.html
- Verificar configuración de Alias en Apache
- Verificar permisos de archivos

### Error de proxy
- Verificar módulos de Apache habilitados
- Verificar configuración de ProxyPass
- Verificar que el servicio Node.js esté corriendo

### Error "Vista no implementada" o redirección incorrecta
- Verificar que el middleware del prefijo esté en server.js
- Verificar configuración de ProxyPass en Apache
- Reiniciar ambos servicios: Apache y Node.js

### ❌ Problema: Login funciona pero redirección incorrecta
**Síntomas:**
- Login exitoso en `192.168.0.54/inventario/`
- Después del login va a `192.168.0.54/home` (sin `/inventario/`)
- Logout va a `192.168.0.54/` (sin `/inventario/`)

**Causa:** Rutas hardcodeadas en archivos JavaScript del frontend

**Solución:** Aplicar las correcciones del Paso 6.4-6.6

### ❌ Problema: No se puede acceder a la aplicación
**Síntomas:**
- Error 404 al acceder a `192.168.0.54/inventario/`
- API no responde

**Causa:** Servicio Node.js no está corriendo

**Solución:**
```bash
# Verificar estado del servicio
sudo systemctl status inventario-soporte

# Si no está corriendo, iniciarlo
sudo systemctl start inventario-soporte

# Verificar logs
sudo journalctl -u inventario-soporte -f
```

### ❌ Problema: Archivos estáticos no cargan
**Síntomas:**
- CSS y JS no se cargan
- Error 404 en archivos estáticos

**Causa:** Rutas incorrectas en index.html

**Solución:**
```bash
# Aplicar correcciones de rutas
sudo sed -i 's|href="/|href="/inventario/|g' /var/www/html/inventario_soporte/public/index.html
sudo sed -i 's|src="/|src="/inventario/|g' /var/www/html/inventario_soporte/public/index.html
```

---

## 🚨 PROBLEMAS ESPECÍFICOS: Archivos Estáticos y Modo Oscuro

### ❌ Problema: Errores de MIME type y bootstrap-select
**Síntomas:**
```
Refused to apply style from 'http://192.168.0.54/inventario/vendor/bootstrap-select/dist/css/bootstrap-select.min.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
GET http://192.168.0.54/inventario/vendor/bootstrap-select/dist/js/bootstrap-select.min.js net::ERR_ABORTED 404 (Not Found)
Uncaught TypeError: $(...).selectpicker is not a function
```

**Causa:** 
- Archivos vendor no se copiaron correctamente al servidor
- MIME types incorrectos en Apache
- Modo oscuro no funciona porque faltan dependencias

**Solución:**

#### 🔧 Script automatizado para solucionar:
```bash
# Copiar el script desde tu máquina local al servidor
scp solucionar_bootstrap_select.sh usuario@192.168.0.54:/tmp/

# En el servidor Ubuntu, ejecutar:
cd /tmp
chmod +x solucionar_bootstrap_select.sh
./solucionar_bootstrap_select.sh
```

#### 🛠️ Solución manual:

**1. Copiar archivos vendor:**
```bash
# Desde tu máquina local, copiar al servidor
scp -r public/vendor/ usuario@192.168.0.54:/var/www/html/inventario_soporte/public/

# O desde el servidor, copiar desde el directorio del proyecto
sudo cp -r /ruta/al/proyecto/public/vendor/ /var/www/html/inventario_soporte/public/
```

**2. Configurar permisos:**
```bash
sudo chown -R www-data:www-data /var/www/html/inventario_soporte/public/vendor/
sudo chmod -R 755 /var/www/html/inventario_soporte/public/vendor/
```

**3. Habilitar módulos de Apache:**
```bash
sudo a2enmod mime
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo service apache2 restart
```

**4. Actualizar .htaccess:**
```bash
sudo tee /var/www/html/inventario_soporte/public/.htaccess > /dev/null << 'EOF'
# Configuración de MIME types para archivos estáticos
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

# Configuración específica para archivos CSS y JS
<IfModule mod_headers.c>
    <FilesMatch "\.css$">
        Header set Content-Type "text/css; charset=utf-8"
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
    
    <FilesMatch "\.js$">
        Header set Content-Type "application/javascript; charset=utf-8"
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
    
    <FilesMatch "\.svg$">
        Header set Content-Type "image/svg+xml; charset=utf-8"
    </FilesMatch>
    
    <FilesMatch "\.(png|jpg|jpeg|gif|ico)$">
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    ExpiresByType application/x-font-ttf "access plus 1 year"
</IfModule>

# Configuración de compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Configuración de seguridad
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Configuración para SPA (Single Page Application)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Si el archivo o directorio no existe, redirige a index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>
EOF
```

**5. Reiniciar servicios:**
```bash
sudo systemctl restart inventario-soporte
sudo service apache2 restart
```

**6. Verificar que funciona:**
```bash
# Probar acceso a archivos
curl -I http://192.168.0.54/inventario/vendor/bootstrap-select/dist/css/bootstrap-select.min.css
curl -I http://192.168.0.54/inventario/vendor/bootstrap-select/dist/js/bootstrap-select.min.js

# Verificar MIME types
curl -H "Accept: text/css" http://192.168.0.54/inventario/vendor/bootstrap-select/dist/css/bootstrap-select.min.css | head -1
```

### ✅ Verificación final:
1. **Abrir** http://192.168.0.54/inventario/
2. **Verificar** que no hay errores en la consola del navegador
3. **Probar** el modo oscuro (icono de sol/luna en la esquina superior derecha)
4. **Verificar** que los selectores funcionan correctamente

### 🔍 Si aún hay problemas:
```bash
# Ver logs de Apache
sudo tail -f /var/log/apache2/error.log

# Ver logs de la aplicación
sudo journalctl -u inventario-soporte -f

# Verificar que los archivos existen
ls -la /var/www/html/inventario_soporte/public/vendor/bootstrap-select/dist/
```

---

## Notas Importantes

1. **Cambiar IPs**: Reemplazar `192.168.0.54` con la IP del nuevo servidor
2. **Cambiar credenciales**: Actualizar credenciales de base de datos según corresponda
3. **Firewall**: Asegurar que los puertos 80 y 3000 estén abiertos
4. **SSL**: Para producción, configurar certificados SSL
5. **Backup**: Hacer backup regular de la base de datos
6. **Subcarpeta**: La aplicación está configurada para acceder desde `/inventario/` para no interferir con otros sistemas
7. **Middleware del prefijo**: El server.js incluye middleware especial para manejar `/inventario/`
8. **Rutas del frontend**: Los archivos JavaScript deben tener rutas corregidas para incluir `/inventario/`
9. **Archivos estáticos**: Los archivos vendor deben estar correctamente copiados y con MIME types configurados
10. **Modo oscuro**: Requiere que bootstrap-select y otros archivos estén correctamente cargados

---

## Estructura de Archivos

```
/var/www/html/
├── inventario_soporte/          # Aplicación de inventario
│   ├── .env                     # Variables de entorno
│   ├── server.js                # Servidor principal (con middleware de prefijo)
│   ├── package.json             # Dependencias Node.js
│   ├── public/                  # Archivos estáticos
│   │   ├── index.html          # Página principal (con rutas corregidas)
│   │   ├── .htaccess           # Configuración Apache
│   │   ├── css/                # Estilos
│   │   ├── js/                 # JavaScript (con rutas corregidas)
│   │   │   ├── main.js         # Navegación principal (corregido)
│   │   │   ├── api.js          # API client (corregido)
│   │   │   └── views/          # Vistas
│   │   │       └── loginView.js # Vista de login (corregida)
│   │   ├── vendor/             # Librerías externas (CRÍTICO para modo oscuro)
│   │   │   ├── bootstrap-select/ # Selectores (requerido)
│   │   │   ├── bootstrap/      # Framework CSS
│   │   │   └── ...             # Otras librerías
│   │   └── assets/             # Recursos estáticos
│   └── src/                    # Código fuente
│       ├── config/             # Configuraciones
│       ├── controllers/        # Controladores
│       ├── routes/             # Rutas
│       └── middleware/         # Middlewares
└── [otros sistemas]            # Otros sistemas web
```

---

¡Instalación completada! La aplicación estará disponible en http://192.168.0.54/inventario
EOF
