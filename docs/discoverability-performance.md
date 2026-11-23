# Discoverability and mobile performance check

Measured 2026-11-23 on the PR10 candidate based on `562a9eb` and the PR09 production build at `562a9eb`.

## Method

- Chromium through Playwright 1.55.0, one new browser context for each run and route; three runs per route, report the median.
- Mobile emulation at 390 × 844 CSS pixels, DPR 2, touch enabled; CDP network emulation at 150 ms RTT, 200 KiB/s download, and 75 KiB/s upload.
- Serve the actual Vite production output from the local static server. Block Service Worker control so each run measures a fresh visit. External font requests completed in these runs.
- DCL, load, FCP, LCP, and CLS come from browser performance entries. Same-origin body and transfer sizes come from Resource Timing. JavaScript includes the loaded app and Service Worker scripts.
- The fixture does not gzip responses. The gzip columns are estimates made by compressing the emitted JavaScript and CSS files; they are not observed production transfer sizes.

## Before and after

Times are milliseconds. Size columns are bytes. Each pair is PR09 baseline → PR10 candidate.

| Route | DCL | Load | FCP | LCP | Same-origin body | JavaScript body | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 2,105 → 1,770 | 2,643 → 2,466 | 948 → 916 | 2,732 → 2,416 | 363,431 → 299,636 | 280,657 → 218,537 | 0.0001 → 0.0006 |
| `/guide.html` | 2,239 → 1,758 | 2,498 → 2,431 | 928 → 912 | 2,932 → 2,352 | 383,607 → 320,302 | 285,704 → 223,584 | 0 → 0 |
| `/fish.html` | 2,268 → 1,724 | 2,504 → 2,251 | 932 → 920 | 2,840 → 2,160 | 348,227 → 284,893 | 283,665 → 221,545 | 0 → 0 |
| `/about.html` | 2,128 → 1,710 | 2,631 → 2,696 | 932 → 912 | 2,884 → 2,624 | 375,427 → 312,207 | 298,902 → 236,782 | 0 → 0 |

The root entry's same-origin JavaScript gzip estimate fell from 102,179 to 81,836 bytes. Vite's main entry fell from 263.71 KB (102.18 KB gzip) to 201.84 KB (81.84 KB gzip). English translations, PDF report generation, and the camera dialog now load only when needed. The four routes transferred 16–18% fewer same-origin body bytes in this first-visit lab run. Median LCP improved by 9–24% across the four routes; the about page's load event was 65 ms slower in the final sample, so the lab run does not show every timing moving in the same direction.

## Limits

These are controlled localhost measurements, not Core Web Vitals from real visitors or a measurement of GitHub Pages compression. The small CLS values vary between runs. Mobile emulation does not validate iOS Safari, Android browsers, or a physical camera; no handset was available during this check. Run `npm run build` followed by `npm run measure:production` in `frontend-vue` to repeat the check. The script accepts `--repeat=1` and `--build-dir=<path>` for comparisons.
