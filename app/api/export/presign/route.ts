/**
 * API route for generating presigned upload URLs for large images
 * This allows clients to upload directly to R2, bypassing Vercel's body size limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Config } from '@/lib/r2';

// Initialize S3 client for R2
function getS3Client() {
  const config = getR2Config();

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType = 'image/png' } = body;

    const config = getR2Config();
    if (!config.bucketName) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    // Generate a unique key for the temporary upload
    const key = `temp-exports/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;

    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
