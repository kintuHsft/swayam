"use client"

import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

import { createSystem, defaultConfig } from "@chakra-ui/react"

let theme = 'orange'

if (typeof window !== "undefined") {
  theme = window.localStorage.getItem('swayam_tenant_theme') ?? 'orange'
}

const tenantColorPalette = theme
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-ubuntu-mono)" },
        body: { value: "var(--font-ubuntu)" },
      },
    },
  },
  globalCss: {
    html: {
      colorPalette: tenantColorPalette,
    },
  },
})

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
