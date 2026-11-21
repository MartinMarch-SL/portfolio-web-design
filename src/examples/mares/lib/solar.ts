const radians = Math.PI / 180
const day = 86_400_000
const latitude = 39.57 * radians
const longitude = 2.65
const madridOffset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Madrid', timeZoneName: 'shortOffset' })

export interface SolarPosition { azimuth: number; altitude: number }

/** Date and decimal hour are Palma wall time. Azimuth is clockwise from north. */
export function palmaSun(date: string, hour: number): SolarPosition {
  const calendar = Date.parse(date + 'T00:00:00Z')
  const year = new Date(calendar).getUTCFullYear()
  const yearStart = Date.UTC(year, 0, 1)
  const yearLength = (Date.UTC(year + 1, 0, 1) - yearStart) / day
  const standardInstant = calendar + (hour - 1) * 3_600_000
  const zone = madridOffset.formatToParts(standardInstant).find(part => part.type === 'timeZoneName')!.value
  const offset = Number(zone.replace('GMT', ''))

  // NOAA fractional-year approximation for declination and equation of time.
  const phase = 2 * Math.PI / yearLength * ((calendar - yearStart) / day + (hour - 12) / 24)
  const { sin, cos } = Math
  const equation = 229.18 * (.000075 + .001868 * cos(phase) - .032077 * sin(phase) - .014615 * cos(2 * phase) - .040849 * sin(2 * phase))
  const declination = .006918 - .399912 * cos(phase) + .070257 * sin(phase) - .006758 * cos(2 * phase) + .000907 * sin(2 * phase) - .002697 * cos(3 * phase) + .00148 * sin(3 * phase)
  const angle = (hour * 15 + equation / 4 + longitude - offset * 15 - 180) * radians
  const altitude = Math.asin(sin(latitude) * sin(declination) + cos(latitude) * cos(declination) * cos(angle)) / radians
  const azimuth = (Math.atan2(sin(angle), cos(angle) * sin(latitude) - Math.tan(declination) * cos(latitude)) / radians + 180) % 360
  return { azimuth, altitude }
}

export function roomIsLit(sun: SolarPosition, orientation: number): boolean {
  const difference = Math.abs(sun.azimuth - orientation) % 360
  return sun.altitude > 0 && Math.min(difference, 360 - difference) < 70
}
