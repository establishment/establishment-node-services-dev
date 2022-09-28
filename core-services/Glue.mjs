import fs from "fs";
import {dirname} from "path";

import {RedisConnectionPool} from "../core/redis/RedisConnectionPool.mjs";
import {Logger} from "./Logger.mjs";
import {RegistryKeeper} from "./RegistryKeeper.mjs";
import {ServiceStatus} from "./Status.mjs";
import {UniqueIdentifierFactory} from "./UniqueIdentifierFactory.mjs";

export let logger = Logger.getDummyAPI();
export let registryKeeper = RegistryKeeper.getDummyAPI();
let rpcId = null;
let serviceInstanceId = null;
let serviceStatus = null;

let serviceInstanceUidFactory = null;

export function initLogger(config) {
    if (logger.hasOwnProperty("isDummy")) {
        logger = new Logger(config.redisAddress, config.name, Logger.getLevel(config.level));
    }
}

export function initRegistryKeeper (config) {
    if (registryKeeper.hasOwnProperty("isDummy")) {
        registryKeeper = new RegistryKeeper(config);
    }
}

export function initService(config) {
    if (!config.hasOwnProperty("name")) {
        console.log("ServiceGlue::initService failed to setup: missing field \"name\"");
        return;
    }
    setName(config.name);
    if (config.hasOwnProperty("status")) {
        let statusServiceConfig = {
            "name": config.name,
            "redis": {
                "address": config.status.redis.address
            }
        };
        initServiceStatus(statusServiceConfig);
    }
    if (config.hasOwnProperty("instanceId")) {
        let uidFactoryConfig = {
            "redis": {
                "address": config.instanceId.uidFactory.redis.address,
                "prefix": "meta-unique-identifier-nodejs-instance"
            }
        };
        serviceInstanceUidFactory = new UniqueIdentifierFactory(uidFactoryConfig);
        serviceInstanceUidFactory.requestUID((id) => {
            serviceInstanceId = id;
            if (config.instanceId.hasOwnProperty("path")) {
                let path = config.instanceId.path;
                path = path.replace("$SERVICE_NAME", config.name);
                fs.mkdir(dirname(path), {recursive: true}, (err) => {
                    if (err) {
                        console.error(`ServiceGlue::initService failed to save service instance id to file "${path}". Error: ${err}.`);
                        return;
                    }
                    fs.writeFile(path, new Uint8Array(Buffer.from(id.toString())), (err) => {
                        if (err) {
                            console.error(`ServiceGlue::initService failed to save service instance id to file "${path}". Error: ${err}.`);
                        }
                    });
                });
            }
            serviceInstanceUidFactory.destroy();
            serviceInstanceUidFactory = null;
        });
    }
}

export function initServiceStatus(config) {
    if (serviceStatus == null) {
        serviceStatus = new ServiceStatus(config);
        serviceStatus.start();
    }
}

export function setName(name) {
    rpcId = name;
}

export function stop(params, rpcCallback) {
    let validRequest = true;

    if (params.hasOwnProperty("serviceInstanceId") && module.exports.serviceInstanceId != null) {
        if (params["serviceInstanceId"] != String(module.exports.serviceInstanceId)) {
            validRequest = false;
        }
    }
    if (params.hasOwnProperty("id") && module.exports.rpcId != null) {
        if (params["id"] != String(module.exports.rpcId)) {
            validRequest = false;
        }
    }

    if (!validRequest) {
        return;
    }

    if (serviceStatus != null) {
        serviceStatus.destroy();
        serviceStatus = null;
    }

    if (serviceInstanceUidFactory != null) {
        serviceInstanceUidFactory.destroy();
        serviceInstanceUidFactory = null;
    }

    rpcCallback("Establishment::Glue::stop: Exit from process with rpcId " + module.exports.rpcId);
    RedisConnectionPool.quit();
    process.exit();
}
