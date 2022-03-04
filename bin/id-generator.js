// Converts an integer into a respective character
const charCodes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
// This is a static variable. It will maintain its current value as different classes generate ids from here.
_currentId = 0;
_generatedKeys = [];

/**
 * Static class for generating unique ids
 */
class IdGenerator {
  /**
   * Sequentially generates unique ids
   * @returns a unique id, as a number
   */
  static generateSequentialId() {
    _currentId++;
    return _currentId;
  }
  /**
   * Randomly generates unique, 32-character strings
   * @returns a 32-character string
   */
  static generateUniqueStringId() {
    let key = 'drafts.';
    for (let i = 0; i < 32; i++) {
      let num = Math.floor(36 * Math.random());
      key += charCodes[num];
    }
    if (_generatedKeys.includes(key)) {
      key = this.generateUniqueStringId();
    }
    _generatedKeys.push(key);
    return key;
  }
}

exports.IdGenerator = IdGenerator;
