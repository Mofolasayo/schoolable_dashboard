import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin-auth-token')?.value;

        if (!token) {
            return NextResponse.json({ token: null }, { status: 200 });
        }

        return NextResponse.json({ token });
    } catch {
        return NextResponse.json({ token: null }, { status: 200 });
    }
}
