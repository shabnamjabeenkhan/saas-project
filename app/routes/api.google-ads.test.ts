import type { LoaderFunction } from 'react-router';

export const loader: LoaderFunction = async () => {
  try {
    console.log('🧪 Testing Google Ads API connection...');

    // Mock test response since we moved Google Ads logic to Convex
    const result = {
      success: true,
      message: 'Google Ads API test endpoint (now handled via Convex)',
      timestamp: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      message: 'Google Ads API connection test moved to Convex actions',
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Google Ads API test failed:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
};