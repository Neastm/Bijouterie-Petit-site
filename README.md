# Bijouterie Petit — ébauche

Site statique, servi depuis `dist/`. Après clonage : `npm install`, `npm run build`, puis `npm run dev` et http://127.0.0.1:5175/. Le build copie Three.js localement et décompresse l'export 3D de secours. Le navigateur charge prioritairement le modèle gzip de 425 Ko environ.

La montre est créée dans Blender par `blender/build_watch.py`. Le fichier `.blend` est éditable ; son export GLB est lu avec Three.js. Il s'agit d'une reconstruction visuelle depuis une photographie, sans cotes constructeur ni géométrie du fabricant.

Le fond est une adaptation du shader LiquidChrome de React Bits, couleur or/crème et déformation radiale liée à la position projetée de la montre. Ce comportement est une simulation visuelle par shader, pas une simulation mécanique de tissu.

Le formulaire de cette ébauche n'envoie rien : le webhook n8n reste à configurer côté serveur. Aucun secret ne doit être ajouté au JavaScript public.

La preview porte `noindex,nofollow`. Les informations et services proviennent du site actuel, https://bijouteriepetit.boutiquesolo.com/. Les horaires ne sont pas publiés car ils sont contradictoires selon les sources. Le favicon est un monogramme provisoire.

La navigation suit le principe des panneaux Card Nav ; le comportement est implémenté localement sans dépendance React. Les sources et licences tierces figurent dans THIRD-PARTY-NOTICES.md.

## Direction revue
La version publiée utilise un packshot officiel Tissot en préparation de la future vidéo. Le modèle 3D retravaillé reste dans blender/ et assets/ mais n’est plus chargé par le hero. Source externe Tissot ; vérifier droits et fournir une copie autorisée avant production.
