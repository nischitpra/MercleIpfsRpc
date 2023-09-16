const fetch = require("node-fetch");

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
  if (!response.ok) throw new Error(`Failed::getJson::${_api}\n${await response.text()}`, response.status);
  return await response.json();
};

const postJson = async (_api, _body) => {
  const response = await fetch(_api, {
    method: "POST",
    headers: headers.postJson,
    body: JSON.stringify(_body),
  });
  if (!response.ok) throw new Error(`Failed::postJson::${_api}\n${await response.text()}`, response.status);
  return await response.json();
};

const getBuffer = async (_api) => {
  const response = await fetch(_api, {
    method: "GET",
    headers: headers.accept,
  });
  if (!response.ok) throw new Error(`Failed::getBuffer::${_api}\n${await response.text()}`, response.status);
  return Buffer.from(await response.arrayBuffer());
};

const postFormData = async (_api, _body) => {
  const response = await fetch(_api, {
    method: "POST",
    headers: headers.postFormData,
    body: _body,
  });
  if (!response.ok) throw new Error(`Failed::postFormData::${_api}\n${await response.text()}`, response.status);
  return await response.json();
};

module.exports = { getJson, postJson, getBuffer, postFormData };
