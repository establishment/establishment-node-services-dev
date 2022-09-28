import fs from "fs";

import {GCScheduler} from "../core/EntryPoint.mjs";
import {Glue} from "../core-services/EntryPoint.mjs";
import {RPCServer} from "../core-services/RPCServer.mjs";
import {setMachineIdScript, setMockMachineId} from "../core-services/Util.mjs";

import {MetadataServer} from "./MetadataServer.mjs";
import {LoadDefaultConfig} from "./DefaultConfig.mjs";

export function RunServer(params) {
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

    const rpcServer = new RPCServer(config.rpcServer);
    rpcServer.start();

    rpcServer.on("stop", (params, rpcCallback) => {
        Glue.stop(params, rpcCallback);
    });

    const metadataServer = new MetadataServer(config.server);
    metadataServer.start();
}
