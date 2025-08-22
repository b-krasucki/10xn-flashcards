import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils/test-utils";
import { GenerateForm } from "@/components/GenerateForm";

// Mock external dependencies
vi.mock("@/lib/utils/toast", () => ({
  toast: vi.fn(),
}));

// Mock child components to focus on GenerateForm logic
vi.mock("@/components/SourceTextInput", () => ({
  SourceTextInput: ({
    value,
    onChange,
    isInvalid,
    minLength,
    maxLength,
  }: {
    value: string;
    onChange: (text: string) => void;
    isInvalid: boolean;
    minLength: number;
    maxLength: number;
  }) => (
    <div data-testid="source-text-input">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-invalid={isInvalid}
        data-min-length={minLength}
        data-max-length={maxLength}
        placeholder="Enter source text"
      />
    </div>
  ),
}));

vi.mock("@/components/CharCounter", () => ({
  CharCounter: ({ count, min, max }: { count: number; min: number; max: number }) => (
    <div data-testid="char-counter">
      {count}/{min}-{max}
    </div>
  ),
}));

vi.mock("@/components/GenerateButton", () => ({
  GenerateButton: ({
    onClick,
    disabled,
    isLoading,
  }: {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
  }) => (
    <button data-testid="generate-button" onClick={onClick} disabled={disabled} data-loading={isLoading}>
      {isLoading ? "Generating..." : "Generate"}
    </button>
  ),
}));

vi.mock("@/components/ModelSelect", () => ({
  ModelSelect: ({ value, onChange }: { value: string; onChange: (model: string) => void }) => (
    <select data-testid="model-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
      <option value="openai/gpt-4">GPT-4</option>
    </select>
  ),
}));

vi.mock("@/components/ErrorMessage", () => ({
  ErrorMessage: ({ message }: { message: string | null }) =>
    message ? <div data-testid="error-message">{message}</div> : null,
}));

vi.mock("@/components/ProposalList", () => ({
  ProposalList: ({
    proposals,
    deckName,
    onSaveSuccess,
  }: {
    proposals: unknown[];
    deckName: string;
    onSaveSuccess: () => void;
  }) => (
    <div data-testid="proposal-list">
      <div data-testid="deck-name">{deckName}</div>
      <div data-testid="proposals-count">{proposals.length}</div>
      <button data-testid="save-button" onClick={onSaveSuccess}>
        Save
      </button>
    </div>
  ),
}));

vi.mock("@/components/OverlayLoader", () => ({
  OverlayLoader: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="overlay-loader">Loading...</div> : null,
}));

describe("GenerateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("renders all form elements with initial state", () => {
      render(<GenerateForm />);

      expect(screen.getByText(/Generuj nowe fiszki/)).toBeInTheDocument();
      expect(screen.getByTestId("model-select")).toBeInTheDocument();
      expect(screen.getByTestId("source-text-input")).toBeInTheDocument();
      expect(screen.getByTestId("char-counter")).toBeInTheDocument();
      expect(screen.getByTestId("generate-button")).toBeInTheDocument();
    });

    it("displays correct initial model selection", () => {
      render(<GenerateForm />);

      const modelSelect = screen.getByTestId("model-select");
      expect(modelSelect).toHaveValue("google/gemini-2.5-flash");
    });

    it("shows character counter with initial values", () => {
      render(<GenerateForm />);

      expect(screen.getByTestId("char-counter")).toHaveTextContent("0/1000-10000");
    });

    it("shows generate button as disabled initially", () => {
      render(<GenerateForm />);

      const generateButton = screen.getByTestId("generate-button");
      expect(generateButton).toBeDisabled();
    });
  });

  describe("Form Interactions", () => {
    it("updates source text when typing", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      fireEvent.change(textarea, { target: { value: "Test content" } });

      expect(textarea).toHaveValue("Test content");
    });

    it("updates model when selection changes", () => {
      render(<GenerateForm />);

      const modelSelect = screen.getByTestId("model-select");
      fireEvent.change(modelSelect, { target: { value: "openai/gpt-4" } });

      expect(modelSelect).toHaveValue("openai/gpt-4");
    });

    it("updates character counter when text changes", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const testText = "a".repeat(1500); // 1500 characters

      fireEvent.change(textarea, { target: { value: testText } });

      expect(screen.getByTestId("char-counter")).toHaveTextContent("1500/1000-10000");
    });
  });

  describe("Text Length Validation", () => {
    it("disables generate button when text is too short", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const generateButton = screen.getByTestId("generate-button");

      fireEvent.change(textarea, { target: { value: "a".repeat(500) } }); // Too short

      expect(generateButton).toBeDisabled();
    });

    it("disables generate button when text is too long", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const generateButton = screen.getByTestId("generate-button");

      fireEvent.change(textarea, { target: { value: "a".repeat(15000) } }); // Too long

      expect(generateButton).toBeDisabled();
    });

    it("enables generate button when text length is valid", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const generateButton = screen.getByTestId("generate-button");

      fireEvent.change(textarea, { target: { value: "a".repeat(2000) } }); // Valid length

      expect(generateButton).not.toBeDisabled();
    });

    it("marks input as invalid when text is present but invalid length", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      fireEvent.change(textarea, { target: { value: "a".repeat(500) } }); // Too short

      const sourceTextInput = screen.getByTestId("source-text-input");
      expect(sourceTextInput.querySelector("textarea")).toHaveAttribute("data-invalid", "true");
    });

    it("does not mark input as invalid when text is empty", () => {
      render(<GenerateForm />);

      const sourceTextInput = screen.getByTestId("source-text-input");
      expect(sourceTextInput.querySelector("textarea")).toHaveAttribute("data-invalid", "false");
    });
  });

  describe("Component Props Validation", () => {
    it("passes correct props to SourceTextInput", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      expect(textarea).toHaveAttribute("data-min-length", "1000");
      expect(textarea).toHaveAttribute("data-max-length", "10000");
    });

    it("passes correct props to CharCounter", () => {
      render(<GenerateForm />);

      // Initial state
      expect(screen.getByTestId("char-counter")).toHaveTextContent("0/1000-10000");

      // After typing
      const textarea = screen.getByPlaceholderText("Enter source text");
      fireEvent.change(textarea, { target: { value: "a".repeat(2500) } });

      expect(screen.getByTestId("char-counter")).toHaveTextContent("2500/1000-10000");
    });

    it("passes correct loading state to GenerateButton", () => {
      render(<GenerateForm />);

      const generateButton = screen.getByTestId("generate-button");
      expect(generateButton).toHaveAttribute("data-loading", "false");
    });
  });

  describe("Form Description and Labels", () => {
    it("displays correct form title", () => {
      render(<GenerateForm />);

      expect(screen.getByText("Generuj nowe fiszki")).toBeInTheDocument();
    });

    it("displays correct form description", () => {
      render(<GenerateForm />);

      expect(
        screen.getByText("Wprowadź materiały do nauki i pozwól AI utworzyć dla Ciebie fiszki")
      ).toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("maintains separate state for text and model", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const modelSelect = screen.getByTestId("model-select");

      // Change text
      fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });
      expect(textarea).toHaveValue("a".repeat(2000));
      expect(modelSelect).toHaveValue("google/gemini-2.5-flash");

      // Change model
      fireEvent.change(modelSelect, { target: { value: "openai/gpt-4" } });
      expect(textarea).toHaveValue("a".repeat(2000));
      expect(modelSelect).toHaveValue("openai/gpt-4");
    });

    it("updates button state based on text validation", () => {
      render(<GenerateForm />);

      const textarea = screen.getByPlaceholderText("Enter source text");
      const generateButton = screen.getByTestId("generate-button");

      // Initially disabled
      expect(generateButton).toBeDisabled();

      // Still disabled with short text
      fireEvent.change(textarea, { target: { value: "short" } });
      expect(generateButton).toBeDisabled();

      // Enabled with valid text
      fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });
      expect(generateButton).not.toBeDisabled();

      // Disabled again with long text
      fireEvent.change(textarea, { target: { value: "a".repeat(15000) } });
      expect(generateButton).toBeDisabled();
    });
  });
});
