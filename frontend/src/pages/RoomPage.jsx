import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { socket } from '../socket';
import Whiteboard from '../components/Whiteboard';


const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { username, setRoomId } = useStore();
  
  const [notification, setNotification] = useState('');
  const [lines, setLines] = useState([]); // <--- EL ESTADO AHORA VIVE 
  const [partner, setPartner] = useState('');
  
  // ESTADOS DE HERRAMIENTAS
  const [tool, setTool] = useState('pen'); // 'pen' o 'eraser'
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [brushStyle, setBrushStyle] = useState('normal'); // 'normal', 'pixel', 'dotted'
  
  // Referencia al Whiteboard para exportar
  const whiteboardRef = useRef(null);

  useEffect(() => {
    if (!username || !roomId) {
      navigate('/');
      return;
    }
    setRoomId(roomId);

    // LISTENERS

    // 1. Escuchar trazos de otros
    socket.on('draw_line', (newLine) => {
      console.log("📥 [ROOM] Trazo recibido:", newLine);
      setLines((prev) => [...prev, newLine]);
    });

    // 2. Cargar líneas existentes al unirse
    socket.on('load_lines', (existingLines) => {
      console.log("📚 [ROOM] Líneas cargadas:", existingLines);
      setLines(existingLines);
    });

    // 2.5. Cuando me confirman el join, puede venir la lista de usernames
    socket.on('joined_success', ({ roomId: rid, usernames }) => {
      if (usernames && Array.isArray(usernames)) {
        // El otro usuario es cualquiera que no sea yo, o si es el mismo nombre, mostrarlo
        const other = usernames.find((u) => u !== username);
        if (other) {
          setPartner(other);
        } else if (usernames.length > 1) {
          // Si no hay "otro" pero hay más de uno, significa nombres idénticos
          setPartner(username);
        }
      }
    });

    socket.on('user_joined', ({ username: joinedUsername }) => {
      setNotification(`¡${joinedUsername} se ha unido!`);
      setPartner(joinedUsername);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('user_left', () => {
      setNotification('Tu compañero se ha desconectado.');
      setPartner('');
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('error', ({ message }) => {
        setNotification(`Error: ${message}`);
    });

    // Tras registrar listeners, conectamos y enviamos la petición de join
    const doJoin = () => {
      console.log("🔌 Enviando petición join_room:", roomId);
      socket.emit('join_room', { roomId, username });
    };

    if (!socket.connected) {
      // Conectar y esperar al evento 'connect' antes de emitir join
      socket.connect();
      socket.once('connect', doJoin);
    } else {
      doJoin();
    }

    // Listener para cuando alguien borra la pizarra
    socket.on('clear_board', () => {
        setLines([]); // Borrar localmente
        setNotification('🧹 La pizarra ha sido limpiada');
    });

    return () => {
        socket.off('draw_line'); // Limpieza importante
        socket.off('load_lines');
        socket.off('joined_success');
        socket.off('user_joined');
        socket.off('user_left');
        socket.off('error');
        socket.off('clear_board');
      // remover el listener one-time si existe
      try { socket.off('connect'); } catch(e) {}
    };
  }, [roomId, username, navigate, setRoomId]);

  // Función para cuando TÚ dibujas
  const handleLocalDraw = (newLine) => {
      // 1. Agregar a mi pantalla
      setLines((prev) => [...prev, newLine]);
      // 2. Enviar al servidor
      console.log("📤 [ROOM] Enviando trazo:", { room: roomId, line: newLine });
      socket.emit('draw_line', { room: roomId, line: newLine });
  };

  // Función para limpiar la pizarra
  const handleClearBoard = () => {
    if(window.confirm('¿Seguro que quieres borrar todo el dibujo?')) {
        socket.emit('clear_board', { room: roomId });
        setLines([]); // Borrar lo mío inmediatamente
    }
  };

  // Función para descargar la imagen
  const handleDownload = (format) => {
    if (!whiteboardRef.current) {
      setNotification('Error: No se pudo acceder al lienzo');
      return;
    }

    const imageData = whiteboardRef.current.exportImage();
    if (!imageData) {
      setNotification('Error: No se pudo generar la imagen');
      return;
    }

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (format === 'pdf') {
      // Para PDF usamos jspdf
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [window.innerWidth, window.innerHeight]
      });
      pdf.addImage(imageData, 'PNG', 0, 0, window.innerWidth, window.innerHeight);
      pdf.save(`pizarra-${timestamp}.pdf`);
    } else {
      // Para PNG y JPG, descargamos directamente
      link.href = imageData;
      link.download = `pizarra-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setNotification(`✅ Descargado como ${format.toUpperCase()}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setNotification('ID copiado');
    setTimeout(() => setNotification(''), 2000);
  };

  const leaveRoom = () => {
      socket.disconnect();
      navigate('/');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 pb-16">
      
      {/* Header + Toolbar + Botón Salir en una sola línea */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white shadow-lg border-b border-gray-200">
        {/* Contenedor principal con flex */}
        <div className="flex items-center justify-between gap-4 p-4">
          
          {/* Info de Sesión (Izquierda) */}
          <div className="bg-white rounded-lg p-3 flex flex-col gap-1 border border-gray-200 flex-shrink-0">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sala Activa</div>
            <div className="flex items-center gap-2">
               <span className="text-lg font-mono font-bold text-gray-800 tracking-widest">{roomId}</span>
               <button onClick={copyToClipboard} className="text-blue-500 hover:text-blue-700 text-xs font-semibold hover:bg-blue-50 px-2 py-1 rounded transition">Copiar</button>
            </div>
            <div className="text-xs text-gray-400">Usuario: {username}</div>
              {partner ? (
                <div className="text-xs text-gray-400">Compañero: {partner === username ? `Tú y ${partner}` : partner}</div>
              ) : (
                <div className="text-xs text-gray-400">Compañero: —</div>
              )}
          </div>

          {/* Toolbar (Centro, expandible) */}
          <div className="flex flex-row flex-wrap gap-3 items-center justify-center flex-grow overflow-x-auto">
            {/* 1. Selector de Herramienta */}
            <div className="flex gap-2">
              <button
                  onClick={() => setTool('pen')}
                  className={`px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                    tool === 'pen' ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                  }`}
              >
                  ✏️ Lápiz
              </button>
              <button
                  onClick={() => setTool('eraser')}
                  className={`px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                    tool === 'eraser' ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-600"
                  }`}
              >
                  🧼 Borrador
              </button>
            </div>

            {/* 2. Selector de Estilo (solo en lápiz) */}
            {tool === 'pen' && (
              <>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex gap-2">
                  <button
                      onClick={() => setBrushStyle('normal')}
                      className={`px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                        brushStyle === 'normal' ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                      🎨 Normal
                  </button>
                  <button
                      onClick={() => setBrushStyle('pixel')}
                      className={`px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                        brushStyle === 'pixel' ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                      🟫 Pixel
                  </button>
                  <button
                      onClick={() => setBrushStyle('dotted')}
                      className={`px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                        brushStyle === 'dotted' ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                      ⚫ Punteado
                  </button>
                </div>
              </>
            )}

            <div className="w-px h-6 bg-gray-200"></div>

            {/* 3. Grosor */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Grosor:</label>
              <input 
                  type="range" 
                  min="2" 
                  max="20" 
                  value={lineWidth} 
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-20 accent-blue-600" 
              />
              <span className="text-xs text-gray-600 w-6">{lineWidth}</span>
            </div>

            {/* 4. Color (solo en lápiz) */}
            {tool === 'pen' && (
              <>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Color:</label>
                    <div className="flex gap-2">
                        {['#000000', '#ef4444', '#fb923c', '#f59e0b', '#f97316', '#f43f5e', '#ec4899', '#a78bfa', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#6b7280'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition transform ${
                                  color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
              </>
            )}

            <div className="w-px h-6 bg-gray-200"></div>

            {/* 5. Limpiar */}
            <button 
              onClick={handleClearBoard}
              className="px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition text-xs font-bold whitespace-nowrap"
              title="Borrar toda la pizarra"
            >
              🗑️ LIMPIAR
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* 6. Guardar */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleDownload('png')}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition text-xs font-bold whitespace-nowrap"
                title="Descargar como PNG"
              >
                💾 PNG
              </button>
              <button 
                onClick={() => handleDownload('jpg')}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition text-xs font-bold whitespace-nowrap"
                title="Descargar como JPG"
              >
                🖼️ JPG
              </button>
              <button 
                onClick={() => handleDownload('pdf')}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition text-xs font-bold whitespace-nowrap"
                title="Descargar como PDF"
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Botón Salir (Derecha) */}
          <button 
            onClick={leaveRoom} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md font-semibold text-sm transition active:scale-95 flex-shrink-0"
          >
            Salir
          </button>
        </div>
      </div>

      {notification && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gray-800 text-white px-6 py-2 rounded-full shadow-lg text-sm font-medium">{notification}</div>
        </div>
      )}

      {/* PIZARRA: Empieza debajo del header */}
      <div className="absolute top-32 left-0 right-0 bottom-0 z-0">
        <Whiteboard 
            ref={whiteboardRef}
            lines={lines} 
            onRecordLine={handleLocalDraw}
            tool={tool}
            color={color}
            lineWidth={lineWidth}
            brushStyle={brushStyle}
        />
      </div>

    </div>
  );
};

export default RoomPage;