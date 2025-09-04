<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let currentStep = 1;
  let user: any = null;
  let loading = false;
  
  // Setup data
  let setupData = {
    morningEnergy: 8,
    scheduleElements: [] as any[],
    floatingTasks: [] as any[]
  };
  
  // Form states
  let elementForm = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_external: false,
    energy_cost: 5,
    description: ''
  };
  
  let taskForm = {
    title: '',
    estimated_duration: 60,
    energy_cost: 5,
    priority: 5,
    description: ''
  };
  
  onMount(async () => {
    const token = localStorage.getItem('qfqa_token');
    
    if (!token) {
      goto('/login');
      return;
    }
    
    try {
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        user = data.user;
      } else {
        goto('/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      goto('/login');
    }
  });
  
  function nextStep() {
    if (currentStep < 4) {
      currentStep++;
    }
  }
  
  function previousStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  async function addScheduleElement() {
    if (!elementForm.title || !elementForm.date || !elementForm.start_time || !elementForm.end_time) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const element = { ...elementForm };
    setupData.scheduleElements = [...setupData.scheduleElements, element];
    
    // Reset form
    elementForm = {
      title: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      is_external: false,
      energy_cost: 5,
      description: ''
    };
  }
  
  function removeScheduleElement(index: number) {
    setupData.scheduleElements = setupData.scheduleElements.filter((_, i) => i !== index);
  }
  
  async function addFloatingTask() {
    if (!taskForm.title) {
      alert('Le titre de la tâche est obligatoire');
      return;
    }
    
    const task = { ...taskForm };
    setupData.floatingTasks = [...setupData.floatingTasks, task];
    
    // Reset form
    taskForm = {
      title: '',
      estimated_duration: 60,
      energy_cost: 5,
      priority: 5,
      description: ''
    };
  }
  
  function removeFloatingTask(index: number) {
    setupData.floatingTasks = setupData.floatingTasks.filter((_, i) => i !== index);
  }
  
  async function completeSetup() {
    loading = true;
    const token = localStorage.getItem('qfqa_token');
    
    try {
      // Set initial energy level
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/schedule/energy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: today,
          morning_energy: setupData.morningEnergy,
          current_energy: setupData.morningEnergy
        })
      });
      
      // Add schedule elements
      for (const element of setupData.scheduleElements) {
        await fetch('/api/schedule/elements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(element)
        });
      }
      
      // Add floating tasks
      for (const task of setupData.floatingTasks) {
        await fetch('/api/schedule/floating-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(task)
        });
      }
      
      goto('/schedule');
    } catch (error) {
      console.error('Error completing setup:', error);
      alert('Erreur lors de la configuration');
    } finally {
      loading = false;
    }
  }
  
  function formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  }
</script>

<svelte:head>
  <title>Configuration initiale - QFQA</title>
</svelte:head>

<div class="setup-container">
  <div class="setup-progress">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {(currentStep / 4) * 100}%"></div>
    </div>
    <p class="progress-text">Étape {currentStep} sur 4</p>
  </div>
  
  {#if currentStep === 1}
    <section class="setup-step">
      <h1>Bienvenue {user?.username} !</h1>
      
      <div class="welcome-content">
        <p>
          Nous allons configurer votre emploi du temps en tenant compte de votre neurotype 
          <strong>{user?.neurotype}</strong>.
        </p>
        
        <div class="neurotype-info">
          {#if user?.neurotype === 'TDAH'}
            <h3>Configuration adaptée TDAH</h3>
            <ul>
              <li>Tâches importantes le matin quand l'énergie est haute</li>
              <li>Pauses régulières intégrées</li>
              <li>Flexibilité pour les tâches secondaires</li>
            </ul>
          {:else if user?.neurotype === 'Autiste'}
            <h3>Configuration adaptée autisme</h3>
            <ul>
              <li>Structure prévisible et routines</li>
              <li>Temps de récupération après les interactions sociales</li>
              <li>Évitement des surcharges sensorielles</li>
            </ul>
          {:else if user?.neurotype === 'Les deux'}
            <h3>Configuration adaptée TDAH + Autisme</h3>
            <ul>
              <li>Équilibre entre structure et flexibilité</li>
              <li>Gestion de l'énergie et des stimulations</li>
              <li>Routines avec adaptabilité</li>
            </ul>
          {/if}
        </div>
        
        <button class="primary" on:click={nextStep}>
          Commencer la configuration
        </button>
      </div>
    </section>
  
  {:else if currentStep === 2}
    <section class="setup-step">
      <h2>Votre niveau d'énergie matinal</h2>
      
      <div class="energy-setup">
        <p>
          Sur une échelle de 1 à 12, quel est généralement votre niveau d'énergie 
          le matin au réveil ?
        </p>
        
        <div class="energy-selector">
          {#each Array(12) as _, i}
            {@const level = i + 1}
            <button 
              class="energy-option {setupData.morningEnergy === level ? 'selected' : ''}"
              on:click={() => setupData.morningEnergy = level}
            >
              {level}
            </button>
          {/each}
        </div>
        
        <div class="energy-display">
          <p>Niveau sélectionné : <strong>{setupData.morningEnergy}/12</strong></p>
        </div>
      </div>
      
      <div class="step-navigation">
        <button on:click={previousStep}>Précédent</button>
        <button class="primary" on:click={nextStep}>Suivant</button>
      </div>
    </section>
  
  {:else if currentStep === 3}
    <section class="setup-step">
      <h2>Éléments fixes de votre emploi du temps</h2>
      
      <p>
        Ajoutez vos rendez-vous, cours, ou autres activités qui ont lieu à des heures fixes.
      </p>
      
      <form on:submit|preventDefault={addScheduleElement} class="element-form">
        <div class="form-row">
          <div class="form-group">
            <label for="element-title">Titre *</label>
            <input 
              id="element-title"
              type="text" 
              bind:value={elementForm.title} 
              placeholder="Ex: Rendez-vous médecin"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="element-date">Date *</label>
            <input 
              id="element-date"
              type="date" 
              bind:value={elementForm.date}
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="element-start">Heure de début *</label>
            <input 
              id="element-start"
              type="time" 
              bind:value={elementForm.start_time}
              required
            />
          </div>
          
          <div class="form-group">
            <label for="element-end">Heure de fin *</label>
            <input 
              id="element-end"
              type="time" 
              bind:value={elementForm.end_time}
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="element-location">Lieu</label>
            <input 
              id="element-location"
              type="text" 
              bind:value={elementForm.location}
              placeholder="Ex: Cabinet médical"
            />
          </div>
          
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                bind:checked={elementForm.is_external}
              />
              Extérieur (nécessite un déplacement)
            </label>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="element-energy">Coût d'énergie (1-12)</label>
            <input 
              id="element-energy"
              type="range"
              min="1" 
              max="12" 
              bind:value={elementForm.energy_cost}
            />
            <span class="range-value">{elementForm.energy_cost}/12</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="element-description">Description</label>
          <textarea 
            id="element-description"
            bind:value={elementForm.description}
            placeholder="Notes additionnelles..."
          ></textarea>
        </div>
        
        <button type="submit" class="add-button">Ajouter l'élément</button>
      </form>
      
      {#if setupData.scheduleElements.length > 0}
        <div class="added-items">
          <h3>Éléments ajoutés ({setupData.scheduleElements.length})</h3>
          <div class="items-list">
            {#each setupData.scheduleElements as element, index}
              <div class="item-card">
                <div class="item-header">
                  <h4>{element.title}</h4>
                  <button 
                    class="remove-btn" 
                    on:click={() => removeScheduleElement(index)}
                    aria-label="Supprimer {element.title}"
                  >
                    ×
                  </button>
                </div>
                <p class="item-time">
                  {element.date} de {element.start_time} à {element.end_time}
                </p>
                {#if element.location}
                  <p class="item-location">📍 {element.location}</p>
                {/if}
                <p class="item-energy">Énergie: {element.energy_cost}/12</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="step-navigation">
        <button on:click={previousStep}>Précédent</button>
        <button class="primary" on:click={nextStep}>Suivant</button>
      </div>
    </section>
  
  {:else if currentStep === 4}
    <section class="setup-step">
      <h2>Tâches flexibles</h2>
      
      <p>
        Ajoutez vos tâches que vous pouvez planifier librement selon votre énergie.
      </p>
      
      <form on:submit|preventDefault={addFloatingTask} class="task-form">
        <div class="form-row">
          <div class="form-group">
            <label for="task-title">Titre de la tâche *</label>
            <input 
              id="task-title"
              type="text" 
              bind:value={taskForm.title}
              placeholder="Ex: Faire le ménage"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="task-duration">Durée estimée (minutes)</label>
            <input 
              id="task-duration"
              type="number" 
              min="5"
              step="5"
              bind:value={taskForm.estimated_duration}
            />
            <span class="duration-display">{formatDuration(taskForm.estimated_duration)}</span>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="task-energy">Coût d'énergie (1-12)</label>
            <input 
              id="task-energy"
              type="range"
              min="1" 
              max="12" 
              bind:value={taskForm.energy_cost}
            />
            <span class="range-value">{taskForm.energy_cost}/12</span>
          </div>
          
          <div class="form-group">
            <label for="task-priority">Priorité (1-10)</label>
            <input 
              id="task-priority"
              type="range"
              min="1" 
              max="10" 
              bind:value={taskForm.priority}
            />
            <span class="range-value">{taskForm.priority}/10</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="task-description">Description</label>
          <textarea 
            id="task-description"
            bind:value={taskForm.description}
            placeholder="Détails de la tâche..."
          ></textarea>
        </div>
        
        <button type="submit" class="add-button">Ajouter la tâche</button>
      </form>
      
      {#if setupData.floatingTasks.length > 0}
        <div class="added-items">
          <h3>Tâches ajoutées ({setupData.floatingTasks.length})</h3>
          <div class="items-list">
            {#each setupData.floatingTasks as task, index}
              <div class="item-card">
                <div class="item-header">
                  <h4>{task.title}</h4>
                  <button 
                    class="remove-btn" 
                    on:click={() => removeFloatingTask(index)}
                    aria-label="Supprimer {task.title}"
                  >
                    ×
                  </button>
                </div>
                <p class="item-meta">
                  {formatDuration(task.estimated_duration)} • 
                  Énergie: {task.energy_cost}/12 • 
                  Priorité: {task.priority}/10
                </p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="step-navigation">
        <button on:click={previousStep}>Précédent</button>
        <button 
          class="primary" 
          on:click={completeSetup}
          disabled={loading}
        >
          {loading ? 'Configuration...' : 'Terminer'}
        </button>
      </div>
    </section>
  {/if}
</div>

<style>
  .setup-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-4);
  }
  
  .setup-progress {
    margin-bottom: var(--spacing-8);
    text-align: center;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--spacing-2);
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .setup-step {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--spacing-6);
  }
  
  .setup-step h1, .setup-step h2 {
    color: var(--color-accent);
    margin-bottom: var(--spacing-4);
    text-align: center;
  }
  
  .welcome-content {
    text-align: center;
  }
  
  .neurotype-info {
    background: var(--color-background);
    border-radius: 6px;
    padding: var(--spacing-4);
    margin: var(--spacing-6) 0;
    text-align: left;
  }
  
  .neurotype-info h3 {
    color: var(--color-accent);
    margin-bottom: var(--spacing-3);
  }
  
  .neurotype-info ul {
    list-style-position: inside;
    color: var(--color-text-muted);
  }
  
  .neurotype-info li {
    margin-bottom: var(--spacing-1);
  }
  
  .energy-setup {
    text-align: center;
    margin: var(--spacing-6) 0;
  }
  
  .energy-selector {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--spacing-2);
    margin: var(--spacing-4) 0;
  }
  
  .energy-option {
    aspect-ratio: 1;
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .energy-option:hover {
    border-color: var(--color-accent);
  }
  
  .energy-option.selected {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }
  
  .energy-display {
    margin-top: var(--spacing-4);
  }
  
  .element-form, .task-form {
    margin-bottom: var(--spacing-6);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  .form-group label {
    font-weight: 500;
    color: var(--color-text);
  }
  
  .range-value, .duration-display {
    font-size: var(--font-size-sm);
    color: var(--color-accent);
    font-weight: 600;
  }
  
  .add-button {
    width: 100%;
    background: var(--color-accent);
    color: white;
    border: none;
    padding: var(--spacing-3);
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .added-items {
    margin-bottom: var(--spacing-6);
  }
  
  .added-items h3 {
    margin-bottom: var(--spacing-3);
    color: var(--color-text);
  }
  
  .items-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .item-card {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: var(--spacing-3);
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2);
  }
  
  .item-header h4 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-base);
  }
  
  .remove-btn {
    background: var(--color-error);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .item-time, .item-location, .item-energy, .item-meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: var(--spacing-1) 0;
  }
  
  .step-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: var(--spacing-6);
  }
  
  .step-navigation button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .energy-selector {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .step-navigation {
      flex-direction: column;
      gap: var(--spacing-3);
    }
  }
</style>