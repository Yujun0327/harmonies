<script lang="ts">
  import Modal from './Modal.svelte'

  interface Props {
    onClose: () => void
  }

  const { onClose }: Props = $props()
</script>

<Modal {onClose}>
  <h2>How to play</h2>
  <div class="leaflet">
    <p>
      Build a little landscape on your board, then welcome the animals who live in it.
      Highest score when the tokens run out (or a board fills up) wins.
    </p>
    <h3>On your turn</h3>
    <ul>
      <li><strong>Take one slot</strong> from the clearing — all 3 tokens — and place them
        on your board, in any order, mixing in the actions below between placements.</li>
      <li><strong>Draft one animal card</strong> (optional, once per turn; at most 4 unfinished).</li>
      <li><strong>Place animal cubes</strong> (optional, any number): whenever a card's
        habitat pattern exists on your board, put its next cube on the marked hex. That
        hex is then locked forever.</li>
    </ul>
    <h3>Stacking</h3>
    <ul>
      <li><strong>Trees</strong>: green on 0–2 brown (taller scores more: 1 / 3 / 7).</li>
      <li><strong>Mountains</strong>: gray on gray, up to 3 high (1 / 3 / 7 — but only
        when touching another mountain).</li>
      <li><strong>Buildings</strong>: red on top of exactly one brown, gray, or red
        (5 points when neighbors show 3+ different colors).</li>
      <li><strong>Water</strong> and <strong>fields</strong> stay on the ground. Your
        single longest river scores (2/5/8/11/15, +4 per extra token); each field
        group of 2+ scores 5.</li>
    </ul>
    <h3>Habitats</h3>
    <p>
      Patterns match in any rotation, never mirrored; tree and mountain heights must be
      exact. Each placed cube climbs the card's point track — finish a card to free the
      slot.
    </p>
    <p class="fine">
      Fan adaptation for private play among friends; not affiliated with Libellud.
      If it makes you smile, buy the real game — it's lovely at a table.
    </p>
  </div>
  <div class="actions">
    <button onclick={onClose}>close</button>
  </div>
</Modal>

<style>
  .leaflet {
    max-width: 26rem;
    font-size: 0.92rem;
  }
  h3 {
    font-size: 1rem;
    margin-top: var(--sp-4);
  }
  ul {
    padding-left: 1.1rem;
    margin: var(--sp-2) 0;
  }
  li {
    margin-bottom: var(--sp-1);
  }
  .fine {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--ink-soft);
    margin-top: var(--sp-4);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
