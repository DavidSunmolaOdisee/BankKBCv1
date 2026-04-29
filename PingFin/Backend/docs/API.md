# PingFin Bank KBC API

Base URL local: `http://localhost:3000`

## Response format

Elke response gebruikt dezelfde structuur:

```json
{
  "ok": true,
  "status": 200,
  "code": "2000",
  "message": "...",
  "data": []
}
```

## Verplichte endpoints

| Endpoint | Type | Wat doet het? |
|---|---:|---|
| `/api/help/` | GET | Geeft overzicht van alle API endpoints |
| `/api/info/` | GET | Geeft teaminfo, banknaam en BIC |
| `/api/accounts/` | GET | Geeft alle accounts terug |
| `/api/accounts/:iban` | GET | Geeft 1 account terug op basis van IBAN |
| `/api/po_new/` | GET | Toont alle payment orders in PO_NEW |
| `/api/po_new_add/` | POST | Voegt nieuwe payment orders toe aan PO_NEW |
| `/api/po_new_process/` | GET | Verwerkt alle payment orders met status NEW |

## Extra nuttige endpoints

| Endpoint | Type | Wat doet het? |
|---|---:|---|
| `/api/po_out/` | GET | Toont PO_OUT |
| `/api/po_in/` | GET | Toont PO_IN |
| `/api/po_in_add/` | POST | Ontvangt PO's van CB wanneer jouw bank BB is |
| `/api/po_in_process/` | GET | Verwerkt PO_IN en maakt ACK_OUT |
| `/api/ack_in/` | GET | Toont ACK_IN |
| `/api/ack_in_add/` | POST | Ontvangt ACK's van CB wanneer jouw bank OB is |
| `/api/ack_out/` | GET | Toont ACK_OUT |
| `/api/transactions/` | GET | Toont TRANSACTIONS |
| `/api/logs/` | GET | Toont LOG |
| `/api/outstanding/` | GET | Toont PO_OUT zonder ACK_IN |
| `/api/failed/` | GET | Toont gefaalde betalingen |
| `/api/po_new_generate/?count=10` | GET | Optioneel: random PO's genereren |
| `/api/db_check/` | GET | Test databaseverbinding |

## POST body voor `/api/po_new_add/`

Interne betaling:

```json
{
  "data": [
    {
      "po_amount": 100,
      "po_message": "Manual internal payment",
      "oa_id": "BE64096123456701",
      "bb_id": "BARCBEBB",
      "ba_id": "BE37096123456702"
    }
  ]
}
```

Externe betaling:

```json
{
  "data": [
    {
      "po_amount": 125,
      "po_message": "Manual external payment",
      "oa_id": "BE64096123456701",
      "bb_id": "DEGRBEBB",
      "ba_id": "BE37096123456702"
    }
  ]
}
```

## Test URLs

```txt
http://localhost:3000/api/help/
http://localhost:3000/api/info/
http://localhost:3000/api/accounts/
http://localhost:3000/api/accounts/BE64096123456701
http://localhost:3000/api/po_new/
http://localhost:3000/api/po_new_process/
http://localhost:3000/api/po_out/
http://localhost:3000/api/ack_in/
http://localhost:3000/api/logs/
```
