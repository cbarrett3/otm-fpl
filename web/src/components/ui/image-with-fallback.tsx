// Description: Client-side <img> with graceful fallback when the source 404s.
"use client"

import * as React from 'react'

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string
}

export function ImageWithFallback({ src, fallback = '/player-fallback.svg', alt, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(typeof src === 'string' ? src : undefined)

  React.useEffect(() => {
    setCurrentSrc(typeof src === 'string' ? src : undefined)
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={alt}
      src={currentSrc ?? fallback}
      onError={(e) => {
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback)
        }
        rest.onError?.(e)
      }}
    />
  )
}




