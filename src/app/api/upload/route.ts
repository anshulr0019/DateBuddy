import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 20 * 1024 * 1024; // 20MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

// Configure Cloudinary SDK if full credentials exist
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, WebP and HEIC images are supported' },
        { status: 415 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Image must be smaller than 20MB' },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Try Signed Cloudinary SDK if configured
    if (cloudName && apiKey && apiSecret) {
      try {
        const base64Uri = `data:${file.type};base64,${buffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(base64Uri, {
          folder: `infyn/users/${session.userId}`,
          transformation: [
            { quality: 'auto:good', fetch_format: 'auto' },
            { width: 1200, crop: 'limit' },
          ],
        });

        if (uploadResult?.secure_url) {
          return NextResponse.json({ success: true, url: uploadResult.secure_url });
        }
      } catch (cloudErr) {
        console.warn('[UPLOAD] Signed Cloudinary upload failed, trying next fallback:', cloudErr);
      }
    }

    // 2. Try Unsigned Cloudinary upload preset if available
    if (cloudName && uploadPreset) {
      try {
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('upload_preset', uploadPreset);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: cloudFormData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData?.secure_url) {
            return NextResponse.json({ success: true, url: cloudData.secure_url });
          }
        }
      } catch (presetErr) {
        console.warn('[UPLOAD] Unsigned preset failed:', presetErr);
      }
    }

    // 3. Guaranteed Local Disk Write Fallback to public/uploads/
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const filename = `chat-${session.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await writeFile(filePath, buffer);
      const localUrl = `/uploads/${filename}`;
      return NextResponse.json({ success: true, url: localUrl });
    } catch (diskErr) {
      console.warn('[UPLOAD] Disk write failed, using dataUrl fallback:', diskErr);
    }

    // 4. Data URL Fallback
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload photo' }, { status: 500 });
  }
}
