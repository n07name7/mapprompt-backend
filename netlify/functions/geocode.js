const { geocodeAddress } = require('../../services/nominatim');
const { getPOINearby } = require('../../services/overpass');
const { getFoursquarePOI, deduplicatePOI } = require('../../services/foursquare');

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

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { addresses, radius = 1000 } = JSON.parse(event.body || '{}');

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Требуется массив addresses' })
      };
    }

    if (addresses.length > 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Максимум 10 адресов за раз' })
      };
    }

    const results = [];

    for (const address of addresses) {
      const geocodeResult = await geocodeAddress(address);

      if (geocodeResult.status === 'success') {
        const { lat, lon } = geocodeResult.data;

        // Используем только Foursquare для скорости (OSM слишком медленный)
        const foursquarePOI = await getFoursquarePOI(lat, lon, radius);

        // Формируем результат БЕЗ транспорта (будет загружаться отдельно по запросу)
        const poi = {
          transport: [], // Транспорт отключен для скорости
          schools: [],
          shops: foursquarePOI.shops || [],
          hospitals: foursquarePOI.hospitals || [],
          services: foursquarePOI.services || []
        };

        // Определяем статус POI
        const hasPOI = 
          poi.shops.length > 0 ||
          poi.hospitals.length > 0 ||
          poi.services.length > 0;

        const poiStatus = hasPOI ? 'available' : 'unavailable';

        if (!hasPOI) {
          console.log(`[POI] No POI found for address: "${address}" (${lat}, ${lon}) radius: ${radius}m`);
        } else {
          console.log(`[POI] Found for "${address}": shops:${poi.shops.length} hospitals:${poi.hospitals.length} services:${poi.services.length}`);
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
        results.push({
          address,
          status: geocodeResult.status,
          message: geocodeResult.message
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Внутренняя ошибка сервера',
        message: error.message
      })
    };
  }
};
