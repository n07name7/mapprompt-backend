const express = require('express');
const { geocodeAddress } = require('../services/nominatim');
const { getPOINearby } = require('../services/overpass');

const router = express.Router();

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
        // Получаем POI вокруг найденной точки с указанным радиусом
        const poi = await getPOINearby(
          geocodeResult.data.lat,
          geocodeResult.data.lon,
          radius
        );

        // Определяем статус POI
        const hasPOI = poi.transport.length > 0 || poi.schools.length > 0 || poi.shops.length > 0;
        const poiStatus = hasPOI ? 'available' : 'unavailable';

        if (!hasPOI) {
          console.log(`[POI] No POI found for address: "${address}" (${geocodeResult.data.lat}, ${geocodeResult.data.lon}) radius: ${radius}m`);
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
