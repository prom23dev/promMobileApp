# Profile and address runtime parity — 12.09.2026

Scope is exactly13 source registry IDs from `integrations/runtime/form-contracts.json`:

| ID | Source fields/handler | Driver behavior |
|---|---|---|
| profile-name | change-user-data.php, name→NAME | Actor-owned single-field CUser update; preserves email/phone/surname/city. |
| profile-surname | change-user-data.php, last_name→LAST_NAME | Same isolated field update; does not repeat source conditional bug that checks name before surname. |
| profile-city | city→PERSONAL_CITY | Requires structured `{settlementId,version}`, BFF current-location CAS and exact runtime GAR→Sale mapping. Verified name stored in PERSONAL_CITY, identity separately in private `prom23_profile_locations`. No fabricated UF fields. |
| profile-email | change-email-get-code-action.php | Source email/login uniqueness check; CheckedConfirmationCodes email acceptance; encrypted server ChallengeVault. |
| profile-email-otp | change-email-check-code-action.php | Six digits, owner/context/contact-version-bound challenge; both source validateCode and validateHashChangeDataUser consumed before EMAIL+LOGIN update. |
| profile-phone | change-phone-get-code-action.php | Russian 7/8 normalization to ten-digit UF_PHONE; source UF_PHONE/LOGIN uniqueness; same checked challenge. |
| profile-phone-otp | change-phone-check-code-action.php | Same confirmed update; UF_PHONE and source LOGIN preference (existing email, otherwise7+phone), other fields untouched. |
| profile-passport | gosuslugi.php, unnamed controls, no handler | Existing read-only description remains. Submission explicitly SOURCE_LEGACY_UNAVAILABLE. No passport collection invented. |
| address-create | add-address-action.php, full_address | Exact source AddressDeliveryUsersTable; FULL_ADDRESS separate from verified LOCATION_CODE/ZIP; current USER_ID/ORGANIZATION_ID; actual record ID. |
| address-edit | same, change_address_id | Current target.addressId owner/context query, revision, same separated fields. |
| address-default | change-main-address.php, address_id | Resets only current user+organization main address and sets selected owned record inside source DB transaction. |
| address-delete | remove-address-action.php, address_id | Same owner/context check; ORM result checked, no false success on missing/failed record. |
| notification-preferences | notifications.php | Four actual user UF flags plus source subscription rubrics; strict booleans, actual CSubscription result check, SEND_CONFIRM=N. No promotional message sent. |

Source details read: `local/class/Models/User.php:73–185`, `AddressDeliveryUsers.php`, `Subscription.php`; profile contact issue/verify handlers; `ConfirmationCodes::validateCode` and `validateHashChangeDataUser`. The broad legacy change-user-data handler overwrites other values and has surname/city guards dependent on name; the driver preserves capability while avoiding these source defects.

`ProfileDriver::run(operation,payload,actor)` accepts forms.context/forms.submit. FormsDriver delegates these13 IDs before generic SourceHttp handling. Actor comes only from the signed dispatcher and fresh user/membership checks. A second check rejects forged session/context in the driver. A business intent draft without a verified organization cannot mutate personal saved addresses; ordinary profile contact/notification settings remain user-owned, matching source models.

Context revision hashes the source form, actor, current relevant values, address record and challenge identity. A stale revision does not overwrite a concurrent edit. OTP pending state binds user ID, organization ID and existing EMAIL/UF_PHONE/LOGIN fingerprint. No OTP/hash/password appears in client URLs or a response. Failed code provider acceptance does not return a next-step claim. Source rate and attempt limits remain active.

Required runtime configuration:

- Existing dispatcher formContracts, enabledForms, source-secret replacement guard and HMAC request/session binding.
- AuthDriver's `ChallengeVault` and `CheckedConfirmationCodes`; profile OTP uses these public classes without modifying auth logic.
- Root LocationDriver resolves an exact GAR UUID through installed Sale external mappings; no free-text city-name fallback. BFF validates values.location against its current selection/version before PHP.
- Source CUser fields, AddressDeliveryUsersTable and subscription module/rubric constants.
- Private PDO for the profile GAR sidecar. Source PERSONAL_CITY and sidecar are two databases: source DB transaction is rolled back if sidecar write fails, but a failure of the final source commit requires reconciliation. This is an explicit target-runtime acceptance item, not a distributed atomicity claim.

Strict notification booleans distinguish unchecked false from omitted/string truthiness. The driver mirrors source subscription rubric updates and suppresses confirmation sending. Legal approval of advertising consent/withdrawal and actual subscription provider delivery remain separate acceptance items; code does not label a preferences update as message delivery.

Tests: `integrations/runtime/test/ProfileDriver.test.php` contains isolated CUser/address/Location doubles and policy assertions (exact field updates, ownership, revisions, structured identity, challenge scope). It never loads Bitrix or sends email/SMS. Actual OTP sender, target CUser/subscribe DB and profile sidecar persistence are explicitly SKIP in this environment; final isolated CLI result is recorded after root execution. **No live production acceptance is claimed.**
