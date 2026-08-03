// Kostenlose, key-lose Geokodierung über OpenStreetMap Nominatim.
// Nutzungsrichtlinie: max. 1 Anfrage/Sekunde, aussagekräftiger User-Agent Pflicht.
// https://operations.osmfoundation.org/policies/nominatim/

let lastRequestAt = 0;

async function throttle() {
  const minGapMs = 1100;
  const wait = lastRequestAt + minGapMs - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

async function geocodePlace(place) {
  await throttle();

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', place);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Feriensuche/0.1 (privates Projekt, Kontakt: markus.knopik@googlemail.com)',
      'Accept-Language': 'de',
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding fehlgeschlagen: ${res.status} ${res.statusText}`);
  }

  const results = await res.json();
  if (!results.length) {
    return null;
  }

  const best = results[0];
  return {
    displayName: best.display_name,
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
  };
}

module.exports = { geocodePlace };
