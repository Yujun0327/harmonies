<script lang="ts">
  import { CARD_IDS } from '../data'
  import { boardOfDemo } from './gallery-fixtures'
  import Board from './Board.svelte'
  import CardPlate from './CardPlate.svelte'

  const demo = boardOfDemo()
</script>

<main>
  <h1>component gallery (dev)</h1>

  <h2>board with one of everything</h2>
  <div style:max-width="420px">
    <Board player={demo} highlights={new Set(['0,0', '2,1'])} />
  </div>

  <h2>all card plates</h2>
  <div class="cards">
    {#each CARD_IDS as id (id)}
      <CardPlate cardId={id} cubesPlaced={1} />
    {/each}
  </div>
</main>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
