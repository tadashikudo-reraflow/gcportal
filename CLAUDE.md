# CLAUDE.md - PJ19 GCInsight (gcportal)

## Gitブランチ運用（必須）

- **作業前に必ず `develop` ブランチ（または `feature/xxx`）で作業すること**
- **`main` への直接コミット禁止**（mainは常にリリース可能な状態のみ）
- バグ修正（緊急）→ `main` から `hotfix/xxx` を切る → main にマージ → develop にも反映
- 通常開発 → `develop` にコミット → リリース時に main へマージ

```bash
# 作業開始時
git checkout develop
git pull origin develop

# 新機能の場合
git checkout -b feature/xxx develop
```
