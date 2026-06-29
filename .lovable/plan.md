## Goal
Let the superuser optionally merge their Saved videos into the Home feed, controlled by a new toggle that only appears for superusers.

## Changes

1. **`src/contexts/SavedVideos.tsx`**
   - Add `showSavedInFeed: boolean` state + `setShowSavedInFeed(v)` to the context.
   - Persist to `localStorage` under `tuubmix.showSavedInFeed` (default `false`).
   - Expose through the existing `useSavedVideos()` hook so the Header and Index can read/write it.

2. **`src/components/Header.tsx`**
   - Gate a new switch labeled "Show saved in feed" behind `useUserTier().isSuperuser`.
   - Place it in both the desktop header controls and the mobile Sheet menu, next to the existing "Show hidden" / "Hide shorts" toggles.
   - Wire to `showSavedInFeed` / `setShowSavedInFeed`.

3. **`src/pages/Index.tsx`**
   - Read `list` (saved videos) and `showSavedInFeed` from `useSavedVideos()`, and `isSuperuser` from `useUserTier()`.
   - When `isSuperuser && showSavedInFeed`, convert saved entries via `savedToYTVideo` and merge them into `visibleItems`:
     - Deduplicate by `videoId` (feed item wins to keep latest metadata).
     - Re-sort the merged list by `publishedAt` desc so newest stays on top.
     - Keep existing hidden/shorts filtering applied to the merged set (a saved video that is also hidden still respects the "Show hidden" rule).
   - No change to infinite-scroll loading logic — saved videos are appended client-side on top of whatever pages are loaded.

## Non‑goals
- No changes to other feeds (Channel page, Search, Saved page).
- No DB schema changes; this is purely a UI/state preference.
- No business-logic changes to subscriptions, tiers, or campaigns.
