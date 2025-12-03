# raf-signal

**Shared requestAnimationFrame scheduler**

A tiny scheduler that coalesces all `requestAnimationFrame` subscribers into one frame loop.

Reduce main thread overhead. Eliminate redundant rAF calls. Get predictable, stable frame updates.

## Why raf-signal?

Browsers allow to call `requestAnimationFrame()` anywhere: UI components, physics systems, stores, animations, WebGL render loops.

> Problem: each call schedules its own micro task, its own frame callback and its own cancellation cost.

With many independent subscribers (React components, stores, animations), this leads to:

- excessive main thread overhead
- jank when callbacks pile up
- unpredictable frame budgets
- wasted CPU + battery

raf-signal fixes this by creating ONE shared animation loop and broadcasting the frame timestamp to all subscribers.

> Whether you register 1 callback or 10,000, the browser only runs one rAF cycle.

## Features

- Single rAF loop for any number of subscribers
- Automatic start/stop (zero overhead when idle)
- Pause/resume built-in
- `once()` for one time frame execution
- Zero dependencies

## Installation

```bash
npm install raf-signal
```

## Usage

### Subscribe to frame updates

```ts
import { subscribe } from "raf-signal";

const sub = subscribe((time) => {
  console.log("frame:", time);
});

sub.unsubscribe();
```

### Run one frame only

```ts
import { once } from "raf-signal";

once((time) => console.log("first frame:", time));
```

### Pause & resume

```ts
import { pause, resume } from "raf-signal";

pause();
resume();
```

### Get active subscriber count

```ts
import { getSubscriberCount } from "raf-signal";

console.log(getSubscriberCount());
```

## API

```ts
type RafCallback = (time: number) => void;

interface RafSubscription {
  unsubscribe(): void;
}

function subscribe(callback: RafCallback): RafSubscription;
function once(callback: RafCallback): void;
function pause(): void;
function resume(): void;
function getSubscriberCount(): number;
```

## Game Dev Use Cases

Game engines are built on centralized frame loops. When you build modular gameplay systems in JavaScript environments, each system tends to request its own rAF:

- physics update
- sprite updates
- animation interpolators
- camera tracking
- particle system updates

Individually they all call `requestAnimationFrame()` leading to uncoordinated frame processing.

With raf-signal, we get:

- one unified tick
- deterministic ordering
- less frame drift
- lower input latency
- more predictable render budget
- fewer GC pauses

## Example: central game loop

```ts
import { subscribe } from "raf-signal";

const systems = [updatePhysics, updateParticles, updateEnemies, updateCamera];

subscribe((time) => {
  for (const system of systems) system(time);
});
```

## Acknowledgements

Inspired by frame loop consolidation patterns used in game engines and Canvas based animations.
