"use client";
import React, { useState, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ButtonProps } from "./button";

interface AnimatedButtonProps extends ButtonProps {
  animationType?: "glow" | "ripple" | "slide" | "bounce" | "magnetic" | "particle";
  glowColor?: string;
  children: React.ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(({ 
  animationType = "glow", 
  glowColor = "#60a5fa",
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props 
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (animationType === "ripple") {
      const rect = e.currentTarget.getBoundingClientRect();
      const newRipple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
    
    props.onClick?.(e);
  };

  const getButtonStyles = () => {
    switch (animationType) {
      case "glow":
        return {
          filter: isHovered ? `drop-shadow(0 0 20px ${glowColor})` : "none",
          transition: "filter 0.3s ease"
        };
      case "magnetic":
        return {
          transform: isHovered ? `translate(${(mousePosition.x - 50) * 0.1}px, ${(mousePosition.y - 25) * 0.1}px)` : "translate(0, 0)",
          transition: "transform 0.2s ease"
        };
      default:
        return {};
    }
  };

  const getAnimationProps = () => {
    switch (animationType) {
      case "bounce":
        return {
          whileHover: { scale: 1.05, y: -2 },
          whileTap: { scale: 0.95 },
          transition: { type: "spring" as const, stiffness: 400, damping: 17 }
        };
      case "slide":
        return {
          whileHover: { x: 4 },
          whileTap: { x: 0 },
          transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        };
      default:
        return {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2 }
        };
    }
  };

  return (
    <motion.div
      style={getButtonStyles()}
      {...getAnimationProps()}
      onMouseMove={handleMouseMove}
      className="relative inline-block"
    >
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          animationType === "glow" && "transition-all duration-300",
          animationType === "slide" && "group",
          className
        )}
        {...props}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background animations */}
        {animationType === "slide" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
        )}
        
        {animationType === "glow" && isHovered && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Ripple effect */}
        {animationType === "ripple" && ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/30"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ width: 0, height: 0, x: "-50%", y: "-50%" }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* Particle effect */}
        {animationType === "particle" && isHovered && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 10}%`,
                  top: "50%",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  y: [-20, -40, -60]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </div>
        )}

        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = "AnimatedButton";

// Preset button variants with proper forwardRef
export const GlowButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="glow" {...props} />
));

GlowButton.displayName = "GlowButton";

export const RippleButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="ripple" {...props} />
));

RippleButton.displayName = "RippleButton";

export const SlideButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="slide" {...props} />
));

SlideButton.displayName = "SlideButton";

export const BounceButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="bounce" {...props} />
));

BounceButton.displayName = "BounceButton";

export const MagneticButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="magnetic" {...props} />
));

MagneticButton.displayName = "MagneticButton";

export const ParticleButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, "animationType">>((props, ref) => (
  <AnimatedButton ref={ref} animationType="particle" {...props} />
));

ParticleButton.displayName = "ParticleButton";