import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

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
        { success: false, message: 'Image must be smaller than 8MB' },
        { status: 413 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      // Dev fallback: a data URL here would be multiple MB per photo, which
      // overflows localStorage during onboarding and bloats the photos table.
      // Save to public/uploads and return a short URL instead.
      console.log('[UPLOAD] Cloudinary not configured — saving to public/uploads (dev-only fallback).');
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext =
        { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }[file.type] ?? 'jpg';
      const fileName = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, fileName), buffer);
      return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
    }

    const cloudFormData = new FormData();
    cloudFormData.append('file', file);
    cloudFormData.append('upload_preset', uploadPreset);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudFormData,
    });

    if (!cloudRes.ok) {
      console.error('[UPLOAD] Cloudinary rejected the upload:', cloudRes.status, await cloudRes.text());
      return NextResponse.json(
        { success: false, message: 'Could not upload your photo. Please try again.' },
        { status: 502 }
      );
    }

    const cloudData = await cloudRes.json();
    return NextResponse.json({ success: true, url: cloudData.secure_url });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload photo' }, { status: 500 });
  }
}
