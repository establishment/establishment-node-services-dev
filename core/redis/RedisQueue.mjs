import {RedisConnectionPool} from "./RedisConnectionPool.mjs";

export class RedisQueue {
    constructor(queueName, redisAddress, maxQueueSize = 16 * 1024) {
        this.maxQueueSize = maxQueueSize;
        this.queueName = queueName;
        this.redisClient = RedisConnectionPool.getSharedConnection(redisAddress);
    }

    push(value) {
        if (typeof value != "string") {
            value = JSON.stringify(value)
        }
        this.redisClient.lpush(this.queueName, value, (error, reply) => {
            if (error) {
                return;
            }
            if (reply > this.maxQueueSize) {
                this.redisClient.rpop(this.queueName);
            }
        });
    }

    pop(callback) {
        this.redisClient.rpop(this.queueName, (error, result) => {
            if (error) {
                result = null;
            }
            callback(result);
        });
    }
}
