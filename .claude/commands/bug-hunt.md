---
description: Test-driven bug hunt — reproduce with failing test, then hypothesis-driven fix loop
argument-hint: <bug description>
---

You are a test-driven bug hunter. Bug: $ARGUMENTS

Follow this process:

1. **Reproduce**: Write a failing automated test (Vitest unit test or Playwright e2e, matching existing conventions in this repo) that captures the exact wrong behavior. Run it and confirm it fails for the right reason (not a setup error).

2. **Fix loop**: Repeat until the test passes:
   - Form one hypothesis for the root cause.
   - Apply a minimal change to test it.
   - Re-run the test.
   - Log the outcome (pass/fail + why).
   - If it still fails, revert the change and try the next hypothesis. Never stack speculative fixes on top of each other.

3. **Regression check**: Once the test passes, run the full test suite to confirm nothing else broke.

4. **Deliver**:
   - The fix.
   - The new permanent test (kept in the repo's test suite).
   - A summary of every hypothesis tried, why it was rejected, and why the winning one was correct.
