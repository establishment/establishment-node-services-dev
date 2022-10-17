import * as MathEx from "./MathEx.js";
import {Formatter} from "../../csabase/js/util.js";

// NOTE: these are not the actual values, these are just the default ones.
// Check the config passed to configure(), in this case Config.js6.js file.
var minTime = 10 * 1000, maxTime = 30 * 1000;
var upperMinTime = 10 * 1000, upperMaxTime = 30 * 1000;
var lowerMinTime = 10 * 1000, lowerMaxTime = 30 * 1000;
var minLatency = 50;
var maxLatency = 50;
var logger = {
    error: function(){},
    info: function(){}
};

export function configure(config) {
    if (config.hasOwnProperty("initialTimeInterval")) {
        if (config.initialTimeInterval.hasOwnProperty("min")) {
            minTime = config.initialTimeInterval.min;
        }
        if (config.initialTimeInterval.hasOwnProperty("max")) {
            maxTime = config.initialTimeInterval.max;
        }
    }
    if (config.hasOwnProperty("upperTimeInterval")) {
        if (config.upperTimeInterval.hasOwnProperty("min")) {
            upperMinTime = config.upperTimeInterval.min;
        }
        if (config.upperTimeInterval.hasOwnProperty("max")) {
            upperMaxTime = config.upperTimeInterval.max;
        }
    }
    if (config.hasOwnProperty("lowerTimeInterval")) {
        if (config.lowerTimeInterval.hasOwnProperty("min")) {
            lowerMinTime = config.lowerTimeInterval.min;
        }
        if (config.lowerTimeInterval.hasOwnProperty("max")) {
            lowerMaxTime = config.lowerTimeInterval.max;
        }
    }
    if (config.hasOwnProperty("minLatency")) {
        minLatency = config.minLatency;
    }
    if (config.hasOwnProperty("lowerLatency")) {
        maxLatency = config.maxLatency;
    }
}

export function setLogger(loggerObject) {
    logger = loggerObject;
}

export function start() {
    if (!global.gc) {
        logger.error('GCScheduler: Garbage collection is not exposed!');
        return;
    }

    let nextMiliSeconds = MathEx.random(minTime, maxTime);
    logger.info("GCScheduler: next clear in " + nextMiliSeconds + " ms");

    setTimeout(() => {
        let timerStart, timerFinish;

        timerStart = new Date();
        global.gc();
        timerFinish = new Date();

        let memory = process.memoryUsage();
        let gcTime = timerFinish.getTime() - timerStart.getTime();

        let coefficient = MathEx.linearCoefficient(minLatency, maxLatency, gcTime);
        coefficient = 1.0 - MathEx.clamp(0.0, 1.0, coefficient);

        minTime = MathEx.linearInterpolation(lowerMinTime, upperMinTime, coefficient);
        maxTime = MathEx.linearInterpolation(lowerMaxTime, upperMaxTime, coefficient);

        logger.warn("GCScheduler: Resident memory: " + Formatter.memory(memory.rss) + "  Heap total: " + Formatter.memory(memory.heapTotal) + "   Heap used: " + Formatter.memory(memory.heapUsed));
        logger.info("GCScheduler: finished in " + gcTime  + " ms.");
        start();
    }, nextMiliSeconds);
}
