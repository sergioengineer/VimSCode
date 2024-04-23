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
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';
import { KeybindingWeight } from 'vs/platform/keybinding/common/keybindingsRegistry';

export class VimModeController implements IEditorContribution {
	public static ID = 'editor.contrib.vimmodeController';
	private mode: VimMode;

	constructor(private readonly editor: ICodeEditor) {
		this.mode = VimMode.Normal;

		this.updateCursorStyle();
	}

	public static get(editor: ICodeEditor): VimModeController | null {
		return editor.getContribution<VimModeController>(VimModeController.ID);
	}

	public switchMode(mode: VimMode) {
		this.mode = mode;
		this.updateCursorStyle();
	}

	updateCursorStyle() {
		let cursorStyle:
			| ReturnType<ICodeEditor['getRawOptions']>['cursorStyle']
			| undefined;
		if (this.mode === VimMode.Normal) {
			cursorStyle = 'block';
		}
		if (this.mode === VimMode.Insert) {
			cursorStyle = 'line';
		}
		if (this.mode === VimMode.VisualSelect) {
			cursorStyle = 'underline-thin';
		}

		this.editor.updateOptions({
			cursorStyle,
		});
	}

	getMode() {
		return this.mode;
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
				kbExpr: ContextKeyExpr.and(EditorContextKeys.editorTextFocus),
				primary: KeyCode.KeyI,
				secondary: [KeyCode.KeyA],
				weight: KeybindingWeight.EditorContrib,
			},
		});
	}

	isSupported(): boolean {
		return true;
	}

	run(accessor: ServicesAccessor, editor: ICodeEditor, args: any): void {
		const controller = VimModeController.get(editor);
		if (controller?.getMode() !== VimMode.Normal) {
			return;
		}

		controller?.switchMode(VimMode.Insert);
		return;
	}
}

class VimModeNormalCommand extends EditorAction {
	constructor() {
		super({
			id: 'editor.vimmode.normalMode',
			alias: 'Vim Mode - Normal',
			label: 'Vim Mode - Normal',
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

		controller?.switchMode(VimMode.Normal);
		return;
	}
}

registerEditorContribution(
	VimModeController.ID,
	VimModeController,
	EditorContributionInstantiation.BeforeFirstInteraction,
);

registerEditorAction(VimModeInsertCommand);
registerEditorAction(VimModeNormalCommand);
