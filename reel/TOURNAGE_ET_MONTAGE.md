# Reel « 3 trucs tout bêtes » — tournage et montage

## Ce qu'il faut filmer

| Prise | Décor | Texte (avec tes mots) |
|---|---|---|
| 1 | Face caméra | « Y a des soirs, j'ouvre mon cours, je lis la première ligne… et je sais déjà que je vais rien retenir. » |
| 2 | Face caméra | « Pendant longtemps, j'ai cru que c'était moi le problème… j'ai tout essayé : les fiches, les applis, les plannings super carrés. » |
| 3 | Face caméra | « Et en fait, ce qui a vraiment changé les choses pour moi, c'est trois trucs tout bêtes. » |
| 4 | **Assis à ton bureau** | « Le premier : quand j'ai vraiment pas envie, je me dis que je m'y mets juste cinq minutes… » |
| 5 | Face caméra | « Le deuxième : j'ai arrêté de garder le plus dur pour le soir… » |
| 6 | Face caméra | « Et le troisième : le matin, je choisis trois choses à faire… » |
| 7 | Face caméra | « Si t'es dans cette période où t'arrives à rien, enregistre cette vidéo… » |

Tu peux enchaîner plusieurs prises dans un même fichier : je coupe.

## Cadrage (c'est ce qui manquait la dernière fois)

- **Téléphone vertical**, objectif à hauteur des yeux, posé (pas tenu à la main).
- **Le haut de ta tête au milieu de l'écran.** Toute la moitié haute reste vide (mur) : c'est là que surgissent les éléments.
- **On voit ton buste** jusqu'en bas de l'écran : les sous-titres se posent sur ta poitrine.
- **Mur simple derrière toi**, pas de cadre ni de lampe au-dessus de la tête.
- **Regarde l'objectif**, pas l'écran.

## Son et lumière

- Fenêtre ou lampe **face à toi**, jamais derrière.
- Pièce calme, téléphone à moins d'un mètre. Si tu as des écouteurs avec micro, utilise-les.
- **Reste immobile 2 secondes** avant de parler et après ta dernière phrase. Ne te penche pas pour couper.

## Ce que je fais à la réception

1. Transcription mot à mot, coupe des blancs et des tics (`prep_edit.py propose` puis `finalize`).
2. Recadrages francs à chaque coupe, coup de zoom sur les mots forts.
3. Sous-titres à trois étages calés sur ta voix, mot fort en jaune.
4. Éléments au-dessus de ta tête : pile d'icônes (« fiches, applis, plannings »), trois cartes floutées qui deviennent nettes une par une, chrono, batterie, cases cochées.
5. Voix nettoyée, effets sonores discrets, export 1080×1920 en 60 i/s (`render_motion.js` + `mix_edit.sh`).

Envoie les fichiers d'origine (pas une capture d'écran) : l'image reste nette.
