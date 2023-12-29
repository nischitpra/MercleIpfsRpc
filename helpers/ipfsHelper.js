const FormData = require("form-data");
const { postFormData, getJson, postJson } = require("./network");
const utils = require("./utils");
const { GATEWAY_URL, IPFS_API_URL } = require("../constants");
const awsHelper = require("./awsHelper");

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

const pinIpfs = async (ipfsCid) => {
  return await postJson(`${IPFS_API_URL}/pin/add?arg=${ipfsCid}`);
};

const isPinned = async (ipfsCid) => {
  try {
    return (await postJson(`${IPFS_API_URL}/pin/ls?arg=${ipfsCid}`)).Keys[ipfsCid] !== undefined;
  } catch (e) {
    if (e.message.includes("is not pinned")) return false;
    throw e;
  }
};

const pinRemove = async (ipfsCid) => {
  try {
    return await postJson(`${IPFS_API_URL}/pin/rm?arg=${ipfsCid}`);
  } catch (e) {
    if (e.message.includes("not pinned")) return { Pins: [ipfsCid] };
    throw e;
  }
};

const importKey = async ({ keyName, key }) => {
  const bytes = utils.decodeBase64ToBytes(key);
  const form = new FormData();
  form.append("file", Buffer.from(bytes, "utf-8"));
  return await postFormData(
    `${IPFS_API_URL}/key/import?arg=${utils.getKeyName(keyName)}&allow-any-key-type=true`,
    form
  );
};

const createKey = async ({ keyName }) => {
  return await postJson(`${IPFS_API_URL}/key/gen?arg=${utils.getKeyName(keyName)}`);
};

const renameKey = async ({ oldKeyName, newKeyName }) => {
  return await postJson(
    `${IPFS_API_URL}/key/rename?arg=${utils.getKeyName(oldKeyName)}&arg=${utils.getKeyName(newKeyName)}`
  );
};

const deleteKey = async ({ keyName }) => {
  return await postJson(`${IPFS_API_URL}/key/rm?arg=${utils.getKeyName(keyName)}&l=true`);
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
  const ipnsCid = await getIpnsCidFromKeyName({ keyName });
  return await resolve({ ipnsCid });
};

const getIpnsCidFromKeyName = async ({ keyName }) => {
  return (await renameKey({ oldKeyName: keyName, newKeyName: keyName }))?.Id;
};

const getOrCreateIpnsCidFromKeyName = async ({ keyName }) => {
  try {
    return await getIpnsCidFromKeyName({ keyName });
  } catch (e) {
    return (await createKey({ keyName }))?.Id;
  }
};

const publish = async ({ keyName, dataBuffer }) => {
  const ipfsCid = await uploadBuffer(dataBuffer);

  // try publish. if key doesn't exist, create a new key and publish
  try {
    return await publishIpfsCid({ keyName, ipfsCid });
  } catch (e) {
    if (e.message?.includes("no key")) {
      await createKey({ keyName });
      return await publishIpfsCid({ keyName, ipfsCid });
    }
    throw e;
  }
};

// this will not create any new ipns key
const publishIpfsCid = async ({ keyName, ipfsCid }) => {
  let oldIpfsCid;
  try {
    oldIpfsCid = await resolveKeyName({ keyName });
  } catch (e) {
    // no-op. probably doesn't exist
  }

  const res = await postJson(
    `${IPFS_API_URL}/name/publish?arg=${ipfsCid}&resolve=false&key=${utils.getKeyName(
      keyName
    )}&allow-offline=true&lifetime=876000h`
  );

  // pin the content just in case its not uploaded from our node
  pinIpfs(ipfsCid).catch((e) => console.error(e));
  if (oldIpfsCid) {
    pinRemove(oldIpfsCid).catch((e) => console.error(e));
  }
  await awsHelper.clearIpnsCache(res.Name);
  return { ipfsCid, name: res.Name };
};

module.exports = {
  ipfs: {
    getDataJson,
    uploadBuffer,
    pin: pinIpfs,
    isPinned,
    pinRemove,
  },
  ipns: {
    importKey,
    renameKey,
    listKey,
    deleteKey,
    resolve,
    resolveKeyName,
    getIpnsCidFromKeyName,
    getOrCreateIpnsCidFromKeyName,
    publish,
    publishIpfsCid,
  },
};
