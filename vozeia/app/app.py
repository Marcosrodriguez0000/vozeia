import os
import uuid
import torch
import json
import datetime
import numpy as np
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import librosa
import soundfile as sf
from TTS.api import TTS
import speech_recognition as sr
from difflib import SequenceMatcher
import time

# Permitir la carga insegura del modelo XTTS v2
try:
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import XttsAudioConfig
    from TTS.config.shared_configs import BaseDatasetConfig
    
    # Añadir todas las clases necesarias a la lista de globals seguros
    safe_classes = [
        XttsConfig, 
        XttsAudioConfig, 
        BaseDatasetConfig
    ]
    
    # Registrar las clases como seguras para la deserialización
    torch.serialization.add_safe_globals(safe_classes)
except ImportError as e:
    print(f"Error al importar clases de XTTS: {e}")
    print("Algunas funcionalidades pueden no estar disponibles.")

app = Flask(__name__)

# Configuración
UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# Modelo TTS
TTS_MODEL = None

# Definición de modelos disponibles
AVAILABLE_MODELS = {
    'xtts_v2': {
        'name': 'XTTS v2',
        'model_id': 'tts_models/multilingual/multi-dataset/xtts_v2',
        'description': 'Modelo avanzado de clonación de voz con alta calidad y naturalidad. Soporta español y otros idiomas.',
        'languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'zh-cn'],
        'default': True
    }
}

# Almacenamiento simulado para el progreso del usuario
# En una aplicación real, esto estaría en una base de datos
USER_PROGRESS = {
    'dates': [],
    'scores': []
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def initialize_tts_model(model_id=None):
    global TTS_MODEL
    
    if model_id is None:
        model_id = AVAILABLE_MODELS['xtts_v2']['model_id']
    
    print(f"Inicializando modelo: {model_id}")
    
    # Verificar si hay GPU disponible
    use_gpu = torch.cuda.is_available()
    if use_gpu:
        print("GPU disponible, utilizando aceleración por hardware")
    else:
        print("GPU no disponible, utilizando CPU (esto puede ser más lento)")
    
    try:
        # Intentar cargar el modelo
        TTS_MODEL = TTS(model_name=model_id, progress_bar=True, gpu=use_gpu)
        print(f"Modelo {model_id} cargado correctamente")
        return True
    except Exception as e:
        print(f"Error al cargar el modelo {model_id}: {e}")
        return False

# Inicializar el modelo al arrancar la aplicación
initialize_tts_model()

@app.route('/')
def index():
    # Pasar la información de los modelos disponibles a la plantilla
    return render_template('index.html', models=AVAILABLE_MODELS)

@app.route('/speech-therapy')
def speech_therapy():
    # Ruta para la página de terapia del habla
    return render_template('speech_therapy.html')

@app.route('/voice-clone')
def voice_clone():
    # Ruta para la página de clonación de voz
    return render_template('voice_clone.html')

@app.route('/test')
def test():
    return "La aplicación está funcionando correctamente"

@app.route('/models', methods=['GET'])
def get_models():
    return jsonify({"success": True, "models": AVAILABLE_MODELS})

@app.route('/models/select', methods=['POST'])
def select_model():
    data = request.json
    
    if 'model_key' not in data:
        return jsonify({"success": False, "error": "No se ha especificado el modelo"})
    
    model_key = data['model_key']
    
    if model_key not in AVAILABLE_MODELS:
        return jsonify({"success": False, "error": "Modelo no válido"})
    
    model_id = AVAILABLE_MODELS[model_key]['model_id']
    
    # Inicializar el modelo seleccionado
    if initialize_tts_model(model_id):
        return jsonify({"success": True, "model": AVAILABLE_MODELS[model_key]})
    else:
        return jsonify({
            "success": False, 
            "error": f"No se pudo cargar el modelo {AVAILABLE_MODELS[model_key]['name']}"
        })

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({"success": False, "error": "No se ha enviado ningún archivo"})
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({"success": False, "error": "No se ha seleccionado ningún archivo"})
    
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Formato de archivo no permitido"})
    
    try:
        # Generar un nombre único para el archivo
        filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Guardar el archivo
        file.save(filepath)
        
        # Obtener información del audio
        y, sr = librosa.load(filepath, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        
        return jsonify({
            "success": True,
            "filename": filename,
            "duration": duration,
            "sample_rate": sr
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/clone', methods=['POST'])
def clone_voice():
    global TTS_MODEL
    
    data = request.json
    
    # Verificar que se han enviado todos los datos necesarios
    if not all(key in data for key in ['text', 'filename']):
        return jsonify({"success": False, "error": "Faltan datos requeridos"})
    
    text = data['text']
    filename = data['filename']
    language = data.get('language', 'es')  # Español por defecto
    
    # Forzar el uso del modelo XTTS v2 para español
    model_key = 'xtts_v2'
    
    # Verificar que el modelo está disponible
    if TTS_MODEL is None:
        # Intentar inicializar el modelo
        if not initialize_tts_model(AVAILABLE_MODELS[model_key]['model_id']):
            return jsonify({"success": False, "error": "No se pudo cargar el modelo de voz"})
    
    # Verificar que el idioma es compatible con el modelo
    if language not in AVAILABLE_MODELS[model_key]['languages']:
        return jsonify({
            "success": False, 
            "error": f"El idioma {language} no es compatible con el modelo seleccionado"
        })
    
    try:
        # Ruta del archivo de audio original
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # Generar un nombre único para el archivo de salida
        output_filename = f"cloned_{uuid.uuid4()}.wav"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        
        # Generar el audio clonado
        TTS_MODEL.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=input_path,
            language=language
        )
        
        # Devolver la URL del audio generado
        output_url = f"/static/uploads/{output_filename}"
        
        return jsonify({
            "success": True,
            "output_url": output_url,
            "output_filename": output_filename,
            "model_used": AVAILABLE_MODELS[model_key]['name']
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename), as_attachment=True)

@app.route('/models/info')
def models_info():
    # Información sobre los modelos disponibles y sus capacidades
    return jsonify({
        "success": True,
        "models": AVAILABLE_MODELS,
        "current_model": "xtts_v2"  # Siempre usamos XTTS v2
    })

@app.route('/speech-therapy/analyze', methods=['POST'])
def analyze_speech():
    global USER_PROGRESS
    
    if 'audio' not in request.files:
        return jsonify({"success": False, "error": "No se ha enviado ningún archivo de audio"})
    
    audio_file = request.files['audio']
    reference_text = request.form.get('reference_text', '')
    
    if not reference_text:
        return jsonify({"success": False, "error": "No se ha proporcionado un texto de referencia"})
    
    try:
        # Guardar el archivo de audio temporalmente
        temp_filename = f"temp_{uuid.uuid4()}.wav"
        temp_filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
        audio_file.save(temp_filepath)
        
        # Utilizar reconocimiento de voz para transcribir el audio
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_filepath) as source:
            audio_data = recognizer.record(source)
            detected_text = recognizer.recognize_google(audio_data, language='es-ES')
        
        # Calcular la similitud entre el texto detectado y el texto de referencia
        similarity = SequenceMatcher(None, reference_text.lower(), detected_text.lower()).ratio()
        accuracy = int(similarity * 100)
        
        # Generar sugerencias basadas en la precisión
        suggestions = generate_suggestions(reference_text, detected_text, accuracy)
        
        # Guardar el progreso del usuario
        today = datetime.datetime.now().strftime('%d/%m')
        USER_PROGRESS['dates'].append(today)
        USER_PROGRESS['scores'].append(accuracy)
        
        # Limitar el historial a los últimos 10 intentos
        if len(USER_PROGRESS['dates']) > 10:
            USER_PROGRESS['dates'] = USER_PROGRESS['dates'][-10:]
            USER_PROGRESS['scores'] = USER_PROGRESS['scores'][-10:]
        
        return jsonify({
            "success": True,
            "detected_text": detected_text,
            "accuracy": accuracy,
            "suggestions": suggestions,
            "progress_data": USER_PROGRESS
        })
    except sr.UnknownValueError:
        return jsonify({
            "success": False,
            "error": "No se pudo entender el audio. Intenta hablar más claro o reducir el ruido de fondo."
        })
    except sr.RequestError as e:
        return jsonify({
            "success": False,
            "error": f"Error en el servicio de reconocimiento de voz: {e}"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    finally:
        # Eliminar el archivo temporal
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

@app.route('/speech-therapy/chat', methods=['POST'])
def chat_with_assistant():
    data = request.json
    
    if 'message' not in data:
        return jsonify({"success": False, "error": "No se ha enviado ningún mensaje"})
    
    user_message = data['message']
    
    try:
        # Procesar el mensaje del usuario
        # Añadir un pequeño retraso para simular procesamiento
        time.sleep(0.5)
        
        # Generar respuesta del asistente
        response = generate_assistant_response(user_message)
        
        return jsonify({
            "success": True,
            "response": response
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

def generate_suggestions(reference_text, detected_text, accuracy):
    """Genera sugerencias para mejorar la pronunciación basadas en la comparación de textos."""
    suggestions = []
    
    if accuracy < 50:
        suggestions.append("Intenta hablar más despacio y pronunciar cada palabra con claridad.")
        suggestions.append("Practica cada palabra por separado antes de decir la frase completa.")
    elif accuracy < 80:
        suggestions.append("Tu pronunciación es buena, pero puedes mejorar el ritmo y la entonación.")
        
    # Comparar palabras individuales
    ref_words = reference_text.lower().split()
    det_words = detected_text.lower().split()
    
    # Encontrar palabras problemáticas
    for i, ref_word in enumerate(ref_words):
        if i < len(det_words):
            word_similarity = SequenceMatcher(None, ref_word, det_words[i]).ratio()
            if word_similarity < 0.7:
                suggestions.append(f"Practica la pronunciación de la palabra '{ref_word}'.")
    
    # Si no hay sugerencias específicas pero la precisión no es perfecta
    if not suggestions and accuracy < 95:
        suggestions.append("Intenta mejorar la entonación y el ritmo natural de la frase.")
    
    # Si la precisión es muy alta
    if accuracy >= 95:
        suggestions.append("¡Excelente pronunciación! Sigue practicando para mantener tu nivel.")
    
    return suggestions[:3]  # Limitar a 3 sugerencias para no abrumar

def generate_assistant_response(user_message):
    """
    Genera una respuesta del asistente basada en el mensaje del usuario.
    Utiliza OpenAI para generar respuestas naturales y contextuales.
    """
    try:
        # Importar la biblioteca de OpenAI
        import openai
        
        # Configurar la API key (deberías guardar esto en una variable de entorno)
        # openai.api_key = os.environ.get("OPENAI_API_KEY", "tu-api-key-aquí")
        
        # Crear un mensaje para el asistente
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente amable y conversacional diseñado para ayudar a personas con dificultades del habla. Tus respuestas deben ser claras, naturales y empáticas. Evita respuestas demasiado largas."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        # Extraer la respuesta
        assistant_response = response.choices[0].message.content.strip()
        
        # Si no se puede usar OpenAI, usar respuestas predefinidas como fallback
        return assistant_response
        
    except Exception as e:
        print(f"Error al generar respuesta con OpenAI: {e}")
        
        # Respuestas predefinidas como fallback
        import random
        
        respuestas = [
            f"Entiendo lo que dices sobre {user_message}. ¿Puedes contarme más?",
            "Eso es interesante. ¿Qué más te gustaría compartir conmigo?",
            "Gracias por compartir eso. ¿Hay algo más en lo que pueda ayudarte?",
            "Estoy aquí para escucharte. ¿Quieres hablar de algún otro tema?",
            "Me gusta conversar contigo. ¿Qué más te interesa?",
            "Entiendo. ¿Hay algo específico que te gustaría preguntarme?",
            "Estoy procesando lo que me dices. ¿Puedes darme más detalles?",
            "Eso suena bien. ¿Quieres que hablemos más sobre este tema?",
            "Estoy aprendiendo de nuestra conversación. ¿Qué más te gustaría decirme?",
            "Gracias por tu paciencia. Me encanta poder conversar contigo."
        ]
        
        return random.choice(respuestas)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8082))
    app.run(host='0.0.0.0', port=port, debug=True) 