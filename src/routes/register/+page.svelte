<script lang="ts">
  import { goto } from '$app/navigation';
  import { validatePasswordStrength } from '$lib/auth';
  
  let formData = {
    username: '',
    email: '',
    password: '',
    neurotype: 'TDAH'
  };
  
  let passwordStrength = { score: 0, crackTime: 'Instantané', feedback: [] };
  let errors: string[] = [];
  let loading = false;
  let usernameAvailable = true;
  let emailValid = true;
  
  $: {
    if (formData.password) {
      passwordStrength = validatePasswordStrength(formData.password);
    }
  }
  
  async function checkUsername() {
    if (!formData.username || formData.username.length < 3) return;
    
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username })
      });
      
      const result = await response.json();
      usernameAvailable = result.available;
    } catch (error) {
      console.error('Erreur vérification nom utilisateur:', error);
    }
  }
  
  function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailValid = emailRegex.test(formData.email);
  }
  
  async function handleSubmit() {
    errors = [];
    
    if (!usernameAvailable) {
      errors.push('Ce nom d\'utilisateur n\'est pas disponible');
    }
    
    if (!emailValid) {
      errors.push('Adresse email invalide');
    }
    
    if (passwordStrength.score < 3) {
      errors.push('Mot de passe trop faible');
    }
    
    if (errors.length > 0) return;
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('qfqa_token', result.token);
        goto('/setup');
      } else {
        errors = [result.message || 'Erreur lors de l\'inscription'];
      }
    } catch (error) {
      errors = ['Erreur de connexion au serveur'];
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Inscription - QFQA</title>
</svelte:head>

<div class="register-container">
  <form on:submit|preventDefault={handleSubmit} class="register-form">
    <h1>Créer un compte</h1>
    
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
        on:blur={checkUsername}
        required
        minlength="3"
        class:invalid={!usernameAvailable}
      />
      {#if !usernameAvailable}
        <span class="field-error">Ce nom d'utilisateur n'est pas disponible</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="email">Adresse email</label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        on:blur={validateEmail}
        required
        class:invalid={!emailValid}
      />
      {#if !emailValid}
        <span class="field-error">Adresse email invalide</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        required
        minlength="8"
      />
      
      {#if formData.password}
        <div class="password-strength">
          <div class="strength-bar">
            <div 
              class="strength-fill strength-{passwordStrength.score}"
              style="width: {(passwordStrength.score / 5) * 100}%"
            ></div>
          </div>
          <p class="crack-time">Temps pour craquer : {passwordStrength.crackTime}</p>
          
          {#if passwordStrength.feedback.length > 0}
            <ul class="password-feedback">
              {#each passwordStrength.feedback as suggestion}
                <li>{suggestion}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="neurotype">Votre neurotype</label>
      <select id="neurotype" bind:value={formData.neurotype} required>
        <option value="TDAH">TDAH</option>
        <option value="Autiste">Autiste</option>
        <option value="Les deux">Les deux</option>
      </select>
    </div>
    
    <button type="submit" class="primary" disabled={loading || !usernameAvailable || !emailValid}>
      {loading ? 'Création en cours...' : 'Créer mon compte'}
    </button>
    
    <p class="login-link">
      Déjà un compte ? <a href="/login">Se connecter</a>
    </p>
  </form>
</div>

<style>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: calc(100vh - 120px);
    padding: var(--spacing-4);
  }
  
  .register-form {
    width: 100%;
    max-width: 400px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--spacing-8);
  }
  
  .register-form h1 {
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
  
  .form-group input.invalid,
  .form-group select.invalid {
    border-color: var(--color-error);
  }
  
  .field-error {
    display: block;
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
  }
  
  .password-strength {
    margin-top: var(--spacing-3);
  }
  
  .strength-bar {
    width: 100%;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: var(--spacing-2);
  }
  
  .strength-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .strength-0 { background: var(--color-error); }
  .strength-1 { background: #f87171; }
  .strength-2 { background: var(--color-warning); }
  .strength-3 { background: #fbbf24; }
  .strength-4 { background: var(--color-success); }
  .strength-5 { background: #10b981; }
  
  .crack-time {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
  }
  
  .password-feedback {
    list-style: none;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .password-feedback li {
    margin-bottom: var(--spacing-1);
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
  
  .login-link {
    text-align: center;
    margin-top: var(--spacing-4);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .login-link a {
    color: var(--color-accent);
    text-decoration: none;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .register-container {
      padding: var(--spacing-2);
    }
    
    .register-form {
      padding: var(--spacing-6);
    }
  }
</style>