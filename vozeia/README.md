# VozEIA - Clonador de Voces Instantáneo

VozEIA es una aplicación web que permite clonar voces utilizando modelos de inteligencia artificial ya entrenados. Con esta herramienta, puedes subir un archivo de audio y generar una voz sintética que imite la voz original.

## Características

- Clonación de voz instantánea
- Interfaz web intuitiva
- Soporte para múltiples idiomas
- Descarga de resultados en formato MP3
- Procesamiento en tiempo real

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
python app/app.py
```

4. Abrir en el navegador: `http://localhost:5000`

## Uso

1. Sube un archivo de audio con la voz que deseas clonar
2. Escribe el texto que quieres que la voz clonada diga
3. Selecciona el idioma y ajusta los parámetros si es necesario
4. Haz clic en "Generar" y espera a que se procese
5. Escucha y descarga el resultado

## Tecnologías utilizadas

- Flask (Backend)
- HTML, CSS, JavaScript (Frontend)
- Coqui TTS (Motor de síntesis de voz)
- Librosa (Procesamiento de audio)

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 