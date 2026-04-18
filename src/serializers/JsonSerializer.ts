import { Block } from '../types'

export class JsonSerializer {
  static serialize(blocks: Block[]): string {
    return JSON.stringify(blocks, null, 2)
  }

  static deserialize(json: string): Block[] {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!Array.isArray(parsed)) throw new Error('Expected an array')
      return parsed as Block[]
    } catch (err) {
      throw new Error(`JsonSerializer.deserialize: invalid JSON — ${(err as Error).message}`)
    }
  }
}
