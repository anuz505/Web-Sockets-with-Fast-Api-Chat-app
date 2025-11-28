import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

const errorMessages = [
  "Well, this is awkward...",
  "Even our error page has better design than most apps.",
  "404: Sarcasm not found. Wait, that's ironic.",
  "You've discovered our secret broken page. Congratulations?",
  "Error: Success failed successfully.",
];

const Notfound: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % errorMessages.length);
        setIsVisible(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl w-full text-center space-y-12 sm:space-y-16 lg:space-y-20">
        {/* Error Code Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center space-x-4 sm:space-x-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-black flex items-center justify-center">
              <span className="font-bebas text-3xl sm:text-4xl md:text-5xl">
                !
              </span>
            </div>
          </div>

          <h1 className="font-bebas text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-wider leading-none">
            SOMETHING<span className="text-gray-400"> WENT WRONG</span>
          </h1>

          <div className="w-16 sm:w-20 md:w-24 h-px bg-black mx-auto"></div>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 font-light tracking-wide px-4">
            ERROR 404: PAGE NOT FOUND
          </p>
        </div>

        {/* Rotating messages */}
        <div className="h-16 sm:h-20 md:h-24 flex items-center justify-center px-4">
          <p
            className={`text-lg sm:text-xl md:text-2xl font-light italic transition-all duration-500 max-w-xs sm:max-w-md md:max-w-2xl ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            "{errorMessages[currentMessage]}"
          </p>
        </div>

        {/* CTA Section */}
        <div className="space-y-6 sm:space-y-8 px-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button
              className="group bg-black text-white px-8 sm:px-10 md:px-12 py-3 sm:py-4 font-bebas text-lg sm:text-xl tracking-wider hover:bg-gray-800 transition-colors duration-300 w-full sm:w-auto sm:min-w-[200px] max-w-xs sm:max-w-none"
              onClick={() => navigate("/")}
            >
              GO HOME
              <div className="w-0 group-hover:w-full h-px bg-white transition-all duration-300 mx-auto mt-1"></div>
            </button>

            <button
              className="border-2 border-black text-black px-8 sm:px-10 md:px-12 py-3 sm:py-4 font-bebas text-lg sm:text-xl tracking-wider hover:bg-black hover:text-white transition-all duration-300 w-full sm:w-auto sm:min-w-[200px] max-w-xs sm:max-w-none"
              onClick={() => navigate(-1)}
            >
              GO BACK
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 pt-6 sm:pt-8">
            <div className="w-12 sm:w-16 h-px bg-gray-300"></div>
            <span className="text-gray-400 text-xs sm:text-sm">●</span>
            <div className="w-12 sm:w-16 h-px bg-gray-300"></div>
          </div>

          {/* Bottom text */}
          <p className="text-gray-400 text-xs sm:text-sm font-light tracking-wide px-4">
            LOST? CONFUSED? WELCOME TO THE CLUB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notfound;
