<script lang="ts">
  import type { BaseSession, OnlineSession } from '../app/session.svelte'
  import { scores } from '../app/session.svelte'
  import type { HexId, Move, TokenColor } from '../engine'
  import { play } from './audio'
  import Board from './Board.svelte'
  import CardPlate from './CardPlate.svelte'
  import VictoryOverlay from './VictoryOverlay.svelte'

  interface Props {
    session: BaseSession
    onExit: () => void
    onRematch: () => void
  }

  const { session, onExit, onRematch }: Props = $props()

  const TOKEN_COLOR: Record<TokenColor, string> = {
    gray: '#8d94a1',
    blue: '#5b8fd6',
    brown: '#8a5a33',
    green: '#4e8f4a',
    yellow: '#d9b23e',
    red: '#c05040',
  }

  const gs = $derived(session.state)
  const moves = $derived(session.myMoves())
  const online = $derived(session.mode === 'online' ? (session as OnlineSession) : null)

  /** The seat whose board fills the main panel. */
  const focusSeat = $derived(session.mySeat ?? session.actor)
  const others = $derived(
    gs.players.map((_, i) => i).filter((i) => i !== focusSeat),
  )

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
      moves.some((m) => m.type === 'placeToken' && m.index === (sel as { index: number }).index && m.hex === null),
  )

  const takeableSlots = $derived(
    new Set(moves.filter((m) => m.type === 'takeSlot').map((m) => (m as Move & { type: 'takeSlot' }).slot)),
  )
  const takeableRows = $derived(
    new Set(moves.filter((m) => m.type === 'takeCard').map((m) => (m as Move & { type: 'takeCard' }).row)),
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
        game over
      {:else if session.myTurn}
        <strong>your turn</strong> — {session.names[session.actor]}
      {:else}
        waiting on {session.names[session.actor]}
        {#if online?.waitingOn}(disconnected){/if}
      {/if}
      {#if gs.endTriggered && !gs.result}
        <span class="final">final round</span>
      {/if}
    </div>
    <div class="scores">
      {#each session.names as name, i (i)}
        <span class:active={i === gs.turn}>{name}: {totals[i]}</span>
      {/each}
    </div>
  </header>

  <div class="table">
    <section class="main">
      {#if others.length > 0}
        <div class="others">
          {#each others as seat (seat)}
            <div class="mini">
              <span class="mini-name">{session.names[seat]}</span>
              <Board player={gs.players[seat]} compact />
            </div>
          {/each}
        </div>
      {/if}

      <div class="my-board">
        <Board player={gs.players[focusSeat]} highlights={highlights} {onHexClick} />
      </div>

      <div class="tray">
        {#if gs.pendingTokens.length > 0 && session.myTurn}
          <span class="tray-label">place:</span>
          {#each gs.pendingTokens as token, i (i)}
            <button
              class="token"
              class:selected={sel?.kind === 'pending' && sel.index === i}
              style:background={TOKEN_COLOR[token]}
              onclick={() => (sel = { kind: 'pending', index: i })}
              aria-label={`pending ${token} token`}
            ></button>
          {/each}
          {#if canDiscardSelected}
            <button class="quiet" onclick={discardSelected}>discard (no legal spot)</button>
          {/if}
        {/if}
        <span class="spacer"></span>
        <button class="end" disabled={!canEndTurn} onclick={() => session.submit({ type: 'endTurn' })}>
          end turn
        </button>
      </div>
    </section>

    <aside>
      <section class="clearing">
        <h3>the clearing</h3>
        <div class="slots">
          {#each gs.slots as slot, i (i)}
            <button
              class="slot"
              disabled={!takeableSlots.has(i)}
              onclick={() => session.submit({ type: 'takeSlot', slot: i })}
            >
              {#each slot as token, j (j)}
                <span class="token small" style:background={TOKEN_COLOR[token]}></span>
              {/each}
              {#if slot.length === 0}<span class="empty">—</span>{/if}
            </button>
          {/each}
        </div>
        <div class="bag-line">{gs.bag.length - gs.bagCursor} tokens in the bag</div>
      </section>

      <section class="card-row">
        <h3>animals</h3>
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
        <h3>my cards ({gs.players[focusSeat].inProgress.length}/4)</h3>
        <div class="cards">
          {#each gs.players[focusSeat].inProgress as ip (ip.cardId)}
            <CardPlate
              cardId={ip.cardId}
              cubesPlaced={ip.cubesPlaced}
              clickable={session.myTurn}
              selected={sel?.kind === 'card' && sel.cardId === ip.cardId}
              onclick={() => (sel = sel?.kind === 'card' && sel.cardId === ip.cardId ? null : { kind: 'card', cardId: ip.cardId })}
            />
          {/each}
          {#each gs.players[focusSeat].completed as id (id)}
            <div class="done-card"><CardPlate cardId={id} cubesPlaced={99} /></div>
          {/each}
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
    max-width: 1180px;
    margin: 0 auto;
    padding: 0.75rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }
  .turn-line {
    flex: 1;
  }
  .final {
    margin-left: 0.75rem;
    color: #a04030;
    font-weight: 700;
  }
  .scores {
    display: flex;
    gap: 0.9rem;
    font-size: 0.85rem;
  }
  .scores .active {
    font-weight: 700;
    text-decoration: underline;
  }
  .table {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) {
    .table {
      grid-template-columns: 1fr;
    }
  }
  .others {
    display: flex;
    gap: 0.75rem;
  }
  .mini {
    width: 130px;
  }
  .mini-name {
    font-size: 0.75rem;
  }
  .tray {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    min-height: 2.6rem;
  }
  .tray-label {
    font-size: 0.85rem;
  }
  .spacer {
    flex: 1;
  }
  .token {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid #00000044;
    cursor: pointer;
  }
  .token.selected {
    outline: 3px solid #333;
  }
  .token.small {
    width: 1.3rem;
    height: 1.3rem;
    display: inline-block;
    cursor: inherit;
  }
  .slots {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .slot {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    padding: 0.35rem 0.5rem;
    border: 1px solid #b8ad94;
    border-radius: 6px;
    background: #f7f2e5;
    min-height: 2.2rem;
  }
  .slot:not(:disabled) {
    cursor: pointer;
    border-color: #5b7a3a;
    border-width: 2px;
  }
  .bag-line {
    font-size: 0.78rem;
    margin-top: 0.35rem;
    opacity: 0.8;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .gap {
    width: 6.5rem;
    border: 1px dashed #b8ad94;
    border-radius: 6px;
  }
  .done-card {
    opacity: 0.6;
  }
  h3 {
    margin: 0.6rem 0 0.35rem;
    font-size: 0.85rem;
    text-transform: lowercase;
  }
  .end {
    padding: 0.45rem 1rem;
  }
  .quiet {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.75;
    font: inherit;
  }
</style>
