require("dotenv").config();
const chai = require("chai");
const expect = chai.expect;
const ipfsHelper = require("../helpers/ipfsHelper");

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

  it("test upload json", async () => {
    const data = JSON.stringify({ msg: "Hello World!" });
    const ipfsCid = await ipfsHelper.ipfs.uploadBuffer(Buffer.from(data));
    const json = await ipfsHelper.ipfs.getDataJson(ipfsCid);

    expect(JSON.stringify(json)).eq(data);
  });
});

describe("Testing IPNS", function () {
  this.timeout(120000); // 2mins

  it("test import and delete keys", async () => {
    await importTestKey();
    expect((await ipfsHelper.ipns.listKey()).Keys.find((v) => v.Name == testKeyName)?.Name).eq(testKeyName);
    await deleteTestKey();
    expect((await ipfsHelper.ipns.listKey()).Keys.find((v) => v.Name == testKeyName)?.Name).eq(undefined);
  });

  it("Testing IPNS", async () => {
    const testWithNoKey = async () => {
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

    const testWithExistingKey = async (ipns) => {
      console.log("testing publish with existing keyName");
      const data = JSON.stringify({ name: "Test", description: "Testing ipns publish" });
      const r = await ipfsHelper.ipns.publish({ keyName: testKeyName, dataBuffer: Buffer.from(data) });
      expect(r.ipfsCid).eq("bafkreiceblulsjb2q2dbfosxgsviun2du73jcoo3nc2hg5dsudgez4avli");
      expect(r.name).eq(ipns.name);
    };

    const testResovleIpns = async (ipns) => {
      console.log("testing resolve ipnsCid");
      const ipfsCid = await ipfsHelper.ipns.resolve({ ipnsCid: ipns.name });
      expect(ipfsCid).eq(ipns.ipfsCid);
    };

    const ipns = await testWithNoKey();
    await testWithExistingKey(ipns);
    await testResovleIpns(ipns);

    await deleteTestKey();
  });
});
