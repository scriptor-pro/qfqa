<script lang="ts">
  import { goto } from '$app/navigation';
  
  let formData = {
    username: '',
    password: ''
  };
  
  let errors: string[] = [];
  let loading = false;
  
  async function handleSubmit() {
    errors = [];
    loading = true;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('qfqa_token', result.token);
        goto('/schedule');
      } else {
        errors = [result.message || 'Erreur lors de la connexion'];
      }
    } catch (error) {
      errors = ['Erreur de connexion au serveur'];
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Connexion - QFQA</title>
</svelte:head>

<div class="login-container">
  <form on:submit|preventDefault={handleSubmit} class="login-form">
    <h1>Se connecter</h1>
    
    {#if errors.length > 0}
      <div class="errors">
        {#each errors as error}
          <p>{error}</p>
        {/each}
      </div>
    {/if}
    
    <div class="form-group">
      <label for="username">Nom d'utilisateur</label>
      <input
        id="username"
        type="text"
        bind:value={formData.username}
        required
        autocomplete="username"
      />
    </div>
    
    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        required
        autocomplete="current-password"
      />
    </div>
    
    <button type="submit" class="primary" disabled={loading}>
      {loading ? 'Connexion...' : 'Se connecter'}
    </button>
    
    <p class="register-link">
      Pas encore de compte ? <a href="/register">S'inscrire</a>
    </p>
  </form>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 120px);
    padding: var(--spacing-4);
  }
  
  .login-form {
    width: 100%;
    max-width: 400px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--spacing-8);
  }
  
  .login-form h1 {
    text-align: center;
    color: var(--color-accent);
    margin-bottom: var(--spacing-6);
  }
  
  .form-group {
    margin-bottom: var(--spacing-4);
  }
  
  .form-group label {
    display: block;
    margin-bottom: var(--spacing-2);
    font-weight: 500;
    color: var(--color-text);
  }
  
  .errors {
    background: #fef2f2;
    border: 1px solid var(--color-error);
    border-radius: 4px;
    padding: var(--spacing-3);
    margin-bottom: var(--spacing-4);
  }
  
  .errors p {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .register-link {
    text-align: center;
    margin-top: var(--spacing-4);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .register-link a {
    color: var(--color-accent);
    text-decoration: none;
  }
  
  .register-link a:hover {
    text-decoration: underline;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .login-container {
      padding: var(--spacing-2);
    }
    
    .login-form {
      padding: var(--spacing-6);
    }
  }
</style>