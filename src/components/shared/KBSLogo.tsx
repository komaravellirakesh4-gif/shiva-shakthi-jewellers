"use client"

import React from 'react'
import Image from 'next/image'

/**
 * Lord Shiva logo component for Shiva Shakthi Jewellers.
 * Uses the custom Shiva silhouette image from /shiva-logo.png
 */
export const ShivaLogo = ({ 
  size = 32, 
  className = '' 
}: { 
  size?: number; 
  className?: string 
}) => (
  <Image
    src="/shiva-logo.png"
    alt="Shiva Shakthi Jewellers"
    width={size}
    height={size}
    className={className}
    priority
  />
)

/**
 * ShivaTrishul — backward-compat alias for ShivaLogo.
 * Accepts SVG-like props but renders the image logo.
 */
export const ShivaTrishul = (props: React.SVGProps<SVGSVGElement> & { className?: string }) => {
  // Extract width from className like "w-7 h-7" -> 28px (7*4)
  const sizeMatch = props.className?.match(/w-(\d+)/)
  const tailwindSize = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 32
  return <ShivaLogo size={tailwindSize} className={props.className?.replace(/text-\w+/g, '') || ''} />
}

/**
 * KBS Logo text — legacy SVG text logo.
 */
export const KBSLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <text
      x="50%"
      y="58%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="64"
      fontWeight="900"
      fill="currentColor"
      style={{ fontFamily: 'var(--font-headline)', fontStyle: 'italic' }}
      className="animate-pulse"
    >
      KBS
    </text>
  </svg>
)
