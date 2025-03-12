document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const activateVoiceBtn = document.getElementById('activate-voice-btn');
    const stopVoiceBtn = document.getElementById('stop-voice-btn');
    const chatMessages = document.getElementById('chat-messages');
    const statusText = document.getElementById('status-text');
    const voiceCircle = document.querySelector('.voice-circle');
    
    // Variables para la grabación de audio
    let conversationActive = false;
    let recognition = null;
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let javascriptNode = null;
    
    // Inicializar partículas
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 30, density: { enable: true, value_area: 800 } },
                color: { value: "#5777eb" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#5777eb", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false }
            },
            interactivity: {
                detect_on: "canvas",
                events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" } },
                modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });
    }
    
    // Función para reproducir texto usando la API de síntesis de voz
    function speakText(text) {
        if ('speechSynthesis' in window) {
            try {
                // Detener cualquier síntesis de voz en curso
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configurar la voz en español con opciones mínimas
                utterance.lang = 'es-ES';
                
                // Obtener todas las voces disponibles
                let voices = speechSynthesis.getVoices();
                
                // Si las voces no están disponibles inmediatamente, esperar a que se carguen
                if (voices.length === 0) {
                    speechSynthesis.addEventListener('voiceschanged', function() {
                        voices = speechSynthesis.getVoices();
                        setVoice();
                    });
                } else {
                    setVoice();
                }
                
                // Función para seleccionar la mejor voz disponible
                function setVoice() {
                    // Buscar cualquier voz en español
                    const spanishVoices = voices.filter(voice => voice.lang.includes('es'));
                    if (spanishVoices.length > 0) {
                        utterance.voice = spanishVoices[0];
                        console.log('Usando voz: ' + spanishVoices[0].name);
                    }
                }
                
                // Ajustar parámetros para una voz más natural
                utterance.rate = 1.0;     // Velocidad normal
                utterance.pitch = 1.0;    // Tono normal
                utterance.volume = 1.0;   // Volumen máximo
                
                // Cambiar el estado visual a hablando
                voiceCircle.classList.remove('listening');
                voiceCircle.classList.remove('processing');
                voiceCircle.classList.add('speaking');
                statusText.textContent = 'Hablando...';
                
                // Eventos para depuración
                utterance.onstart = function(event) {
                    console.log('Comenzó la síntesis de voz');
                };
                
                utterance.onend = function(event) {
                    console.log('Finalizó la síntesis de voz');
                    // Restaurar estado de escucha si sigue activa la conversación
                    if (conversationActive) {
                        voiceCircle.classList.remove('speaking');
                        voiceCircle.classList.add('listening');
                        statusText.textContent = 'Escuchando...';
                    } else {
                        voiceCircle.classList.remove('speaking');
                        statusText.textContent = 'Esperando activación';
                    }
                };
                
                utterance.onerror = function(event) {
                    console.error('Error en la síntesis de voz:', event);
                    // Restaurar estado de escucha si sigue activa la conversación
                    if (conversationActive) {
                        voiceCircle.classList.remove('speaking');
                        voiceCircle.classList.add('listening');
                        statusText.textContent = 'Escuchando...';
                    } else {
                        voiceCircle.classList.remove('speaking');
                        statusText.textContent = 'Esperando activación';
                    }
                };
                
                // Reproducir el texto
                speechSynthesis.speak(utterance);
            } catch (e) {
                console.error('Error al configurar la síntesis de voz:', e);
                // Mostrar el texto en lugar de reproducirlo
                statusText.textContent = 'Error en la síntesis de voz';
                
                // Añadir el texto como mensaje visual sin intentar reproducirlo
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message assistant text-only';
                messageDiv.innerHTML = `
                    <div class="message-content">
                        ${text} <small class="text-muted">(Síntesis de voz no disponible)</small>
                    </div>
                `;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else {
            console.error('Tu navegador no soporta la síntesis de voz.');
            // Mostrar el texto en lugar de reproducirlo
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant text-only';
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${text} <small class="text-muted">(Síntesis de voz no disponible)</small>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Funcionalidad de conversación con el asistente
    activateVoiceBtn.addEventListener('click', function() {
        if (!conversationActive) {
            startConversation();
        }
    });
    
    stopVoiceBtn.addEventListener('click', function() {
        if (conversationActive) {
            stopConversation();
        }
    });
    
    // Función para inicializar el reconocimiento de voz con configuración específica para Safari
    function initializeSpeechRecognition() {
        // Detectar si estamos en Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (!('webkitSpeechRecognition' in window)) {
            console.log('API de reconocimiento de voz no soportada');
            addAssistantMessage("Tu navegador no soporta el reconocimiento de voz. Por favor, intenta con Chrome o Edge.");
            return null;
        }
        
        try {
            const recognition = new webkitSpeechRecognition();
            
            // Configuración específica para Safari
            if (isSafari) {
                recognition.continuous = false;  // Safari tiene problemas con continuous=true
                recognition.interimResults = false;  // Desactivar resultados intermedios en Safari
                recognition.maxAlternatives = 1;  // Limitar alternativas para mejorar rendimiento
            } else {
                recognition.continuous = true;
                recognition.interimResults = true;
            }
            
            // Configuración común para todos los navegadores
            recognition.lang = 'es-ES';
            
            return recognition;
        } catch (e) {
            console.error('Error al crear objeto de reconocimiento de voz:', e);
            return null;
        }
    }
    
    // Función para iniciar la conversación
    function startConversation() {
        // Detectar si estamos en Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log("Navegador detectado:", isSafari ? "Safari" : "No Safari");
        
        // Iniciar la conversación sin depender del micrófono primero
        conversationActive = true;
        activateVoiceBtn.style.display = 'none';
        stopVoiceBtn.style.display = 'block';
        
        // Actualizar el estado visual
        voiceCircle.classList.add('listening');
        statusText.textContent = 'Iniciando...';
        
        // Mostrar mensaje de inicio
        addAssistantMessage("Estoy iniciando el reconocimiento de voz. Por favor, espera un momento...");
        
        // Esperar un momento antes de intentar acceder al micrófono
        setTimeout(() => {
            // Intentar iniciar el reconocimiento de voz
            startVoiceRecognition();
        }, 1500);
    }
    
    // Función para iniciar el reconocimiento de voz
    function startVoiceRecognition() {
        // Inicializar el reconocimiento de voz
        recognition = initializeSpeechRecognition();
        
        if (!recognition) {
            statusText.textContent = 'Error: Reconocimiento no disponible';
            addAssistantMessage("No se pudo iniciar el reconocimiento de voz. Por favor, intenta con otro navegador como Chrome o Edge.");
            return;
        }
        
        // Configurar eventos del reconocimiento
        recognition.onstart = function() {
            console.log('Reconocimiento de voz iniciado');
            statusText.textContent = 'Escuchando...';
        };
        
        recognition.onresult = function(event) {
            let transcript = '';
            
            // Obtener el resultado final
            if (event.results.length > 0) {
                transcript = event.results[0][0].transcript;
                
                // Procesar el mensaje del usuario
                if (transcript.trim() !== '') {
                    addUserMessage(transcript);
                    
                    // Cambiar estado visual a procesando
                    voiceCircle.classList.remove('listening');
                    voiceCircle.classList.add('processing');
                    statusText.textContent = 'Procesando...';
                    
                    processUserMessage(transcript);
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Error en el reconocimiento de voz:', event.error, event);
            
            // Restaurar estado visual
            voiceCircle.classList.remove('listening');
            voiceCircle.classList.remove('processing');
            
            if (event.error === 'no-speech') {
                // No mostrar mensaje de error por no detectar habla, para no interrumpir
                console.log('No se detectó habla, reiniciando...');
                statusText.textContent = 'No se detectó habla, sigue intentando...';
                voiceCircle.classList.add('listening');
                
                // Reiniciar el reconocimiento después de un breve retraso
                setTimeout(() => {
                    if (conversationActive) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error al reiniciar el reconocimiento:', e);
                        }
                    }
                }, 1000);
            } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                statusText.textContent = 'Error: Permiso denegado';
                addAssistantMessage("No tengo permiso para acceder al micrófono. Por favor, sigue estos pasos:<br>1. Haz clic en el icono de candado o 'AA' en la barra de direcciones<br>2. Asegúrate de que el micrófono esté permitido<br>3. Recarga la página e intenta de nuevo");
            } else if (event.error === 'audio-capture') {
                statusText.textContent = 'Error: No se detecta micrófono';
                addAssistantMessage("No se ha detectado ningún micrófono. Por favor, verifica que tu micrófono esté conectado correctamente.");
            } else {
                statusText.textContent = 'Error en el reconocimiento de voz';
                addAssistantMessage("Ha ocurrido un error con el reconocimiento de voz. Voy a intentar reiniciar el reconocimiento automáticamente.");
                
                // Reiniciar el reconocimiento después de un breve retraso
                setTimeout(() => {
                    if (conversationActive) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error al reiniciar el reconocimiento:', e);
                        }
                    }
                }, 2000);
            }
        };
        
        recognition.onend = function() {
            console.log('Reconocimiento de voz finalizado');
            
            // Si la conversación sigue activa, reiniciar el reconocimiento
            if (conversationActive) {
                // Restaurar estado de escucha
                voiceCircle.classList.remove('processing');
                voiceCircle.classList.add('listening');
                statusText.textContent = 'Escuchando...';
                
                // Reiniciar el reconocimiento después de un breve retraso
                setTimeout(() => {
                    try {
                        recognition.start();
                        console.log('Reconocimiento de voz reiniciado');
                    } catch (e) {
                        console.error('Error al reiniciar el reconocimiento:', e);
                        
                        // Intentar crear un nuevo objeto de reconocimiento
                        recognition = initializeSpeechRecognition();
                        if (recognition) {
                            try {
                                recognition.start();
                                console.log('Nuevo reconocimiento de voz iniciado');
                            } catch (e2) {
                                console.error('Error al iniciar nuevo reconocimiento:', e2);
                                addAssistantMessage("No se pudo reiniciar el reconocimiento de voz. Por favor, recarga la página e intenta de nuevo.");
                            }
                        }
                    }
                }, 1000);
            }
        };
        
        // Intentar iniciar el reconocimiento
        try {
            recognition.start();
            console.log('Iniciando reconocimiento de voz');
            
            // Intentar acceder al micrófono para la visualización
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("Intentando acceder al micrófono para visualización...");
                
                navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                })
                .then(stream => {
                    console.log('Acceso al micrófono concedido para visualización');
                    setupAudioVisualizationWithStream(stream);
                })
                .catch(err => {
                    console.error('Error al acceder al micrófono para visualización:', err);
                    // Continuar sin visualización
                });
            }
        } catch (e) {
            console.error('Error al iniciar el reconocimiento:', e);
            statusText.textContent = 'Error al iniciar';
            addAssistantMessage("No se pudo iniciar el reconocimiento de voz. Por favor, recarga la página e intenta de nuevo.");
        }
    }
    
    // Función para configurar la visualización de audio con un stream existente
    function setupAudioVisualizationWithStream(stream) {
        if (!window.AudioContext) {
            console.log('API de AudioContext no soportada');
            return;
        }
        
        try {
            // Crear contexto de audio
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            
            // Configurar el analizador con valores mínimos
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            
            // Usar el stream proporcionado
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            
            // Crear nodo de procesamiento de la manera más simple posible
            try {
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);
                
                // Procesar datos de audio
                javascriptNode.onaudioprocess = function() {
                    const array = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(array);
                    
                    // Calcular el volumen promedio
                    let values = 0;
                    const length = array.length;
                    for (let i = 0; i < length; i++) {
                        values += array[i];
                    }
                    const average = values / length;
                    
                    // Ajustar la animación según el volumen
                    if (conversationActive && voiceCircle.classList.contains('listening')) {
                        const waves = document.querySelectorAll('.wave');
                        const scaleFactor = 1 + (average / 100);
                        
                        waves.forEach((wave, index) => {
                            const delay = index * 0.1;
                            const scale = 1 + (scaleFactor * (index + 1) * 0.2);
                            wave.style.transform = `scale(${scale})`;
                            wave.style.opacity = 0.7 - (index * 0.15);
                        });
                    }
                };
            } catch (e) {
                console.error('Error al crear nodo de procesamiento:', e);
                // Continuar sin visualización
            }
        } catch (e) {
            console.error('Error al configurar la visualización de audio:', e);
        }
    }
    
    // Función para detener la conversación
    function stopConversation() {
        conversationActive = false;
        activateVoiceBtn.style.display = 'block';
        stopVoiceBtn.style.display = 'none';
        
        // Restaurar estado visual
        voiceCircle.classList.remove('listening');
        voiceCircle.classList.remove('processing');
        voiceCircle.classList.remove('speaking');
        statusText.textContent = 'Esperando activación';
        
        // Detener el reconocimiento de voz
        if (recognition) {
            try {
                recognition.stop();
                console.log('Reconocimiento de voz detenido');
            } catch (e) {
                console.error('Error al detener el reconocimiento:', e);
            }
            recognition = null;
        }
        
        // Detener la visualización de audio
        stopAudioVisualization();
        
        // Detener cualquier síntesis de voz en curso
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        addAssistantMessage('Ha sido un placer conversar contigo. Puedes iniciar una nueva conversación cuando quieras.');
    }
    
    // Función para añadir un mensaje del usuario al chat
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-content">
                ${text}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para añadir un mensaje del asistente al chat
    function addAssistantMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.innerHTML = `
            <div class="message-content">
                ${text}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Reproducir el mensaje con voz
        speakText(text);
    }
    
    // Función para procesar el mensaje del usuario y generar una respuesta
    function processUserMessage(text) {
        // Enviar el mensaje al servidor para procesarlo
        fetch('/speech-therapy/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Añadir la respuesta del asistente
                addAssistantMessage(data.response);
            } else {
                console.error('Error al procesar el mensaje:', data.error);
                addAssistantMessage('Lo siento, ha ocurrido un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?');
            }
        })
        .catch(error => {
            console.error('Error en la comunicación con el servidor:', error);
            addAssistantMessage('Lo siento, ha ocurrido un error de comunicación. Por favor, verifica tu conexión a internet.');
        });
    }
    
    // Función para detener la visualización de audio
    function stopAudioVisualization() {
        if (javascriptNode) {
            javascriptNode.disconnect();
            javascriptNode = null;
        }
        
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        
        if (analyser) {
            analyser.disconnect();
            analyser = null;
        }
        
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().then(() => {
                audioContext = null;
            });
        }
        
        // Restaurar las ondas a su estado original
        const waves = document.querySelectorAll('.wave');
        waves.forEach(wave => {
            wave.style.transform = 'scale(1)';
            wave.style.opacity = '0';
        });
    }
    
    // Función para sugerir comandos (llamada desde los chips de sugerencia)
    window.suggestCommand = function(command) {
        if (conversationActive) {
            addUserMessage(command);
            
            // Cambiar estado visual a procesando
            voiceCircle.classList.remove('listening');
            voiceCircle.classList.add('processing');
            statusText.textContent = 'Procesando...';
            
            processUserMessage(command);
        } else {
            // Si la conversación no está activa, iniciarla primero
            startConversation();
            
            // Esperar un momento para que se inicie el reconocimiento
            setTimeout(() => {
                addUserMessage(command);
                
                // Cambiar estado visual a procesando
                voiceCircle.classList.remove('listening');
                voiceCircle.classList.add('processing');
                statusText.textContent = 'Procesando...';
                
                processUserMessage(command);
            }, 1000);
        }
    };
    
    // Iniciar con un mensaje de bienvenida
    setTimeout(() => {
        addAssistantMessage("Hola, soy VozEIA, tu asistente de voz inteligente. Puedes preguntarme lo que quieras o simplemente conversar conmigo. Presiona el botón del micrófono para comenzar.");
    }, 1000);
}); 