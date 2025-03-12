# VozEIA - Asistente de Voz Inteligente

VozEIA es una aplicación web que combina tecnologías de reconocimiento de voz, síntesis de voz y clonación de voz para crear una experiencia interactiva para personas con dificultades del habla o cualquier usuario que desee interactuar mediante la voz.

## Características principales

- **Asistente de voz inteligente**: Conversación natural mediante reconocimiento y síntesis de voz.
- **Clonación de voz**: Tecnología avanzada para clonar voces a partir de muestras de audio.
- **Interfaz moderna**: Diseño intuitivo y atractivo con animaciones y efectos visuales.
- **Multilingüe**: Soporte para español y otros idiomas.

## Tecnologías utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Reconocimiento de voz**: Web Speech API
- **Síntesis de voz**: TTS (Text-to-Speech)
- **Modelo de voz**: XTTS v2 (Multilingual)

## Requisitos

- Python 3.9+
- Navegador moderno (Chrome, Edge recomendados)
- Micrófono

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/vozeia.git
   cd vozeia
   ```

2. Crear un entorno virtual:
   ```
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```

4. Ejecutar la aplicación:
   ```
   python -m app.app
   ```

5. Abrir en el navegador:
   ```
   http://localhost:8082
   ```

## Uso

- **Asistente de voz**: Navega a la sección "Asistente de Voz" y haz clic en el botón del micrófono para comenzar a hablar.
- **Clonación de voz**: Sube un archivo de audio con tu voz y escribe el texto que deseas que se reproduzca con tu voz clonada.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

## Contacto

Para preguntas o sugerencias, contacta a [tu-email@ejemplo.com]. 