import { NextRequest, NextResponse } from 'next/server';

const PROJECTIONS_API_BASE_URL = process.env.PROJECTIONS_API_BASE_URL || 'http://localhost:8007';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const assignedTo = searchParams.get('assignedTo');
    const isOverdue = searchParams.get('isOverdue');
    const requiresManualReview = searchParams.get('requiresManualReview');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const searchTerm = searchParams.get('searchTerm');
    const sortBy = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');
    const skip = searchParams.get('skip') || '0';
    const take = searchParams.get('take') || '50';

    // Build query parameters
    const params = new URLSearchParams();
    if (partnerId) params.append('partnerId', partnerId);
    if (status) params.append('status', status);
    if (riskLevel) params.append('riskLevel', riskLevel);
    if (assignedTo) params.append('assignedTo', assignedTo);
    if (isOverdue) params.append('isOverdue', isOverdue);
    if (requiresManualReview) params.append('requiresManualReview', requiresManualReview);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortDirection) params.append('sortDirection', sortDirection);
    params.append('skip', skip);
    params.append('take', take);

    const url = `${PROJECTIONS_API_BASE_URL}/api/v1/cases?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Applications API error: ${response.status} ${response.statusText} - ${errorText}`);
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Applications API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

