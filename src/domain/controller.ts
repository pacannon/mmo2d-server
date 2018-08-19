export type Controller = {
  moveForward: boolean;
  moveBackward: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  yawLeft: boolean;
  yawRight: boolean;
}

export const Controller = () => {
  return {
    moveForward: false,
    moveBackward: false,
    strafeLeft: false,
    strafeRight: false,
    yawLeft: false,
    yawRight: false,
  };
}