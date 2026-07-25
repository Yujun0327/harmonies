<script lang="ts">
  import { fly } from 'svelte/transition'
  import { CHIP, chipFills, chipSidePath, topMotif, type ChipColor } from './chip-art'
  import { dur, settle } from './motion'

  interface Props {
    stack: ChipColor[]
    /** Hex circumradius the stack sits in. */
    size: number
    cx: number
    cy: number
    hasCube?: boolean
    /** Dashed ring marking a card's cube hex (pattern diagrams). */
    cubeRing?: boolean
    animate?: boolean
  }

  const { stack, size, cx, cy, hasCube = false, cubeRing = false, animate = true }: Props = $props()

  const rx = $derived(CHIP.rxOf(size))
  const ry = $derived(rx * CHIP.squash)
  const h = $derived(CHIP.heightOf(size))

  const topY = $derived(cy + ry * 0.5 - (stack.length - 1) * h)
</script>

<g class="stack">
  {#if stack.length > 0}
    <ellipse
      class="shadow"
      cx={cx + rx * 0.12}
      cy={cy + ry * 0.72}
      rx={rx * 1.08}
      ry={ry * 1.02}
    />
  {/if}
  {#each stack as color, i (i)}
    {@const fills = chipFills(color)}
    {@const y = cy + ry * 0.5 - i * h}
    {@const isTop = i === stack.length - 1}
    <g
      in:fly|global={{ y: animate ? -size * 0.5 : 0, duration: dur(animate ? 220 : 0), easing: settle }}
    >
      <g transform={`translate(${cx} ${y})`}>
        <path d={chipSidePath(rx, ry, h)} fill={fills.side} class="inkline" />
        <ellipse cx="0" cy="0" {rx} {ry} fill={fills.top} class="inkline" />
        {#if isTop}
          <g class="motif" transform={`scale(1 ${CHIP.squash * 1.45})`}>
            {#each topMotif(color, rx) as d, k (k)}
              <path {d} />
            {/each}
          </g>
        {/if}
      </g>
    </g>
  {/each}
  {#if hasCube}
    {@const cs = size * 0.22}
    <g transform={`translate(${cx} ${topY - ry * 0.35})`} class="cube">
      <path d={`M 0 ${-cs} L ${cs} ${-cs * 0.5} L ${cs} ${cs * 0.5} L 0 ${cs} L ${-cs} ${cs * 0.5} L ${-cs} ${-cs * 0.5} Z`} class="cube-body" />
      <path d={`M 0 ${-cs} L ${cs} ${-cs * 0.5} L 0 0 L ${-cs} ${-cs * 0.5} Z`} class="cube-top" />
      <path d={`M 0 0 L 0 ${cs} M ${-cs} ${-cs * 0.5} L 0 0 L ${cs} ${-cs * 0.5}`} class="cube-edge" />
    </g>
  {/if}
  {#if cubeRing}
    <ellipse cx={cx} cy={topY - ry * 0.4} rx={size * 0.3} ry={size * 0.3 * 0.6} class="ring" />
  {/if}
</g>

<style>
  .shadow {
    fill: rgb(58 53 39 / 0.16);
  }
  .inkline {
    stroke: var(--ink);
    stroke-width: 1.1;
    stroke-linejoin: round;
  }
  .motif path {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.75;
  }
  .cube-body {
    fill: #efe8d2;
    stroke: var(--ink);
    stroke-width: 1;
    stroke-linejoin: round;
  }
  .cube-top {
    fill: #f8f3e4;
    stroke: none;
  }
  .cube-edge {
    fill: none;
    stroke: var(--ink);
    stroke-width: 0.8;
    opacity: 0.7;
  }
  .ring {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.2;
    stroke-dasharray: 3 2.4;
    opacity: 0.8;
  }
</style>
