<script lang="ts">
  import { goto } from '$app/navigation';
  
  function navigateToRegister() {
    goto('/register');
  }
  
  function navigateToLogin() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>QFQA - Emploi du temps adapté</title>
  <meta name="description" content="Organisez votre journée selon votre neurotype et votre énergie disponible" />
</svelte:head>

<section class="hero">
  <div class="hero-content">
    <h1>Organisez votre journée selon votre neurotype</h1>
    
    <p class="hero-description">
      QFQA vous aide à planifier votre emploi du temps en tenant compte de votre énergie 
      et de vos spécificités TDAH ou autistiques.
    </p>
    
    <div class="hero-features">
      <div class="feature">
        <h3>Adapté à votre neurotype</h3>
        <p>Interface conçue pour les personnes TDAH, autistes, ou les deux</p>
      </div>
      
      <div class="feature">
        <h3>Gestion de l'énergie</h3>
        <p>Planifiez selon votre niveau d'énergie sur une échelle de 1 à 12</p>
      </div>
      
      <div class="feature">
        <h3>Tâches flexibles</h3>
        <p>Déplacez vos tâches par glisser-déposer selon vos besoins</p>
      </div>
    </div>
    
    <div class="hero-actions">
      <button class="primary" on:click={navigateToRegister}>
        Commencer gratuitement
      </button>
      
      <button on:click={navigateToLogin}>
        Se connecter
      </button>
    </div>
  </div>
</section>

<section class="accessibility-note">
  <h2>Conçu pour l'accessibilité</h2>
  <p>
    Cette application respecte les critères WCAG 2.1 AA et suit une philosophie 
    Bauhaus : chaque élément a une fonction précise, sans distraction inutile.
  </p>
  
  <ul class="accessibility-features">
    <li>Interface à mouvements réduits</li>
    <li>Contrastes optimisés</li>
    <li>Navigation au clavier</li>
    <li>Thème sombre/clair</li>
  </ul>
</section>

<style>
  .hero {
    text-align: center;
    padding: var(--spacing-8) 0;
  }
  
  .hero h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-6);
    color: var(--color-text);
  }
  
  .hero-description {
    font-size: var(--font-size-lg);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-8);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-6);
    margin-bottom: var(--spacing-8);
  }
  
  .feature {
    text-align: left;
  }
  
  .feature h3 {
    color: var(--color-accent);
    margin-bottom: var(--spacing-2);
  }
  
  .feature p {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  
  .hero-actions {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .accessibility-note {
    margin-top: var(--spacing-8);
    padding: var(--spacing-6);
    background: var(--color-surface);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
  
  .accessibility-note h2 {
    color: var(--color-accent);
    margin-bottom: var(--spacing-4);
  }
  
  .accessibility-note p {
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-4);
  }
  
  .accessibility-features {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
  }
  
  .accessibility-features li {
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-background);
    border-radius: 4px;
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
  
  @media (max-width: 768px) {
    .hero h1 {
      font-size: var(--font-size-xl);
    }
    
    .hero-description {
      font-size: var(--font-size-base);
    }
    
    .hero-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .hero-actions button {
      width: 100%;
      max-width: 300px;
    }
  }
</style>