# Nextcloud Calendar Analysis

Reference: https://github.com/nextcloud/calendar

## What Was Adopted

- FullCalendar as the calendar rendering engine.
- URL-driven calendar state: `/:view/:firstDay`.
- Separate domain objects for calendars and events.
- Sidebar calendar source list.
- Dedicated event details panel.
- AI-agent guidance that lists commands, architecture, and ownership boundaries.

## What Was Not Copied

Nextcloud Calendar is AGPL licensed and built as a Vue/Nextcloud app. This project keeps a React/Vite implementation and only ports product and architectural ideas that are common calendar-app patterns.

## Future Parity Targets

- Event creation and editing modal.
- Calendar visibility state and persistence.
- CalDAV/WebCal synchronization services.
- Recurring events and exceptions.
- Free/busy and availability.
- Unit tests for date routing and event mapping.
