export interface FileUploadResult {
  fileId: string;
  filename: string;
  bytes: number;
  createdAt: number;
  purpose: string;
}

export interface UploadResponse {
  message: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  fileInfo?: FileUploadResult;
  tableExtraction?: any;
}