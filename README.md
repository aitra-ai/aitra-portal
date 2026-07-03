# aitra-portal

Web portal for the [Aitra](https://github.com/aitra-ai) unified AI service platform — model marketplace, playground, API-key management, deployment orchestration, and admin dashboards (billing, rate limits, MCP, skills).

Built with Vue 3 + TypeScript + Vite + Element Plus. Backend: [aitra-server](https://github.com/aitra-ai/aitra-server).

## Development

```bash
npm install
cp .env.example .env   # point VITE_API_BASE / VITE_CASDOOR_URL at your aitra-server & Casdoor
npm run dev
```

## Build

```bash
npm run build
```
