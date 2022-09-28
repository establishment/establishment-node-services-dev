import fs from "fs";

import {Glue} from "../core-services/EntryPoint.mjs";
import RPCServer from "../core-services/RPCServer.mjs";
import {setMockMachineId, setMachineIdScript} from "../core-services/Util.mjs";
import {GCScheduler} from "../core/EntryPoint.mjs";

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

    setMockMachineId(config.machineId.mockId);
    setMachineIdScript(config.machineId.script);
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
