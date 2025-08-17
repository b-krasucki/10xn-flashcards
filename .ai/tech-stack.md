Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie - Kompleksowe pokrycie wszystkich typów testów:

**Testy jednostkowe:**

- Vitest jako framework testowy dla TypeScript/React z szybkim wykonaniem
- React Testing Library do testowania komponentów w izolacji z naciskiem na zachowanie użytkownika
- MSW (Mock Service Worker) do mockowania API i zewnętrznych serwisów

**Testy E2E (End-to-End):**

- Playwright do automatyzacji testów w przeglądarkach z obsługą wielu silników (Chromium, Firefox, Safari)
- Cypress jako alternatywa dla testów E2E z interaktywnym trybem debugowania

**Testy wydajnościowe i bezpieczeństwa:**

- Lighthouse do audytu wydajności i dostępności aplikacji
- k6 do testów obciążeniowych API
- OWASP ZAP do skanowania podatności bezpieczeństwa
- npm audit do analizy zależności pod kątem znanych podatności

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD z automatycznym uruchamianiem testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
