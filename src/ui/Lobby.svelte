<script lang="ts">
  import type { OnlineSession } from '../app/session.svelte'
  import { savePlayerName } from '../app/persist'

  interface Props {
    session: OnlineSession
    onExit: () => void
  }

  const { session, onExit }: Props = $props()

  let name = $state(session.myName)
  let copied = $state(false)
  let relays = $state(0)
  let waitedLong = $state(false)

  $effect(() => {
    const t = setInterval(() => (relays = session.relayCount()), 1000)
    const slow = setTimeout(() => (waitedLong = true), 12000)
    return () => {
      clearInterval(t)
      clearTimeout(slow)
    }
  })

  const mySeatRow = $derived(session.seats.find((s) => s.playerKey === session.myKey))

  function rename() {
    savePlayerName(name)
    session.rename(name)
  }

  async function copyLink() {
    const url = `${location.origin}${location.pathname}#room=${session.room}`
    await navigator.clipboard.writeText(url)
    copied = true
    setTimeout(() => (copied = false), 1600)
  }
</script>

<main>
  <button class="quiet" onclick={onExit}>← leave</button>
  <h1>room {session.room}</h1>

  {#if session.status === 'room-full'}
    <p>This room already has 4 players. Ask for a fresh room code.</p>
  {:else}
    <p class="signal">
      signal: {relays}/{session.brokerCount()} brokers
      {#if relays === 0 && waitedLong}
        — can't reach the game brokers; check your network or firewall
      {/if}
    </p>

    <button onclick={copyLink}>{copied ? 'copied!' : 'copy invite link'}</button>

    <ul class="seats">
      {#each session.seats as seat (seat.playerKey)}
        <li class:me={seat.playerKey === session.myKey} class:gone={!seat.connected}>
          {seat.name}
          {#if seat.playerKey === session.hostKey}<span class="tag">host</span>{/if}
          {#if seat.ready}<span class="tag ready">ready</span>{/if}
          {#if !seat.connected}<span class="tag">away</span>{/if}
        </li>
      {/each}
      {#if session.seats.length < 2}
        <li class="hint">waiting for a friend to open the invite link…
          {#if waitedLong}
            <br />still alone after a while? make sure they use this exact link and
            the same app version.
          {/if}
        </li>
      {/if}
    </ul>

    <div class="controls">
      <input bind:value={name} maxlength="20" onchange={rename} placeholder="Guest" />
      <button onclick={() => session.setReady(!(mySeatRow?.ready ?? false))}>
        {mySeatRow?.ready ? 'not ready' : 'ready'}
      </button>
      {#if session.isHost}
        <button disabled={!session.canStart} onclick={() => session.startGame()}>
          start game
        </button>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 26rem;
    margin: 6vh auto 0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .signal {
    font-size: 0.8rem;
    opacity: 0.75;
  }
  .seats {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .seats li {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .me {
    border-width: 2px;
  }
  .gone {
    opacity: 0.5;
  }
  .hint {
    font-size: 0.85rem;
    opacity: 0.7;
    border-style: dashed !important;
  }
  .tag {
    font-family: var(--font-ui);
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    margin-left: 0.4rem;
    padding: 0.12rem 0.4rem;
    border-radius: 3px;
    background: var(--paper-deep);
    color: var(--ink-soft);
  }
  .tag.ready {
    background: var(--moss);
    color: var(--panel);
  }
  .controls {
    display: flex;
    gap: var(--sp-2);
  }
  input {
    flex: 1;
    min-width: 0;
  }
  .quiet {
    align-self: flex-start;
  }
</style>
