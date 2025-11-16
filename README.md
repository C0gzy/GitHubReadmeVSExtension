# GitHub README Viewer

A VS Code extension that allows you to preview GitHub README files with GitHub-style rendering, including support for GitHub alerts and task lists.

## Features

* **GitHub-style Preview**: View your README files rendered exactly as they appear on GitHub
* **GitHub Alerts Support**: Automatically renders GitHub alert blocks (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) with proper styling and icons
* **Task Lists**: Full support for GitHub-style task lists with checkboxes
* **Easy Access**: Right-click on any README file in the Explorer to preview it
* **Side-by-Side View**: Preview opens in a webview panel beside your editor for easy comparison
* **GitHub Styling**: Matches GitHub's markdown rendering including typography, colors, and spacing

### How to Use

1. Right-click on any `README.md` file in the VS Code Explorer
2. Select **"Preview GitHub README"** from the context menu
3. The preview will open in a new panel beside your editor

Alternatively, you can use the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux) and search for "Preview GitHub README".

## Requirements

* VS Code version 1.99.0 or higher
* NPM 

### Packages

* "markdown-it": "^14.1.0",
* "markdown-it-task-lists": "^2.1.1"

## Extension Settings

This extension does not currently add any VS Code settings. It works out of the box with default GitHub styling.

## Known Issues

None at this time. If you encounter any issues, please report them on the [GitHub repository](https://github.com/C0gzy/GitHubReadmeVSExtension).

## Release Notes

### 0.0.1

Initial release of GitHub README Viewer.

#### Added

* Right-click context menu option to preview README files
* GitHub-style markdown rendering with proper HTML formatting
* Support for GitHub alerts (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
* Task list rendering with interactive checkboxes
* GitHub-styled preview panel with proper typography and colors

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
