let EstablishmentNodeServiceEmulator = require("establishment-node-service-emulator");

EstablishmentNodeServiceEmulator.Server.run({"configFilePath": process.argv[2]});
