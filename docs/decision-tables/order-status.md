# Order Status Decision Table

| Current status | Action | Required role/module | Next status | Side effects |
| --- | --- | --- | --- | --- |
| pending | confirm | orders:update | confirmed | audit log |
| pending | hold | orders:update | held | audit log, risk note |
| pending | cancel | orders:update | cancelled | restock items, email_outbox |
| confirmed | prepare | orders:update | preparing | audit log |
| confirmed | cancel | orders:update | cancelled | restock items, refund if paid |
| preparing | ship | orders:update | shipping | tracking fields required |
| shipping | complete | orders:update | completed | close fulfillment |
| held | resume | orders:update | confirmed/preparing | audit log |
| completed | any manual change | super_admin override only | unchanged | reject by default |
| cancelled | any manual change | super_admin override only | unchanged | reject by default |

Payment exception rules:

| Payment status | Admin action | Result |
| --- | --- | --- |
| error | mark paid | `payment_status = paid` with resolution note |
| error | mark failed | `payment_status = failed` |
| paid + cancelled | create refund | `refund_status = pending_refund` |
| unpaid + cancelled | no refund | `refund_status = no_refund` |
