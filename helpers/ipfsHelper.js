const FormData = require("form-data");
const { postFormData, getJson, postJson } = require("./network");
const { ErrorIpfsRpc } = require("../errors/errors");
const utils = require("./utils");
const { GATEWAY_URL, IPFS_API_URL } = require("../constants");

/**
 * IPFS RPC documentation for Kubo client
 * https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-name-resolve
 */

const getDataJson = async (ipfsCid) => {
  return await getJson(`${GATEWAY_URL}/ipfs/${ipfsCid}`);
};

const uploadBuffer = async (fileBuffer) => {
  const form = new FormData();
  form.append("file", fileBuffer);
  return (await postFormData(`${IPFS_API_URL}/add?cid-version=1`, form))?.Name;
};

const importKey = async ({ keyName, key }) => {
  const bytes = utils.decodeBase64ToBytes(key);
  const form = new FormData();
  form.append("file", Buffer.from(bytes, "utf-8"));
  return await postFormData(`${IPFS_API_URL}/key/import?arg=${keyName}&allow-any-key-type=true`, form);
};

const createKey = async ({ keyName }) => {
  return await postJson(`${IPFS_API_URL}/key/gen?arg=${keyName}`);
};

const renameKey = async ({ oldKeyName, newKeyName }) => {
  return await postJson(`${IPFS_API_URL}/key/rename?arg=${oldKeyName}&arg=${newKeyName}`);
};

const deleteKey = async ({ keyName }) => {
  return await postJson(`${IPFS_API_URL}/key/rm?arg=${keyName}&l=true`);
};

const listKey = async () => {
  return await postJson(`${IPFS_API_URL}/key/list?l=true`);
};

const resolve = async ({ ipnsCid }) => {
  return (await postJson(`${IPFS_API_URL}/name/resolve?arg=${ipnsCid}`))?.Path?.split("/ipfs/")?.[1];
};

const resolveKeyName = async ({ keyName }) => {
  // kubo doesn't have api to find key by keyName so we need to do this hack to get the current id for keyName
  // this takes some time to process to its better to cache this in redis
  const ipnsCid = (await renameKey({ oldKeyName: keyName, newKeyName: keyName }))?.Id;
  return await resolve({ ipnsCid });
};

const publish = async ({ keyName, dataBuffer }) => {
  const ipfsCid = await uploadBuffer(dataBuffer);

  // try publish. if key doesn't exist, create a new key and publish
  try {
    return await _publish({ keyName, ipfsCid });
  } catch (e) {
    if (e instanceof ErrorIpfsRpc) {
      if (!e.data?.Message?.includes("no key")) {
        throw e;
      }
      await createKey({ keyName });
      return await _publish({ keyName, ipfsCid });
    }

    throw e;
  }
};

const _publish = async ({ keyName, ipfsCid }) => {
  const res = await postJson(`${IPFS_API_URL}/name/publish?arg=${ipfsCid}&resolve=true&key=${keyName}`);
  return { ipfsCid, name: res.Name };
};

module.exports = {
  ipfs: {
    getDataJson,
    uploadBuffer,
  },
  ipns: {
    importKey,
    renameKey,
    listKey,
    deleteKey,
    resolve,
    resolveKeyName,
    publish,
  },
};
