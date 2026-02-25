import { Plugin, MarkdownRenderer, MarkdownRenderChild, MarkdownPostProcessorContext, TFile } from 'obsidian';

interface MermaidBlock {
	startLine: number;
	endLine: number;
	content: string;
}

function parseMermaidBlocks(text: string): MermaidBlock[] {
	const lines = text.split('\n');
	const blocks: MermaidBlock[] = [];
	let inside = false;
	let start = -1;
	let content: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		if (!inside && trimmed === ':::mermaid') {
			inside = true;
			start = i;
			content = [];
		} else if (inside && trimmed === ':::') {
			blocks.push({ startLine: start, endLine: i, content: content.join('\n') });
			inside = false;
		} else if (inside) {
			content.push(lines[i]);
		}
	}
	return blocks;
}

function hasClosingDirective(el: Element): boolean {
	const paragraphs = el.querySelectorAll('p');
	for (const p of Array.from(paragraphs)) {
		const t = (p.textContent || '').trim();
		if (t === ':::' || t.endsWith(':::')) return true;
	}
	const text = (el.textContent || '').trim();
	return text === ':::' || text.endsWith(':::');
}

export default class TiptapMermaidPlugin extends Plugin {
	private _debounce = new WeakMap<Element, number>();

	async onload(): Promise<void> {
		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const sizer = el.closest('.markdown-preview-sizer');
			if (!sizer) return;

			const prev = this._debounce.get(sizer);
			if (prev) window.clearTimeout(prev);

			this._debounce.set(
				sizer,
				window.setTimeout(() => {
					this._debounce.delete(sizer);
					this.processContainer(sizer as HTMLElement, ctx.sourcePath);
				}, 300),
			);
		});
	}

	private async processContainer(container: HTMLElement, sourcePath: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(sourcePath);
		if (!file || !(file instanceof TFile)) return;

		let raw: string;
		try {
			raw = await this.app.vault.cachedRead(file);
		} catch {
			return;
		}

		const blocks = parseMermaidBlocks(raw);
		if (!blocks.length) return;

		const allParagraphs = container.querySelectorAll('p');
		const startElements: HTMLParagraphElement[] = [];
		for (const p of Array.from(allParagraphs)) {
			if (p.closest('[data-tiptap-mermaid]')) continue;
			const text = (p.textContent || '').trim();
			if (text === ':::mermaid' || text.startsWith(':::mermaid\n') || text.startsWith(':::mermaid ')) {
				startElements.push(p);
			}
		}

		if (!startElements.length) return;

		const processedCount = container.querySelectorAll('.tiptap-mermaid-container').length;

		for (let i = 0; i < startElements.length; i++) {
			const blockIdx = processedCount + i;
			if (blockIdx >= blocks.length) break;
			await this.renderBlock(startElements[i], blocks[blockIdx].content, sourcePath);
		}
	}

	private async renderBlock(startEl: HTMLElement, mermaidCode: string, sourcePath: string): Promise<void> {
		this.hideUntilClose(startEl);

		const wrapper = document.createElement('div');
		wrapper.className = 'tiptap-mermaid-container';
		wrapper.dataset.tiptapMermaid = 'rendered';
		startEl.replaceWith(wrapper);

		const fenced = '```mermaid\n' + mermaidCode + '\n```';
		try {
			const child = new MarkdownRenderChild(wrapper);
			await MarkdownRenderer.render(this.app, fenced, wrapper, sourcePath, child);
		} catch (err) {
			wrapper.innerHTML =
				'<pre class="tiptap-mermaid-error">Mermaid render error: ' +
				(err instanceof Error ? err.message : String(err)) + '</pre>';
		}
	}

	private hideUntilClose(startEl: HTMLElement): void {
		let sibling = startEl.nextElementSibling;
		while (sibling) {
			const isClose = hasClosingDirective(sibling);
			(sibling as HTMLElement).style.display = 'none';
			(sibling as HTMLElement).dataset.tiptapMermaid = 'hidden';
			if (isClose) return;
			sibling = sibling.nextElementSibling;
		}

		const section = startEl.parentElement;
		if (!section) return;

		let nextSection = section.nextElementSibling;
		while (nextSection) {
			if (nextSection.classList?.contains('markdown-preview-pusher')) {
				nextSection = nextSection.nextElementSibling;
				continue;
			}
			const isClose = hasClosingDirective(nextSection);
			(nextSection as HTMLElement).style.display = 'none';
			(nextSection as HTMLElement).dataset.tiptapMermaid = 'hidden';
			if (isClose) return;
			nextSection = nextSection.nextElementSibling;
		}
	}

	onunload(): void {
		document.querySelectorAll('[data-tiptap-mermaid]').forEach((el) => {
			el.removeAttribute('data-tiptap-mermaid');
			if (el instanceof HTMLElement) el.style.display = '';
			el.classList.remove('tiptap-mermaid-hidden', 'tiptap-mermaid-container');
		});
	}
}
