import type { ForwardRefExoticComponent, ForwardRefRenderFunction, PropsWithoutRef, RefAttributes } from 'react'
import { forwardRef } from 'react'

type ForwardRefWithStatic = <S, T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
) => ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> & S

export const forwardRefWithStatic = forwardRef as ForwardRefWithStatic
