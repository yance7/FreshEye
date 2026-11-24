# UI optimization closeout

Baseline: `a7b65a1eaaa4c2b1eea0ccd8e37abc27bcd2e726`. Changes were merged in dependency order:

| Work | PR | Merge commit | Verification |
| --- | --- | --- | --- |
| Navigation layout | #14 | `72470ca` | Desktop and mobile bilingual layout, focus and breakpoint tests. |
| Sample card | #15 | `6702bae` | Three originals and card states checked; the original corner artifact did not reproduce in Windows Chromium at 1440×900, DPR 2. Label blur was removed defensively; the original device still needs checking. |
| Footer and content pages | #16 | `108c926` | Bilingual footer and keyboard-accessible narrow tables; desktop/mobile content screenshots. |
| Floating navigation | #17 | `5820146` | Scroll, menu and focus tests in Chromium and Playwright WebKit; no physical Safari device. |
| Home layout | #18 | `c0851e1` | Mobile actions, 390×844 primary action, long filenames and existing analysis flows. |
| English experience | #19 | `c97cb95` | Locale download failure, rapid switching, metadata, persistence and report regression. |
| Public copy | #20 | `7dc6023` | Bilingual guide and fish-reference text, source and standard links, low-confidence and report regression. |

Representative Chromium screenshots and run logs are retained outside the repository in the task evidence directory. Reference images and the personal-site repository were unavailable; the supplied written design direction was used. WebKit automation is not physical iPhone Safari or Android testing.

Final integration verification uses `npm run verify` in `frontend-vue/`: contract tests, unit tests, TypeScript, production build and browser flows. Mocked analysis tests are distinct from production inference. After this PR merges, compare the Pages workflow result and `version.json` with the deployed commit. Roll back an individual change by reverting its merge commit after reviewing dependencies; this work changes neither model weights nor backend code.

The tracked integration diff contains frontend code and purposeful regression tests; no tracked temporary output was identified for deletion. Existing root worktree modifications and older worktrees belong to earlier work and must be preserved. Remove task worktrees, branches and generated artifacts only after checking current state and merged ancestry; keep one copy of the evidence.
