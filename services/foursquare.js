const axios = require('axios');

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const FOURSQUARE_BASE_URL = 'https://places-api.foursquare.com';
const API_VERSION = '2025-06-17';

// In-memory кэш
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

/**
 * Категории для поиска
 */
const CATEGORIES = {
  TRANSPORT: ['19046', '19044', '19043', '19042'], // transit, metro, tram, bus
  SCHOOLS: ['12012', '12013', '12014', '12057'], // school, preschool, college, university
  SHOPS: ['17069', '17145', '17001', '17002', '17114'], // supermarket, grocery, mall, convenience, pharmacy
  HOSPITALS: ['15014', '15015', '15016'], // hospital, clinic, medical center
  SERVICES: ['17114', '17029', '17143'] // pharmacy, bank, ATM
};

/**
 * Получить POI от Foursquare
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @param {number} radius - Радиус поиска в метрах
 * @returns {Promise<Object>} - Объект с категориями POI
 */
async function getFoursquarePOI(lat, lon, radius = 1000) {
  if (!FOURSQUARE_API_KEY) {
    console.warn('[Foursquare] API key not configured, skipping');
    return { shops: [], restaurants: [], services: [] };
  }

  // Проверяем кэш
  const cacheKey = `fsq_${lat.toFixed(4)},${lon.toFixed(4)},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Foursquare Cache HIT] ${cacheKey}`);
    return cached.data;
  }

  try {
    console.log(`[Foursquare] Fetching POI for ${lat},${lon} radius ${radius}m`);

    // Делаем один запрос для получения всех POI в радиусе
    const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
      params: {
        ll: `${lat},${lon}`,
        radius: radius,
        limit: 20 // уменьшили с 50 для скорости
      },
      headers: {
        'Authorization': `Bearer ${FOURSQUARE_API_KEY}`,
        'X-Places-Api-Version': API_VERSION,
        'accept': 'application/json'
      },
      timeout: 10000
    });

    const places = response.data.results || [];
    console.log(`[Foursquare] Found ${places.length} places`);

    // Группируем по категориям
    const result = {
      shops: [],
      hospitals: [],
      services: [],
      all: [] // для дедупликации
    };

    places.forEach(place => {
      const poi = {
        name: place.name || 'Unnamed',
        distance: place.distance || 0,
        category: place.categories?.[0]?.name || 'Unknown',
        source: 'foursquare'
      };

      result.all.push(poi);

      // Определяем тип по категории
      const categoryId = place.categories?.[0]?.fsq_category_id;
      
      if (CATEGORIES.SHOPS.includes(categoryId)) {
        result.shops.push(poi);
      } else if (CATEGORIES.HOSPITALS.includes(categoryId)) {
        result.hospitals.push(poi);
      } else if (CATEGORIES.SERVICES.includes(categoryId)) {
        result.services.push(poi);
      } else {
        // Fallback: определяем по имени категории
        const categoryName = place.categories?.[0]?.name?.toLowerCase() || '';
        if (categoryName.includes('shop') || categoryName.includes('store') || 
            categoryName.includes('market') || categoryName.includes('pharmacy')) {
          result.shops.push(poi);
        } else if (categoryName.includes('hospital') || categoryName.includes('clinic') || 
                   categoryName.includes('medical') || categoryName.includes('doctor')) {
          result.hospitals.push(poi);
        } else if (categoryName.includes('bank') || categoryName.includes('atm')) {
          result.services.push(poi);
        }
      }
    });

    // Сортируем по расстоянию и берём топ-5 (уменьшили для скорости)
    result.shops = result.shops.sort((a, b) => a.distance - b.distance).slice(0, 5);
    result.hospitals = result.hospitals.sort((a, b) => a.distance - b.distance).slice(0, 5);
    result.services = result.services.sort((a, b) => a.distance - b.distance).slice(0, 5);

    // Сохраняем в кэш
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log(`[Foursquare Cache SET] ${cacheKey}`);

    return result;

  } catch (error) {
    console.error('[Foursquare] Error:', error.response?.data || error.message);
    
    // Возвращаем пустой результат вместо краша
    return {
      shops: [],
      hospitals: [],
      services: [],
      all: []
    };
  }
}

/**
 * Дедупликация POI по имени и расстоянию
 */
function deduplicatePOI(poiList) {
  const seen = new Map();
  
  return poiList.filter(poi => {
    const key = `${poi.name.toLowerCase()}_${Math.round(poi.distance / 10)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

module.exports = { 
  getFoursquarePOI,
  deduplicatePOI
};
