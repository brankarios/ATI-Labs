from flask import Flask, request, session, jsonify, send_from_directory
import json
import os
import re 

app = Flask(__name__)
app.secret_key = os.urandom(24) 

PROJECT_ROOT_IN_CONTAINER = '/opt/web_cache_pty_app/ATI' 

CONFIG_FOLDER = os.path.join(PROJECT_ROOT_IN_CONTAINER, 'conf')
STUDENT_DATA_BASE_FOLDER = PROJECT_ROOT_IN_CONTAINER 

def extract_json_from_js_var(text):
    """
    Extrae el objeto JSON de una cadena que contiene una declaración de variable JavaScript
    como 'const varName = { ... };'.
    """
    match = re.search(r'=\s*(?P<json_content>\{[\s\S]*\}|\[[\s\S]*\]);?\s*$', text.strip())
    if match:
        json_string = match.group('json_content') 
        return json.loads(json_string)
    return None 

def load_language_config(lang_code):
    """
    Carga la configuración de idioma desde un archivo que puede contener una declaración de variable JS.
    """
    lang_file = os.path.join(CONFIG_FOLDER, f'config{lang_code.upper()}.json')
    print(f"DEBUG_FLASK: Intentando cargar configuración de idioma desde: {lang_file}")
    try:
        with open(lang_file, 'r', encoding='utf-8') as f:
            content = f.read()
            config = extract_json_from_js_var(content)
            if config is None: 
                config = json.loads(content) 
            return config
    except FileNotFoundError:
        print(f"DEBUG_FLASK_ERROR: Archivo de idioma no encontrado para {lang_code} en {lang_file}.")
        if lang_code.lower() == 'es': 
            return {} 
        try:
            with open(os.path.join(CONFIG_FOLDER, 'configES.json'), 'r', encoding='utf-8') as f:
                content_es = f.read()
                return extract_json_from_js_var(content_es) or json.loads(content_es)
        except Exception as e_fallback:
            print(f"DEBUG_FLASK_ERROR: Error al cargar configES.json como fallback: {e_fallback}")
            return {}
    except json.JSONDecodeError:
        print(f"DEBUG_FLASK_ERROR: Archivo JSON '{lang_file}' para el idioma {lang_code} está mal formado o la extracción falló.")
        return {}
    except Exception as e:
        print(f"DEBUG_FLASK_ERROR: Error inesperado al cargar idioma {lang_code}: {e}")
        return {}


def load_student_profile(student_id):
    """
    Carga los datos de un estudiante específico desde su carpeta numerada.
    Este archivo también puede contener una declaración de variable JS.
    Además, busca la foto de perfil con extensiones .jpg, .png o .jpeg.
    """
    student_folder = os.path.join(STUDENT_DATA_BASE_FOLDER, student_id)
    profile_json_path = os.path.join(student_folder, 'perfil.json') 
    print(f"DEBUG_FLASK: Intentando cargar perfil desde: {profile_json_path}")

    try:
        with open(profile_json_path, 'r', encoding='utf-8') as f:
            content = f.read()
            profile_data = extract_json_from_js_var(content)
            if profile_data is None: 
                profile_data = json.loads(content)
        
        found_photo_path = None
        photo_extensions = ['.jpg', '.png', '.jpeg'] 
        for ext in photo_extensions:
            potential_photo_file = f'{student_id}{ext}'
            potential_full_path = os.path.join(student_folder, potential_photo_file)
            if os.path.exists(potential_full_path):
                found_photo_path = f'/ATI/{student_id}/{potential_photo_file}'
                break 

        if found_photo_path:
            profile_data['photo'] = found_photo_path
        else:
            print(f"DEBUG_FLASK_WARN: No se encontró foto para el estudiante {student_id} en {student_folder} con extensiones {photo_extensions}. Usando placeholder.")
            profile_data['photo'] = 'https://placehold.co/150x150/CCCCCC/000000?text=No+Photo'
        
        return profile_data
    except FileNotFoundError:
        print(f"DEBUG_FLASK_ERROR: Archivo de perfil '{profile_json_path}' para el estudiante {student_id} no encontrado.")
        return None
    except json.JSONDecodeError:
        print(f"DEBUG_FLASK_ERROR: Archivo JSON '{profile_json_path}' para el estudiante {student_id} está mal formado.")
        return None
    except Exception as e:
        print(f"DEBUG_FLASK_ERROR: Error inesperado al cargar perfil de {student_id}: {e}")
        return None

def get_all_student_ids():
    """
    Lista todas las carpetas que representan a los estudiantes.
    """
    student_ids = []
    try:
        contents = os.listdir(STUDENT_DATA_BASE_FOLDER)
        print(f"DEBUG_FLASK: Contenido de {STUDENT_DATA_BASE_FOLDER}: {contents}")
    except FileNotFoundError:
        print(f"DEBUG_FLASK_ERROR: Directorio base de estudiantes no encontrado: {STUDENT_DATA_BASE_FOLDER}")
        return []
    except Exception as e:
        print(f"DEBUG_FLASK_ERROR: Error al listar directorio {STUDENT_DATA_BASE_FOLDER}: {e}")
        return []

    for item in contents: 
        item_path = os.path.join(STUDENT_DATA_BASE_FOLDER, item)
        if os.path.isdir(item_path) and item.isdigit():
            profile = load_student_profile(item) 
            if profile:
                student_ids.append(item)
            else:
                print(f"DEBUG_FLASK_WARN: El perfil para el estudiante {item} no se pudo cargar y será omitido de la lista principal. (Ver errores anteriores para detalles)")
    return sorted(student_ids)

# --- RUTAS DE FLASK ---

@app.route('/')
def serve_index():
    """
    Ruta raíz para la aplicación Flask.
    Sirve el archivo index.html para la SPA.
    """
    print(f"DEBUG_FLASK: Solicitud a la ruta raíz de Flask. Sirviendo index.html desde: {PROJECT_ROOT_IN_CONTAINER}")
    try:
        return send_from_directory(PROJECT_ROOT_IN_CONTAINER, 'index.html')
    except FileNotFoundError:
        print(f"DEBUG_FLASK_ERROR: index.html no encontrado en {PROJECT_ROOT_IN_CONTAINER}.")
        return "Error: index.html no encontrado en la raíz del proyecto.", 404

@app.route('/api/students') 
def get_students_list():
    """
    Retorna una lista de estudiantes con su ID, nombre y URL de foto.
    """
    student_ids = get_all_student_ids()
    students_info = []
    for sid in student_ids:
        profile = load_student_profile(sid) 
        if profile:
            students_info.append({
                'id': sid,
                'name': profile.get('nombre', f'Estudiante {sid}'), 
                'photo': profile.get('photo', '') 
            })
    print(f"DEBUG_FLASK: Retornando lista de estudiantes: {len(students_info)} encontrados.")
    return jsonify(students=students_info)

@app.route('/api/profile/<profile_id>') 
def get_profile_data(profile_id):
    """
    Obtiene y retorna los datos completos del perfil de un estudiante específico.
    """
    profile = load_student_profile(profile_id)
    if profile:
        print(f"DEBUG_FLASK: Perfil {profile_id} encontrado.")
        return jsonify(profile=profile)
    else:
        print(f"DEBUG_FLASK_ERROR: Perfil {profile_id} no encontrado.")
        return jsonify(profile=None, message="Perfil no encontrado."), 404

@app.route('/api/language/<lang_code>') 
def get_language_config_api(lang_code):
    """
    Retorna el archivo de configuración de idioma solicitado.
    """
    config = load_language_config(lang_code)
    if config:
        print(f"DEBUG_FLASK: Configuración de idioma {lang_code} cargada.")
    else:
        print(f"DEBUG_FLASK_ERROR: Configuración de idioma {lang_code} no cargada (vacía o error).")
    return jsonify(config=config)

@app.route('/api/visit') 
def handle_visit():
    """
    Ruta para manejar y contar las visitas a la aplicación usando sesiones.
    """
    session['visits'] = session.get('visits', 0) + 1
    print(f"DEBUG_FLASK: Visita registrada. Total: {session['visits']}.")
    return jsonify(visits=session['visits'])

@app.route('/<path:filename>')
def serve_static(filename):
    print(f"DEBUG_FLASK: Sirviendo archivo estático: {filename} desde: {PROJECT_ROOT_IN_CONTAINER}")
    try:
        return send_from_directory(PROJECT_ROOT_IN_CONTAINER, filename)
    except FileNotFoundError:
        print(f"DEBUG_FLASK_ERROR: Archivo estático '{filename}' no encontrado en {PROJECT_ROOT_IN_CONTAINER}.")
        return "Error: Archivo no encontrado.", 404
    except Exception as e:
        print(f"DEBUG_FLASK_ERROR: Error al servir archivo estático '{filename}': {e}")
        return "Error interno del servidor.", 500

application = app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
