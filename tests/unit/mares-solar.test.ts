import { describe, expect, it } from 'vitest'
import { palmaSun, roomIsLit } from '../../src/examples/mares/lib/solar'

describe('Palma solar position', () => {
  it('runs east to south to west in summer local time', () => {
    const morning = palmaSun('2026-06-21', 8)
    const noon = palmaSun('2026-06-21', 13.85)
    const evening = palmaSun('2026-06-21', 20)

    expect(morning.azimuth).toBeGreaterThan(55)
    expect(morning.azimuth).toBeLessThan(100)
    expect(noon.azimuth).toBeCloseTo(180, -1)
    expect(noon.altitude).toBeGreaterThan(70)
    expect(evening.azimuth).toBeGreaterThan(260)
    expect(evening.azimuth).toBeLessThan(310)
    expect(roomIsLit(morning, 90)).toBe(true)
    expect(roomIsLit(evening, 270)).toBe(true)
  })

  it('places winter solar noon around 13:00 CET', () => {
    const noon = palmaSun('2026-12-21', 13)
    expect(noon.azimuth).toBeCloseTo(180, -1)
    expect(noon.altitude).toBeGreaterThan(24)
    expect(noon.altitude).toBeLessThan(29)
  })

  it('wraps bearings at north, excludes the 70-degree boundary and rejects night', () => {
    const night = palmaSun('2026-06-21', 2)
    expect(night.altitude).toBeLessThan(0)
    expect(roomIsLit(night, night.azimuth)).toBe(false)
    expect(roomIsLit({ azimuth: 350, altitude: 10 }, 10)).toBe(true)
    expect(roomIsLit({ azimuth: 350, altitude: 10 }, 60)).toBe(false)
    expect(roomIsLit({ azimuth: 350, altitude: 0 }, 350)).toBe(false)
  })
})
