import type { PlayerState } from '../engine'

/** A board showing every terrain read at once, for the dev gallery. */
export function boardOfDemo(): PlayerState {
  return {
    board: {
      '0,0': ['green'],
      '0,1': ['brown', 'green'],
      '0,2': ['brown', 'brown', 'green'],
      '1,0': ['gray'],
      '1,1': ['gray', 'gray'],
      '2,0': ['gray', 'gray', 'gray'],
      '2,1': ['gray', 'red'],
      '2,2': ['red', 'red'],
      '3,0': ['yellow'],
      '3,1': ['yellow'],
      '2,3': ['blue'],
      '1,3': ['blue'],
      '0,4': ['blue'],
      '4,0': ['brown'],
      '4,1': ['red'],
    },
    cubes: { '0,2': 'red-squirrel', '2,0': 'golden-eagle' },
    inProgress: [{ cardId: 'kingfisher', cubesPlaced: 1 }],
    completed: ['golden-eagle'],
  }
}
