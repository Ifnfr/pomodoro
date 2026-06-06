# Security Specification

## Data Invariants
- A session cannot exist without a valid userId that matches the authenticated user.
- A session's durationMinutes must be a positive number.
- `timestamp` must be a valid number.
- Users can only read and write their own sessions.

## The "Dirty Dozen" Payloads
1. Unauthorized User: Try reading/writing without auth.
2. Cross-Tenant Access: Authenticate as User A, try writing to User B's path.
3. Missing Required Fields: Omit `mode` or `timestamp`.
4. Invalid Types: `durationMinutes` as string.
5. Large String Attack: `topic` over 1000 characters.
6. Role Escalation / Unknown Fields: Include `isPremium: true` in payload.
7. Modifying `userId`: Update `userId` to someone else's ID.
8. Invalid Document ID: Attempt to use path traversal or invalid characters in {sessionId} path.
9. Extreme Numbers: Set `durationMinutes` to 99999999.
10. Wrong `userId` in payload: Payload `userId` does not match auth `uid` nor path `userId`.
11. Update ID: Modifying the document ID within the data payload.
12. Invalid Enum: Set `mode` to "sleep".

