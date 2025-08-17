// Test data fixtures for E2E tests

export const testUsers = {
  validUser: {
    email: process.env.E2E_TEST_USER_EMAIL || "perseusz@world.com",
    password: process.env.E2E_TEST_USER_PASSWORD || "idesobie!",
  },
  invalidUser: {
    email: "invalid@example.com",
    password: "wrongPassword",
  },
  newUser: {
    email: "newuser@example.com",
    password: "newPassword123!",
  },
};

export const testDecks = {
  sampleDeck: {
    name: "Testowa Talia",
    description: "Talia do celów testowych",
  },
  mathDeck: {
    name: "Matematyka",
    description: "Podstawowe pojęcia i wzory matematyczne",
  },
  historyDeck: {
    name: "Historia Świata",
    description: "Ważne wydarzenia historyczne i daty",
  },
};

export const testFlashcards = {
  basicCard: {
    front: "Jaka jest stolica Francji?",
    back: "Paryż",
  },
  mathCard: {
    front: "Ile to 2 + 2?",
    back: "4",
  },
  historyCard: {
    front: "Kiedy zakończyła się II wojna światowa?",
    back: "1945",
  },
};

export const testSourceTexts = {
  shortText: "React to biblioteka JavaScript do tworzenia interfejsów użytkownika.",
  longText: `
    React to darmowa biblioteka JavaScript typu open-source do tworzenia interfejsów użytkownika 
    opartych na komponentach. Jest utrzymywana przez Meta (dawniej Facebook) oraz społeczność 
    indywidualnych programistów i firm. React może być używany do tworzenia aplikacji jednostronicowych, 
    mobilnych lub renderowanych po stronie serwera za pomocą frameworków takich jak Next.js.
  `.trim(),
  technicalText: `
    TypeScript to silnie typowany język programowania oparty na JavaScript, 
    zapewniający lepsze narzędzia w dowolnej skali. TypeScript dodaje statyczne definicje typów 
    do JavaScript. Typy umożliwiają opisanie kształtu obiektu, zapewniając 
    lepszą dokumentację i pozwalając TypeScript na walidację poprawności kodu.
  `.trim(),
};
