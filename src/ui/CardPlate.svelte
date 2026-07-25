<script lang="ts">
  import { CARDS, CARD_IDS } from '../data'
  import { hexToPixel } from '../engine'
  import type { RequiredRead } from '../engine'
  import TokenStack from './TokenStack.svelte'
  import type { ChipColor } from './chip-art'
  import { wobblyHex, wobblyLine } from './wobble'

  interface Props {
    cardId: string
    cubesPlaced?: number
    selected?: boolean
    clickable?: boolean
    onclick?: () => void
  }

  const { cardId, cubesPlaced = 0, selected = false, clickable = false, onclick }: Props = $props()

  const card = $derived(CARDS[cardId])
  const plateNo = $derived(CARD_IDS.indexOf(cardId) + 1)

  /** Roman numeral plate ordinal, field-guide style. */
  function roman(n: number): string {
    const table: [number, string][] = [
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ]
    let out = ''
    for (const [v, sym] of table) {
      while (n >= v) {
        out += sym
        n -= v
      }
    }
    return out
  }

  function readToStack(read: RequiredRead): ChipColor[] {
    switch (read.type) {
      case 'water':
        return ['blue']
      case 'field':
        return ['yellow']
      case 'building':
        return ['wild', 'red'] // any base (R5.3)
      case 'tree':
        return [...Array<ChipColor>(read.size - 1).fill('brown'), 'green']
      case 'mountain':
        return Array<ChipColor>(read.height).fill('gray')
    }
  }

  const S = 12
  const geo = $derived.by(() => {
    const spots = card.pattern.map((p, i) => ({
      ...hexToPixel(p.q, p.r, S),
      stack: readToStack(p.read),
      isCube: i === card.cube,
    }))
    const pad = S * 1.6
    const minX = Math.min(...spots.map((s) => s.x)) - pad
    const minY = Math.min(...spots.map((s) => s.y)) - pad * 1.4
    const w = Math.max(...spots.map((s) => s.x)) - minX + pad
    const h = Math.max(...spots.map((s) => s.y)) - minY + pad * 1.2
    return { spots, minX, minY, w, h }
  })
</script>

<button class="plate" class:selected class:clickable disabled={!clickable} {onclick} type="button">
  <span class="ordinal">Pl. {roman(plateNo)}</span>
  <span class="name">{card.name}</span>
  <svg class="rule" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
    <path d={wobblyLine(2, 2, 98, 2, 1.2, 3)} />
  </svg>
  <svg
    viewBox="{geo.minX} {geo.minY} {geo.w} {geo.h}"
    class="pattern"
    style:aspect-ratio={`${geo.w} / ${geo.h}`}
  >
    {#each geo.spots as s, i (i)}
      <path d={wobblyHex(s.x, s.y, S * 0.95, 0.8)} class="cell" />
    {/each}
    {#each [...geo.spots].sort((a, b) => a.y - b.y) as s, i (i)}
      <TokenStack stack={s.stack} size={S} cx={s.x} cy={s.y} cubeRing={s.isCube} animate={false} />
    {/each}
  </svg>
  <span class="track">
    {#each card.track as v, i (i)}
      <span class="pip tnum" class:done={i < cubesPlaced} class:next={i === cubesPlaced}>{v}</span>
    {/each}
  </span>
</button>

<style>
  .plate {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.5rem 0.55rem 0.45rem;
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    background: var(--panel);
    box-shadow: var(--shadow);
    font: inherit;
    width: 7.1rem;
    letter-spacing: 0;
  }
  .plate:disabled {
    opacity: 1;
  }
  .plate.clickable {
    cursor: pointer;
  }
  .plate.clickable:hover {
    border-color: var(--moss);
  }
  .selected {
    outline: 2px solid var(--moss);
    outline-offset: 1px;
  }
  .ordinal {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .name {
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.1;
    text-align: center;
  }
  .rule {
    width: 70%;
    height: 4px;
  }
  .rule path {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
  }
  .pattern {
    width: 88%;
    max-height: 64px;
  }
  .cell {
    fill: var(--paper-deep);
    stroke: var(--line);
    stroke-width: 1;
  }
  .track {
    display: flex;
    gap: 0.34rem;
    margin-top: 0.1rem;
  }
  .pip {
    font-family: var(--font-display);
    font-size: 0.72rem;
    min-width: 1.25rem;
    height: 1.25rem;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--panel);
  }
  .pip.done {
    background: var(--ink);
    color: var(--panel);
    border-color: var(--ink);
  }
  .pip.next {
    border-color: var(--ink);
    font-weight: 700;
  }
</style>
