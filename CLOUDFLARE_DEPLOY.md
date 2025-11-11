# Cloudflare Pages Deployment Guide

## Build Configuration

In your Cloudflare Pages dashboard, configure:

1. **Build command**: `npm run build:cloudflare`
2. **Build output directory**: `.vercel/output/static`
3. **Node version**: `20` (set in environment variables as `NODE_VERSION=20`)

## Required Environment Variables

Make sure to set these in Cloudflare Pages dashboard:

- `DATABASE_URL` - Your PostgreSQL connection string
- `SPOTIFY_CLIENT_ID` - Spotify OAuth client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify OAuth client secret
- `NEXTAUTH_URL` - Your Cloudflare Pages URL (e.g., `https://your-project.pages.dev`)
- `NEXTAUTH_SECRET` - A random secret for NextAuth
- `NEXT_PUBLIC_TICKET_REDIRECT_URL` - Your redirect URL (if applicable)

## Prisma Setup

The `postinstall` script automatically runs `prisma generate` during the build process. Make sure your `DATABASE_URL` is accessible from Cloudflare's build environment.

## Common Build Issues

1. **Prisma Client not found**: Ensure `DATABASE_URL` is set and Prisma can generate the client
2. **Build timeout**: Cloudflare Pages has a 20-minute build limit. If your build takes longer, optimize dependencies
3. **Missing dependencies**: Ensure all packages are in `package.json`, not just `package-lock.json`

## Troubleshooting

If the build fails:
1. Check the build logs in Cloudflare dashboard
2. Verify all environment variables are set
3. Ensure `@cloudflare/next-on-pages` is installed (it's in devDependencies)
4. Check that your database is accessible from Cloudflare's IP ranges

