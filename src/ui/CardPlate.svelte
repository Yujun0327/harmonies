<script lang="ts">
  import { CARDS } from '../data'
  import { hexToPixel } from '../engine'

  interface Props {
    cardId: string
    cubesPlaced?: number
    selected?: boolean
    clickable?: boolean
    onclick?: () => void
  }

  const { cardId, cubesPlaced = 0, selected = false, clickable = false, onclick }: Props = $props()

  const card = $derived(CARDS[cardId])

  const COLOR: Record<string, string> = {
    water: '#5b8fd6',
    field: '#d9b23e',
    building: '#c05040',
    tree: '#4e8f4a',
    mountain: '#8d94a1',
  }

  const S = 11
  const geo = $derived.by(() => {
    const spots = card.pattern.map((p, i) => ({
      ...hexToPixel(p.q, p.r, S),
      read: p.read,
      isCube: i === card.cube,
    }))
    const minX = Math.min(...spots.map((s) => s.x)) - S * 1.3
    const minY = Math.min(...spots.map((s) => s.y)) - S * 1.3
    const w = Math.max(...spots.map((s) => s.x)) - minX + S * 1.3
    const h = Math.max(...spots.map((s) => s.y)) - minY + S * 1.3
    return { spots, minX, minY, w, h }
  })

  function hexPoints(cx: number, cy: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i
      return `${cx + S * Math.cos(a)},${cy + S * Math.sin(a)}`
    }).join(' ')
  }

  function label(read: (typeof card.pattern)[number]['read']): string {
    if (read.type === 'tree') return `${read.size}`
    if (read.type === 'mountain') return `${read.height}`
    return ''
  }
</script>

<button class="plate" class:selected disabled={!clickable} {onclick} type="button">
  <span class="name">{card.name}</span>
  <svg viewBox="{geo.minX} {geo.minY} {geo.w} {geo.h}" class="pattern">
    {#each geo.spots as s, i (i)}
      <polygon points={hexPoints(s.x, s.y)} fill={COLOR[s.read.type]} stroke="#333" stroke-width="1" />
      {#if label(s.read)}
        <text x={s.x} y={s.y + 3.5} text-anchor="middle" class="height">{label(s.read)}</text>
      {/if}
      {#if s.isCube}
        <circle cx={s.x} cy={s.y} r={3} class="cube-mark" />
      {/if}
    {/each}
  </svg>
  <span class="track">
    {#each card.track as v, i (i)}
      <span class="slot" class:done={i < cubesPlaced} class:next={i === cubesPlaced}>{v}</span>
    {/each}
  </span>
</button>

<style>
  .plate {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem;
    border: 1px solid #b8ad94;
    border-radius: 6px;
    background: #f7f2e5;
    font: inherit;
    min-width: 6.5rem;
  }
  .plate:disabled {
    opacity: 1;
  }
  .plate:not(:disabled) {
    cursor: pointer;
  }
  .plate:not(:disabled):hover {
    border-color: #5b7a3a;
  }
  .selected {
    outline: 3px solid #5b7a3a;
  }
  .name {
    font-size: 0.72rem;
    font-weight: 600;
  }
  .pattern {
    height: 42px;
  }
  .height {
    font-size: 8px;
    fill: #fff;
    font-weight: 700;
  }
  .cube-mark {
    fill: none;
    stroke: #fff;
    stroke-width: 1.5;
    stroke-dasharray: 2 1.5;
  }
  .track {
    display: flex;
    gap: 0.3rem;
    font-size: 0.72rem;
  }
  .slot {
    padding: 0 0.3rem;
    border: 1px solid #b8ad94;
    border-radius: 3px;
    background: #fff;
  }
  .slot.done {
    background: #5b7a3a;
    color: #fff;
  }
  .slot.next {
    border-color: #5b7a3a;
    font-weight: 700;
  }
</style>
