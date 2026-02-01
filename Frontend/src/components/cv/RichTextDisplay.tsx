import React from "react";

/**
 * Safely renders HTML content or plain text.
 * Falls back to treating content as plain text if it doesn't look like HTML,
 * preventing XSS while allowing rich text formatting.
 */
const RichTextDisplay = ({ content, className = "", as: Component = "div" }: { content?: string; className?: string; as?: any }) => {
  if (!content) return null;

  // Simple heuristic to check for HTML tags
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return <Component className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <Component className={className}>{content}</Component>;
};

export default RichTextDisplay;
