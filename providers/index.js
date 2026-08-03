const providers = {
  stayingapi: require('./stayingapi'),
  hotelbeds: require('./hotelbeds'),
};

function getProvider() {
  const name = process.env.HOTEL_PROVIDER || 'stayingapi';
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unbekannter HOTEL_PROVIDER "${name}". Erlaubt: ${Object.keys(providers).join(', ')}`
    );
  }
  return { name, ...provider };
}

module.exports = { getProvider };
