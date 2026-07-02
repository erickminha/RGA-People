import React from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/**
 * Renderiza Markdown para HTML com classes Tailwind.
 * Usa a biblioteca `marked` (já incluída via markdown no package.json).
 */

export function Markdown({ content }: { content: string }) {
  // Configurar marked para gerar HTML com classes Tailwind
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const rawHtml = marked(content) as string;
  // Sanitiza o HTML antes de injetar no DOM para evitar XSS armazenado
  // (o conteúdo pode ter sido escrito por um admin de RH, mas ainda assim
  // é renderizado para todos os colaboradores da empresa).
  const html = DOMPurify.sanitize(rawHtml);

  return (
    <div
      className="prose prose-sm max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-ul:list-disc prose-ul:pl-5 prose-li:text-gray-700
        prose-ol:list-decimal prose-ol:pl-5
        prose-strong:font-semibold prose-strong:text-gray-900
        prose-em:italic prose-em:text-gray-700
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
        prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-gray-800
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-auto
        prose-hr:border-gray-300 prose-hr:my-6
        prose-table:border-collapse prose-table:w-full
        prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left
        prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
