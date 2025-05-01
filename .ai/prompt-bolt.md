Cel:
Stworzyć minimalną wersję aplikacji umożliwiającej generowanie fiszek przy użyciu AI. Aplikacja ma przyjmować tekst wprowadzony przez użytkownika, wysyłać go do zewnętrznego API (OpenAI) w celu otrzymania propozycji fiszek (pary: pytanie i odpowiedź), a następnie wyświetlać je w przejrzystej liście.

Wymagania:

1. Interfejs użytkownika zbudowany w oparciu o Astro z komponentami React i TypeScript. Stylizacja z wykorzystaniem Tailwind CSS.
2. Jeden ekran z prostym formularzem:
   - Pole tekstowe do wklejenia tekstu (minimum niezbędna walidacja – (1000-10 000 znaków).
   - Przycisk "Generuj fiszki", który wywoła żądanie do API AI.
3. Integracja z API modelu AI przez usługę Openrouter.ai:
   - Wysłanie wprowadzonego tekstu do API.
   - Odbiór odpowiedzi zawierającej listę wygenerowanych fiszek (każda fiszka to obiekt zawierający przód (pytanie) i tył (odpowiedź)).
4. Prezentacja wyników:
   - Wyświetlenie wygenerowanych fiszek w formie listy, gdzie każda fiszka pokazuje pytanie i odpowiadające mu rozwiązanie.
5. Wyłączenie wszystkich dodatkowych funkcji:
   - Brak rejestracji, logowania, ręcznego tworzenia czy edycji fiszek oraz pozostałych funkcjonalności niezbędnych do podstawowej weryfikacji PoC.

Dodatkowe wytyczne przed przystąpieniem do implementacji:

- Proszę najpierw opracować szczegółowy plan prac, obejmujący główne etapy:
  a. Analiza wymagań i projekt interfejsu.
  b. Implementacja formularza i komponentu odpowiedzialnego za wywołania API.
  c. Integracja z zewnętrznym API (OpenAI) oraz odbiór odpowiedzi.
  d. Wyświetlanie listy wygenerowanych fiszek oraz testy funkcjonalne.
- Upewnij się, że cały plan jest kompletny i logicznie uporządkowany.
- Przed wdrożeniem pełnej implementacji, proszę o przedstawienie planu i uzyskanie mojej akceptacji.

Proszę wygenerować pełny plan prac wraz z wstępnym szkicem architektury systemu, a następnie oczekuj na moją akceptację przed rozpoczęciem implementacji końcowego PoC.
