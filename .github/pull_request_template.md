## 1. Summary

This PR changes:

- [Change 1]
- [Change 2]
- [Change 3]

It solves:

- [Problem / ticket / story link]

---

## 2. Intent

The intent of this PR is:

> [Explain why this change exists.]

---

## 3. Scope

### In Scope

- [Included change 1]
- [Included change 2]

### Out of Scope

- [Excluded change 1]
- [Excluded change 2]

---

## 4. Verification

I verified this change by:

- [ ] `pnpm exec biome ci .` (lint + format)
- [ ] `pnpm --filter @ssegning/web build` (smoke build)
- [ ] `helm template ssegning-com deploy/chart` / `helm lint deploy/chart` (if `deploy/chart` changed)
- [ ] Manual verification against a local dev CMS/site
- [ ] Testing error cases (e.g. site still renders with Strapi unreachable)
- [ ] Testing rollback or failure behavior, if relevant

Commands run:

```bash
[command 1]
[command 2]
```

Results:

```text
[paste result or link]
```

---

## 5. Screenshots / Evidence

Add evidence here:

* Screenshot: [link]
* Logs: [link]
* Metrics: [link]
* Recording: [link]

---

## 6. Risk Assessment

Risk level:

* [ ] Low
* [ ] Medium
* [ ] High

Potential risks:

* [Risk 1]
* [Risk 2]

Mitigation:

* [Mitigation 1]
* [Mitigation 2]

---

## 7. AI Usage Declaration

AI was used for:

* [ ] Understanding existing code
* [ ] Generating code
* [ ] Refactoring
* [ ] Generating tests
* [ ] Drafting documentation
* [ ] Reviewing the diff
* [ ] Not used

Human verification:

* [ ] I understand every meaningful change in this PR
* [ ] I checked generated code manually
* [ ] I checked generated tests manually
* [ ] I removed unsupported AI assumptions
* [ ] I accept responsibility for this PR

---

## 8. Reviewer Focus

Please focus your review on:

* [ ] Correctness
* [ ] Architecture
* [ ] Security
* [ ] Performance
* [ ] Tests
* [ ] Maintainability
* [ ] Product intent
* [ ] Edge cases
