import type { JSONContent } from "novel";
import React from "react";

import { cn } from "@acme/ui";

import type { NodeHandler, NodeHandlers } from "./react-renderer";
import { TipTapRender } from "./react-renderer";
import {
  editorBlockquoteTw,
  editorBulletListTw,
  editorLinkTw,
  editorListItemTw,
  editorOrderedListTw,
  proseTw,
} from "./styles";

export const DocRender: NodeHandler = (props) => {
  return <>{props.children}</>;
};

export const TextRender: NodeHandler = (props) => {
  if (!props.node.text) {
    console.log("missing text", props);
    return <></>;
  }

  const payload = props.node.text as string;

  // define variable for react style
  const style: React.CSSProperties = {};
  const twClasses: string[] = [];

  let link: Readonly<Record<string, unknown>> | undefined;

  // dynamically process text marks
  props.node.marks?.forEach((mark) => {
    switch (mark.type) {
      case "bold":
        style.fontWeight = "bold";
        break;
      case "italic":
        style.fontStyle = "italic";
        break;
      case "underline":
        style.textDecorationLine = "underline";
        break;
      case "highlight": {
        const markAttrs = mark.attrs as { color?: string };
        if (markAttrs.color) style.backgroundColor = markAttrs.color;
        break;
      }
      case "textStyle": {
        const markAttrs = mark.attrs as { color?: string };
        if (markAttrs.color) {
          style.color = markAttrs.color;
        }
        break;
      }
      case "strike":
        style.textDecorationLine = "line-through";
        break;

      case "link":
        link = mark;
        break;
      default:
        console.log("unhandled mark", mark);
    }
  });

  if (link) {
    const castLink = link as {
      attrs: { href: string; rel: string; target: string };
    };
    const href = castLink.attrs.href;
    const rel = castLink.attrs.rel;
    const target = castLink.attrs.target;

    return (
      <a
        style={style}
        className={editorLinkTw}
        target={target}
        rel={rel}
        href={href}
      >
        {payload}
      </a>
    );
  }
  return (
    <span className={twClasses.join(" ")} style={style}>
      {payload}
    </span>
  );
};
export const HeadingRender: NodeHandler<{ level: number }> = (props) => {
  const level = props.node.attrs?.level;

  if (level === 1) return <h2>{props.children}</h2>;
  if (level === 2) return <h2>{props.children}</h2>;
  if (level === 3) return <h3>{props.children}</h3>;
  if (level === 4) return <h4>{props.children}</h4>;

  return <h5>{props.children}</h5>;
};

export const ParagraphRender: NodeHandler = (props) => {
  return <p>{props.children}</p>;
};

export const OrderedListRender: NodeHandler = (props) => {
  return <ol className={editorOrderedListTw}>{props.children}</ol>;
};

export const BulletListRender: NodeHandler = (props) => {
  return <ul className={editorBulletListTw}>{props.children}</ul>;
};

export const ListItem: NodeHandler = (props) => {
  return <li className={editorListItemTw}>{props.children}</li>;
};

export const BlockquoteRender: NodeHandler = (props) => {
  return (
    <blockquote className={editorBlockquoteTw}>{props.children}</blockquote>
  );
};

interface RendererProps {
  content: JSONContent;
}

const handlers: NodeHandlers = {
  doc: DocRender,
  text: TextRender,
  paragraph: ParagraphRender,
  heading: HeadingRender,
  orderedList: OrderedListRender,
  listItem: ListItem,
  bulletList: BulletListRender,
  blockquote: BlockquoteRender,
};

export const Renderer = ({ content }: RendererProps) => {
  return (
    <div className={cn(proseTw)}>
      <TipTapRender handlers={handlers} node={content} />
    </div>
  );
};
