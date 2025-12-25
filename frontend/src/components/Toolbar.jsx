import React from 'react';
import { clsx } from 'clsx';

const COLORS = [
  '#000000', // Negro
  '#ef4444', // Rojo
  '#fb923c', // Naranja
  '#f59e0b', // Amarillo cálido
  '#f97316',
  '#f43f5e',
  '#ec4899',
  '#a78bfa', // Púrpura
  '#6366f1', // Indigo
  '#3b82f6', // Azul (acento)
  '#06b6d4', // Cyan
  '#10b981', // Verde
  '#84cc16', // Lima
  '#6b7280'  // Gris
];

const Toolbar = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  brushStyle,
  setBrushStyle,
  onClear 
}) => {
  return (
    <div className="absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 z-20 px-3 py-2 flex flex-row gap-3 items-center justify-start overflow-x-auto toolbar-scroll">
      
      {/* 1. Selector de Herramienta */}
      <div className="flex gap-2">
        <button
            onClick={() => setTool('pen')}
          className={clsx(
            "px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap touch-none",
            tool === 'pen' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"
          )}
        >
            ✏️ Lápiz
        </button>
        <button
            onClick={() => setTool('eraser')}
          className={clsx(
            "px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap touch-none",
            tool === 'eraser' ? "bg-red-50 text-red-600" : "hover:bg-gray-100 text-gray-600"
          )}
        >
            🧼 Borrador
        </button>
      </div>

      {/* 2. Selector de Estilo de Pincel (solo en lápiz) */}
      {tool === 'pen' && (
        <div className="flex gap-2">
          <button
              onClick={() => setBrushStyle('normal')}
            className={clsx(
              "px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap touch-none",
              brushStyle === 'normal' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"
            )}
          >
              🎨 Normal
          </button>
            <button
              onClick={() => setBrushStyle('pixel')}
              className={clsx(
                "px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap touch-none",
                brushStyle === 'pixel' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              🟫 Pixel
            </button>
            <button
              onClick={() => setBrushStyle('dotted')}
              className={clsx(
                "px-3 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap touch-none",
                brushStyle === 'dotted' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              ⚫ Punteado
            </button>
        </div>
      )}

      <div className="w-px h-6 bg-gray-200"></div>

      {/* 3. Selector de Grosor */}
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

      {/* 3. Selector de Color (Solo visible si es Lápiz) */}
      {tool === 'pen' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Color:</label>
            <div className="flex gap-2 items-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx(
                    "w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition transform",
                    color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
      )}

      <div className="w-px h-6 bg-gray-200"></div>

      {/* 4. Botón Limpiar Todo */}
      <button 
        onClick={onClear}
        className="px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition text-xs font-bold whitespace-nowrap"
        title="Borrar toda la pizarra"
      >
        🗑️ LIMPIAR
      </button>

    </div>
  );
};

export default Toolbar;