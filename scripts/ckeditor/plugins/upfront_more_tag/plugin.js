(function ($) {

	var Plugin = {
		init: function (editor) {
			editor.addCommand('Upfront_MoreTag', MoreTag);
			editor.ui.addButton('Upfront_MoreTag', {
				label: 'More',
				command: 'Upfront_MoreTag',
				toolbar: 'kitchensink'
			});
		}
	};

	var MoreTag = {
		exec: function (editor) {
			editor.insertHtml('<!-- more -->', 'text');
		}
	}

	CKEDITOR.plugins.add('upfront_more_tag', Plugin);

})(jQuery);