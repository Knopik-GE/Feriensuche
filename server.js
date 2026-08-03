require('dotenv').config();
const express = require('express');
const path = require('path');
const { findCityCode, findHotelsByCity, searchHotelOffers } = require('./amadeus');

const app = express();
const PORT = process.env.PORT || 3000;

// Amadeus limitiert die Anzahl Hotel-IDs pro Angebotsabfrage; wir begrenzen
// bewusst, um im kostenlosen Test-Tarif nicht ins Rate-Limit zu laufen.
const MAX_HOTELS_PER_SEARCH = 20;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const { place, checkIn, checkOut, adults } = req.query;

  if (!place || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'place, checkIn und checkOut sind erforderlich.' });
  }

  try {
    const cities = await findCityCode(place);
    if (cities.length === 0) {
      return res.status(404).json({ error: `Kein Ort gefunden für "${place}".` });
    }
    const cityCode = cities[0].address?.cityCode || cities[0].iataCode;

    const hotels = await findHotelsByCity(cityCode);
    if (hotels.length === 0) {
      return res.status(404).json({ error: `Keine Hotels bei Amadeus für "${place}" hinterlegt.` });
    }

    const hotelIds = hotels.slice(0, MAX_HOTELS_PER_SEARCH).map((h) => h.hotelId);
    const offers = await searchHotelOffers({
      hotelIds,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: adults || 2,
    });

    const results = offers
      .filter((entry) => entry.available && entry.offers?.length)
      .map((entry) => ({
        hotelId: entry.hotel.hotelId,
        name: entry.hotel.name,
        cityCode: entry.hotel.cityCode,
        offer: {
          checkInDate: entry.offers[0].checkInDate,
          checkOutDate: entry.offers[0].checkOutDate,
          price: entry.offers[0].price?.total,
          currency: entry.offers[0].price?.currency,
          room: entry.offers[0].room?.typeEstimated,
        },
      }));

    res.json({
      place,
      cityCode,
      checkIn,
      checkOut,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Feriensuche läuft auf http://localhost:${PORT}`);
});
