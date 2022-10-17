import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import {isPlainObject} from "../../stemjs/src/base/Utils.js";

import {Util} from "../core/EntryPoint.js";

import * as Glue from "./Glue.js";

let machineIdScript = null;
let mockMachineId = -1;

export let machineId = null;

export function setMockMachineId(machineId) {
    mockMachineId = machineId;
}

export function setMachineIdScript(scriptPath) {
    if (scriptPath && scriptPath.charAt(0) == "/") {
        machineIdScript = scriptPath;
    } else {
        if (process.env.DAEDALUS_PROJECT_PATH) {
            machineIdScript = process.env.DAEDALUS_PROJECT_PATH + "/" + scriptPath;
        } else {
            machineIdScript = scriptPath;
        }
    }
}

export function queryMachineId(callback) {
    if (machineIdScript) {
        machineId = Util.execute(machineIdScript, (error, stdout, stderr) => {
            if (error) {
                Glue.logger.critical("Establishment::Util: failed to execute getMachineId script!");
                return;
            }
            if (stdout.toUpperCase() != "NONE") {
                machineId = parseInt(stdout);
            }
            callback(machineId);
        });
    } else {
        machineId = mockMachineId;
        callback(machineId);
    }
}

export function getMachineId() {
    if (machineId == null) {
        queryMachineId();
    }
    return machineId;
}

export function LoadConfig(pathOrConfig, importMeta) {
    if (isPlainObject(pathOrConfig)) {
        return pathOrConfig;
    }

    let configFilePath = pathOrConfig;
    if (!configFilePath) {
        const __filename = fileURLToPath(importMeta.url);
        const __dirname = path.dirname(__filename);
        configFilePath = path.resolve(__dirname, "DefaultConfig.json");
    }

    return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
}
