# Partner Analytics Plus

Partner-facing analytics for assigned ecosystem projects. Scoped to published course metrics and aggregate event data only — no learner identities, wallet addresses, UTM/referral attribution, or referral click counts.

## Routes

| Route | Purpose |
| --- | --- |
| `/partner-console/[productId]/analytics` | Project overview, funnel, trends, course table |
| `/partner-console/[productId]/analytics/courses/[courseId]` | Course funnel, quiz diagnostics, attempts before pass |
| `/partner-console/[productId]/analytics/reports` | Markdown/CSV export |

## Date ranges

Query param `?range=7d|30d|90d|all` (default `30d`).

When filtered:

- **Starts** — `Progress.createdAt` in range
- **Lesson completions** — `Progress.completedAt` in range
- **Quiz stats** — `QuizAttempt.submittedAt` in range
- **Badge awards / completions** — `BadgeAward.awardedAt` in range
- **Events** — `AnalyticsEvent.occurredAt` in range

## Metrics included (Plus)

- Summary cards: starts, completions, quiz pass rate, badges, page views
- Learner funnel (event-based, no referral breakdown)
- Weekly starts/completions trends
- Per-course lesson funnel and drop-off
- Quiz diagnostics (aggregated miss rates and option distribution)
- Attempts-before-pass histogram
- Badge verification page views
- Staff narrative notes (`Product.partnerAnalyticsNotes`)
- Markdown and CSV export

## Explicitly excluded

- UTM / referrer attribution tables
- Referral link click counts
- Individual learner or wallet data
- Cross-project comparisons

## Access

`requireProjectAdmin(productId)` — project admins and `staff_admin`.

## Implementation

- Data: [`src/lib/partner-analytics.ts`](../src/lib/partner-analytics.ts)
- Actions: [`src/app/actions/partner-analytics.ts`](../src/app/actions/partner-analytics.ts)
- UI: [`src/components/partner-console/analytics/`](../src/components/partner-console/analytics/)
