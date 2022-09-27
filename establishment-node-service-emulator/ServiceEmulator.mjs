import netstat from "node-netstat";

import {MathEx} from "../establishment-node-core/EntryPoint.js6.js";
import {Glue, Status} from "../establishment-node-service-core/EntryPoint.js6.js";

export default class ServiceEmulator {
    constructor(config) {
        this.config = config;

        this.services = [];
        this.updateNestatTimeout = null;
        this.netstatEntries = [];
    }

    startInstance(serviceEntry) {
        if (!serviceEntry.hasOwnProperty("serviceName")) {
            Glue.logger.error("Establishment::ServiceEmulator: invalid config: serviceEntry does not contain " +
                              "\"serviceName\" field!");
            Glue.logger.error("Establishment::ServiceEmulator: skipping mapping: " + serviceEntry);
            return false;
        }

        let service = {
            "name": serviceEntry.serviceName
        };

        if (serviceEntry.hasOwnProperty("netstat")) {
            service.netstatConfig = serviceEntry.netstat;
            service.netstatStatus = false;

            if (service.netstatConfig.hasOwnProperty("state")) {
                service.netstatConfig.state = service.netstatConfig.state.toUpperCase();
            }
            if (service.netstatConfig.hasOwnProperty("protocol")) {
                service.netstatConfig.protocol = service.netstatConfig.protocol.toUpperCase();
            }
            if (service.netstatConfig.hasOwnProperty("local")) {
                if (service.netstatConfig.local.hasOwnProperty("address")) {
                    service.netstatConfig.local.address = service.netstatConfig.local.address.toUpperCase();
                }
            }
            if (service.netstatConfig.hasOwnProperty("remote")) {
                if (service.netstatConfig.remote.hasOwnProperty("address")) {
                    service.netstatConfig.remote.address = service.netstatConfig.remote.address.toUpperCase();
                }
            }
        }

        service.serviceStatusConfig = JSON.parse(JSON.stringify(this.config.service)); // Deep copy
        service.serviceStatusConfig.name = service.name;

        service.serviceStatus = null;

        this.services.push({
            "service": service,
            "serviceEntry": serviceEntry
        });
    }

    start() {
        for (let serviceEntry of this.config.services) {
            this.startInstance(serviceEntry);
        }

        this.requestUpdateNetstat();
    }

    static isServiceOnline(service) {
        if (service.hasOwnProperty("netstatStatus")) {
            if (service.netstatStatus == false) {
                return false;
            }
        }
        return true;
    }

    processNetstatEntry(entry) {
        let protocol = "NONE";
        if (entry.hasOwnProperty("protocol") && entry.protocol != null) {
            protocol = entry.protocol.toUpperCase();
        }
        let state = "NONE";
        if (entry.hasOwnProperty("state") && entry.state != null) {
            state = entry.state.toUpperCase();
        }
        let localPort = -1;
        let localAddress = "NONE";
        if (entry.hasOwnProperty("local")) {
            if (entry.local.hasOwnProperty("port") && entry.local.port != null) {
                localPort = entry.local.port;
            }
            if (entry.local.hasOwnProperty("address") && entry.local.address != null) {
                localAddress = entry.local.address.toUpperCase();
            }
        }
        let remotePort = -1;
        let remoteAddress = "NONE";
        if (entry.hasOwnProperty("remote")) {
            if (entry.remote.hasOwnProperty("port") && entry.remote.port != null) {
                remotePort = entry.remote.port;
            }
            if (entry.remote.hasOwnProperty("address") && entry.remote.address != null) {
                remoteAddress = entry.remote.address.toUpperCase();
            }
        }
        for (let service of this.services) {
            if (!service.service.hasOwnProperty("netstatConfig")) {
                continue;
            }
            if (service.service.netstatStatus) {
                continue;
            }
            if (service.service.netstatConfig.hasOwnProperty("protocol")) {
                if (!protocol.startsWith(service.service.netstatConfig.protocol)) {
                    continue;
                }
            }
            if (service.service.netstatConfig.hasOwnProperty("state")) {
                if (service.service.netstatConfig.state != state) {
                    continue;
                }
            }
            if (service.service.netstatConfig.hasOwnProperty("local")) {
                if (service.service.netstatConfig.local.hasOwnProperty("port")) {
                    if (service.service.netstatConfig.local.port != localPort) {
                        continue;
                    }
                }
                if (service.service.netstatConfig.local.hasOwnProperty("address")) {
                    if (service.service.netstatConfig.local.address != localAddress) {
                        continue;
                    }
                }
            }
            if (service.service.netstatConfig.hasOwnProperty("remote")) {
                if (service.service.netstatConfig.remote.hasOwnProperty("port")) {
                    if (service.service.netstatConfig.remote.port != remotePort) {
                        continue;
                    }
                    if (service.service.netstatConfig.remote.address != remoteAddress) {
                        continue;
                    }
                }
            }
            service.service.netstatStatus = true;
        }
    }

    updateNetstat(err) {
        if (err != null) {
            Glue.logger.error("Establishment::ServiceEmulator: failed to get netstat info. Error: " + err);
            return;
        }

        for (let service of this.services) {
            if (service.hasOwnProperty("netstatStatus")) {
                service.netstatStatus = false;
            }
        }

        for (let netstatEntry of this.netstatEntries) {
            this.processNetstatEntry(netstatEntry);
        }

        for (let service of this.services) {
            if (!service.service.hasOwnProperty("netstatStatus")) {
                continue;
            }
            if (ServiceEmulator.isServiceOnline(service.service)) {
                if (service.service.serviceStatus != null) {
                    continue;
                }
                service.service.serviceStatus = new Status(service.service.serviceStatusConfig);
                service.service.serviceStatus.start();
            } else {
                if (service.service.serviceStatus == null) {
                    continue;
                }
                service.service.serviceStatus.destroy();
                service.service.serviceStatus = null;
            }
        }
    }

    requestUpdateNetstat() {
        this.netstatEntries = [];
        netstat({
            done: (err) => {
                this.updateNetstat(err);
            }
        }, (entry) => {
            this.netstatEntries.push(entry);
        });

        this.updateNestatTimeout = setTimeout(() => {
            this.requestUpdateNetstat();
        }, MathEx.random(this.config.netstatUpdateInterval.min, this.config.netstatUpdateInterval.max));
    }

    remove(service) {
        let index = 0;
        for (let serviceEntry of this.services) {
            if (serviceEntry.service == service) {
                break;
            }
            ++index;
        }
        if (index < this.services.length) {
            this.services.splice(index, 1);
        }
    }

    stop() {
        if (this.updateNestatTimeout != null) {
            clearTimeout(this.updateNestatTimeout);
            this.updateNestatTimeout = null;
        }

        for (let service of this.services) {
            if (service.serviceStatus != null) {
                service.serviceStatus.destroy();
                service.serviceStatus = null;
            }
        }
    }

    destroy() {
        this.stop();

        this.config = null;
        this.services = null;
        this.updateNestatTimeout = null;
        this.netstatEntries = null;
    }
}
