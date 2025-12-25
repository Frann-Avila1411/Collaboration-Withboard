import io from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const socket = io(URL, {
    autoConnect: false, // No conectar hasta que el usuario decida entrar
    transports: ['websocket']
});