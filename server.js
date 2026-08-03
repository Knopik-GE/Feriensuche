require('dotenv').config();
const express = require('express');
const path = require('path');
const { getProvider } = require('./providers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const { place, checkIn, checkOut, adults } = req.query;

  if (!place || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'place, checkIn und checkOut sind erforderlich.' });
  }

  try {
    const provider = getProvider();
    const results = await provider.searchAvailability({ place, checkIn, checkOut, adults });

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
