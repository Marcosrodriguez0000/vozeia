document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const uploadForm = document.getElementById('upload-form');
    const audioFileInput = document.getElementById('audio-file');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const uploadSuccess = document.getElementById('upload-success');
    const uploadError = document.getElementById('upload-error');
    const errorMessage = document.getElementById('error-message');
    const audioDuration = document.getElementById('audio-duration');
    const audioSampleRate = document.getElementById('audio-sample-rate');
    const originalAudio = document.getElementById('original-audio');
    
    const cloneForm = document.getElementById('clone-form');
    const textInput = document.getElementById('text-input');
    const languageSelect = document.getElementById('language-select');
    const cloneBtn = document.getElementById('clone-btn');
    const cloneStatus = document.getElementById('clone-status');
    const cloneSuccess = document.getElementById('clone-success');
    const cloneError = document.getElementById('clone-error');
    const cloneErrorMessage = document.getElementById('clone-error-message');
    const clonedAudio = document.getElementById('cloned-audio');
    const downloadBtn = document.getElementById('download-btn');
    
    const copySampleTextBtn = document.getElementById('copy-sample-text');
    
    // Variables para almacenar información del audio subido
    let uploadedFilename = null;
    
    // Copiar texto de ejemplo al portapapeles
    copySampleTextBtn.addEventListener('click', function() {
        const sampleText = document.querySelector('.sample-text').textContent;
        navigator.clipboard.writeText(sampleText).then(() => {
            const originalText = copySampleTextBtn.innerHTML;
            copySampleTextBtn.innerHTML = '<i class="fas fa-check"></i> Copiado';
            setTimeout(() => {
                copySampleTextBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar texto: ', err);
            alert('No se pudo copiar el texto. Por favor, cópialo manualmente.');
        });
    });
    
    // Subir archivo de audio
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar que se ha seleccionado un archivo
        if (!audioFileInput.files[0]) {
            showUploadError('Por favor, selecciona un archivo de audio.');
            return;
        }
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('audio', audioFileInput.files[0]);
        
        // Mostrar estado de carga
        uploadBtn.disabled = true;
        uploadStatus.style.display = 'block';
        uploadSuccess.style.display = 'none';
        uploadError.style.display = 'none';
        
        // Enviar el archivo al servidor
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadBtn.disabled = false;
            uploadStatus.style.display = 'none';
            
            if (data.success) {
                // Guardar el nombre del archivo para usarlo en la clonación
                uploadedFilename = data.filename;
                
                // Mostrar información del audio
                audioDuration.textContent = data.duration.toFixed(2);
                audioSampleRate.textContent = data.sample_rate;
                
                // Configurar el reproductor de audio
                originalAudio.src = `/static/uploads/${data.filename}`;
                
                // Mostrar el éxito
                uploadSuccess.style.display = 'block';
                
                // Habilitar el botón de clonación
                cloneBtn.disabled = false;
            } else {
                showUploadError(data.error);
            }
        })
        .catch(error => {
            uploadBtn.disabled = false;
            uploadStatus.style.display = 'none';
            showUploadError('Error de conexión. Por favor, inténtalo de nuevo.');
            console.error('Error:', error);
        });
    });
    
    // Clonar voz
    cloneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar que se ha subido un archivo de audio
        if (!uploadedFilename) {
            showCloneError('Primero debes subir un archivo de audio.');
            return;
        }
        
        // Verificar que se ha ingresado texto
        if (!textInput.value.trim()) {
            showCloneError('Por favor, ingresa el texto que quieres convertir a voz.');
            return;
        }
        
        // Datos para la clonación
        const cloneData = {
            text: textInput.value,
            filename: uploadedFilename,
            language: languageSelect.value
        };
        
        // Mostrar estado de clonación
        cloneBtn.disabled = true;
        cloneStatus.style.display = 'block';
        cloneSuccess.style.display = 'none';
        cloneError.style.display = 'none';
        
        // Enviar la solicitud al servidor
        fetch('/clone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cloneData)
        })
        .then(response => response.json())
        .then(data => {
            cloneBtn.disabled = false;
            cloneStatus.style.display = 'none';
            
            if (data.success) {
                // Configurar el reproductor de audio
                clonedAudio.src = data.output_url;
                
                // Configurar el botón de descarga
                downloadBtn.href = data.output_url;
                downloadBtn.download = data.output_filename;
                
                // Mostrar el éxito
                cloneSuccess.style.display = 'block';
                
                // Reproducir automáticamente el audio clonado
                clonedAudio.play();
            } else {
                showCloneError(data.error);
            }
        })
        .catch(error => {
            cloneBtn.disabled = false;
            cloneStatus.style.display = 'none';
            showCloneError('Error de conexión. Por favor, inténtalo de nuevo.');
            console.error('Error:', error);
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