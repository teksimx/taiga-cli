# taiga-cli

CLI en TypeScript para interactuar con instancias [Taiga](https://taiga.io) (cloud o self-hosted) mediante la [API REST](https://docs.taiga.io/api.html).

## Requisitos

- Node.js >= 20
- pnpm (desarrollo)

## Instalación

```bash
npm install -g taiga-cli
```

Desarrollo local:

```bash
pnpm install
pnpm build
npm link
```

## Primer uso

```bash
# Autenticarse (Taiga cloud por defecto)
taiga login

# Configurar proyecto por defecto
taiga config set project mi-proyecto

# Ver usuario actual
taiga whoami

# Listar proyectos
taiga projects list
```

### Instancia self-hosted

```bash
# URL base del servidor (con o sin /api/v1 — se normaliza al guardar)
taiga login --url https://taiga.ejemplo.com
taiga config get   # verifica que url apunte a tu instancia, no a api.taiga.io
```

Si el login funciona pero los demás comandos fallan, revisa la URL guardada:

```bash
taiga config set url https://taiga.ejemplo.com
taiga login --url https://taiga.ejemplo.com
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `TAIGA_URL` | URL de la instancia |
| `TAIGA_TOKEN` | Token Bearer |
| `TAIGA_PROJECT` | Slug del proyecto por defecto |
| `TAIGA_INSTANCE` | Nombre de instancia en config |

## Configuración

Archivo: `~/.config/taiga-cli/config.json`

```bash
taiga config get
taiga config set url https://api.taiga.io
taiga config set project mi-proyecto
taiga config use production
```

## Comandos

### Autenticación

- `taiga login [--url] [--username]`
- `taiga logout`
- `taiga whoami`

### Proyectos

- `taiga projects list|show|create|update|delete`
- `taiga projects stats <slug>`
- `taiga projects modules list|update <slug>`
- `taiga projects duplicate <slug> --name <name>`
- `taiga projects export <slug> -o file.json`
- `taiga projects import -i file.json`

### Work items

Patrón común para `user-stories`, `tasks`, `issues`, `epics`:

```bash
taiga user-stories list --project mi-proyecto
taiga user-stories show 42 --project mi-proyecto
taiga user-stories create --project mi-proyecto --subject "Nueva historia"
taiga user-stories update 42 --status "In progress" --project mi-proyecto
taiga user-stories delete 42 --yes --project mi-proyecto
taiga user-stories bulk-create --file items.json --project mi-proyecto
```

Extras:

- **User stories:** `watch`, `unwatch`, `vote`, `unvote`, `filters`
- **Epics:** `link-user-story`, `unlink-user-story`, `related-user-stories`

### Planificación

```bash
taiga milestones list --project mi-proyecto
taiga members list --project mi-proyecto
taiga members invite --project mi-proyecto --email user@example.com --role Developer
taiga users list --project mi-proyecto
taiga users roles list --project mi-proyecto
```

### Búsqueda

```bash
taiga search search "bug" --project mi-proyecto
taiga search resolve 42 --type user-story --project mi-proyecto
```

### Colaboración

```bash
taiga attachments list --type user-story --ref 42 --project mi-proyecto
taiga attachments upload --type task --id 99 --file doc.pdf --project mi-proyecto
taiga comments list --type issue --ref 5 --project mi-proyecto
taiga comments add --type issue --ref 5 --text "Comentario" --project mi-proyecto
taiga tags list --project mi-proyecto
taiga tags create --project mi-proyecto --name bug --color "#ff0000"
```

### Metadatos

```bash
taiga metadata user-story-statuses list --project mi-proyecto
taiga metadata priorities list --project mi-proyecto
taiga metadata custom-attributes list --entity user-story --project mi-proyecto
taiga metadata custom-attributes set-value --entity task --id 5 --attr estimacion --value 3
```

### Wiki y webhooks

```bash
taiga wiki list --project mi-proyecto
taiga wiki create --project mi-proyecto --slug home --content "# Wiki"
taiga wiki links list --project mi-proyecto
taiga webhooks list --project mi-proyecto
taiga webhooks create --project mi-proyecto --name CI --url https://... --key secret
taiga webhooks test 1
```

## Flags globales

- `--url` / `-u` — override de instancia
- `--project` / `-p` — slug de proyecto
- `--format` / `-f` — `table` (default), `json`, `yaml`
- `--verbose` / `-v` — log HTTP
- `--yes` / `-y` — confirmar deletes

## Desarrollo

```bash
pnpm install
pnpm dev -- --help
pnpm test
pnpm test:coverage
pnpm lint
pnpm build
```

## Licencia

MIT
