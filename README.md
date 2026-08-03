# Feriensuche

Live-Suche nach real verfügbaren Ferienunterkünften für einen konkreten Zeitraum –
über die [Amadeus Self-Service Hotel API](https://developers.amadeus.com) (kostenloser Test-Tarif).

## Setup

1. Kostenlosen Account auf https://developers.amadeus.com anlegen.
2. Eine "Self-Service" App erstellen → API Key + API Secret kopieren.
3. `.env.example` nach `.env` kopieren und Key/Secret eintragen:
   ```
   cp .env.example .env
   ```
4. Abhängigkeiten installieren und starten:
   ```
   npm install
   npm start
   ```
5. http://localhost:3000 öffnen.

## Wie es funktioniert

1. `place` (z. B. "Wien") wird über die Amadeus Locations API in einen Stadtcode aufgelöst.
2. Für den Stadtcode werden Hotels in der Umgebung ermittelt.
3. Für diese Hotels wird die echte Verfügbarkeit + Preis für den gewählten
   An-/Abreisezeitraum abgefragt (`/v3/shopping/hotel-offers`).

Der Test-Tarif von Amadeus liefert Testdaten für eine begrenzte Auswahl an Städten/Hotels
(nicht jede Stadt hat Testdaten). Für den produktiven Einsatz mit vollem Datenbestand ist
ein Wechsel auf `AMADEUS_ENV=production` (kostenpflichtiger Live-Tarif) nötig.
