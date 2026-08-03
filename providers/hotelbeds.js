// Anbindung an die Hotelbeds Booking API (APItude) – offizieller B2B-Reisevertrieb,
// 300.000+ Hotels, kostenloser Evaluation-Tarif mit Sandbox-Key.
// https://developer.hotelbeds.com
//
// Die Verfügbarkeitssuche läuft über Geokoordinaten (Nominatim), weil dafür kein
// Hotelbeds-eigener Destination-Code-Lookup nötig ist. Auth-Schema (Api-key +
// X-Signature = SHA256(apiKey+secret+unixTimestamp)) ist seit Jahren stabil
// dokumentiert; das genaue Response-Feld-Mapping unten sollte beim ersten echten
// Testlauf gegen developer.hotelbeds.com/documentation/hotels/booking-api
// abgeglichen werden (die Doku-Seiten waren aus dieser Umgebung nicht abrufbar).

const crypto = require('crypto');
const { geocodePlace } = require('../geocode');

const BASE_URL =
  process.env.HOTELBEDS_ENV === 'production'
    ? 'https://api.hotelbeds.com'
    : 'https://api.test.hotelbeds.com';

function buildSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash('sha256').update(`${apiKey}${secret}${timestamp}`).digest('hex');
}

async function searchAvailability({ place, checkIn, checkOut, adults }) {
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;
  if (!apiKey || !secret) {
    throw new Error('HOTELBEDS_API_KEY / HOTELBEDS_SECRET fehlen (siehe .env.example)');
  }

  const location = await geocodePlace(place);
  if (!location) {
    throw new Error(`Kein Ort gefunden für "${place}".`);
  }

  const body = {
    stay: { checkIn, checkOut },
    occupancies: [{ rooms: 1, adults: Number(adults) || 2, children: 0 }],
    geolocation: {
      latitude: location.lat,
      longitude: location.lon,
      radius: 20,
      unit: 'km',
    },
  };

  const res = await fetch(`${BASE_URL}/hotel-api/1.0/hotels`, {
    method: 'POST',
    headers: {
      'Api-key': apiKey,
      'X-Signature': buildSignature(apiKey, secret),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const detail = data?.error?.description || res.statusText;
    const error = new Error(`Hotelbeds API Fehler: ${detail}`);
    error.status = res.status;
    throw error;
  }

  const hotels = data.hotels?.hotels || [];
  return hotels.map((hotel) => ({
    hotelId: hotel.code,
    name: hotel.name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    price: hotel.minRate,
    currency: hotel.currency,
    source: 'hotelbeds',
  }));
}

module.exports = { searchAvailability };
