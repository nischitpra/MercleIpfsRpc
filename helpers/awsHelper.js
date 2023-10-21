const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const constants = require("../constants");

const cloudfront = new CloudFrontClient({
  region: constants.IPFS_CLOUDFRONT_REGION,
  credentials: { accessKeyId: process.env.AWS_ACCESS_ID, secretAccessKey: process.env.AWS_SECRET_KEY },
});

const clearIpnsCache = async (ipnsCid) => {
  try {
    const params = {
      DistributionId: constants.IPFS_CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/ipns/${ipnsCid}`],
        },
      },
    };

    // Create the cache invalidation
    const command = new CreateInvalidationCommand(params);
    return await cloudfront.send(command);
  } catch (error) {
    console.error("clearIpnsCache::error::", error);
  }
  return undefined;
};

module.exports = {
  clearIpnsCache,
};
