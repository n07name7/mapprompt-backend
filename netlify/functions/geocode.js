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

        // Получаем быстрые данные: Foursquare + OSM транспорт параллельно
        const [osmPOI, foursquarePOI] = await Promise.all([
          getPOINearby(lat, lon, radius).catch(err => {
            console.error('[OSM] Error, skipping:', err.message);
            return { transport: [], schools: [], shops: [] };
          }),
          getFoursquarePOI(lat, lon, radius)
        ]);

        // Формируем результат с топ-3 транспорта
        const poi = {
          transport: (osmPOI.transport || []).slice(0, 3), // Топ-3 остановки
          schools: [],   // Школы пропускаем для скорости
          shops: foursquarePOI.shops || [],
          restaurants: foursquarePOI.restaurants || [],
          services: foursquarePOI.services || []
        };

        // Определяем статус POI
        const hasPOI = 
          poi.transport.length > 0 ||
          poi.shops.length > 0 ||
          poi.restaurants.length > 0 ||
          poi.services.length > 0;

        const poiStatus = hasPOI ? 'available' : 'unavailable';

        if (!hasPOI) {
          console.log(`[POI] No POI found for address: "${address}" (${lat}, ${lon}) radius: ${radius}m`);
        } else {
          console.log(`[POI] Found for "${address}": transport:${poi.transport.length} shops:${poi.shops.length} restaurants:${poi.restaurants.length} services:${poi.services.length}`);
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
