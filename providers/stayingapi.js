// Anbindung an StayingAPI (https://stayingapi.com) – Aggregator über Booking.com,
// Expedia, Airbnb, Agoda, Vrbo, Google Hotels, Trip.com u. a.
//
// ACHTUNG: Kein offizieller OTA-Partner, sondern ein Drittanbieter. Die Parameter
// unten basieren auf dem öffentlichen README (github.com/stayingapi/hotel-api) und
// Suchergebnissen – die exakten Query-Parameter von /v1/search konnten wegen
// Netzwerk-Restriktionen in der Entwicklungsumgebung nicht live gegen
// https://api.stayingapi.com/openapi.json verifiziert werden. Beim ersten echten
// Testlauf gegen stayapi.com/docs abgleichen und ggf. Parameter-Namen anpassen.

const BASE_URL = 'https://api.stayingapi.com/v1';

async function searchAvailability({ place, checkIn, checkOut, adults }) {
  const key = process.env.STAYINGAPI_KEY;
  if (!key) {
    throw new Error('STAYINGAPI_KEY fehlt (siehe .env.example, Signup ohne Kreditkarte auf stayingapi.com)');
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('location', place);
  url.searchParams.set('checkin', checkIn);
  url.searchParams.set('checkout', checkOut);
  url.searchParams.set('adults', adults || 2);
  url.searchParams.set('limit', '20');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });

  const data = await res.json();
  if (!res.ok) {
    const detail = data?.error?.message || res.statusText;
    const error = new Error(`StayingAPI Fehler: ${detail}`);
    error.status = res.status;
    throw error;
  }

  return (data.data || []).map((item) => ({
    hotelId: item.id || item.platform_id || `${item.platform}:${item.name}`,
    name: item.name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    price: item.price?.amount ?? item.price,
    currency: item.price?.currency,
    source: item.platform || 'stayingapi',
  }));
}

module.exports = { searchAvailability };
