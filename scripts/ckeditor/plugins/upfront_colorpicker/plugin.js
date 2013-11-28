(function ($) {

var Plugin = {
	init: function (editor) {
		editor.addCommand('Upfront_ColorSelect', Picker);
		editor.ui.addButton('Upfront_ColorSelect', {
			label: 'Select color',
			command: 'Upfront_ColorSelect',
			toolbar: 'kitchensink',
			allowedContent: new CKEDITOR.style(CKEDITOR.config.colorSelect_foreStyle),
		});
	}
};

var Picker = {
	spectrum_defaults: {
		clickoutFiresChange: true,
		chooseText: 'OK',
		showPalette: true,
		showSelectionPalette: true,
		change: this.handle_color_change
	},
	exec: function (editor) {
		var $picker_root = $("." + editor.id + " .upfront-ckeditor-colorselect:first"),
			$el = $picker_root.find("input:first"),
			new_state = this.state == CKEDITOR.TRISTATE_ON ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON
		;
		if (new_state == CKEDITOR.TRISTATE_ON) {
			$picker_root.show();
			$el.spectrum($.extend({}, this.spectrum_defaults, {
				change: function (color) {
					color = color.toHexString();
					console.log(color);
					editor.removeStyle(new CKEDITOR.style( editor.config['colorSelect_foreStyle'], {color: 'inherit'}));
					var colorStyle = editor.config['colorSelect_foreStyle'];
					colorStyle.childRule = function( element ) {
						return !( element.is( 'a' ) || element.getElementsByTag( 'a' ).count() ) || isUnstylable( element );
					};
					editor.applyStyle(new CKEDITOR.style(colorStyle, {color: color}));
					editor.execCommand("Upfront_ColorSelect");
				},
				move: function (color) {
					var rgb = color.toHexString();
					$('.sp-dragger').css({
						'border-top-color': rgb,
						'border-right-color': rgb
					});
				},
				show: function(color){					
					var rgb = color.toHexString();
					$('.sp-dragger').css({
						'border-color': rgb
					});
				}
			}));
			setTimeout(function () {
				$el.spectrum("show");
			}, 200);
		} else {
			$picker_root.hide();
			$el.spectrum("destroy");
		}
		this.setState(new_state);
	}
}

CKEDITOR.plugins.add('upfront_colorpicker', Plugin);
CKEDITOR.config.colorSelect_foreStyle = {
	element: 'span',
	styles: { 'color': '#(color)' },
	overrides: [ {
		element: 'font', attributes: { 'color': null }
	}]
};
CKEDITOR.on('instanceReady', function(e){
	$("." + e.editor.id).append('<div class="upfront-ckeditor-colorselect"><input style="display:none" type="text" /></div>');
});

})(jQuery);