require("dotenv").config();
const fetch = require("node-fetch");
const chai = require("chai");
const expect = chai.expect;
const ipfsHelper = require("../helpers/ipfsHelper");
const constants = require("../constants");
const utils = require("../helpers/utils");

const testKeyName = "testKeyName";

const importTestKey = async () => {
  const key = "CAESQEu76/a1BBhRtqQ7rWxcHXx7ekHKrz45GJL5suGANvXhDR6KE67fa6v8jQbflMTVZdQGhXxq+VItZdGT+tMjnno=";
  await ipfsHelper.ipns.importKey({ keyName: testKeyName, key });
  return testKeyName;
};

const deleteTestKey = async () => {
  await ipfsHelper.ipns.deleteKey({ keyName: testKeyName });
  return testKeyName;
};

describe("Testing IPFS", function () {
  this.timeout(120000); // 2mins

  it("Testing IPFS", async () => {
    console.log("testing ipfs upload");
    const data = JSON.stringify({ msg: "Hello World!" });
    const ipfsCid = await ipfsHelper.ipfs.uploadBuffer(Buffer.from(data));
    const json = await ipfsHelper.ipfs.getDataJson(ipfsCid);
    expect(JSON.stringify(json)).eq(data);

    console.log("testing ipfs is pinned");
    expect(await ipfsHelper.ipfs.isPinned(ipfsCid)).eq(true);

    console.log("testing multiple pin then single remove pin");
    await ipfsHelper.ipfs.pin(ipfsCid);
    await ipfsHelper.ipfs.pin(ipfsCid);
    await ipfsHelper.ipfs.pinRemove(ipfsCid);
    expect(await ipfsHelper.ipfs.isPinned(ipfsCid)).eq(false);
  });
});

describe("Testing IPNS", function () {
  this.timeout(120000); // 2mins

  it("test import and delete keys", async () => {
    try {
      // try delete if already exists
      await deleteTestKey();
    } catch (e) {
      // no-op
    }
    await importTestKey();
    expect((await ipfsHelper.ipns.listKey()).Keys.find((v) => v.Name == utils.getKeyName(testKeyName))?.Name).eq(
      utils.getKeyName(testKeyName)
    );
    await deleteTestKey();
    expect((await ipfsHelper.ipns.listKey()).Keys.find((v) => v.Name == utils.getKeyName(testKeyName))?.Name).eq(
      undefined
    );
  });

  it("Testing IPNS", async () => {
    const testPublishWithNoKey = async () => {
      console.log("testing publish with non existing keyName");
      try {
        await deleteTestKey();
      } catch (e) {
        // no-op
      }

      const data = JSON.stringify({ name: "Test", description: "Testing ipns publish" });

      const r = await ipfsHelper.ipns.publish({ keyName: testKeyName, dataBuffer: Buffer.from(data) });
      expect(r.ipfsCid).eq("bafkreiceblulsjb2q2dbfosxgsviun2du73jcoo3nc2hg5dsudgez4avli");
      expect(!!r.name).eq(true); // new key is created so don't know what ipns will be

      return r;
    };

    const testPublishWithExistingKey = async (ipns) => {
      console.log("testing publish with existing keyName");
      const data = JSON.stringify({ name: "Test", description: "Testing ipns publish 1" });
      const r = await ipfsHelper.ipns.publish({ keyName: testKeyName, dataBuffer: Buffer.from(data) });
      expect(r.ipfsCid).eq("bafkreide5oqdpysdhegzaccf6x7iaq4pjzuox2ecxipohb4e6thelunwjq");
      expect(r.name).eq(ipns.name);

      console.log("testing old ipfsCid is unpinned after new publish");
      expect(await ipfsHelper.ipfs.isPinned(ipns.ipfsCid)).eq(false);

      return r;
    };

    const testPublishIpnsCacheClear = async (ipns) => {
      console.log("testing cache clear after publish");
      const oldDataFromCloudfront = await (await fetch(`${constants.GATEWAY_URL}/ipns/${ipns.name}`)).text();

      const data = JSON.stringify({ name: "Test", description: "Testing ipns publish cache" });
      const r = await ipfsHelper.ipns.publish({ keyName: testKeyName, dataBuffer: Buffer.from(data) });

      const newDataFromCloudfront = await (await fetch(`${constants.GATEWAY_URL}/ipns/${ipns.name}`)).text();

      expect(oldDataFromCloudfront).not.eq(newDataFromCloudfront);
      expect(newDataFromCloudfront).eq(data);

      return r;
    };

    const testResovleIpns = async (ipns) => {
      console.log("testing resolve ipnsCid");
      const ipfsCid = await ipfsHelper.ipns.resolve({ ipnsCid: ipns.name });
      expect(ipfsCid).eq(ipns.ipfsCid);
    };

    const testRenameIpns = async (ipns) => {
      console.log("testing resolve keyName for ipfsCid");
      const ipfsCid = await ipfsHelper.ipns.resolveKeyName({ keyName: testKeyName });
      expect(ipfsCid).eq(ipns.ipfsCid);
    };

    let ipns = await testPublishWithNoKey();
    ipns = await testPublishWithExistingKey(ipns);
    ipns = await testPublishIpnsCacheClear(ipns);
    await testResovleIpns(ipns);
    await testRenameIpns(ipns);

    await deleteTestKey();
  });
});
