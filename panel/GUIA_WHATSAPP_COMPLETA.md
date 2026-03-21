# 📱 Guía completa — Conectar el bot a WhatsApp
## ChatBot Abelardo 2026

---

## PASO 1 — Crear cuenta de Meta Business

1. Ve a **https://business.facebook.com**
2. Clic en "Crear cuenta"
3. Ingresa: nombre de la campaña, tu nombre, correo de la campaña
4. Verifica el correo

---

## PASO 2 — Crear app en Meta for Developers

1. Ve a **https://developers.facebook.com**
2. Clic en **"Mis apps"** → **"Crear app"**
3. Selecciona tipo: **"Empresa"**
4. Nombre de la app: `AbelardoBot2026`
5. Correo de contacto: el correo de la campaña
6. Asocia tu cuenta de Meta Business → **Crear app**

---

## PASO 3 — Agregar WhatsApp a la app

1. En el panel de la app, busca **"WhatsApp"** → clic **"Configurar"**
2. Selecciona la cuenta de Meta Business de la campaña
3. Te aparecerá el panel de **WhatsApp Business API**

---

## PASO 4 — Obtener el número de WhatsApp

### Opción A — Número de prueba (para desarrollo)
Meta te da un número de prueba gratis que puede enviar a máximo 5 números verificados.
- En WhatsApp → **Inicio de la API** → copia el **número de teléfono de prueba**
- Agrega tu número personal como número de prueba para recibir mensajes

### Opción B — Número real (para producción) ✅ RECOMENDADO
1. Clic en **"Agregar número de teléfono"**
2. Ingresa un número colombiano que **NO esté registrado en WhatsApp** (una SIM nueva)
3. Verifica el número con el código que llega por SMS o llamada
4. El número queda como número de WhatsApp Business

---

## PASO 5 — Obtener las credenciales

En el panel de WhatsApp → **Inicio de la API**, copia:

```
WHATSAPP_PHONE_ID  = el número largo tipo "1234567890123456"
WHATSAPP_TOKEN     = el token de acceso temporal (empieza con "EAA...")
```

⚠️ El token temporal expira en 24 horas. Para producción necesitas un **token permanente**.

### Crear token permanente:
1. Ve a **Configuración** → **Usuarios del sistema** (en Meta Business Suite)
2. Crea un usuario del sistema → asígnale rol **Administrador**
3. Agrega activos → selecciona tu app
4. Clic en **"Generar token"** → selecciona la app → permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Genera → copia el token → **guárdalo, solo se muestra una vez**

---

## PASO 6 — Configurar el Webhook

El webhook es la URL donde Meta enviará los mensajes que reciba el número.

### Requisito: el backend debe ser público en internet

Para desarrollo local usa **ngrok**:
```bash
# Instalar ngrok: https://ngrok.com
ngrok http 8000
# Te dará una URL tipo: https://abc123.ngrok-free.app
```

Para producción, despliega en **Render**:
1. Crea cuenta en https://render.com
2. Conecta tu repositorio de GitHub
3. Crea un "Web Service" → apunta a la carpeta `backend`
4. Variable de entorno: agrega todas las del `.env`
5. La URL será tipo: `https://abelardo-bot.onrender.com`

### Configurar el webhook en Meta:
1. En el panel de WhatsApp → **Configuración** → **Webhook**
2. Clic en **"Editar"**
3. **URL de devolución de llamada**: `https://TU-URL-PUBLICA/webhook`
4. **Token de verificación**: el valor de `WEBHOOK_VERIFY_TOKEN` en tu `.env` (`abelardo2026_verify`)
5. Clic **"Verificar y guardar"**

Si el backend está corriendo, Meta enviará un GET al webhook y se verificará automáticamente.

### Suscribir a los eventos:
En la sección **"Campos del webhook"**, activa:
- ✅ `messages`

Clic **"Suscribirse"**

---

## PASO 7 — Llenar el .env con los datos reales

```env
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxxx   ← token permanente de paso 5
WHATSAPP_PHONE_ID=1234567890123456    ← phone ID de paso 5
WEBHOOK_VERIFY_TOKEN=abelardo2026_verify
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxx   ← de console.groq.com
SECRET_KEY=una-clave-larga-y-secreta-minimo-32-chars
DEBUG=False
DATABASE_URL=sqlite:///./abelardo.db
```

---

## PASO 8 — Obtener API Key de Groq

1. Ve a **https://console.groq.com**
2. Crea cuenta (es gratis)
3. **API Keys** → **Create API Key**
4. Copia la key → pégala en `GROQ_API_KEY`

---

## PASO 9 — Cargar los documentos de Abelardo

Abre los archivos en `backend/data/abelardo/` y reemplaza el contenido de plantilla con información real:

| Archivo | Contenido |
|---|---|
| `propuestas.txt` | El programa de gobierno completo |
| `faq.txt` | Preguntas frecuentes y respuestas |
| `discursos.txt` | Fragmentos de discursos importantes |
| `entrevistas.txt` | Fragmentos de entrevistas clave |

Mientras más texto real, mejor responde el bot.

**Arrancar el backend recarga el RAG automáticamente.**

---

## PASO 10 — Importar los 2.000 contactos

Prepara un CSV con estas columnas:
```csv
phone,name,city,department
573001234567,Juan Pérez,Bogotá,Cundinamarca
573109876543,María García,Medellín,Antioquia
```

**Formato del teléfono:** 57 + número sin el 0 inicial
- Colombiano: `3001234567` → CSV: `573001234567`

Importar desde el panel:
1. Ve a **Contactos** → clic en **"Importar CSV"**
2. Sube el archivo
3. Verifica que aparezcan en la lista

---

## PASO 11 — Enviar el mensaje de opt-in a los 2.000

Una vez tengas los contactos importados:

1. Ve a **Broadcasts** → **Nuevo broadcast**
2. Título: `Opt-in inicial — Firmantes campaña`
3. Mensaje:
```
Hola [nombre] 👋

Hace un tiempo firmaste en apoyo a *Abelardo de la Espriella* 🇨🇴

Queremos mantenerte informado sobre la campaña presidencial 2026.

¿Deseas recibir información, propuestas y novedades de la campaña?

Responde *SÍ* para recibir mensajes
Responde *NO* si prefieres no recibirlos
```
4. Segmento: **"Todos los contactos"**
5. Clic **"Enviar ahora"**

---

## PASO 12 — Verificar que todo funciona

### Test rápido:
1. Desde el panel → **Chat de prueba** → escribe una pregunta
2. El bot debe responder en segundos

### Test WhatsApp real:
1. Envía "hola" al número del bot desde tu celular
2. El backend debe mostrar el mensaje en los logs
3. El bot responde por WhatsApp

### Verificar logs del backend:
```
  ✓  Base de datos lista
  ✓  RAG listo — 847 chunks indexados
  ─────────────────────────────────────────────────
  🌐  Backend  →  http://localhost:8000

  200  POST    /webhook
  📨  [573001234567] Juan: hola buenos días
  🤖  Bot → 573001234567: ¡Hola Juan! Soy el asistente...
```

---

## Resumen de cuentas necesarias

| Servicio | URL | Costo |
|---|---|---|
| Meta Business | business.facebook.com | Gratis |
| Meta Developers | developers.facebook.com | Gratis |
| WhatsApp Business API | (dentro de Meta) | Gratis hasta 1.000 conv/mes |
| Groq API (IA) | console.groq.com | Gratis (límite generoso) |
| Render (hosting backend) | render.com | Desde $7 USD/mes |
| Vercel (hosting panel) | vercel.com | Gratis |
| Ngrok (desarrollo local) | ngrok.com | Gratis (con límites) |

---

## Costos de WhatsApp por conversación (Meta)

Después de las primeras 1.000 conversaciones gratis al mes:

| Tipo | Costo aproximado |
|---|---|
| Conversación iniciada por usuario | ~$0.0094 USD (~$38 COP) |
| Conversación iniciada por la campaña (broadcast) | ~$0.0605 USD (~$245 COP) |

Para 2.000 contactos, el primer broadcast cuesta aproximadamente:
`2.000 × $0.0605 = $121 USD ≈ $490.000 COP`

---

## ⚠️ Advertencias importantes

1. **El número no puede estar en WhatsApp personal** — si el número ya tiene cuenta de WhatsApp personal, hay que eliminarlo primero
2. **Las transmisiones masivas requieren plantillas aprobadas por Meta** para mensajes iniciados por la empresa (broadcasts). Los mensajes de respuesta a usuarios son libres
3. **Plantillas:** para el broadcast inicial de opt-in debes crear una plantilla en Meta y esperar aprobación (1-3 días hábiles)
4. **Límites:** empieza con pocos mensajes y aumenta gradualmente para evitar que el número sea marcado como spam

---

## Soporte y problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `Invalid OAuth access token` | Token expirado o incorrecto | Regenerar token permanente |
| Webhook no verifica | Backend no está público | Usar ngrok o desplegar en Render |
| Bot no responde | RAG vacío | Llenar archivos en `data/abelardo/` |
| `Rate limit exceeded` | Groq gratis tiene límites | Esperar unos minutos o agregar delay |
