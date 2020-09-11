/**
 * A faked local or session storage used when the user has disabled storage
 */
class FakeStorage {
  data = {};
  key(index) {
    return Object.keys(this.data)[index] || null;
  }
  getItem(keyName) {
    return this.data[keyName] || null;
  }
  setItem(keyName, keyValue) {
    this.data[keyName] = keyValue;
  }
  removeItem(keyName) {
    delete this.data[keyName];
  }
  clear() {
    this.data = {};
  }
}

export default FakeStorage;
