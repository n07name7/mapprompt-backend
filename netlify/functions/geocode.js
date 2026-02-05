const { geocodeAddress } = require('../../services/nominatim');
const { getPOINearby } = require('../../services/overpass');

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
        // Временно отключаем POI для скорости
        results.push({
          address,
          status: 'success',
          data: {
            ...geocodeResult.data,
            search_radius: radius,
            poi_nearby: null,
            poi_status: 'disabled'
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
