# Pizarra Colaborativa

Una aplicación web para dibujar en tiempo real con tus amigos(solo para dos personas).

## Características

- **Dibujo en tiempo real**: Ve los trazos de tu compañero aparecer instantáneamente.
- **Salas privadas**: Crea o únete a salas con ID único.
- **Herramientas de dibujo**: Lápiz, borrador, colores, grosores y estilos (normal, pixel, punteado).
- **Exportar dibujos**: Guarda como PNG, JPG o PDF.
- **Interfaz responsive**: Funciona en desktop y móvil.
- **Límite de 2 usuarios**

## Tecnologías Usadas

### Backend
- **Django**: Framework web para Python.
- **Python-SocketIO**: Para comunicación en tiempo real vía WebSockets.
- **Uvicorn**: Servidor ASGI para alto rendimiento.
- **WhiteNoise**: Para servir archivos estáticos en producción.

### Frontend
- **React**: Biblioteca para interfaces de usuario.
- **Vite**: Herramienta de build rápida para desarrollo.
- **React-Konva**: Para renderizar el lienzo de dibujo.
- **Tailwind CSS**: Framework CSS para estilos.
- **Socket.IO Client**: Para conectar con el backend.

### Despliegue
- **Render**: Para el backend (ASGI + WebSockets).
- **Vercel/Netlify**: Recomendado para el frontend.

## Instalación y Configuración

### Prerrequisitos
- Python 3.10+
- Node.js 16+
- Git

### Backend
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/pizarra-colaborativa.git
   cd pizarra-colaborativa/backend
   ```

2. Crea un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Ejecuta el servidor:
   ```bash
   uvicorn backend.asgi:application --reload
   ```
   El backend estará en `http://127.0.0.1:8000`.

### Frontend
1. Ve al directorio frontend:
   ```bash
   cd ../frontend
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará en `http://localhost:5173`.


##  Contribución

¡Las contribuciones son bienvenidas! Abre un issue o pull request en GitHub.

---

Desarrollado por [Frann Avila](https://github.com/Frann-Avila1411) — Frontend Dev
