const BASE_URL =
  process.env.AMADEUS_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET fehlen (siehe .env.example)');
  }

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Amadeus Auth fehlgeschlagen: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // etwas Puffer vor dem tatsächlichen Ablauf einplanen
  tokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000;
  return cachedToken;
}

async function amadeusGet(path, params) {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || res.statusText;
    const error = new Error(`Amadeus API Fehler (${path}): ${detail}`);
    error.status = res.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function findCityCode(keyword) {
  const data = await amadeusGet('/v1/reference-data/locations', {
    keyword,
    subType: 'CITY',
    'page[limit]': 5,
  });
  return data.data || [];
}

async function findHotelsByCity(cityCode, radius = 20) {
  const data = await amadeusGet('/v1/reference-data/locations/hotels/by-city', {
    cityCode,
    radius,
    radiusUnit: 'KM',
  });
  return data.data || [];
}

async function searchHotelOffers({ hotelIds, checkInDate, checkOutDate, adults }) {
  const data = await amadeusGet('/v3/shopping/hotel-offers', {
    hotelIds: hotelIds.join(','),
    checkInDate,
    checkOutDate,
    adults,
    bestRateOnly: true,
  });
  return data.data || [];
}

module.exports = { findCityCode, findHotelsByCity, searchHotelOffers };
