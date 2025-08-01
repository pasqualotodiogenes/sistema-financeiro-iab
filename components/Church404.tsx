"use client"

import React, { useState, useEffect } from 'react';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Church404Props {
  title?: string;
  subtitle?: string;
  message?: string;
  onRetry?: () => void;
}

const Church404 = ({
  title = "Ovelha Perdida",
  subtitle = '"O Senhor é o meu pastor; nada me faltará." - Salmos 23:1',
  message = "Mesmo quando perdemos o caminho, o amor de Deus nos guia para casa. Esta página pode estar perdida, mas você nunca está perdido aos olhos Dele.",
  onRetry
}: Church404Props) => {
  const [mouseGradientStyle, setMouseGradientStyle] = useState({
    left: '0px',
    top: '0px',
    opacity: 0,
  });
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);

  useEffect(() => {
    const animateWords = () => {
      const wordElements = document.querySelectorAll('.word-animate');
      wordElements.forEach((word, index) => {
        const delay = index * 200;
        setTimeout(() => {
          if (word) {
            (word as HTMLElement).style.animation = 'word-appear 0.8s ease-out forwards';
          }
        }, delay);
      });
    };
    const timeoutId = setTimeout(animateWords, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseGradientStyle({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        opacity: 1,
      });
    };
    const handleMouseLeave = () => {
      setMouseGradientStyle(prev => ({ ...prev, opacity: 0 }));
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const CrossIcon = () => (
    <svg 
      className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-[#f9d71c]/20 mx-auto mb-8" 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );

  const pageStyles = `
    #mouse-gradient-church {
      position: fixed;
      pointer-events: none;
      border-radius: 9999px;
      background-image: radial-gradient(circle, rgba(249, 215, 28, 0.05), rgba(74, 124, 89, 0.05), transparent 70%);
      transform: translate(-50%, -50%);
      will-change: left, top, opacity;
      transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
    }
    @keyframes word-appear { 
      0% { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(10px); } 
      50% { opacity: 0.8; transform: translateY(10px) scale(0.95); filter: blur(2px); } 
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } 
    }
    @keyframes float-gentle { 
      0%, 100% { transform: translateY(0) rotate(0deg); } 
      25% { transform: translateY(-10px) rotate(1deg); } 
      50% { transform: translateY(-5px) rotate(-1deg); } 
      75% { transform: translateY(-15px) rotate(0.5deg); } 
    }
    @keyframes pulse-glow { 
      0%, 100% { opacity: 0.1; transform: scale(1); } 
      50% { opacity: 0.3; transform: scale(1.1); } 
    }
    @keyframes cross-glow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(249, 215, 28, 0.3)); }
      50% { filter: drop-shadow(0 0 20px rgba(249, 215, 28, 0.6)); }
    }
    .word-animate { 
      display: inline-block; 
      opacity: 0; 
      margin: 0 0.1em; 
      transition: color 0.3s ease, transform 0.3s ease; 
    }
    .word-animate:hover { 
      color: #f9d71c; 
      transform: translateY(-2px); 
    }
    .floating-element { 
      position: absolute; 
      width: 3px; 
      height: 3px; 
      background: #f9d71c; 
      border-radius: 50%; 
      opacity: 0.3; 
      animation: float-gentle 6s ease-in-out infinite; 
    }
    .cross-icon {
      animation: cross-glow 3s ease-in-out infinite;
    }
    .ripple-effect { 
      position: fixed; 
      width: 4px; 
      height: 4px; 
      background: rgba(249, 215, 28, 0.6); 
      border-radius: 50%; 
      transform: translate(-50%, -50%); 
      pointer-events: none; 
      animation: pulse-glow 1s ease-out forwards; 
      z-index: 9999; 
    }
    .verse-decoration::before {
      content: '"';
      font-size: 2rem;
      color: #f9d71c;
      opacity: 0.5;
      position: absolute;
      left: -1rem;
      top: -0.5rem;
    }
    .verse-decoration::after {
      content: '"';
      font-size: 2rem;
      color: #f9d71c;
      opacity: 0.5;
      position: absolute;
      right: -1rem;
      bottom: -0.5rem;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#4a7c59] via-[#2d4a35] to-[#f9d71c]/20 text-[#fefdf8] overflow-hidden relative">
        {/* Background Pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="churchGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(249, 215, 28, 0.1)" strokeWidth="0.5"/>
              <circle cx="40" cy="40" r="1" fill="rgba(249, 215, 28, 0.1)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#churchGrid)" />
        </svg>
        {/* Floating Elements */}
        <div className="floating-element" style={{ top: '20%', left: '10%', animationDelay: '0s', background: '#f9d71c' }}></div>
        <div className="floating-element" style={{ top: '60%', left: '85%', animationDelay: '2s', background: '#f9d71c' }}></div>
        <div className="floating-element" style={{ top: '40%', left: '15%', animationDelay: '4s', background: '#f9d71c' }}></div>
        <div className="floating-element" style={{ top: '80%', left: '90%', animationDelay: '1s', background: '#f9d71c' }}></div>
        <div className="floating-element" style={{ top: '30%', left: '70%', animationDelay: '3s', background: '#f9d71c' }}></div>
        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 py-10 sm:px-8 md:px-16">
          {/* Cross Icon */}
          <div className="cross-icon mb-8">
            <CrossIcon />
          </div>
          {/* 404 Number */}
          <div className="text-center mb-8">
            <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-[#f9d71c]/30 leading-none">
              <span className="word-animate">4</span>
              <span className="word-animate">0</span>
              <span className="word-animate">4</span>
            </h1>
          </div>
          {/* Main Message */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-6">
              <span className="word-animate">{title}</span>
            </h2>
            <div className="relative inline-block mb-8">
              <p className="text-lg sm:text-xl md:text-2xl font-light text-[#f9d71c]/80 italic verse-decoration">
                <span className="word-animate">{subtitle}</span>
              </p>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-[#fefdf8]/80 leading-relaxed max-w-2xl mx-auto">
              {message.split(' ').map((word, index) => (
                <span key={index} className="word-animate" style={{ animationDelay: `${(index + 10) * 100}ms` }}>
                  {word}{' '}
                </span>
              ))}
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button 
              variant="default" 
              className="bg-[#4a7c59] hover:bg-[#3d6549] text-[#fefdf8] px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              onClick={onRetry}
            >
              <Home className="mr-2 h-5 w-5" />
              Voltar ao Início
            </Button>
            {onRetry && (
              <Button 
                variant="outline" 
                className="border-[#f9d71c] text-[#f9d71c] hover:bg-[#f9d71c] hover:text-[#4a7c59] px-8 py-3 rounded-lg transition-all duration-300"
                onClick={onRetry}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar
              </Button>
            )}
          </div>
          {/* Bottom Message */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-5 w-5 text-[#f9d71c] mr-2" />
              <span className="text-sm text-[#fefdf8]/70 uppercase tracking-wider">
                <span className="word-animate">O</span>
                <span className="word-animate">Amor</span>
                <span className="word-animate">de</span>
                <span className="word-animate">Deus</span>
                <span className="word-animate">Jamais</span>
                <span className="word-animate">Falha</span>
              </span>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-1 h-1 bg-[#f9d71c] rounded-full opacity-40"></div>
              <div className="w-1 h-1 bg-[#f9d71c] rounded-full opacity-60"></div>
              <div className="w-1 h-1 bg-[#f9d71c] rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
        {/* Mouse Gradient */}
        <div 
          id="mouse-gradient-church"
          className="w-80 h-80 blur-3xl"
          style={{
            left: mouseGradientStyle.left,
            top: mouseGradientStyle.top,
            opacity: mouseGradientStyle.opacity,
          }}
        ></div>
        {/* Click Ripples */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="ripple-effect"
            style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
          ></div>
        ))}
      </div>
    </>
  );
};

export default Church404; 