<script lang="ts">
  export let element: any;
  export let neurotype: string;
  
  $: duration = calculateDuration(element.start_time, element.end_time);
  $: visualHeight = Math.max(60, duration * 1.2); // Minimum 60px, scale with duration
  
  function calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }
  
  function formatTime(time: string): string {
    return time.slice(0, 5); // Remove seconds if present
  }
  
  function getLocationIcon(isExternal: boolean): string {
    return isExternal ? '📍' : '🏠';
  }
</script>

<div 
  class="schedule-element {neurotype.toLowerCase().replace(' ', '-')} {element.is_external ? 'external' : 'home'}"
  style="height: {visualHeight}px"
  role="listitem"
  aria-label="Événement : {element.title} de {formatTime(element.start_time)} à {formatTime(element.end_time)}"
>
  <div class="element-header">
    <h3 class="element-title">{element.title}</h3>
    <div class="time-range">
      <time class="start-time">{formatTime(element.start_time)}</time>
      <span class="time-separator">-</span>
      <time class="end-time">{formatTime(element.end_time)}</time>
    </div>
  </div>
  
  <div class="element-details">
    {#if element.location}
      <div class="location">
        <span class="location-icon" aria-label={element.is_external ? 'Extérieur' : 'Domicile'}>
          {getLocationIcon(element.is_external)}
        </span>
        <span class="location-text">{element.location}</span>
      </div>
    {/if}
    
    <div class="energy-info">
      <span class="energy-label">Énergie :</span>
      <div class="energy-cost">
        <span class="cost-value">{element.energy_cost}</span>
        <span class="cost-max">/12</span>
        {#if element.travel_energy_cost > 0}
          <span class="travel-cost" aria-label="Coût trajet : {element.travel_energy_cost}">
            (+{element.travel_energy_cost})
          </span>
        {/if}
      </div>
    </div>
    
    {#if element.description}
      <p class="element-description">{element.description}</p>
    {/if}
  </div>
  
  <div class="energy-bar">
    <div 
      class="energy-fill energy-{element.energy_cost}"
      style="width: {(element.energy_cost / 12) * 100}%"
      aria-label="Niveau d'énergie requis : {element.energy_cost} sur 12"
    ></div>
    {#if element.travel_energy_cost > 0}
      <div 
        class="travel-energy-fill"
        style="width: {(element.travel_energy_cost / 12) * 100}%; left: {(element.energy_cost / 12) * 100}%"
        aria-label="Énergie trajet : {element.travel_energy_cost} sur 12"
      ></div>
    {/if}
  </div>
</div>

<style>
  .schedule-element {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  /* Neurotype-specific styling */
  .schedule-element.tdah {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(59, 130, 246, 0.05) 100%);
  }
  
  .schedule-element.autiste {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(16, 185, 129, 0.05) 100%);
  }
  
  .schedule-element.les-deux {
    border-left: 4px solid #8b5cf6;
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(139, 92, 246, 0.05) 100%);
  }
  
  /* Location-based styling */
  .schedule-element.external {
    border-right: 3px solid var(--color-warning);
  }
  
  .schedule-element.home {
    border-right: 3px solid var(--color-success);
  }
  
  .element-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
  
  .element-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.3;
    flex: 1;
  }
  
  .time-range {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: 500;
    white-space: nowrap;
  }
  
  .time-separator {
    margin: 0 var(--spacing-1);
  }
  
  .element-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    flex: 1;
  }
  
  .location {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
  }
  
  .location-icon {
    font-size: 14px;
  }
  
  .location-text {
    color: var(--color-text-muted);
    font-weight: 500;
  }
  
  .energy-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-xs);
  }
  
  .energy-label {
    color: var(--color-text-muted);
    font-weight: 500;
  }
  
  .energy-cost {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }
  
  .cost-value {
    font-weight: 600;
    color: var(--color-text);
  }
  
  .cost-max {
    color: var(--color-text-muted);
  }
  
  .travel-cost {
    color: var(--color-warning);
    font-weight: 600;
    font-size: 10px;
  }
  
  .element-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: 1.4;
    margin: 0;
  }
  
  .energy-bar {
    position: relative;
    width: 100%;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
    margin-top: auto;
  }
  
  .energy-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .travel-energy-fill {
    position: absolute;
    top: 0;
    height: 100%;
    background: var(--color-warning);
    opacity: 0.7;
    transition: all 0.3s ease;
  }
  
  /* Energy level colors (reuse from app.css) */
  .energy-fill.energy-1 { background: var(--energy-1); }
  .energy-fill.energy-2 { background: var(--energy-2); }
  .energy-fill.energy-3 { background: var(--energy-3); }
  .energy-fill.energy-4 { background: var(--energy-4); }
  .energy-fill.energy-5 { background: var(--energy-5); }
  .energy-fill.energy-6 { background: var(--energy-6); }
  .energy-fill.energy-7 { background: var(--energy-7); }
  .energy-fill.energy-8 { background: var(--energy-8); }
  .energy-fill.energy-9 { background: var(--energy-9); }
  .energy-fill.energy-10 { background: var(--energy-10); }
  .energy-fill.energy-11 { background: var(--energy-11); }
  .energy-fill.energy-12 { background: var(--energy-12); }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .schedule-element {
      padding: var(--spacing-2);
    }
    
    .element-title {
      font-size: var(--font-size-xs);
    }
    
    .element-details {
      font-size: 10px;
    }
  }
</style>