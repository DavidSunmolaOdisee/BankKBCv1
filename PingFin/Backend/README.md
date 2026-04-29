# PingFin Bank KBC API

Klaar project voor een **regular bank** die zowel OB als BB kan zijn.

Gebruikte bankgegevens:

- Bank A BIC: `BARCBEBB`
- Andere bank BIC voor tests: `DEGRBEBB`
- Database: MySQL `pingfindb`
- API poort: `3000`

## Mappenstructuur

```txt
pingfin-regular-bank-api/
├── db/
│   ├── accounts.js
│   ├── database.js
│   └── paymentOrders.js
├── docs/
│   └── API.md
├── middleware/
│   └── errorHandler.js
├── public/
│   └── index.html
├── routes/
│   ├── accounts.js
│   ├── help.js
│   ├── info.js
│   ├── paymentOrders.js
│   └── utility.js
├── services/
│   ├── config.js
│   ├── datetime.js
│   ├── logger.js
│   ├── paymentProcessor.js
│   ├── poFactory.js
│   ├── response.js
│   └── validators.js
├── database.sql
├── package.json
└── server.js
```

## Installatie

```bash
npm install
```

## Database importeren

Open MySQL Workbench of phpMyAdmin en importeer `database.sql`.

Via terminal kan ook:

```bash
mysql -u root -p < database.sql
```

De databaseconfig staat hardcoded in `db/database.js`:

```js
host: "localhost"
user: "root"
password: "Azerty123!"
database: "pingfindb"
```

## API starten

```bash
npm start
```

Open daarna:

```txt
http://localhost:3000/api/help/
```

## Belangrijkste flow

### OB-flow

```txt
PO_NEW -> validation -> PO_OUT -> Clearing Bank -> ACK_IN -> TRANSACTIONS / LOG
```

### BB-flow

```txt
Clearing Bank -> PO_IN -> validation -> TRANSACTIONS / ACCOUNTS -> ACK_OUT
```

### Interne betaling

```txt
PO_NEW -> validation -> TRANSACTIONS -> ACCOUNTS -> LOG
```
