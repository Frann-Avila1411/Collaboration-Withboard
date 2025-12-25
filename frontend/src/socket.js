import io from 'socket.io-client';

// En desarrollo usamos localhost:8000. 
// Cuando despliegues en Render, cambiarás esto por la URL de tu backend.
const URL = 'http://localhost:8000';

export const socket = io(URL, {
    autoConnect: false // No conectar hasta que el usuario decida entrar
});