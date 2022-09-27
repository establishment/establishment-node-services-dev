let redis = require("redis");

let redisConnectionPool = new Map();
let redisSharedConnectionPool = new Map();

class RedisConnectionPool {
    constructor() {
    }

    static getConnection(redisAddress) {
        if (!redisConnectionPool.has(redisAddress)) {
            redisConnectionPool.set(redisAddress, new Set());
        }

        let redisClient = redis.createClient(redisAddress);

        let redisClients = redisConnectionPool.get(redisAddress);
        redisClients.add(redisClient);
        redisConnectionPool.set(redisAddress, redisClients);

        return redisClient;
    }

    static getSharedConnection(redisAddress) {
        if (!redisSharedConnectionPool.has(redisAddress)) {
            redisSharedConnectionPool.set(redisAddress, redis.createClient(redisAddress));
        }

        return redisSharedConnectionPool.get(redisAddress);
    }

    static quit() {
        for (let [address, connections] of redisConnectionPool) {
            for (let connection of connections) {
                connection.quit();
            }
        }
        for (let [address, connection] of redisSharedConnectionPool) {
            connection.quit();
        }
    }
}

module.exports = RedisConnectionPool;
