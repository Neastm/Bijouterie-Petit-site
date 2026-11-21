# GSAP MCP pour Codex

Serveur communautaire : https://github.com/bruzethegreat/gsap-master-mcp-server, version 2.2.0, licence MIT, auteur bruzethegreat. Ce serveur n'est pas un service officiel GreenSock.

Adaptations locales : déclaration des capacités tools requise par le SDK MCP 1.x, exécution TypeScript native dans Node 24, et variable GSAP_MCP_SDK_URL optionnelle permettant d'utiliser un SDK déjà installé. Aucun accès réseau n'est nécessaire à l'exécution ; les outils fournissent des références et du code.

Installation portable : `npm install --ignore-scripts` dans ce dossier, puis `npm start`. Configuration Codex du projet dans `.codex/config.toml`. Sur un autre PC, mettre à jour le chemin du serveur. Le SDK et ses dépendances sont installés localement sur le PC de Nathan, sans dépendance à son cache npm. Les huit skills officiels GreenSock sont sous `.agents/skills/gsap-*` et sont chargés selon AGENTS.md.
