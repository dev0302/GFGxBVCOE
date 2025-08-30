import React, { useState, useEffect } from 'react';

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const target = new Date();
    target.setHours(24, 30, 0, 0); // 11:58 PM
    
    // If it's already past 11:58 PM, set target to next day
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
    
    const difference = target - now;
    
    if (difference > 0) {
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      };
    }
    
    return { hours: '00', minutes: '00', seconds: '00' };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate progress percentage for the circular progress bar
  const totalMinutesInDay = 24 * 60;
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const progress = (currentMinutes / totalMinutesInDay) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] flex items-center justify-center p-4">
      <div className="timer-card bg-[rgba(255,255,255,0.07)] backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-2xl border border-[rgba(255,255,255,0.1)] max-w-md w-full">
        <h1 className="text-2xl md:text-3xl font-semibold text-center text-white mb-2">
          Countdown begins
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Results are soon
        </p>
        
        {/* Circular progress bar */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (progress * 283) / 100}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </div>
            <div className="text-sm text-gray-300 mt-2">Hours : Minutes : Seconds</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <div className="text-2xl font-bold text-white">{timeLeft.hours}</div>
            <div className="text-sm text-gray-300">Hours</div>
          </div>
          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <div className="text-2xl font-bold text-white">{timeLeft.minutes}</div>
            <div className="text-sm text-gray-300">Minutes</div>
          </div>
          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <div className="text-2xl font-bold text-white">{timeLeft.seconds}</div>
            <div className="text-sm text-gray-300">Seconds</div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <i className="far fa-clock mr-2"></i>
          Current time: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Timer;