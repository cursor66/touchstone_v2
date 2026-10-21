#!/usr/bin/env bash
# 发布一个正式版本：./scripts/release.sh v1.0.0 "发布说明"
set -Eeuo pipefail

VERSION="${1:?usage: release.sh <version> [notes]}"
NOTES="${2:-}"

[[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo "版本号必须形如 v1.0.0" >&2
  exit 2
}

git tag -a "$VERSION" -m "${NOTES:-$VERSION}"
git push origin "$VERSION"

echo "已推送 tag $VERSION，GitHub Actions 将自动构建并部署。"
