# 🔧 Fix Line Endings Locally

Jeśli masz problemy z końcami linii na Windows, wykonaj następujące kroki:

## 🚀 Quick Fix

```bash
# 1. Skonfiguruj git globalnie
git config --global core.autocrlf false
git config --global core.eol lf

# 2. Sformatuj kod lokalnie
npm run format

# 3. Napraw linting
npm run lint:fix

# 4. Sprawdź czy wszystko jest OK
npm run lint
npm run test

# 5. Commituj zmiany
git add .
git commit -m "fix: normalize line endings and formatting"
```

## 🔄 Dla całego repozytorium

Jeśli problem dotyczy całego repo:

```bash
# Windows (PowerShell)
Get-ChildItem -Recurse -Include "*.js","*.jsx","*.ts","*.tsx","*.mjs","*.json","*.astro","*.css","*.html","*.md","*.yml","*.yaml" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "`r`n", "`n"
    Set-Content $_.FullName $content -NoNewline
}

# Lub zainstaluj dos2unix na Windows i użyj:
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.json" -o -name "*.astro" -o -name "*.css" -o -name "*.html" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./node_modules/*" -exec dos2unix {} \;
```

## 📝 Dlaczego to się dzieje?

- Windows używa CRLF (`\r\n`) jako końce linii
- Linux/Mac używa LF (`\n`) jako końce linii
- GitHub Actions uruchamia się na Ubuntu (Linux)
- Prettier wymaga spójnych końców linii

## ✅ Weryfikacja

Po naprawie powinieneś zobaczyć:

```
✅ Code is properly formatted
✅ All linting issues resolved
✅ Tests passing
```

## 🚨 Zapobieganie

1. Plik `.gitattributes` automatycznie normalizuje końce linii
2. CI/CD automatycznie naprawia problemy
3. Skonfiguruj edytor aby używał LF końców linii
