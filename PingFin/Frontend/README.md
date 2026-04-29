# PingFin Frontend

Dit is de frontend voor de PingFin Bank KBC API.

## Starten

Backend eerst starten in de Backend-map:

```bash
cd Backend
npm install
npm start
```

Frontend starten:

```bash
cd Frontend
npm install
npm run dev
```

Open daarna:

```txt
http://localhost:5173
```

De frontend gebruikt standaard deze API base URL:

```txt
http://localhost:3000
```

Die URL kan je links in de frontend aanpassen en opslaan.

## Wat zit erin?

- Dashboard met counts voor accounts, PO_NEW, PO_OUT, outstanding en failed.
- Accounts-pagina.
- OB-flow: PO_NEW toevoegen, random PO's genereren, PO_NEW verwerken, PO_OUT bekijken, ACK_IN toevoegen.
- BB-flow: PO_IN toevoegen, PO_IN verwerken, ACK_OUT bekijken.
- Monitoring: transactions, logs, outstanding en failed.
- Use case pagina met demo-knoppen voor UC1 t/m UC5.
- API docs pagina met endpoint-overzicht.

## Verwachte backend

De frontend verwacht deze endpoints:

- `/api/db_check/`
- `/api/accounts/`
- `/api/po_new/`
- `/api/po_new_add/`
- `/api/po_new_generate/`
- `/api/po_new_process/`
- `/api/po_out/`
- `/api/ack_in/`
- `/api/ack_in_add/`
- `/api/po_in/`
- `/api/po_in_add/`
- `/api/po_in_process/`
- `/api/ack_out/`
- `/api/transactions/`
- `/api/logs/`
- `/api/outstanding/`
- `/api/failed/`
