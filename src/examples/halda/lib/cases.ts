import { cases } from '../data/cases'

export const filterCases = (sector: string, tech: string) =>
  cases.filter(item => (!sector || item.sector === sector) && (!tech || item.tech === tech))
