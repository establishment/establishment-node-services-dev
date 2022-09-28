import {activeService, Glue} from "../core-services/Glue.mjs";

import {WebsocketServer} from "./WebsocketServer.mjs";
import {UserConnection} from "./UserConnection.mjs";
import {LoadConfig} from "../core-services/Util.mjs";

export function RunServer(pathOrConfig) {
    const config = LoadConfig(pathOrConfig, import.meta);

    Glue.initService(config);

    activeService.rpcServer.on("refresh", (params, rpcCallback) => {
        Glue.logger.info("Refresh command issued: executing now!");
        if (!params.hasOwnProperty("batchSize")) {
            let error = "RPC Refresh error: params does not contain 'batchSize'";
            Glue.logger.error(error);
            callback(error);
        }
        if (!params.hasOwnProperty("batchDelay")) {
            let error = "RPC Refresh error: params does not contain 'batchDelay'";
            Glue.logger.error(error);
            callback(error);
        }
        if (!params.hasOwnProperty("delay")) {
            let error = "RPC Refresh error: params does not contain 'delay'";
            Glue.logger.error(error);
            callback(error);
        }

        let userConnections = UserConnection.getAll();
        let batch = [];
        let batches = [];
        for (let userConnection of userConnections) {
            batch.push(userConnection);
            if (batch.length === params.batchSize) {
                batches.push(batch);
                batch = [];
            }
        }
        if (batch.length !== 0) {
            batches.push(batch);
        }

        let batchIndex = 0;
        let currentBatch = 0;

        let sendBatchRefresh = (callback) => {
            if (batchIndex == batches[currentBatch].length) {
                callback();
            } else {
                batches[currentBatch][batchIndex].sendCommand("refresh");
                ++batchIndex;
                setTimeout(() => {
                    sendBatchRefresh(callback)
                }, params.delay);
            }
        };

        let sendRefresh = () => {
            if (currentBatch == batches.length) {
                rpcCallback("RPC Refresh: finish!");
            } else {
                batchIndex = 0;
                sendBatchRefresh(() => {
                    ++currentBatch;
                    setTimeout(sendRefresh, params.batchDelay);
                });
            }
        };

        sendRefresh();
    });

    let websocketServer = new WebsocketServer(config.server);
    websocketServer.start();
}
