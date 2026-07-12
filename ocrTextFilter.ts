const THINK_OPEN = "<think>";
const THINK_CLOSE = "</think>";

const trailingTagPrefixLength = (text: string, tag: string): number => {
  const maxLength = Math.min(text.length, tag.length - 1);

  for (let length = maxLength; length > 0; length -= 1) {
    if (text.endsWith(tag.slice(0, length))) {
      return length;
    }
  }

  return 0;
};

/**
 * Removes model reasoning blocks from a cumulative streamed response.
 *
 * The input is the complete text received so far rather than a single chunk.
 * This makes split tags (for example `<thi` + `nk>`) deterministic and also
 * suppresses an unfinished reasoning block instead of briefly rendering it.
 */
export const removeThinkingBlocks = (text: string): string => {
  let output = "";
  let cursor = 0;
  let insideThinking = false;

  while (cursor < text.length) {
    if (!insideThinking && text.startsWith(THINK_OPEN, cursor)) {
      insideThinking = true;
      cursor += THINK_OPEN.length;
      continue;
    }

    if (insideThinking && text.startsWith(THINK_CLOSE, cursor)) {
      insideThinking = false;
      cursor += THINK_CLOSE.length;
      continue;
    }

    if (!insideThinking) {
      output += text[cursor];
    }
    cursor += 1;
  }

  // Do not flash a tag fragment while its remaining characters are still in
  // transit. On the next cumulative update it will either become a full tag or
  // ordinary output.
  const partialOpenLength = trailingTagPrefixLength(output, THINK_OPEN);
  if (partialOpenLength > 0) {
    return output.slice(0, -partialOpenLength);
  }

  return output;
};
