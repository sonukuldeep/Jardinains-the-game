interface ICircleCollisionProps {
    x: number;
    y: number;
    radius: number;
    id: string;
}
interface IRectangleCollisionProps {
    x: number;
    y: number;
    width: number;
    height: number;
    id: string;
}
interface IPowerUpEventProps extends Event {
    detail?: {
        power: {
            type?: string;
            number: number;
        }
    }
}