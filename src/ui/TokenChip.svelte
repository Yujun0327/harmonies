<script lang="ts">
  import { CHIP, chipFills, chipSidePath, topMotif, type ChipColor } from './chip-art'

  interface Props {
    color: ChipColor
    /** CSS size of the icon (width). */
    px?: number
    selected?: boolean
  }

  const { color, px = 30, selected = false }: Props = $props()

  const rx = CHIP.rxOf(20)
  const ry = rx * CHIP.squash
  const h = CHIP.heightOf(20)
  const fills = $derived(chipFills(color))
</script>

<svg
  viewBox="-14 -10 28 22"
  style:width="{px}px"
  class="chip"
  class:selected
  aria-hidden="true"
>
  {#if selected}
    <ellipse cx="0" cy={h * 0.55} rx={rx * 1.28} ry={ry * 1.3} class="halo" />
  {/if}
  <path d={chipSidePath(rx, ry, h)} fill={fills.side} class="inkline" />
  <ellipse cx="0" cy="0" {rx} {ry} fill={fills.top} class="inkline" />
  <g class="motif" transform={`scale(1 ${CHIP.squash * 1.45})`}>
    {#each topMotif(color, rx) as d, k (k)}
      <path {d} />
    {/each}
  </g>
</svg>

<style>
  .chip {
    display: block;
    overflow: visible;
  }
  .halo {
    fill: rgb(91 122 58 / 0.25);
    stroke: var(--moss);
    stroke-width: 1.6;
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
</style>
