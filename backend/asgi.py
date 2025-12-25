"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import random
import string
import socketio
from django.core.asgi import get_asgi_application

# Configuración básica de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_asgi_app = get_asgi_application()

#leer origenes confiables desde entorno
trusted_origins = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')

# Inicializar servidor de Socket.IO
# cors_allowed_origins='*' permite que React local se conecte sin errores
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=trusted_origins)

# ==========================================
# ALMACENAMIENTO EN MEMORIA (RAM)
# ==========================================
# Estructura: { 'ROOM_ID': { 'users': ['sid1', 'sid2'], 'usernames': ['Juan', 'Maria'], 'lines': [line1, line2, ...] } }
rooms = {} 
# Mapeo inverso para saber a qué sala pertenece un ID al desconectarse
sid_to_room = {} 

def generate_room_id():
    """Genera un ID corto de 6 caracteres (ej: A4X9L2)"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ==========================================
# EVENTOS DEL SOCKET
# ==========================================

@sio.event
async def connect(sid, environ):
    print(f"🟢 Cliente conectado: {sid}")

@sio.event
async def create_room(sid, data):
    """El usuario solicita crear una sala nueva"""
    username = data.get('username')
    room_id = generate_room_id()
    
    # Crear la sala en memoria
    rooms[room_id] = {
        'users': [sid],
        'usernames': [username],
        'lines': []
    }
    sid_to_room[sid] = room_id
    
    # Unir al socket a la sala "física" de socket.io
    await sio.enter_room(sid, room_id)
    
    print(f"🏠 Sala creada: {room_id} por {username}")
    
    # Responder al cliente con el ID creado y usuarios actuales
    await sio.emit('room_created', {'roomId': room_id, 'usernames': rooms[room_id]['usernames']}, to=sid)

@sio.event
async def join_room(sid, data):
    """El usuario intenta unirse a una sala existente"""
    room_id = data.get('roomId')
    username = data.get('username')
    
    # 1. Validar si la sala existe
    if room_id not in rooms:
        await sio.emit('error', {'message': 'La sala no existe'}, to=sid)
        return

    # --- CORRECCIÓN AQUÍ ---
    # Si el usuario YA está en la sala (es el mismo navegador), no hacemos nada
    # Simplemente le confirmamos que está dentro.
    if sid in rooms[room_id]['users']:
        await sio.emit('joined_success', {'roomId': room_id}, to=sid)
        return 
    # -----------------------

    # 2. Validar capacidad (MAX 2 PERSONAS) solo si es un usuario NUEVO
    if len(rooms[room_id]['users']) >= 2:
        await sio.emit('error', {'message': 'La sala está llena (Max 2)'}, to=sid)
        return

    # 3. Unirse
    rooms[room_id]['users'].append(sid)
    rooms[room_id]['usernames'].append(username)
    sid_to_room[sid] = room_id
    
    await sio.enter_room(sid, room_id)
    
    print(f"👋 {username} se unió a la sala {room_id}")
    
    # Avisar al usuario que entró que fue exitoso (incluye lista de usernames)
    await sio.emit('joined_success', {'roomId': room_id, 'usernames': rooms[room_id]['usernames']}, to=sid)
    
    # Enviar las líneas existentes al nuevo usuario
    print(f"📚 Enviando {len(rooms[room_id]['lines'])} líneas existentes a {username}")
    await sio.emit('load_lines', rooms[room_id]['lines'], to=sid)
    
    # Avisar al OTRO usuario que alguien entró
    await sio.emit('user_joined', {'username': username}, room=room_id, skip_sid=sid)

@sio.event
async def draw_line(sid, data):
    # --- AGREGA ESTOS PRINTS ---
    print(f"✏️ Recibido trazo de {sid}")
    print(f"📦 Datos: {data}")
    # ---------------------------

    """Reenvía los trazos al otro usuario en la sala"""
    # data espera: { 'room': 'ID', 'line': {...} }
    room = data.get('room')
    line = data.get('line')
    
    if room and room in rooms:
        # Agregar la línea a la lista de la sala
        rooms[room]['lines'].append(line)
        # Enviar a todos en la sala menos al que dibujó
        await sio.emit('draw_line', line, room=room, skip_sid=sid)
        print(f"📡 Reenviado a sala {room}") # --- AGREGA ESTO TAMBIÉN
    else:
        print("⚠️ Error: No llegó el ID de la sala en el evento o sala no existe")

@sio.event
async def clear_board(sid, data):
    """Limpia toda la pizarra de la sala"""
    print(f"🧹 Recibido limpiar pizarra de {sid}")
    room = data.get('room')
    
    if room and room in rooms:
        # Limpiar las líneas almacenadas
        rooms[room]['lines'] = []
        # Notificar a todos en la sala
        await sio.emit('clear_board', room=room)
        print(f"🧹 Pizarra de sala {room} limpiada")
    else:
        print("⚠️ Error: No llegó el ID de la sala en clear_board")

@sio.event
async def disconnect(sid):
    """Limpieza cuando alguien se va"""
    if sid in sid_to_room:
        room_id = sid_to_room[sid]
        
        # Eliminar usuario de la data de la sala
        if room_id in rooms:
            if sid in rooms[room_id]['users']:
                rooms[room_id]['users'].remove(sid)
            
            # Si la sala queda vacía, la borramos para ahorrar RAM
            if len(rooms[room_id]['users']) == 0:
                del rooms[room_id]
                print(f"🗑️ Sala {room_id} eliminada (vacía)")
            else:
                # Avisar al que queda que el otro se fue
                await sio.emit('user_left', room=room_id)
        
        del sid_to_room[sid]
    
    print(f"🔴 Cliente desconectado: {sid}")

# Envolver la aplicación Django
application = socketio.ASGIApp(sio, django_asgi_app)
