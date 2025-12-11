import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/users/[userId] - Get user profile by ID
 * This is used to fetch handler/user profiles (e.g., for displaying assigned handlers)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from params (handle both Promise and direct value)
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Try to get user profile from backend through the proxy
    // Use the proxy to maintain authentication
    try {
      const proxyBase = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${proxyBase}/api/proxy/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie for proxy authentication
      });

      if (response.ok) {
        const profile = await response.json();
        return NextResponse.json({
          id: profile.id || userId,
          email: profile.email,
          firstName: profile.firstName || profile.first_name,
          lastName: profile.lastName || profile.last_name,
          fullName:
            profile.fullName ||
            profile.full_name ||
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
            'Unknown User',
          profileImageUrl: profile.profileImageUrl || profile.profile_image_url,
        });
      }

      // If backend doesn't have the user, return a fallback response instead of 404
      // This allows the UI to still display something
      if (response.status === 404) {
        console.warn(`User ${userId} not found in backend, returning fallback profile`);
        return NextResponse.json({
          id: userId,
          email: '',
          firstName: '',
          lastName: '',
          fullName: 'Unknown User',
          profileImageUrl: undefined,
        });
      }
    } catch (backendError) {
      // Backend might not be available - return a fallback response
      console.warn(
        'Backend unavailable for user lookup, returning fallback:',
        backendError
      );
      return NextResponse.json({
        id: userId,
        email: '',
        firstName: '',
        lastName: '',
        fullName: 'Unknown User',
        profileImageUrl: undefined,
      });
    }

    // Fallback: return a basic profile structure
    return NextResponse.json({
      id: userId,
      email: '',
      firstName: '',
      lastName: '',
      fullName: 'Unknown User',
      profileImageUrl: undefined,
    });
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
    // Even on error, return a fallback response so the UI doesn't break
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams?.userId || 'unknown';
    return NextResponse.json({
      id: userId,
      email: '',
      firstName: '',
      lastName: '',
      fullName: 'Unknown User',
      profileImageUrl: undefined,
    });
  }
}
