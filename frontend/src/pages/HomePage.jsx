import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { socket } from '../socket';

const HomePage = () => {
  const navigate = useNavigate();
  
  // Estado local para los inputs
  const [inputName, setInputName] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [error, setError] = useState('');

  // Estado global (Zustand)
  const { setUsername, setRoomId, setIsHost, username } = useStore();

  useEffect(() => {
    // Si ya había un nombre guardado, pre-llenarlo
    if (username) setInputName(username);

    // ESCUCHAR EVENTOS DEL SERVIDOR
    // 1. Cuando la sala se crea exitosamente
    socket.on('room_created', ({ roomId }) => {
      setRoomId(roomId);
      setIsHost(true);
      navigate(`/room/${roomId}`);
    });

    // 2. Cuando nos unimos exitosamente
    socket.on('joined_success', ({ roomId }) => {
      setRoomId(roomId);
      setIsHost(false);
      navigate(`/room/${roomId}`);
    });

    // 3. Errores (Sala llena, no existe, etc.)
    socket.on('error', ({ message }) => {
      setError(message);
      socket.disconnect(); // Desconectar si hubo error para intentar de nuevo limpio
    });

    return () => {
      // Limpiar listeners al desmontar para evitar duplicados
      socket.off('room_created');
      socket.off('joined_success');
      socket.off('error');
    };
  }, [navigate, setRoomId, setIsHost, username]);

  const connectAndEmit = (action) => {
    if (!inputName.trim()) {
      setError('¡Necesitas un nombre de usuario!');
      return;
    }
    setError('');
    
    // Guardar nombre y conectar
    setUsername(inputName);
    if (action === 'create') {
      // Conectar sólo para creación (necesitamos emitir create_room desde aquí)
      socket.connect();
      socket.emit('create_room', { username: inputName });
    } else {
      if (!inputRoom.trim()) {
        setError('Ingresa el ID de la sala');
        return;
      }
      // Para unirse navegamos a la sala y dejamos que RoomPage haga el `join_room`
      setRoomId(inputRoom.toUpperCase());
      setIsHost(false);
      navigate(`/room/${inputRoom.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 pb-16">
      <div className="card-glass p-8 rounded-3xl w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Pizarra Colaborativa</h1>
            <p className="text-sm text-gray-500 mt-1">Dibuja en tiempo real con tu pareja o amigos — rápido y fácil.</p>
          </div>
          {/* footer credit moved to global footer */}
        </div>

        {/* Muestra errores si existen */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Nombre</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none transition shadow-sm"
              placeholder="Ej: Alex"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => connectAndEmit('create')}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg active:scale-95"
            >
              🎨 Crear Nueva Sala
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">O únete a una</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="text"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
              placeholder="ID de Sala"
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value.toUpperCase())} // Auto mayúsculas
            />
            <button
              onClick={() => connectAndEmit('join')}
              className="bg-gray-900 hover:bg-black text-white font-semibold px-6 rounded-xl transition active:scale-95 flex items-center gap-2"
            >
              🔑 Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;