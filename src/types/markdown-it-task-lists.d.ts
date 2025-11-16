declare module 'markdown-it-task-lists' {
	type MarkdownIt = import('markdown-it');

	interface TaskListOptions {
		/** When true, renders checkboxes as disabled inputs. */
		enabled?: boolean;
		/** Text for aria-label attributes. */
		label?: string;
		/** Place the label after the checkbox input. */
		labelAfter?: boolean;
	}

	const taskLists: (md: MarkdownIt, options?: TaskListOptions) => void;

	export default taskLists;
}

