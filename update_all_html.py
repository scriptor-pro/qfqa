#!/usr/bin/env python3
"""
Script pour mettre à jour toutes les pages HTML de QFQA avec la nouvelle navigation
"""

import os
import re
from pathlib import Path

def update_html_file(filepath):
    """Met à jour un fichier HTML avec la nouvelle navigation"""
    print(f"Mise à jour de {filepath.name}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Ajouter le CSS navigation si pas déjà présent
    if 'navigation.css' not in content:
        css_pattern = r'(<link rel="stylesheet" href="[^"]*main[^"]*\.css">)'
        if re.search(css_pattern, content):
            content = re.sub(css_pattern, r'\1\n    <link rel="stylesheet" href="/css/navigation.css">', content)
    
    # 2. Remplacer l'ancien header par la nouvelle navigation
    old_nav_pattern = r'</head>\s*<body[^>]*>\s*<a[^>]*skip-link[^>]*>.*?</a>\s*<header class="l-navigation".*?</header>'
    if re.search(old_nav_pattern, content, re.DOTALL):
        content = re.sub(old_nav_pattern, 
            '</head>\n<body class="l-application has-sticky-nav">\n    <a href="#main-content" class="skip-link">Aller au contenu principal</a>\n    \n    <!-- Navigation responsive -->\n    <div id="navigation-placeholder"></div>',
            content, flags=re.DOTALL)
    
    # 3. Alternative: remplacer body sans skip-link
    body_pattern = r'</head>\s*<body[^>]*>\s*<div class="l-application">\s*<header class="l-navigation".*?</header>'
    if re.search(body_pattern, content, re.DOTALL):
        content = re.sub(body_pattern,
            '</head>\n<body class="l-application has-sticky-nav">\n    <a href="#main-content" class="skip-link">Aller au contenu principal</a>\n    \n    <!-- Navigation responsive -->\n    <div id="navigation-placeholder"></div>\n    \n    <div class="l-application">',
            content, flags=re.DOTALL)
    
    # 4. Mettre à jour la classe main
    main_pattern = r'<main[^>]*class="l-main"[^>]*>'
    if re.search(main_pattern, content):
        content = re.sub(main_pattern, '<main class="l-main with-nav" id="main-content" tabindex="-1">', content)
    
    # 5. Ajouter les scripts navigation
    if 'load-navigation.js' not in content:
        script_pattern = r'(<!-- Scripts personnalisés -->)'
        if re.search(script_pattern, content):
            content = re.sub(script_pattern, 
                r'\1\n    <script src="/js/load-navigation.js"></script>\n    <script src="/js/navigation.js"></script>', 
                content)
        else:
            # Chercher avant </body>
            script_pattern = r'(<script src="[^"]*main[^"]*\.js"></script>)'
            if re.search(script_pattern, content):
                content = re.sub(script_pattern, 
                    '<script src="/js/load-navigation.js"></script>\n    <script src="/js/navigation.js"></script>\n    \\1',
                    content)
    
    # Sauvegarder si des changements ont été faits
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} mis à jour")
    else:
        print(f"⚠️ {filepath.name} - aucun changement nécessaire")

def main():
    # Répertoire des fichiers HTML
    public_dir = Path('/home/Baudouin/Documents/Projets/QFQA/public')
    
    # Exclure certains fichiers
    excluded_files = {
        'navigation.html',  # Composant navigation
        'index.html',  # Déjà fait manuellement
    }
    
    html_files = [f for f in public_dir.glob('*.html') if f.name not in excluded_files]
    
    print(f"Mise à jour de {len(html_files)} fichiers HTML...\n")
    
    for html_file in html_files:
        update_html_file(html_file)
        print()
    
    print("✅ Mise à jour terminée!")

if __name__ == "__main__":
    main()