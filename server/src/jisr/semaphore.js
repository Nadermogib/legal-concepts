/**
 * @file semaphore.js
 * محدد التوازي (Concurrency Limiter) لضمان عدم تجاوز 3 طلبات متزامنة لجسر (وفق 3.6.1)
 */

export class Semaphore {
  /**
   * @param {number} [maxConcurrency=3] الحد الأقصى للطلبات المتزامنة
   */
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency
    this.activeCount = 0
    /** @type {Array<() => void>} */
    this.queue = []
  }

  /**
   * حجز إذن للتنفيذ (ينتظر في الطابور إن وصل الحد الأقصى)
   * @returns {Promise<void>}
   */
  async acquire() {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++
      return
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.activeCount++
        resolve()
      })
    })
  }

  /**
   * تحرير إذن بعد انتهاء الطلب
   */
  release() {
    this.activeCount--
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      const next = this.queue.shift()
      if (next) next()
    }
  }

  /**
   * تنفيذ دالة داخل نطاق محدد التوازي
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async run(fn) {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

// كائن مفرد بحد أقصى 3 طلبات متزامنة لجسر
export const jisrSemaphore = new Semaphore(3)
