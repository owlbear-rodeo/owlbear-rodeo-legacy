import Global from "./Global";

export default class IceServer {
  async getIceServers(): Promise<any> {
    const servers = Global.ICE_SERVERS;
    const data = JSON.parse(servers);
    return data;
  }
}
