import {Glue} from "../core-services/Glue.js";

import {ServiceEmulator} from "./ServiceEmulator.js";
import {LoadConfig} from "../core-services/Util.js";

export function RunServer(pathOrConfig) {
    const config = LoadConfig(pathOrConfig, import.meta);

    Glue.initService(config);

    const serviceEmulator = new ServiceEmulator(config.server);
    serviceEmulator.start();
}
