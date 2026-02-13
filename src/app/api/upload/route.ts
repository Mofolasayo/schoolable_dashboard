import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const folder = request.nextUrl.searchParams.get('folder') || 'tasks';
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    const isFileUpload = (
      value: FormDataEntryValue | null
    ): value is Blob & { name?: string } => {
      if (!value || typeof value !== 'object') return false;
      return typeof (value as Blob).arrayBuffer === 'function';
    };

    if (!isFileUpload(file)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to backend storage API
    const backendFormData = new FormData();
    const fileName = typeof file.name === 'string' ? file.name : 'upload';
    backendFormData.append('file', file, fileName);

    const response = await fetch(
      `${API_URL}/storage/upload?folder=${encodeURIComponent(folder)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: backendFormData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Upload failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
