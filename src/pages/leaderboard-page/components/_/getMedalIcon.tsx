import RankOneIcon from './rank-one.svg?react'
import RankTwoIcon from './rank-two.svg?react'
import RankThreeIcon from './rank-three.svg?react'

export const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <RankOneIcon className="h-4 w-4" />
    case 2:
      return <RankTwoIcon className="h-4 w-4" />
    case 3:
      return <RankThreeIcon className="h-4 w-4" />
    default:
      return null
  }
}
