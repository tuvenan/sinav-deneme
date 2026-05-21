# Security Specification for Firestore Security Rules

## 1. Data Invariants

1. **Namespace Isolation**: All data collections (`solve_history`, `resources`, `completed_resources`) reside nested under their respective parent `/users/{userId}` document. Users are authorized to read or write metadata strictly inside their own namespace (`request.auth.uid == userId`).
2. **Strict Identity Binding**: Profile attributes like `name` and identity-defining properties cannot be spoofed. Operations requesting resource writes must verify `request.auth.uid == userId`.
3. **No Update Gaps / Exact Keys**: Creating a user profile or resource requires precise fields. Shadow field injections or ghost properties (e.g., injecting an unwhitelisted state modifier) are strictly rejected.
4. **Time Sync Guard (TEMPORAL INTEGRITY)**: Timestamp properties (such as `updatedAt` on user settings or `solvedAt` on solve history) must match the reliable atomic server time `request.time` exactly.
5. **Denial of Wallet Countermeasures**: All string types are bounded with strict `.size()` enforcements (e.g. name length `<= 100`, high school name `<= 200`, string values `<= 500`).
6. **Immutable Integrity**: Critical identifiers like `questionId` on solve history or `id` on resources cannot be changed or overridden on updates.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent malicious attempts to bypass identity, structure, or state checks:

### Payload 1: PII Leak Attempt (Identity Spoofing)
*   **Attack**: An authenticated user `attacker123` tries to fetch or write the profile of user `victim456`.
*   **Expected Result**: `PERMISSION_DENIED` (Namespace check fails).

### Payload 2: Ghost Field Injection (Shadow Profile Attribute)
*   **Attack**: User tries to create/update profile with a non-whitelisted property `isAdmin: true` or `systemClearance: "all"`.
*   **Expected Result**: `PERMISSION_DENIED` (Exact keys size and strict update hasOnly checks).

### Payload 3: Spoofed Server Timestamp (Temporal Integrity Breach)
*   **Attack**: User sets `updatedAt` to a historical or future client value (`"2040-01-01T00:00:00Z"`) instead of using Firestore's server-assigned placeholder value.
*   **Expected Result**: `PERMISSION_DENIED` (Requires `request.time`).

### Payload 4: Overlong String Attack (Denial of Wallet)
*   **Attack**: Injecting an insanely large 4MB string into the `name` field to cause massive storage cost explosion.
*   **Expected Result**: `PERMISSION_DENIED` (Field size threshold check fail).

### Payload 5: Empty Identification Abuse (Resource Poisoning)
*   **Attack**: User uploads a Resource with an empty string or insanely long random character set as document ID.
*   **Expected Result**: `PERMISSION_DENIED` (Document ID fails `isValidId` sanity regex or size check).

### Payload 6: Unverified Email Auth Spoof
*   **Attack**: Attempting profile reads or writes when `token.email_verified` is falsy (where verification is mandated check).
*   **Expected Result**: `PERMISSION_DENIED`.

### Payload 7: Immutable Field Alteration
*   **Attack**: Trying to rename the `questionId` of an existing solved question document.
*   **Expected Result**: `PERMISSION_DENIED` (Requires `incoming().questionId == existing().questionId`).

### Payload 8: Direct Database Query Scraping
*   **Attack**: Client tries to retrieve all user database records using a blanket list query without binding the query to their authenticated user ID.
*   **Expected Result**: `PERMISSION_DENIED` (Rule enforces `resource.data.userId == request.auth.uid` or nested lookup blocks).

### Payload 9: Action Short-Circuiting (Role Escalation)
*   **Attack**: A non-admin user attempts to upgrade their `membershipType` to `Premium LGS Şampiyon` inside profile update directly, skipping payment validations.
*   **Expected Result**: `PERMISSION_DENIED` (Updates restricting the escalation paths via `affectedKeys()`).

### Payload 10: Sibling Document Decoupling (Atomicity Breach)
*   **Attack**: Attempting to log a completed resource record without verifying corresponding resource catalog existence.
*   **Expected Result**: `PERMISSION_DENIED` (Exists validation checked).

### Payload 11: Non-Structured Array Insertion
*   **Attack**: Initializing list elements inside fields with heterogeneous types (e.g., injection of objects inside string lists).
*   **Expected Result**: `PERMISSION_DENIED` (Type matching checks).

### Payload 12: Anonymous Access Escalation
*   **Attack**: Unauthenticated client attempts to query user metrics.
*   **Expected Result**: `PERMISSION_DENIED` (`request.auth != null` check fails).

---

## 3. Test Runner Concept (firestore.rules.test.ts)

A TypeScript test suite utilizing the `@firebase/rules-unit-testing` framework can be established to verify rejection of the above payloads.
`PERMISSION_DENIED` is expected on every single unauthorized and non-compliant operation.
