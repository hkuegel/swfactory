---
id: 031
title: Kapitalertragsteuer and Kirchensteuer as checkboxes
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/031-laz-capital-gain-tax-checkboxes
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC4] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 031 – Kapitalertragsteuer and Kirchensteuer as checkboxes

## Original request

> "Steuer kein Steuersatz in Prozent. Checkbox für Kapitalertragsstuer (25%) + Kirchensteuer
> (unterschiedlich nach Bundesland)" (hak, 2026-11-13)

## User story

As the depot owner, I want to pick the taxes that actually apply to me by checkboxes instead of
typing a rate, so that the shown result uses the real rates of my situation.

## Context

- The tax is still the tax on the gain at liquidation of 024 (`max(0, gain)`), only the way the rate
  is chosen changes: a free-text rate is replaced by the statutory rates.
- Measured facts (2026-11-13, published explainers and the BZSt page on church tax on capital gain
  tax): Kapitalertragsteuer 25 % of the capital gain; Kirchensteuer is computed **on the
  Kapitalertragsteuer**, not on the gain — 8 % in Bayern and Baden-Württemberg, 9 % in every other
  Bundesland; Solidaritätszuschlag 5,5 % of the Kapitalertragsteuer. Effective rate on the gain with
  the SolZ counted (hak's answer, 2026-11-13): 26,375 % with the KSt checkbox alone, 28,375 % with
  church tax at 8 % (Bayern), 28,625 % with church tax at 9 %.
- Assumption, stated as a decision: these are bond ETFs, so the whole gain is taxable (the 30 %
  partial exemption that applies to equity funds does not apply here). The tax is the flat
  Abgeltungsteuer on the gain, not the individual income tax rate (the Günstigerprüfung of avd
  [014](../../../avd/docs/backlog/014-avd-tax-refund.md) is not part of this app).
- The rate sum must stay exact: 5,5 % of 25 % is not a whole basis point, so the unit must be
  chosen so that all three parts are integers (the money rule: no float percentages).

## Acceptance criteria

- **AC1:** Given the Kapitalertragsteuer checkbox is checked, when a result is computed, then the
  taxed payout equals `NAV + 0,26375 × max(0, pre-tax projection − NAV)` (25 % plus the SolZ as hak
  decided); when the checkbox is unchecked the result equals the pre-tax projection exactly, and the
  form has no field for a typed rate any more (the accessibility tree shows no such control).
- **AC2:** Given the Kirchensteuer checkbox is checked with a Bundesland chosen, when the result is
  computed, then the church tax adds 8 % of the Kapitalertragsteuer for Bayern and Baden-Württemberg
  and 9 % for every other Bundesland, measured as effective rates on the gain: 26,375 %, 28,375 % and
  28,625 % with hand-pinned amounts; the church tax is ignored while the Kapitalertragsteuer checkbox
  is unchecked, and the select lists the 16 Bundesländer with the rate each one uses, starting at
  Bayern.
- **AC3:** Given the same inputs in each of the four states (KSt off; KSt on; KSt + KiSt at 8 %; KSt
  - KiSt at 9 %), when the amount is fed back through the opposite direction, then the round trip of
    024 AC3 still holds within one cent for every state, and a fund whose pre-tax projection is below
    its NAV stays untaxed. The `r = 100 %` case of 024 AC4 is no longer reachable through the form, so
    it stays a model-level case with a hand rate, not a UI case.

## Out of scope

- Any Günstigerprüfung or individual income tax; the Sparerpauschbetrag (the model taxes the whole
  gain, as 024 does); the SolZ exemption thresholds of 2021 (hak's amounts are above them, and the
  story counts the full 5,5 % of the KSt); withholding mechanics of a broker.

## Open questions

- None. The SolZ was the last open point and hak answered it on 2026-11-13.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's request (verbatim above): no typed rate, checkbox for the 25 % Kapitalertragsteuer,
  church tax by Bundesland.
- 2026-11-13 — Decision (orchestrator): the free-text rate field is removed; the rates are the
  statutory ones, and the Bundesland is a select because the rate differs by state. Church tax is
  applied only while the Kapitalertragsteuer checkbox is checked, since it is computed on that tax.
- 2026-11-13 — Decision (orchestrator): the whole gain is taxable for these bond ETFs (no 30 %
  partial exemption), so the tax base is the same base 024 already uses.
- 2026-11-13 — hak's answer at gate 1 — Q: is the SolZ part of the checkbox, and which Bundesland is
  the default? — A: "Bayern, 8 % KiSt, Soli dazu", so the KSt checkbox means 26,375 % on the gain and
  Bayern is the default of the Bundesland select.
- 2026-11-13 — Decision (orchestrator): the rate is stored in millionths of a percent (25 % = 250000,
  SolZ 5,5 % of it = 13750, KiSt 8 % = 20000, 9 % = 22500), because 1,375 % is not a whole basis point
  and the money rule forbids float percentages.
- 2026-11-13 — hak confirms all open gates in advance and asks for the open laz stories to be finished
  without waiting for his approval, so this story is set to done at gate 2; the merge to main runs in the
  order 024 → 025 → 030 → 033 → 031 → 032.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

- A new logic module holds the rates and the 16 Bundesländer. The rates are whole numbers in millionths
  of a percent (1 % = 1 000 000), because 5,5 % of 25 % is 1,375 % and the money rule forbids float
  percentages; the model reads one shape, `Tax { on, rateMillionths }`.
- The church tax is computed on the Kapitalertragsteuer, so it counts only while the Kapitalertragsteuer
  checkbox is checked. The three controls (two checkboxes and the select) cannot hold a value outside
  their options, so this part of the form has no error state and nothing can be marked invalid.
- The typed rate field is gone from the field list, the parser, the copy and the form, and the 0 – 50 %
  bound went with it: no field of the form has a percent bound of its own any more. The fund-row YTM cell
  keeps -100 % to 100 %, which is the range a percent means.
- The tax block is one fieldset with a legend: two checkboxes with their rule under the label as the
  accessible description, and the Bundesland select. The select is never disabled, even while the church
  tax is unchecked, because 024 AC3 keeps every control reachable.
- Deviation from the design: none. The round trip of 024 AC3 is now tested with the rates the form can
  produce, and `r = 100 %` stays a hand case at the model level.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                   | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `logic/tax.test.ts` (hand rates 263750 and 0 millionths, hand payout 80,00 € and 69,45 € per share on the exact factor-2 case); `fieldCopy.test.ts` "031 AC1, AC2" (the copy has no entry for a typed rate); e2e "031 AC1, AC2" (the accessibility tree shows no control for a typed rate)                                                | pass   |
| AC2 | `logic/tax.test.ts` (283750 for Bayern and Baden-Württemberg, 286250 for every other Bundesland, 16 entries with Bayern first, church tax ignored while the KSt is unchecked); e2e "031 AC1, AC2": the select shows 16 options starting at Bayern, and the fund row 2028 shows the hand figures 160,30 € / 128,57 € / 126,17 € / 125,87 € | pass   |
| AC3 | `logic/phase.test.ts` "031 AC3": the round trip of 024 AC3 within one cent for the four states; `logic/tax.test.ts` AC3: a fund with a negative gain stays untaxed, and `r = 100 %` as a model-level hand case                                                                                                                            | pass   |

Counts as printed: laz vitest 19 passed (7 files); laz Playwright 49 passed, including the new test.
The affected run is green, 8 of 12 steps.

Non-vacuity, four mutations on a copy of the logic directory under `.tmp`, never on the working tree:

- the church tax counted while the KSt checkbox is off → AC2 red (`20000` instead of `0`);
- Bayern read as 9 % instead of 8 % → AC2 red (`286250` instead of `283750`);
- the Solzzuschlag dropped → AC1 red (`250000` instead of `263750`), and AC2 with it;
- the rate applied to the whole projected value instead of to the gain → the projection AC4, the tax
  AC1 and AC2, and the round trip AC3 all went red.

The copies were restored by copying the original files, not with git.

The e2e figures are hand values, derived from the factor 2^(731/365) = 4,0076034 for the fund row 2028
and from the phase factor 55,125236 for the live region, not read back from the app. One assertion of
024 AC6 had to be derived again for the same reason: its figures were the 25 % state, which the form
cannot produce any more, so the hand values there are now 217,69 € and 13.714,23 €.

Defect found and fixed during testing: the new e2e test had been appended through a shell heredoc, which
wrote the file in the console code page and turned `für` into a question mark, so the locator found no
option. Found by reading the failure's page snapshot, fixed by writing the file with the editor tool.

## Review

Size S, so no review round (story 026).

## Explanation

Die Steuer ist kein Feld für einen eingegebenen Prozentsatz mehr, sondern zwei Hacken.
Kapitalertragsteuer heißt 25 % auf den Gewinn, der Solzzuschlag ist enthalten: 26,375 %.
Kirchensteuer wird auf die Kapitalertragsteuer gerechnet, nicht auf den Gewinn.
8 % in Bayern und Baden-Württemberg, 9 % in den anderen Bundesländern; Bayern ist die Voreinstellung.
Die Kirchensteuer zählt nur, wenn die Kapitalertragsteuer angehakt ist.
Die Auswahlliste zeigt alle 16 Bundesländer mit dem Satz, den jedes benutzt.
Ohne Hacke ist das Ergebnis genau die Rechnung ohne Steuer.
Die Sätze sind ganze Zahlen, weil 1,375 % kein ganzer Basispunkt ist.
Die alte Grenze von 0 bis 50 % ist weg, sie gehörte zum entfernten Feld.
Ein Fonds mit negativem Gewinn bleibt steuerfrei, wie 024 es vorsieht.
Der runde Weg zurück zum Einsatz stimmt in allen vier Zuständen weiterhin innerhalb eines Cents.
Ein Satz von 100 % ist nur noch eine Modellgrenze, weil keine Eingabe ihn erzeugen kann.
Hacken und Auswahlliste sind über die Tastatur erreichbar, nichts ist gesperrt.
Prüfungen, die diese Änderung sehen können, sind grün: 19 Unit-Tests, 49 e2e-Tests, 8 Schritte.
Manuelle Prüfung: das Aussehen im Browser nach dem Merge ist yours.

## Retrospective

What went wrong: no review round (size S), no defect in the code, no hand value corrected after the test
was written, no correction at the gates.

Two things the run showed:

- A file written through a shell heredoc came out in the console code page, which broke the umlauts of a
  German label and made an e2e assertion fail on the locator, not on the app. Proposed change P28: source
  files are written with the editor tool, never through a shell heredoc. Pending hak's approval.
- 024 AC6 had a hand expectation that was the app's 25 % state. When the rate field was removed, it had
  to be derived by hand again, which is the same rule as P21: an expectation that can only be read from
  the app is not a hand oracle. The open finding from 025 stays open.

Proposals applied for this story's roles: P22 (developer and tester), P23 (tester), P24 (developer),
P25 (devops), P26 (tech-writer), P21 (tester). P27 (proposal numbers are never reused) is pending.

No Cost table: size S (story 026, R8).
