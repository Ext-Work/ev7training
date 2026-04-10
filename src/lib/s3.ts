import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || 'sgp1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
})

const BUCKET = process.env.S3_BUCKET!

/**
 * Upload a small file to S3 (< 50MB)
 */
export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    })
  )

  return getPublicUrl(key)
}

/**
 * Upload a large file to S3 using multipart upload (for files > 50MB)
 * Streams the upload in 10MB chunks
 */
export async function uploadLargeToS3(
  key: string,
  body: Buffer | ReadableStream<Uint8Array>,
  contentType: string
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    },
    // 10MB per part, up to 4 concurrent uploads
    partSize: 10 * 1024 * 1024,
    queueSize: 4,
  })

  await upload.done()
  return getPublicUrl(key)
}

/**
 * Get the public URL for an S3 object
 */
function getPublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT!.replace('https://', '')
  return `https://${BUCKET}.${endpoint}/${key}`
}

export { s3Client, BUCKET }
