import fs from "fs";
import {fileURLToPath} from "url";
import path from "path";

export function LoadDefaultConfig() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    let configFilePath = path.resolve(__dirname, "DefaultConfig.json");
    return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
}
