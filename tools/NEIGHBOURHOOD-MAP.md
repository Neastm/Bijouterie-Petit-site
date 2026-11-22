# Plan de quartier de la Bijouterie Petit

Le plan livré est une production cartographique SVG à partir de géométries réelles OpenStreetMap, avec un géocodage d'adresse IGN/BAN. Les rues, bâtiments et plans d'eau ne sont pas générés par IA.

- Géocodage : https://data.geopf.fr/geocodage/search
- Données : https://api.openstreetmap.org/api/0.6/map
- Adresse géocodée : 18 Rue Saint Vincent 30100 Alès
- Coordonnées : longitude 4.078672, latitude 44.123702 ; score 0.9680581818181818.
- Projection : Web Mercator locale ; nord en haut ; point de la boutique au centre du cadre.
- Crédit à conserver : © OpenStreetMap contributors, ODbL, https://www.openstreetmap.org/copyright ; adresse IGN/BAN.

`build-neighbourhood-map.cjs` génère le SVG et les métadonnées JSON quand les fichiers ne sont pas livrés. Les deux fichiers sont inclus dans le dépôt pour assurer des publications sans dépendre des API externes. Le script refuse un géocodage ambigu ou éloigné d'Alès et des géométries de rues incomplètes. Il faut lire chaque ouverture de balise node, sans englober ses voisines autofermantes, pour conserver toutes les coordonnées OSM.

La carte initiale est statique et n'intercepte pas le scroll. Le bouton Explorer ouvre une carte Google intégrée à la demande. Les itinéraires sont calculés par Google Maps à partir de l'adresse, sans géolocalisation automatique par le site.

Les JPEG craft-editorial, collection-ring et collection-watch sont des illustrations générées contemporaines ; la photographie de travail n'est pas une archive de la famille Petit.
