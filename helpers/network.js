const fetch = require("node-fetch");
const { ErrorIpfsRpc } = require("../errors/errors");

const headers = {
  acceptJson: {
    accept: "application/json",
    Authorization: process.env.IPFS_API_KEY,
  },
  postJson: {
    accept: "application/json",
    "content-type": "application/json",
    Authorization: process.env.IPFS_API_KEY,
  },
  accept: {
    Authorization: process.env.IPFS_API_KEY,
  },

  postFormData: {
    Authorization: process.env.IPFS_API_KEY,
  },
};

const getJson = async (_api) => {
  const response = await fetch(_api, {
    method: "GET",
    headers: headers.acceptJson,
  });
  if (!response.ok) throw new ErrorIpfsRpc(`Failed::getJson::${_api}`, response.status, await response.text());
  return await response.json();
};

const postJson = async (_api, _body) => {
  const response = await fetch(_api, {
    method: "POST",
    headers: headers.postJson,
    body: JSON.stringify(_body),
  });
  if (!response.ok) throw new ErrorIpfsRpc(`Failed::postJson::${_api}`, response.status, await response.text());
  return await response.json();
};

const getBuffer = async (_api) => {
  const response = await fetch(_api, {
    method: "GET",
    headers: headers.accept,
  });
  if (!response.ok) throw new ErrorIpfsRpc(`Failed::getBuffer::${_api}`, response.status, await response.text());
  return Buffer.from(await response.arrayBuffer());
};

const postFormData = async (_api, _body) => {
  const response = await fetch(_api, {
    method: "POST",
    headers: headers.postFormData,
    body: _body,
  });
  if (!response.ok) throw new ErrorIpfsRpc(`Failed::postFormData::${_api}`, response.status, await response.text());
  return await response.json();
};

module.exports = { getJson, postJson, getBuffer, postFormData };
