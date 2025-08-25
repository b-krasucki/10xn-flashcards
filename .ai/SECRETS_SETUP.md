# GitHub Secrets Setup dla E2E Tests

Aby E2E testy mogły się łączyć z prawdziwą bazą Supabase, musisz dodać następujące secrets w GitHub repository settings.

## 🔑 Wymagane Secrets

Przejdź do: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. Supabase Database Credentials

```
PUBLIC_SUPABASE_URL
```

- **Wartość**: URL do twojego projektu Supabase (np. `https://abcdefg.supabase.co`)
- **Gdzie znaleźć**: Supabase Dashboard → Project Settings → API → Project URL

```
PUBLIC_SUPABASE_ANON_KEY
```

- **Wartość**: Anon key z twojego projektu Supabase
- **Gdzie znaleźć**: Supabase Dashboard → Project Settings → API → Project API keys → anon key

### 2. E2E Test User Credentials

```
E2E_TEST_USER_EMAIL
```

- **Wartość**: Email użytkownika testowego (np. `test@yourdomain.com`)
- **Uwaga**: Ten użytkownik musi być zarejestrowany w twojej bazie Supabase

```
E2E_TEST_USER_PASSWORD
```

- **Wartość**: Hasło użytkownika testowego
- **Uwaga**: Musi być silne hasło zgodne z polityką Supabase

## 🏗️ Przygotowanie bazy danych testowej

### Opcja 1: Osobna instancja Supabase dla testów

Zalecane: stwórz osobny projekt Supabase dla testów E2E:

1. Stwórz nowy projekt w Supabase Dashboard
2. Uruchom migracje: `supabase db push`
3. Użyj credentials z tego projektu w GitHub Secrets

### Opcja 2: Użycie głównej bazy danych

Jeśli używasz głównej bazy:

1. Stwórz dedykowanego użytkownika testowego
2. Użyj credentials z głównego projektu
3. **Uwaga**: Testy mogą wpływać na dane produkcyjne

## 📋 Checklist

- [ ] `PUBLIC_SUPABASE_URL` dodany do GitHub Secrets
- [ ] `PUBLIC_SUPABASE_ANON_KEY` dodany do GitHub Secrets
- [ ] `E2E_TEST_USER_EMAIL` dodany do GitHub Secrets
- [ ] `E2E_TEST_USER_PASSWORD` dodany do GitHub Secrets
- [ ] Użytkownik testowy zarejestrowany w bazie Supabase
- [ ] Struktura bazy zgodna z migracjami projektu

## 🔍 Weryfikacja

Po dodaniu secrets, uruchom workflow GitHub Actions:

1. Push/PR do branch `master`
2. Sprawdź logs w Actions tab
3. E2E testy powinny łączyć się z prawdziwą bazą

## 🚨 Bezpieczeństwo

- **NIE** commituj prawdziwych credentials do kodu
- Użyj silnych haseł dla użytkowników testowych
- Rozważ osobną instancję Supabase dla testów
- Regularnie rotuj credentials

## 🐛 Troubleshooting

### Błąd: "Missing required Supabase environment variables"

- Sprawdź czy wszystkie 4 secrets są dodane
- Sprawdź pisownię nazw secrets

### Błąd: "Invalid login credentials"

- Sprawdź czy użytkownik testowy istnieje w bazie
- Sprawdź czy hasło jest poprawne
- Sprawdź czy użytkownik ma potwierdzonego email

### Błąd: "fetch failed" / network errors

- Sprawdź czy `PUBLIC_SUPABASE_URL` jest poprawny
- Sprawdź czy projekt Supabase jest aktywny
