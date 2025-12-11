import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Test database connection
 */
export async function GET() {
  try {
    console.log('🧪 Testing database connection...');

    const result = await query('SELECT NOW() as current_time, version() as pg_version');

    console.log('✅ Database connection successful!', result.rows[0]);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
