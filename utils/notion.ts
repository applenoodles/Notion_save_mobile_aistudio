/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const createParagraphBlocks = (text: string) => text ? text.match(/.{1,2000}/g)?.map(chunk => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] } })) ?? [] : [];
