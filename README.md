# Lumepic Sales Dashboard

Dashboard local para visualizar ventas de fotógrafos en Lumepic.

> [!IMPORTANT]
> **Aclaraciones importantes sobre el proyecto:**
> * **Público Objetivo**: Este proyecto es exclusivo para fotógrafos que utilicen la plataforma de [Lumepic](https://www.lumepic.com/photographers?referredBy=soyphotographer&utm_source=phr) (un sistema de gestión y galería de fotos que permite a fotógrafos independientes subir sus álbumes, vender sus fotos digitales directamente y gestionar sus ventas).
> * **No Oficial**: Esta herramienta **no es oficial** ni ha sido desarrollada directamente por Lumepic. Es un cliente complementario e independiente.
> * **Sin Base de Datos Local**: La aplicación no utiliza bases de datos locales propias. Para no saturar ni realizar llamadas constantes a la API real de Lumepic en cada navegación, los datos descargados se guardan de forma segura en el *Local Storage* de tu navegador. Tienes el control total para actualizar los datos cuando desees usando el botón **Refresh (Actualizar)** ubicado en la esquina superior derecha del panel.

## Configuración

Crear un archivo `.env.local` en esta carpeta:

```bash
LUMEPIC_PHOTOGRAPHER_TOKEN=tu_token
LUMEPIC_PHOTOGRAPHER_LABEL=Fotografo 1
LUMEPIC_API_BASE_URL=https://api.lumepic.com
```

El token puede ir con o sin el prefijo `Bearer`; la app lo normaliza antes de llamar a la API.

Para agregar un segundo perfil:

```bash
LUMEPIC_PHOTOGRAPHER_TOKEN_2=token_del_segundo_fotografo
LUMEPIC_PHOTOGRAPHER_LABEL_2=Fotografo 2
```

La app crea dashboards independientes por perfil y una vista `Consolidado` con KPIs sumados y un grafico de lineas por fotografo.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:4000`.

Si no existe `.env.local` o la API no responde, el dashboard entra en modo demo para que puedas seguir revisando la interfaz.
