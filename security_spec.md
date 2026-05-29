# Security Specification: Flodech Project Chat

## 1. Data Invariants
- A message cannot exist without a valid `projectId`.
- A message cannot exist without a valid `senderId`.
- Only members of a project (the owner or the client) should be able to read/write messages in a project's chat.
- Messages must be immutable once created (except for maybe deletion by owner).

## 2. The "Dirty Dozen" Payloads
1. Message with missing `projectId`.
2. Message with missing `senderId`.
3. Message with missing `message`.
4. Message with missing `timestamp`.
5. Message with missing `messageType`.
6. Message body exceeding 5000 characters.
7. Message with an ID longer than 128 characters.
8. Message with an invalid `senderId`.
9. Message from a user who is not part of the project (Freelancer vs Client).
10. Message with a fake `timestamp` (future time).
11. Message with a fake `senderId`.
12. Attempt to update an existing message.

## 3. Test Runner
(I will implement this in `firestore.rules.test.ts`)
