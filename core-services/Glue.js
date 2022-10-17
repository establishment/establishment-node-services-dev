import fs from "fs";
import {dirname} from "path";

import {RedisConnectionPool} from "../core/redis/RedisConnectionPool.js";
import {Logger} from "./Logger.js";
import {RegistryKeeper} from "./RegistryKeeper.js";
import {ServiceStatus} from "./Status.js";
import {UniqueIdentifierFactory} from "./UniqueIdentifierFactory.js";
import {setMachineIdScript, setMockMachineId} from "./Util.js";
import {RPCServer} from "./RPCServer.js";
import {GCScheduler} from "../core/EntryPoint.js";

export let logger = Logger.getDummyAPI();
export let registryKeeper = RegistryKeeper.getDummyAPI();
export const activeService = {};
let rpcId = null;
let serviceInstanceId = null;
let serviceStatus = null;

let serviceInstanceUidFactory = null;

function initLogger(config) {
    if (logger.hasOwnProperty("isDummy")) {
        const level = Logger.getLevel(config.level);
        logger = new Logger(config.redisAddress, config.name, level);
    }
}

function initRegistryKeeper(config) {
    if (registryKeeper.hasOwnProperty("isDummy")) {
        registryKeeper = new RegistryKeeper(config);
    }
}

export function initService(config) {
    setMockMachineId(config.machineId.mockId);
    setMachineIdScript(config.machineId.script);

    initLogger(config.logging);
    initRegistryKeeper(config.registryKeeper);

    const serviceConfig = config.service;

    if (!serviceConfig.hasOwnProperty("name")) {
        console.log("ServiceGlue::initService failed to setup: missing field \"name\"");
        return;
    }

    rpcId = serviceConfig.name;

    if (serviceConfig.status) {
        if (serviceStatus == null) {
            serviceStatus = new ServiceStatus({
                name: serviceConfig.name,
                redis: {
                    address: serviceConfig.status.redis.address,
                }
            });
            serviceStatus.start();
        }
    }

    if (serviceConfig.hasOwnProperty("instanceId")) {
        let uidFactoryConfig = {
            "redis": {
                "address": serviceConfig.instanceId.uidFactory.redis.address,
                "prefix": "meta-unique-identifier-nodejs-instance"
            }
        };
        serviceInstanceUidFactory = new UniqueIdentifierFactory(uidFactoryConfig);
        serviceInstanceUidFactory.requestUID((id) => {
            serviceInstanceId = id;
            if (serviceConfig.instanceId.hasOwnProperty("path")) {
                let path = serviceConfig.instanceId.path;
                path = path.replace("$SERVICE_NAME", serviceConfig.name);
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

    GCScheduler.configure(config.gc);
    GCScheduler.setLogger(logger);
    GCScheduler.start();

    const rpcServer = new RPCServer(config.rpcServer);
    rpcServer.start();

    rpcServer.on("stop", (params, rpcCallback) => {
        stopService(params, rpcCallback);
    });

    activeService.rpcServer = rpcServer;
}

function stopService(params, rpcCallback) {
    let validRequest = true;

    if (params.hasOwnProperty("serviceInstanceId") && serviceInstanceId != null) {
        if (params["serviceInstanceId"] != String(serviceInstanceId)) {
            validRequest = false;
        }
    }
    if (params.hasOwnProperty("id") && rpcId != null) {
        if (params["id"] != String(rpcId)) {
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

    rpcCallback("Establishment::Glue::stop: Exit from process with rpcId " + rpcId);
    RedisConnectionPool.quit();
    process.exit();
}

export const Glue = {
    logger,
    registryKeeper,
    initService
};
