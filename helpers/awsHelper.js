const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");

const cloudfront = new CloudFrontClient({ region: "us-east-1", credentials: defaultProvider() });

const clearIpnsCache = async (ipnsCid) => {
  const params = {
    DistributionId: process.env.AWS_CLOUDFRONT_IPFS_DISTRIBUTION_ID,
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
  try {
    return await cloudfront.send(command);
  } catch (error) {
    console.error("clearIpnsCache::error::", error);
  }
  return undefined;
};

module.exports = {
  clearIpnsCache,
};
