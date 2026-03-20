# GenderLens — Clasificador de Género en Tiempo Real

Aplicación web profesional en React (Vite) que clasifica en tiempo real si la persona frente a la cámara es **Hombre** o **Mujer** usando un modelo de [Teachable Machine](https://teachablemachine.withgoogle.com/).

---

## 🏗 Arquitectura

```
src/
├── hooks/
│   └── useTeachableMachine.js   # Toda la lógica de TF / modelo (Clean Architecture)
├── components/
│   └── ClassificationCanvas.jsx # UI pura, sin imports de TensorFlow
├── App.jsx                       # Orquestador: conecta hook ↔ UI
├── main.jsx                      # Entry point React
└── index.css                     # Tailwind + estilos globales
```

**Principios aplicados:**
- **Separación total**: `useTeachableMachine` nunca toca el DOM visual; `ClassificationCanvas` nunca toca TensorFlow.
- **RAF con throttle**: Predicciones a ~15fps (configurable), render visual a 60fps del navegador.
- **Estados explícitos**: `idle → loading-model → loading-camera → ready / error`.

---

## ⚡ Inicio Rápido

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd gender-classifier
npm install
```

### 2. Configurar el modelo

Copia el archivo de entorno:
```bash
cp .env.example .env
```

Edita `.env` con las URLs de tu modelo de Teachable Machine:
```
VITE_TM_MODEL_URL=https://teachablemachine.withgoogle.com/models/TU_ID/model.json
VITE_TM_METADATA_URL=https://teachablemachine.withgoogle.com/models/TU_ID/metadata.json
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

Abre `http://localhost:5173` en Chrome/Edge (Firefox puede tener restricciones con webcam en localhost).

> ⚠️ **HTTPS requerido en producción**: Los navegadores modernos solo permiten acceso a la cámara en contextos seguros (`https://` o `localhost`).

---

## 🤖 Crear tu modelo de Teachable Machine

1. Ve a [teachablemachine.withgoogle.com/train/image](https://teachablemachine.withgoogle.com/train/image)
2. Crea 2 clases: `Hombre` y `Mujer` (los nombres deben coincidir **exactamente** con los que usa el componente para los colores)
3. Graba o sube 50–200 muestras por clase (más = mejor precisión)
4. Haz clic en **"Train Model"**
5. Haz clic en **"Export Model"** → elige **"Upload (shareable link)"**
6. Copia las URLs generadas a tu `.env`

---

## 🚀 Despliegue en Producción

### Vercel (recomendado)
```bash
npm install -g vercel
vercel deploy --prod
```
Agrega las variables de entorno en el dashboard de Vercel.

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

> ⚠️ Configura HTTPS en tu servidor nginx para que la cámara funcione.

---

## 🔧 Configuración avanzada

### Cambiar la frecuencia de predicciones
En `src/hooks/useTeachableMachine.js`:
```js
const PREDICTION_INTERVAL_MS = 66 // 66ms = ~15fps | 33ms = ~30fps | 100ms = 10fps
```

### Agregar más clases
El sistema es dinámico. Si tu modelo tiene más clases (ej: `Niño`, `Adulto`), agrega su configuración en `ClassificationCanvas.jsx`:
```js
const LABEL_CONFIG = {
  Hombre: { color: '#00e5ff', ... },
  Mujer:  { color: '#ff2d78', ... },
  Niño:   { color: '#ffb800', icon: '◈', barColor: 'bg-[#ffb800]', ... }, // nuevo
}
```

---

## 🛠 Stack técnico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool / dev server |
| TensorFlow.js | 4.17 | Motor de inferencia |
| @teachablemachine/image | 0.8.5 | Carga y predicción del modelo |
| Tailwind CSS | 3.4 | Estilos utilitarios |

---

## 🐛 Troubleshooting

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| Cámara bloqueada | Permisos del navegador | Haz clic en el ícono de cámara en la barra de URL → Permitir |
| Modelo no carga | URL incorrecta o modelo privado | Verifica las URLs en `.env` y que el modelo esté publicado |
| Error de CORS | Modelo en servidor sin headers | Sube el modelo a TM (Google Storage) en lugar de self-hosted |
| Predicciones lentas | CPU limitada | Reduce `PREDICTION_INTERVAL_MS` o usa un modelo más pequeño |
| Pantalla negra en iOS | Safari no soporta `autoPlay` sin interacción | Agrega un botón "Iniciar" que llame a `video.play()` tras click |
