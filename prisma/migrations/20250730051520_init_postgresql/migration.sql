-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractedContent" JSONB,
    "vectorStoreId" TEXT,
    "vectorStoreFileId" TEXT,
    "extractedFileId" TEXT,
    "processingTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_fileId_key" ON "public"."documents"("fileId");
