# Dockerfile para inventario_soporte (Ubuntu)

FROM ubuntu:22.04

# Variables de entorno para no interactuar
ENV DEBIAN_FRONTEND=noninteractive

# 1. Actualizar e instalar dependencias básicas
RUN apt-get update && \
    apt-get install -y curl wget git unzip ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 2. Instalar Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 3. Instalar dependencias de producción
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install

# 4. Copiar el resto de la aplicación
COPY . .

# 5. Crear usuario no root y cambiar permisos
RUN useradd -ms /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# 6. Exponer el puerto
EXPOSE 3000

# 7. Comando por defecto
CMD ["npm", "start"]
