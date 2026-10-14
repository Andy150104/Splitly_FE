// A same-origin probe that does not need a session or call the upstream API.
export function HEAD() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
