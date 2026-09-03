import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profileImage: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({ profileImage: user.profileImage });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const image = formData.get('image');
    const isUploadedFile = image !== null
      && typeof image === 'object'
      && 'arrayBuffer' in image
      && typeof image.arrayBuffer === 'function';
    if (!isUploadedFile || !allowedImageTypes.has((image as File).type) || (image as File).size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Upload a valid image up to 10 MB.' }, { status: 400 });
    }

    const uploadedImage = image as File;
    const imageData = Buffer.from(await uploadedImage.arrayBuffer()).toString('base64');
    const profileImage = `data:${uploadedImage.type};base64,${imageData}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage },
    });

    return NextResponse.json({ profileImage });
  } catch (error) {
    console.error('Profile picture upload failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Profile picture upload failed.' },
      { status: 500 }
    );
  }
}
