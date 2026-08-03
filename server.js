require('dotenv').config();
const express = require('express');
const path = require('path');
const { getProvider } = require('./providers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const { country, city, checkIn, checkOut, adults, children, childAges, rooms } = req.query;
  const place = [city, country].filter(Boolean).join(', ');

  if (!place || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Stadt, Land, checkIn und checkOut sind erforderlich.' });
  }

  const childrenCount = Number(children) || 0;
  const childAgesArr = childAges
    ? String(childAges).split(',').map((s) => s.trim()).filter(Boolean).map(Number)
    : [];

  if (childrenCount > 0 && childAgesArr.length !== childrenCount) {
    return res.status(400).json({ error: 'Anzahl der Kinderalter muss zur Anzahl der Kinder passen.' });
  }

  try {
    const provider = getProvider();
    const results = await provider.searchAvailability({
      place,
      checkIn,
      checkOut,
      adults,
      children: childrenCount,
      childAges: childAgesArr,
      rooms,
    });

    res.json({
      place,
      checkIn,
      checkOut,
      provider: provider.name,
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
