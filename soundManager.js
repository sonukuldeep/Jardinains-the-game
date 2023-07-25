const soundsArray = [
    "/assets/sound effects/bubble1.wav",
    "/assets/sound effects/bubble2.wav",
    "/assets/sound effects/bubble3.wav",
    "/assets/sound effects/ball-on-platform1.wav",
    "/assets/sound effects/ball-on-platform2.wav",
    "/assets/sound effects/explosion1.wav",
    "/assets/sound effects/explosion2.wav",
    "/assets/sound effects/explosion3.wav",
];
export const soundsArrayLength = soundsArray.length;
export function SoundEffect(sound) {
    const soundEffect = new Howl({ src: [soundsArray[sound]] });
    soundEffect.play();
}
