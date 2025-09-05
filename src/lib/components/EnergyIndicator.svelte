<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let energy: number = 6;
  export let interactive: boolean = false;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  
  const dispatch = createEventDispatcher();
  
  function updateEnergy(newEnergy: number) {
    if (interactive) {
      energy = newEnergy;
      dispatch('change', energy);
    }
  }
  
  function handleKeydown(event: KeyboardEvent, level: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      updateEnergy(level);
    }
  }
  
  $: energyClass = `energy-${energy}`;
  $: sizeClass = `size-${size}`;
</script>

<div class="energy-indicator {sizeClass}" role={interactive ? 'slider' : 'meter'} 
     aria-valuenow={energy} aria-valuemin="1" aria-valuemax="12"
     aria-label="Niveau d'énergie : {energy} sur 12">
  
  <div class="energy-scale">
    {#each Array(12) as _, i}
      {@const level = i + 1}
      <div 
        class="energy-level energy-{level} {level <= energy ? 'active' : ''} {interactive ? 'interactive' : ''}"
        style="height: {5 + (level * 7)}%"
        on:click={() => updateEnergy(level)}
        on:keydown={(e) => handleKeydown(e, level)}
        tabindex={interactive ? 0 : -1}
        role={interactive ? 'button' : null}
        aria-label={interactive ? `Niveau ${level}` : null}
      >
        <span class="level-number">{level}</span>
      </div>
    {/each}
  </div>
  
  <div class="energy-display">
    <span class="energy-value">{energy}</span>
    <span class="energy-label">/ 12</span>
  </div>
</div>

<style>
  .energy-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2);
  }
  
  .energy-scale {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 80px;
    padding: var(--spacing-1);
    border-radius: 4px;
    background: var(--color-background);
  }
  
  .energy-level {
    flex: 1;
    min-width: 8px;
    border-radius: 2px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    opacity: 0.3;
    transition: opacity 0.2s ease;
  }
  
  .energy-level.active {
    opacity: 1;
  }
  
  .energy-level.interactive {
    cursor: pointer;
  }
  
  .energy-level.interactive:hover {
    opacity: 0.8;
    transform: scale(1.1);
  }
  
  .energy-level.interactive:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
  
  .level-number {
    font-size: 8px;
    font-weight: 600;
    color: var(--color-text);
    position: absolute;
    bottom: 1px;
  }
  
  .energy-display {
    text-align: center;
  }
  
  .energy-value {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-accent);
  }
  
  .energy-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  /* Size variants */
  .size-small .energy-scale {
    height: 40px;
  }
  
  .size-small .energy-value {
    font-size: var(--font-size-base);
  }
  
  .size-small .level-number {
    font-size: 6px;
  }
  
  .size-large .energy-scale {
    height: 120px;
  }
  
  .size-large .energy-value {
    font-size: var(--font-size-xl);
  }
  
  .size-large .level-number {
    font-size: 10px;
  }
  
  /* Energy level colors (already defined in app.css) */
  .energy-level.energy-1 { background: var(--energy-1); }
  .energy-level.energy-2 { background: var(--energy-2); }
  .energy-level.energy-3 { background: var(--energy-3); }
  .energy-level.energy-4 { background: var(--energy-4); }
  .energy-level.energy-5 { background: var(--energy-5); }
  .energy-level.energy-6 { background: var(--energy-6); }
  .energy-level.energy-7 { background: var(--energy-7); }
  .energy-level.energy-8 { background: var(--energy-8); }
  .energy-level.energy-9 { background: var(--energy-9); }
  .energy-level.energy-10 { background: var(--energy-10); }
  .energy-level.energy-11 { background: var(--energy-11); }
  .energy-level.energy-12 { background: var(--energy-12); }
</style>