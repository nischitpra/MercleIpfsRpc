const decodeBase64ToBytes = (base64Str) => {
  if (!base64Str) return undefined;
  return Uint8Array.from(Buffer.from(base64Str, "base64"));
};

module.exports = {
  decodeBase64ToBytes,
};
