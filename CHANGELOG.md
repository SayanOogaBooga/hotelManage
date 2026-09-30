# Features & Changelog

This document tracks new features, improvements, and bug fixes added to the Hotel Management System.

## [2026-09-30]
### Added / Improved
- **Calendar Availability Highlights**: `DatePicker` and `Calendar` components now dynamically fetch and visually highlight available (glowing green) and fully booked (red stripe pattern) dates when searching for room availability.
- **Calendar Grid Breathing Space**: Added uniform gap spacing to the calendar's day grid for better visual layout and un-stacked hover animations.
- **Receipt Print Optimizations**: 
  - Optimized the PDF receipt generation by switching `html-to-image` rendering from uncompressed PNG to 80% quality JPEG, reducing the resulting file size by over 95% (from ~10MB down to <2MB) without losing crispness.
  - Prevented absolute text overlap in the receipt print layout by reorganizing the right-side address and contact numbers into a more compact format.
  - Removed "Retreat" from the receipt header and updated the location address to "Sillary Gaon, Kalimpong - 734314".
- **Midnight Time Bug Defense**: Added centralized documentation in `AGENTS.md` to prevent local timezone offset bugs when manipulating check-in/out dates, and utilized safe `setHours(0,0,0,0)` date-math in the availability checker.
