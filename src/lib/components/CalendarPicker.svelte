<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let selectedDate: Date = new Date();
  
  const dispatch = createEventDispatcher();
  
  let showCalendar = false;
  let calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  
  function toggleCalendar() {
    showCalendar = !showCalendar;
    if (showCalendar) {
      calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
  }
  
  function selectDate(date: Date) {
    selectedDate = new Date(date);
    dispatch('change', selectedDate);
    showCalendar = false;
  }
  
  function navigateMonth(direction: number) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1);
  }
  
  function getCalendarDays(): (Date | null)[] {
    const firstDay = new Date(calendarMonth);
    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }
    
    return days;
  }
  
  function isToday(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  function isSameDay(date1: Date | null, date2: Date): boolean {
    if (!date1) return false;
    return date1.toDateString() === date2.toDateString();
  }
  
  function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showCalendar = false;
    }
  }
  
  // Close calendar when clicking outside
  function handleClickOutside(event: Event) {
    if (!event.target) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-picker')) {
      showCalendar = false;
    }
  }
  
  $: if (showCalendar && typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside);
  } else if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="calendar-picker">
  <button 
    class="date-selector"
    on:click={toggleCalendar}
    aria-label="Sélectionner une date"
    aria-expanded={showCalendar}
  >
    <span class="calendar-icon">📅</span>
    <span class="sr-only">Changer de date</span>
  </button>
  
  {#if showCalendar}
    <div class="calendar-dropdown" role="dialog" aria-label="Sélecteur de date">
      <div class="calendar-header">
        <button 
          class="nav-button"
          on:click={() => navigateMonth(-1)}
          aria-label="Mois précédent"
        >
          ‹
        </button>
        
        <h3 class="month-year">{formatMonthYear(calendarMonth)}</h3>
        
        <button 
          class="nav-button"
          on:click={() => navigateMonth(1)}
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>
      
      <div class="calendar-grid">
        <div class="weekday-header">
          {#each ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as day}
            <div class="weekday">{day}</div>
          {/each}
        </div>
        
        <div class="days-grid">
          {#each getCalendarDays() as day}
            {#if day}
              <button
                class="day-button {isToday(day) ? 'today' : ''} {isSameDay(day, selectedDate) ? 'selected' : ''}"
                on:click={() => selectDate(day)}
                aria-label="Sélectionner le {day.getDate()} {formatMonthYear(day)}"
              >
                {day.getDate()}
              </button>
            {:else}
              <div class="empty-day"></div>
            {/if}
          {/each}
        </div>
      </div>
      
      <div class="calendar-actions">
        <button 
          class="today-button"
          on:click={() => selectDate(new Date())}
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-picker {
    position: relative;
    display: inline-block;
  }
  
  .date-selector {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: var(--spacing-2);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .date-selector:hover {
    background: var(--color-background);
  }
  
  .date-selector:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  
  .calendar-icon {
    filter: grayscale(100%);
  }
  
  .calendar-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-4);
    min-width: 280px;
    margin-top: var(--spacing-2);
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
  }
  
  .nav-button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: var(--spacing-2);
    color: var(--color-text);
    cursor: pointer;
    font-size: var(--font-size-lg);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-button:hover {
    background: var(--color-background);
  }
  
  .month-year {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    text-transform: capitalize;
  }
  
  .calendar-grid {
    margin-bottom: var(--spacing-3);
  }
  
  .weekday-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: var(--spacing-2);
  }
  
  .weekday {
    text-align: center;
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    padding: var(--spacing-2);
  }
  
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  
  .day-button {
    background: none;
    border: none;
    padding: var(--spacing-2);
    color: var(--color-text);
    cursor: pointer;
    font-size: var(--font-size-sm);
    border-radius: 4px;
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .day-button:hover {
    background: var(--color-background);
  }
  
  .day-button:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
  
  .day-button.today {
    background: var(--color-accent);
    color: white;
  }
  
  .day-button.selected {
    background: var(--color-primary);
    color: white;
  }
  
  .day-button.today.selected {
    background: var(--color-accent);
  }
  
  .empty-day {
    min-height: 2rem;
  }
  
  .calendar-actions {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-3);
    display: flex;
    justify-content: center;
  }
  
  .today-button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: var(--spacing-2) var(--spacing-4);
    color: var(--color-accent);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 500;
  }
  
  .today-button:hover {
    background: var(--color-background);
  }
  
  @media (max-width: 768px) {
    .calendar-dropdown {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      max-width: 320px;
    }
  }
</style>