import { useEffect, useState } from 'react'
import { definePlugin } from '@power-playground/core'

export default definePlugin({
  editor: {
    uses: [
      () => {
        const hash = location.hash.slice(1)
        const [code, setCode] = useState(hash
          ? decodeURIComponent(atob(hash))
          : 'console.log("Hello world!")')
        useEffect(() => {
          function hashchange() {
            const hash = location.hash.slice(1)
            setCode(hash
              ? decodeURIComponent(atob(hash))
              : '')
          }
          addEventListener('hashchange', hashchange)
          return () => removeEventListener('hashchange', hashchange)
        }, [])
        return {
          code, setCode
        }
      }
    ]
  }
})
