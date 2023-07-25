// const soundsArray: HTMLAudioElement[] = [
//     new Audio("/assets/sound effects/bubble1.wav"),
//     new Audio("/assets/sound effects/bubble2.wav"),
//     new Audio("/assets/sound effects/bubble3.wav"),
//     new Audio("/assets/sound effects/ball-on-platform1.wav"),
//     new Audio("/assets/sound effects/ball-on-platform2.wav"),
//     new Audio("/assets/sound effects/explosion1.wav"),
//     new Audio("/assets/sound effects/explosion2.wav"),
//     new Audio("/assets/sound effects/explosion3.wav"),
// ]

const soundsArray: string[] = [
    "/assets/sound effects/bubble1.wav",
    "/assets/sound effects/bubble2.wav",
    "/assets/sound effects/bubble3.wav",
    "/assets/sound effects/ball-on-platform1.wav",
    "/assets/sound effects/ball-on-platform2.wav",
    "/assets/sound effects/explosion1.wav",
    "/assets/sound effects/explosion2.wav",
    "/assets/sound effects/explosion3.wav",
]
export const soundsArrayLength = soundsArray.length

export function SoundEffect(sound: number) {
    // const soundEffect = soundsArray[sound]
    // @ts-ignore
    const soundEffect = new Howl({ src: [soundsArray[sound]] });
    // soundEffect.play()
    soundEffect.play()
}