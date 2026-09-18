# IvanSays — Buy Ivan a Beer

A framework-independent mobile-first PWA intended for:

https://ivansays.com/beer

## What it does
- Mobile-first app-like page
- Installable PWA on supported mobile browsers
- Permanent share URL on ivansays.com
- QR code points to ivansays.com/beer, not directly to Stripe
- Stripe-hosted Checkout / Payment Link opens in a new browser tab
- Share and Copy Link actions
- No Stripe secrets or API keys in the frontend

## Stripe setup
Use a Stripe Payment Link configured as **Customers choose what to pay**.

Recommended:
- Title: Tip Ivan
- Description: A voluntary tip for IvanSays content, tools, and creative/technical work.
- Suggested amount: $7
- Minimum: $1
- Maximum: $100
- One-time payment only

Do not describe the Stripe transaction as the purchase or delivery of alcohol.
The public site can use the playful “Buy Ivan a Beer” theme, while the actual
payment remains a tip for content/services already provided.

## Install
Copy:

public/beer/

into your site's existing public directory.

Then edit:

public/beer/config.js

and replace:

https://buy.stripe.com/fZu5kCdpI69daNw3NI48002

with the real Stripe Payment Link.

Deploy normally.

## QR
public/beer/beer-qr.png

points to:

https://ivansays.com/beer

Keep that URL permanent. If Stripe changes later, only config.js changes.


## Live Stripe Payment Link

`https://buy.stripe.com/fZu5kCdpI69daNw3NI48002`
