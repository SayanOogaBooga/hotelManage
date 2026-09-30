## Date Picker Rules
- Check-In dates must always be restricted to today or later (no past dates).
- Check-Out dates must always be restricted to the selected Check-In date or later (cannot be before Check-In).
- Beware of the midnight time bug: When comparing or setting dates, ensure you account for timezone offsets causing dates to shift to the previous or next day at midnight. Use precise date logic or strip times when comparing local dates.

## Workflow & Documentation
- **Changelog Maintenance**: After implementing any new feature, bug fix, or significant change, you MUST document it in the `CHANGELOG.md` file located at the project root. This ensures a persistent history of modifications and improvements over time.
