import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'infyn2026';

function isAuthorized(request: NextRequest): boolean {
  const headerKey = request.headers.get('x-admin-key');
  const queryKey = request.nextUrl.searchParams.get('key');
  return headerKey === ADMIN_SECRET || queryKey === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phoneNumber,
        email: users.email,
        gender: users.gender,
        city: users.city,
        dob: users.dateOfBirth,
        onboardingAt: users.onboardingCompletedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Convert to CSV
    const headers = ['ID', 'Name', 'Phone Number', 'Email', 'Gender', 'City', 'Date of Birth', 'Onboarding Complete', 'Joined At'];
    const rows = allUsers.map((u) => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.phone || ''}"`,
      `"${u.email || ''}"`,
      `"${u.gender || ''}"`,
      `"${(u.city || '').replace(/"/g, '""')}"`,
      `"${u.dob ? new Date(u.dob).toISOString().split('T')[0] : ''}"`,
      u.onboardingAt ? 'Yes' : 'No',
      `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="infyn-users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, message: 'Could not export data' }, { status: 500 });
  }
}
