# Actualizar el envío de encargos a Google Drive

1. Entra en Google Apps Script con la cuenta del estudio y abre el proyecto de Encargo que ya está publicado.
2. Abre `Code.gs`, sustituye su contenido por el de este directorio y guarda.
3. Abre **Implementar > Gestionar implementaciones**. Selecciona la implementación activa de tipo **Aplicación web** y pulsa **Editar**.
4. En **Versión**, elige **Nueva versión**. Mantén **Ejecutar como yo** y el acceso para **Cualquier persona**. Pulsa **Implementar** y autoriza Drive si se solicita. Al editar la implementación existente conservas la URL `/exec` de `APPS_SCRIPT_URL`.
5. Abre esa misma URL en una ventana privada y comprueba que devuelve `{"ok":true,"version":2}`.
6. Envía un encargo de prueba desde la web publicada con una imagen y sin `?demo=1`. Comprueba que aparezca **Recibido** y que la carpeta nueva dentro de **Encargos** incluya `encargo.md`, `encargo.json`, `imagenes/<página>/` y `manifiesto.json`. El manifiesto registra el orden, los pies de foto y el enlace al material. Los nombres duplicados llevan un número.

La aplicación crea la carpeta, envía un archivo por petición y cierra el encargo con el manifiesto. Al dejar `APPS_SCRIPT_URL` vacía o abrir Encargo con `?demo=1`, se simula el envío. Si la implementación todavía ejecuta el código anterior, Encargo ofrece el brief para descargar y permite compartirlo por email junto con un enlace a los archivos.
