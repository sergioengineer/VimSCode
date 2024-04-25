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
import * as nls from 'vs/nls';
import {
	ContextKeyExpr,
	IContextKey,
	IContextKeyService,
	RawContextKey,
} from 'vs/platform/contextkey/common/contextkey';
import { KeybindingWeight } from 'vs/platform/keybinding/common/keybindingsRegistry';

export enum VimMode {
	Normal,
	VisualSelect,
	Insert,
}

export class VimModeController implements IEditorContribution {
	public static ID = 'editor.contrib.vimmodeController';
	private mode: IContextKey<VimMode>;
	static readonly MODE = new RawContextKey<VimMode>(
		'vimMode',
		VimMode.Normal,
		nls.localize('vimMode', 'Which mode vim is on')
	);

	constructor(
		private readonly editor: ICodeEditor,
		@IContextKeyService contextKeyService: IContextKeyService
	) {
		this.mode = VimModeController.MODE.bindTo(contextKeyService);
		this.updateCursorStyle();
	}

	public static get(editor: ICodeEditor): VimModeController | null {
		return editor.getContribution<VimModeController>(VimModeController.ID);
	}

	public switchMode(mode: VimMode) {
		this.mode.set(mode);
		this.updateCursorStyle();
	}

	updateCursorStyle() {
		let cursorStyle:
			| ReturnType<ICodeEditor['getRawOptions']>['cursorStyle']
			| undefined;
		const mode = this.mode.get();
		if (mode === VimMode.Normal) {
			cursorStyle = 'block';
		}
		if (mode === VimMode.Insert) {
			cursorStyle = 'line';
		}
		if (mode === VimMode.VisualSelect) {
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

class VimModeInsertCommand extends EditorAction {
	constructor() {
		super({
			id: 'editor.vimmode.insertMode',
			alias: 'Vim Mode - Insert',
			label: 'Vim Mode - Insert',
			precondition: ContextKeyExpr.equals('vimMode', VimMode.Normal),
			kbOpts: {
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
		console.log('insert command');

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
			precondition: ContextKeyExpr.or(
				ContextKeyExpr.equals('vimMode', VimMode.VisualSelect),
				ContextKeyExpr.equals('vimMode', VimMode.Insert)
			),
			kbOpts: {
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

		console.log('normal mode command');
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
