export function playSound(file: string) {
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = 0.5; // Optional: Adjust volume
    audio.play();
  }
  