import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      console.warn('[UPLOAD] No active session cookie — processing photo upload as guest/onboarding session.');
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
      console.log('[UPLOAD] Cloudinary not configured — processing image into local Data URL.');
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({ success: true, url: dataUrl });
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
