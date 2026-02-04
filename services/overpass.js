const axios = require('axios');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const RADIUS = 500; // метры

/**
 * Получить POI вокруг координаты
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @returns {Promise<Object>} - Объект с категориями POI
 */
async function getPOINearby(lat, lon) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="school"](around:${RADIUS},${lat},${lon});
      node["shop"="supermarket"](around:${RADIUS},${lat},${lon});
      node["public_transport"="stop_position"](around:${RADIUS},${lat},${lon});
      node["highway"="bus_stop"](around:${RADIUS},${lat},${lon});
      node["railway"="station"](around:${RADIUS},${lat},${lon});
      node["railway"="halt"](around:${RADIUS},${lat},${lon});
    );
    out body;
  `;

  try {
    const response = await axios.post(OVERPASS_URL, query, {
      headers: {
        'Content-Type': 'text/plain'
      },
      timeout: 30000
    });

    const elements = response.data.elements || [];
    
    return {
      transport: extractPOI(elements, lat, lon, ['public_transport', 'highway', 'railway']),
      schools: extractPOI(elements, lat, lon, ['amenity'], 'school'),
      shops: extractPOI(elements, lat, lon, ['shop'], 'supermarket')
    };
  } catch (error) {
    console.error('Overpass API error:', error.message);
    return {
      transport: [],
      schools: [],
      shops: []
    };
  }
}

/**
 * Извлечь и отфильтровать POI по типу
 */
function extractPOI(elements, centerLat, centerLon, keys, value = null) {
  return elements
    .filter(el => {
      if (!el.tags) return false;
      
      // Проверяем, есть ли нужный ключ
      const hasKey = keys.some(key => el.tags[key]);
      if (!hasKey) return false;
      
      // Если указано значение, проверяем его
      if (value) {
        return keys.some(key => el.tags[key] === value);
      }
      
      return true;
    })
    .map(el => ({
      name: el.tags.name || el.tags.ref || 'Без названия',
      type: el.tags.amenity || el.tags.shop || el.tags.public_transport || el.tags.highway || el.tags.railway,
      distance: Math.round(calculateDistance(centerLat, centerLon, el.lat, el.lon))
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Максимум 10 результатов каждого типа
}

/**
 * Рассчитать расстояние между двумя координатами (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Радиус Земли в метрах
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = { getPOINearby };
