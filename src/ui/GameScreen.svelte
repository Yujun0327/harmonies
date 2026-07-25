<script lang="ts">
  import type { BaseSession, OnlineSession } from '../app/session.svelte'
  import { scores } from '../app/session.svelte'
  import type { HexId, Move } from '../engine'
  import { play } from './audio'
  import Board from './Board.svelte'
  import CardPlate from './CardPlate.svelte'
  import TokenChip from './TokenChip.svelte'
  import VictoryOverlay from './VictoryOverlay.svelte'

  interface Props {
    session: BaseSession
    onExit: () => void
    onRematch: () => void
  }

  const { session, onExit, onRematch }: Props = $props()

  const gs = $derived(session.state)
  const moves = $derived(session.myMoves())
  const online = $derived(session.mode === 'online' ? (session as OnlineSession) : null)

  /** The seat whose board fills the main panel. */
  const focusSeat = $derived(session.mySeat ?? session.actor)
  const others = $derived(gs.players.map((_, i) => i).filter((i) => i !== focusSeat))

  type Sel = { kind: 'pending'; index: number } | { kind: 'card'; cardId: string } | null
  let sel = $state<Sel>(null)

  // auto-select the first pending token; drop selections that became invalid
  $effect(() => {
    if (sel?.kind === 'pending' && gs.pendingTokens[sel.index] === undefined) sel = null
    if (
      sel?.kind === 'card' &&
      !gs.players[focusSeat].inProgress.some((c) => c.cardId === (sel as { cardId: string }).cardId)
    )
      sel = null
    if (sel === null && gs.pendingTokens.length > 0 && session.myTurn) {
      sel = { kind: 'pending', index: 0 }
    }
  })

  const highlights = $derived.by(() => {
    const set = new Set<HexId>()
    if (!sel) return set
    for (const m of moves) {
      if (sel.kind === 'pending' && m.type === 'placeToken' && m.index === sel.index && m.hex) {
        set.add(m.hex)
      }
      if (sel.kind === 'card' && m.type === 'placeCube' && m.cardId === sel.cardId) {
        set.add(m.hex)
      }
    }
    return set
  })

  const canDiscardSelected = $derived(
    sel?.kind === 'pending' &&
      moves.some(
        (m) =>
          m.type === 'placeToken' &&
          m.index === (sel as { index: number }).index &&
          m.hex === null,
      ),
  )

  const takeableSlots = $derived(
    new Set(
      moves.filter((m) => m.type === 'takeSlot').map((m) => (m as Move & { type: 'takeSlot' }).slot),
    ),
  )
  const takeableRows = $derived(
    new Set(
      moves.filter((m) => m.type === 'takeCard').map((m) => (m as Move & { type: 'takeCard' }).row),
    ),
  )
  const canEndTurn = $derived(moves.some((m) => m.type === 'endTurn'))

  function onHexClick(hex: HexId) {
    if (!sel) return
    if (sel.kind === 'pending') {
      session.submit({ type: 'placeToken', index: sel.index, hex })
    } else {
      session.submit({ type: 'placeCube', cardId: sel.cardId, hex })
      sel = null
    }
  }

  function discardSelected() {
    if (sel?.kind === 'pending') session.submit({ type: 'placeToken', index: sel.index, hex: null })
  }

  // foley
  let seenEvent = 0
  $effect(() => {
    for (const e of session.events) {
      if (e.id >= seenEvent) {
        play(e.sfx)
        seenEvent = e.id + 1
      }
    }
  })

  const totals = $derived(scores(gs))
</script>

<div class="screen">
  <header>
    <button class="quiet" onclick={onExit}>← leave</button>
    <div class="turn-line">
      {#if gs.result}
        <span class="label">game over</span>
      {:else if session.myTurn}
        <strong
          >{session.mode === 'hotseat'
            ? `${session.names[session.actor]} to play`
            : 'your turn'}</strong
        >
      {:else}
        <span class="waiting">waiting on {session.names[session.actor]}…</span>
        {#if online?.waitingOn}<span class="label">disconnected</span>{/if}
      {/if}
      {#if gs.endTriggered && !gs.result}
        <span class="final">final round</span>
      {/if}
    </div>
    <div class="scores tnum">
      {#each session.names as name, i (i)}
        <span class="score" class:active={i === gs.turn}>
          <span class="score-name">{name}</span>
          <span class="score-value">{totals[i]}</span>
        </span>
      {/each}
    </div>
  </header>

  <div class="table">
    <section class="main">
      {#if others.length > 0}
        <div class="others">
          {#each others as seat (seat)}
            <div class="mini panel">
              <span class="label">{session.names[seat]}</span>
              <Board player={gs.players[seat]} compact />
            </div>
          {/each}
        </div>
      {/if}

      <div class="my-board panel">
        <Board player={gs.players[focusSeat]} {highlights} {onHexClick} />
        <div class="tray">
          {#if gs.pendingTokens.length > 0 && session.myTurn}
            <span class="label">place</span>
            {#each gs.pendingTokens as token, i (i)}
              <button
                class="tray-chip"
                onclick={() => (sel = { kind: 'pending', index: i })}
                aria-label={`pending ${token} token`}
              >
                <TokenChip
                  color={token}
                  px={34}
                  selected={sel?.kind === 'pending' && sel.index === i}
                />
              </button>
            {/each}
            {#if canDiscardSelected}
              <button class="quiet" onclick={discardSelected}>discard — no legal spot</button>
            {/if}
          {/if}
          <span class="spacer"></span>
          <button
            class="primary"
            disabled={!canEndTurn}
            onclick={() => session.submit({ type: 'endTurn' })}
          >
            end turn
          </button>
        </div>
      </div>
    </section>

    <aside>
      <section class="clearing panel">
        <h3 class="label">the clearing</h3>
        <div class="slots">
          {#each gs.slots as slot, i (i)}
            <button
              class="slot"
              disabled={!takeableSlots.has(i)}
              onclick={() => session.submit({ type: 'takeSlot', slot: i })}
              aria-label={`token slot ${i + 1}`}
            >
              {#each slot as token, j (j)}
                <TokenChip color={token} px={26} />
              {/each}
              {#if slot.length === 0}<span class="empty-slot">emptied</span>{/if}
            </button>
          {/each}
        </div>
        <div class="bag-line tnum">{gs.bag.length - gs.bagCursor} tokens left in the bag</div>
      </section>

      <section class="card-row">
        <h3 class="label">animals seeking a home</h3>
        <div class="cards">
          {#each gs.cardRow as cardId, row (row)}
            {#if cardId}
              <CardPlate
                {cardId}
                clickable={takeableRows.has(row)}
                onclick={() => session.submit({ type: 'takeCard', row })}
              />
            {:else}
              <div class="gap"></div>
            {/if}
          {/each}
        </div>
      </section>

      <section class="my-cards">
        <h3 class="label">my cards ({gs.players[focusSeat].inProgress.length}/4)</h3>
        <div class="cards">
          {#each gs.players[focusSeat].inProgress as ip (ip.cardId)}
            <CardPlate
              cardId={ip.cardId}
              cubesPlaced={ip.cubesPlaced}
              clickable={session.myTurn}
              selected={sel?.kind === 'card' && sel.cardId === ip.cardId}
              onclick={() =>
                (sel =
                  sel?.kind === 'card' && sel.cardId === ip.cardId
                    ? null
                    : { kind: 'card', cardId: ip.cardId })}
            />
          {/each}
          {#each gs.players[focusSeat].completed as id (id)}
            <div class="done-card"><CardPlate cardId={id} cubesPlaced={99} /></div>
          {/each}
          {#if gs.players[focusSeat].inProgress.length === 0 && gs.players[focusSeat].completed.length === 0}
            <p class="empty-note">no cards yet — draft an animal from the row above</p>
          {/if}
        </div>
      </section>
    </aside>
  </div>

  {#if gs.result}
    <VictoryOverlay {session} {onRematch} {onExit} />
  {/if}
</div>

<style>
  .screen {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--sp-3) var(--sp-4) var(--sp-5);
  }
  header {
    display: flex;
    align-items: baseline;
    gap: var(--sp-4);
    padding: var(--sp-2) 0 var(--sp-3);
  }
  .turn-line {
    flex: 1;
    font-family: var(--font-display);
    font-size: 1.05rem;
  }
  .waiting {
    color: var(--ink-soft);
    font-style: italic;
  }
  .final {
    margin-left: var(--sp-3);
    color: var(--rust);
    font-family: var(--font-ui);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .scores {
    display: flex;
    gap: var(--sp-3);
  }
  .score {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border: 1px solid transparent;
    border-radius: var(--r-card);
  }
  .score.active {
    border-color: var(--line);
    background: var(--panel);
  }
  .score-name {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }
  .score-value {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 640;
  }
  .table {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  @media (max-width: 940px) {
    .table {
      grid-template-columns: 1fr;
    }
  }
  .others {
    display: flex;
    gap: var(--sp-3);
    margin-bottom: var(--sp-3);
  }
  .mini {
    width: 118px;
    padding: var(--sp-2);
  }
  .my-board {
    padding: var(--sp-3);
  }
  .my-board :global(svg.board) {
    max-width: 470px;
    margin: 0 auto;
  }
  .tray {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
    min-height: 3rem;
    border-top: 1px solid var(--line);
    padding-top: var(--sp-2);
  }
  .tray-chip {
    background: none;
    border: none;
    padding: 0.15rem;
    cursor: pointer;
  }
  .spacer {
    flex: 1;
  }
  .slots {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .slot {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.5rem;
    background: var(--paper-deep);
    min-height: 2.6rem;
  }
  .slot:not(:disabled) {
    border-color: var(--moss);
    border-width: 2px;
  }
  .empty-slot {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-style: italic;
  }
  .bag-line {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    margin-top: var(--sp-2);
    color: var(--ink-soft);
  }
  .clearing {
    padding: var(--sp-3);
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .gap {
    width: 7.1rem;
    border: 1px dashed var(--line);
    border-radius: var(--r-card);
    min-height: 6rem;
  }
  .done-card {
    opacity: 0.55;
  }
  .empty-note {
    font-size: 0.85rem;
    font-style: italic;
    color: var(--ink-soft);
  }
  h3.label {
    margin: var(--sp-4) 0 var(--sp-2);
  }
  .clearing h3.label {
    margin-top: 0;
  }
</style>
