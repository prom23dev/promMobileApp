# MASTER5: mobile commerce architecture, 11 September 2026

The baseline is published V8; audit snapshots precede deployment. Product hierarchy: find → select → price/availability → add → cart in one tap. Company proof supports both retail and procurement, never replaces commerce.

## Foundation

Five independent retained tab stacks: Home, Catalog, Cart, Saved, Account. Shared product/content/form screens inherit the originating stack. Cold shared links enter Home. Native/browser back returns through the stack; tab changes preserve it. Checkout is explicitly immersive; gallery uses a modal. No additional site menu masquerading as search. Header: authentic company wordmark + selected settlement, search on commerce only; content uses Back/title/support.

## Visual decision

Existing verified brand primitives: navy #3D4471, ink #202338, orange #D93916, white #FFFFFF, cool surface #F5F6F8, secondary #626679. The signature is real industrial equipment/objects inside a compact switchable media panel, not a large landing hero. No generated claims about factory equipment. iOS uses system SF, Android system Roboto: stable locally available platform typography, 20–26 display, 16 section, 15 body, 12 caption, 22–28 price. Database font suggestions Poppins/Open Sans were rejected for Cyrillic/system performance and app continuity. No remote font request.

```
[ company       settlement ]
[          search          ]
[ compact production proof ]
[ categories →             ]
[ popular products         ]
[ product      product     ]
[ Home Catalog Cart Saved Me ]
```

## Density and action hierarchy

Card order: image → name → price → availability → short payment/delivery information → add. Partner benefits remain secondary; unknown bonus/payment figures are never invented. White text primary orange action >=48px; secondary soft surface; tertiary link row. In-stock and quotation are distinct states. Tall photo/text landings are not used for commerce.

## Motion and evidence

Short scene transitions, add state change, cart-badge spring. Respect reduce-motion. Gallery supports explicit controls and pinch gesture; keyboard zoom buttons provide non-gesture alternative. Skeleton initialization has no artificial delay. Web screenshot/device emulation checks are not claims of device lab or signed native binary tests. Each unresolved runtime dependency is listed separately from source-contract/UI coverage.
