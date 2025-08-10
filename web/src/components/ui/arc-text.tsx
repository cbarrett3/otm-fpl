// Description: SVG arc text component for curved headings like "OVER THE MOON" above the logo.
"use client"

import * as React from 'react'

type ArcTextProps = {
  text: string
  radius?: number
  className?: string
}

export function ArcText({ text, radius = 80, className }: ArcTextProps): React.ReactElement {
  const id = React.useId()
  const fontSize = Math.max(10, radius * 0.24)
  const marginY = fontSize * 1.25
  const marginX = fontSize * 0.6
  const viewWidth = radius * 2 + marginX * 2
  const viewHeight = radius + marginY + 24

  return (
    <svg
      width={viewWidth}
      height={viewHeight}
      viewBox={`${-radius - marginX} ${-radius - marginY} ${viewWidth} ${viewHeight}`}
      className={className}
      aria-hidden
    >
      <defs>
        <path id={id} d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`} />
      </defs>
      <text
        fill="currentColor"
        fontSize={fontSize}
        fontWeight={700}
        letterSpacing="0.12em"
        textAnchor="middle"
      >
        <textPath xlinkHref={`#${id}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  )
}


