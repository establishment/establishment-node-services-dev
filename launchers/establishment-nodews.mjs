import EstablishmentNodeWS from "../establishment-nodews/EntryPoint.mjs";

EstablishmentNodeWS.Server.run({
    "configFilePath": process.argv[2]
});
