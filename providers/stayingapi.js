// Anbindung an StayingAPI (https://stayingapi.com) – Aggregator über Booking.com,
// Expedia, Airbnb, Agoda, Vrbo, Google Hotels, Trip.com u. a.
//
// ACHTUNG: Kein offizieller OTA-Partner, sondern ein Drittanbieter. Parameter und
// Response-Mapping wurden gegen das echte https://api.stayingapi.com/openapi.json
// verifiziert (GET /search: checkIn/checkOut sind camelCase; Property-Objekte
// liefern platformListingId statt platform_id und price.totalPrice/nightlyPrice
// statt price.amount).

const BASE_URL = 'https://api.stayingapi.com/v1';

async function searchAvailability({ place, checkIn, checkOut, adults }) {
  const key = process.env.STAYINGAPI_KEY;
  if (!key) {
    throw new Error('STAYINGAPI_KEY fehlt (siehe .env.example, Signup ohne Kreditkarte auf stayingapi.com)');
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('location', place);
  url.searchParams.set('checkIn', checkIn);
  url.searchParams.set('checkOut', checkOut);
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
    hotelId: item.id || item.platformListingId || `${item.platform}:${item.name}`,
    name: item.name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    price: item.price?.totalPrice ?? null,
    currency: item.price?.currency,
    source: item.platform || 'stayingapi',
  }));
}

module.exports = { searchAvailability };
