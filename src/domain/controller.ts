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

export type ControllerAction =
  | DropFocus
  | Jump
  | MoveForward
  | MoveBackward
  | StrafeLeft
  | StrafeRight
  | YawLeft
  | YawRight
  | SetRotation

interface Jump {
  kind: 'jump';
}

interface DropFocus {
  kind: 'dropFocus';
}

interface MoveForward {
  kind: 'moveForward';
  mapTo: boolean;
}
    
interface MoveBackward {
  kind: 'moveBackward';
  mapTo: boolean;
}

interface StrafeLeft {
  kind: 'strafeLeft';
  mapTo: boolean;
}

interface StrafeRight {
  kind: 'strafeRight';
  mapTo: boolean;
}

interface YawLeft {
  kind: 'yawLeft';
  mapTo: boolean;
}

interface YawRight {
  kind: 'yawRight';
  mapTo: boolean;
}

interface SetRotation {
  kind: 'setRotation';
  y: number;
}

export const reduce = (controller: Controller, action: ControllerAction): Controller => {
  controller = { ...controller };

  switch (action.kind) {
    case 'dropFocus':
        controller = { ... Controller () };
      break;
    case 'moveForward':
        controller.moveForward = action.mapTo;
      break;
    case 'moveBackward':
        controller.moveBackward = action.mapTo;
      break;
    case 'strafeLeft':
        controller.strafeLeft = action.mapTo;
      break;
    case 'strafeRight':
        controller.strafeRight = action.mapTo;
      break;
    case 'yawLeft':
        controller.yawLeft = action.mapTo;
      break;
    case 'yawRight':
        controller.yawRight = action.mapTo;
      break;
    case 'setRotation':
    case 'jump':
      break;
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }

  return controller;
}