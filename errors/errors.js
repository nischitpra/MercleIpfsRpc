class ErrorIpfsRpc extends Error {
  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.data = data;
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      data: this.data,
    };
  }
}

module.exports = {
  ErrorIpfsRpc,
};
