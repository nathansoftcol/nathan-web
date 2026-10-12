# Nathan Soft — Sitio web corporativo

Sitio multi-página de **Nathan Soft** — software a la medida, automatización con Inteligencia Artificial y outsourcing tecnológico desde **Ibagué, Tolima — Colombia** para el mundo.

> Carpeta lista para subir tal cual a cualquier hosting con PHP. Todos los insumos están aquí.

---

## 1. Estructura del proyecto

```
nathan-web/
├─ index.html                # Home con hero (océano + tarjeta de pilares)
├─ servicios.html            # Servicios
├─ industrias.html           # Industrias
├─ productos.html            # Desarrollos propios
├─ nosotros.html             # Acerca + fundador (compacto)
├─ contacto.html             # Formulario de contacto (Gmail SMTP)
├─ contact.php               # Backend del formulario (PHPMailer + Gmail SMTP)
├─ 404.html                  # Página de error 404
├─ sitemap.xml               # Sitemap principal con hreflang + imágenes
├─ sitemap-images.xml        # Sitemap solo de imágenes
├─ robots.txt                # Permite Google, Bing, Yandex, GPTBot, ClaudeBot, etc.
├─ manifest.webmanifest      # PWA / instalable
├─ humans.txt                # Créditos humanos del sitio
├─ security.txt              # Política de seguridad (RFC 9116)
├─ .well-known/security.txt  # Misma política, ubicación canónica
├─ .htaccess                 # HTTPS, URLs limpias, cache, headers de seguridad
├─ assets/
│  ├─ css/styles.css
│  ├─ js/translations.js     # ES / EN / PT / FR
│  ├─ js/i18n.js             # Detección por país + selector
│  ├─ js/main.js             # UI + envío AJAX del formulario
│  └─ img/
│     ├─ hero-ocean.jpg            # Foto del hero
│     ├─ og-image.jpg              # 1200×630 para previews sociales
│     └─ logo/
│        ├─ favicon.svg
│        ├─ favicon-32.png
│        ├─ apple-touch-180.png
│        ├─ apple-touch-192.png
│        ├─ apple-touch-512.png
│        ├─ nathan-soft-logo.png
│        ├─ nathan-soft-logo-web.png
│        ├─ nathan-soft-logo-transparent.png
│        ├─ nathan-soft-logo-web-transparent.png
│        └─ nathan-soft-icon.svg
├─ vendor/
│  └─ PHPMailer/src/         # PHPMailer 6.9.3 (PHPMailer.php, SMTP.php, Exception.php)
└─ README.md
```

---

## 2. Envío de correos vía Gmail SMTP (ya configurado)

El formulario envía los correos directamente — **sin redireccionar al cliente del usuario** — usando **PHPMailer + Gmail SMTP**.

### Configuración aplicada

- **Servidor**: `smtp.gmail.com:465` (SSL)
- **Cuenta remitente**: `nathansoftcol@gmail.com`
- **App Password**: `yadkukylvnjzfoyt` *(verificada sin espacios)*
- **Destino primario**: `nathansoftcol@gmail.com` (la cuenta que ya tienes)
- **Destino en copia (CC)**: `contact@nathansoft.com.co` (si la creas en cPanel también recibe)
- **Reply-To**: el correo del visitante (responder con un clic).

Toda la configuración está en `contact.php` (líneas 15–28). Si necesitas cambiar la app password o la cuenta:

```php
$SMTP_USER     = 'nathansoftcol@gmail.com';
$SMTP_PASSWORD = 'yadkukylvnjzfoyt';
$TO_PRIMARY    = 'nathansoftcol@gmail.com';
$TO_CC         = 'contact@nathansoft.com.co';
```

### Verifica que el App Password siga activo

1. Inicia sesión en `nathansoftcol@gmail.com`.
2. Visita [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Confirma que el App Password **no esté revocado**. Si es la primera vez:
   - Activa la **Verificación en 2 pasos**.
   - Crea un App Password de nombre `Nathan Soft Web`.
   - Pega los 16 caracteres (sin espacios) en `contact.php`.

> Gmail rota App Passwords cuando cambias la contraseña principal. Si el formulario deja de enviar, regenera la App Password y actualiza `contact.php`.

### Anti-spam y resiliencia

- Honeypot (campo oculto `website`) — descarta bots.
- Rate-limit de 5 envíos / 15 min por IP.
- Si SMTP falla, el lead se guarda en `/leads/` (no se pierde).
- Validación cliente y servidor.

---

## 3. Despliegue en hosting (Latinoamérica Hosting / cualquier cPanel)

Todo el contenido de la carpeta `nathan-web/` se sube tal cual a `public_html/`.

### Pasos

1. Compra el plan **H1+** en [latinoamericahosting.com.co](https://www.latinoamericahosting.com.co/) (LiteSpeed + PHP 7.4+).
2. cPanel → *File Manager* → entra a `public_html/`.
3. Sube **todos los archivos y carpetas** de este proyecto:
   - HTML (`*.html`), `*.txt`, `*.xml`, `.htaccess`, `manifest.webmanifest`.
   - Carpeta `assets/` completa (imágenes, CSS, JS).
   - Carpeta `vendor/` completa (PHPMailer).
   - Carpeta `.well-known/`.
   - `contact.php`.
4. cPanel → *SSL/TLS Status* → **Run AutoSSL** (HTTPS gratuito).
5. Visita `https://nathansoft.com.co/`. Prueba el formulario — el correo debe llegar al inbox de `nathansoftcol@gmail.com`.

### Verificación rápida en producción

- ✅ `https://nathansoft.com.co/` carga con HTTPS.
- ✅ El header muestra el logo horizontal.
- ✅ El selector de idioma cambia los textos.
- ✅ El formulario envía y aparece "¡Gracias! Hemos recibido tu mensaje".
- ✅ Llega un correo bonito al inbox de Gmail con todos los datos.
- ✅ Las URLs limpias funcionan: `https://nathansoft.com.co/servicios` (sin `.html`).
- ✅ El 404 carga `https://nathansoft.com.co/no-existe` → muestra `404.html`.

---

## 4. Cómo correr el sitio en local

### Opción A — Solo previsualizar (sin envío real de correo)

```powershell
cd c:\Nathan\WORKSPACE\nathan-web
python -m http.server 8080
```

Abre [http://localhost:8080](http://localhost:8080). El formulario mostrará error porque PHP no está disponible, pero el resto del sitio funciona.

### Opción B — Con PHP integrado (envía correos reales)

1. Descarga PHP en [windows.php.net/download](https://windows.php.net/download/) (Thread-Safe x64).
2. Descomprímelo en `C:\php` y agrégalo al `PATH`.
3. Habilita la extensión `openssl` en `C:\php\php.ini` (descomenta la línea `extension=openssl`).
4. Verifica con `php -v && php -m | findstr openssl`.
5. Arranca:

   ```powershell
   cd c:\Nathan\WORKSPACE\nathan-web
   php -S localhost:8080
   ```

6. Abre [http://localhost:8080](http://localhost:8080) y prueba el formulario. El correo llega vía Gmail SMTP a `nathansoftcol@gmail.com` (igual que en producción).

### Opción C — XAMPP / Laragon (incluyen PHP + Apache)

- **XAMPP**: instala desde [apachefriends.org](https://www.apachefriends.org/), copia `nathan-web/` a `C:\xampp\htdocs\nathan-web\`, arranca Apache, abre `http://localhost/nathan-web/`.
- **Laragon**: instala desde [laragon.org](https://laragon.org/), copia el proyecto a `C:\laragon\www\`, arranca, abre `http://nathan-web.test/`.

Ambos vienen con OpenSSL habilitado, así que SMTP funciona sin configuración extra.

---

## 5. SEO técnico aplicado (revisado a nivel profesional)

### Metadatos por página
- ✅ `<title>`, `meta description` únicas por página y por idioma.
- ✅ `canonical`, `hreflang` (es, es-co, en, pt, fr, x-default) en cada página.
- ✅ Open Graph + Twitter Cards (con `og:image` 1200×630 dedicada y `og:image:width/height`).
- ✅ `theme-color`, `geo.*`, `apple-mobile-web-app-*`, `format-detection`, `revisit-after`, `rating`.

### Datos estructurados (Schema.org / JSON-LD)
- ✅ `Organization` con `founder` (Persona con `sameAs` LinkedIn).
- ✅ `WebSite` con `SearchAction` (sitelinks search box en Google).
- ✅ `LocalBusiness` con `geo`, `address`, `priceRange`.
- ✅ `ProfessionalService`.
- ✅ `Service` con `OfferCatalog` (lista completa de servicios).
- ✅ `FAQPage` (Google muestra los Q&A directamente en SERP — *rich snippets*).
- ✅ `BreadcrumbList`, `AboutPage`, `ContactPage` por página.

### Sitemaps
- ✅ `sitemap.xml` con todas las páginas + `xhtml:link` hreflang + `image:image`.
- ✅ `sitemap-images.xml` dedicado a las imágenes.
- ✅ Anunciados en `robots.txt`.

### Robots
- ✅ Permite explícitamente: Googlebot, Bingbot, msnbot, Slurp (Yahoo), DuckDuckBot, YandexBot, Baiduspider, Applebot, facebookexternalhit, Twitterbot, LinkedInBot, Pinterestbot.
- ✅ Crawlers de IA permitidos: GPTBot, ChatGPT-User, OAI-SearchBot, anthropic-ai, ClaudeBot, Claude-Web, PerplexityBot, Perplexity-User, cohere-ai, meta-externalagent, Bytespider.
- ✅ Bloquea `/leads/`, `/vendor/`, `/contact.php`.

### Performance / Core Web Vitals
- ✅ `preconnect` a Google Fonts y `dns-prefetch` a `ipapi.co`.
- ✅ Tipografías con `display=swap`.
- ✅ JS sin bloqueo (al final del `<body>`).
- ✅ CSS único minificable.
- ✅ Cache headers de 1–6 meses para assets.
- ✅ Gzip/Brotli activado vía `mod_deflate`.

### Seguridad (factor SEO indirecto)
- ✅ HTTPS forzado + HSTS preload.
- ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy.
- ✅ `security.txt` (RFC 9116) en `/` y en `/.well-known/`.

### URLs limpias y canónicas
- ✅ `.htaccess` reescribe `/servicios` → `/servicios.html` y redirige `.html` → URL limpia (canónica).
- ✅ `404.html` con `noindex,follow`.
- ✅ Redirección `www → no-www`.

---

## 6. Pasos de indexación posteriores al despliegue

Para acelerar el ranking #1:

1. [Google Search Console](https://search.google.com/search-console) → *Add property* → `https://nathansoft.com.co/`. Verifica el dominio.
2. *Sitemaps* → envía `sitemap.xml` y `sitemap-images.xml`.
3. *Inspección de URL* → solicita indexación de `/`, `/servicios`, `/industrias`, `/productos`, `/nosotros`, `/contacto`.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) → repite los mismos pasos.
5. [Yandex Webmaster](https://webmaster.yandex.com/) → repite los mismos pasos.
6. [IndexNow](https://www.indexnow.org/) — opcional, notifica a Bing/Yandex/Naver instantáneamente.
7. **Google Business Profile** — alta como negocio en Ibagué, Tolima → clave para ranking local en Colombia.
8. Publica el sitio en LinkedIn, Twitter/X, Facebook → backlinks iniciales que aceleran el descubrimiento.
9. Pide que reseñen tu Google Business Profile — los reviews suben mucho la posición local.

---

## 7. Personalización rápida

| Cambio                                  | Archivo                                      |
|-----------------------------------------|----------------------------------------------|
| Cualquier texto en cualquier idioma     | `assets/js/translations.js`                  |
| Colores de marca                        | `assets/css/styles.css` (variables `:root`)  |
| Cuenta SMTP / destino del correo        | `contact.php` (líneas 15–28)                 |
| Foto del hero                           | `assets/img/hero-ocean.jpg`                  |
| Imagen para previews en redes (OG)      | `assets/img/og-image.jpg` (1200×630)         |
| Datos del fundador                      | `nosotros.html`                              |
| Productos propios                       | `productos.html` + `translations.js`         |
| FAQ del home (rich snippets en Google)  | `index.html` → bloque `JSON-LD: FAQPage`     |

---

© Nathan Soft — Ibagué, Tolima, Colombia.
