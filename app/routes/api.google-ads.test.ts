import type { LoaderFunction } from 'react-router';
import { testGoogleAdsConnection } from '~/lib/googleAds';

export const loader: LoaderFunction = async () => {
  try {
    console.log('🧪 Testing Google Ads API connection...');

    const result = await testGoogleAdsConnection();

    return Response.json({
      success: true,
      message: 'Google Ads API connection successful!',
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