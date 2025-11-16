// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import { TextDecoder } from 'node:util';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "githubreadmeviewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const helloWorldDisposable = vscode.commands.registerCommand('githubreadmeviewer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from githubreadmeviewer!');
	});

	const readmePreviewDisposable = vscode.commands.registerCommand('githubreadmeviewer.previewReadme', async (resource?: vscode.Uri) => {
		const targetUri = resource ?? vscode.window.activeTextEditor?.document.uri;

		if (!targetUri) {
			vscode.window.showWarningMessage('Select a README file to preview.');
			return;
		}

		try {
			const fileName = path.basename(targetUri.fsPath);
			const fileContents = await vscode.workspace.fs.readFile(targetUri);
			const markdownText = new TextDecoder('utf-8').decode(fileContents);
			const renderedMarkdown = markdownRenderer.render(markdownText);
			const processedMarkdown = processGitHubAlerts(renderedMarkdown);

			const panel = vscode.window.createWebviewPanel(
				'githubreadmeviewerPreview',
				`Preview README — ${fileName}`,
				vscode.ViewColumn.Beside,
				{
					enableScripts: false,
					retainContextWhenHidden: true
				}
			);

			panel.webview.html = getWebviewHtml(processedMarkdown);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Unable to preview README: ${message}`);
		}
	});

	context.subscriptions.push(helloWorldDisposable, readmePreviewDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

const markdownRenderer = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true
}).use(taskLists);

function processGitHubAlerts(html: string): string {
	// Skip if already processed (contains markdown-alert class)
	if (html.includes('markdown-alert')) {
		return html;
	}
	
	// Match blockquotes that start with [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], or [!CAUTION]
	// This pattern matches the entire blockquote and extracts the alert type and content
	const alertPattern = /<blockquote>([\s\S]*?)<\/blockquote>/g;
	
	return html.replace(alertPattern, (match, blockquoteContent) => {
		// Skip if already processed
		if (match.includes('markdown-alert')) {
			return match;
		}
		
		// Pattern 1: Alert type in its own paragraph: <p>[!WARNING]</p>
		let alertMatch = blockquoteContent.match(/<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*<\/p>/);
		let contentHtml = '';
		
		if (alertMatch) {
			// Extract content paragraphs (everything after the alert type paragraph)
			const contentStart = alertMatch.index! + alertMatch[0].length;
			contentHtml = blockquoteContent.substring(contentStart).trim();
		} else {
			// Pattern 2: Alert type followed by newline and content: <p>[!WARNING]\nContent...</p>
			// This handles the case where [!WARNING] is on its own line followed by content
			alertMatch = blockquoteContent.match(/<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*[\n\r]+(.+?)<\/p>/s);
			if (alertMatch) {
				// Extract content from the same paragraph (after the alert type and newline)
				contentHtml = `<p>${alertMatch[2]}</p>`;
			} else {
				// Pattern 3: Alert type followed by <br> and content: <p>[!WARNING]<br>Content...</p>
				alertMatch = blockquoteContent.match(/<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*<br\s*\/?>\s*(.+?)<\/p>/s);
				if (alertMatch) {
					contentHtml = `<p>${alertMatch[2]}</p>`;
				} else {
					// Pattern 4: Alert type followed by whitespace and content (no newline/br): <p>[!WARNING] Content...</p>
					alertMatch = blockquoteContent.match(/<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s+(.+?)<\/p>/s);
					if (alertMatch) {
						contentHtml = `<p>${alertMatch[2]}</p>`;
					}
				}
			}
		}
		
		if (!alertMatch) {
			return match; // Not an alert blockquote
		}
		
		const alertType = alertMatch[1];
		const type = alertType.toLowerCase();
		const icon = getAlertIcon(type);
		
		// Remove empty paragraphs and clean up content
		const cleanedContent = contentHtml.replace(/<p>\s*<\/p>/g, '').trim();
		
		if (!cleanedContent) {
			return match; // Don't transform if no content
		}
		
		return `<div class="markdown-alert markdown-alert-${type}">
			<div class="markdown-alert-title">
				${icon}
				<span>[!${alertType}]</span>
			</div>
			<div class="markdown-alert-content">
				${cleanedContent}
			</div>
		</div>`;
	});
}

function getAlertIcon(type: string): string {
	const icons: Record<string, string> = {
		note: '<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1-.75-.75Zm.75-3.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5A.75.75 0 0 0 7.25 4.25Z"></path></svg>',
		tip: '<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5c-.916 0-1.75.416-2.333 1.076A3.97 3.97 0 0 0 5 5.5c0 .776.255 1.491.689 2.069L4.78 9.22a.75.75 0 1 0 1.06 1.06l.91-.91c.577.433 1.292.688 2.068.688a3.97 3.97 0 0 0 2.924-1.333c.66-.583 1.076-1.417 1.076-2.333s-.416-1.75-1.076-2.333A3.97 3.97 0 0 0 8 1.5ZM6.5 5.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm-.75 4.75a.75.75 0 0 0-1.5 0v.5a.75.75 0 0 0 1.5 0Zm3.5 0a.75.75 0 0 0-1.5 0v.5a.75.75 0 0 0 1.5 0ZM8 11.5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-1.5 0v.5c0 .414.336.75.75.75Z"></path></svg>',
		important: '<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 1 1 1.06 1.06L9.22 8.22a.75.75 0 0 1-1.06 0L6.22 6.28a.75.75 0 0 1 1.06-1.06l1 1ZM6 9.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
		warning: '<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
		caution: '<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm6.5-3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5Zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
	};
	return icons[type] || icons.note;
}

function getAlertColor(type: string): string {
	const colors: Record<string, string> = {
		note: '#0969da',
		tip: '#1a7f37',
		important: '#8250df',
		warning: '#9a6700',
		caution: '#cf222e'
	};
	return colors[type] || colors.note;
}

function getWebviewHtml(renderedMarkdown: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';">
	<title>README Preview</title>
	<style>
		* {
			box-sizing: border-box;
		}
		body {
			padding: 32px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
			font-size: 16px;
			line-height: 1.5;
			word-wrap: break-word;
			background-color: var(--vscode-editor-background, #ffffff);
			color: var(--vscode-editor-foreground, #24292f);
			max-width: 1012px;
			margin: 0 auto;
		}
		.markdown-body {
			font-size: 16px;
			line-height: 1.5;
			word-wrap: break-word;
		}
		/* Headings */
		h1, h2, h3, h4, h5, h6 {
			margin-top: 24px;
			margin-bottom: 16px;
			font-weight: 600;
			line-height: 1.25;
			color: var(--vscode-editor-foreground, #24292f);
		}
		h1 {
			font-size: 2em;
			padding-bottom: 0.3em;
			border-bottom: 1px solid var(--vscode-panel-border, #d0d7de);
		}
		h2 {
			font-size: 1.5em;
			padding-bottom: 0.3em;
			border-bottom: 1px solid var(--vscode-panel-border, #d0d7de);
		}
		h3 {
			font-size: 1.25em;
		}
		h4 {
			font-size: 1em;
		}
		h5 {
			font-size: 0.875em;
		}
		h6 {
			font-size: 0.85em;
			color: var(--vscode-descriptionForeground, #57606a);
		}
		/* Paragraphs */
		p {
			margin-top: 0;
			margin-bottom: 10px;
		}
		/* Lists */
		ul, ol {
			margin-top: 0;
			margin-bottom: 16px;
			padding-left: 2em;
		}
		li {
			margin-top: 0.25em;
		}
		li > p {
			margin-top: 16px;
		}
		li + li {
			margin-top: 0.25em;
		}
		/* Task Lists */
		.task-list-item {
			list-style-type: none;
		}
		.task-list-item input[type="checkbox"] {
			margin-right: 0.2em;
			margin-left: -1.6em;
			margin-top: 0.25em;
			vertical-align: middle;
			cursor: pointer;
		}
		.task-list-item input[type="checkbox"]:checked {
			accent-color: var(--vscode-textLink-foreground, #0969da);
		}
		/* Code */
		code {
			padding: 0.2em 0.4em;
			margin: 0;
			font-size: 85%;
			background-color: var(--vscode-textBlockQuote-background, rgba(175, 184, 193, 0.2));
			border-radius: 6px;
			font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		}
		pre {
			padding: 16px;
			overflow: auto;
			font-size: 85%;
			line-height: 1.45;
			background-color: var(--vscode-textBlockQuote-background, #f6f8fa);
			border-radius: 6px;
			margin-top: 0;
			margin-bottom: 16px;
			font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		}
		pre code {
			display: inline;
			max-width: auto;
			padding: 0;
			margin: 0;
			overflow: visible;
			line-height: inherit;
			word-wrap: normal;
			background-color: transparent;
			border: 0;
			font-size: 100%;
		}
		pre > code {
			padding: 0;
			margin: 0;
			word-break: normal;
			white-space: pre;
			background: transparent;
			border: 0;
		}
		/* Blockquotes */
		blockquote {
			padding: 0 1em;
			color: var(--vscode-descriptionForeground, #57606a);
			border-left: 0.25em solid var(--vscode-panel-border, #d0d7de);
			margin: 0 0 16px 0;
		}
		blockquote > :first-child {
			margin-top: 0;
		}
		blockquote > :last-child {
			margin-bottom: 0;
		}
		/* Tables */
		table {
			border-spacing: 0;
			border-collapse: collapse;
			display: block;
			width: max-content;
			max-width: 100%;
			overflow: auto;
			margin-top: 0;
			margin-bottom: 16px;
		}
		table th {
			font-weight: 600;
			background-color: var(--vscode-textBlockQuote-background, rgba(175, 184, 193, 0.2));
		}
		table th,
		table td {
			padding: 6px 13px;
			border: 1px solid var(--vscode-panel-border, #d0d7de);
		}
		table tr {
			background-color: var(--vscode-editor-background, #ffffff);
			border-top: 1px solid var(--vscode-panel-border, #c8d1dc);
		}
		table tr:nth-child(2n) {
			background-color: var(--vscode-textBlockQuote-background, #f6f8fa);
		}
		table img {
			background-color: transparent;
		}
		/* Links */
		a {
			color: var(--vscode-textLink-foreground, #0969da);
			text-decoration: none;
		}
		a:hover {
			text-decoration: underline;
		}
		/* Images */
		img {
			max-width: 100%;
			box-sizing: content-box;
			background-color: var(--vscode-editor-background, #ffffff);
		}
		/* Horizontal Rules */
		hr {
			height: 0.25em;
			padding: 0;
			margin: 24px 0;
			background-color: var(--vscode-panel-border, #d0d7de);
			border: 0;
		}
		/* Strong and Emphasis */
		strong {
			font-weight: 600;
		}
		/* Definition Lists */
		dl {
			padding: 0;
		}
		dl dt {
			padding: 0;
			margin-top: 16px;
			font-size: 1em;
			font-style: italic;
			font-weight: 600;
		}
		dl dd {
			padding: 0 16px;
			margin-bottom: 16px;
		}
		/* Nested Lists */
		ul ul,
		ul ol,
		ol ul,
		ol ol {
			margin-top: 0;
			margin-bottom: 0;
		}
		/* Details and Summary */
		details {
			display: block;
		}
		summary {
			cursor: pointer;
		}
		summary:hover {
			color: var(--vscode-textLink-foreground, #0969da);
		}
		/* Keyboard */
		kbd {
			display: inline-block;
			padding: 3px 5px;
			font-size: 11px;
			line-height: 10px;
			color: var(--vscode-editor-foreground, #24292f);
			vertical-align: middle;
			background-color: var(--vscode-textBlockQuote-background, #f6f8fa);
			border: solid 1px var(--vscode-panel-border, rgba(175, 184, 193, 0.2));
			border-bottom-color: var(--vscode-panel-border, rgba(175, 184, 193, 0.2));
			border-radius: 6px;
			box-shadow: inset 0 -1px 0 var(--vscode-panel-border, rgba(175, 184, 193, 0.2));
		}
		/* GitHub Alerts */
		.markdown-alert {
			padding: 1rem;
			margin-bottom: 16px;
			border-left: 0.25em solid;
			border-radius: 6px;
		}
		.markdown-alert-title {
			display: flex;
			align-items: center;
			font-weight: 600;
			margin-bottom: 0.5rem;
			margin-top: 0;
		}
		.markdown-alert-title .octicon {
			margin-right: 0.5rem;
			flex-shrink: 0;
			vertical-align: text-bottom;
		}
		.markdown-alert-title span {
			font-weight: 600;
		}
		.markdown-alert-content {
			margin-top: 0;
		}
		.markdown-alert-content p {
			margin-bottom: 0.5rem;
		}
		.markdown-alert-content p:last-child {
			margin-bottom: 0;
		}
		.markdown-alert-note {
			border-left-color: #0969da;
			background-color: rgba(9, 105, 218, 0.1);
		}
		.markdown-alert-note .markdown-alert-title {
			color: #0969da;
		}
		.markdown-alert-note .octicon {
			fill: #0969da;
		}
		.markdown-alert-tip {
			border-left-color: #1a7f37;
			background-color: rgba(26, 127, 55, 0.1);
		}
		.markdown-alert-tip .markdown-alert-title {
			color: #1a7f37;
		}
		.markdown-alert-tip .octicon {
			fill: #1a7f37;
		}
		.markdown-alert-important {
			border-left-color: #8250df;
			background-color: rgba(130, 80, 223, 0.1);
		}
		.markdown-alert-important .markdown-alert-title {
			color: #8250df;
		}
		.markdown-alert-important .octicon {
			fill: #8250df;
		}
		.markdown-alert-warning {
			border-left-color: #9a6700;
			background-color: rgba(154, 103, 0, 0.1);
		}
		.markdown-alert-warning .markdown-alert-title {
			color: #9a6700;
		}
		.markdown-alert-warning .octicon {
			fill: #9a6700;
		}
		.markdown-alert-caution {
			border-left-color: #cf222e;
			background-color: rgba(207, 34, 46, 0.1);
		}
		.markdown-alert-caution .markdown-alert-title {
			color: #cf222e;
		}
		.markdown-alert-caution .octicon {
			fill: #cf222e;
		}
	</style>
</head>
<body class="markdown-body">
${renderedMarkdown}
</body>
</html>`;
}
