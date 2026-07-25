<script lang="ts">
  import type { BaseSession } from '../app/session.svelte'
  import Modal from './Modal.svelte'

  interface Props {
    session: BaseSession
    onRematch: () => void
    onExit: () => void
  }

  const { session, onRematch, onExit }: Props = $props()

  const result = $derived(session.state.result!)
  const rows = ['trees', 'mountains', 'fields', 'buildings', 'water', 'animalTotal'] as const
  const LABEL: Record<(typeof rows)[number], string> = {
    trees: 'Trees',
    mountains: 'Mountains',
    fields: 'Fields',
    buildings: 'Buildings',
    water: 'Water',
    animalTotal: 'Animals',
  }
</script>

<Modal onClose={onExit}>
  <h2>
    {result.winners.length > 1
      ? `Shared victory: ${result.winners.map((w) => session.names[w]).join(' & ')}`
      : `${session.names[result.winners[0]]} wins`}
  </h2>
  <table>
    <thead>
      <tr>
        <th></th>
        {#each session.names as name, i (i)}
          <th class:winner={result.winners.includes(i)}>{name}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row)}
        <tr>
          <td>{LABEL[row]}</td>
          {#each result.breakdown as b, i (i)}
            <td>{b[row]}</td>
          {/each}
        </tr>
      {/each}
      <tr class="total">
        <td>Total</td>
        {#each result.breakdown as b, i (i)}
          <td class:winner={result.winners.includes(i)}>{b.total}</td>
        {/each}
      </tr>
    </tbody>
  </table>
  <div class="actions">
    <button onclick={onRematch}>rematch</button>
    <button class="quiet" onclick={onExit}>leave</button>
  </div>
</Modal>

<style>
  table {
    border-collapse: collapse;
    margin: 0.75rem 0;
    width: 100%;
  }
  td,
  th {
    padding: 0.3rem 0.7rem;
    text-align: right;
    border-bottom: 1px solid #00000018;
  }
  td:first-child {
    text-align: left;
  }
  .total td {
    font-weight: 700;
  }
  .winner {
    color: #5b7a3a;
    font-weight: 700;
  }
  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
  .quiet {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.75;
    font: inherit;
  }
</style>
