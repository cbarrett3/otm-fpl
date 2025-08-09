// Description: Minimal button primitive with Tailwind styles.
"use client"

import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'link' | 'danger'
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', asChild = false, ...props },
  ref
) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 cursor-pointer active:scale-[0.98]'
  const variants = {
    primary: 'bg-black text-white hover:bg-black/85 active:bg-black/75 dark:bg-white dark:text-black dark:hover:bg-white/85 dark:active:bg-white/70 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15 border border-black/10 dark:border-white/15',
    link: 'underline underline-offset-2 hover:opacity-90 active:opacity-80 px-0 h-auto',
    danger: 'bg-red-600/10 text-red-500 border border-red-600/40 hover:bg-red-600/15 active:bg-red-600/20'
  }
  const classes = `${base} ${variants[variant]} ${className}`
  if (asChild) {
    const { children, ...rest } = props
    return (
      <span className={classes} {...(rest as Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>)}>
        {children}
      </span>
    )
  }
  return <button ref={ref} className={classes} {...props} />
})


