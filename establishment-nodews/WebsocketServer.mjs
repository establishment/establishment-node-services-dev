import {RedisCache} from "../core/EntryPoint.mjs";
import {
    MetadataObserver, UniqueIdentifierFactory, PermissionChecker, PermissionDispatcher
} from "../core-services/EntryPoint.mjs";

import RedisDispatcher from "./RedisDispatcher.mjs";
import UserConnection from "./UserConnection.mjs";
import MetadataBridge from "./MetadataBridge.mjs";

import ws from "ws";

export default class WebsocketServer {
    constructor(config) {
        this.config = config;
        this.redisDispatcher = new RedisDispatcher(config.redisDispatcher);
        this.uidFactory = new UniqueIdentifierFactory(config.uidFactory);
        this.permissionChecker = new PermissionChecker(config.permissionChecker);
        this.permissionDispatcher = new PermissionDispatcher();
        this.metadataObserver = new MetadataObserver(config.metadataObserver);
        this.metadataBridge = new MetadataBridge(config.metadataBridge, this.uidFactory);
        this.redisCache = new RedisCache(config.redisCache);

        this.webSocketServer = null;

        this.permissionChecker.link(this.permissionDispatcher);
    }

    start() {
        console.log("Starting WebSocketServer", this.config.listen);

        this.webSocketServer = new ws.Server(this.config.listen);

        this.run();
    }

    run() {
        this.webSocketServer.on("connection", (webSocket, req) => {
            webSocket.upgradeReq = req;
            new UserConnection(this.config.userConnection, webSocket, this.redisDispatcher, this.uidFactory,
                               this.permissionChecker, this.metadataObserver, this.metadataBridge, this.redisCache,
                               this.permissionDispatcher);
        });
    }
}
