#!/usr/bin/env python3
"""
Script pour ajouter les favicons aux pages HTML de QFQA-test
"""

import os
import re
from pathlib import Path

def add_favicons_to_html(filepath):
    """Ajoute les favicons à un fichier HTML"""
    print(f"Vérification des favicons dans {filepath.name}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Vérifier si les favicons sont déjà présents
    if 'favicon.svg' in content:
        print(f"✅ {filepath.name} - favicons déjà présents")
        return
    
    # Trouver où insérer les favicons (après theme-color)
    theme_pattern = r'(<meta name="theme-color" content="[^"]*">)'
    if re.search(theme_pattern, content):
        favicon_html = '''
    
    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
    <link rel="shortcut icon" href="/favicon.ico">'''
        
        content = re.sub(theme_pattern, r'\1' + favicon_html, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} - favicons ajoutés")
    else:
        print(f"⚠️ {filepath.name} - impossible de trouver theme-color")

def main():
    # Répertoire des fichiers HTML
    public_dir = Path('/home/Baudouin/Documents/Projets/QFQA-test/public')
    
    # Fichiers HTML à traiter
    html_files = list(public_dir.glob('*.html'))
    
    print(f"Ajout des favicons à {len(html_files)} fichiers HTML...\n")
    
    for html_file in html_files:
        if html_file.name != 'navigation.html':  # Exclure le composant
            add_favicons_to_html(html_file)
        print()
    
    print("✅ Ajout des favicons terminé!")

if __name__ == "__main__":
    main()