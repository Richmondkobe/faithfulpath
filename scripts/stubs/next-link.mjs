// next/link, for a script that renders a component outside Next's bundler.
//
// The real module resolves to a namespace object under plain node, and React
// refuses it as an element type. A link is an anchor with an href as far as any
// assertion here is concerned. Plain createElement rather than JSX, so this
// file needs no compilation and the resolve hook can point straight at it.

import { createElement } from "react";

export default function Link({ href, children, ...rest }) {
  return createElement("a", { href, ...rest }, children);
}
