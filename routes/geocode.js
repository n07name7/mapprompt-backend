const express = require('express');
const { geocodeAddress } = require('../services/nominatim');
const { getPOINearby } = require('../services/overpass');
const { getFoursquarePOI, deduplicatePOI } = require('../services/foursquare');

const router = express.Router();

/**
 * Объединить POI из разных источников
 */
function mergePOI(osmPOI, foursquarePOI) {
  // Транспорт и школы берём только из OSM (там лучше покрытие для этих категорий)
  const transport = osmPOI.transport || [];
  const schools = osmPOI.schools || [];

  // Магазины объединяем из обоих источников (приоритет Foursquare)
  let shops = [...(foursquarePOI.shops || []), ...(osmPOI.shops || [])];
  shops = deduplicatePOI(shops).slice(0, 10);

  // Добавляем рестораны и сервисы из Foursquare
  const restaurants = foursquarePOI.restaurants || [];
  const services = foursquarePOI.services || [];

  return {
    transport,
    schools,
    shops,
    restaurants,
    services
  };
}

/**
 * POST /api/geocode
 * Геокодирование списка адресов с получением POI
 */
router.post('/', async (req, res) => {
  try {
    const { addresses, radius = 1000 } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        error: 'Требуется массив addresses'
      });
    }

    if (addresses.length > 10) {
      return res.status(400).json({
        error: 'Максимум 10 адресов за раз'
      });
    }

    const results = [];

    for (const address of addresses) {
      const geocodeResult = await geocodeAddress(address);

      if (geocodeResult.status === 'success') {
        const { lat, lon } = geocodeResult.data;

        // Получаем POI из обоих источников параллельно
        const [osmPOI, foursquarePOI] = await Promise.all([
          getPOINearby(lat, lon, radius),
          getFoursquarePOI(lat, lon, radius)
        ]);

        // Объединяем результаты
        const poi = mergePOI(osmPOI, foursquarePOI);

        // Определяем статус POI
        const hasPOI = 
          poi.transport.length > 0 || 
          poi.schools.length > 0 || 
          poi.shops.length > 0 ||
          poi.restaurants.length > 0 ||
          poi.services.length > 0;

        const poiStatus = hasPOI ? 'available' : 'unavailable';

        if (!hasPOI) {
          console.log(`[POI] No POI found for address: "${address}" (${lat}, ${lon}) radius: ${radius}m`);
        } else {
          console.log(`[POI] Found for "${address}": transport:${poi.transport.length} schools:${poi.schools.length} shops:${poi.shops.length} restaurants:${poi.restaurants.length} services:${poi.services.length}`);
        }

        results.push({
          address,
          status: 'success',
          data: {
            ...geocodeResult.data,
            search_radius: radius,
            poi_nearby: hasPOI ? poi : null,
            poi_status: poiStatus
          }
        });
      } else {
        // Адрес не найден или ошибка
        results.push({
          address,
          status: geocodeResult.status,
          message: geocodeResult.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
});

module.exports = router;
