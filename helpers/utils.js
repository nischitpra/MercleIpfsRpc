const decodeBase64ToBytes = (base64Str) => {
  if (!base64Str) return undefined;
  return Uint8Array.from(Buffer.from(base64Str, "base64"));
};

const getKeyName = (keyName) => {
  return `${process.env.NODE_ENV}_${keyName}`;
};

module.exports = {
  decodeBase64ToBytes,
  getKeyName,
};
