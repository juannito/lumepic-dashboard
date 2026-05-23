# Guía de Instalación y Ejecución Local 🚀
*(Diseñada para personas no técnicas)*

Esta guía te ayudará a configurar y ejecutar el **Dashboard de Ventas de Lumepic** localmente en tu computadora, ya sea una **Mac** o una **PC con Windows**. No necesitas tener conocimientos de programación para seguir estos pasos.

> [!IMPORTANT]
> **Aclaraciones importantes sobre el proyecto:**
> * **Público Objetivo**: Este proyecto es exclusivo para fotógrafos que utilicen la plataforma de [Lumepic](https://www.lumepic.com/photographers?referredBy=soyphotographer&utm_source=phr) (un sistema de gestión y galería de fotos que permite a fotógrafos independientes subir sus álbumes, vender sus fotos digitales directamente y gestionar sus ventas).
> * **No Oficial**: Esta herramienta **no es oficial** ni ha sido desarrollada directamente por Lumepic. Es un cliente complementario e independiente.
> * **Sin Base de Datos Local**: La aplicación no utiliza bases de datos locales propias. Para no saturar ni realizar llamadas constantes a la API real de Lumepic en cada navegación, los datos descargados se guardan de forma segura en el *Local Storage* de tu navegador. Tienes el control total para actualizar los datos cuando desees usando el botón **Refresh (Actualizar)** ubicado en la esquina superior derecha del panel.

---

## Paso 1: Instalar Node.js (El motor del proyecto)
El proyecto requiere una herramienta llamada **Node.js** para ejecutarse.

### En Mac 🍎
1. Ve a la página oficial: [nodejs.org](https://nodejs.org/es)
2. Descarga la versión marcada como **LTS** (es la más estable y recomendada).
3. Abre el archivo descargado (`.pkg`) y sigue el instalador haciendo clic en *"Siguiente"* o *"Continuar"*.

### En Windows 💻
1. Ve a la página oficial: [nodejs.org](https://nodejs.org/es)
2. Descarga la versión marcada como **LTS**.
3. Abre el instalador descargado (`.msi`) y sigue los pasos tradicionales haciendo clic en *"Next"* y aceptando los términos de uso.

---

## Paso 2: Descargar u Obtener el Proyecto

### Opción A: Descomprimir archivo ZIP (Si te lo enviaron comprimido)
1. Haz doble clic en el archivo ZIP para descomprimirlo.
2. Mueve la carpeta resultante a un lugar cómodo, por ejemplo, en tu carpeta **Documentos** o en el **Escritorio**.

### Opción B: Clonar desde un repositorio (Si prefieres usar Git)
Si tienes acceso al repositorio del código (por ejemplo, en GitHub):
1. Asegúrate de tener Git instalado en tu máquina (puedes descargarlo de [git-scm.com](https://git-scm.com/)).
2. Abre la consola o terminal de tu computadora y ubícate en la carpeta donde quieras clonar el proyecto (ej: `cd Documents`).
3. Ejecuta el siguiente comando para clonar el repositorio:
   ```bash
   git clone <enlace-del-repositorio>
   ```
4. Ingresa a la carpeta descargada:
   ```bash
   cd lumepic
   ```

---

## Paso 3: Configurar tus Tokens de Lumepic
Para que el dashboard pueda conectarse a Lumepic y descargar tus ventas reales, necesitas configurar tus claves de acceso (Tokens).

1. Abre la carpeta del proyecto en tu computadora.
2. Busca un archivo llamado `.env.example`.
3. Haz una copia de ese archivo en la misma carpeta y renombra la copia como `.env.local` (asegúrate de que empiece con un punto y no tenga `.txt` al final).
4. Abre `.env.local` con cualquier editor de textos básico (como el *Bloc de notas* en Windows o *TextEdit* en Mac).
5. Modifica los valores con tus datos reales. Debe lucir similar a esto:

```bash
# Token del fotógrafo 1 (Reemplaza con tu token real)
LUMEPIC_PHOTOGRAPHER_TOKEN=tu_primer_token_aqui
LUMEPIC_PHOTOGRAPHER_LABEL=Fotógrafo Principal

# Si tienes un segundo fotógrafo/cuenta (opcional):
LUMEPIC_PHOTOGRAPHER_TOKEN_2=tu_segundo_token_aqui
LUMEPIC_PHOTOGRAPHER_LABEL_2=Fotógrafo Secundario

# URL base de la API (Déjala exactamente como está)
LUMEPIC_API_BASE_URL=https://api.lumepic.com
```

*Nota: No te preocupes si tus tokens tienen la palabra "Bearer" al principio o no, la aplicación se encarga de limpiarlos automáticamente.*

### 🔍 ¿Cómo conseguir tu Token de Lumepic usando tu navegador?
Si no sabes dónde encontrar tu token de fotógrafo, puedes extraerlo fácilmente de la plataforma web de Lumepic siguiendo estos pasos desde tu navegador (como Google Chrome o Edge):

#### Método 1: Desde la pestaña "Red" (Recomendado y más confiable)
1. Abre tu navegador y entra a la web donde inicias sesión en tu panel de fotógrafo de **Lumepic**.
2. **Inicia sesión** con tu cuenta.
3. Presiona la tecla **F12** en tu teclado (en Windows) o las teclas **Cmd + Option + I** (en Mac) para abrir las herramientas de desarrollador.
4. En el panel lateral o inferior que se abre, busca la pestaña que dice **Red** (o *Network*).
5. Con esa pestaña abierta, **recarga la página** (presiona `F5` o `Cmd + R`). Verás que aparece una lista con muchos nombres.
6. En el cuadro de búsqueda (filtro) de la pestaña de Red, escribe: `photographer` o `sales` o `summary`.
7. Haz clic sobre alguna de las llamadas que aparezcan en la lista (por ejemplo, una llamada de API a `/sales` o similar).
8. En la derecha se abrirá un detalle de esa llamada. Selecciona la pestaña **Cabeceras** (o *Headers*).
9. Desplázate hacia abajo hasta encontrar una sección llamada **Cabeceras de la Petición** (o *Request Headers*).
10. Busca la línea que empiece con **`Authorization`** (o `authorization`).
11. Verás un texto largo al lado que empieza con `Bearer ...`. **Copia todo ese texto largo** (ese es tu token) y pégalo en tu archivo `.env.local`.

#### Método 2: Desde el Almacenamiento Local (Local Storage)
1. En la misma ventana de la web de Lumepic (habiendo iniciado sesión), mantén abiertas las herramientas de desarrollador (**F12**).
2. Ve a la pestaña **Aplicación** (o *Application* / *Storage*). Si no la ves a simple vista, haz clic en el icono con dos flechas `>>` para ver pestañas ocultas.
3. En la barra lateral izquierda del panel, busca la sección **Almacenamiento Local** (o *Local Storage*) y despliégala.
4. Haz clic en la dirección web de Lumepic (ej. `https://photographer.lumepic.com` o similar).
5. En la tabla de la derecha se mostrará una lista de claves y valores. Busca una clave que contenga palabras como `token`, `jwt`, `auth_token` o `user_token`.
6. Haz doble clic sobre el valor (el bloque de caracteres a la derecha) para seleccionarlo completo, **cópialo** y pégalo en tu archivo `.env.local`.

---

## Paso 4: Abrir la Consola (Terminal) en la carpeta del proyecto

### En Mac 🍎
1. Abre la aplicación **Terminal** (búscala en Spotlight con `Cmd + Espacio` escribiendo "Terminal").
2. Escribe `cd ` (con un espacio al final).
3. Arrastra la carpeta del proyecto desde el Finder y suéltala dentro de la ventana de la Terminal (esto escribirá la ruta de la carpeta automáticamente).
4. Presiona la tecla **Enter**.

### En Windows 💻
1. Abre la carpeta del proyecto donde se encuentran los archivos.
2. Haz clic en la barra de direcciones en la parte superior de la ventana (donde se ve la ruta de la carpeta).
3. Escribe las letras `cmd` y presiona **Enter**.
4. Se abrirá una ventana negra de comandos ya posicionada en la carpeta del proyecto.

---

## Paso 5: Instalar y Ejecutar la Aplicación

Ahora que estás en la terminal/consola en la carpeta correcta, escribe estos dos comandos uno tras otro:

### 1. Descargar las dependencias necesarias:
Escribe el siguiente comando y presiona **Enter**:
```bash
npm install
```
*(Espera un minuto a que finalice la descarga de todos los complementos necesarios. Verás que se crean algunas carpetas adicionales).*

### 2. Iniciar el Dashboard:
Escribe el siguiente comando y presiona **Enter**:
```bash
npm run dev
```
*(Verás que la consola muestra un mensaje indicando que el servidor se ha iniciado correctamente).*

---

## Paso 6: Ver tu Dashboard en el Navegador 🌐

1. Abre tu navegador web favorito (Google Chrome, Safari, Firefox, Edge, etc.).
2. Ingresa la siguiente dirección en la barra de búsqueda superior:
   ```text
   http://localhost:4000
   ```
3. ¡Listo! Ya podrás navegar en tu Dashboard de Ventas con tus datos reales.

---

## Preguntas Frecuentes y Solución de Problemas ❓

* **¿Cómo apago el servidor cuando termine?**
  Ve a la consola donde está corriendo la aplicación y presiona `Ctrl + C` (tanto en Mac como en Windows). Esto detendrá el programa.
  
* **¿Qué hago si la consola me dice que el puerto 4000 ya está en uso?**
  Esto sucede si ya tienes otra instancia del dashboard abierta. Cierra las otras terminales y vuelve a intentar.

* **¿Qué pasa si mis tokens están mal o no configuré el archivo `.env.local`?**
  La aplicación entrará automáticamente en **Modo Demostración** con datos ficticios para que puedas explorar las pantallas y el funcionamiento sin romper nada.
