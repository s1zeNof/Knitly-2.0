import { DecoratorNode } from 'lexical';
import React from 'react';
import LottieRenderer from '../../LottieRenderer';

function CustomEmojiComponent({ src, alt, isAnimated }) {
  if (isAnimated) {
    return <LottieRenderer url={src} className="custom-emoji-in-editor" />;
  }
  return <img src={src} alt={alt} className="custom-emoji-in-editor" />;
}

export class CustomEmojiNode extends DecoratorNode {
  __src;
  __alt;
  __isAnimated;

  static getType() {
    return 'custom-emoji';
  }

  static clone(node) {
    return new CustomEmojiNode(node.__src, node.__alt, node.__isAnimated, node.__key);
  }

  // <<< ПОЧАТОК ВИПРАВЛЕННЯ >>>
  static importJSON(serializedNode) {
    const { src, alt, isAnimated } = serializedNode;
    return $createCustomEmojiNode(src, alt, isAnimated);
  }

  exportJSON() {
    return {
      src: this.__src,
      alt: this.__alt,
      isAnimated: this.__isAnimated,
      type: 'custom-emoji',
      version: 1,
    };
  }

  isInline() {
    return true;
  }
  // <<< КІНЕЦЬ ВИПРАВЛЕННЯ >>>

  constructor(src, alt, isAnimated, key) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__isAnimated = isAnimated;
  }

  createDOM(config) {
    const span = document.createElement('span');
    span.className = 'custom-emoji-wrapper';
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <CustomEmojiComponent
        src={this.__src}
        alt={this.__alt}
        isAnimated={this.__isAnimated}
      />
    );
  }
}

export function $createCustomEmojiNode(src, alt, isAnimated) {
  return new CustomEmojiNode(src, alt, isAnimated);
}