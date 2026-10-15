import { ClubResponse } from '../presenters/club.presenter';
import { ClubSort } from '../dto/club.dto';
import { compareNames } from '../../common/formatters/text.formatter';

export function sortClubs(clubs: ClubResponse[], sort: ClubSort): ClubResponse[] {
  return [...clubs].sort((left, right) => {
    const netWorthDifference = left.net_worth - right.net_worth;
    if (sort === 'net_worth_asc' && netWorthDifference !== 0) return netWorthDifference;
    if (sort === 'net_worth_desc' && netWorthDifference !== 0) return -netWorthDifference;
    const nameDifference = compareNames(left.name, right.name);
    return nameDifference || left.id - right.id;
  });
}
