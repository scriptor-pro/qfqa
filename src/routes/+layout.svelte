<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let theme = 'light';
  
  onMount(() => {
    if (browser) {
      theme = localStorage.getItem('theme') || 'light';
      document.body.setAttribute('data-theme', theme);
    }
  });
  
  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    if (browser) {
      localStorage.setItem('theme', theme);
      document.body.setAttribute('data-theme', theme);
    }
  }
</script>

<header>
  <nav>
    <div class="nav-container">
      <div class="nav-brand">
        <h1>QFQA</h1>
        <span class="tagline">Quoi Faire Quand Aujourd'hui</span>
      </div>
      
      <div class="nav-actions">
        <button 
          on:click={toggleTheme}
          aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
          class="theme-toggle"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        <button class="hamburger" aria-label="Menu principal">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>
</header>

<main>
  <slot />
</main>

<style>
  header {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .nav-brand h1 {
    font-size: var(--font-size-xl);
    margin: 0;
    color: var(--color-accent);
  }
  
  .tagline {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    display: block;
  }
  
  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }
  
  .theme-toggle {
    background: none;
    border: none;
    font-size: var(--font-size-lg);
    padding: var(--spacing-2);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 3px;
    background: none;
    border: none;
    padding: var(--spacing-2);
    width: 2.5rem;
    height: 2.5rem;
    justify-content: center;
  }
  
  .hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--color-text);
    border-radius: 1px;
  }
  
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-4);
    min-height: calc(100vh - 80px);
  }
  
  @media (max-width: 768px) {
    main {
      padding: var(--spacing-3);
    }
    
    .tagline {
      display: none;
    }
  }
</style>