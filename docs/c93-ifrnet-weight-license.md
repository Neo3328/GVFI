# C9.3-A — IFRNet Weight Commercial License Final Check

**Date:** 2026-08-12  
**Phase:** Public-source license verification only · **not** C9.4 · **not** C10  
**Forbidden performed:** no weight download · no install · no compile · no run · no A/B · no GVFI / `backend_mode` / RIFE / VideoWorker change  

**Production preserved:** `backend_mode=cli` · RIFE `rife-v4.6`

**Disclaimer:** Not legal advice. This gate records what public text does and does not say.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Final verdict

# **UNKNOWN**

| Gate | Definition | Applied? |
|------|------------|----------|
| **PASS** | Commercial use **and** redistribution have **explicit** public basis | **No** |
| **FAIL** | Explicit ban on commercial use or redistribution | **No** (no NC / Research-Only / No-Redistrib text found) |
| **UNKNOWN** | Public materials insufficient to confirm | **Yes** |

**Rule applied:** Do **not** infer “MIT repo ⇒ weights cleared for commercial product redistrib.”  
Third-party Hugging Face `license: mit` on a reupload is **not** an author grant.

---

## Executive summary

| Layer | Finding |
|-------|---------|
| Official **code** | MIT **[CONFIRMED]** |
| Port **code** (`nihui/ifrnet-ncnn-vulkan`) | MIT **[CONFIRMED]** |
| Official **pretrained `.pth`** | Dropbox link only; **no** separate weight SPDX / redistrib clause **[UNKNOWN]** |
| Converted **ncnn `.param/.bin`** | Bundled in port/release; no independent weight license; derivative of upstream checkpoints **[UNKNOWN]** |
| Paper / project page weight grant | **Not found** **[UNKNOWN]** |
| Explicit commercial ban | **Not found** **[CONFIRMED]** no hard ban text |

Missing for **PASS:** an **authoritative** statement (LICENSE addendum, MODEL card, README clause, or author/counsel writing) that pretrained checkpoints (and converted ncnn packs) may be commercially used **and redistributed**.

---

## 1. Official IFRNet GitHub — code LICENSE

| Item | Fact | Tag |
|------|------|-----|
| Repo | https://github.com/ltkong218/IFRNet | **[CONFIRMED]** |
| File | root `LICENSE` | **[CONFIRMED]** |
| SPDX | MIT | **[CONFIRMED]** |
| Copyright | Copyright (c) 2022 Lingtong Kong | **[CONFIRMED]** |
| Scope wording | “this software and associated documentation files (the **Software**)” | **[CONFIRMED]** |
| Mentions pretrained weights / checkpoints / `.pth` | **No** | **[CONFIRMED]** |
| NC / Research-Only / Academic-Only | **Absent** | **[CONFIRMED]** |

**Code license ≠ weight license.** MIT here is clear for **source/object code of the Software** under MIT conditions. It does **not**, by itself, name Dropbox checkpoints as part of that “Software.”

---

## 2. Official pretrained `.pth` — source and terms

| Item | Fact | Tag |
|------|------|-----|
| Host | Dropbox shared folder linked from README | **[CONFIRMED]** |
| URL | `https://www.dropbox.com/sh/hrewbpedd2cgdp3/AADbEivu0-CKDQcHtKdMNJPJa?dl=0` | **[CONFIRMED]** |
| README instruction | “Download our pre-trained models… put file checkpoints into the root dir” | **[CONFIRMED]** |
| Demo paths | e.g. `./checkpoints/IFRNet/IFRNet_Vimeo90K.pth`, GoPro variants | **[CONFIRMED]** |
| Separate `WEIGHTS_LICENSE` / SPDX in repo | **Not present** (no such file in root listing) | **[CONFIRMED]** |
| README weight license paragraph | **None** | **[CONFIRMED]** |
| Dropbox folder license text inspected this phase | **Not downloaded / not mirrored** (forbidden) | — |
| Explicit commercial-use grant for weights | **Not found** | **[UNKNOWN]** |
| Explicit redistrib grant for weights | **Not found** | **[UNKNOWN]** |
| Explicit commercial ban | **Not found** | **[CONFIRMED]** no ban text in repo |

**Weight license status:** **UNKNOWN**

---

## 3. `nihui/ifrnet-ncnn-vulkan` — port LICENSE

| Item | Fact | Tag |
|------|------|-----|
| Repo | https://github.com/nihui/ifrnet-ncnn-vulkan | **[CONFIRMED]** |
| LICENSE | MIT · Copyright (c) 2022 nihui | **[CONFIRMED]** |
| Nature | Third-party ncnn/Vulkan **port** (linked from upstream README; not authored by Kong) | **[CONFIRMED]** |
| Scope | Port **software** (CLI / glue) under MIT | **[CONFIRMED]** |
| Statement that bundled models are MIT / commercially redistributable | **Not found** in LICENSE/README | **[UNKNOWN]** for models |

Port MIT clears **port code**, not automatically upstream weight redistrib.

---

## 4. Release / repo `ifrnet.param` + `ifrnet.bin`

| Item | Fact | Tag |
|------|------|-----|
| Presence | In-repo `models/IFRNet_*/*` and Windows release zip `20220720` | **[CONFIRMED]** (C9.2-A/B) |
| Format | ncnn `.param` + `.bin` | **[CONFIRMED]** |
| Provenance (public) | Converted IFRNet checkpoints for Vulkan inference; upstream = official IFRNet / Dropbox lineage | **[INFERENCE]** standard for nihui ports; no separate provenance SPDX file |
| Dedicated model license file next to `.bin` | **Not found** | **[CONFIRMED]** |
| README redistrib terms for models | Package “includes… models”; **no** commercial redistrib clause | **[CONFIRMED]** |
| Legal effect of conversion | Format change (`.pth`→ncnn) does **not** create a new public commercial grant | **[CONFIRMED]** principle |

**Converted ncnn weights commercial redistrib:** **UNKNOWN** (inherits upstream weight **UNKNOWN**).

---

## 5. Paper / project page

| Source | Weight authorization text | Tag |
|--------|---------------------------|-----|
| arXiv:2205.14620 / CVPR 2022 | Code link to GitHub; **no** located dedicated weight SPDX / commercial redistrib grant in prior paper text review | **[UNKNOWN]** / no grant found |
| Official README “Citation” | Cite paper when using Software or Paper — **not** a weight redistrib license | **[CONFIRMED]** |

---

## 6. Independence: code MIT vs pretrained weights

| Question | Answer |
|----------|--------|
| Are code license and weight license legally distinct issues? | **Yes** — must be analyzed separately |
| Does official MIT LICENSE text explicitly cover Dropbox `.pth`? | **Not stated** → cannot treat as PASS |
| Does absence of NC text equal commercial redistrib clearance? | **No** → remains **UNKNOWN**, not PASS |

---

## 7. Can `.pth` → `.param/.bin` ship inside a commercial product?

| Path | Public basis for product redistrib? |
|------|-------------------------------------|
| Ship official `.pth` | **UNKNOWN** — no explicit grant |
| Ship nihui/release `.param/.bin` | **UNKNOWN** — no explicit grant; conversion ≠ new license |
| Ship only MIT **code** (retrain your own weights) | Code MIT **[CONFIRMED]**; your new weights need their own clearance |

**Answer for GVFI-style bundling of IFRNet pretrained/converted weights:** **cannot confirm from public text** → **UNKNOWN** (not PASS).

---

## 8. Non-author materials (explicitly **not** used to upgrade verdict)

| Source | Note |
|--------|------|
| Hugging Face `pavlichenko/ifrnet_vimeo` YAML `license: mit` | Third-party reupload convenience; **not** Kong/author LICENSE for original Dropbox weights |
| Community “MIT usually covers…” commentary | Speculation — forbidden for this gate |

---

## 9. What is missing for PASS

To move **UNKNOWN → PASS**, public (or counsel-confirmed) evidence must include at least one of:

1. Author statement that **pretrained checkpoints** are released under MIT (or another commercial-redistributable SPDX), **or**  
2. A dedicated weights LICENSE covering `.pth` **and** allowing redistribution, **or**  
3. Written commercial redistrib grant covering **converted ncnn** packs for product bundling.

Until then, keep **UNKNOWN**. Do not guess.

---

## 10. Relation to prior phases

| Phase | Relevance |
|-------|-----------|
| C9 / C9.2-A | Class **R1**; weight redistrib **UNKNOWN** |
| C9.2-B/C | Technical smoke / A/B — **do not** change license status |
| C9.3-A | Confirms weight commercial redistrib still **UNKNOWN**; no FAIL ban found |

Production: keep **`backend_mode=cli`** + **RIFE `rife-v4.6`**.

---

## Required summary box

| Field | Result |
|-------|--------|
| **Code license** | Official IFRNet **MIT** · Port **MIT** **[CONFIRMED]** |
| **Weight license** | Separate SPDX / grant for `.pth` **not found** → **UNKNOWN** |
| **Commercial use** (internal inference of public weights) | No NC ban found; formal grant **UNKNOWN** — not asserted as cleared |
| **Redistribution** (ship weights in product) | **UNKNOWN** — no explicit public basis |
| **Converted ncnn weights** | Bundled publicly; redistrib clearance **UNKNOWN** (inherits upstream) |
| **Final verdict** | **UNKNOWN** |

**Stop.** Do **not** auto-enter C9.4 / C10.

**Report path:** `docs/c93-ifrnet-weight-license.md`
