const axios = require('axios');
const RateLimiter = require('../utils/rateLimit');

const rateLimiter = new RateLimiter(1000); // 1 секунда между запросами

const USER_AGENT = 'MapPrompt.cz/1.0 (contact@mapprompt.cz)';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Геокодирование адреса через Nominatim
 * @param {string} address - Адрес для геокодирования
 * @returns {Promise<Object>} - Результат с lat, lon, display_name
 */
async function geocodeAddress(address) {
  return rateLimiter.execute(async () => {
    try {
      const response = await axios.get(NOMINATIM_URL, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 30000
      });

      if (!response.data || response.data.length === 0) {
        return {
          status: 'not_found',
          message: 'Адрес не найден'
        };
      }

      const data = response.data[0];
      
      return {
        status: 'success',
        data: {
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
          display_name: data.display_name,
          address_details: data.address
        }
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          status: 'error',
          message: 'Таймаут запроса к Nominatim'
        };
      }
      
      return {
        status: 'error',
        message: error.message || 'Ошибка геокодирования'
      };
    }
  });
}

module.exports = { geocodeAddress };
