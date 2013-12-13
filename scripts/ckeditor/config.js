/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	//config.plugins = 'dialogui,dialog,about,a11yhelp,dialogadvtab,basicstyles,bidi,blockquote,clipboard,button,panelbutton,panel,floatpanel,colorbutton,colordialog,templates,menu,div,resize,toolbar,elementspath,list,indent,enterkey,entities,popup,filebrowser,find,fakeobjects,flash,floatingspace,listblock,richcombo,font,forms,format,htmlwriter,horizontalrule,iframe,wysiwygarea,image,smiley,justify,link,maximize,newpage,pagebreak,pastetext,pastefromword,preview,print,removeformat,save,selectall,showblocks,showborders,sourcearea,specialchar,stylescombo,tab,table,undo,wsc';
	config.plugins = 'basicstyles,bidi,blockquote,clipboard,button,panelbutton,panel,floatpanel,menu,div,resize,toolbar,elementspath,list,indent,enterkey,entities,fakeobjects,floatingspace,listblock,richcombo,font,forms,format,htmlwriter,horizontalrule,iframe,wysiwygarea,image,smiley,justify,link,pastetext,pastefromword,removeformat,save,selectall,sourcearea,specialchar,stylescombo,tab,table,undo,wsc';
	config.skin = 'incsub';
	// %REMOVE_END%

	config.toolbar = [
			{
				name: 'basicstyles',
				items: [ 
					'Bold', 'Italic', 'AlignmentTypeToggle',
					'ListTypeToggle', 'Link', 'Blockquote', 'KitchenSink'
				] 
			},
			'/',
			{
				name: 'kitchensink',
				items: [ 
					'Format', 'Underline', 'Upfront_ColorSelect', 'Upfront_MoreTag',
					'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'ExtrasSelect', 'BulletedList', 'Image', 'NumberedList' // <-- Hidden
				]
			}
	];

	config.extraPlugins = 'onchange,kitchensink,toggled_items,upfront_images,upfront_colorpicker,upfront_more_tag,textformat';

	// use SVG icons for editor buttons if possible
	if(document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")){
		jQuery(document.documentElement).addClass('svg');
	}

	config.floatSpaceDockedOffsetY = 62; // Move toolbar out of the way
	config.floatSpacePinnedOffsetY = 30; // Deal with the Admin Toolbar

	config.allowedContent = true; // RECONFIGURE THIS!!!
};

CKEDITOR.on('instanceReady', function(e){
	/*
	On load show only the first row of buttons.
	Use CSS class selectors for IE<9 compatibility (jQuery supports pseudo selectors in IE<9):
		rows-only-first
		row-not-first
	*/

	var $editor = jQuery('.'+e.editor.id),
		$contain = jQuery('.cke_toolbox', $editor);

	// Current position.
	var top = $editor.css('top').replace('px');
		height = $editor.outerHeight();

	$contain.addClass('rows-only-first');
	jQuery('.cke_toolbar:not(:first-child)', $contain).addClass('row-not-first');

	// Set new absolute top position for editor, showing only the first row of buttons.
	var diff = height - $editor.outerHeight();
	$editor.css('top', (parseInt(top) + parseInt(diff)).toString() + 'px' );


	// Toggle editor toolbar show/hide
	e.editor.on("selectionCheck", function (e) { // Undocumented event
		if (e.data.getSelectedText && e.data.getSelectedText().length) $contain.show();
		else $contain.hide();
	});
	/*
	e.editor.on("afterCommandExec", function (e) {
		if (e.data && e.data.name && "showhideKitchenSink" === e.data.name) return false;
		$contain.hide();
	});
	*/
	e.editor.on("key", function (e) {
		$contain.hide();
	});
	$contain.hide();

});

// Image insertion blocks yay
(function ($) {
CKEDITOR.on("instanceReady", function (e) {
	var editor = e.editor,
		selection = editor.getSelection(),
		ranges = []
	;
	function attach_image_insertion_bits () {
		var $root = $(editor.container.$),
			root_offset = $root.offset(),
			$body = $("body"),
			$blocks = $root.find("p:not(.upfront-inserted_image-wrapper),div,ul,ol")
		;

		if($root.hasClass('ueditor-noimage'))
			return;

		ranges = [];
		$(document).off("click", ".upfront-image-attachment-bits");
		$(".upfront-image-attachment-bits").remove();
		$blocks.each(function (idx) {
			var $block = $(this),
				block_offset = $block.offset(),
				range = editor.createRange(),
				element = new CKEDITOR.dom.element(this)
			;
			range.moveToElementEditablePosition(element, true);
			ranges[idx] = range;

			$body.append(
				"<div data-idx='" + idx + "' class='upfront-image-attachment-bits' style='top:" + (block_offset.top-20) + "px;left:" + (root_offset.left-18) + "px;' />"
			);
			$block
				.on("mouseenter", function () {
					$('.upfront-image-attachment-bits').hide();
					var $handle = $('.upfront-image-attachment-bits[data-idx="' + idx + '"]');
					if ($handle.length) $handle.show();
				})
			;
		});
		$(document).on("click", ".upfront-image-attachment-bits", function (e) {
			var $me = $(this),
				idx = $me.attr("data-idx"),
				range = ranges[idx] || false
			;
			editor.focus();
			if (range) selection.selectRanges([range]);
			editor.execCommand('image');
			return false;
		});
	}
	editor.on("key", attach_image_insertion_bits);
	editor.on("insertHtml", attach_image_insertion_bits);
	editor.on("destroy", function () {
		$(".upfront-image-attachment-bits").remove();
	});
	//setInterval(attach_image_insertion_bits, 1000);
	attach_image_insertion_bits();
	
});
})(jQuery);