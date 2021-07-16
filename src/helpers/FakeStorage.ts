/**
 * A faked local or session storage used when the user has disabled storage
 */
class FakeStorage {
  data: { [keyName: string]: any } = {};
  key(index: number) {
    return Object.keys(this.data)[index] || null;
  }
  getItem(keyName: string) {
    return this.data[keyName] || null;
  }
  setItem(keyName: string, keyValue: any) {
    this.data[keyName] = keyValue;
  }
  removeItem(keyName: string) {
    delete this.data[keyName];
  }
  clear() {
    this.data = {};
  }
}

export default FakeStorage;
