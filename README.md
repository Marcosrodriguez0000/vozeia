# VozEIA - Asistente y Clonador de Voz

VozEIA es una plataforma de inteligencia artificial que combina un asistente de voz interactivo y un clonador de voz en una sola aplicación web.

## Características

### Asistente de Voz
- Interfaz de usuario moderna y futurista con efectos visuales reactivos
- Reconocimiento de voz en tiempo real
- Respuestas de voz naturales
- Visualización de ondas de audio
- Compatibilidad con múltiples navegadores (optimizado para Chrome/Edge)

### Clonador de Voz
- Capacidad para clonar voces a partir de muestras de audio
- Generación de voz sintética que imita la voz original
- Interfaz intuitiva para cargar y procesar muestras

## Tecnologías Utilizadas
- Python (Flask)
- JavaScript
- HTML/CSS
- WebSpeech API
- Tecnologías de procesamiento de voz y NLP

## Instalación

1. Clona este repositorio:
```
git clone https://github.com/Marcosrodriguez0000/vozeia.git
```

2. Navega al directorio del proyecto:
```
cd vozeia
```

3. Crea y activa un entorno virtual:
```
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
```

4. Instala las dependencias:
```
pip install -r requirements.txt
```

5. Ejecuta la aplicación:
```
python -m app.app --host=0.0.0.0 --port=8082
```

6. Abre tu navegador y visita:
```
http://localhost:8082
```

## Uso

1. **Asistente de Voz**: Haz clic en el botón del micrófono y habla con el asistente.
2. **Clonador de Voz**: Sube muestras de audio y sigue las instrucciones para clonar una voz.

## Notas para Desarrolladores

- La aplicación está optimizada para Chrome y Edge, pero incluye adaptaciones para Safari.
- Para acceder desde otros dispositivos en la misma red, usa la IP de tu máquina con el puerto 8082.

## Licencia

Este proyecto está disponible como código abierto bajo los términos de la licencia MIT. 