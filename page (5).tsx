name: Deploy Production (Vercel)

on:
  push:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy-production:
    name: Production Deploy
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: 📦 Install Vercel CLI
        run: npm install --global vercel@latest

      - name: ⬇️ Pull Vercel environment information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: 🏗️ Build project artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: 🚀 Deploy to production
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
          echo "production_url=$url" >> $GITHUB_OUTPUT
          echo "✅ Produção atualizada: $url"

      - name: 🏷️ Tag release
        uses: actions/github-script@v7
        with:
          script: |
            const date = new Date().toISOString().split('T')[0];
            const sha = context.sha.substring(0, 7);
            const tagName = `deploy-${date}-${sha}`;
            await github.rest.git.createRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: `refs/tags/${tagName}`,
              sha: context.sha
            });
