import React from 'react';

// Lightweight Markdown renderer from the reference: headings, lists, fenced
// code, bold/italic and inline code. Deliberately not a full parser -- a
// rich-text editor is out of scope.

export function MarkdownPreview({ content }) {
  if (!content || !content.trim()) {
    return (
      <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 italic">
        No notes written yet. Switch to "Write" to jot down insights, code snippets, and explanations.
      </div>
    );
  }

  const lines = content.split('\n');
  const renderedElements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre
            key={`code-${idx}`}
            className="my-3 p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={idx} className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-gray-800">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={idx} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1.5">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={idx} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      renderedElements.push(
        <li key={idx} className="ml-5 list-disc text-sm text-gray-700 dark:text-gray-300 my-0.5 leading-relaxed">
          {renderInlineFormatting(line.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, '');
      renderedElements.push(
        <li key={idx} className="ml-5 list-decimal text-sm text-gray-700 dark:text-gray-300 my-0.5 leading-relaxed">
          {renderInlineFormatting(text)}
        </li>
      );
    } else if (line.trim() === '') {
      renderedElements.push(<div key={idx} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 my-1 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
}

function renderInlineFormatting(text) {
  // Bold **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(renderInlineCode(text.substring(lastIdx, match.index)));
    }
    parts.push(
      <strong key={`b-${match.index}`} className="font-semibold text-gray-900 dark:text-white">
        {match[1]}
      </strong>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(renderInlineCode(text.substring(lastIdx)));
  }

  return parts;
}

function renderInlineCode(text) {
  const codeRegex = /`([^`]+)`/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    parts.push(
      <code
        key={`c-${match.index}`}
        className="px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-300 border border-gray-200 dark:border-gray-700"
      >
        {match[1]}
      </code>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }
  return parts;
}
