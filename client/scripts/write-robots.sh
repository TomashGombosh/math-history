#!/usr/bin/env bash
# Write client/dist/robots.txt for stage (noindex) or prod (public + Sitemap).
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
		echo "VITE_SITE_URL must be set for production robots.txt (Sitemap URL)." >&2
		exit 1
	fi
	printf '%s\n' \
		'User-agent: *' \
		'Allow: /' \
		'' \
		'Disallow: /admin/' \
		'Disallow: /api/' \
		'' \
		"Sitemap: ${site_url}/sitemap.xml" >"$out"
	;;
*)
	echo "Unknown environment: ${tf_env} (expected stage or prod)" >&2
	exit 1
	;;
esac
