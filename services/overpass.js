const axios = require('axios');

// Fallback endpoints для Overpass API
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

const MAX_RETRIES = 3;

// In-memory кэш
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

/**
 * Sleep helper для retry логики
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch с retry логикой и fallback endpoints
 */
async function fetchWithRetryAndFallback(query) {
  let lastError = null;

  // Пробуем каждый endpoint
  for (let endpointIndex = 0; endpointIndex < OVERPASS_ENDPOINTS.length; endpointIndex++) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
    console.log(`[Overpass] Trying endpoint ${endpointIndex + 1}/${OVERPASS_ENDPOINTS.length}: ${endpoint}`);

    // Для каждого endpoint делаем до MAX_RETRIES попыток
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        const response = await axios.post(endpoint, query, {
          headers: {
            'Content-Type': 'text/plain'
          },
          timeout: 10000
        });

        if (response.status === 200 && response.data) {
          console.log(`[Overpass] Success on endpoint ${endpointIndex + 1}, retry ${retry + 1}`);
          return response.data;
        }
      } catch (error) {
        lastError = error;
        const isTimeout = error.code === 'ECONNABORTED' || error.response?.status === 504;
        const isRetryable = isTimeout || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';

        console.error(`[Overpass] Error on endpoint ${endpointIndex + 1}, retry ${retry + 1}:`, error.message);

        // Если это не последняя попытка для данного endpoint и ошибка ретраябельна
        if (retry < MAX_RETRIES - 1 && isRetryable) {
          const delayMs = 1000 * Math.pow(2, retry); // 1s, 2s, 4s
          console.log(`[Overpass] Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
          continue;
        }

        // Иначе переходим к следующему endpoint
        break;
      }
    }
  }

  // Все endpoints и retry попытки провалились
  console.error('[Overpass] All endpoints failed. Last error:', lastError?.message);
  throw lastError || new Error('All Overpass endpoints failed');
}

/**
 * Получить POI вокруг координаты
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @param {number} radius - Радиус поиска в метрах (по умолчанию 1000)
 * @returns {Promise<Object>} - Объект с категориями POI
 */
async function getPOINearby(lat, lon, radius = 1000) {
  // Проверяем кэш (с учётом радиуса)
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return cached.data;
  }

  const query = `
    [out:json][timeout:5];
    (
      node["public_transport"="stop_position"](around:${radius},${lat},${lon});
      node["highway"="bus_stop"](around:${radius},${lat},${lon});
      node["railway"="station"](around:${radius},${lat},${lon});
      node["railway"="tram_stop"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  try {
    const data = await fetchWithRetryAndFallback(query);
    const elements = data.elements || [];
    
    const result = {
      transport: extractPOI(elements, lat, lon, ['public_transport', 'highway', 'railway']),
      schools: [],
      shops: []
    };

    // Сохраняем в кэш
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log(`[Cache SET] ${cacheKey}`);

    return result;
  } catch (error) {
    console.error('[Overpass] Final error after all retries:', error.message);
    
    // Возвращаем пустой результат вместо краша
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
