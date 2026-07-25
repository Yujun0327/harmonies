<script lang="ts">
  import type { BaseSession } from '../app/session.svelte'
  import { scoreBreakdown } from '../engine'
  import Modal from './Modal.svelte'

  interface Props {
    session: BaseSession
    onClose: () => void
  }

  const { session, onClose }: Props = $props()

  const breakdown = $derived(session.state.players.map(scoreBreakdown))
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

<Modal {onClose}>
  <h2>Current tally</h2>
  <p class="hint">Scored as if the game ended right now.</p>
  <table>
    <thead>
      <tr>
        <th></th>
        {#each session.names as name, i (i)}
          <th class:active={i === session.state.turn}>{name}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row)}
        <tr>
          <td>{LABEL[row]}</td>
          {#each breakdown as b, i (i)}
            <td>{b[row]}</td>
          {/each}
        </tr>
      {/each}
      <tr class="total">
        <td>Total</td>
        {#each breakdown as b, i (i)}
          <td>{b.total}</td>
        {/each}
      </tr>
    </tbody>
  </table>
  <div class="actions">
    <button onclick={onClose}>close</button>
  </div>
</Modal>

<style>
  .hint {
    font-size: 0.85rem;
    font-style: italic;
    color: var(--ink-soft);
    margin-top: -0.3rem;
  }
  table {
    border-collapse: collapse;
    margin: var(--sp-3) 0;
    width: 100%;
  }
  td,
  th {
    padding: 0.3rem 0.7rem;
    text-align: right;
    border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums;
  }
  th.active {
    text-decoration: underline;
  }
  td:first-child {
    text-align: left;
    font-family: var(--font-ui);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
  }
  .total td {
    font-weight: 700;
    font-family: var(--font-display);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
