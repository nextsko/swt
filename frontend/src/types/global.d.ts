declare global {
  interface Window {
    runtime: {
      Events: {
        On: (event: string, callback: (data: any) => void) => void
      }
      Window: {
        Hide: () => Promise<void>
      }
    }
  }
}

export {}
