import * as Glue from "./Glue.mjs";
import {Queue} from "../core/EntryPoint.mjs";
import {RedisConnectionPool} from "../core/redis/RedisConnectionPool.mjs";

let factoryUID = 0;

export default class UniqueIdentifierFactory {
    constructor(config) {
        this.redisClient = RedisConnectionPool.getSharedConnection(config.redis.address);
        this.uidRedisKeyPrefix = config.redis.prefix;

        this.redisClient.on("error", (err) => {
            Glue.logger.error("Establishment::UniqueIdentifierFactory: Redis: " + err);
        });

        this.redisClient.on("ready", () => {
            Glue.logger.info("Establishment::UniqueIdentifierFactory: Redis ready!");
        });

        this.uidRequestQueue = new Queue();

        this.uidRedisKey = this.uidRedisKeyPrefix + "-" + factoryUID.toString();
        ++factoryUID;
    }

    requestUID(callback) {
        this.uidRequestQueue.push(callback);

        this.redisClient.incr(this.uidRedisKey, (err, reply) => {
            if (err) {
                Glue.logger.error("Establishment::UniqueIdentifierFactory error: " + err);
            }
            if (this.uidRequestQueue == null || this.uidRequestQueue.empty()) {
                return;
            }
            let callback = this.uidRequestQueue.pop();
            callback(reply);
        });
    }

    destroy() {
        this.redisClient = null;
        this.uidRedisKeyPrefix = null;
        this.uidRequestQueue = null;
    }
}
