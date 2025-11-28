# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-11-28

### Fixed
- **Critical bug**: Fixed date comparison that was causing OTD page to regenerate every time
  - Added missing parentheses to `today.getFullYear()`, `getMonth()`, and `getDate()` methods
  - Previously was comparing function references instead of values
  - This bug prevented the plugin from recognizing when it was already showing today's date
- Settings validation: Added validation for startingYear and pageTitle settings
  - startingYear must be between 1900 and current year
  - pageTitle cannot be empty
  - Invalid settings now show warning messages and use safe defaults

### Changed
- Improved error logging: Changed debug `console.log()` statements to proper `console.error()` calls
- Removed debug console output from production code
- Better error messages with more context for troubleshooting

### Dependencies
- Updated `@logseq/libs` from `^0.0.1-alpha.35` to `^0.0.17` (stable release)
- Removed incorrect `yarn` dependency from dependencies section

## [0.0.3] - 2023-XX-XX

### Added
- Jump to previous day or next day feature
- Settings to control jump button placement (pagebar vs toolbar)
- Settings to enable/disable jump functionality

### Changed
- Removed shortcut key registration to prevent conflicts

## [0.0.2] - Previous release

### Added
- Initial release with "On This Day" functionality
- Customizable starting year
- Customizable page title

## [0.0.1] - Initial release

### Added
- Basic "On This Day" functionality
- Display journal entries from previous years on the same date
- Toolbar button to generate/refresh the page
