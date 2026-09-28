import confetti from 'canvas-confetti';

/**
 * Fires an explosive, multi-stage confetti and fireworks celebration
 * when a school partnership deal is confirmed and closed.
 */
export function triggerDealCelebration() {
  try {
    // 1. Initial Center Burst with vibrant brand & gold colors
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'],
      ticks: 240,
      gravity: 1.1,
      scalar: 1.25,
      shapes: ['square', 'circle']
    });

    // 2. Dual Side Cannon Blasts over 2.4 seconds
    const duration = 2400;
    const animationEnd = Date.now() + duration;
    const celebrationColors = ['#10b981', '#fbbf24', '#6366f1', '#34d399', '#f43f5e', '#a855f7'];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 25 * (timeLeft / duration);

      // Left Cannon
      confetti({
        particleCount,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: celebrationColors
      });

      // Right Cannon
      confetti({
        particleCount,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: celebrationColors
      });
    }, 250);
  } catch (err) {
    console.warn('Confetti trigger failed:', err);
  }
}
