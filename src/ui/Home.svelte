<script lang="ts">
  import { loadPlayerName, savePlayerName } from '../app/persist'

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
  <h1>Harmonies</h1>
  <p class="tagline">build a little landscape, welcome its animals</p>
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
</main>

<style>
  main {
    max-width: 26rem;
    margin: 8vh auto 0;
    padding: 1rem;
    text-align: center;
  }
  .tagline {
    opacity: 0.8;
  }
  .disclaimer {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-bottom: 2rem;
  }
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    text-align: left;
  }
  input,
  select {
    padding: 0.5rem;
    font: inherit;
  }
  button {
    padding: 0.6rem;
    font: inherit;
    cursor: pointer;
  }
  .quiet {
    background: none;
    border: none;
    opacity: 0.7;
  }
</style>
