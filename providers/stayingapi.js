// Anbindung an StayingAPI (https://stayingapi.com) – Aggregator über Booking.com,
// Expedia, Airbnb, Agoda, Vrbo, Google Hotels, Trip.com u. a.
//
// ACHTUNG: Kein offizieller OTA-Partner, sondern ein Drittanbieter. Parameter und
// Response-Mapping wurden gegen das echte https://api.stayingapi.com/openapi.json
// verifiziert (GET /search: checkIn/checkOut sind camelCase; Property-Objekte
// liefern platformListingId statt platform_id und price.totalPrice/nightlyPrice
// statt price.amount). Live getestet: /search antwortet bei absehbarer Laufzeit
// >8s mit 202 + Job-ID statt direkt mit Ergebnissen, deshalb muss über
// GET /jobs/{jobId} gepollt werden (Retry-After-Header beachten).

const BASE_URL = 'https://api.stayingapi.com/v1';

function mapResults(items, checkIn, checkOut) {
  return (items || []).map((item) => ({
    hotelId: item.id || item.platformListingId || `${item.platform}:${item.name}`,
    name: item.name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    price: item.price?.totalPrice ?? null,
    currency: item.price?.currency,
    source: item.platform || 'stayingapi',
  }));
}

function throwApiError(data, status) {
  const detail = data?.error?.message || `HTTP ${status}`;
  const error = new Error(`StayingAPI Fehler: ${detail}`);
  error.status = status;
  throw error;
}

async function pollJob(jobId, key) {
  const url = `${BASE_URL}/jobs/${jobId}`;

  for (;;) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const data = await res.json();
    if (!res.ok) throwApiError(data, res.status);

    const status = data.data?.status;
    if (status === 'completed') return data.data.result;
    if (status === 'failed') {
      const error = new Error(`StayingAPI Fehler: ${data.data.error?.message || 'Job fehlgeschlagen'}`);
      error.status = 502;
      throw error;
    }

    const retryAfter = Number(res.headers.get('Retry-After')) || 2;
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
  }
}

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
  if (!res.ok) throwApiError(data, res.status);

  if (res.status === 202) {
    const result = await pollJob(data.data.jobId, key);
    return mapResults(result, checkIn, checkOut);
  }

  return mapResults(data.data, checkIn, checkOut);
}

module.exports = { searchAvailability };
