import {Glue} from "../core-services/Glue.js";

import {MetadataServer} from "./MetadataServer.js";
import {LoadConfig} from "../core-services/Util.js";

export function RunServer(pathOrConfig) {
    const config = LoadConfig(pathOrConfig, import.meta);

    Glue.initService(config);

    const metadataServer = new MetadataServer(config.server);
    metadataServer.start();
}
