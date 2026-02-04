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
    const { addresses } = req.body;

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
        // Получаем POI вокруг найденной точки
        const poi = await getPOINearby(
          geocodeResult.data.lat,
          geocodeResult.data.lon
        );

        results.push({
          address,
          status: 'success',
          data: {
            ...geocodeResult.data,
            poi_nearby: poi
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
