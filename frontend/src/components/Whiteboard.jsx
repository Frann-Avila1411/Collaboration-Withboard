import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';

// AHORA RECIBIMOS LAS PREFERENCIAS COMO PROPS
const Whiteboard = forwardRef(({ lines, onRecordLine, tool, color, lineWidth, brushStyle }, ref) => {
  
  const isDrawing = useRef(false);
  const [currentLine, setCurrentLine] = useState(null);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Exponer función para exportar la imagen
  useImperativeHandle(ref, () => ({
    exportImage: (format = 'png') => {
      if (stageRef.current) {
        // use png data url by default
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const uri = stageRef.current.toDataURL({ mimeType: mime, pixelRatio: 1 });
        return uri;
      }
      return null;
    }
  }));

  // Responsive sizing: compute available container size
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: Math.max(100, Math.floor(rect.width)), height: Math.max(100, Math.floor(rect.height)) });
      } else {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    // Usamos los props que vienen del Toolbar
    setCurrentLine({
      tool,           // 'pen' o 'eraser'
      color,          // El color seleccionado
      strokeWidth: lineWidth, // El grosor seleccionado
      brushStyle: brushStyle || 'normal', // Estilo de pincel
      points: [pos.x, pos.y],
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || !currentLine) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    setCurrentLine(prev => ({
        ...prev,
        points: prev.points.concat([point.x, point.y])
    }));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (currentLine) {
        onRecordLine(currentLine);
        setCurrentLine(null);
    }
  };

  return (
    <div ref={containerRef} className="bg-white w-full h-full cursor-crosshair">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => {
            const isPixel = line.brushStyle === 'pixel';
            const isDotted = line.brushStyle === 'dotted';
            
            // Para pixel, dibujamos cuadritos en cada punto
            if (isPixel && line.tool !== 'eraser') {
              return (
                <React.Fragment key={i}>
                  {line.points.map((point, idx) => {
                    // Los puntos vienen en pares [x1, y1, x2, y2, ...]
                    if (idx % 2 === 0 && line.points[idx + 1] !== undefined) {
                      const x = line.points[idx];
                      const y = line.points[idx + 1];
                      const pixelSize = Math.max(line.strokeWidth, 2);
                      return (
                        <Rect
                          key={`pixel-${idx}`}
                          x={x - pixelSize / 2}
                          y={y - pixelSize / 2}
                          width={pixelSize}
                          height={pixelSize}
                          fill={line.color}
                          globalCompositeOperation="source-over"
                        />
                      );
                    }
                    return null;
                  })}
                </React.Fragment>
              );
            }
            
            // Para otros estilos, dibujamos línea normal
            return (
              <Line
                key={i}
                points={line.points}
                stroke={line.tool === 'eraser' ? '#ffffff' : line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                dash={isDotted ? [8, 5] : undefined}
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            );
          })}

          {currentLine && (
            <>
              {currentLine.brushStyle === 'pixel' && currentLine.tool !== 'eraser' ? (
                // Dibujamos cuadritos para pixel
                <React.Fragment>
                  {currentLine.points.map((point, idx) => {
                    if (idx % 2 === 0 && currentLine.points[idx + 1] !== undefined) {
                      const x = currentLine.points[idx];
                      const y = currentLine.points[idx + 1];
                      const pixelSize = Math.max(currentLine.strokeWidth, 2);
                      return (
                        <Rect
                          key={`current-pixel-${idx}`}
                          x={x - pixelSize / 2}
                          y={y - pixelSize / 2}
                          width={pixelSize}
                          height={pixelSize}
                          fill={currentLine.color}
                          globalCompositeOperation="source-over"
                        />
                      );
                    }
                    return null;
                  })}
                </React.Fragment>
              ) : (
                // Línea normal para otros estilos
                <Line
                  points={currentLine.points}
                  stroke={currentLine.tool === 'eraser' ? '#ffffff' : currentLine.color}
                  strokeWidth={currentLine.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  dash={currentLine.brushStyle === 'dotted' ? [8, 5] : undefined}
                  globalCompositeOperation={
                     currentLine.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              )}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';

export default Whiteboard;