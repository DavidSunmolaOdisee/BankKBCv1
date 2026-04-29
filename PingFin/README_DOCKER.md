# PingFin Bank KBC - Docker setup met .env

Deze versie volgt de geüpdatete Bank Team Guidelines van het netwerkteam.
De server draait alleen `docker compose up`; jouw app en MySQL database starten samen.

## Bestanden

- `docker-compose.yml` - verplicht, start app + database containers
- `Dockerfile` - verplicht, bouwt de app container
- `.dockerignore` - voorkomt dat node_modules en .env in de image komen
- `.gitignore` - voorkomt dat `.env` naar GitHub gepusht wordt
- `.env.example` - template met alle variabelen
- `init.sql` - maakt de database aan bij eerste start
- `package.json` - root package voor de app container
- `src/app.js` - entry point dat de backend start

## Eerste keer lokaal testen

```bash
cd PingFin
copy .env.example .env
```

PowerShell alternatief als `copy` niet werkt:

```powershell
Copy-Item .env.example .env
```

Maak het Docker-netwerk eenmalig aan:

```bash
docker network create pingfin_net
```

Als het netwerk al bestaat, is die melding geen probleem.

Start app + database:

```bash
docker compose up --build
```

Open:

- http://localhost:8082/
- http://localhost:8082/api/info/
- http://localhost:8082/api/db_check/
- http://localhost:8082/api/accounts/

## DBeaver lokaal gebruiken

Voor DBeaver start je met de local override zodat MySQL ook op je laptop bereikbaar is:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

DBeaver connectie:

- Host: `localhost`
- Port: `3307`
- Database: `pingfindb`
- Username: `root`
- Password: `password`

Als DBeaver zegt `Public Key Retrieval is not allowed`, gebruik deze JDBC URL:

```text
jdbc:mysql://localhost:3307/pingfindb?allowPublicKeyRetrieval=true&useSSL=false
```

## Stoppen

```bash
docker compose down
```

## Database volledig resetten

```bash
docker compose down -v
docker compose up --build
```

## Pushen naar GitHub

Push `.env.example`, maar nooit `.env`.

```bash
git add .
git commit -m "docker setup klaar"
git push
```

## Gegevens voor netwerkteam

- Team: Bank KBC
- BIC: BARCBEBB
- App container: bankkbc_app
- DB container: bankkbc_db
- Poort: 8082
- Health endpoint: `/api/info/`
- Server URL na deploy: `http://192.168.137.232:8082/api/info/`
