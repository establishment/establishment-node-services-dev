const fs = require("fs");
const os = require("os");
const child_process = require("child_process");

module.exports.getLocalIPs = () => {
    let addressInfo, interfaceDetails;
    let localIPInfo = {};

    let networkInterfaces = os.networkInterfaces();

    for (let interfaceName in networkInterfaces) {
        if (!networkInterfaces.hasOwnProperty(interfaceName)) {
            continue;
        }
        interfaceDetails = networkInterfaces[interfaceName];
        for (let i = 0, length = interfaceDetails.length; i < length; i++) {
            addressInfo = interfaceDetails[i];
            if (addressInfo.family === "IPv4") {
                if (!localIPInfo[interfaceName]) {
                    localIPInfo[interfaceName] = {};
                }
                localIPInfo[interfaceName].IPv4 = addressInfo.address;
            } else if (addressInfo.family === "IPv6") {
                if (!localIPInfo[interfaceName]) {
                    localIPInfo[interfaceName] = {};
                }
                localIPInfo[interfaceName].IPv6 = addressInfo.address;
            }
        }
    }
    return localIPInfo;
};

module.exports.getNetworkAddress = () => {
    let networkInterfaces = module.exports.getLocalIPs();
    let preferredOrder = ["eth0"];
    let foundLO = false;
    for (let networkInterface in networkInterfaces) {
        if (!networkInterfaces.hasOwnProperty(networkInterface)) {
            continue;
        }
        if (networkInterface != "lo") {
            preferredOrder.push(networkInterface);
        } else {
            foundLO = true;
        }
    }
    if (foundLO) {
        preferredOrder.push("lo");
    }
    for (let preferredInterface of preferredOrder) {
        if (networkInterfaces.hasOwnProperty(preferredInterface)) {
            if (networkInterfaces[preferredInterface].hasOwnProperty("IPv4")) {
                return networkInterfaces[preferredInterface]["IPv4"];
            }
            if (networkInterfaces[preferredInterface].hasOwnProperty("IPv6")) {
                return networkInterfaces[preferredInterface]["IPv6"];
            }
        }
    }
    return "127.0.0.1";
};

module.exports.getUnixTime = () => {
    return new Date().getTime() / 1000.0;
};

module.exports.sleep = (time) => {
    let stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
    }
};

module.exports.copyFile = (source, destination, callback) => {
    let callbackCalled = false;

    let sourceDescriptor = fs.createReadStream(source);
        sourceDescriptor.on("error", (err) => {
        done(err);
    });

    let destinationDescriptor = fs.createWriteStream(destination);
    destinationDescriptor.on("error", (err) => {
        done(err);
    });

    destinationDescriptor.on("close", (err) => {
        done(err);
    });
    sourceDescriptor.pipe(destinationDescriptor);

    let done = (err) => {
        if (!callbackCalled) {
            callback(err);
            callbackCalled = true;
        }
    }
};

module.exports.backupFile = (filename, callback) => {
    fs.stat(filename, (error, stat) => {
        if (error == null) {
            let newFilenameTokens = filename.split(".");
            newFilenameTokens.push(newFilenameTokens[newFilenameTokens.length - 1]);
            newFilenameTokens[newFilenameTokens.length - 2] = module.exports.getUnixTime().toString();
            module.exports.copyFile(filename, newFilenameTokens.join("."), callback);
        } else if (err.code == "ENOENT") {
            callback("Log file '" + filename + "' does not exists!");
        } else {
            callback(error);
        }
    });
};

module.exports.execute = (command, callback) => {
    child_process.exec(command, (error, stdout, stderr) => {
        callback(error, stdout, stderr);
    });
};
