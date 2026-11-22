# Guardar los encargos en Google Drive

1. Abre Google Apps Script con la cuenta del estudio y crea un proyecto nuevo. Copia el contenido de `Code.gs` en el editor y guarda.
2. En **Implementar**, elige **Nueva implementación** y selecciona **Aplicación web**. Configura la ejecución con tu cuenta y permite el acceso a **Cualquier persona** para que los clientes puedan enviar el formulario desde la web. Autoriza el acceso a Drive.
3. Copia la URL de la aplicación web, que termina en `/exec`, y ábrela en una ventana privada. Comprueba que la respuesta sea `{"ok":true}`.
4. Pega la URL en `APPS_SCRIPT_URL` en `src/showcase/encargo/config.ts`, vuelve a compilar y publica la web. Si dejas la URL vacía, el formulario ofrecerá la descarga del brief y el envío por email.
5. Completa y envía un encargo de prueba desde la web publicada. Comprueba que aparezca **Recibido** y que en Drive, dentro de **Encargos**, la carpeta fechada contenga el brief `.md` y las respuestas `.json`.
