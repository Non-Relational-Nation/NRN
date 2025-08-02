import multer from "multer";

// Use memory storage for direct S3 upload
export const upload = multer({ storage: multer.memoryStorage() });
