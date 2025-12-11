import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/users/me - Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Try to fetch profile from database, but don't fail if database is unavailable
    try {
      const result = await query('SELECT * FROM user_profiles WHERE email = $1', [
        userEmail,
      ]);

      if (result.rows.length > 0) {
        // Convert database row to camelCase
        const profile = result.rows[0];
        return NextResponse.json({
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          middleName: profile.middle_name,
          fullName: profile.full_name,
          phone: profile.phone,
          country: profile.country,
          companyName: profile.company_name,
          preferences: profile.preferences,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        });
      }
    } catch (dbError) {
      // Database might not be available or table doesn't exist - that's okay
      console.warn('Database query failed, returning default profile:', dbError);
    }

    // Return default profile from session data if not in database or database unavailable
    const user = session.user as any;
    return NextResponse.json({
      id: user.sub || user.id || session.user.email,
      email: session.user.email,
      firstName: user.givenName || user.given_name || '',
      lastName: user.familyName || user.family_name || '',
      fullName: session.user.name || '',
      phone: '',
      country: '',
      companyName: '',
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        statusUpdates: true,
        marketingCommunications: false,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Even on error, try to return basic profile from session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const user = session.user as any;
        return NextResponse.json({
          id: user.sub || user.id || session.user.email,
          email: session.user.email,
          firstName: user.givenName || user.given_name || '',
          lastName: user.familyName || user.family_name || '',
          fullName: session.user.name || '',
          phone: '',
          country: '',
          companyName: '',
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            statusUpdates: true,
            marketingCommunications: false,
          },
        });
      }
    } catch {
      // Fall through to error response
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/me - Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 PUT /api/users/me - Starting profile update...');

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error('❌ No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    console.log('✅ User authenticated:', userEmail);

    const updates = await request.json();
    console.log('📦 Received updates:', updates);

    const fullName = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();

    // Upsert profile in database (INSERT or UPDATE if exists)
    const result = await query(
      `INSERT INTO user_profiles (
        email, first_name, last_name, middle_name, full_name, 
        phone, country, company_name, preferences, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (email) 
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        middle_name = EXCLUDED.middle_name,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        country = EXCLUDED.country,
        company_name = EXCLUDED.company_name,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
      RETURNING *`,
      [
        userEmail,
        updates.firstName,
        updates.lastName,
        updates.middleName,
        fullName,
        updates.phone,
        updates.country,
        updates.companyName,
        JSON.stringify(updates.preferences || {}),
      ]
    );

    const profile = result.rows[0];

    console.info('✅ User profile updated in database:', {
      email: userEmail,
      firstName: profile.first_name,
      lastName: profile.last_name,
      country: profile.country,
    });

    // Return camelCase response
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      middleName: profile.middle_name,
      fullName: profile.full_name,
      phone: profile.phone,
      country: profile.country,
      companyName: profile.company_name,
      preferences: profile.preferences,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/me - Delete current user's account
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Delete user profile from database
    await query('DELETE FROM user_profiles WHERE email = $1', [userEmail]);

    console.info('✅ User account deleted from database:', { email: userEmail });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
