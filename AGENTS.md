# Bijouterie Petit

Les brochures du hero sont dans `.counter-room` et suivent exactement le comptoir : aucune parallaxe, translation ou animation indépendante ne doit être réintroduite sur `.counter-stationery` ou `.counter-paper-parallax`.

Le plan SVG et ses métadonnées sont livrés dans `dist/assets/ales-neighbourhood.*`, issus du géocodage IGN/BAN et des géométries OpenStreetMap. Ne pas inventer de rues ni utiliser de génération d'image pour un plan d'accès. Le générateur et les sources sont documentés dans `tools/NEIGHBOURHOOD-MAP.md`. Les visuels d'atelier et de collections sont des illustrations contemporaines générées ; ne pas les présenter comme des archives familiales ou des photographies de personnes identifiées.

Respecter le brief du client, les textes et la direction artistique : crème, suède, bois brun, accents dorés, typographie éditoriale. Le hero présente un coffret poussé par une seule main depuis la droite, sur le comptoir.

Pour les animations, lire les skills officiels GSAP dans `.agents/skills/gsap-core/SKILL.md`, `gsap-timeline/SKILL.md`, `gsap-scrolltrigger/SKILL.md` et `gsap-performance/SKILL.md` (les trois derniers sont également sous `.agents/skills/`). Les huit skills viennent de https://github.com/greensock/gsap-skills, sous licence MIT, sans adaptation de leurs API. La copie projet est utilisée car l'emplacement personnel Codex est protégé dans cette session.

Conserver le scroll natif, les liens d'ancrage, le clavier et prefers-reduced-motion. Ne pas réintroduire la coulée dorée. La validation responsive Chrome est dans `.github/scripts/check-counter.cjs`. Le formulaire n'est pas connecté à n8n : ne pas annoncer de demande envoyée.
