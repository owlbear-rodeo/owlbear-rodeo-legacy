import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Global {
  static ORIGIN_WHITELIST: string = process.env.ALLOW_ORIGIN!!;

  static CONNECTION_PORT: string | number = process.env.PORT || 9000;

  static ICE_SERVERS = fs
    .readFile(path.resolve(__dirname, "../../", "ice.json"), "utf8")
    .then((data) => {
      return JSON.parse(data);
    })
    .catch((error) => {
      throw new Error(error);
    });
}
