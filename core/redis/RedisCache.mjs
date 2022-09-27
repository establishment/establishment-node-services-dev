import {RedisConnectionPool} from "./RedisConnectionPool.mjs";

export default class RedisCache {
    constructor(config) {
        this.redisClient = RedisConnectionPool.getSharedConnection(config.redis.address);
        this.expireStartTime = config.expire.start;
        this.expireMaxTime = config.expire.max;
        this.expireRenewCoeff = config.expire.coeff;

        this.cache = new Map();
        this.cacheKeyTimer = new Map();
        this.cacheKeyLastExpire = new Map();
    }

    access(key) {
        let expire;
        if (this.cacheKeyTimer.has(key)) {
            clearTimeout(this.cacheKeyTimer.get(key));
            expire = Math.min(this.expireMaxTime, this.cacheKeyLastExpire.get(key) * this.expireRenewCoeff);
        } else {
            expire = this.expireStartTime;
        }
        let timeoutHandler = setTimeout(() => {
            this.deleteKey(key);
        }, expire);
        this.cacheKeyTimer.set(key, timeoutHandler);
        this.cacheKeyLastExpire.set(key, expire);
    }

    deleteKey(key) {
        this.cache.delete(key);
        if (this.cacheKeyTimer.has(key)) {
            clearTimeout(this.cacheKeyTimer.get(key));
        }
        this.cacheKeyTimer.delete(key);
        this.cacheKeyLastExpire.delete(key);
    }

    get(key, callback) {
        if (this.cache.has(key)) {
            this.access(key);
            callback(null, this.cache.get(key));
        } else {
            this.redisClient.get(key, (error, reply) => {
                this.access(key);
                this.cache.set(key, reply);
                callback(error, reply);
            });
        }
    }
}
