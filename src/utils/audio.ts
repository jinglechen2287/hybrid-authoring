/**
 * Audio utility for playing sound effects
 */

let confirmAudio: HTMLAudioElement | null = null;

/**
 * Plays the confirm sound effect.
 * Lazily initializes the audio element on first use.
 * Handles errors gracefully to avoid breaking the UI.
 */
export function playConfirmSound(): void {
  try {
    if (!confirmAudio) {
      confirmAudio = new Audio("/confirm.wav");
    }
    confirmAudio.currentTime = 0;
    void confirmAudio.play();
  } catch {
    console.error("Failed to play confirm audio");
  }
}
