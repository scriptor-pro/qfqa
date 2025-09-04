<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import EnergyIndicator from './EnergyIndicator.svelte';
  
  export let task: any;
  export let energyLevel: number;
  export let neurotype: string;
  export let scheduled: boolean = false;
  export let draggable: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  // Calculate visual size based on energy cost and neurotype
  $: visualSize = calculateVisualSize(task.energy_cost, neurotype);
  $: energyMatch = task.energy_cost <= energyLevel;
  
  function calculateVisualSize(energyCost: number, neurotype: string) {
    // Base size calculation
    let baseSize = 40 + (energyCost * 8); // 40px base + 8px per energy level
    
    // Neurotype-specific adjustments
    switch (neurotype) {
      case 'TDAH':
        // TDAH: Higher energy tasks get more visual prominence
        baseSize += energyCost > 8 ? 20 : 0;
        break;
      case 'Autiste':
        // Autiste: More linear scaling, predictable sizing
        baseSize = 50 + (energyCost * 6);
        break;
      case 'Les deux':
        // Combine both approaches with moderation
        baseSize += energyCost > 8 ? 10 : 0;
        baseSize = Math.max(baseSize, 50 + (energyCost * 6));
        break;
    }
    
    return Math.min(baseSize, 140); // Cap at 140px
  }
  
  function formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  }
  
  function handleDragStart(event: DragEvent) {
    if (!draggable) {
      event.preventDefault();
      return;
    }
    
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'floating-task',
        task: task
      }));
      event.dataTransfer.effectAllowed = 'move';
    }
    
    dispatch('dragstart', { task });
  }
  
  function handleDragEnd(event: DragEvent) {
    dispatch('dragend', { task });
  }
</script>

<div 
  class="task-card {neurotype.toLowerCase().replace(' ', '-')} {energyMatch ? 'energy-match' : 'energy-mismatch'}"
  style="height: {visualSize}px"
  draggable={draggable}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  role="listitem"
  aria-label="Tâche : {task.title}, énergie requise : {task.energy_cost}"
>
  <div class="task-header">
    <h3 class="task-title">{task.title}</h3>
    {#if !scheduled && draggable}
      <div class="drag-handle" aria-label="Glisser pour déplacer">⋮⋮</div>
    {/if}
  </div>
  
  <div class="task-meta">
    <div class="duration">
      <span class="meta-label">Durée :</span>
      <span class="meta-value">{formatDuration(task.estimated_duration)}</span>
    </div>
    
    <div class="priority" aria-label="Priorité {task.priority} sur 10">
      <span class="meta-label">Priorité :</span>
      <div class="priority-dots">
        {#each Array(10) as _, i}
          <span class="priority-dot {i < task.priority ? 'active' : ''}"></span>
        {/each}
      </div>
    </div>
  </div>
  
  <div class="task-energy">
    <EnergyIndicator energy={task.energy_cost} size="small" />
    {#if !energyMatch}
      <span class="energy-warning" aria-label="Énergie insuffisante">⚠️</span>
    {/if}
  </div>
  
  {#if task.description}
    <p class="task-description">{task.description}</p>
  {/if}
  
  {#if scheduled && task.scheduled_time}
    <div class="scheduled-time">
      <span class="meta-label">Programmé :</span>
      <time class="meta-value">{task.scheduled_time}</time>
    </div>
  {/if}
</div>

<style>
  .task-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  
  .task-card[draggable="true"] {
    cursor: grab;
  }
  
  .task-card[draggable="true"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .task-card:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  
  /* Neurotype-specific styling */
  .task-card.tdah {
    border-left: 4px solid #3b82f6;
  }
  
  .task-card.autiste {
    border-left: 4px solid #10b981;
  }
  
  .task-card.les-deux {
    border-left: 4px solid #8b5cf6;
  }
  
  /* Energy matching indicators */
  .task-card.energy-match {
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(16, 185, 129, 0.05) 100%);
  }
  
  .task-card.energy-mismatch {
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(239, 68, 68, 0.05) 100%);
  }
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
  
  .task-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.3;
    flex: 1;
  }
  
  .drag-handle {
    color: var(--color-text-muted);
    font-size: 12px;
    cursor: grab;
    padding: var(--spacing-1);
    border-radius: 2px;
    user-select: none;
  }
  
  .drag-handle:hover {
    background: var(--color-background);
  }
  
  .task-meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    font-size: var(--font-size-xs);
  }
  
  .meta-label {
    color: var(--color-text-muted);
    font-weight: 500;
  }
  
  .meta-value {
    color: var(--color-text);
    font-weight: 600;
  }
  
  .duration {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .priority {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .priority-dots {
    display: flex;
    gap: 2px;
  }
  
  .priority-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-border);
    transition: background-color 0.2s ease;
  }
  
  .priority-dot.active {
    background: var(--color-accent);
  }
  
  .task-energy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }
  
  .energy-warning {
    font-size: var(--font-size-sm);
  }
  
  .task-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: 1.4;
    margin: 0;
    flex: 1;
  }
  
  .scheduled-time {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-xs);
    padding-top: var(--spacing-2);
    border-top: 1px solid var(--color-border);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .task-card {
      padding: var(--spacing-2);
    }
    
    .task-title {
      font-size: var(--font-size-xs);
    }
    
    .task-meta {
      font-size: 10px;
    }
  }
</style>