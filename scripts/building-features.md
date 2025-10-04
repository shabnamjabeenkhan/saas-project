# Building Features - Plan, Build, and Review Efficiently

**VIDEO LENGTH**: 5:00
**HOOK**: "Building features without a plan leads to bugs, incomplete work, and wasted time. Let me show you how to build any feature quickly and correctly using spec-driven development."

---

[OPENING - 0:00-0:20]
"Most developers jump straight into coding when they have a feature idea. This leads to:

❌ Incomplete features
❌ Missed edge cases  
❌ Bugs and rework
❌ Wasted time

The key to building features efficiently is spec-driven development with AI assistance. I'm going to show you the complete process."

[THE FEATURE DEVELOPMENT PROCESS - 0:20-4:30]

**Step 1: Plan First (Voice is 2-3x faster!)**

Before any code: Talk through what you want to build.

**Voice Prompt Example:**
```
"I want to add a feature where users can export their time entries 
as a PDF invoice. When they click 'Export Invoice' on the dashboard, 
it should open a modal where they select date range, then generate 
a professional-looking PDF with their logo, client info, line items, 
and total. The PDF should be emailed to them via Resend."
```

**What to cover:**
- User experience description
- Data requirements
- Edge cases and error states
- Success scenarios

**Step 2: Use Spec-Driven Development**

Tools like Samurai Agent help you write detailed specs BEFORE coding.

**What is Spec-Driven Development:**
- Write specification first
- AI generates implementation plan
- Review and approve plan
- AI implements based on spec

**Example Spec:**
```markdown
# Feature: PDF Invoice Export

## User Story
As a freelancer, I want to export my time entries as a professional 
PDF invoice so I can send it to clients for payment.

## Acceptance Criteria
- [ ] "Export Invoice" button on dashboard
- [ ] Modal with date range picker
- [ ] Preview of invoice before export
- [ ] PDF includes company logo, client info, line items
- [ ] Email sent via Resend with PDF attached
- [ ] Loading state while generating
- [ ] Success/error notifications

## Technical Requirements
- Use @react-pdf/renderer for PDF generation
- Store invoice metadata in Convex
- Send email via Resend API
- Handle failures gracefully

## Edge Cases
- No time entries in selected range
- Email delivery failure
- PDF generation timeout
- Invalid date range
```

**Step 3: Remind AI to Use Context7 MCP**

Always get up-to-date library docs:
```
"Before we start, please use Context7 MCP to fetch the latest docs 
for @react-pdf/renderer so you have accurate API information."
```

This ensures accurate APIs, latest best practices, correct installation.

**Step 4: Review the Plan**

Before implementation, review AI's plan:

**Check:**
- ✅ All acceptance criteria covered?
- ✅ Edge cases handled?
- ✅ Performance considerations?
- ✅ Security implications?
- ✅ Testing strategy?

**Ask clarifying questions:**
```
"What happens if the PDF generation fails?"
"How do we handle large date ranges (1000+ entries)?"
"Where should we store the generated PDFs?"
"What if the user's email bounces?"
```

**Step 5: Implement the Feature**

Only after approving the plan:
```
"The plan looks good. Please implement this feature now.
Start with the UI components, then the PDF generation logic,
then the email sending. Show me each step as you go."
```

**Implementation Tips:**
- Work in small increments
- Test each part before moving on
- Ask for explanations if unclear
- Request refactoring if code looks messy

**Step 6: Code Review with CodeRabbit**

CodeRabbit automatically reviews for:
- Bugs and issues
- Best practice violations
- Security vulnerabilities
- Improvement suggestions

**Manual Review Checklist:**
- [ ] Code is readable and well-documented
- [ ] No hardcoded values (use env vars)
- [ ] Error handling in place
- [ ] Loading states for async operations
- [ ] TypeScript types are correct
- [ ] No console.logs left in code

**Step 7: Test the Feature**

**Manual Testing:**
1. Happy path (everything works)
2. Error paths (things break)
3. Edge cases (unusual inputs)
4. Mobile responsiveness
5. Different user roles

**Automated Testing:**
```typescript
// Example test
it('generates PDF invoice for date range', async () => {
  const entries = await getTimeEntries(userId, startDate, endDate);
  const pdf = await generateInvoice(entries);
  expect(pdf).toBeDefined();
  expect(pdf.pageCount).toBeGreaterThan(0);
});
```"

[AI-ASSISTED FEATURE BUILDING - 4:30-5:00]

**Useful Prompts:**

**Planning:**
```
"I want to build [feature]. Help me create a detailed spec 
including user stories, acceptance criteria, technical requirements, 
and edge cases. Use the spec-driven development approach."
```

**Implementation:**
```
"Based on the approved spec, implement [feature]. 
Use Context7 MCP for @react-pdf/renderer docs. 
Show me the implementation plan before coding."
```

**Refactoring:**
```
"This code works but looks messy. Refactor it to be:
- More readable
- Better typed
- Properly abstracted
- Following React best practices"
```

**Debugging:**
```
"The PDF generation is failing with this error: [paste error].
Here's the relevant code: @file.ts
What's wrong and how do I fix it?"
```

[REAL-WORLD EXAMPLES - 5:00-5:30]

**Rexan Wong's Component Pattern:**
- Visual component library
- One-click install
- Customizable themes
- TypeScript support

**Builder.io Visual Development:**
- Visual page builder
- React component generation
- AI-assisted design
- Export to code

**React in 100 Seconds:**
- Component composition
- State management
- Hooks usage
- Best practices"

[FEATURE DEVELOPMENT CHECKLIST - 5:30-6:00]

**Before coding:**
- [ ] Feature is validated (users want it)
- [ ] Spec is written and approved
- [ ] AI has access to Context7 MCP
- [ ] Plan is reviewed and makes sense

**During coding:**
- [ ] Working in small increments
- [ ] Testing each part
- [ ] Asking clarifying questions
- [ ] Documenting decisions

**After coding:**
- [ ] Code review (CodeRabbit or manual)
- [ ] All edge cases tested
- [ ] Error handling in place
- [ ] Documentation updated
- [ ] Learnings added to `learnings.md`

This process turns feature development from chaotic to systematic. You build better features faster, with fewer bugs and less rework.

See you in the debugging guide!"

---

**VISUAL NOTES**:
- Spec-driven development flowchart
- Voice input demonstration
- AI planning session example
- CodeRabbit review interface
- Testing checklist walkthrough
- Before/after feature quality comparison
- Real-world example implementations
