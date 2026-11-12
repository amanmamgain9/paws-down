#!/bin/sh
# Starts the server and the wingcats together, for a hosted demo.
set -e

PORT="${PORT:-4000}"
export PORT

# Without PayPal sandbox credentials the demo runs in practice mode, and every screen says so.
if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_CLIENT_SECRET" ]; then
  export PAWS_DOWN_PRACTICE=1
fi

# The wingcats talk to the server inside the same container. They retry until it is up.
PAWS_DOWN_URL="http://localhost:$PORT" npm run -s wingcats &

exec npm run -s server
