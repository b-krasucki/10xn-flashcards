# Cloudflare Pages Deployment Setup

## 📋 Przewodnik konfiguracji

### 1. Utworzenie projektu na Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do sekcji **Pages**
3. Kliknij **Create a project**
4. Wybierz **Connect to Git** i połącz repozytorium
5. Skonfiguruj ustawienia build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (domyślne)

### 2. Konfiguracja zmiennych środowiskowych w Cloudflare

W panelu projektu na Cloudflare Pages:
- Przejdź do **Settings** → **Environment variables**
- Dodaj zmienne z pliku `.env.example`:
  ```
  PUBLIC_SUPABASE_URL=your_supabase_url
  PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  OPENROUTER_API_KEY=your_openrouter_key
  ```

### 3. Utworzenie API Token w Cloudflare

1. Przejdź do [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Kliknij **Create Token**
3. Użyj szablon **Custom token** z uprawnieniami:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Zone** → **Zone** → **Read** (jeśli używasz domeny)
4. Skopiuj wygenerowany token

### 4. Konfiguracja sekretów w GitHub

W ustawieniach repozytorium GitHub:
- Przejdź do **Settings** → **Secrets and variables** → **Actions**
- Dodaj nowe sekrety:

| Nazwa sekretu | Opis | Gdzie znaleźć |
|---------------|------|---------------|
| `CLOUDFLARE_API_TOKEN` | Token API z uprawnieniami do Pages | Punkt 3 powyżej |
| `CLOUDFLARE_ACCOUNT_ID` | ID konta Cloudflare | Dashboard → Sidebar (Account ID) |
| `CLOUDFLARE_PROJECT_NAME` | Nazwa projektu Pages | Nazwa utworzona w punkcie 1 |
| `PUBLIC_SUPABASE_URL` | URL Supabase | Panel Supabase → Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Klucz publiczny Supabase | Panel Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Klucz serwisowy Supabase | Panel Supabase → Settings → API |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | Panel OpenRouter |

### 5. Konfiguracja Environments w GitHub

Utwórz środowiska w repozytorium:
1. **production** - dla deploy na master branch
2. **preview** - dla deploy PR-ów

W **Settings** → **Environments** dodaj oba środowiska z odpowiednimi sekretami.

## 🚀 Automatyczne deployment

### Production
- Triggerowane automatycznie przy push na branch `master`
- Deployment następuje tylko po przejściu wszystkich testów
- URL: `https://your-project-name.pages.dev`

### Preview
- Triggerowane automatycznie przy utworzeniu/aktualizacji Pull Request
- Każdy PR otrzymuje unikalny URL preview
- URL: `https://pr-{number}.your-project-name.pages.dev`

## 🔧 Lokalne testowanie Cloudflare

```bash
# Instalacja Wrangler CLI (już zainstalowany w projekcie)
npm install wrangler

# Lokalne uruchomienie z Cloudflare runtime
npx wrangler pages dev dist

# Build i test local deployment
npm run build
npx wrangler pages deploy dist --project-name=your-project-name
```

## 📊 Monitoring

- **Build logs**: Cloudflare Dashboard → Pages → Project → Deployment
- **GitHub Actions logs**: Repository → Actions tab
- **Analytics**: Cloudflare Dashboard → Analytics & Logs

## 🐛 Troubleshooting

### Build failures
1. Sprawdź logi w GitHub Actions
2. Zweryfikuj zmienne środowiskowe
3. Przetestuj build lokalnie: `npm run build`

### Deployment failures
1. Sprawdź uprawnienia API token
2. Zweryfikuj nazwę projektu w secrets
3. Sprawdź czy katalog `dist` zawiera pliki

### Runtime errors
1. Sprawdź logi w Cloudflare Dashboard
2. Zweryfikuj zmienne środowiskowe w Cloudflare
3. Przetestuj lokalne: `npx wrangler pages dev dist`
