# 10xn-flashcards
A flashcards application that helps users quickly create, manage, and learn from flashcard sets. The application leverages advanced LLM APIs to generate flashcard suggestions based on provided text, while also allowing manual creation and editing. It supports user authentication, spaced repetition study sessions, and performance tracking.

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
10xn-flashcards is designed to simplify the process of creating high-quality educational flashcards. With a combination of AI-powered flashcard generation and manual editing, users can quickly transform their study material into effective learning tools. Key features include:

- Automatic flashcard generation using LLM integration.
- Manual creation, editing, and deletion of flashcards.
- User registration and authentication.
- Integration with spaced repetition algorithms for efficient learning sessions.
- Collection and analysis of flashcard generation statistics.

## Tech Stack
**Frontend:**
- Astro 5
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui

**Backend:**
- Supabase (PostgreSQL, authentication, and more)

**AI Integration:**
- Openrouter.ai for interfacing with multiple language models (e.g., OpenAI, Anthropic, Google)

**CI/CD & Hosting:**
- GitHub Actions for pipeline automation
- DigitalOcean for Docker-based hosting

## Getting Started Locally
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd 10xn-flashcards
   ```
2. **Use the correct Node.js version:**
   The project requires Node.js version specified in the `.nvmrc` file **22.14.0**:
   ```bash
   nvm use
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
5. **Build and preview the project:**
   - To build the project for production:
     ```bash
     npm run build
     ```
   - To preview the production build:
     ```bash
     npm run preview
     ```

## Available Scripts
The following scripts are available in the project (as defined in `package.json`):

- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build locally.
- **`npm run astro`**: Executes Astro CLI commands.
- **`npm run lint`**: Runs ESLint to check code quality and potential issues.
- **`npm run lint:fix`**: Automatically fixes linting errors.
- **`npm run format`**: Formats code using Prettier.

## Project Scope
The scope of 10x-cards includes:

- **Automatic Flashcard Generation:** Using LLM, the application generates flashcard suggestions from user-provided text.
- **Manual Flashcard Management:** Users can create, edit, and delete flashcards manually.
- **User Authentication:** Secure registration, login, and account management.
- **Spaced Repetition:** Integration with spaced repetition algorithms to facilitate effective learning sessions.
- **Usage Statistics:** Tracking the efficiency of flashcard generation and user acceptance.

*Note:* Advanced features such as a custom spaced repetition algorithm, gamification, multi-document import, public API, or mobile application support are not included in this MVP.

## Project Status
This project is currently in the MVP stage. Features are actively being developed and refined based on user feedback.

## License
This project is licensed under the MIT License.
