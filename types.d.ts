interface ICircleCollisionProps {
    x: number;
    y: number;
    radius: number;
}
interface IRectangleCollisionProps {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface IPowerUpEventProps extends Event{
    detail?:{
        power:{
            type?:string;
            number: number;
        }
    }
}