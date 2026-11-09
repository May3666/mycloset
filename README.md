# MyCloset

MyCloset es un armario digital para organizar prendas y combinarlas en outfits. Permite procesar fotos para quitarles el fondo, buscar y filtrar prendas, y guardar combinaciones con vista previa descargable.

La interfaz inicial fue diseñada con Lovable AI y después ampliada para incluir la gestión de prendas y outfits.

## Cómo usarlo

1. En **Mi armario**, selecciona **Agregar prenda** y elige una foto PNG, JPG o WEBP. El sistema elimina el fondo automáticamente y muestra la vista previa sobre un fondo beige.
2. Completa nombre, marca, categoría, color y temporada, y guarda la prenda. Para modificarla o eliminarla, selecciona su tarjeta.
3. Usa el buscador por nombre y los filtros de categoría, color y temporada para encontrar prendas.
4. En **Mis outfits**, selecciona **Crear outfit**, asigna nombre y ocasión, y marca las prendas que quieres combinar.
5. Abre un outfit para ver su composición. Desde ahí puedes editarlo, eliminarlo o descargar la vista previa como PNG.

## Ejecutar en local

Requisitos: Node.js con npm y Vercel CLI.

```sh
npm install
npx vercel dev -L
```

Vercel CLI ejecuta ambos servicios e inyecta el binding `BACKGROUND_REMOVAL_URL` en la app. Para ejecutar la app con Vite y el backend Docker por separado, inicia `docker compose -f background-removal/compose.yaml up --build` y `npm run dev` en terminales distintas.

## Despliegue en Vercel

El archivo `vercel.json` define dos servicios para un mismo proyecto: `app` sirve la interfaz y recibe todo el tráfico público; `background-removal` ejecuta FastAPI y permanece interno. La app declara el binding `BACKGROUND_REMOVAL_URL` hacia el backend. El navegador envía las fotos a `/api/remove-background` en la app, y su handler de servidor reenvía la petición al servicio interno. No es necesario configurar manualmente la variable del binding ni publicar el backend con una rewrite.

Para probar la configuración de servicios localmente, usa `npx vercel dev -L` con Vercel CLI 48.1.8 o posterior. El backend descarga U²-Net (aprox. 176 MB) al iniciar y puede tener cold starts y consumo de memoria/CPU elevados en un entorno serverless; verifica estos límites con el plan y runtime elegidos antes de producción.

En el primer inicio, el servicio descarga el modelo U²-Net (aprox. 176 MB) y lo conserva en un volumen Docker. El backend usa `rembg` (MIT) y los pesos de U²-Net (Apache-2.0). Es un modelo general, así que los resultados pueden variar con prendas de bajo contraste, oclusiones o sombras complejas.

Las prendas y outfits se guardan en IndexedDB del navegador y no se sincronizan entre dispositivos. Las fotos se envían desde el servidor de la app al servicio Python interno, no directamente desde el navegador ni a una API externa.

## Escalabilidad y próximos pasos

MyCloset es una base altamente escalable: la gestión de prendas, outfits y el procesamiento de imágenes están separados en componentes y servicios que pueden evolucionar de forma independiente. Se planea seguir mejorándolo, incluyendo sincronización entre dispositivos, cuentas de usuario, mejores modelos de segmentación de ropa y nuevas herramientas para descubrir combinaciones.
