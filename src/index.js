function jsonParser(jsonString) {
  console.debug('start.', { jsonString });
  this.text = jsonString;
  this.at = 0;
  this.currentCharacter = '';

  const next = () => {
    this.currentCharacter = this.text.charAt(this.at);
    this.at += 1;
    return this.currentCharacter ? this : null;
  }

  const getValue = () => {
    next();
    white();
    console.log('value', this.currentCharacter)
    switch (this.currentCharacter) {
      case "{":
        return getObject();
      case '"':
        return getString();
      case "[":
        return getArray();
      default:
        return getNumber();
    }
  };

  const getObject = () => {
    const object = {};
    next();
    let key = getString();
    let value = getValue();
    object[key] = value;
    return object;
  }

  /**
   * 文字列を解析する。
   */
  const getString = () => {
    let string = '';
    while (next()) {
      if (this.currentCharacter === '"') {
        next();
        break;
      };
      string += this.currentCharacter;
    }
    return string;
  }

  const getNumber = () => {
    let string = '';
    while (this.currentCharacter >= "0" && this.currentCharacter <= "9") {
      string += this.currentCharacter;
      next();
    }

    if (this.currentCharacter === ".") {
      string += this.currentCharacter;
      while (next() && this.currentCharacter >= "0" && this.currentCharacter <= "9") {
        string += this.currentCharacter;

      }
    }
    const number = parseFloat(string);

    return isNaN(number) ? new Error('not a number') : number;
  }

  const getArray = () => {
    const array = [];
    while (next()) {
      white();
      let element
      if (this.currentCharacter === '"') {
        element = getString();
      } else if (this.currentCharacter >= "0" && this.currentCharacter <= "9") {
        element = getNumber();
      }
      array.push(element);
      if (this.currentCharacter !== ",") break;
    }
    return array;
  }

  /*
   * ホワイトスペースを無視する関数
   */
  const white = () => {
    while (this.currentCharacter && this.currentCharacter <= " ") {
      next();
    }
  };

  // ---------
  // value
  return (() => {
    return getValue();
  })();

}

module.exports = {
  jsonParser
}