import type { JSX } from "react";
import React from "react";

/**
 * Render a tip tap JSON node and all its children
 * @param {TipTapNode} node JSON node to render
 * @param {NodeHandlers} handlers a handler for each node type
 * @returns tree of components as react elements
 */
export function TipTapRender(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: TipTapNode<any>;
  handlers: NodeHandlers;
}): JSX.Element | null {
  const { node, handlers: mapping } = props;

  if (!node.type) return null;
  // recursively render child content
  const children: JSX.Element[] = [];
  node.content?.forEach((child, ix) => {
    children.push(
      <TipTapRender
        node={child}
        handlers={mapping}
        key={`${child.type}-${ix}`}
      />,
    );
  });
  // return empty if we are missing a handler for this type
  if (!(node.type in props.handlers)) {
    console.warn(`missing type`, node);
    return null;
  }
  // render the handler for this type
  const Handler = mapping[node.type];
  if (!Handler) return null;
  return <Handler node={node}>{children}</Handler>;
}

type Attrs = Readonly<Record<string, unknown>>;

export interface TipTapNode<T> {
  type?: string;
  attrs?: T & Attrs;
  marks?: Attrs[];
  content?: TipTapNode<T & Attrs>[];
  readonly [attr: string]: unknown;
}

export interface NodeProps<T> {
  children?: React.ReactNode;
  node: TipTapNode<T>;
}

export type NodeHandler<T = unknown> = (props: NodeProps<T>) => JSX.Element;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeHandlers = Readonly<Record<string, NodeHandler<any>>>;
