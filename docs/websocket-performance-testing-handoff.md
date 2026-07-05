# WebSocket Performance Testing Handoff

## Scope

This document captures the implemented WebSocket behavior in this codebase and the performance test plan built around it. It is intended as a handoff for a later model or engineer.

## Actual Implementation Summary

### Backend topology

- Three FastAPI backend instances are defined in `docker-compose.yml`:
  - `backend1` on `localhost:4001`
  - `backend2` on `localhost:4002`
  - `backend3` on `localhost:4003`
- NGINX listens on `localhost:8080` and load-balances `/ws` across all three backends.
- PostgreSQL is shared by all backends.
- Redis is shared by all backends and is used for pub/sub message fanout.

### WebSocket flow

- The WebSocket handler is `@websocket_router.websocket("/ws")`.
- After connection is accepted, the server expects the first JSON message to be:

```json
{
  "type": "auth",
  "content": "<JWT_TOKEN>"
}
```

- If the first message is not `auth`, or the token is missing/invalid/expired, the server responds with an error and closes the connection.
- After auth succeeds, the backend sends:

```json
{
  "type": "auth_success",
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

- Message loop behavior:
  - `ping` => `pong`
  - `message` => validate fields, save to DB, send to receiver if online, publish to Redis, then reply to sender with `message_sent`

### Important field name

The backend expects `reciever_id` exactly as spelled in code.

This is the exact validation branch:

```python
elif data.get("type") == "message":
    content = data.get("content")
    reciever_id = data.get("reciever_id")
    logger.info(f"message from user {user_id} to {reciever_id}")

    if not content or not reciever_id:
        await websocket.send_json(
            {"type": "error", "content": "Missing content or reciever_id"}
        )
        continue
```

## Frontend WebSocket Behavior

### Client connection flow

- The React hook opens the socket to:

```text
ws://<host>/ws
```

- On `onopen`, it immediately sends the auth message:

```json
{
  "type": "auth",
  "content": "<access_token>"
}
```

- Chat send payload from the frontend is:

```json
{
  "type": "message",
  "reciever_id": <receiverId>,
  "content": "<message text>"
}
```

### Message parsing on the client

The client expects these server message types:

- `auth_success`
- `error`
- `message_sent`
- `new_message`
- `pong`

## JMeter Setup Used for Testing

### Required plugin

- Install the JMeter WebSocket plugin before running tests.
- Use the WebSocket Samplers plugin that provides:
  - WebSocket Open Connection
  - WebSocket Single Write Sampler
  - WebSocket Single Read Sampler

### Standard test plan structure

1. Thread Group
2. CSV Data Set Config
3. WebSocket Open Connection
4. WebSocket Single Write Sampler for auth
5. WebSocket Single Read Sampler for `auth_success`
6. Timer if needed
7. WebSocket Single Write Sampler for chat message
8. WebSocket Single Read Sampler for `message_sent`
9. Optional WebSocket Single Read Sampler for `new_message`
10. Listeners only in smoke/debug runs

### CSV structure

Use a CSV with at least these columns:

```csv
user_id,token,receiver_id,backend_url
1,eyJhbGciOi...,2,ws://localhost:8080/ws
2,eyJhbGciOi...,1,ws://localhost:8080/ws
3,eyJhbGciOi...,4,ws://localhost:4001/ws
4,eyJhbGciOi...,3,ws://localhost:4002/ws
```

Rules:

- `user_id` is the sender.
- `token` must belong to that sender.
- `receiver_id` must be a real user id and must not equal `user_id`.
- `backend_url` is used to target either NGINX or a specific backend instance.

### Exact payloads

Auth payload:

```json
{
  "type": "auth",
  "content": "${token}"
}
```

Message payload:

```json
{
  "type": "message",
  "reciever_id": ${receiver_id},
  "content": "Hello from ${user_id}"
}
```

Ping payload:

```json
{
  "type": "ping"
}
```

## Test Matrix

### 1. Smoke Test

Objective:

- Validate the full happy path with minimal load.

How it was done:

- 10 threads
- Ramp-up: 10 seconds
- Loop count: 1
- Open connection to `/ws`
- Send auth payload first
- Read `auth_success`
- Send one message payload using `reciever_id`
- Read `message_sent`

Assumed output:

- All threads authenticate successfully.
- Each sender gets `auth_success` and `message_sent`.
- No `Missing content or reciever_id` errors.

### 2. Connection Scaling Test

Objective:

- Measure how many concurrent authenticated sockets the three backend instances can hold.

How it was done:

- Runs at 100, 250, 500, 750, and 1000 threads.
- Ramp-up increases with thread count.
- After auth, keep sockets open and send only periodic `ping` frames.
- Target either `ws://localhost:8080/ws` for load balancing or direct backend ports for instance comparison.

Assumed output:

- NGINX distributes new connections across backend1, backend2, and backend3.
- Auth latency increases gradually as the connection count rises.
- First failure point is likely connection establishment or memory pressure, not message validation.

### 3. Concurrent Messaging Test

Objective:

- Measure message throughput and message ack latency under concurrent chat activity.

How it was done:

- 100 sender threads and 100 receiver threads.
- Auth first, then repeated message send / read cycles.
- Sender waits for `message_sent` after each send.
- Receiver waits for `new_message` if running as a paired receiver.

Assumed output:

- Sender receives `message_sent` for most sends.
- Receiver receives `new_message` when online on the same or another backend instance.
- Latency rises as DB and Redis traffic increase.

### 4. Redis Pub/Sub Load Test

Objective:

- Verify that message fanout works across backend instances and measure Redis as a bottleneck.

How it was done:

- Sender and receiver are intentionally routed to different backend ports.
- Sender sends message to a receiver connected on another backend.
- Redis should carry the pub/sub event to the receiver backend.

Assumed output:

- Sender still receives `message_sent`.
- Receiver still receives `new_message` across instance boundaries.
- If Redis becomes slow, delivery latency increases before complete failure.

### 5. PostgreSQL Write Load Test

Objective:

- Measure the insert path under sustained chat traffic.

How it was done:

- 100, 250, and 500 sender threads in separate passes.
- Each message triggers one insert into `messages`.
- `message_sent` is the main sender-side signal of write-path health.

Assumed output:

- Stable latency at low and moderate load.
- Latency and error rate rise once the DB pool or storage I/O becomes saturated.

### 6. Spike Test

Objective:

- Measure behavior when users join or leave in a sudden burst.

How it was done:

- Baseline run at low concurrency.
- Sudden jump to a much higher thread count.
- Then return to baseline.
- Keep sockets open, authenticate, and optionally ping during the spike.

Assumed output:

- Short-term latency spike.
- Some delayed auth or reconnects.
- System should recover to baseline if no hard resource limit is hit.

### 7. Endurance / Soak Test

Objective:

- Detect memory leaks, connection leaks, and token-related failures over time.

How it was done:

- 100 threads.
- Long scheduler duration.
- Persistent WebSocket connections.
- Periodic `ping` messages.
- Optional periodic chat messages.

Important note:

- Access tokens default to 30 minutes in this codebase.
- Long soak tests need token refresh or reconnection using fresh tokens.

Assumed output:

- Latency remains roughly stable early on.
- Memory may drift upward if there is a leak.
- Token expiry causes failures if refresh is not handled.

### 8. Volume Test

Objective:

- Measure the effect of larger message payloads.

How it was done:

- Separate runs with small, medium, and large message bodies.
- Same auth-first flow.
- Same `message` payload shape, only content size changes.

Assumed output:

- Small messages are fastest.
- Large messages increase latency but should still pass if the path is healthy.

### 9. Backend Instance Comparison

Objective:

- Compare backend1, backend2, and backend3 directly.

How it was done:

- Separate JMeter runs against `ws://localhost:4001/ws`, `ws://localhost:4002/ws`, and `ws://localhost:4003/ws`.
- Another run against `ws://localhost:8080/ws` for NGINX-balanced behavior.

Assumed output:

- Direct instance runs should be broadly similar.
- Any one backend that is materially slower suggests instance-specific resource imbalance or environment issues.

### 10. Token Refresh / Expiry Test

Objective:

- Verify what happens when access tokens expire during a long-running test.

How it was done:

- Use the login endpoint to generate access tokens.
- Keep the refresh cookie in JMeter if you want to call `/auth/refresh`.
- Reconnect the WebSocket and send a fresh `auth` payload after renewal.

Assumed output:

- If refreshed correctly, the socket can re-authenticate and continue.
- If not refreshed, `Token expired` errors appear from the backend.

## Expected Error Cases Seen in This Codebase

- `first message not an auth token`
- `Missing token`
- `Invalid token`
- `Token expired`
- `User not found`
- `Missing content or reciever_id`
- `Failed to save message`

## Most Important Implementation Detail

If a test sends this payload:

```json
{
  "content": "Hello",
  "receiver_id": 2,
  "type": "message"
}
```

it will fail in this backend because the code expects `reciever_id`, not `receiver_id`.

Correct version:

```json
{
  "type": "message",
  "reciever_id": 2,
  "content": "Hello"
}
```

## Practical Ordering for Execution

Recommended order:

1. Smoke test
2. Connection scaling test
3. Concurrent messaging test
4. Redis pub/sub load test
5. PostgreSQL write load test
6. Spike test
7. Volume test
8. Endurance / soak test
9. Backend instance comparison
10. Token refresh / expiry test

## Notes for the Next Model

- Use only `reciever_id` in WebSocket chat payloads.
- Always auth first, then send chat messages.
- Use `ws://localhost:8080/ws` for realistic load-balanced tests.
- Use direct backend ports only when comparing individual backend instances.
- Keep small debug listeners only in smoke tests; disable them for heavy load.
- Treat token expiry as a real test condition because access tokens default to 30 minutes.