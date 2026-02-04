Here is a comparison of the SSE stream parsing logic in the two files, highlighting the inconsistencies.

### `src/app/page.tsx` (Home Page)

```javascript
const chunk = decoder.decode(value, { stream: true });
const lines = chunk.split('\n').filter(line => line.trim());

for (const line of lines) {
  try {
    const data = JSON.parse(line);
    if (data.type === 'complete' && data.result) {
      finalResult = data.result;
    }
  } catch {
    // Skip malformed JSON chunks
  }
}
```

*   **Handling `data:` prefix**: This implementation does **not** check for or handle the standard SSE `data: ` prefix. It incorrectly assumes that every non-empty line is a complete and valid JSON object.
*   **Chunk Splitting**: It splits the decoded chunk by newline characters (`\n`) and then filters out any empty or whitespace-only lines.
*   **JSON Parsing**: It wraps the `JSON.parse(line)` call in a `try...catch` block. This makes it robust against malformed JSON, as it will simply skip any line that fails to parse without crashing.

### `src/app/documents/[id]/page.tsx` (Document Detail Page)

```javascript
const chunk = decoder.decode(value);
const lines = chunk.split('\n');

for (const line of lines) {
  if (line.startsWith('data: ')) {
    const update = JSON.parse(line.slice(6));

    // ... logic to handle different update types ...
  }
}
```

*   **Handling `data:` prefix**: This implementation **correctly** handles the SSE protocol by checking if each line `startsWith('data: ')` and then slicing off the prefix (`line.slice(6)`) before parsing the JSON payload.
*   **Chunk Splitting**: It splits the chunk by newline characters but does not explicitly filter out empty lines. The `if` condition serves a similar purpose.
*   **JSON Parsing**: It does **not** use a `try...catch` block. If the content after `data: ` is not valid JSON, the `JSON.parse` call will throw an unhandled exception and break the entire streaming loop.

### Summary of Inconsistencies

1.  **SSE Protocol Adherence**: The logic in `[id]/page.tsx` correctly follows the SSE protocol by looking for the `data: ` prefix. The logic in `page.tsx` ignores the protocol, which will cause parsing to fail if the stream is formatted correctly.
2.  **Error Handling**: The `page.tsx` component has robust error handling for JSON parsing using `try...catch`, while the `[id]/page.tsx` component lacks it, making it brittle and prone to crashing on malformed data.
3.  **Chunk Processing**: The two files use slightly different methods for handling empty lines after splitting the stream chunk (`.filter()` vs. relying on the `if` condition).
