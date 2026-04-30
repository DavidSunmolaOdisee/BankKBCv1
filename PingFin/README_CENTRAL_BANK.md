# Steven Central Bank integration

Deze versie heeft echte integration endpoints voor de tijdelijke centrale bank van Steven:

```txt
https://stevenop.be/pingfin/api/v2
```

## Nodige .env waarden

Maak `.env` vanuit `.env.example` en vul de echte secret keys in:

```env
TEAM_BIC=BARCBEBB
TEAM_SECRET_KEY=your_BARCBEBB_secret_key_here
OTHER_BANK_BIC=DEGRBEBB
OTHER_BANK_SECRET_KEY=your_DEGRBEBB_secret_key_here
CB_API_BASE_URL=https://stevenop.be/pingfin/api/v2
```

Commit `.env` niet naar GitHub.

## Nieuwe endpoints

```txt
GET  /api/cb/token/
GET  /api/cb/banks/
POST /api/cb/banks/
GET  /api/cb/logs/
POST /api/cb/send-po-out/
GET  /api/cb/fetch-po-in/?test=true
GET  /api/cb/fetch-po-in/?test=false
POST /api/cb/send-ack-out/
GET  /api/cb/fetch-ack-in/?test=true
GET  /api/cb/fetch-ack-in/?test=false
```

## Veilige testvolgorde

```txt
1. GET  http://localhost:8082/api/cb/token/
2. GET  http://localhost:8082/api/cb/banks/
3. Maak externe PO via /api/po_new_add/ met bb_id=DEGRBEBB
4. GET  http://localhost:8082/api/po_new_process/
5. GET  http://localhost:8082/api/po_out/
6. POST http://localhost:8082/api/cb/send-po-out/
7. GET  http://localhost:8082/api/cb/fetch-ack-in/?test=true
```

## Complete flow met twee banken

```txt
Bank A: PO_NEW -> process -> PO_OUT
Bank A: POST /api/cb/send-po-out/ -> Steven /po_in
Bank B: GET /api/cb/fetch-po-in/?test=false -> PO_IN
Bank B: GET /api/po_in_process/ -> ACK_OUT
Bank B: POST /api/cb/send-ack-out/ -> Steven /ack_in
Bank A: GET /api/cb/fetch-ack-in/?test=false -> ACK_IN
```

Gebruik eerst `test=true`, want de Steven API verwijdert berichten bij de echte `/po_out` en `/ack_out` fetch.
