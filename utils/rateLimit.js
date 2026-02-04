/**
 * Rate limiter для внешних API (Nominatim требует минимум 1 секунду между запросами)
 */
class RateLimiter {
  constructor(minDelayMs = 1000) {
    this.minDelayMs = minDelayMs;
    this.lastCallTime = 0;
    this.queue = [];
    this.processing = false;
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      
      if (timeSinceLastCall < this.minDelayMs) {
        await this.sleep(this.minDelayMs - timeSinceLastCall);
      }

      const { fn, resolve, reject } = this.queue.shift();
      
      try {
        this.lastCallTime = Date.now();
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RateLimiter;
