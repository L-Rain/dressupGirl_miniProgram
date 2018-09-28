let setSign = {
  base64EncodeChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  base64encode: function (str) {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
        out += this.base64EncodeChars.charAt(c1 >> 2);
        out += this.base64EncodeChars.charAt((c1 & 0x3) << 4);
        out += "==";
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
        out += this.base64EncodeChars.charAt(c1 >> 2);
        out += this.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += this.base64EncodeChars.charAt((c2 & 0xF) << 2);
        out += "=";
        break;
      }
      c3 = str.charCodeAt(i++);
      out += this.base64EncodeChars.charAt(c1 >> 2);
      out += this.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += this.base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += this.base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
  },
  getSign: function (key = "ySoxTPjQwzMm7nGJ", toSec = "") {
    return this.base64encode(this.getTs(toSec) + key);
  },
  getTs: (toSec) => {
    if (toSec) {
      return toSec
    } else {
      return parseInt(new Date().getTime() / 1000);
    }
  }
}
module.exports = setSign;