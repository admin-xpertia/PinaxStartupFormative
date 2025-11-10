"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface TechnicalTermProps {
  term: string
  definition: string
  example?: string
  className?: string
}

export function TechnicalTerm({
  term,
  definition,
  example,
  className,
}: TechnicalTermProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "underline decoration-cyan-500 decoration-2 underline-offset-2",
              "cursor-help hover:decoration-cyan-600 transition-colors",
              "font-medium",
              className
            )}
          >
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm p-4"
          sideOffset={5}
        >
          <div className="space-y-2">
            <p className="font-semibold text-sm">{term}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {definition}
            </p>
            {example && (
              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Ejemplo:
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {example}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Hook helper to detect technical terms in text and wrap them
 */
export function parseTechnicalTerms(
  text: string,
  terms: Record<string, { definition: string; example?: string }>
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let remainingText = text
  let key = 0

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = Object.keys(terms).sort((a, b) => b.length - a.length)

  while (remainingText.length > 0) {
    let matched = false

    for (const term of sortedTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i')
      const match = remainingText.match(regex)

      if (match && match.index !== undefined) {
        // Add text before match
        if (match.index > 0) {
          nodes.push(
            <span key={`text-${key++}`}>
              {remainingText.substring(0, match.index)}
            </span>
          )
        }

        // Add technical term
        nodes.push(
          <TechnicalTerm
            key={`term-${key++}`}
            term={match[0]}
            definition={terms[term].definition}
            example={terms[term].example}
          />
        )

        // Update remaining text
        remainingText = remainingText.substring(match.index + match[0].length)
        matched = true
        break
      }
    }

    // If no match found, add remaining text
    if (!matched) {
      nodes.push(<span key={`text-${key++}`}>{remainingText}</span>)
      break
    }
  }

  return nodes
}
