export interface AspectRatioOptions {
  /** Width / height ratio. Default `1` (square). E.g. `16/9` for video. */
  ratio?: number
}

export interface AspectRatioProps {
  style: {
    aspectRatio: string
    width: string
  }
}

export interface AspectRatio {
  ratio: number
  getRootProps: () => AspectRatioProps
}

/**
 * Constrains a child to a specific width/height ratio via the modern
 * `aspect-ratio` CSS property. Stateless. Use when the child is an image,
 * iframe, video, or canvas whose intrinsic size differs from the desired
 * layout slot.
 */
export function createAspectRatio(options: AspectRatioOptions = {}): AspectRatio {
  const ratio = options.ratio ?? 1
  return {
    ratio,
    getRootProps: () => ({
      style: { aspectRatio: String(ratio), width: "100%" },
    }),
  }
}
