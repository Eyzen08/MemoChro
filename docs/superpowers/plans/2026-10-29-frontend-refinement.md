# Frontend refinement execution ledger

Approved scope: readable typography and shared shell, accessible drawer, light default, spacious memory editor, dirty-form warnings, File[] photo selection with previews/removal/drop and safe retry, six licensed photographs, read-only six-destination demo and details. Preserve private auth/data/storage and all limits. No migrations or new services. Protected preview deployment only.

Steps: (1) add browser regression coverage; (2) shell, typography, form and upload improvements; (3) local sample archive and photography; (4) functional/isolation, type/lint/build checks and one batched visual review plus confirmation; (5) handover and protected preview deployment.

Ruling: implement in the existing clean checkout, with production build in a clean temporary directory outside the locked OneDrive cache. Existing private fixtures and deployment remain the baseline.

Status: complete. Source commit `9166680811a9e34273cb42a23610c847deff2428` is pushed on `codex/frontend-refinement`. Protected staging deployment `dpl_5G9JXgXGZPPW2MwvW5DL1A7txquh` is READY and assigned to the existing preview alias. Hosted demo/search/photo viewer and private auth smoke checks passed; anonymous access remains protected. Public aliases retain the previous production release. See DEPLOYMENT.md for rollback and remaining hosted-upload limit.

Ruling: reserve a separate feedback/action row below a bounded, keyboard-focusable field scroller. This prevents the sticky bar from covering fields. Short viewports retain a 220px minimum and ordinary page scrolling.

Fixed after red browser coverage: new-memory UUID changed on server revalidation during partial uploads. A stable session ID and route identity key now preserve retry ownership and deduplication.

Verification: 7 unit tests passed; functional/isolation browser run 10 passed and 1 intentionally skipped (fresh disposable account required); separate six-width visual/drawer/theme/motion/landscape confirmation passed; lint, type check and a clean production build outside OneDrive passed. Final review had one short-viewport finding, fixed and covered. Detector advisories: incumbent place-map grid; temporary preview image receives its real blob URL from its effect and was verified to load/revoke correctly. Hosted file-picker check remains permission-limited.
