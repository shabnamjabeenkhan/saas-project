# Bug Context: Ad Not Pushed to Google Ads

## 1. Error Description

### Error Description Analysis

**Current Status:**
- ✅ Campaign Created Successfully
- ✅ Ad Groups Created Successfully (4/4)
- ✅ Keywords Added Successfully
- ✅ Call Extensions Created Successfully (1/1)
- ❌ All Ads Failed (0/4) with "Request contains an invalid argument"

### What "Request contains an invalid argument" means

This is a Google Ads API validation error that occurs when the API request payload contains:
1. Malformed data structure
2. Missing required fields
3. Invalid field values
4. Policy violations
5. Data type mismatches

### The Persistent Nature Suggests

Even after our fixes, there's still something fundamentally wrong with the ad request payload being sent to Google Ads API.

### Most Likely Remaining Issues

1. Missing Required Fields in Ad Creation Request
2. Invalid Content After Sanitization (empty strings, invalid characters)
3. Google Ads Policy Violations (placeholder URLs, invalid content)
4. API Version/Structure Mismatch with Google Ads API v22

---

## 🔍 DEEP SCAN ANALYSIS & PLAN OF ATTACK

### ✅ ROOT CAUSE IDENTIFIED (100% CONFIDENCE)

**ACTUAL ISSUE**: Google Ads Policy Violation - Destination URL Not Working

**Error Details from Convex Logs:**
```
"errorCode": {
  "policyFindingError": "POLICY_FINDING"
},
"message": "The resource has been disapproved since the policy summary includes policy topics of type PROHIBITED.",
"details": {
  "policyFindingDetails": {
    "policyTopicEntries": [{
      "type": "PROHIBITED",
      "evidences": [{
        "destinationNotWorking": {
          "dnsErrorType": "HOSTNAME_NOT_FOUND",
          "expandedUrl": "https://plumbingexperttesting.com/",
          "lastCheckedDateTime": "2025-11-16 20:00:05"
        }
      }],
      "topic": "DESTINATION_NOT_WORKING"
    }]
  }
}
```

**Root Cause**: The final URL `https://plumbingexperttesting.com/` fails DNS resolution (HOSTNAME_NOT_FOUND), causing Google Ads to reject all ads with a policy violation.

**Why "Request contains an invalid argument"**: Google Ads returns this generic error message, but the actual issue is a policy violation, not an API structure problem.

### Code Flow Analysis

**Execution Path:**
1. `pushToGoogleAds` (campaigns.ts:451) → calls
2. `createGoogleAdsCampaign` (googleAdsCampaigns.ts:128) → executes
3. **FIRST PATH (lines 265-596)**: Creates ad groups, keywords, ads, extensions inline
4. **Validation (line 599)**: Checks `results.adsCreated > 0`
5. **If fails (line 611)**: Throws error with `results.errors.join(', ')`
6. **SECOND PATH (lines 631-676)**: Never reached if first path fails

### Critical Finding: DUPLICATE CODE PATHS

**Problem**: The code has TWO separate code paths for creating ads:
- **Path 1 (lines 265-596)**: Inline creation - **THIS IS EXECUTING AND FAILING**
- **Path 2 (lines 631-676)**: Calls `createAdGroupsWithAdsAndKeywords()` - Never reached

**Evidence**: Error message format matches line 457 in Path 1

### Current Request Structure (Path 1 - Lines 408-425)

```json
{
  "operations": [{
    "create": {
      "adGroup": "customers/XXX/adGroups/YYY",
      "status": "ENABLED",
      "ad": {
        "type": "RESPONSIVE_SEARCH_AD",  // ✅ Present
        "finalUrls": ["https://example.com"],  // ✅ At ad level
        "responsiveSearchAd": {
          "headlines": [
            {"text": "..."}  // Max 30 chars
          ],
          "descriptions": [
            {"text": "..."}  // Max 90 chars
          ]
        }
      }
    }
  }]
}
```

### ✅ ROOT CAUSE CONFIRMED: Policy Violation - Destination URL Not Working

**Confidence**: 100% - Confirmed from Convex logs

**Actual Issue**: 
- URL `https://plumbingexperttesting.com/` fails DNS resolution
- Google Ads policy prohibits ads pointing to non-working destinations
- Error code: `POLICY_FINDING` with topic `DESTINATION_NOT_WORKING`
- DNS error: `HOSTNAME_NOT_FOUND`

**Why Generic Error Message**: 
- Google Ads returns "Request contains an invalid argument" for policy violations
- The actual error details are in `policyFindingDetails` nested in the error response
- Our error parsing wasn't extracting the policy violation details

### Plan of Attack

#### Phase 1: Fix Error Parsing & User Messaging (CRITICAL)
**Confidence**: 100% this will improve debugging

1. **Extract Policy Violation Details**
   - Parse `policyFindingDetails` from error response
   - Extract `policyTopicEntries` to identify specific violations
   - Show user-friendly error messages based on policy type

2. **Enhanced Error Logging**
   - Log full `GoogleAdsFailure` object
   - Extract and log `policyFindingDetails`
   - Show specific policy violation reasons

#### Phase 2: URL Validation (HIGH PRIORITY)
**Confidence**: 100% this will prevent the issue

1. **Pre-Push URL Validation**
   - Validate URLs resolve before creating ads
   - Check DNS resolution for final URLs
   - Warn user if URL is invalid

2. **Handle Placeholder URLs**
   - Detect placeholder URLs (`example.com`, `yoursite.com`)
   - Warn user about placeholder URLs
   - Optionally block campaign push if URL is invalid

#### Phase 3: Better Error Handling (MEDIUM PRIORITY)
**Confidence**: 80% this will improve UX

1. **Policy Violation Handling**
   - Detect policy violations vs API structure errors
   - Provide actionable error messages
   - Suggest fixes (e.g., "Fix URL DNS resolution")

2. **Graceful Degradation**
   - Allow campaign creation even if some ads fail
   - Show which ads failed and why
   - Let user fix issues and retry

### Immediate Next Steps

1. **✅ COMPLETED**: Fix error parsing to extract policy violation details
   - ✅ Created `parseGoogleAdsError()` helper function
   - ✅ Extracts `policyFindingDetails` from error responses
   - ✅ Parses `policyTopicEntries` to identify specific violations
   - ✅ Generates user-friendly error messages
   - ✅ Updated both error handling locations (inline ad creation and `createResponsiveSearchAd`)

2. **✅ COMPLETED**: Add URL validation before ad creation
   - ✅ Created `validateUrl()` helper function to check DNS resolution
   - ✅ Validates URLs using HEAD requests with timeout
   - ✅ Detects placeholder URLs, DNS errors, connection issues
   - ✅ Added validation in pre-push check (campaigns.ts)
   - ✅ Added validation before ad creation (googleAdsCampaigns.ts - both locations)
   - ✅ Blocks campaign push if invalid URLs detected
   - ✅ Provides user-friendly error messages with specific guidance

3. **🟡 IMPORTANT**: Improve error messages in UI
   - Show specific policy violation reasons to user
   - Provide actionable guidance to fix issues
   - Link to Google Ads policy documentation

4. **🟡 IMPORTANT**: Handle placeholder URLs
   - Detect and warn about placeholder URLs
   - Guide user to use valid URLs or call-only ads

### Code Issues Identified

1. **Duplicate Code Paths**: Lines 265-596 and 631-676 both try to create ads
2. **Error Propagation**: Line 611 throws error if `adsCreated === 0`, preventing second path from running
3. **Missing Error Details**: Error parsing might not be capturing full Google Ads API error structure

### Recommended Fixes

1. **Remove Duplicate Code**: Keep only one code path (prefer Path 1 as it's more complete)
2. **Enhance Error Logging**: Parse full Google Ads API error response to identify specific field
3. **Add Request Validation**: Validate request structure before sending to API
4. **Add Test Mode**: Create minimal test payload to verify API structure

---

## 2. User Journey

### Step-by-step what happened leading up to the error

**Step 1: User Initiates Campaign Generation**
- User clicks "Regenerate Campaign" button
- System validates onboarding completion
- AI generates campaign with 4 ad groups using user's business data

**Step 2: Campaign Generation Results**

```
🧹 Starting comprehensive phone number sanitization...
✅ Sanitization complete - all phone numbers removed from ad text and contaminated fields cleared
🔍 FINAL CAMPAIGN DATA VALIDATION:
📱 Phone in businessInfo: 07563826777
📱 Phone in callExtensions: 07563826777
✅ Campaign data integrity validation passed
Status: ✅ Campaign generated successfully with correct phone number
```

**Step 3: User Pushes to Google Ads**
- User clicks "Push to Google Ads" button
- System performs pre-push validation
- Calls Google Ads API to create campaign structure

**Step 4: Google Ads API Execution Sequence**

**Phase 1: Campaign Foundation ✅ SUCCESS**
- ✅ Budget created successfully
- ✅ Campaign created successfully
- ✅ Ad Groups created successfully (4/4)
- ✅ Keywords added successfully
- ✅ Call Extensions created successfully (1/1)

**Phase 2: Ad Creation ❌ COMPLETE FAILURE**
- ❌ Ad creation for "Emergency Plumbing Solutions" failed: Request contains an invalid argument
- ❌ Ad creation for "Boiler Installation & Maintenance" failed: Request contains an invalid argument
- ❌ Ad creation for "Leak Repair Assistance" failed: Request contains an invalid argument
- ❌ Ad creation for "Central Heating System Checks" failed: Request contains an invalid argument

**Step 5: Error Response to User**

```
❌ Failed to push to Google Ads: Incomplete campaign creation: Ad creation for all 4 groups failed: Request contains an invalid argument.
Partial failure: Campaign: ✅ | Ad Groups: 4 | Ads: 0 | Extensions: 1
```

**Current State:**
- In Google Ads: Campaign shell exists with ad groups, keywords, and call extensions
- Missing: All actual ads (0 ads created)
- User Experience: Error message shown, campaign appears "broken"
- Business Impact: Campaign cannot run without ads - no traffic, no leads

**Pattern Analysis:**
- 100% consistent failure - All 4 ad groups fail identically
- Specific error - "Request contains an invalid argument" (not permissions, not API limits)
- Partial success - Everything except ads works perfectly
- Timing - Error occurs specifically during individual ad creation API calls

**User Frustration Points:**
1. Inconsistent messaging - Validation shows success but push fails
2. Partial campaign - Creates unusable campaign structure in Google Ads
3. No clear actionable feedback - Generic API error doesn't guide user
4. Repeated failures - Same error persists across attempts

The user journey breaks at the final critical step where actual advertisements should be created, leaving them with a non-functional campaign despite apparent success messages.

---

## 3. Jam.dev Replay

**Replay URL:** https://jam.dev/c/fcc835bb-5fc6-4235-b826-4141e01dd1a4

---

## 4. Screenshots

*Screenshots were mentioned but not provided. Please add visual representations of the error when available.*

---

## 5. Server-side Logs

*Server-side logs were mentioned but not provided. Please add backend errors, database queries, and API responses when available.*

**CRITICAL**: Check Convex logs for:
- `📋 Ad request body for [adGroup.name]:` - Shows exact payload being sent
- `🔍 Google Ads API Error Details` - Shows detailed error response
- `❌ Ad creation for [name] failed` - Shows error message

---

## 6. Client-side Logs

*Client-side logs were mentioned but not provided. Please add browser console errors and warnings when available.*

---

## 7. Network Tab

*Network tab information was mentioned but not provided. Please add failed requests, response payloads, and status codes when available.*

---

## 8. Code Snippets

### Primary Error Location - Ad Creation API Call (Path 1)

**File:** `convex/googleAdsCampaigns.ts:408-466`

```408:466:convex/googleAdsCampaigns.ts
          adOperations.push({
            create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              ad: {
                type: 'RESPONSIVE_SEARCH_AD',
                finalUrls: [finalUrl],
                responsiveSearchAd: {
                  headlines: headlines.map((headline: string) => ({
                    text: headline.substring(0, 30) // Ensure max 30 chars per headline
                  })),
                  descriptions: descriptions.map((description: string) => ({
                    text: description.substring(0, 90) // Ensure max 90 chars per description
                  }))
                }
              }
            }
          });

          const adRequestBody = {
            operations: adOperations
          };

          console.log(`📋 Ad request body for ${adGroup.name}:`, JSON.stringify(adRequestBody, null, 2));

          const adResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupAds:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adRequestBody)
          });

          if (!adResponse.ok) {
            const adError = await adResponse.text();
            console.error(`❌ Ad creation for ${adGroup.name} failed with status ${adResponse.status}:`, adError);

            // Parse and log detailed Google Ads API error
            try {
              const errorDetails = JSON.parse(adError);
              console.error(`🔍 Google Ads API Error Details for ${adGroup.name}:`, {
                status: adResponse.status,
                statusText: adResponse.statusText,
                error: errorDetails.error,
                details: errorDetails.details || errorDetails.message || errorDetails
              });
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${errorDetails.error?.message || errorDetails.message || 'API Error'}`);
            } catch (parseError) {
              console.error(`🔍 Raw Google Ads API Error for ${adGroup.name}:`, adError);
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${adError.substring(0, 100)}`);
            }
          } else {
            const adData = await adResponse.json();
            results.adsCreated++;
            console.log(`✅ Created ad for ${adGroup.name}:`, adData.results?.[0]?.resourceName || 'Success');
          }
```

### Content Validation Section

**File:** `convex/googleAdsCampaigns.ts:363-406`

```363:406:convex/googleAdsCampaigns.ts
          const adOperations = [];
          const rawHeadlines = adGroup.adCopy.headlines?.slice(0, 15) || ['Your Business Name']; // Max 15 headlines
          const rawDescriptions = adGroup.adCopy.descriptions?.slice(0, 4) || ['Quality service you can trust']; // Max 4 descriptions

          // Sanitize all ad content
          const sanitizedHeadlines = rawHeadlines.map(sanitizePhoneNumbers);
          const sanitizedDescriptions = rawDescriptions.map(sanitizePhoneNumbers);

          // Filter out empty/null content and ensure minimum requirements
          const headlines = sanitizedHeadlines
            .filter((h: string) => h && h.trim().length > 0)
            .slice(0, 15);
          
          // Ensure minimum 3 headlines (Google Ads requirement)
          if (headlines.length < 3) {
            headlines.push(...['Quality Service', 'Professional Work', 'Call Today'].slice(0, 3 - headlines.length));
          }

          const descriptions = sanitizedDescriptions
            .filter((d: string) => d && d.trim().length > 0)
            .slice(0, 4);
          
          // Ensure minimum 2 descriptions (Google Ads requirement)
          if (descriptions.length < 2) {
            descriptions.push(...['Reliable professional service', 'Contact us for a quote'].slice(0, 2 - descriptions.length));
          }

          // Validate final URL
          const finalUrl = adGroup.adCopy.finalUrl || 'https://example.com';
          if (!finalUrl || finalUrl.trim().length === 0) {
            throw new Error(`Invalid finalUrl for ad group ${adGroup.name}: cannot be empty`);
          }

          // Log sanitization results
          console.log(`🔒 Sanitized headlines for ${adGroup.name}:`, {
            before: rawHeadlines,
            after: headlines,
            count: headlines.length
          });
          console.log(`🔒 Sanitized descriptions for ${adGroup.name}:`, {
            before: rawDescriptions,
            after: descriptions,
            count: descriptions.length
          });
```

### Error Validation Check

**File:** `convex/googleAdsCampaigns.ts:598-612`

```598:612:convex/googleAdsCampaigns.ts
      // Final validation
      const success = results.campaignCreated && results.adGroupsCreated > 0 && results.adsCreated > 0;

      console.log('📊 Campaign creation summary:', {
        success,
        campaignCreated: results.campaignCreated,
        adGroupsCreated: results.adGroupsCreated,
        adsCreated: results.adsCreated,
        extensionsCreated: results.extensionsCreated,
        errors: results.errors
      });

      if (!success) {
        throw new Error(`Incomplete campaign creation: ${results.errors.join(', ')}`);
      }
```

---

## 9. Environment

**Environment:** Production Mode

---

## 10. Convex Data

*Use `bunx convex data` commands to gather relevant database state. Add findings here.*

**CRITICAL**: Check Convex logs using MCP server:
- `mcp_convex_logs` - Get recent function execution logs
- Look for ad creation request/response logs
- Extract exact error details from Google Ads API

---

## 11. Reproduction Steps

### Prerequisites
- Google Ads account connected with valid OAuth tokens
- Completed onboarding with phone 07563826777
- Development server running (npm run dev)

### Step-by-Step Reproduction

**Step 1: Navigate to Campaign Dashboard**
- URL: `http://localhost:5174/dashboard/campaigns`

**Step 2: Generate Fresh Campaign**
1. Click the "Regenerate Campaign" button (green button with sparkles icon)
2. Wait for completion (~30-60 seconds)
3. Expected Result: "Campaign generated successfully!" toast notification
4. Verify: Campaign preview shows 4 ad groups

**Step 3: Trigger the Error**
1. Click "Push to Google Ads" button (gray button with lightning bolt icon)
2. Wait for API calls to complete (~60-90 seconds)
3. Monitor browser console for detailed logs

**Step 4: Observe Error Pattern**

Watch the console logs progression:

**Phase 1: Success Sequence ✅**
```
✅ Budget created successfully
✅ Campaign created successfully
✅ Ad Groups created successfully (4/4)
✅ Keywords added successfully
✅ Call Extensions created successfully (1/1)
```

**Phase 2: Failure Sequence ❌**
```
❌ Ad creation for "Emergency Plumbing Solutions" failed: Request contains an invalid argument
❌ Ad creation for "Boiler Installation & Maintenance" failed: Request contains an invalid argument
❌ Ad creation for "Leak Repair Assistance" failed: Request contains an invalid argument
❌ Ad creation for "Central Heating System Checks" failed: Request contains an invalid argument
```

**Final Error**
```
❌ Campaign push error occurred: Failed to push to Google Ads: Incomplete campaign creation...
```

**Step 5: Verify Error State**
1. UI Shows: Red error toast with "Failed to push to Google Ads" message
2. Console Shows: "Request contains an invalid argument" for all 4 ad groups
3. Network Tab: Check for 400 status responses to Google Ads API
4. Google Ads Account: Campaign exists but has 0 ads

### Key Debugging Points

**Console Logs to Check:**
- Look for `📝 Creating ads for [adGroup.name]...` logs
- Check `📋 Ad request body for [adGroup.name]:` JSON payload
- Monitor `🔒 Sanitized headlines/descriptions` logs for content validation
- Check `🔍 Google Ads API Error Details` for specific field errors

**Network Tab Investigation:**
- Filter for `googleads.googleapis.com` requests
- Find failed `adGroupAds:mutate` calls (should be 4 failures)
- Check response bodies for detailed Google Ads API errors
- Look for `GoogleAdsFailure` object in error response

**Specific Error Timing:**

The error occurs exactly during individual ad creation calls:
```
POST https://googleads.googleapis.com/v22/customers/${customerId}/adGroupAds:mutate
Response: 400 Bad Request
Body: {"error": {"message": "Request contains an invalid argument"}}
```

### 100% Reproducible Conditions
- ✅ Always fails on ad creation phase
- ✅ Always succeeds on campaign/ad group/keyword/extension creation
- ✅ All 4 ad groups fail with identical error
- ✅ Error message is consistently "Request contains an invalid argument"

### Quick Verification Test

After reproduction, check Google Ads account directly:
- Campaign will exist but show "0 ads"
- Ad groups, keywords, and call extensions will be present
- Campaign status will be "Paused" (as intended)

This reproduction will consistently trigger the ad creation API validation errors we need to debug.

---

## Additional Notes

### Root Cause Analysis

**Primary Issue**: Incorrect Google Ads API v22 payload structure in `createResponsiveSearchAd()` function

**Identified Problems**:
1. ❌ Missing `type: 'RESPONSIVE_SEARCH_AD'` field at the `ad` level (required by API) - **FIXED**
2. ❌ `finalUrls` incorrectly placed inside `responsiveSearchAd` object (should be at `ad` level) - **FIXED**
3. ⚠️ Insufficient content validation - empty strings after sanitization could cause API errors - **FIXED**
4. ⚠️ Limited error logging - API validation errors not fully parsed - **ENHANCED**

### Fix Applied

**File**: `convex/googleAdsCampaigns.ts` - `createResponsiveSearchAd()` function AND inline ad creation (lines 363-466)

**Changes Made**:
1. ✅ Added `type: 'RESPONSIVE_SEARCH_AD'` field at the `ad` level
2. ✅ Moved `finalUrls` from inside `responsiveSearchAd` to the `ad` level
3. ✅ Added content validation to ensure minimum 3 headlines and 2 descriptions
4. ✅ Added filtering to remove empty/null content before API submission
5. ✅ Enhanced error logging to parse and display detailed Google Ads API errors
6. ✅ Added fallback content generation if sanitization removes too much content

**Corrected Payload Structure**:
```json
{
  "operations": [{
    "create": {
      "adGroup": "customers/XXX/adGroups/YYY",
      "status": "ENABLED",
      "ad": {
        "type": "RESPONSIVE_SEARCH_AD",  // ✅ Added
        "finalUrls": ["https://example.com"],  // ✅ Moved to ad level
        "responsiveSearchAd": {
          "headlines": [...],
          "descriptions": [...]
        }
      }
    }
  }]
}
```

### Testing Recommendations

1. **IMMEDIATE**: Check Convex logs for exact request payload and error details
2. Test ad creation with the corrected payload structure
3. Verify all 4 ad groups successfully create ads
4. Check Google Ads dashboard to confirm ads appear
5. Monitor logs for any remaining validation errors
6. Test with various content scenarios (empty, minimal, full content)

### Next Steps for Deep Debugging

1. **Check Convex Logs** (CRITICAL):
   - Use `mcp_convex_logs` to get recent execution logs
   - Look for `📋 Ad request body` logs to see exact payload
   - Look for `🔍 Google Ads API Error Details` to see full error structure

2. **Verify API Documentation**:
   - Check Google Ads API v22 documentation for exact required fields
   - Verify responsive search ad structure matches our implementation
   - Check for any v22-specific requirements

3. **Test with Minimal Payload**:
   - Create test ad with only required fields
   - Gradually add fields to identify problematic field
   - Verify if minimal payload succeeds

4. **Parse Error Details**:
   - Extract `GoogleAdsFailure` object from error response
   - Parse `GoogleAdsError` details to identify specific field
   - Use error location to pinpoint exact issue
