export function scrollIntoViewIfNeeded(el?: HTMLElement | null) {
  if (!el) return

  const parent = el.parentElement!

  if (el.offsetTop < parent.scrollTop) {
    parent.scrollTo({
      top: el.offsetTop - parent.offsetTop,
      behavior: 'smooth'
    })
  }

  const { top, bottom } = el.getBoundingClientRect()
  const { top: parentTop, bottom: parentBottom } = parent.getBoundingClientRect()
  if (top < parentTop) {
    parent.scrollTo({
      top: el.offsetTop - parent.offsetTop,
      behavior: 'smooth'
    })
  } else if (bottom > parentBottom) {
    parent.scrollTo({
      top: el.offsetTop - parent.offsetTop - parent.clientHeight + el.clientHeight,
      behavior: 'smooth'
    })
  }
}
