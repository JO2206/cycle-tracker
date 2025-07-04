# 🌸 Cycle Tracker - Suivi du Cycle Menstruel

Une application web moderne pour suivre et analyser votre cycle menstruel avec des graphiques et des statistiques détaillées.

## ✨ Fonctionnalités

- 📅 **Suivi complet des cycles** : dates, durée, intensité du flux
- 🩺 **Symptômes détaillés** : avant (SPM) et pendant le cycle
- 📊 **Graphiques et statistiques** : visualisation des tendances
- 🔍 **Détection d'irrégularités** automatique
- 📱 **Design responsive** : parfait sur mobile et desktop
- ☁️ **Synchronisation cloud** avec Supabase (optionnel)
- 💾 **Sauvegarde locale** : fonctionne hors ligne
- 📤 **Export des données** au format JSON

## 🚀 Déploiement

### GitHub Pages (Automatique)
1. Clonez ce repository
2. Configurez vos secrets GitHub (voir section Configuration)
3. Pushez sur la branche `main`
4. GitHub Actions déploiera automatiquement sur GitHub Pages

### Local
```bash
# Installation
npm install

# Développement
npm start

# Build de production
npm run build
```

## ⚙️ Configuration Supabase (Optionnel)

### 1. Configuration de la base de données
Créez une table `cycles` dans Supabase avec cette structure :

```sql
CREATE TABLE cycles (
  id BIGSERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  flow TEXT DEFAULT 'normal',
  symptoms TEXT[],
  pre_symptoms TEXT[],
  notes TEXT,
  length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies pour accès public (à adapter selon vos besoins)
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON cycles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON cycles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON cycles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON cycles FOR DELETE USING (true);
```

### 2. Variables d'environnement
Créez un fichier `.env` basé sur `.env.example` :

```bash
REACT_APP_SUPABASE_URL=votre_url_supabase
REACT_APP_SUPABASE_ANON_KEY=votre_clé_anonyme
```

### 3. Secrets GitHub
Dans votre repository GitHub, allez dans Settings > Secrets and variables > Actions et ajoutez :
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 🛡️ Sécurité et Confidentialité

- **Données locales** : Vos données sont stockées localement dans votre navigateur
- **Chiffrement** : Communication sécurisée avec Supabase via HTTPS
- **Anonymat** : Aucune donnée personnelle identifiable n'est collectée
- **Contrôle total** : Vous pouvez exporter vos données à tout moment

## 📱 Utilisation

1. **Ajouter un cycle** : Cliquez sur "Ajouter un cycle" et remplissez les informations
2. **Voir les statistiques** : Les graphiques et moyennes se mettent à jour automatiquement
3. **Détecter les irrégularités** : L'app vous alerte en cas de variations importantes
4. **Exporter vos données** : Bouton "Exporter" pour sauvegarder au format JSON

## 🎨 Technologies

- **React 18** : Interface utilisateur moderne
- **Recharts** : Graphiques interactifs
- **Tailwind CSS** : Design responsive
- **Supabase** : Base de données cloud (optionnel)
- **GitHub Pages** : Hébergement gratuit

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation

## 💡 Support

Si vous avez des questions ou des problèmes :
1. Consultez la documentation
2. Vérifiez les [Issues](https://github.com/JO2206/cycle-tracker/issues) existantes
3. Créez une nouvelle issue si nécessaire

---

🌸 **Prenez soin de vous et de votre santé !** 🌸
