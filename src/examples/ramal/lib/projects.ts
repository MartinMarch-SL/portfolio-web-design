import { projects } from '../data/projects'

export function filterProjects(sector = '', discipline = '') {
  return projects.filter(project =>
    (!sector || project.sector === sector) &&
    (!discipline || Object.hasOwn(project.scope, discipline)),
  )
}
