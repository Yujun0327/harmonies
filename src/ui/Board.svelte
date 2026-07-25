<script lang="ts">
  import { SIDE_A } from '../data'
  import { hexToPixel, parseHex } from '../engine'
  import type { HexId, PlayerState } from '../engine'

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

  const COLOR: Record<string, string> = {
    gray: '#8d94a1',
    blue: '#5b8fd6',
    brown: '#8a5a33',
    green: '#4e8f4a',
    yellow: '#d9b23e',
    red: '#c05040',
  }

  const geo = $derived.by(() => {
    const centers = SIDE_A.map((id) => {
      const [q, r] = parseHex(id)
      return { id, ...hexToPixel(q, r, size) }
    })
    const pad = size * 1.4
    const minX = Math.min(...centers.map((c) => c.x)) - pad
    const minY = Math.min(...centers.map((c) => c.y)) - pad
    const w = Math.max(...centers.map((c) => c.x)) - minX + pad
    const h = Math.max(...centers.map((c) => c.y)) - minY + pad
    return { centers, minX, minY, w, h }
  })

  function hexPoints(cx: number, cy: number): string {
    // flat-top hexagon
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i
      return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`
    }).join(' ')
  }

  const lift = $derived(size * 0.22) // vertical offset per stacked token
</script>

<svg viewBox="{geo.minX} {geo.minY} {geo.w} {geo.h}" class="board" class:compact role="img" aria-label="personal board">
  {#each geo.centers as c (c.id)}
    {@const stack = player.board[c.id] ?? []}
    {@const cube = player.cubes[c.id]}
    {@const hot = highlights.has(c.id)}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g
      class="hex"
      class:clickable={hot && onHexClick}
      onclick={() => hot && onHexClick?.(c.id)}
      onkeydown={(e) => e.key === 'Enter' && hot && onHexClick?.(c.id)}
      role={hot && onHexClick ? 'button' : undefined}
      tabindex={hot && onHexClick ? 0 : undefined}
    >
      <polygon
        points={hexPoints(c.x, c.y)}
        class="cell"
        class:hot
      />
      {#each stack as token, i (i)}
        <circle
          cx={c.x}
          cy={c.y - i * lift}
          r={size * 0.62}
          fill={COLOR[token]}
          stroke="#00000055"
          stroke-width="1.5"
        />
      {/each}
      {#if cube}
        <rect
          x={c.x - size * 0.2}
          y={c.y - (stack.length - 1) * lift - size * 0.2 - size * 0.5}
          width={size * 0.4}
          height={size * 0.4}
          class="cube"
        />
      {/if}
    </g>
  {/each}
</svg>

<style>
  .board {
    display: block;
    width: 100%;
    height: auto;
  }
  .cell {
    fill: #efe9da;
    stroke: #b8ad94;
    stroke-width: 1.5;
  }
  .hot {
    fill: #d8e6c3;
    stroke: #5b7a3a;
    stroke-width: 3;
  }
  .clickable {
    cursor: pointer;
  }
  .cube {
    fill: #f5f0e4;
    stroke: #4a4436;
    stroke-width: 1.5;
    rx: 2;
  }
  .compact .cell {
    stroke-width: 1;
  }
</style>
