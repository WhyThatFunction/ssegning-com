export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('S3_PUBLIC_BASE'),
        s3Options: {
          endpoint: env('S3_ENDPOINT'),
          region: env('S3_REGION', 'us-east-1'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          },
          params: {
            Bucket: env('S3_BUCKET'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
