import {Glue} from "../core-services/Glue.mjs";

import {ServiceEmulator} from "./ServiceEmulator.mjs";
import {LoadConfig} from "../core-services/Util.mjs";

export function RunServer(pathOrConfig) {
    const config = LoadConfig(pathOrConfig, import.meta);

    Glue.initService(config);

    const serviceEmulator = new ServiceEmulator(config.server);
    serviceEmulator.start();
}
