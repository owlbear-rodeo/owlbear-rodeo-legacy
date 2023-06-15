import Global from "./Global";

export default class IceServer {
  async getIceServers(): Promise<any> {
    const servers = await Global.ICE_SERVERS;
    return servers;
  }
}
