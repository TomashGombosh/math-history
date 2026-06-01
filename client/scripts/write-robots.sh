#!/usr/bin/env bash
# Adjust client/dist/robots.txt per environment.
#
#   stage = Disallow: / (overrides the public/robots.txt that Vite copied into dist).
#   prod  = ship client/public/robots.txt as-is — that file is the production source of
#           truth (AI crawler allow-list, share-preview crawlers, sitemap URL, host).
#           Verify VITE_SITE_URL matches the Sitemap line so deploy fails loudly on drift.
#
# Usage: VITE_SITE_URL=https://example.com bash scripts/write-robots.sh <stage|prod>
set -euo pipefail

tf_env="${1:-}"
if [[ -z "$tf_env" ]]; then
	echo "Usage: $0 <stage|prod>" >&2
	exit 1
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${root}/dist/robots.txt"

case "$tf_env" in
stage)
	printf '%s\n' \
		'# Staging — not for indexing.' \
		'User-agent: *' \
		'Disallow: /' >"$out"
	;;
prod)
	site_url="${VITE_SITE_URL:-}"
	site_url="${site_url%/}"
	if [[ -z "$site_url" ]]; then
		echo "VITE_SITE_URL must be set for production robots.txt verification." >&2
		exit 1
	fi
	if [[ ! -f "$out" ]]; then
		echo "Expected ${out} to exist (vite build should have copied client/public/robots.txt)." >&2
		exit 1
	fi
	if ! grep -qF "Sitemap: ${site_url}/sitemap.xml" "$out"; then
		echo "robots.txt Sitemap line does not match VITE_SITE_URL=${site_url}." >&2
		echo "Ensure client/public/robots.txt declares: Sitemap: ${site_url}/sitemap.xml" >&2
		exit 1
	fi
	# Public template already contains the full prod policy (AI crawler allow-list,
	# share-preview crawlers, /admin /login /api disallow). No rewrite needed.
	;;
*)
	echo "Unknown environment: ${tf_env} (expected stage or prod)" >&2
	exit 1
	;;
esac
