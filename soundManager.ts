const soundsArray: HTMLAudioElement[] = [
    new Audio("/assets/sound effects/bubble1.wav"), 
    new Audio("/assets/sound effects/bubble2.wav"), 
    new Audio("/assets/sound effects/bubble3.wav"),
    new Audio("/assets/sound effects/ball-on-platform1.wav"),
    new Audio("/assets/sound effects/ball-on-platform2.wav"),
]
export const soundsArrayLength = soundsArray.length

export function SoundEffect(sound: number) {
    const soundEffect = soundsArray[sound]
    soundEffect.play()
}