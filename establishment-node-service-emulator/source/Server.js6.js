const fs = require("fs");
const path = require("path");

const {Glue, RPCServer, Util} = require("../../establishment-node-service-core/source/EntryPoint.js6.js");
const {GCScheduler} = require("../../establishment-node-core/source/EntryPoint.js6.js");

const ServiceEmulator = require("./ServiceEmulator.js6.js");
const DefaultConfig = require("./DefaultConfig.js6.js");

module.exports.run = (params) => {
    let config = null;
    if (params) {
        if (params.hasOwnProperty("config") && params.config != null) {
            config = params.config;
        } else if (params.hasOwnProperty("configFilePath") && params.configFilePath != null) {
            config = JSON.parse(fs.readFileSync(params.configFilePath, "utf8"));
        }
    }

    if (!config) {
        config = DefaultConfig();
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
};
