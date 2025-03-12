# VozEIA - Asistente y Clonador de Voz Inteligente

VozEIA es una aplicación web que combina un asistente de voz inteligente con capacidades de clonación de voz utilizando modelos de inteligencia artificial. Con esta herramienta, puedes interactuar mediante voz con un asistente virtual y también clonar voces para generar audio sintético.

## Características

- Asistente de voz inteligente con interfaz conversacional
- Clonación de voz instantánea
- Interfaz web moderna y atractiva
- Soporte para múltiples idiomas
- Descarga de resultados en formato MP3
- Procesamiento en tiempo real
- Visualización de ondas de voz

## Requisitos

- Python 3.8 o superior
- Dependencias listadas en `requirements.txt`

## Instalación

1. Clonar el repositorio:
```
git clone https://github.com/tu-usuario/vozeia.git
cd vozeia
```

2. Crear un entorno virtual e instalar dependencias:
```
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Ejecutar la aplicación:
```
python -m app.app --host=0.0.0.0 --port=8082
```

4. Abrir en el navegador: `http://localhost:8082`

## Uso

### Asistente de Voz
1. Navega a la sección "Asistente de Voz"
2. Haz clic en el botón del micrófono para comenzar a hablar
3. Interactúa con el asistente mediante comandos de voz
4. Observa las respuestas tanto en texto como en voz

### Clonador de Voz
1. Navega a la sección "Clonador de Voz"
2. Sube un archivo de audio con la voz que deseas clonar
3. Escribe el texto que quieres que la voz clonada diga
4. Selecciona el idioma y ajusta los parámetros si es necesario
5. Haz clic en "Generar" y espera a que se procese
6. Escucha y descarga el resultado

## Despliegue en Render

Esta aplicación está configurada para ser desplegada fácilmente en Render:

1. Crea una cuenta en [Render](https://render.com) si aún no tienes una
2. En el Dashboard de Render, haz clic en "New" y selecciona "Web Service"
3. Selecciona "Build and deploy from a local directory"
4. Sube un archivo ZIP con el contenido de este repositorio
5. Configura el servicio con los siguientes valores:
   - **Name**: vozeia (o el nombre que prefieras)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.app:app --bind 0.0.0.0:$PORT`
6. Haz clic en "Create Web Service"

La aplicación estará disponible en la URL proporcionada por Render una vez que el despliegue se complete.

## Tecnologías utilizadas

- Flask (Backend)
- HTML, CSS, JavaScript (Frontend)
- Web Speech API (Reconocimiento y síntesis de voz)
- Coqui TTS (Motor de síntesis de voz)
- Librosa (Procesamiento de audio)

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 