/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import {
	EditorAction,
	EditorContributionInstantiation,
	registerEditorAction,
	registerEditorContribution,
	ServicesAccessor,
} from 'vs/editor/browser/editorExtensions';
import { IEditorContribution } from 'vs/editor/common/editorCommon';
import { EditorContextKeys } from 'vs/editor/common/editorContextKeys';
import { KeybindingWeight } from 'vs/platform/keybinding/common/keybindingsRegistry';

export class VimModeController implements IEditorContribution {
	public static ID = 'editor.contrib.vimmodeController';
	readonly editor: ICodeEditor;
	private mode: VimMode;

	constructor(editor: ICodeEditor) {
		this.editor = editor;
		this.mode = VimMode.Normal;
		this.updateCursorStyle();
		editor.onKeyDown((evt) => {
			this.switchMode();
		});
	}

	public static get(editor: ICodeEditor): VimModeController | null {
		return editor.getContribution<VimModeController>(VimModeController.ID);
	}

	public switchMode() {
		if (this.mode === VimMode.Insert) {
			this.mode = VimMode.Normal;
		} else {
			this.mode = VimMode.Insert;
		}

		this.updateCursorStyle();
	}

	updateCursorStyle() {
		const options = this.editor.getRawOptions();

		if (this.mode === VimMode.Normal) {
			options.cursorStyle = 'block';
		}
		if (this.mode === VimMode.Insert) {
			options.cursorStyle = 'line';
		}
		if (this.mode === VimMode.VisualSelect) {
			options.cursorStyle = 'underline-thin';
		}

		this.editor.updateOptions(options);
		setTimeout(() => this.editor.render(true), 1000);
	}

	dispose(): void {}

	saveViewState?() {}

	restoreViewState?(state: any): void {}
}

export enum VimMode {
	Normal,
	VisualSelect,
	Insert,
}

class VimModeInsertCommand extends EditorAction {
	constructor() {
		super({
			id: 'editor.vimmode.insertMode',
			alias: 'Vim Mode - Insert',
			label: 'Vim Mode - Insert',
			precondition: EditorContextKeys.writable,
			kbOpts: {
				kbExpr: EditorContextKeys.editorTextFocus,
				primary: KeyMod.CtrlCmd | KeyCode.KeyC,
				weight: KeybindingWeight.EditorContrib,
			},
		});
	}

	isSupported(): boolean {
		return true;
	}

	run(accessor: ServicesAccessor, editor: ICodeEditor, args: any): void {
		const controller = VimModeController.get(editor);

		controller?.switchMode();
		return;
	}
}

registerEditorContribution(
	VimModeController.ID,
	VimModeController,
	EditorContributionInstantiation.BeforeFirstInteraction,
);

registerEditorAction(VimModeInsertCommand);
