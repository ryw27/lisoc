# Some notes on academic seasons and class data model

## Overview

Every academic year consists of **three seasons**:

- **Fall**
- **Spring**
- **Whole-Year**

Each season contains both **registration classes** and **class sections**.  
Because this data changes infrequently (usually once or twice per year), it is a good candidate for caching.

---

## Core Data Requirements

When initializing or querying an academic term, the following data must be fetched and cached:

1. **Three Seasons** — the active academic year’s _Fall_, _Spring_, and _Whole-Year_ seasons.
2. **Registration Classes** — identified by `isregclass = true`, corresponding to a specific `seasonid`.
3. **Classrooms** — resolved through `classid` and `gradeclassid`, representing related classroom entities.

> **TODO:** Use **tag-based caching** (e.g., `unstable_cache` + `revalidateTag("three-seasons")`) to allow efficient invalidation when a new academic year becomes active.

---

## Season Structure and Relationships

Each season record uses `beginseasonid` and `relatedseasonid` to define its relationship to other seasons
Fall -> `beginseasonid`: fall_season_id, `relatedseasonid`: year_season_id
Spring -> `beginseasonid`: fall_season_id, `relatedseasonid`: year_season_id
Year -> `beginseasonid`: fall_season_id, `relatedseasonid`: year_season_id
