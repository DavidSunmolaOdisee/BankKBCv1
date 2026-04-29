# Deployment summary - Bank KBC

## Server

Server IP: `192.168.137.232`

## Docker

Het netwerkteam kan in de root van deze repo gewoon uitvoeren:

```bash
docker compose up --build -d
```

Docker Compose leest de waarden uit `.env`. Maak op de server dus eerst een `.env` op basis van `.env.example`.

## Containers

- App: `bankkbc_app`
- Database: `bankkbc_db`

## Port

- Host port: `8082`
- Container port: `80`

## URLs

- GUI: `http://192.168.137.232:8082/`
- Health/info: `http://192.168.137.232:8082/api/info/`
- DB check: `http://192.168.137.232:8082/api/db_check/`

## Database

- MySQL image: `mysql:8.0`
- DB name: `pingfindb`
- Schema/data: `init.sql`
- Database is only on the internal Docker network.

## Inter-bank communication

Volgens de guidelines kunnen services elkaar bereiken via containernaam:

- Clearing Bank: `http://cb_app/api/...`
- Bank IUS: `http://bankius_app/api/...`
- Bank KBC: `http://bankkbc_app/api/...`
