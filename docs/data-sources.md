# Data sources

The datasets Witness uses or plans to use, with their endpoints, structure, and the value rules the code relies on.
All of them are published by [Tech for Palestine](https://data.techforpalestine.org/), which is the reference for
official documentation and schema changes. The datasets track the human toll since October 7, 2023, and are
sourced from official reports, public submissions, and humanitarian databases.

Unlike `specs/mission.md`, this document is expected to change: update it when a source changes its structure, when
a new dataset is added, or when a value rule is decided. Always date observations.

> **Limitations:** these datasets reflect reported figures. They may not capture the entire human toll because of
> information disruption and unrecovered bodies under rubble.

## Shared vocabulary

| Term              | Meaning                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Casualty / killed | A person recorded as killed in a source dataset. "Total" = count of those records.             |
| Sex               | `male`, `female`, or `Unknown / Not specified`.                                                |
| Age brackets      | `0–17` (children, per UN CRC), `18–29`, `30–59`, `60+`, `Unknown`.                             |
| Bracket bounds    | Inclusive integer ranges; `60+` is 60–120; `age` Unknown → `Unknown` (2026-10-09).             |
| Unknown           | Field is missing, null, empty, or not parseable.                                               |
| Share             | Count ÷ records in the same dataset, one decimal; non-zero below 0.05% → `<0.1%` (2026-10-09). |

## Catalog

| Dataset               | Status                | Endpoint used by Witness                                               | Source module                      |
| --------------------- | --------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Killed in Gaza        | In use (Phase 2)      | `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`     | `src/data/sources/killedInGaza.ts` |
| Summary               | In use (Phase 4–7)    | `https://data.techforpalestine.org/api/v3/summary.json`                | `src/data/sources/summary.ts`      |
| Gaza daily casualties | Planned (Phase 12–13) | `https://data.techforpalestine.org/api/v2/casualties_daily.min.json`   |                                    |
| West Bank daily       | Planned (Phase 14)    | `https://data.techforpalestine.org/api/v2/west_bank_daily.min.json`    |                                    |
| Press killed in Gaza  | Later (not scheduled) | `https://data.techforpalestine.org/api/v2/press_killed_in_gaza.json`   |                                    |
| Infrastructure damage | Later (not scheduled) | `https://data.techforpalestine.org/api/v2/infrastructure-damaged.json` |                                    |

## Killed in Gaza

Records of individual people killed in Gaza, identified by name. Witness uses only `age` and `sex`; names, `id`, and
`dob` never leave the source module (aggregates only).

- **Endpoint:** minified JSON v3, `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`.
- **Other formats (not used):** CSV `…/api/v3/killed-in-gaza.csv`; paged JSON v2
  `…/api/v2/killed-in-gaza/page-1.json` onwards.

### Structure (observed 2026-10-07)

- A JSON array of arrays. Row 0 is the header `["id","en_name","ar_name","age","dob","sex","update"]`; each
  following row is one person, with one value per header column.
- Witness looks columns up **by header name**, so reordered or added columns do not break it.
- 72,835 rows.
- `update` is a batch number (1 to 10), not a date.

### Field values and rules

| Field | Observed (2026-10-07)        | Rule in Witness                                                                                                                                                                        |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `age` | Integer from 0 to 110        | Whole years: an integer number or integer string (trimmed) from 0 to 120. Anything else (missing, empty, negative, fractional, above 120, non-numeric) → Unknown (decided 2026-10-08). |
| `age` | `0` in 1,072 records         | **`0` is a real age: a child under one year.** Never treated as Unknown (confirmed 2026-10-08).                                                                                        |
| `sex` | `"m"` or `"f"`               | Trimmed, case-insensitive: `m` or `male` → male, `f` or `female` → female. Missing or any other value → Unknown / Not specified (decided 2026-10-08).                                  |
| any   | No null or empty values seen | The code still handles missing values: upstream data can change without notice.                                                                                                        |

Normalizer: `src/data/normalize/person.ts` (Phase 3, decided 2026-10-09), shared by person-based datasets.
Every row becomes one record: no row is dropped.

### Transfer and headers (observed 2026-10-07)

- 8.2 MB uncompressed, about 2.3 MB with Brotli (`content-encoding: br`).
- `access-control-allow-origin: *` (CORS open; confirmed from the GitHub Pages origin).
- `cache-control: public, max-age=0, must-revalidate`, with an `etag`. No `last-modified` (re-checked 2026-10-09):
  the dataset date comes from [Summary](#summary).

### Notes

- `summary.json` reports `gaza.killed.total = 74,250`, while this dataset has 72,835 named records: the list covers
  identified people only. A total based on this dataset should be labelled accordingly (for example, "identified by
  name").

## Summary

Headline figures across the datasets, maintained by Tech for Palestine. Witness uses it only for the dates of the
Killed in Gaza list and for the reported total killed in Gaza, shown as a separate, attributed figure.

- **Endpoint:** `https://data.techforpalestine.org/api/v3/summary.json`.

### Structure (observed 2026-10-09)

- One JSON object, about 1.2 kB. Top-level keys: `gaza`, `west_bank`, `lebanon`, `known_killed_in_gaza`,
  `known_press_killed_in_gaza`.
- `known_killed_in_gaza`: `records` (72,835, equal to the Killed in Gaza row count), `pages`, `page_size`,
  `male` / `female` split into `child` / `adult` / `senior`, `last_update` (`"2026-07-27"`), and `includes_until`
  (`"2026-05-07"`).
- `gaza`: `reports`, `last_update` (`"2026-10-07"`), and `killed.total` (74,250), plus other counts that Witness does not
  use.
- Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=0, must-revalidate`.

### Field values and rules (decided 2026-10-09)

| Field                                 | Rule in Witness                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `known_killed_in_gaza.last_update`    | Shown as the Killed in Gaza "last updated" date. Kept only if it is a `YYYY-MM-DD` string; otherwise unavailable. |
| `known_killed_in_gaza.includes_until` | Not used: one date per figure keeps the card readable.                                                            |
| `known_killed_in_gaza.records`        | Not displayed; used only to cross-check the live total. Kept only if it is a non-negative integer.                |
| `gaza.killed.total`                   | Shown as a separate reported-total line, never merged with the named count. Same integer rule.                    |
| `gaza.last_update`                    | The "as of" date of the reported total. Same date rule.                                                           |
| `male` / `female` splits              | Not used: their child / adult / senior bands differ from Witness's age brackets.                                  |

If `summary.json` fails or is malformed, the Killed in Gaza figures still show; only the dates and the reported total
are left out.

## Gaza daily casualties

Daily reports of aggregate killed and injured counts in the Gaza Strip.

- **Endpoint:** minified JSON v2, `https://data.techforpalestine.org/api/v2/casualties_daily.min.json`.
- **Other formats (not used):** JSON `…/api/v2/casualties_daily.json`, CSV `…/api/v2/casualties_daily.csv`.
- **Official field documentation:** <https://data.techforpalestine.org/docs/casualties-daily/>.

### Structure (observed 2026-10-15)

- A JSON array of objects, one per calendar day, sorted by `report_date`: 1,104 rows from 2023-10-07 to 2026-10-14,
  with no missing or duplicate dates. Fields vary from row to row: a field with no value is left out, not `null`.
- Always present: `report_date`, `report_source`, `report_period`, and the `ext_*` fields. `killed_cum` is absent in 25
  rows, `injured_cum` in 33; `killed` and `injured` (daily counts, "may include retroactive") are often absent.
- Other fields appear only in some periods: `killed_children_cum`, `killed_women_cum`, `med_killed_cum`,
  `press_killed_cum`, `civdef_killed_cum`, `massacres_cum`, `killed_truce_new`, `killed_committee`, `killed_recovered`,
  `killed_succumbed`, `aid_seeker_killed_cum`, `aid_seeker_injured_cum`, `famine_cum`, `child_famine_cum`.
- The last row's `ext_killed_cum` (74,392 on 2026-10-14) equals `summary.json` `gaza.killed.total` and
  `gaza.last_update`.

### Field values and rules

| Field                         | Observed (2026-10-15)                                                                               | Rule in Witness (decided 2026-10-15)                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `report_date`                 | `YYYY-MM-DD`, one per day                                                                           | Kept only if it is a valid `YYYY-MM-DD` date; otherwise the row is skipped and counted.                   |
| `report_source`               | `mohtel` 1,042 (Ministry of Health), `gmotel` 22 (Government Media Office), `missing` 40            | `mohtel`, `gmotel`, `unocha` (documented, not seen) → reported. `missing` or any other value → no report. |
| `report_period`               | Hours covered: 24 (908), 48 (87), 72 (5), 96 (1), 0 (103)                                           | A positive integer → reported; `0` or anything else → no report.                                          |
| `killed_cum`, `injured_cum`   | Non-decreasing integers                                                                             | Used only on a reported day and only as a non-negative integer; otherwise `null`.                         |
| `killed`, `injured`           | Daily counts, may include retroactive counts                                                        | Not used: monthly figures are differences of month-end cumulatives.                                       |
| `ext_*`                       | Present in every row; filled by Tech for Palestine when a report is missing, sometimes by averaging | **Never used** (mission principle 1: no extrapolated value shown).                                        |
| Breakdowns and special fields | Only in some periods                                                                                | Not used.                                                                                                 |

Days without a report (`report_source: "missing"` or `report_period: 0`): 125 on 2026-10-15, in 28 of the 37 months.
On these days the dataset still has values (copied or filled in); Witness ignores them and counts the day as without
a report.

Monthly figures (decided 2026-10-15): a month's cumulative is the last reported `killed_cum` in that month; its
figure is that value minus the previous month's (0 before the first report). On 2026-10-15 every month has a reported
cumulative, the monthly figures sum to the last reported total, and each month-end value equals `ext_killed_cum`.

### Transfer and headers (observed 2026-10-15)

- 494 kB uncompressed, about 38 kB gzip; served with Brotli (`content-encoding: br`).
- `access-control-allow-origin: *`, `cache-control: public, max-age=0, must-revalidate`, with an `etag`.

## West Bank daily

Daily reports of killed, injured, and settler attack counts across the West Bank.

- **Endpoints:** JSON `…/api/v2/west_bank_daily.json`, minified `…/api/v2/west_bank_daily.min.json`.
- **Structure:** not profiled yet (Phase 14).

## Press killed in Gaza

Registry of journalists and press workers killed in Gaza.

- **Endpoint:** JSON `…/api/v2/press_killed_in_gaza.json`.
- **Structure:** not profiled yet.

## Infrastructure damage

Weekly reports estimating damage to vital infrastructure in Gaza.

- **Endpoint:** JSON `…/api/v2/infrastructure-damaged.json`.
- **Structure:** not profiled yet.
