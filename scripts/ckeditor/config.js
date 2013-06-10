/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'dialogui,dialog,about,a11yhelp,dialogadvtab,basicstyles,bidi,blockquote,clipboard,button,panelbutton,panel,floatpanel,colorbutton,colordialog,templates,menu,div,resize,toolbar,elementspath,list,indent,enterkey,entities,popup,filebrowser,find,fakeobjects,flash,floatingspace,listblock,richcombo,font,forms,format,htmlwriter,horizontalrule,iframe,wysiwygarea,image,smiley,justify,link,maximize,newpage,pagebreak,pastetext,pastefromword,preview,print,removeformat,save,selectall,showblocks,showborders,sourcearea,specialchar,stylescombo,tab,table,undo,wsc';
	config.skin = 'incsub';
	// %REMOVE_END%

	config.toolbar = [
			{
				name: 'basicstyles',
				items: [ 
					'Bold', 'Italic', 'AlignmentTypeToggle',/*'JustifyLeft', 'JustifyCenter', 'JustifyRight', <-- These get killed in favor of AlignmentTypeToggle */
					/*'BulletedList', 'NumberedList', <-- These get killed in favor of ListTypeToggle */ 'ListTypeToggle', 'Link', 'Blockquote', 'Image', 'KitchenSink'
				] 
			},
			'/',
			{
				name: 'kitchensink',
				items: [ 
					'Format', 'Underline', /*'JustifyBlock', <-- This gets killed just because */'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'ColorSelect', 'ExtrasSelect','BulletedList', 'NumberedList',

					/*
					'TextColor',
					'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo', 
					'ShowBlocks' , 'RemoveFormat', 'BGColor', 'Source'
					*/
				]
			}
	];

	config.extraPlugins = 'onchange,kitchensink,colorselect,toggled_items';

	// use SVG icons for editor buttons if possible
	if(document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")){
		jQuery(document.documentElement).addClass('svg');
	}

	config.floatSpaceDockedOffsetY = 62; // Move toolbar out of the way
	config.floatSpacePinnedOffsetY = 30; // Deal with the Admin Toolbar

	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
};

CKEDITOR.on('instanceReady', function(e){
	e.editor.element.$.title = "Click to edit.";

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

});