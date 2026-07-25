<script lang="ts">
  import { SIDE_A } from '../data'
  import { hexToPixel, parseHex } from '../engine'
  import type { HexId, PlayerState, TokenColor } from '../engine'
  import TokenStack from './TokenStack.svelte'
  import { wobblyHex } from './wobble'

  interface Props {
    player: PlayerState
    /** Hex circumradius in SVG units; the board scales to its container. */
    size?: number
    /** Hexes to highlight as legal targets. */
    highlights?: Set<HexId>
    onHexClick?: (hex: HexId) => void
    compact?: boolean
  }

  const { player, size = 34, highlights = new Set(), onHexClick, compact = false }: Props = $props()

  const geo = $derived.by(() => {
    const centers = SIDE_A.map((id) => {
      const [q, r] = parseHex(id)
      return { id, ...hexToPixel(q, r, size) }
    })
    const pad = size * 1.5
    const minX = Math.min(...centers.map((c) => c.x)) - pad
    const minY = Math.min(...centers.map((c) => c.y)) - pad
    const w = Math.max(...centers.map((c) => c.x)) - minX + pad
    const h = Math.max(...centers.map((c) => c.y)) - minY + pad * 1.15
    return { centers, minX, minY, w, h }
  })

  /** Sort so taller/lower stacks paint over the cells behind them. */
  const drawOrder = $derived([...geo.centers].sort((a, b) => a.y - b.y))
</script>

<svg
  viewBox="{geo.minX} {geo.minY} {geo.w} {geo.h}"
  class="board"
  class:compact
  role="img"
  aria-label="personal board"
>
  <!-- ground pass: every cell outline -->
  {#each geo.centers as c (c.id)}
    {@const hot = highlights.has(c.id)}
    {@const empty = (player.board[c.id]?.length ?? 0) === 0}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g
      class="hex"
      class:clickable={hot && onHexClick}
      onclick={() => hot && onHexClick?.(c.id)}
      onkeydown={(e) => e.key === 'Enter' && hot && onHexClick?.(c.id)}
      role={hot && onHexClick ? 'button' : undefined}
      tabindex={hot && onHexClick ? 0 : undefined}
    >
      <path d={wobblyHex(c.x, c.y, size * 0.94, size * 0.055)} class="cell" class:hot />
      {#if empty && !hot}
        <circle cx={c.x} cy={c.y} r={size * 0.05} class="dot" />
      {/if}
    </g>
  {/each}

  <!-- token pass: stacks painted back-to-front so lifts overlap naturally -->
  {#each drawOrder as c (c.id)}
    {@const stack = player.board[c.id] as TokenColor[] | undefined}
    {#if stack && stack.length > 0}
      <g class="stack-layer">
        <TokenStack {stack} {size} cx={c.x} cy={c.y} hasCube={player.cubes[c.id] !== undefined} animate={!compact} />
      </g>
    {/if}
  {/each}
</svg>

<style>
  .board {
    display: block;
    width: 100%;
    height: auto;
  }
  .cell {
    fill: var(--paper-deep);
    stroke: var(--line);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .hot {
    fill: rgb(91 122 58 / 0.16);
    stroke: var(--moss);
    stroke-width: 2;
  }
  .clickable {
    cursor: pointer;
  }
  .clickable:hover .cell {
    fill: rgb(91 122 58 / 0.28);
  }
  .dot {
    fill: var(--line);
  }
  .stack-layer {
    pointer-events: none;
  }
  .compact .cell {
    stroke-width: 1;
  }
</style>
