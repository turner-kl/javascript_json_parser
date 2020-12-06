// JSONをパースして、JavaScriptのデータ構造を生成する関数
// オブジェクトとして作るとnewする必要があって面倒なので、クロージャーで実装する
exports.json_parse = (() => {
  /**
   * 現在の文字のインデックス値
   */
  let at;

  /**
   * 現在の文字
   */
  let ch;

  let text;
  const escapee = {
    '"': '"',
    "\\": "\\",
    "/": "/",
    b: "b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
  };

  /**
   * エラーが発生した場合に呼び出す関数
   *
   * @param {string} message
   */
  const error = function (message) {
    throw {
      name: "SyntaxError",
      message,
      at,
      text,
    };
  };

  /**
   * 一文字次に進める関数
   * もしパラメーターcが指定されていたら、それが現在の文字にマッチするのかを調べ、矛盾がありそうならエラーで終わらせます
   *
   * @param {string} c
   */
  const next = function (c) {
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }
    // 次の文字を取得します。もしそれ以上がなかったら、空文字を返します
    ch = text.charAt(at);
    at += 1;
    return ch;
  };

  /*
   * 数値を解析する関数
   */
  const number = () => {
    var number,
      string = "";

    // もしマイナスが来たら、マイナスをstringに取りおいて次へ
    if (ch === "-") {
      string = "-";
      next("-");
    }

    // 0〜9までの間の文字コードならば、stringに連結させては次へ
    while (ch >= "0" && ch <= "9") {
      string += ch;
      next();
    }

    // .が来たら.をstringに結合して、次があればstringに数値を結合します
    if (ch === ".") {
      string += ".";
      while (next() && ch >= "0" && ch <= "9") {
        string += ch;
      }
    }

    // eかEが来たら、+か-を処理後、0〜9までを処理します
    if (ch === "e" || ch === "E") {
      string += ch;
      next();
      if (ch === "-" || ch === "+") {
        string += ch;
        next();
      }
      while (ch >= "0" && ch <= "9") {
        string += ch;
        next();
      }
    }

    // 最後にstringを結合、数値変換したものをnumberに代入し、チェックして返します
    // ----- ちょっと難しい書き方の解説 ------
    // n= +string; で文字列から数値変換できる。 n = string - 0; でも可
    // 文字列を加算減算することで暗黙的キャストが走るがparseInt使ったほうが分かりよいです
    // 余談ですが、文字コードは、'A'.charCodeAt()で10進数で確認できます
    // ---------------------------------------
    number = +string;
    if (isNaN(number)) {
      error("Bad number");
    } else {
      return number;
    }
  };
  /*
   * 文字列を解析する関数
   */
  const string = () => {
    var hex,
      i,
      string = "",
      uffff;

    // 文字列を解析する場合には、"と\という文字を探す必要があります
    // Unicode文字は、\とuを処理した後、16進数として数値で読み、最大で4回、読み込みながらhexに足していきます
    // 最後にfromCharCode関数を使って数値から文字に変換します
    // isFinite関数は引数が有限値か調べる関数で、ここではチェックに使っています
    // エスケープする文字は、あらかじめ定義していた
    // escapeeオブジェクトをセットとして使い、値が存在するかで判定しています

    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return string;
        } else if (ch === "\\") {
          next();
          if (ch === "u") {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === "string") {
            string += escapee[ch];
          } else {
            break;
          }
        } else {
          string += ch;
        }
      }
    }
    error("Bad string");
  };

  /*
   * ホワイトスペースを無視する関数
   */
  const white = () => {
    while (ch && ch <= " ") {
      next();
    }
  };
  const word = () => {
    // true, false, nullを処理する関数

    switch (ch) {
      case "t":
        next("t");
        next("r");
        next("u");
        next("e");
        return true;
      case "f":
        next("f");
        next("a");
        next("l");
        next("s");
        next("e");
        return false;
      case "n":
        next("n");
        next("u");
        next("l");
        next("l");
        return null;
    }
    error("Unexpected '" + ch + "'");
  };
  const array = () => {
    // 配列を解析する関数

    var array = [];

    if (ch === "[") {
      next("[");
      white();
      if (ch === "]") {
        next("]");
        return array; // 空配列
      }
      while (ch) {
        //値があるなら、value関数の実行結果を配列に入れる
        array.push(value());
        white();
        if (ch === "]") {
          next("]");
          return array;
        }
        next(",");
        white();
      }
    }
    error("Bad array");
  };
  /*
   * オブジェクトを解析する関数
   */
  const object = () => {
    var key,
      object = {};

    if (ch === "{") {
      next("{");
      white();
      if (ch === "}") {
        next("}");
        return object; // 空のオブジェクト
      }
      while (ch) {
        key = string(); // keyはstring関数の値を入れる
        white();
        next(":");
        object[key] = value(); // objectはvalue関数の結果を入れる
        white();
        if (ch === "}") {
          next("}");
          return object;
        }
        next(",");
        white();
      }
    }
    error("Bad object");
  };

  /*
   * JSONの値を解析する関数
   * その値は、オブジェクト、配列、文字列、数値、もしくは単語で構成されます。
   * なお今まで作ってきた、一文字一文字を評価しては値を返すという
   * 全ての関数をここで合成してvalue関数を組み上げています。
   * 無論、object関数とarray関数からはこのvalue関数が呼ばれており、再帰しています。
   */
  const value = () => {
    white();
    switch (ch) {
      case "{":
        return object();
      case "[":
        return array();
      case '"':
        return string();
      case "-":
        return number();
      default:
        return ch >= "0" && ch <= "9" ? number() : word();
    }
  };

  ///////////// ここまで関数と変数の準備 ///////////////

  // 最後にこの無名関数でjson_parse関数を返します。
  // 引数はsource(JSON文字列), reviver(全valueに処理する関数)の関数です。
  // なお、この関数はここまでに定義したすべての関数と変数にアクセスできます。
  // これが便利なレキシカルスコープをつかったクロージャの仕組みです。
  // このように、無名関数の定義内の変数を参照する
  // 無名関数内無名関数を返すテクニックをモジュールと言います。
  // 無名関数内変数は、外部から変更されない安全な変数になります。

  return (source, reviver) => {
    var result;

    text = source; // sourceをtextに移動
    at = 0;
    ch = " ";
    result = value(); // value関数を使いtextが再帰的に評価されていく
    white();
    if (ch) {
      // ここで文字列の最後に到達しているはず
      error("Syntax error");
    }

    // もし引数にreviver関数がいたら(revive:復活させる)、
    // 新しい構造を再帰的に処理して、
    // 全ての名前と値のペアをreviver関数に渡して変換処理を行います。
    // 処理は結果を空のキーとして保存しているテンポラリオブジェクトから開始されます。
    // もしreviver関数がない場合は、単にresultを返します。

    return typeof reviver === "function"
      ? (function walk(holder, key) {
          var k,
            v,
            value = holder[key];
          if (value && typeof value === "object") {
            for (k in value) {
              if (Object.hasOwnProperty.call(value, k)) {
                v = walk(value, k);
                if (v !== undefined) {
                  value[k] = v;
                } else {
                  delete value[k];
                }
              }
            }
          }
          return reviver.call(holder, key, value);
        })({ "": result }, "")
      : result;

    // ------------------ 難しいので処理を解説 ----------------------
    // まず、walkが再帰巡回関数となっています。k, v はkeyとvalueの一時変数です。
    //
    // walk関数では、引数のholderオブジェクトからkeyのvalueを取り出し、
    // そのvalueのタイプがobjectだったら中身をチェックします。
    // for-in句はvalueの中身のキーをkに取りループします。そしてkをキーに
    // valueオブジェクトの中身のバリュー取りその値をvに入れて
    // walk関数を再帰呼出しします。
    //
    // なお、call関数は、関数の呼び方の一つです。
    // 引数にthisになるものと、その関数の引数になるものを第二引数以降に入れて使います。
    // apply関数と同様の動きをし、第二引数が配列を渡すかどうかだけが違います。
    // ちなみにここでのhasOwnPropertyチェックは
    // プロトタイプオブジェクトのものを無視するために行われていると思われます。
    //
    // walk関数でオブジェクトのツリーを深さ優先探索しながら、
    // walk関数の戻り値を元あったバリューに格納していきます。
    //
    // walk関数は、渡されたreviver関数を
    // thisをholder、第一引数をkey、第二引数をvalueとして
    // call関数で実行し、変更したいバリューを返すということをします。
    //
    // まとめると、すべてのオブジェクトに対して
    // 何かしらの変更処理を実施することが可能なようになっています。
    // その際に、その所有者とキーとバリューが分かるようにもなっています。
    //
    // なお何もしないreviver関数は、
    // function(key, value){return value;}
    // のようになります。keyがfirstの時、値を"hoge"にする場合、
    // function(key, value){if(key==='first') return 'hoge'; return value;}
    // となります。
    // -----------------------------------------------------------------
  };

  // 関数を返す無名関数が即時実行され、json_parse関数が返され変数に格納されます。
})();
