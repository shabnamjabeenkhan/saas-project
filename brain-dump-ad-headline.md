# Brain Dump - Ad Headline Issues and Poor Ads Created

# What you want to build
I want to build a Google ad app for plumbers and electricians. I have nearly completed it. When a user signs up, they must complete onboarding. Based on the onboarding information, a Google Ads campaign will be created. The information from onboarding will be used to create a preview for the ads that will be pushed to Google Ads. I want to build a Google ad app for plumbers and electricians I have nearly completed it. So the 
user with the signup they have to complete on boarding and based on the on boarding information 
Google would be created ,so the information will be used from on boarding to create Preview for 
the ads that would be pushed onto Google ads. In the on boarding form the services will be shown 
the user has to choose which service they do and depending on how much services they choose, So 
will be created for each service. If the user for example chooses boiler repair or emergency 
plumbing then two ads will be created for that campaign. If the user for example chooses 
drainage, emergency plumbing or boiler repair, then three ads will be created for that campaign. 
And if the user just chooses one service, for example leak repair, then one ad will be created 
for the campaign. I want to build a Google ad app for plumbers and electricians. I have nearly completed it. When a user signs up, they must complete onboarding. Based on the onboarding information, a Google Ads 
campaign will be created. The information from onboarding will be used to create a preview for 
the ads that will be pushed to Google Ads.

In the onboarding form, services will be shown and the user has to choose which services they offer. Depending on how many services they choose, ad groups will be created for each service theme. 

**Clarification: One ad group per service theme, with one RSA (Responsive Search Ad) per ad group.**

Examples:
- If the user chooses boiler repair or emergency plumbing, then two ad groups will be created (Repair theme, Emergency theme), each with one RSA.
- If the user chooses drainage, emergency plumbing, and boiler repair, then three ad groups will be created, each with one RSA.
- If the user chooses just one service (e.g., leak repair), then one ad group will be created with one RSA.

1. One ad group per service theme (mandatory)

Create one RSA per service theme (e.g. Repair, Installation, Emergency, Maintenance)

Do not mix intents in one ad
→ Repair ads talk only about repair
→ Installation ads talk only about installation

Why: Google rewards clear intent alignment.

2. Correct headline count

12 headlines minimum, 15 ideal per RSA

Why: Fewer than 12 limits Google’s ability to optimize → lower strength.

3. Headline length (mobile-safe)

Max 24 characters per headline (mobile-safe target), up to 30 characters (Google Ads hard limit)

Why: 24 characters prevents mobile truncation and headline stacking. Google Ads allows up to 30 characters, but shorter headlines perform better on mobile devices.

4. Headline variety (CRITICAL)

Your headlines must cover different meanings, not reword the same thing.

Include ALL of these categories:

Keyword-exact (2–3 max)
Plumber in Birmingham

Service-focused (no location)
Fast Boiler Repairs

Trust / compliance
Gas Safe Registered

Speed / availability
24/7 Emergency Service

CTA
Call Today

Why: Google scores asset diversity very heavily.

5. Location usage rule

City name in no more than 3 headlines

Why: Prevents keyword stuffing and duplicate detection.

6. Pinning rule

Pin only ONE headline

Pin it to Headline 1

Must be keyword-exact

Why: Anchors relevance without harming rotation.

7. Description count

3–4 descriptions

Why: Google needs multiple options to assemble ads.

8. Description uniqueness

Each description must have a different purpose:

Problem + solution
Boiler broken? Our engineers fix most issues fast.

Trust / reassurance
Gas Safe registered. Licensed and insured engineers.

CTA + location
Book today for a free quote. Serving Birmingham.

(Optional 4th: pricing or process)

Why: Repetition lowers strength.

9. Description length

Max 80 characters

Why: Prevents truncation and improves mobile rendering.

10. Sitelinks (REQUIRED)

4–6 sitelinks per ad group

Titles ≤ 25 characters

Matched to the service

Example (Repair):

Emergency Repair

Boiler Diagnostics

Repair Pricing

Contact Plumber

Why: Missing sitelinks alone can block “Excellent”.

11. Keyword–headline alignment

Repair keywords → “repair” in headlines

Installation keywords → “installation” in headlines

Emergency keywords → “emergency” present

Why: Google scores relevance between keywords and assets.

12. No overuse of symbols

Avoid dashes, pipes, emojis

Why: They break mobile layouts and reduce clarity.

13. Extensions beyond sitelinks (recommended)

Call extension (phone number)

Callouts (e.g. No Hidden Fees, Same Day Service)

Why: Improves visibility and CTR (helps strength indirectly).

14. Preview must look clean on mobile

Before submitting, your app should check:

No truncated words

No repeated phrases in the preview

Headlines read naturally when combined

Why: Google evaluates mobile UX first.

15. Minimum “Excellent” formula (summary)

To consistently hit EXCELLENT:

 1 service theme = 1 ad group = 1 RSA
 12 headlines minimum, 15 ideal (short, diverse headlines)
 3–4 unique descriptions
 1 pinned keyword headline
 4–6 sitelinks
 Clear intent alignment

# Edge cases you're thinking about

## Regeneration Rules
- If regeneration fails, it does not count as a regeneration. Only successful regenerations count.
- Users must wait 1 minute between regenerations (either by editing information or clicking regenerate button) to prevent abuse.
- When a user completes onboarding, a campaign is automatically created (this is the initial campaign, not a regeneration).
- After the initial campaign, users must wait 1 minute before regenerating.
- There will be UI feedback to tell the user to wait a minute if they try to regenerate too soon.
- If a user is mid-regeneration when the free trial ends, the regeneration will complete successfully but they cannot push it to Google Ads.

## Headline and Description Quality
- Headlines have a max value of 30 characters in Google Ads (hard limit), but we target 24 characters for mobile safety.
- Headlines and descriptions must make sense and be high quality.
- Edge case: Some cities have long names (e.g., "Stoke-on-Trent", "Birmingham"). If truncation happens, it must be natural and make sense - never truncate mid-word.
- Words must be complete. For example, "London" should never become "Londo", "Birmingham" should never become "Birming".

## Campaign Regeneration Triggers
- When a user edits information in settings and saves, the campaign is automatically regenerated. This counts as 1 regeneration.
- Clicking the "Regenerate Campaign" button also counts as 1 regeneration.
- Both methods require the 1-minute cooldown period. 

# User scenarios
Once the user signs up for the first time, the onboarding form appears. The user has to complete questions (e.g., what trade they choose, contact information, service area, etc.). Then the information from onboarding will be used to create the campaign for Google Ads. The user has to connect their Google Ads account in order to push the campaign. This is already working.
# Potential challenges

# Questions you have

# Anything else relevant

## Monthly Regeneration Reset
- Regenerations reset to 3 every month automatically, regardless of whether the user used all regenerations from the previous month.
- If the user paid, regenerations automatically reset to 3 at the start of each month.
- If the user did not pay, they cannot regenerate and the buttons get disabled.

## Compliance and Certification
- When the user completes onboarding, they must prove they have relevant certificates.
- Ads will be compliant with certification requirements. For example, if an electrical trade person completes onboarding and confirms they have relevant certificates, then the ad will mention Part P certification.

## Settings Edit Flow
- User edits business info in settings
- System auto-generates new campaign based on updated info
- This counts as 1 regeneration
- User sees updated campaign

The goal is to improve ad strength from "Poor" to "Good/Excellent" by ensuring all headlines are high quality, complete, and professional.

---
*Note: After completing your brain dump, use the create-prd command with AmpCode to generate a comprehensive PRD from this content.*
