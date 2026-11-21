# GSAP MCP pour Codex

Serveur communautaire : https://github.com/bruzethegreat/gsap-master-mcp-server, version 2.2.0, licence MIT, auteur bruzethegreat. Ce serveur n'est pas un service officiel GreenSock.

Adaptations locales : d�claration des capacit�s tools requise par le SDK MCP 1.x, ex�cution TypeScript native dans Node 24, et variable GSAP_MCP_SDK_URL optionnelle permettant d'utiliser un SDK d�j� install�. Aucun acc�s r�seau n'est n�cessaire � l'ex�cution ; les outils fournissent des r�f�rences et du code.

Installation portable : `npm install --ignore-scripts` dans ce dossier, puis `npm start`. Configuration Codex du projet dans `.codex/config.toml`. Sur un autre PC, mettre � jour le chemin du serveur, et supprimer GSAP_MCP_SDK_URL apr�s npm install. Les huit skills officiels GreenSock sont sous `.agents/skills/gsap-*` et sont charg�s selon AGENTS.md.
