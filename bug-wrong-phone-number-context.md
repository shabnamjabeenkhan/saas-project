# Bug Context: Wrong Phone Number in Google Ads Preview

## 1. Error Description

When pushing a campaign from the Campaigns page after clicking the "Push to Google Ads" button, the incorrect phone number is displayed in Google Ads preview. When clicking on an ad from any of the 4 ad groups:

- **First click**: Shows incorrect phone number
- **Second click**: Shows correct phone number from onboarding
- **Third click**: Shows incorrect phone number again

This alternating behavior applies to all 4 ad groups consistently.

**Expected Behavior**: The correct phone number from onboarding should always be displayed in Google Ads preview.

**Actual Behavior**: Phone number alternates between correct and incorrect values when viewing ads in Google Ads preview.

---

## 2. User Journey

1. User completes onboarding and adds the phone number
2. Campaign from onboarding is created, and the correct number appears in ad groups in the TradeBoost AI website
3. User connects their Google Ads account to the website
4. User clicks on the "Connect to Google Ads" button (or "Push to Google Ads" button)
5. Campaign is pushed to Google Ads and user can view the preview where the phone number is displayed
6. User regenerates the campaign which creates a varied version of the previous campaign
7. User pushes that regenerated campaign and can view that campaign in Google Ads

---

## 3. Jam.dev Replay

**Link**: https://jam.dev/c/5f2beb30-0021-4f1a-9002-78aab222d374

---

## 4. Screenshots

*[Screenshots would be inserted here - user provided 5 screenshots showing the issue]*

---

## 5. Client-side Logs

*[Client-side logs would be inserted here - user provided 5 log screenshots]*

---

## 6. Network Tab

### Failed Requests
*[Failed request details would be inserted here]*

### Response Payloads
*[Response payloads showing phone numbers would be inserted here]*

### Status Codes
*[Status codes from network requests would be inserted here]*

---

## 7. Code Snippets

### 7.1 Primary Issue - Modern Call Asset Creation (No Cleanup)

**File**: `convex/googleAdsCampaigns.ts:447-569`

```447:569:convex/googleAdsCampaigns.ts
      // Step 10: Create call extensions
      // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
      const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      const phoneNumber = freshOnboardingData?.phone;

      if (!phoneNumber) {
        throw new Error("Missing phone number from onboarding data");
      }
      console.log('📞 Attempting call extension creation...');
      console.log('📞 Fresh onboarding phone:', freshOnboardingData?.phone || 'NOT FOUND');
      console.log('📞 Fallback campaign phone:', campaignData.businessInfo?.phone || 'NOT FOUND');
      console.log('📞 Using phone number:', phoneNumber || 'UNDEFINED/NULL');

      // 🔍 ENHANCED PHONE TRACKING: Log phone consistency across all ad groups
      console.log('🔍 PHONE CONSISTENCY CHECK:');
      if (campaignData.adGroups && Array.isArray(campaignData.adGroups)) {
        campaignData.adGroups.forEach((adGroup: any, index: number) => {
          console.log(`  Ad Group ${index + 1} (${adGroup.name}): Using campaign phone ${phoneNumber}`);
          console.log(`  Final URL: ${adGroup.adCopy?.finalUrl || 'MISSING'}`);
        });
      }
      console.log('🔍 Call extensions will use phone:', phoneNumber);

      // 🔍 VALIDATION: Confirm we're using the correct phone number
      if (freshOnboardingData?.phone && campaignData.businessInfo?.phone &&
          freshOnboardingData.phone !== campaignData.businessInfo.phone) {
        console.warn('⚠️ Phone mismatch detected - using fresh onboarding data');
        console.warn('  Onboarding phone (using):', freshOnboardingData.phone);
        console.warn('  Campaign phone (stale):', campaignData.businessInfo.phone);
      }

      if (phoneNumber) {
        console.log('📞 Creating call extensions with phone:', phoneNumber);

        try {
          // First create the call asset
          const callAssetRequestBody = {
            operations: [{
              create: {
                type: 'CALL',
                callAsset: {
                  phoneNumber: phoneNumber,
                  countryCode: 'GB',
                  callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
                }
              }
            }]
          };

          // ❌ PROBLEM: Creates new call asset every time without checking existing ones
          const assetResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/assets:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(callAssetRequestBody)
          });

          if (!assetResponse.ok) {
            const assetError = await assetResponse.text();
            console.error(`❌ Call asset creation failed:`, assetError);
            results.errors.push(`Call asset creation failed: ${assetError.substring(0, 100)}`);
            return;
          }

          const assetData = await assetResponse.json();
          const assetResourceName = assetData.results[0].resourceName;
          console.log('✅ Call asset created:', assetResourceName);
          console.log('🔍 CALL EXTENSION DEBUG: Phone used in API call:', phoneNumber);

          // Then link the asset to the campaign
          const campaignAssetRequestBody = {
            operations: [{
              create: {
                asset: assetResourceName,
                campaign: campaignResourceName,
                fieldType: 'CALL'
              }
            }]
          };

          // ❌ PROBLEM: Links new asset to campaign without removing old ones
          const extensionResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignAssets:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignAssetRequestBody)
          });

          if (!extensionResponse.ok) {
            const extensionError = await extensionResponse.text();
            console.error(`❌ Campaign asset linking failed with status ${extensionResponse.status}:`, extensionError);

            // Parse and log detailed Google Ads API error
            try {
              const errorDetails = JSON.parse(extensionError);
              console.error(`🔍 Google Ads API Error Details for campaign asset linking:`, {
                status: extensionResponse.status,
                statusText: extensionResponse.statusText,
                error: errorDetails.error,
                details: errorDetails.details || errorDetails.message || errorDetails
              });
              results.errors.push(`Campaign asset linking failed: ${errorDetails.error?.message || errorDetails.message || 'API Error'}`);
            } catch (parseError) {
              console.error(`🔍 Raw Google Ads API Error for campaign asset linking:`, extensionError);
              results.errors.push(`Campaign asset linking failed: ${extensionError.substring(0, 100)}`);
            }
          } else {
            const extensionData = await extensionResponse.json();
            results.extensionsCreated++;
            console.log('✅ Call extension linked to campaign successfully:', extensionData.results?.[0]?.resourceName || 'Success');
          }

        } catch (extensionError) {
          console.error('❌ Error creating call extension:', extensionError);
          results.errors.push(`Call extension error: ${extensionError}`);
        }
      }
```

**Analysis**: 
- Creates modern call assets using `assets:mutate` API
- Links assets to campaign using `campaignAssets:mutate` API
- **Problem**: No cleanup of existing call extensions/assets before creating new ones
- **Problem**: Creates new call asset every time without checking if one already exists

---

### 7.2 Secondary Issue - Legacy Call Extension Creation Method

**File**: `convex/googleAdsCampaigns.ts:926-995`

```926:995:convex/googleAdsCampaigns.ts
// Helper function to create ad extensions
async function createAdExtensions(
  campaignData: any,
  customerId: string,
  accessToken: string,
  campaignResourceName: string,
  ctx: any
) {
  try {
    // Create Call Extension (Phone Number)
    // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
    const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
    const phoneNumber = freshOnboardingData?.phone;

    if (phoneNumber) {
      // ❌ PROBLEM: Calls createCallExtension which creates LEGACY call extensions
      await createCallExtension(phoneNumber, customerId, accessToken, campaignResourceName);
    }

    // Create Sitelink Extensions (if available)
    if (campaignData.sitelinkExtensions && campaignData.sitelinkExtensions.length > 0) {
      await createSitelinkExtensions(campaignData.sitelinkExtensions, customerId, accessToken, campaignResourceName);
    }

  } catch (error) {
    console.error('❌ Error creating ad extensions:', error);
  }
}

// Helper function to create call extension
async function createCallExtension(
  phoneNumber: string,
  customerId: string,
  accessToken: string,
  campaignResourceName: string
) {
  console.log('🔍 CALL EXTENSION DEBUG: Phone used in createCallExtension:', phoneNumber);
  // ❌ PROBLEM: Creates LEGACY call extension format (different from call assets above)
  const callExtensionResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignExtensionSettings:mutate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [{
        create: {
          campaign: campaignResourceName,
          extensionType: 'CALL',
          extensionSetting: {
            extensions: [{
              callExtension: {
                phoneNumber: phoneNumber,
                countryCode: 'GB',
                callOnly: false
              }
            }]
          }
        }
      }]
    })
  });

  if (callExtensionResponse.ok) {
    console.log('✅ LEGACY Call extension created with phone:', phoneNumber);
    console.log('🔍 LEGACY METHOD EXECUTED - This is creating call extensions');
  } else {
    const error = await callExtensionResponse.text();
    console.error('❌ Call extension creation failed:', error);
  }
}
```

**Analysis**:
- Creates legacy call extensions using `campaignExtensionSettings:mutate` API
- Uses different API endpoint and format than modern call assets
- **Problem**: This creates ANOTHER call extension using fresh onboarding data
- **Problem**: Creates LEGACY call extension format (different from call assets above)

---

### 7.3 The Core Problem - Two Different Call Extension Methods Called

**File**: `convex/googleAdsCampaigns.ts:447-656`

```447:656:convex/googleAdsCampaigns.ts
      // Step 10: Create call extensions
      // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
      const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      const phoneNumber = freshOnboardingData?.phone;
      // ... creates call asset + campaign asset (MODERN METHOD)

      // ... (ad group creation code) ...

      // Step 8: Create Ad Extensions
      try {
        console.log('📱 Creating ad extensions...');
        // ❌ PROBLEM: Both methods are called in sequence, creating duplicate call extensions
        await createAdExtensions(campaignData, customerId, accessToken, campaignResourceName, ctx);
        // ... calls createCallExtension which creates LEGACY extension
        console.log('✅ Ad extensions completed');
      } catch (error) {
        console.error('❌ Ad extensions failed:', error instanceof Error ? error.message : String(error));
        // Continue - extensions are not critical
      }
```

**Analysis**: 
- **Method 1 (Modern)**: Lines 447-569 create call assets using `assets:mutate` + `campaignAssets:mutate`
- **Method 2 (Legacy)**: Lines 652-656 call `createAdExtensions()` which creates legacy call extensions using `campaignExtensionSettings:mutate`
- **Result**: Both methods execute in sequence, creating duplicate call extensions

---

### 7.4 Frontend: Push to Google Ads Button Handler

**File**: `app/components/campaign/CampaignHeaderControls.tsx`

```60:140:app/components/campaign/CampaignHeaderControls.tsx
  const handlePushToGoogleAds = async () => {
    console.log('🚀 Push to Google Ads button clicked');

    if (!campaign) {
      console.error('❌ No campaign available to push');
      toast.error("No campaign to push");
      return;
    }

    if (!isGoogleAdsConnected) {
      console.error('❌ Google Ads not connected');
      toast.error("Please connect your Google Ads account first");
      return;
    }

    // Check for placeholder URLs and warn user
    const placeholderUrls = ["https://example.com", "https://yoursite.com", "www.example.com"];
    const hasPlaceholders = campaign.adGroups?.some((adGroup: any) =>
      !adGroup.adCopy?.finalUrl || placeholderUrls.includes(adGroup.adCopy.finalUrl)
    );

    if (hasPlaceholders) {
      toast.warning("⚠️ No website URL detected", {
        description: "Your ads will show 'example.com' which may waste your budget. Consider adding a website URL in your profile or using call-only ads.",
        duration: 10000,
      });
    }

    console.log('🎯 Starting campaign push process...', {
      campaignId: campaign._id,
      campaignName: campaign.campaignName,
      adGroups: campaign.adGroups?.length || 0
    });

    setIsProcessing(true);
    try {
      console.log('📤 Calling pushToGoogleAds action...');

      // Use Convex action to push campaign to Google Ads
      const result = await pushToGoogleAds({
        campaignId: campaign._id,
        pushOptions: {
          createAsDraft: true,
          testMode: false, // FORCE REAL API USAGE
        },
      });

      console.log('📥 Received result from pushToGoogleAds:', result);

      if (result.success) {
        console.log('✅ Campaign push successful!', result);

        const description = result.details ||
          `Campaign ID: ${result.googleCampaignId} | Budget: £${result.budget}/day | Status: ${result.status}`;

        toast.success(`🎯 ${result.message}`, {
          description: description,
          duration: 8000,
        });

        // 🔄 Convex real-time queries will automatically update the UI
        // No manual refresh needed - data syncs automatically
        console.log('✅ Campaign push complete - Convex will sync UI automatically');
      } else {
        console.error('❌ Campaign push failed - success=false');
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      console.error('❌ Campaign push error occurred:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');

      toast.error(`❌ Failed to push to Google Ads`, {
        description: error instanceof Error ? error.message : 'Check API connection and try again',
        duration: 8000,
      });
    } finally {
      console.log('🔄 Campaign push process completed, resetting UI state');
      setIsProcessing(false);
    }
  };
```

**Analysis**: Frontend handler calls `pushToGoogleAds` action with campaign ID. No phone number validation happens here.

---

### 7.5 Backend: Push to Google Ads Action (Pre-validation)

**File**: `convex/campaigns.ts`

```444:535:convex/campaigns.ts
// Push campaign to Google Ads
export const pushToGoogleAds = action({
  args: {
    campaignId: v.string(),
    pushOptions: v.optional(v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    googleCampaignId: string;
    resourceName: string;
    budget: number;
    status: string;
    details?: string;
    createdResources?: {
      adGroups: number;
      ads: number;
      extensions: number;
    };
  }> => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Get the campaign data using a query
      const campaign: any = await ctx.runQuery(api.campaigns.getCampaignById, {
        campaignId: args.campaignId
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // 🔍 PRE-PUSH VALIDATION: Verify data consistency
      const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      if (!onboardingData) {
        throw new Error("Cannot push campaign: onboarding data not found");
      }

      // Validate phone number consistency
      const onboardingPhone = onboardingData.phone;
      const campaignPhone = campaign.businessInfo?.phone;

      console.log('🔍 PRE-PUSH VALIDATION:');
      console.log('📱 Onboarding phone:', onboardingPhone);
      console.log('📱 Campaign phone:', campaignPhone);

      if (!onboardingPhone) {
        throw new Error("Missing phone number in onboarding data");
      }

      // 🔒 CRITICAL: Block the specific contaminated phone number
      const contaminatedPhoneRegex = /077\s?684\s?7429|0776847429/i;
      if (campaignPhone && contaminatedPhoneRegex.test(campaignPhone)) {
        console.error('🚨 CONTAMINATED PHONE NUMBER DETECTED - BLOCKING PUSH:');
        console.error('  Found contaminated number:', campaignPhone);
        console.error('  Expected correct number:', onboardingPhone);
        throw new Error(`Contaminated phone number detected in campaign. Found '${campaignPhone}' but expected '${onboardingPhone}'. Please regenerate the campaign.`);
      }

      // Check for any phone number mismatch
      if (onboardingPhone !== campaignPhone) {
        console.error('❌ PHONE MISMATCH DETECTED - BLOCKING PUSH:');
        console.error('  Expected (from onboarding):', onboardingPhone);
        console.error('  Found (in campaign):', campaignPhone);
        console.error('  This would cause inconsistent phone numbers in Google Ads');
        throw new Error(`Phone number mismatch detected. Campaign has '${campaignPhone}' but onboarding shows '${onboardingPhone}'. Please regenerate the campaign to sync data.`);
      }

      // Validate callExtensions don't contain contaminated numbers
      if (campaign.callExtensions && Array.isArray(campaign.callExtensions)) {
        for (const ext of campaign.callExtensions) {
          const extPhone = typeof ext === 'string' ? ext : ext?.phoneNumber;
          if (extPhone && contaminatedPhoneRegex.test(extPhone)) {
            console.error('🚨 CONTAMINATED PHONE IN CALL EXTENSIONS - BLOCKING PUSH:');
            console.error('  Found contaminated number:', extPhone);
            throw new Error(`Contaminated phone number detected in call extensions: '${extPhone}'. Please regenerate the campaign.`);
          }
        }
      }

      console.log('✅ Phone validation passed - numbers match:', onboardingPhone);
```

**Analysis**: Pre-push validation checks phone number consistency between onboarding and campaign data. If mismatch detected, push is blocked.

---

### 7.6 Database Schema

**File**: `convex/schema.ts`

```89:127:convex/schema.ts
  campaigns: defineTable({
    userId: v.string(),
    campaignName: v.string(),
    dailyBudget: v.number(),
    targetLocation: v.string(),
    businessInfo: v.object({
      businessName: v.string(),
      phone: v.string(),
      serviceArea: v.string(),
    }),
    adGroups: v.array(v.object({
      name: v.string(),
      keywords: v.array(v.string()),
      adCopy: v.object({
        headlines: v.array(v.string()),
        descriptions: v.array(v.string()),
        finalUrl: v.string(),
      }),
    })),
    callExtensions: v.array(v.union(
      v.string(),
      v.object({
        phoneNumber: v.string(),
        callHours: v.optional(v.string()),
      })
    )),
    complianceNotes: v.array(v.string()),
    status: v.string(), // "ready" | "active" | "paused"
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    // Regeneration tracking fields
    regenerationCount: v.optional(v.number()),
    lastRegeneration: v.optional(v.number()),
    monthlyRegenCount: v.optional(v.number()),
    monthlyRegenResetDate: v.optional(v.number()),
    // Google Ads integration
    googleCampaignId: v.optional(v.string()),
  })
    .index("userId", ["userId"]),
```

**Analysis**: Campaigns table stores phone number in `businessInfo.phone` and `callExtensions` array. Phone number can become stale if campaign is regenerated but not refreshed from onboarding.

---

### 7.7 Onboarding Data Schema

**File**: `convex/schema.ts`

```51:88:convex/schema.ts
  onboardingData: defineTable({
    userId: v.string(),
    tradeType: v.optional(v.string()), // "plumbing" | "electrical" | "both"
    businessName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()), // Optional website URL
    serviceArea: v.optional(v.object({
      city: v.string(),
      postcode: v.optional(v.string()),
      radius: v.number(), // in miles
    })),
    serviceOfferings: v.optional(v.array(v.string())),
    availability: v.optional(v.object({
      workingHours: v.string(),
      emergencyCallouts: v.boolean(),
      weekendWork: v.boolean(),
    })),
    acquisitionGoals: v.optional(v.object({
      monthlyLeads: v.number(),
      averageJobValue: v.number(),
      monthlyBudget: v.number(),
    })),
    complianceData: v.optional(v.object({
      businessRegistration: v.boolean(),
      requiredCertifications: v.boolean(),
      publicLiabilityInsurance: v.boolean(),
      businessEmail: v.string(),
      businessNumber: v.string(),
      termsAccepted: v.boolean(),
      complianceUnderstood: v.boolean(),
      certificationWarning: v.boolean(),
    })),
    completedAt: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
  })
    .index("userId", ["userId"]),
```

**Analysis**: Onboarding data stores the source of truth phone number in `phone` field.

---

## 8. Environment

- **Environment**: Production
- **Deployment**: Convex Cloud (ownDev deployment)
- **Convex Dashboard**: https://dashboard.convex.dev/d/gregarious-squirrel-956
- **Convex URL**: https://gregarious-squirrel-956.convex.cloud

---

## 9. Convex Data

### 9.1 Onboarding Data

**Command**: `bunx convex data --table onboardingData --order desc --limit 1`

**Actual Data**:
```json
{
  "_id": "jh786wh92y5gen01x40nz400vh7vhej2",
  "_creationTime": 1763252669523.2139,
  "userId": "user_35XMo1rGQ24z0lqeuVnAp5l2phd",
  "phone": "07563826777",
  "businessName": "Plumbing Expert",
  "contactName": "Adam Khan",
  "email": "plumbingexpert@gmail.com",
  "websiteUrl": "https://plumbingexpert.com",
  "tradeType": "plumbing",
  "serviceArea": {
    "city": "London",
    "postcode": "L1 8RR",
    "radius": 10
  },
  "serviceOfferings": [
    "Boiler Repair",
    "Leak Repair",
    "Central Heating"
  ],
  "availability": {
    "workingHours": "Mon-Fri 10am - 2pm",
    "emergencyCallouts": false,
    "weekendWork": false
  },
  "acquisitionGoals": {
    "monthlyLeads": 3,
    "averageJobValue": 200,
    "monthlyBudget": 100
  },
  "complianceData": {
    "businessRegistration": true,
    "requiredCertifications": true,
    "publicLiabilityInsurance": true,
    "businessEmail": "info@plumbingexpert.com",
    "businessNumber": "555",
    "termsAccepted": true,
    "complianceUnderstood": true,
    "certificationWarning": true
  },
  "isComplete": true,
  "completedAt": 1763252826849
}
```

**Analysis**: 
- ✅ **Correct phone number**: `07563826777` (source of truth)
- ✅ Onboarding is complete
- ✅ All required data is present

---

### 9.2 Campaign Data

**Command**: `bunx convex data --table campaigns --order desc --limit 1`

**Actual Data**:
```json
{
  "_id": "jn783gn80jcf56e5kbcc4svv857vg61k",
  "_creationTime": 1763252846014.368,
  "userId": "user_35XMo1rGQ24z0lqeuVnAp5l2phd",
  "campaignName": "Plumbing Expert Autumn Campaign",
  "dailyBudget": 3,
  "targetLocation": "London, L1 8RR",
  "businessInfo": {
    "businessName": "Plumbing Expert",
    "phone": "07563826777",
    "serviceArea": "London, L1 8RR"
  },
  "callExtensions": ["07563826777"],
  "adGroups": [
    {
      "name": "Emergency Plumbing Services",
      "keywords": ["emergency plumber London", "24/7 plumber near me", ...],
      "adCopy": {
        "headlines": ["Immediate Plumber Assistance", "24/7 Plumbing Support", "Urgent Leak Solutions"],
        "descriptions": ["Gas Safe Registered plumbers ready to assist. Call Now for rapid response.", ...],
        "finalUrl": "https://plumbingexpert.com"
      }
    },
    // ... 3 more ad groups
  ],
  "complianceNotes": [...],
  "status": "pushed_draft",
  "googleCampaignId": "23275324471",
  "createdAt": 1763318669695,
  "updatedAt": 1763318685017,
  "regenerationCount": 21,
  "lastRegeneration": 1763318669769,
  "monthlyRegenCount": 21
}
```

**Analysis**:
- ✅ **Phone number matches onboarding**: `07563826777` ✅
- ✅ **Call extensions array**: Contains correct phone `["07563826777"]`
- ✅ **Campaign has been pushed**: `status: "pushed_draft"`, `googleCampaignId: "23275324471"`
- ✅ **Campaign has 4 ad groups**: As expected
- ⚠️ **Campaign regenerated 21 times**: May have accumulated duplicate call extensions in Google Ads

---

### 9.3 Google Ads Tokens

**Command**: `bunx convex data --table googleAdsTokens --order desc --limit 1`

**Actual Data**:
```json
{
  "_id": "js77jt2wjkmqzk0zyprp8gv9097vhhw4",
  "_creationTime": 1763253061328.594,
  "userId": "user_35XMo1rGQ24z0lqeuVnAp5l2phd",
  "accessToken": "ya29.a0ATi6K2sftjVkv0Xy7Uc1cVDJX81Ee3flSXZ1XP6pUCmnmGLdfqrApp6pD4j4x910KvXPcbFoVxw6MhGT5x2lJJSv6vCukGPcm5x-lbBaipvjz0IB6r5qy69dgZx9O9xHMKy3gF1VPSayjgQdBkMLvNX3xcvkXYbxzuq6bg8dhBQKnpOh1VjN9FJPNEhXHxTvgx74RXYaCgYKARQSARASFQHGX2Mi5_ad53-zs36P84PBZpgq_Q0206",
  "refreshToken": "1//055fBIPizyaG5CgYIARAAGAUSNwF-L9Irw9NV8WkH8xbCyJVcbkvl5WEsGnLLT11B8lW7YLIIteG68w2UPyKf2yYcZyoq4p6wcx4",
  "expiresAt": 1763321515436,
  "scope": "https://www.googleapis.com/auth/adwords",
  "isActive": true,
  "createdAt": 1763317916672
}
```

**Analysis**:
- ✅ **Google Ads is connected**: `isActive: true`
- ✅ **Access token present**: Valid OAuth token
- ✅ **Token has required scope**: `https://www.googleapis.com/auth/adwords`
- ⚠️ **Token expires**: `expiresAt: 1763321515436` (may need refresh if expired)

---

### 9.4 Data Consistency Check

**Phone Number Consistency**:
- ✅ Onboarding phone: `07563826777`
- ✅ Campaign `businessInfo.phone`: `07563826777`
- ✅ Campaign `callExtensions`: `["07563826777"]`
- ✅ **All phone numbers match** - No data inconsistency in database

**Conclusion**: The database state shows consistent phone numbers. The issue is likely in Google Ads where multiple call extensions have been created due to the duplicate creation methods, causing the alternating behavior in preview.

---

## 10. Reproduction Steps

1. User completes onboarding and adds phone number (e.g., `07563826777`)
2. Campaign is created from onboarding information
3. User connects their Google Ads account
4. User clicks "Push to Google Ads" button on the Campaigns page
5. Campaign is pushed to Google Ads successfully
6. User navigates to Google Ads to view the pushed campaign
7. User clicks on preview ad from any of the 4 ad groups
8. **First click**: Incorrect phone number is displayed (e.g., `077 684 7429`)
9. **Second click**: Correct phone number is displayed (e.g., `07563826777`)
10. **Third click**: Incorrect phone number is displayed again
11. This alternating behavior occurs consistently across all 4 ad groups

---

## 11. Root Cause Analysis

### 🚨 CRITICAL ROOT CAUSE: Duplicate Call Extension Creation

The code creates **TWO different types of call extensions** in sequence, resulting in multiple call extensions per campaign:

1. **Modern Call Assets** (Lines 447-569):
   - Creates call assets using `assets:mutate` API
   - Links assets to campaign using `campaignAssets:mutate` API
   - Creates new call asset every time without checking existing ones
   - Links new asset without removing old ones

2. **Legacy Call Extensions** (Lines 652-656 → 926-995):
   - Calls `createAdExtensions()` function
   - Creates legacy call extensions using `campaignExtensionSettings:mutate` API
   - Uses different API endpoint and format than modern call assets
   - Also creates new extension without checking existing ones

### Why This Causes Alternating Phone Numbers

1. **First push**: Creates 2 call extensions (modern + legacy)
2. **Second push**: Creates 2 MORE call extensions (4 total)
3. **Third push**: Creates 2 MORE call extensions (6 total)
4. **Google Ads Preview**: Randomly cycles through multiple call extensions
5. **Result**: Phone numbers alternate between correct (fresh onboarding) and incorrect (stale campaign data or previous versions)

### Key Code Flow

1. `pushToGoogleAds` validates phone number consistency ✅
2. `createGoogleAdsCampaign` creates modern call asset with fresh onboarding phone ✅
3. Modern call asset is linked to campaign ✅
4. **Then**: `createAdExtensions()` is called, creating legacy call extension ❌
5. **Missing**: No cleanup of existing call extensions/assets before creating new ones ❌
6. **Missing**: No check for existing call extensions with different phone numbers ❌
7. **Missing**: Both modern and legacy methods execute, creating duplicates ❌

### The Exact Issue

- **Lines 447-569**: Create modern call assets
- **Lines 652-656**: Call `createAdExtensions()` which creates additional legacy call extensions
- **Result**: Multiple phone numbers per campaign due to duplicate extension creation

---

## 12. Potential Solutions

### Solution 1: Remove Legacy Call Extension Method (RECOMMENDED)

Remove the call to `createAdExtensions()` or remove the call extension creation from within `createAdExtensions()`. Keep only the modern call asset method.

**Implementation**:
- Comment out or remove line 654: `await createAdExtensions(...)`
- OR modify `createAdExtensions()` to skip call extension creation
- Keep only the modern call asset creation (lines 447-569)

### Solution 2: Clean Up Existing Call Extensions Before Creating New Ones

Before creating a new call extension, query Google Ads API for existing call extensions on the campaign and remove them.

**Implementation**:
- Query `campaignAssets` for existing CALL fieldType extensions
- Query `campaignExtensionSettings` for existing CALL extensions
- Remove all existing call extensions before creating new ones

### Solution 3: Check for Existing Call Assets Before Creating

Before creating a new call asset, check if a call asset with the correct phone number already exists and reuse it instead of creating a new one.

**Implementation**:
- Query `assets` for existing CALL type assets with matching phone number
- If found, reuse the existing asset resource name
- If not found, create new asset

### Solution 4: Update Existing Call Extensions Instead of Creating New Ones

If a call extension already exists on the campaign, update it with the new phone number instead of creating a duplicate.

**Implementation**:
- Check for existing call extensions on the campaign
- If exists, use `UPDATE` operation instead of `CREATE`
- If not exists, create new extension

### Solution 5: Add Phone Number to Campaign Metadata

Store the phone number used in Google Ads in the campaign's metadata to track which phone number was pushed.

**Implementation**:
- Add `googleAdsPhoneNumber` field to campaigns schema
- Store phone number when pushing to Google Ads
- Use this to validate consistency on subsequent pushes

---

## 13. Debugging Commands

### Check Convex Logs

```bash
bunx convex logs --limit 100
```

Look for:
- `📞 Fresh onboarding phone:` logs
- `🔍 CALL EXTENSION DEBUG:` logs
- `✅ Call extension linked to campaign successfully:` logs
- `✅ LEGACY Call extension created with phone:` logs (indicates duplicate creation)

### Check Google Ads API Responses

In Convex logs, check the response from:
- `assets:mutate` (modern call asset creation)
- `campaignAssets:mutate` (modern call extension linking)
- `campaignExtensionSettings:mutate` (legacy call extension creation)

### Query Google Ads for Existing Call Extensions

Use Google Ads API to query existing call extensions on the campaign:

```bash
# Query campaign assets (modern method)
GET https://googleads.googleapis.com/v22/customers/{customerId}/campaignAssets
# Filter: fieldType = 'CALL'

# Query campaign extension settings (legacy method)
GET https://googleads.googleapis.com/v22/customers/{customerId}/campaignExtensionSettings
# Filter: extensionType = 'CALL'
```

### Count Call Extensions

```bash
# Count how many call extensions exist on a campaign
# This will show if duplicates are accumulating
```

---

## 14. Next Steps

1. **Immediate**: Check Convex logs for both modern and legacy call extension creation logs
2. **Investigate**: Query Google Ads API to see if multiple call extensions exist on the campaign
3. **Fix**: Remove legacy call extension creation method (Solution 1)
4. **Enhance**: Add cleanup of existing call extensions before creating new ones (Solution 2)
5. **Test**: Push a campaign and verify only one call extension with correct phone number exists
6. **Verify**: Check Google Ads preview to confirm phone number is consistent

---

## 15. Related Files

- `convex/campaigns.ts` - Campaign generation and push logic
- `convex/googleAdsCampaigns.ts` - Google Ads API integration (contains both modern and legacy methods)
- `convex/onboarding.ts` - Onboarding data management
- `app/components/campaign/CampaignHeaderControls.tsx` - Frontend push button
- `convex/schema.ts` - Database schema definitions

---

## 16. Notes

- The alternating behavior suggests Google Ads is cycling through multiple call extensions/assets
- **Root cause identified**: Two different call extension creation methods execute in sequence
- Modern method (call assets) and legacy method (campaign extension settings) both create extensions
- Each push creates 2 call extensions (one modern, one legacy)
- Multiple pushes result in accumulating duplicate extensions
- The code correctly uses fresh onboarding data for both methods, but doesn't prevent duplicates
- Pre-push validation prevents pushing campaigns with mismatched phone numbers, but doesn't prevent multiple extensions from accumulating over time
- This issue occurs when campaigns are pushed multiple times (e.g., after regeneration)
- **Recommended fix**: Remove legacy call extension creation method and add cleanup of existing extensions

