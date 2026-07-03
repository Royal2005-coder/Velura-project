# Account Administration Decision Table

| Condition | Action | Result |
| --- | --- | --- |
| new public signup | create profile | role `member`, page `welcome` only |
| active member | assign admin role | allowed only by account admin/super admin |
| target is last active super_admin | lock | reject |
| active account + valid reason | lock temporary | status `locked_temp` |
| active account + valid reason | lock permanent | status `locked_perm` |
| locked account + valid reason | unlock | status `active` |
| any admin mutation | success or failure | write `audit_logs` |

Validation:

- Lock/unlock reason should be at least 10 characters in API and should be at least 10 words in UI when BA requires stronger explanation.
- Email must be unique.
- Role code must exist in `app_roles`.
