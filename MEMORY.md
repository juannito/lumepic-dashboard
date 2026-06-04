# Lumepic Project Memory

## 2026-05-30 - Ruta watcher solo lectura

Se ajusto la UX del selector visual de carpeta:
- `src/components/dashboard.tsx`
  - El input "Ruta de la Carpeta Local" ahora es `readOnly`.
  - Se cambio el fondo a `var(--paper-2)` y cursor default para comunicar que no es editable.
  - El texto de ayuda ahora indica usar el selector para cambiar la ruta.
  - El boton "Guardar Ruta" paso a "Guardar Configuración" y ya no manda `watchFolderPath`.
- `CHANGELOG.md`, `package.json`, `package-lock.json`
  - Version actual: `0.2.2`.

## 2026-05-30 - Selector visual de carpeta local

Se agrego un boton "Seleccionar" junto al campo "Ruta de la Carpeta Local" para evitar tener que escribir la ruta manualmente.

Cambios realizados:
- `src/pages/api/lumepic/watcher.ts`
  - Nueva accion POST `select-folder`.
  - En macOS abre el selector nativo usando `osascript`.
  - En Windows abre `FolderBrowserDialog` via PowerShell.
  - Si el usuario cancela, responde `{ success: false, canceled: true }`.
  - Si se selecciona una carpeta, guarda `watchFolderPath` en la config del watcher y devuelve el estado actualizado.
- `src/components/dashboard.tsx`
  - Nuevo boton "Seleccionar" junto al input de ruta.
  - Estado visual "Abriendo..." mientras se espera el selector.
  - El input manual sigue disponible.
- `CHANGELOG.md`, `package.json`, `package-lock.json`
  - Version actual: `0.2.1`.

Notas:
- El selector se ejecuta en la maquina donde corre el servidor Next local. Esto es intencional porque el navegador no permite leer rutas absolutas de carpetas por seguridad.
- No se agrego soporte Linux todavia.

## 2026-05-30 - Watcher upload concurrency

Se agrego configuracion para definir cuantas fotos sube en paralelo la Carpeta Watcher.

Cambios realizados:
- `CHANGELOG.md`
  - Se creo el changelog del proyecto.
  - La version actual documentada es `0.2.0`.
- `package.json` y `package-lock.json`
  - Se actualizo la version de la app a `0.2.0`.
- `src/lib/lumepic-watcher.ts`
  - `WatcherConfig` ahora incluye `uploadConcurrency`.
  - Default: `1`.
  - Maximo normalizado: `10`.
  - `scanFolder()` procesa archivos con `processWithConcurrency(...)` en vez de uno por uno.
  - `retryFailedFiles()` tambien respeta la concurrencia configurada.
  - `saveHistory()` usa una cola (`historyWriteQueue`) para evitar escrituras concurrentes del historial cuando varias subidas terminan juntas.
- `src/components/dashboard.tsx`
  - La pantalla "Carpeta Watcher" incluye el campo numerico "Subidas en paralelo".
  - El campo guarda al perder foco y tambien al hacer clic en "Guardar Ruta".
  - El texto de ayuda indica default 1 y maximo 10 para evitar rate limits.
  - El footer de la app muestra la version tomada desde `package.json`.
  - El footer muestra "Created by @soyphotographer" enlazado a `https://instagram.com/soyphotographer`.
- `watcher_config.json`
  - Se inicializo `"uploadConcurrency": 1`.

Verificacion:
- `npm run build` paso correctamente.
- Next mostro un warning de tracing relacionado con `next.config.ts` y filesystem imports en el endpoint watcher; no bloqueo la build.
- El endpoint `/api/lumepic/watcher` devolvio `uploadConcurrency: 1`.
- Habia un dev server ya corriendo en `http://localhost:4000`.

Notas para futuros ajustes:
- Si Lumepic devuelve muchos `429`, bajar el valor recomendado o agregar backoff global por lote.
- Si se quiere mas control, agregar un selector/slider con valores sugeridos: 1, 2, 3, 5.
- El endpoint `batch-upload-url` sigue recibiendo una sola foto por request; la paralelizacion esta en nuestra app, no en un batch real hacia Lumepic.
