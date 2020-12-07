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
        switch (this.currentCharacter) {
            case "{":
                return getObject();
            case '"':
                return getString();
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