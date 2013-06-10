(function ($) {

/* --- Toggleable lists --- */

var TOGGLE_STATE_OFF = 0,
	TOGGLE_STATE_BULLET = 1,
	TOGGLE_STATE_NUMBER = 2
;

function init_list_toggleable (editor) {
	editor.addCommand('toggleListType', {
		exec: function (editor) {
			var current_state = this._toggle_state;
			this.toggle_state(current_state);
		},
		toggle_state: function (state) {
			switch (state) {
				case TOGGLE_STATE_BULLET:
					this.set_state_number();
					editor.execCommand('numberedlist');
					break;
				case TOGGLE_STATE_NUMBER:
					this.set_state_off();
					editor.execCommand('numberedlist');
					break;
				default:
					this.set_state_bullet();
					editor.execCommand('bulletedlist');
					break;
			}
		},
		set_state_off: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = TOGGLE_STATE_OFF;
			this.setState(CKEDITOR.TRISTATE_OFF);
			$button.removeClass("toggle_state_number").removeClass("toggle_state_bullet");
		},
		set_state_number: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = TOGGLE_STATE_NUMBER;
			this.setState(CKEDITOR.TRISTATE_ON);
			$button.removeClass("toggle_state_bullet").addClass("toggle_state_number");
		},
		set_state_bullet: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = TOGGLE_STATE_BULLET;
			this.setState(CKEDITOR.TRISTATE_ON);
			$button.removeClass("toggle_state_number").addClass("toggle_state_bullet");
		}
	});
	editor.ui.addButton('ListTypeToggle', {
		label: 'Toggle list style',
		command: 'toggleListType',
		toolbar: 'basicstyles'
	});
	editor.getCommand("bulletedlist").on("state", function () {
		var toggle = editor.getCommand("toggleListType");
		if (this.state === CKEDITOR.TRISTATE_ON) toggle.set_state_bullet();
		else editor.getCommand("numberedlist").fire("refresh");
	});
	editor.getCommand("numberedlist").on("state", function () {
		var toggle = editor.getCommand("toggleListType");
		if (this.state === CKEDITOR.TRISTATE_ON) toggle.set_state_number();
		else toggle.set_state_off();
	});
}

/* --- Toggleable alignments --- */

var ALIGNMENT_TOGGLE_STATE = {
	LEFT: 'left',
	CENTER: 'center',
	RIGHT: 'right'
};

function init_alignment_toggleable (editor) {
	editor.addCommand('toggleAlignmentType', {
		exec: function (editor) {
			var next_state = this._toggle_state || ALIGNMENT_TOGGLE_STATE.LEFT;
			this.toggle_state(next_state);
			this.setState(CKEDITOR.TRISTATE_ON);
		},
		toggle_state: function (state) {
			console.log(state);
			switch (state) {
				case ALIGNMENT_TOGGLE_STATE.CENTER:
					this.set_state_right();
					editor.execCommand('justifyright');
					break;
				case ALIGNMENT_TOGGLE_STATE.RIGHT:
					this.set_state_left();
					editor.execCommand('justifyleft');
					break;
				case ALIGNMENT_TOGGLE_STATE.LEFT:
					this.set_state_center();
					editor.execCommand('justifycenter');
					break;
			}
		},
		set_state_left: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = ALIGNMENT_TOGGLE_STATE.LEFT;
			$button.removeClass("toggle_state_center").removeClass("toggle_state_right").addClass("toggle_state_left");
		},
		set_state_center: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = ALIGNMENT_TOGGLE_STATE.CENTER;
			$button.removeClass("toggle_state_left").removeClass("toggle_state_right").addClass("toggle_state_center");
		},
		set_state_right: function () {
			var button_id = this.uiItems[0]._.id,
				$button = $("#" + button_id)
			;
			this._toggle_state = ALIGNMENT_TOGGLE_STATE.RIGHT;
			$button.removeClass("toggle_state_left").removeClass("toggle_state_center").addClass("toggle_state_right");
		}
	});
	editor.ui.addButton('AlignmentTypeToggle', {
		label: 'Toggle alignment style',
		command: 'toggleAlignmentType',
		toolbar: 'basicstyles'
	});
	editor.getCommand("justifyleft").on("state", function () {
		var toggle = editor.getCommand("toggleAlignmentType");
		toggle.setState(CKEDITOR.TRISTATE_ON);
		if (this.state === CKEDITOR.TRISTATE_ON) toggle.set_state_left();
		else {
			editor.getCommand("justifycenter").fire("refresh");
			editor.getCommand("justifyright").fire("refresh");
		}
	});
	editor.getCommand("justifycenter").on("state", function () {
		var toggle = editor.getCommand("toggleAlignmentType");
		toggle.setState(CKEDITOR.TRISTATE_ON);
		if (this.state === CKEDITOR.TRISTATE_ON) toggle.set_state_center();
		else {
			editor.getCommand("justifyleft").fire("refresh");
			editor.getCommand("justifyright").fire("refresh");
		}
	});
	editor.getCommand("justifyright").on("state", function () {
		var toggle = editor.getCommand("toggleAlignmentType");
		toggle.setState(CKEDITOR.TRISTATE_ON);
		if (this.state === CKEDITOR.TRISTATE_ON) toggle.set_state_right();
		else toggle.set_state_left();
	});
}

function init (editor) {
	init_list_toggleable(editor);
	init_alignment_toggleable(editor);
}

CKEDITOR.plugins.add('toggled_items', {
	init: init
});

})(jQuery);