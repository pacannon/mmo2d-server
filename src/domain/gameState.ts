import * as World from './world';
import * as Player from './player';

export type GameState = {
  tick: number;
  world: World.World;
  deltas: GameStateDelta[];
}

export const GameState = (
  tick: number = 0,
  world: World.World = World.World (),
  deltas: GameStateDelta[] = []
): GameState => {
  return {
    tick,
    world,
    deltas,
  }
}

export type GameStateDelta = Player.PlayerDisplacement | UserCommand;
export type UserCommand = World.AddPlayer | World.FilterOutPlayerById | Player.PlayerControllerAction;

export const processUserCommand = (userCommand: UserCommand): UserCommand[] => {
  switch (userCommand.kind) {
    case 'world.addPlayer':
    case 'world.players.filterOut':
    case 'player.controllerAction':
      const retVal: UserCommand[] = [userCommand];
        return retVal;
    default:
      const _exhaustiveCheck: never = userCommand;
      return _exhaustiveCheck;
  }
};

export const processUserCommands = (userCommands: UserCommand[]): UserCommand[] => {
  const deltas = userCommands.map(processUserCommand).reduce((a, b) => [...a, ...b], []);
  
  return deltas;
};