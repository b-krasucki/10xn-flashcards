import React, { useState } from "react";

interface FlashcardProps {
  question: string;
  answer: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <button
      className="w-full h-[150px] cursor-pointer [perspective:1000px]"
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateX(180deg)]" : ""
        }`}
      >
        {/* Front (Question) */}
        <div className="absolute w-full h-full border rounded-lg p-6 shadow-md flex items-center justify-center text-center bg-white [backface-visibility:hidden]">
          <p className="text-xl font-semibold">{question}</p>
        </div>

        {/* Back (Answer) */}
        <div className="absolute w-full h-full border rounded-lg p-6 shadow-md flex items-center justify-center text-center bg-white [backface-visibility:hidden] [transform:rotateX(180deg)]">
          <p className="text-lg">{answer}</p>
        </div>
      </div>
    </button>
  );
};

export default Flashcard;
