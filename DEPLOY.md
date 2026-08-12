# Cómo publicar AI QuickCap — guía paso a paso

Todo lo técnico ya está preparado (el workflow de GitHub Actions, el `.gitignore`,
el repo local). Lo que sigue son pasos que tenés que hacer vos, en tu navegador,
porque requieren crear cuentas — algo que no puedo hacer en tu nombre.

## Parte 1 — Conseguir las 3 API keys (gratis)

1. **Alpha Vantage** (noticias): https://www.alphavantage.co/support/#api-key
   Completás el formulario simple y la key aparece en pantalla al toque.

2. **Finnhub** (precios): https://finnhub.io/register
   Te registrás, la key está en tu dashboard después de confirmar el email.

3. **Anthropic** (curación con IA): https://console.anthropic.com/settings/keys
   Necesitás crear cuenta y cargar algo de crédito (aunque sea el mínimo) para
   que la API funcione — a diferencia de claude.ai, la API se paga por uso.

Guardá las 3 keys en un lugar seguro (un gestor de contraseñas, por ejemplo).
No se las pases a nadie ni las pegues en un chat.

## Parte 2 — Crear tu cuenta de GitHub

1. Andá a https://github.com/signup y creá una cuenta (gratis).
2. Elegí un nombre de usuario — va a aparecer en la URL de tu sitio
   (`https://TU-USUARIO.github.io/ai-stocks-pulse/`).

## Parte 3 — Crear el repositorio

1. En GitHub, clic en el botón verde **"New"** (o andá a https://github.com/new).
2. Nombre del repositorio: `ai-stocks-pulse`
3. Dejalo **Public** (tiene que ser público para usar GitHub Pages gratis).
4. **No** marques ninguna casilla de "Initialize with README" — ya tenemos el código.
5. Clic en **"Create repository"**.
6. GitHub te va a mostrar una URL como `https://github.com/TU-USUARIO/ai-stocks-pulse.git` — copiala.

## Parte 4 — Subir el código

Avisame cuando tengas esa URL y yo preparo y ejecuto el `git push` con vos
(voy a pedirte confirmación antes de subir nada, como corresponde).

## Parte 5 — Cargar las API keys como "Secrets"

Esto es lo que reemplaza al archivo `.env` — GitHub las guarda cifradas y
solo el workflow puede leerlas.

1. En tu repo en GitHub: **Settings → Secrets and variables → Actions**.
2. Clic en **"New repository secret"**, tres veces, una por cada key:
   - Name: `ALPHAVANTAGE_API_KEY` → Value: tu key
   - Name: `FINNHUB_API_KEY` → Value: tu key
   - Name: `ANTHROPIC_API_KEY` → Value: tu key

## Parte 6 — Activar GitHub Pages

1. **Settings → Pages**.
2. En "Source", elegí **"Deploy from a branch"**.
3. Branch: `main`, carpeta: `/ (root)`.
4. Guardar. En 1-2 minutos tu sitio va a estar en:
   `https://TU-USUARIO.github.io/ai-stocks-pulse/`

## Parte 7 — Probar el pipeline

1. En tu repo: pestaña **Actions**.
2. Vas a ver el workflow **"Refresh sector data"**.
3. Clic en él → **"Run workflow"** → **"Run workflow"** (botón verde) para
   correrlo a mano la primera vez, sin esperar a la hora en punto.
4. Si sale todo verde ✅, `data.json` se actualizó solo y tu sitio ya muestra
   datos reales. Si sale rojo ❌, entrá al log del run y pegámelo — lo reviso.

A partir de ahí, corre solo cada hora, para siempre, sin que tengas que hacer nada.

## Costos

- GitHub, GitHub Actions y GitHub Pages: gratis para repos públicos.
- Alpha Vantage y Finnhub: gratis en el tier que usamos.
- Anthropic: se cobra por uso, pero con el pipeline optimizado (una sola
  llamada cacheada por hora) el costo mensual debería ser mínimo — unos
  centavos de dólar por día en el peor caso. Si querés, después de la
  primera semana revisamos el consumo real en console.anthropic.com.
