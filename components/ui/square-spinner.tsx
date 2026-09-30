import type { SVGProps } from 'react'

interface SquareSpinnerProps extends Omit<SVGProps<SVGSVGElement>, 'role'> {
  label?: string
}

export function SquareSpinner({ className = '', label, ...props }: SquareSpinnerProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 32 32"
      fill="none"
      className={`block shrink-0 ${className}`}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x="1" y="1" width="30" height="30" rx="2" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <g className="animate-spin" style={{ transformOrigin: '16px 16px', transformBox: 'view-box' }} fill="currentColor">
        <rect x="14" y="5" width="4" height="9" rx="1" />
        <rect x="18" y="14" width="9" height="4" rx="1" opacity="0.75" />
        <rect x="14" y="18" width="4" height="9" rx="1" opacity="0.5" />
        <rect x="5" y="14" width="9" height="4" rx="1" opacity="0.25" />
      </g>
    </svg>
  )
}
