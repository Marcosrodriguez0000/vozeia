document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const uploadForm = document.getElementById('upload-form');
    const cloneForm = document.getElementById('clone-form');
    const uploadBtn = document.getElementById('upload-btn');
    const cloneBtn = document.getElementById('clone-btn');
    const uploadStatus = document.getElementById('upload-status');
    const uploadSuccess = document.getElementById('upload-success');
    const uploadError = document.getElementById('upload-error');
    const errorMessage = document.getElementById('error-message');
    const cloneStatus = document.getElementById('clone-status');
    const cloneSuccess = document.getElementById('clone-success');
    const cloneError = document.getElementById('clone-error');
    const cloneErrorMessage = document.getElementById('clone-error-message');
    const originalAudio = document.getElementById('original-audio');
    const clonedAudio = document.getElementById('cloned-audio');
    const downloadBtn = document.getElementById('download-btn');
    const audioDuration = document.getElementById('audio-duration');
    const audioSampleRate = document.getElementById('audio-sample-rate');
    
    // Variables para almacenar información
    let uploadedFilename = null;
    const currentModelKey = 'xtts_v2'; // Siempre usamos XTTS v2
    
    // Funcionalidad para copiar el texto de muestra
    const copyTextBtn = document.getElementById('copy-sample-text');
    const sampleText = document.querySelector('.sample-text');
    
    if (copyTextBtn && sampleText) {
        copyTextBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(sampleText.textContent)
                .then(() => {
                    // Cambiar el texto del botón temporalmente
                    const originalText = copyTextBtn.innerHTML;
                    copyTextBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                    
                    // Volver al texto original después de 2 segundos
                    setTimeout(() => {
                        copyTextBtn.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Error al copiar texto: ', err);
                    alert('No se pudo copiar el texto. Por favor, selecciónalo manualmente.');
                });
        });
    }
    
    // Reiniciar formulario de subida cuando se selecciona un nuevo archivo
    document.getElementById('audio-file').addEventListener('change', function() {
        uploadSuccess.style.display = 'none';
        uploadError.style.display = 'none';
        cloneBtn.disabled = true;
    });
    
    // Manejar la subida de archivos de audio
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const audioFile = document.getElementById('audio-file').files[0];
        
        if (!audioFile) {
            showUploadError('Por favor, selecciona un archivo de audio.');
            return;
        }
        
        // Validar tamaño del archivo (máximo 16MB)
        if (audioFile.size > 16 * 1024 * 1024) {
            showUploadError('El archivo es demasiado grande. El tamaño máximo permitido es 16MB.');
            return;
        }
        
        // Mostrar estado de carga
        uploadBtn.disabled = true;
        uploadStatus.style.display = 'block';
        uploadSuccess.style.display = 'none';
        uploadError.style.display = 'none';
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // Enviar archivo al servidor
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadStatus.style.display = 'none';
            
            if (data.success) {
                // Guardar el nombre del archivo para usarlo en la clonación
                uploadedFilename = data.filename;
                
                // Mostrar el audio original
                originalAudio.src = `/static/uploads/${uploadedFilename}`;
                originalAudio.load();
                
                // Mostrar información del audio
                audioDuration.textContent = data.duration.toFixed(2);
                audioSampleRate.textContent = data.sample_rate;
                
                // Mostrar mensaje de éxito
                uploadSuccess.style.display = 'block';
                
                // Habilitar el botón de clonación
                cloneBtn.disabled = false;
                
                // Mostrar advertencia si el audio es demasiado corto
                if (data.duration < 10) {
                    showUploadError('Advertencia: El audio es demasiado corto. Se recomienda una duración mínima de 10 segundos para obtener mejores resultados.');
                }
            } else {
                showUploadError(data.error || 'Error al procesar el archivo de audio.');
            }
            
            uploadBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error:', error);
            showUploadError('Error de conexión. Por favor, inténtalo de nuevo.');
            uploadStatus.style.display = 'none';
            uploadBtn.disabled = false;
        });
    });
    
    // Manejar la clonación de voz
    cloneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!uploadedFilename) {
            showCloneError('Primero debes subir un archivo de audio.');
            return;
        }
        
        const textInput = document.getElementById('text-input').value.trim();
        const language = document.getElementById('language-select').value;
        
        if (!textInput) {
            showCloneError('Por favor, escribe el texto que quieres convertir en voz.');
            return;
        }
        
        // Mostrar estado de clonación
        cloneBtn.disabled = true;
        cloneStatus.style.display = 'block';
        cloneSuccess.style.display = 'none';
        cloneError.style.display = 'none';
        
        // Datos para enviar al servidor
        const cloneData = {
            text: textInput,
            filename: uploadedFilename,
            language: language
        };
        
        // Enviar solicitud de clonación al servidor
        fetch('/clone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cloneData)
        })
        .then(response => response.json())
        .then(data => {
            cloneStatus.style.display = 'none';
            
            if (data.success) {
                // Mostrar el audio clonado
                clonedAudio.src = data.output_url;
                clonedAudio.load();
                
                // Configurar el botón de descarga
                downloadBtn.href = data.output_url;
                downloadBtn.download = data.output_filename;
                
                // Mostrar mensaje de éxito
                cloneSuccess.style.display = 'block';
                
                // Reproducir automáticamente el audio clonado
                clonedAudio.play().catch(e => console.log('Reproducción automática bloqueada por el navegador'));
            } else {
                showCloneError(data.error || 'Error al clonar la voz.');
            }
            
            cloneBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error:', error);
            showCloneError('Error de conexión. Por favor, inténtalo de nuevo.');
            cloneStatus.style.display = 'none';
            cloneBtn.disabled = false;
        });
    });
    
    // Función para mostrar errores de subida
    function showUploadError(message) {
        errorMessage.textContent = message;
        uploadError.style.display = 'block';
    }
    
    // Función para mostrar errores de clonación
    function showCloneError(message) {
        cloneErrorMessage.textContent = message;
        cloneError.style.display = 'block';
    }
}); 