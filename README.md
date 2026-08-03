# Feriensuche

Live-Suche nach real verfügbaren Ferienunterkünften für einen konkreten Zeitraum –
keine Schätzung, sondern echte Verfügbarkeit + Preis von einem der beiden
unterstützten Anbieter.

> **Hinweis:** Amadeus Self-Service wurde am 17.7.2026 abgeschaltet und ist deshalb
> hier nicht mehr enthalten. Stattdessen gibt es eine austauschbare Provider-
> Anbindung mit zwei Optionen.

## Anbieter

Umschaltbar über `HOTEL_PROVIDER` in `.env`:

| Provider | Wert | Charakter |
|---|---|---|
| [StayingAPI](https://stayingapi.com) | `stayingapi` (Default) | Aggregator über Booking.com, Expedia, Airbnb, Agoda, Vrbo, Google Hotels, Trip.com. 50 Gratis-Requests ohne Kreditkarte. Kein offizieller OTA-Partner – Drittanbieter, potenziell weniger stabil. |
| [Hotelbeds APItude](https://developer.hotelbeds.com) | `hotelbeds` | Offizieller B2B-Reisevertrieb, 300.000+ Hotels, kostenloser Evaluation-Tarif. Aufwendigerer Signup, dafür stabiler/offizieller. |

Beide wurden aus dieser Entwicklungsumgebung heraus **nicht live gegen echte Keys
getestet** (Netzwerk-Policy blockiert Drittanbieter-Domains in der Sandbox). Die
Implementierung basiert auf öffentlicher Doku/Recherche – beim ersten echten
Testlauf Parameter-Namen/Response-Felder gegenprüfen und bei Bedarf in
`providers/stayingapi.js` bzw. `providers/hotelbeds.js` anpassen.

## Setup

1. `.env.example` nach `.env` kopieren: `cp .env.example .env`
2. Für **StayingAPI**: kostenlosen Key auf https://stayingapi.com/signup holen,
   in `STAYINGAPI_KEY` eintragen (kein `HOTEL_PROVIDER` nötig, ist Default).
3. Für **Hotelbeds**: Account auf https://developer.hotelbeds.com registrieren,
   API-Key + Secret in `HOTELBEDS_API_KEY` / `HOTELBEDS_SECRET` eintragen und
   `HOTEL_PROVIDER=hotelbeds` setzen.
4. Installieren & starten:
   ```
   npm install
   npm start
   ```
5. http://localhost:3000 öffnen.

## Wie es funktioniert

- **StayingAPI:** Ortsname + Zeitraum gehen direkt an `/v1/search`, Antwort wird
  auf ein einheitliches Format gemappt.
- **Hotelbeds:** Ortsname wird über die kostenlose OpenStreetMap-Nominatim-API
  (kein Key nötig) in Koordinaten übersetzt, dann per Geolocation-Radius-Suche
  gegen die Hotelbeds Booking API abgefragt (Auth: `Api-key` + `X-Signature` =
  SHA256(apiKey + secret + Unix-Timestamp)).

Beide Provider implementieren dieselbe Funktion
`searchAvailability({ place, checkIn, checkOut, adults })` in `providers/`,
sodass sich weitere Anbieter leicht ergänzen lassen.
