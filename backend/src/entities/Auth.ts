import bcrypt from "bcrypt";

export default class Auth implements Auth {
  async createPasswordHash(
    password: string,
    saltRounds: number = 10
  ): Promise<string> {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  }

  async checkPassword(password: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hash);
    return result;
  }
}
