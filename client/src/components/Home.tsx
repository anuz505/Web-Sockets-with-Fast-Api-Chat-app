import React, { useState, useEffect } from "react";

const Home: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const sarcasmQuotes = [
    "Finally, a chat app that gets your dry humor.",
    "Where your witty comebacks go to shine... or die trying.",
    "Because the world needed another place for your hot takes.",
    "Sarcasm so sharp, it might actually cut through the internet.",
    "Warning: Side effects may include increased sass levels.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % sarcasmQuotes.length);
        setIsVisible(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [sarcasmQuotes.length]);

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl w-full text-center space-y-12 sm:space-y-16 lg:space-y-20">
        {/* Logo section */}
        <div className="space-y-4 sm:space-y-6">
          <h1 className="font-bebas text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-wider leading-none">
            SARCASM<span className="text-gray-400">SYNC</span>
          </h1>
          <div className="w-16 sm:w-20 md:w-24 h-px bg-black mx-auto"></div>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 font-light tracking-wide px-4">
            WHERE WIT MEETS WIT
          </p>
        </div>

        {/* Rotating quotes */}
        <div className="h-16 sm:h-20 md:h-24 flex items-center justify-center px-4">
          <p
            className={`text-lg sm:text-xl md:text-2xl font-light italic transition-all duration-500 max-w-xs sm:max-w-md md:max-w-2xl ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            "{sarcasmQuotes[currentQuote]}"
          </p>
        </div>

        {/* Features - Minimal grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 md:gap-16 py-8 sm:py-12 md:py-16 px-4">
          <div className="space-y-3 sm:space-y-4 animate-slide-up">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black mx-auto flex items-center justify-center">
              <span className="font-bebas text-lg sm:text-xl">01</span>
            </div>
            <h3 className="font-bebas text-xl sm:text-2xl tracking-wider">
              DETECTION
            </h3>
            <p className="text-gray-600 font-light leading-relaxed text-sm sm:text-base px-2 sm:px-0">
              AI that actually gets sarcasm. Unlike some people we know.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 animate-slide-up delay-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black mx-auto flex items-center justify-center">
              <span className="font-bebas text-lg sm:text-xl">02</span>
            </div>
            <h3 className="font-bebas text-xl sm:text-2xl tracking-wider">
              SPEED
            </h3>
            <p className="text-gray-600 font-light leading-relaxed text-sm sm:text-base px-2 sm:px-0">
              Faster than your regret after sending that message.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 animate-slide-up delay-300 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black mx-auto flex items-center justify-center">
              <span className="font-bebas text-lg sm:text-xl">03</span>
            </div>
            <h3 className="font-bebas text-xl sm:text-2xl tracking-wider">
              SECURE
            </h3>
            <p className="text-gray-600 font-light leading-relaxed text-sm sm:text-base px-2 sm:px-0">
              More private than your thoughts. We promise.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-6 sm:space-y-8 px-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button className="group bg-black text-white px-8 sm:px-10 md:px-12 py-3 sm:py-4 font-bebas text-lg sm:text-xl tracking-wider hover:bg-gray-800 transition-colors duration-300 w-full sm:w-auto sm:min-w-[200px] max-w-xs sm:max-w-none">
              START CHATTING
              <div className="w-0 group-hover:w-full h-px bg-white transition-all duration-300 mx-auto mt-1"></div>
            </button>

            <button className="border-2 border-black text-black px-8 sm:px-10 md:px-12 py-3 sm:py-4 font-bebas text-lg sm:text-xl tracking-wider hover:bg-black hover:text-white transition-all duration-300 w-full sm:w-auto sm:min-w-[200px] max-w-xs sm:max-w-none">
              LEARN MORE
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
            NO FEELINGS WERE HARMED IN THE MAKING OF THIS APP
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
