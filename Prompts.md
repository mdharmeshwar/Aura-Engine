# Prompts.md

This file documents the AI assistance prepared for the Aura Engine implementation.

## Scope
- Build a Sprint 18 inventory application with an Express + MongoDB backend and a professional React operations dashboard.
- Focus on secure validation, analytics aggregation, pagination, seeding, frontend API integration, and testability.

## Prompt used to design the inventory query engine
"Design a safe inventory query API for an Express + MongoDB backend. It must accept only allowlisted query parameters, validate page and limit inputs, support search over productName and sku, and filter by category and numeric ranges. Return paginated results with metadata, stable sort keys, and explicit validation errors. Avoid arbitrary MongoDB operators and unsafe user input."

## Prompt used to design the MongoDB aggregation pipeline
"Create a MongoDB aggregation pipeline for inventory analytics. It should compute summary KPIs, category valuations, and the top restock-priority products without pulling all documents into Node.js. Include realistic ordering and grouping logic consistent with a commercial inventory dashboard."

## Prompt used to design Zod validation and business rules
"Create a Zod schema for inventory product creation and updates. Enforce non-empty strings, nonnegative price/cost, integer stock counts, price >= cost, and duplicate-safe SKU handling. Return field-specific validation messages and keep malformed input out of the database."

## Prompt used to optimize indexing and query performance
"Recommend MongoDB indexes for product search and inventory filters. Explain trade-offs between regex searches, case-insensitive matching, and text indexes. Keep indexes minimal while supporting high-volume listing queries and analytics. Include notes about skip-based pagination limitations and future cursor-based pagination opportunities."

## Prompt used to generate automated tests
"Generate Jest and Supertest tests for a MongoDB-backed CRUD inventory API. Cover happy-path create/update/list behavior, validation failures, duplicate SKU conflicts, not-found handling, and analytics results using an isolated MongoDB memory database."

## Prompt used to design the dashboard
"Build a polished inventory operations dashboard in React that consumes the inventory API, supports product search/category filtering/sorting/pagination, allows product creation and deletion, displays inventory KPIs, restock alerts and category valuation, and exports a useful CSV report. Keep navigation controls functional and make empty and error states clear."

## Important implementation decisions
- Used regex with case-insensitive matching because MongoDB text indexes are not required for the MVP and support case-insensitive search over productName and sku without requiring a full-text index.
- Kept a dedicated unique SKU index and supporting indexes for category, productName, and one category-driven sort combination.
- Used server-side pagination with skip/limit for the MVP, while documenting that cursor-based pagination would be better at very large offsets.
- Centralized validation and error handling to keep API responses consistent and production-safe.
- Restock priority includes only products whose stock is at or below their reorder level, ordered from most urgent stock first.
- The dashboard CSV report includes summary metrics and the products currently visible in the inventory page.

## Verification status
- Manually verified: project structure, configuration, API wiring, validation flows, and route-level behavior.
- Frontend production build and lint checks are used to verify dashboard changes.
- Automatically tested: create, update, list, validation, duplicate SKU, not-found, and analytics behavior in a MongoDB memory database when the test database starts successfully.
- Remaining unverified: full 50,000-product seeding against a live MongoDB deployment and production hosting metrics due environment and external database requirements.
