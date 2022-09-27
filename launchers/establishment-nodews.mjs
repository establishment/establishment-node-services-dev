import EstablishmentNodeWS from "../establishment-nodews/source/EntryPoint.mjs";

EstablishmentNodeWS.Server.run({
    "configFilePath": process.argv[2]
});
