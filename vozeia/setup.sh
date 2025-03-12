#!/bin/bash

# Colores para mensajes
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
AZUL='\033[0;34m'
NC='\033[0m' # Sin Color

# Función para imprimir mensajes con formato
imprimir() {
  echo -e "${AZUL}[VozEIA]${NC} $1"
}

imprimir_exito() {
  echo -e "${VERDE}[✓]${NC} $1"
}

imprimir_advertencia() {
  echo -e "${AMARILLO}[!]${NC} $1"
}

imprimir_error() {
  echo -e "${ROJO}[✗]${NC} $1"
}

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
  imprimir_error "Python 3 no está instalado. Por favor, instala Python 3 antes de continuar."
  exit 1
fi

# Verificar la versión de Python
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if (( $(echo "$python_version < 3.8" | bc -l) )); then
  imprimir_advertencia "Se recomienda Python 3.8 o superior. Versión actual: $python_version"
  read -p "¿Deseas continuar de todos modos? (s/n): " continuar
  if [[ $continuar != "s" && $continuar != "S" ]]; then
    imprimir "Instalación cancelada."
    exit 0
  fi
fi

# Información sobre los modelos disponibles
mostrar_info_modelos() {
  echo ""
  echo -e "${AZUL}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${AZUL}║            Modelos de IA Disponibles en VozEIA             ║${NC}"
  echo -e "${AZUL}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${VERDE}1. YourTTS (Multilingüe)${NC}"
  echo "   Modelo multilingüe que permite clonar voces con alta calidad."
  echo "   Soporta español, inglés, francés, portugués y más."
  echo "   Este es el modelo predeterminado y recomendado para la mayoría de los casos."
  echo ""
  echo -e "${VERDE}2. Modelo de Conversión de Voz${NC}"
  echo "   Modelo especializado en conversión de voz que mantiene la identidad"
  echo "   del hablante con alta fidelidad."
  echo "   Soporta español e inglés."
  echo ""
  echo -e "${VERDE}3. XTTS v2${NC}"
  echo "   Modelo avanzado de clonación de voz con alta calidad y naturalidad."
  echo "   Requiere más recursos computacionales."
  echo "   Soporta múltiples idiomas incluyendo español, inglés, francés, alemán,"
  echo "   italiano, portugués, polaco, turco, ruso, holandés, checo, árabe y chino."
  echo ""
  echo -e "${AMARILLO}Nota:${NC} La primera vez que se utiliza un modelo, se descargará automáticamente."
  echo "      Esto puede tardar varios minutos dependiendo de tu conexión a internet."
  echo ""
  read -p "Presiona Enter para continuar..." tecla
}

# Menú principal
mostrar_menu() {
  echo ""
  echo -e "${AZUL}╔════════════════════════════════════════╗${NC}"
  echo -e "${AZUL}║            VozEIA - Terminal           ║${NC}"
  echo -e "${AZUL}╚════════════════════════════════════════╝${NC}"
  echo ""
  echo "1. Configurar entorno virtual e instalar dependencias"
  echo "2. Ejecutar la aplicación"
  echo "3. Actualizar dependencias"
  echo "4. Limpiar archivos temporales"
  echo "5. Información sobre modelos de IA"
  echo "6. Salir"
  echo ""
  read -p "Selecciona una opción (1-6): " opcion
  
  case $opcion in
    1) configurar_entorno ;;
    2) ejecutar_aplicacion ;;
    3) actualizar_dependencias ;;
    4) limpiar_temporales ;;
    5) mostrar_info_modelos; mostrar_menu ;;
    6) 
       imprimir "¡Hasta pronto!"
       exit 0 
       ;;
    *) 
       imprimir_error "Opción inválida. Por favor, selecciona una opción del 1 al 6."
       mostrar_menu 
       ;;
  esac
}

# Función para configurar el entorno virtual e instalar dependencias
configurar_entorno() {
  imprimir "Configurando entorno virtual..."
  
  # Verificar si ya existe el entorno virtual
  if [ -d "venv" ]; then
    imprimir_advertencia "Ya existe un entorno virtual. ¿Deseas recrearlo?"
    read -p "Esto eliminará el entorno actual (s/n): " recrear
    if [[ $recrear == "s" || $recrear == "S" ]]; then
      imprimir "Eliminando entorno virtual existente..."
      rm -rf venv
    else
      imprimir "Se utilizará el entorno virtual existente."
      source venv/bin/activate || source venv/Scripts/activate
      mostrar_menu
      return
    fi
  fi
  
  # Crear entorno virtual
  python3 -m venv venv
  
  if [ $? -ne 0 ]; then
    imprimir_error "Error al crear el entorno virtual. Verifica que tienes instalado el paquete venv."
    exit 1
  fi
  
  # Activar entorno virtual
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
  else
    source venv/bin/activate
  fi
  
  if [ $? -ne 0 ]; then
    imprimir_error "Error al activar el entorno virtual."
    exit 1
  fi
  
  imprimir_exito "Entorno virtual creado y activado correctamente."
  
  # Instalar dependencias
  imprimir "Instalando dependencias... (esto puede tardar varios minutos)"
  pip install --upgrade pip
  pip install -r requirements.txt
  
  if [ $? -ne 0 ]; then
    imprimir_error "Error al instalar las dependencias."
    exit 1
  fi
  
  imprimir_exito "Dependencias instaladas correctamente."
  
  # Crear directorios necesarios
  mkdir -p app/static/uploads app/static/models
  
  imprimir_exito "Configuración completada. Ahora puedes ejecutar la aplicación."
  mostrar_menu
}

# Función para ejecutar la aplicación
ejecutar_aplicacion() {
  # Verificar si el entorno virtual está activado
  if [[ "$VIRTUAL_ENV" == "" ]]; then
    imprimir "Activando entorno virtual..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      source venv/Scripts/activate
    else
      source venv/bin/activate
    fi
    
    if [ $? -ne 0 ]; then
      imprimir_error "Error al activar el entorno virtual. ¿Has ejecutado la opción 1 primero?"
      mostrar_menu
      return
    fi
  fi
  
  imprimir "Iniciando la aplicación VozEIA..."
  imprimir_advertencia "La primera vez que se ejecuta la aplicación, se descargarán automáticamente los modelos de IA necesarios."
  imprimir_advertencia "Esto puede tardar varios minutos dependiendo de tu conexión a internet."
  imprimir "Presiona Ctrl+C para detener la aplicación."
  
  python run.py
  
  if [ $? -ne 0 ]; then
    imprimir_error "Error al ejecutar la aplicación."
  else
    imprimir_exito "Aplicación detenida correctamente."
  fi
  
  mostrar_menu
}

# Función para actualizar dependencias
actualizar_dependencias() {
  # Verificar si el entorno virtual está activado
  if [[ "$VIRTUAL_ENV" == "" ]]; then
    imprimir "Activando entorno virtual..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      source venv/Scripts/activate
    else
      source venv/bin/activate
    fi
    
    if [ $? -ne 0 ]; then
      imprimir_error "Error al activar el entorno virtual. ¿Has ejecutado la opción 1 primero?"
      mostrar_menu
      return
    fi
  fi
  
  imprimir "Actualizando dependencias..."
  pip install --upgrade -r requirements.txt
  
  if [ $? -ne 0 ]; then
    imprimir_error "Error al actualizar las dependencias."
  else
    imprimir_exito "Dependencias actualizadas correctamente."
  fi
  
  mostrar_menu
}

# Función para limpiar archivos temporales
limpiar_temporales() {
  imprimir "Limpiando archivos temporales..."
  
  # Limpiar archivos de audio subidos
  read -p "¿Deseas eliminar todos los archivos de audio subidos? (s/n): " limpiar_audio
  if [[ $limpiar_audio == "s" || $limpiar_audio == "S" ]]; then
    rm -f app/static/uploads/*.wav app/static/uploads/*.mp3 app/static/uploads/*.ogg app/static/uploads/*.flac
    imprimir_exito "Archivos de audio eliminados."
  fi
  
  # Limpiar archivos __pycache__
  find . -type d -name "__pycache__" -exec rm -rf {} +
  find . -name "*.pyc" -delete
  
  imprimir_exito "Limpieza completada."
  mostrar_menu
}

# Iniciar el script
clear
imprimir "Bienvenido a VozEIA - Clonador de Voces Instantáneo"
imprimir "Esta aplicación utiliza modelos de IA pre-entrenados para clonar voces."
mostrar_menu 