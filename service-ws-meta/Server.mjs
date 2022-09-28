import {Glue} from "../core-services/Glue.mjs";

import {MetadataServer} from "./MetadataServer.mjs";
import {LoadConfig} from "../core-services/Util.mjs";

export function RunServer(pathOrConfig) {
    const config = LoadConfig(pathOrConfig, import.meta);

    Glue.initService(config);

    const metadataServer = new MetadataServer(config.server);
    metadataServer.start();
}
