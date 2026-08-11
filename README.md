# centripetal-api

This is the Centripetal retrieve door: a branded HTTP entrance at
`https://api.centripetal-ai.com/v1/get` that forwards a `{key, entity, measure, period}`
request to the Centripetal retrieve function and returns its answer verbatim.

It holds zero access logic — no caching, no transformation, no authorization checks —
because the retrieve function itself is the perimeter that decides what an access key
may see; the door exists only to brand the address and keep the platform apikey
server-side in an environment variable.

Everything published under Centripetal is Centripetal: callers see one hostname, one
route, and one shape.

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/v1/get` | `POST` | Retrieve one measure. Body: `{key, entity, measure, period?}` |
| `/v1/health` | `GET` | Liveness. Returns `{"ok":true,"door":"centripetal-api"}` |

`POST /v1/get` returns `400` with a JSON error if `key`, `entity`, or `measure` is
missing, and `500 {"error":"door_not_configured"}` if the door's environment variable
is unset. Any other status and body come straight from the retrieve function.

CORS is open for `POST` with an `OPTIONS` preflight, so Excel / Power Query and the
add-in can call it from client contexts.

## Configuration

One environment variable, set on the deployment:

- `CUBE_ANON_KEY` — the publishable platform apikey the door sends upstream. It is
  never returned to callers and never committed to this repo.

## Excel

See [docs/recipe-v2.md](docs/recipe-v2.md) for the Power Query `CentGet` function.
