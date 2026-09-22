<script lang="ts">
  import WalletBadge from './WalletBadge.svelte'
  import { loadPlayerName, savePlayerName } from '../app/persist'
  import RulesLeaflet from './RulesLeaflet.svelte'

  interface Props {
    onHotseat: (playerCount: 2 | 3 | 4, names: string[]) => void
    onCreateRoom: () => void
    onJoinRoom: (code: string) => void
  }

  const { onHotseat, onCreateRoom, onJoinRoom }: Props = $props()

  let mode = $state<'menu' | 'hotseat' | 'join'>('menu')
  let playerCount = $state<2 | 3 | 4>(2)
  let names = $state(['', '', '', ''])
  let joinCode = $state('')
  let myName = $state(loadPlayerName())
  let showRules = $state(false)

  function startHotseat() {
    onHotseat(playerCount, names.slice(0, playerCount))
  }

  function createRoom() {
    savePlayerName(myName)
    onCreateRoom()
  }

  function joinRoom() {
    if (joinCode.trim().length < 4) return
    savePlayerName(myName)
    onJoinRoom(joinCode.trim())
  }
</script>

<main>
  <div class="plate-head">
    <span class="ornament" aria-hidden="true">❦</span>
    <h1>Harmonies</h1>
    <p class="tagline">a field guide to little landscapes &amp; the animals who love them</p>
    <WalletBadge />
  </div>
  <p class="disclaimer">
    A fan-made homage for playing among friends. Not affiliated with Libellud.
    If you enjoy it, buy the real board game.
  </p>

  {#if mode === 'menu'}
    <div class="menu">
      <label>
        your name
        <input bind:value={myName} placeholder="Guest" maxlength="20" />
      </label>
      <button onclick={createRoom}>create online room</button>
      <button onclick={() => (mode = 'join')}>join a room</button>
      <button onclick={() => (mode = 'hotseat')}>hotseat (one device)</button>
      <button class="quiet" onclick={() => (showRules = true)}>how to play</button>
    </div>
  {:else if mode === 'join'}
    <div class="menu">
      <label>
        room code
        <input
          bind:value={joinCode}
          placeholder="ABC123"
          maxlength="8"
          style:text-transform="uppercase"
          onkeydown={(e) => e.key === 'Enter' && joinRoom()}
        />
      </label>
      <button onclick={joinRoom} disabled={joinCode.trim().length < 4}>join</button>
      <button class="quiet" onclick={() => (mode = 'menu')}>back</button>
    </div>
  {:else}
    <div class="menu">
      <label>
        players
        <select bind:value={playerCount}>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      {#each { length: playerCount } as _, i (i)}
        <input bind:value={names[i]} placeholder={`Player ${i + 1}`} maxlength="20" />
      {/each}
      <button onclick={startHotseat}>start</button>
      <button class="quiet" onclick={() => (mode = 'menu')}>back</button>
    </div>
  {/if}

  {#if showRules}
    <RulesLeaflet onClose={() => (showRules = false)} />
  {/if}
</main>

<style>
  main {
    max-width: 24rem;
    margin: 9vh auto 0;
    padding: var(--sp-4);
    text-align: center;
  }
  .plate-head {
    border-top: 2px solid var(--ink);
    border-bottom: 1px solid var(--line);
    padding: var(--sp-3) 0 var(--sp-3);
    margin-bottom: var(--sp-2);
  }
  .ornament {
    display: block;
    font-size: 0.9rem;
    color: var(--ink-soft);
    margin-bottom: var(--sp-1);
  }
  h1 {
    font-size: 2.6rem;
    margin-bottom: 0.1rem;
  }
  .tagline {
    font-style: italic;
    color: var(--ink-soft);
    margin: 0;
  }
  .disclaimer {
    font-size: 0.75rem;
    color: var(--ink-soft);
    margin-bottom: var(--sp-6);
  }
  .menu {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .menu > button {
    padding: 0.65rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    font-family: var(--font-ui);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: lowercase;
    color: var(--ink-soft);
    text-align: left;
  }
</style>
