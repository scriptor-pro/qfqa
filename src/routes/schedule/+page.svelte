<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import EnergyIndicator from '$lib/components/EnergyIndicator.svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import ScheduleElement from '$lib/components/ScheduleElement.svelte';
  import CalendarPicker from '$lib/components/CalendarPicker.svelte';
  import { createDropZone, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, getNeuroTypeDragBehavior } from '$lib/drag-drop';
  
  let currentDate = new Date();
  let scheduleElements: any[] = [];
  let floatingTasks: any[] = [];
  let currentEnergy = 6;
  let morningEnergy = 8;
  let loading = true;
  let user: any = null;
  let dragBehavior: any = {};
  
  // Generate 24 hour slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return {
      time: `${hour}:00`,
      hour: i,
      elements: [] as any[],
      floatingTasks: [] as any[]
    };
  });
  
  onMount(async () => {
    const token = localStorage.getItem('qfqa_token');
    
    if (!token) {
      goto('/login');
      return;
    }
    
    try {
      // Load user data and schedule
      await loadUserData();
      await loadScheduleData();
      await loadEnergyData();
    } catch (error) {
      console.error('Error loading data:', error);
      localStorage.removeItem('qfqa_token');
      goto('/login');
    } finally {
      loading = false;
    }
  });
  
  async function loadUserData() {
    const token = localStorage.getItem('qfqa_token');
    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      user = data.user;
      dragBehavior = getNeuroTypeDragBehavior(user.neurotype);
    } else {
      throw new Error('Failed to load user data');
    }
  }
  
  async function loadScheduleData() {
    const token = localStorage.getItem('qfqa_token');
    const dateString = currentDate.toISOString().split('T')[0];
    
    const [scheduleResponse, tasksResponse] = await Promise.all([
      fetch(`/api/schedule/elements?date=${dateString}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`/api/schedule/floating-tasks?date=${dateString}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);
    
    if (scheduleResponse.ok && tasksResponse.ok) {
      scheduleElements = (await scheduleResponse.json()).elements;
      floatingTasks = (await tasksResponse.json()).tasks;
      
      // Populate time slots with elements
      scheduleElements.forEach(element => {
        const startHour = parseInt(element.start_time.split(':')[0]);
        const slot = timeSlots[startHour];
        if (slot) {
          slot.elements.push(element);
        }
      });
      
      // Place floating tasks in their assigned slots
      floatingTasks.forEach(task => {
        if (task.scheduled_time) {
          const scheduledHour = parseInt(task.scheduled_time.split(':')[0]);
          const slot = timeSlots[scheduledHour];
          if (slot) {
            slot.floatingTasks.push(task);
          }
        }
      });
    }
  }
  
  async function loadEnergyData() {
    const token = localStorage.getItem('qfqa_token');
    const dateString = currentDate.toISOString().split('T')[0];
    
    const response = await fetch(`/api/schedule/energy?date=${dateString}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.energy) {
        morningEnergy = data.energy.morning_energy || 8;
        currentEnergy = data.energy.current_energy || morningEnergy;
      }
    }
  }
  
  async function updateCurrentEnergy(newEnergy: number) {
    currentEnergy = newEnergy;
    
    const token = localStorage.getItem('qfqa_token');
    const dateString = currentDate.toISOString().split('T')[0];
    
    await fetch('/api/schedule/energy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        date: dateString,
        current_energy: currentEnergy,
        morning_energy: morningEnergy
      })
    });
  }
  
  function onDateChange(newDate: Date) {
    currentDate = newDate;
    // Reset slots and reload data
    timeSlots.forEach(slot => {
      slot.elements = [];
      slot.floatingTasks = [];
    });
    loadScheduleData();
    loadEnergyData();
  }
  
  function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  // Handle task drop onto time slot
  async function handleTaskDrop(task: any, hour: number) {
    const scheduledTime = `${hour.toString().padStart(2, '0')}:00`;
    const dateString = currentDate.toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem('qfqa_token');
      const response = await fetch('/api/schedule/floating-tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: task.id,
          scheduled_date: dateString,
          scheduled_time: scheduledTime
        })
      });
      
      if (response.ok) {
        // Reload schedule data to reflect changes
        await loadScheduleData();
      } else {
        console.error('Failed to update task schedule');
      }
    } catch (error) {
      console.error('Error updating task schedule:', error);
    }
  }
  
  // Get unscheduled floating tasks
  $: unscheduledTasks = floatingTasks.filter(task => !task.scheduled_time);
</script>

<svelte:head>
  <title>Emploi du temps - {formatDate(currentDate)} - QFQA</title>
</svelte:head>

{#if loading}
  <div class="loading">
    <p>Chargement de votre emploi du temps...</p>
  </div>
{:else}
  <div class="schedule-container">
    <!-- Fixed Header -->
    <header class="schedule-header">
      <div class="header-content">
        <div class="date-section">
          <h1>{formatDate(currentDate)}</h1>
          <CalendarPicker bind:selectedDate={currentDate} on:change={(e) => onDateChange(e.detail)} />
        </div>
        
        <div class="energy-section">
          <div class="energy-controls">
            <label for="current-energy">Énergie actuelle</label>
            <EnergyIndicator 
              bind:energy={currentEnergy} 
              on:change={(e) => updateCurrentEnergy(e.detail)}
              interactive={true}
            />
          </div>
        </div>
      </div>
    </header>
    
    <div class="schedule-layout">
      <!-- Main Schedule (24h vertical timeline) -->
      <section class="timeline-schedule">
        <h2 class="sr-only">Emploi du temps de la journée</h2>
        
        {#each timeSlots as slot}
          <div class="time-slot" data-hour={slot.hour}>
            <div class="time-label">
              <time>{slot.time}</time>
            </div>
            
            <div 
              class="slot-content drop-zone"
              on:dragover={(e) => handleDragOver(e, createDropZone(slot.hour, handleTaskDrop))}
              on:dragenter={(e) => handleDragEnter(e, createDropZone(slot.hour, handleTaskDrop))}
              on:dragleave={handleDragLeave}
              on:drop={(e) => handleDrop(e, createDropZone(slot.hour, handleTaskDrop))}
            >
              <!-- Fixed schedule elements -->
              {#each slot.elements as element}
                <ScheduleElement 
                  {element}
                  neurotype={user?.neurotype}
                />
              {/each}
              
              <!-- Floating tasks scheduled for this slot -->
              {#each slot.floatingTasks as task}
                <TaskCard 
                  {task}
                  energyLevel={currentEnergy}
                  neurotype={user?.neurotype}
                  scheduled={true}
                />
              {/each}
              
              <!-- Drop zone indicator -->
              {#if slot.elements.length === 0 && slot.floatingTasks.length === 0}
                <div class="empty-slot">
                  <span class="drop-hint">Glissez une tâche ici</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </section>
      
      <!-- Floating Tasks Sidebar -->
      <aside class="floating-tasks">
        <h2>Tâches à placer</h2>
        
        {#if unscheduledTasks.length > 0}
          <div class="tasks-list">
            {#each unscheduledTasks as task}
              <TaskCard 
                {task}
                energyLevel={currentEnergy}
                neurotype={user?.neurotype}
                scheduled={false}
                draggable={true}
              />
            {/each}
          </div>
        {:else}
          <p class="no-tasks">Toutes vos tâches sont planifiées !</p>
        {/if}
        
        <button class="add-task-btn primary">
          Ajouter une tâche
        </button>
      </aside>
    </div>
  </div>
{/if}

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50vh;
    color: var(--color-text-muted);
  }
  
  .schedule-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .schedule-header {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    position: sticky;
    top: 80px;
    z-index: 50;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-6);
  }
  
  .date-section h1 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-xl);
  }
  
  .energy-section {
    text-align: right;
  }
  
  .energy-controls label {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
  }
  
  .schedule-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: var(--spacing-6);
  }
  
  .timeline-schedule {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }
  
  .time-slot {
    display: grid;
    grid-template-columns: 80px 1fr;
    border-bottom: 1px solid var(--color-border);
    min-height: 60px;
  }
  
  .time-slot:last-child {
    border-bottom: none;
  }
  
  .time-label {
    padding: var(--spacing-3);
    background: var(--color-background);
    border-right: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: 500;
  }
  
  .slot-content {
    padding: var(--spacing-2);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    min-height: 56px;
  }
  
  .floating-tasks {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--spacing-4);
    height: fit-content;
    position: sticky;
    top: 200px;
  }
  
  .floating-tasks h2 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }
  
  .tasks-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
  }
  
  .no-tasks {
    color: var(--color-text-muted);
    font-style: italic;
    margin-bottom: var(--spacing-4);
    text-align: center;
  }
  
  .add-task-btn {
    width: 100%;
  }
  
  /* Drag and drop styles */
  .drop-zone {
    position: relative;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  
  .drop-zone.drag-over {
    background: rgba(var(--color-accent), 0.05);
  }
  
  .drop-zone.valid-drop {
    background: rgba(16, 185, 129, 0.1);
    border: 2px dashed var(--color-success);
  }
  
  .drop-zone.invalid-drop {
    background: rgba(239, 68, 68, 0.1);
    border: 2px dashed var(--color-error);
  }
  
  .empty-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    border: 2px dashed transparent;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .drop-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .drop-zone.drag-over .drop-hint {
    opacity: 1;
  }
  
  .drop-zone.valid-drop .drop-hint {
    color: var(--color-success);
  }
  
  .drop-zone.invalid-drop .drop-hint {
    color: var(--color-error);
  }
  
  /* Dragging state styles */
  :global(.task-card.dragging) {
    transform: rotate(5deg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .schedule-layout {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }
    
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-4);
    }
    
    .energy-section {
      text-align: left;
      width: 100%;
    }
    
    .time-slot {
      grid-template-columns: 60px 1fr;
    }
    
    .floating-tasks {
      position: static;
      order: -1;
    }
  }
</style>