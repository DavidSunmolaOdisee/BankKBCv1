# PingFin Bank KBC - Docker Ready

Deze map is klaar voor Docker deployment volgens de Projectweek netwerkteam-richtlijnen.

## Belangrijkste waarden

- Team: Bank KBC
- App container: `bankkbc_app`
- DB container: `bankkbc_db`
- App poort: `8082:80`
- Database: `pingfindb`
- DB user: `root`
- DB password in Docker: `password`
- DB host binnen Docker: `db`
- BIC in testdata/code: `BARCBEBB`
- Andere testbank: `DEGRBEBB`

## Lokaal testen met Docker

Stop eerst XAMPP MySQL, zodat poorten niet conflicteren.

```bash
cd PingFin
docker compose -f docker-compose.local.yml up --build
```

Open daarna:

- http://localhost:8082/
- http://localhost:8082/api/info/
- http://localhost:8082/api/db_check/
- http://localhost:8082/api/accounts/

## DBeaver verbinden met Docker MySQL

Maak een nieuwe MySQL connection in DBeaver:

- Host: `localhost`
- Port: `3307`
- Database: `pingfindb`
- Username: `root`
- Password: `password`

## Lokale database resetten

```bash
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up --build
```

`-v` verwijdert de Docker database volume. Daardoor wordt `init.sql` opnieuw uitgevoerd.

## Server deployment

Voor de server gebruikt het netwerkteam normaal:

```bash
docker compose up --build -d
```

Daarna is de app bereikbaar via:

- http://192.168.137.232:8082/
- http://192.168.137.232:8082/api/info/
- http://192.168.137.232:8082/api/db_check/

Op de server moet het externe Docker-netwerk `pingfin_net` al bestaan.

## GitHub push

Als lokaal Docker werkt:

```bash
git add .
git commit -m "Add Bank KBC Docker setup"
git push
```
