FROM python:3.9-slim

WORKDIR /app

# Copiar archivos de requisitos primero para aprovechar la caché de Docker
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de la aplicación
COPY . .

# Variables de entorno
ENV PORT=8082
ENV HOST=0.0.0.0

# Exponer el puerto
EXPOSE 8082

# Comando para ejecutar la aplicación
CMD gunicorn --bind $HOST:$PORT app.app:app 