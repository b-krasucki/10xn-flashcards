# REST API Plan

## 1. Resources

- **Users**: Represents the users table managed through Supabase Auth. Contains user credentials and profile data.
- **Flashcards**: Represents the flashcards table which stores flashcard data (front, back, source, timestamps, and relations to generations).
- **Generations**: Represents AI generation requests. Stores details such as the model used, generated counts, source text hash/length, generation duration and timestamps.
- **Generation Error Logs**: Represents logs for errors occurring during the AI flashcard generation process. Records error codes and messages along with associated user data.

## 2. Endpoints

### Flashcards

- **GET /flashcards**

  - **Description**: Retrieve a paginated list of flashcards for the authenticated user.
  - **Query Parameters**:
    - `page`: Page number for pagination
    - `limit`: Number of flashcards per page
    - `source`: Filter by flashcard source (`ai-full`, `ai-edited`, `manual`)
    - `sort`: Field to sort by (e.g., created_at)
  - **Response**: JSON array of flashcard objects.
  - **Status Codes**: 200 OK, 401 Unauthorized, 500 Internal Server Error

- **POST /flashcards**

  - **Description**: Create one or multiple flashcards. Supports manual creation and AI-generated flashcards. Associates flashcards with a deck, creating the deck by `deck_name` if it doesn't exist for the authenticated user.
  - **Request Payload**:
    ```json
    {
      "deck_name": "string (required, max 100 characters)",
      "flashcards": [
        {
          "front": "string (required, max 200 characters)",
          "back": "string (required, max 500 characters)",
          "source": "manual | ai-full | ai-edited",
          "generation_id": "number | null (required when source is ai-full or ai-edited)"
        }
      ]
    }
    ```
  - **Validations**:

    - `deck_name` must not be empty and cannot exceed 100 characters.
    - `flashcards` array must not be empty.
    - Each flashcard's `front` side must not be empty and cannot exceed 200 characters.
    - Each flashcard's `back` side must not be empty and cannot exceed 500 characters.
    - Each flashcard's `source` must be one of: "manual", "ai-full", "ai-edited".
    - If a flashcard's `source` is "ai-full" or "ai-edited", `generation_id` must reference a valid generation.
    - If a flashcard's `source` is "manual", `generation_id` must be null.
    - User can only create flashcards for themselves and assign them to their own decks.

  - **Response**: JSON object containing the deck information and an array of created flashcards.
    ```json
    {
      "deck": {
        "id": "number",
        "deck_name": "string",
        "user_id": "string" 
      },
      "flashcards": [
        {
          "id": "number",
          "deck_id": "number",
          "front": "string",
          "back": "string",
          "source": "manual | ai-full | ai-edited",
          "generation_id": "number | null",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ]
    }
    ```
  - **Status Codes**:
    - 201 Created: Flashcards successfully created
    - 400 Bad Request: Validation errors (invalid length, missing required fields)
    - 401 Unauthorized: User not authenticated
    - 403 Forbidden: User trying to create flashcards for another user
    - 404 Not Found: Referenced generation_id doesn't exist
    - 500 Internal Server Error: Server-side error

- **GET /flashcards/{id}**

  - **Description**: Retrieve details of a specific flashcard by its ID.
  - **Response**: JSON flashcard object.
  - **Status Codes**: 200 OK, 401 Unauthorized, 404 Not Found

- **PUT/PATCH /flashcards/{id}**
  - **Description**: Update a flashcard's content (front, back, or source). This applies to both manually created and edited AI-generated flashcards.
  - **Request Payload**:
    ```json
    {
      "front": "string",
      "back": "string",
      "source": "ai-edited"
    }
    ```
- **Validations**:

  - Front side must not be empty and cannot exceed 200 characters
  - Back side must not be empty and cannot exceed 500 characters
  - Source must be one of: 'ai-edited' or 'manual'

  - **Response**: JSON object of the updated flashcard.
  - **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found

- **DELETE /flashcards/{id}**
  - **Description**: Delete a specific flashcard.
  - **Response**: { "message": "Flashcard deleted successfully." }
  - **Status Codes**: 200 OK, 401 Unauthorized, 404 Not Found

### Generations

- **POST /generations**

  - **Description**: Initiate flashcard proposals generation via AI. Validates that the input text meets the length requirements (1000 to 10000 characters) and calls the external LLM API (e.g., through Openrouter.ai).
  - **Request Payload**:
    ```json
    {
      "model": "string", // e.g., 'gpt-4'
      "source_text": "string" // Input text for generating flashcards
    }
    ```
  - **Response**:
    ```json
    {
      "generation_id": 123,
      "generated_count": 5,
      "proposals": [
        { "front": "Question 1", "back": "Answer 1", "source": "ai-full" },
        { "front": "Question 2", "back": "Answer 2", "source": "ai-full" }
      ]
    }
    ```
  - **Status Codes**: 201 Created, 400 Bad Request (if text length is invalid), 500 Internal Server Error

- **GET /generations/{id}**

  - **Description**: Retrieve details of a specific generation request along with its proposed flashcards.
  - **Response**: JSON object containing generation details and the associated flashcard proposals.
  - **Status Codes**: 200 OK, 401 Unauthorized, 404 Not Found

- **GET /generations**
  - **Description**: List past generation requests for the authenticated user.
  - **Query Parameters**: Pagination options
  - **Response**: JSON array of generation objects.
  - **Status Codes**: 200 OK, 401 Unauthorized

### Generation Error Logs

- **GET /generation-error-logs**
  - **Description**: Retrieve error logs for AI generation requests.
  - **Query Parameters**:
    - `page`, `limit` for pagination
    - `error_code` for filtering
  - **Response**: JSON array of error log objects.
  - **Status Codes**: 200 OK, 401 Unauthorized

## 3. Authentication and Authorization

- All API endpoints require authentication via a valid JWT token, which should be provided in the `Authorization: Bearer <token>` header.
- User authentication operations (registration, login) are managed by Supabase Auth.
- Role-based access control is enforced at the database level using Row-Level Security (RLS), ensuring that users can only access and modify records associated with their own user ID.

## 4. Validation and Business Logic

- **Input Validation**:

  - For the `/generations` endpoint, the `source_text` must have a length between 1000 and 10000 characters as per the DB schema check constraints.
  - For flashcards, the `source` field is restricted to the values: `ai-full`, `ai-edited`, or `manual`.

- **Business Logic**:

  - **AI Flashcard Generation**: When a POST request is made to `/generations`, the API calls an external LLM API (e.g., Openrouter.ai) to generate flashcard proposals. The generation process records statistics (generated count, generation duration, etc.) and creates associated flashcard proposals.
  - 'source_text_hash' - Computed for duplicate detection

  - **Flashcard Approval and Editing**: Users review generated flashcards and can choose to accept, edit, or reject individual proposals. Accepted flashcards are then stored in the `flashcards` table with appropriate source tagging.
  - 'front' - Maximum lenght of 200 characters
  - 'back' - Maximum lenght of 500 characters

- **Error Handling and Logging**:
  - The API returns appropriate HTTP status codes (e.g., 400 for validation errors, 401 for unauthorized access, 404 for not found, and 500 for internal errors).
  - Detailed error messages are provided to clients in the response.
  - Errors during the AI generation process are logged in the `generation_error_logs` table with relevant error codes and messages.
