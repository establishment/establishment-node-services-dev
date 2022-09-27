import fs from "fs";

import {Glue, RPCServer, Util} from "../establishment-node-service-core/EntryPoint.js6.js";
import {GCScheduler} from "../establishment-node-core/source/EntryPoint.js6.js";

import ServiceEmulator from "./ServiceEmulator.mjs";
import {LoadDefaultConfig} from "./DefaultConfig.mjs";

export function RunServer(params) {
    // TODO @branch fucking merge this logic
    let config = null;
    if (params) {
        if (params.hasOwnProperty("config") && params.config != null) {
            config = params.config;
        } else if (params.hasOwnProperty("configFilePath") && params.configFilePath != null) {
            config = JSON.parse(fs.readFileSync(params.configFilePath, "utf8"));
        }
    }

    if (!config) {
        config = LoadDefaultConfig();
    }

    Util.setMockMachineId(config.machineId.mockId);
    Util.setMachineIdScript(config.machineId.script);
    Glue.initLogger(config.logging);
    Glue.initRegistryKeeper(config.registryKeeper);
    Glue.initService(config.service);

    GCScheduler.configure(config.gc);
    GCScheduler.setLogger(Glue.logger);
    GCScheduler.start();

    let rpcServer = new RPCServer(config.rpcServer);
    rpcServer.start();

    rpcServer.on("stop", (params, rpcCallback) => {
        Glue.stop(params, rpcCallback);
    });

    let serviceEmulator = new ServiceEmulator(config.server);
    serviceEmulator.start();
}
