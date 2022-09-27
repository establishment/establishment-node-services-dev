import {Util} from "../core/EntryPoint.js6.js";

import * as Glue from "./Glue.mjs";

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
