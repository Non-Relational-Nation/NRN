import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const REGION = process.env.AWS_REGION || "af-south-1";
const BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || "nrn-grad-group01-dev-wso0bw6b";

export const s3 = new S3Client({ region: REGION, forcePathStyle: false });

export async function uploadFileToS3(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split('.').pop();
  const key = `media/${uuidv4()}.${ext}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  try {
    await s3.send(command);

    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
}
