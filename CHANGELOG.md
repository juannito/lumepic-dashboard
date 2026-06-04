# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

## [0.2.2] - 2026-05-30

### Cambiado
- El campo de ruta local de la Carpeta Watcher ahora es de solo lectura y se cambia con el selector de carpetas.
- El boton principal de la configuracion ahora dice "Guardar Configuración".

## [0.2.1] - 2026-05-30

### Agregado
- Boton "Seleccionar" en la configuracion de la Carpeta Watcher para elegir una carpeta local con el selector nativo del sistema.

### Cambiado
- El footer ahora refleja la version `0.2.1` desde `package.json`.

## [0.2.0] - 2026-05-30

### Agregado
- Configuracion de subidas en paralelo para la Carpeta Watcher, con valor por defecto `1` y maximo `10`.
- Procesamiento concurrente controlado para fotos nuevas y reintentos fallidos.
- Footer de la app con version visible tomada desde `package.json`.
- Archivo `MEMORY.md` con notas de contexto para retomar ajustes futuros.

### Cambiado
- La escritura de `watcher_history.json` ahora usa una cola interna para evitar conflictos cuando varias subidas terminan al mismo tiempo.
- `watcher_config.json` ahora persiste `uploadConcurrency`.
- El footer muestra credito "Created by @soyphotographer" con enlace a Instagram.

### Verificado
- `npm run build` compila correctamente.

## [0.1.0] - Version inicial

### Agregado
- Dashboard local de ventas de Lumepic.
- Vista consolidada, perfiles, clientes y Carpeta Watcher.
