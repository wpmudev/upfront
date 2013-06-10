var colorselect = (function () {

	/*
	TODO:
		Set font color
		Hex color input box is unselectable, possible click event conflict with ckeditor.
	*/

	var $dom = jQuery(jQuery.parseHTML(' \
	<div class="cke-color-select-panel" style="display:none"> \
		 \
		<h3>Theme Colors:</h3> \
		<div class="cke-color-section cke-theme-color"> \
			<div class="cke-one-color"></div>			 \
			<div class="clear"></div> \
		</div> \
		 \
		<h3>Recently Used:</h3> \
		<div class="cke-color-section cke-recent-color"> \
			<div class="cke-one-color cke-selected"></div> \
			<div class="cke-one-color"></div> \
			<div class="clear"></div> \
		</div> \
	 \
		<h3>Custom Color:</h3> \
		<div class="cke-color-section cke-color-section-last cke-custom-color"> \
			<input type="text" value="#ffffff" name="custom-color"  \
				class="cke-input-font-color" id="jscolor-picker"/> \
			<span class="cke-one-color" id="jscolor-styleElement"></span> \
		</div> \
		<div class="clear"></div> \
	 \
	</div>'));

	var config = {
		pickerFaceColor:'#f2f9ff',
		pickerFace:9, pickerBorder:1,
		pickerBorderColor:'#1a2d40',
		pickerInsetColor:'transparent',
		pickerOffsetElement:'.cke-custom-color .cke-one-color',
		appendTo: '.cke-color-select-panel',
		styleElement:'jscolor-styleElement',
		hash:true
	}
	
	// Set the font elements CSS color style.
	var setFontColor = CKEDITOR.tools.addFunction( function( newColor ) {
		var config = editor.config;
		newColor = '#'+newColor.toUpperCase();

		// debugger;
		//editor.focus(); // <<< does this need to run within an iframe?

		// Clean up any conflicting style within the range.
		editor.removeStyle( new CKEDITOR.style( config[ 'colorSelect_foreStyle' ], { color: 'inherit' } ) );

		if ( newColor ) {
			var colorStyle = config[ 'colorSelect_foreStyle' ];

			colorStyle.childRule = function( element ) {
				// Fore color style must be applied inside links instead of around it. (#4772,#6908)
				return !( element.is( 'a' ) || element.getElementsByTag( 'a' ).count() ) || isUnstylable( element );
			};

			editor.applyStyle( new CKEDITOR.style( colorStyle, { color: newColor } ) );
		}
	} );

	var current_color, $picker, picker, recentColors, editor;

	function init(){
		if (!jQuery.contains(document.documentElement, $dom[0])){

			// One colorselect is shared between all editors.
			jQuery('body').append($dom);


			current_color = jQuery('#jscolor-styleElement', $dom);
			$picker = jQuery('#jscolor-picker', $dom);
			picker = new jscolor.color(document.getElementById('jscolor-picker'), config);

			// Let's try to rebind click handlers - solving editor conflict
			jQuery(document).on("click", "#jscolor-picker", function () {
				picker.showPicker();
				return false;
			});

			initColors();
			initEvents();
		}
		jQuery(".cke-color-select-panel").hide();
	}

	function initColors(){
		recentColors =	supportsLocalStorage() && 
						localStorage.getItem("jscolorRecentColors") !== null ?
							JSON.parse(localStorage.getItem("jscolorRecentColors")) :
							[];

		var upfrontThemeColors = typeof window.upfrontThemeColors !== 'undefined' ? window.upfrontThemeColors : [];

		renderColors('theme', upfrontThemeColors);
		renderColors('recent', recentColors);
	}

	function setEditor( newEditor ){
		editor = newEditor;
	}

	function initEvents(){
		current_color.on('click', function(){
			picker.togglePicker();
		});

		jQuery(document).on('close.jscolor', function(){
			setLatestColor(picker.toString());
			renderColors('recent', recentColors);
		});

		var onNewColorSelected = function(){
			var newColor = picker.toString();
			// Update SVG color for all editors.
			jQuery('span.cke_button__colorselect_icon svg path').attr('fill', '#'+newColor);
			
			CKEDITOR.tools.callFunction( setFontColor, newColor );
			
			/*
			a = jQuery('<a> </a>');
			a.attr('_cke_focus','1');
			a.attr('hidefocus', 'true');
			a.attr('onclick', 'CKEDITOR.tools.callFunction(', setFontColor, ',\'', newColor, '\',\'', 'del', '\'); return false;');
			debugger;
			jQuery('.cke_chrome.'+editor.id).append(a);
			a.click();
			*/
			return false;
		};

		jQuery(document).on('onImmediateChange.jscolor', onNewColorSelected); // When user drags mouse on picker.
		$picker.on('change', onNewColorSelected); // When user clicks recent/theme color.

		// Set color by clicking on a recent/theme color.
		jQuery('.cke-recent-color, .cke-theme-color').on('click', '.cke-one-color',  function(){
			var thisColor = jQuery(this);

			if(typeof thisColor.attr('title') == 'string' && picker.fromString(thisColor.attr('title'))){
				jQuery('.cke-selected').removeClass('cke-selected');
				thisColor.addClass('cke-selected');
				$picker.trigger('change');
			}
		});
	}
	
	function supportsLocalStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch(e){
			return false;
		}
	}

	function setLatestColor(color){
		if(recentColors.indexOf(color)>-1)
			return;

		if(recentColors.length == 6){
			recentColors.pop();
		}
		recentColors.unshift(color);

		if(supportsLocalStorage()){
			localStorage['jscolorRecentColors'] = JSON.stringify(recentColors);
		}
	}

	/**
	 * renders recent/theme colors
	 * @param  {String} container recent|theme
	 * @param  {Array} colors
	 */
	function renderColors(container, colors){
		var html = [],
			current = picker.toString();

		for (var i = 0; i < colors.length; i++) {
			var selected  = current==colors[i] ? 'cke-selected' : '';
			html.push(
				'<div class="cke-one-color '+selected+'" style="background-color: #'+colors[i]+';" title="#'+colors[i].toUpperCase()+'"></div>'
			);
		}

		// Show 6 with placeholders for missing colors.
		for (var i = 0; i < (6-colors.length); i++ ){
			html.push('<div class="cke-one-color cke-placeholder"> </div>');
		}

		jQuery('.cke-'+container+'-color').html(html.join('') + '<div class="clear"></div>');
	}


	function show(){
		$dom.show();
	}

	function hide(){
		$dom.hide();
		picker.hidePicker();
	}

	return {
		init: init,
		$dom: $dom,
		show: show,
		hide: hide,
		setEditor: setEditor
	};
}());


CKEDITOR.plugins.add( 'colorselect', {
	init: function( editor ) {
		colorselect.setEditor( editor ); // <<<
		colorselect.init();

		editor.on('blur', function(){
			this.commands.showhideColorSelect.setState( CKEDITOR.TRISTATE_OFF );
			colorselect.hide();
		});

		editor.addCommand( 'showhideColorSelect', {
			exec: function( editor ) {

				var new_state = this.state == CKEDITOR.TRISTATE_ON ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON,
					$editor = jQuery('.cke_chrome.'+editor.id),
					toolbox =  jQuery('.cke_toolbox', $editor),
					btn = jQuery('.cke_button__colorselect', $editor);

				this.setState( new_state );
				
				if( !jQuery.contains($editor[0], colorselect.$dom[0]) ){
					colorselect.$dom.detach(); // Remove from other editors.
					$editor.append(colorselect.$dom);
				}

				if( new_state == CKEDITOR.TRISTATE_ON){
					var p = btn.position();
					p.top += btn.outerHeight() + 2;

					colorselect.$dom.css(p);
					colorselect.show();
				}else{
					colorselect.hide();
				}

			},
			editorFocus: true
		});

		editor.ui.addButton( 'ColorSelect', {
			label: 'Set font color.',
			command: 'showhideColorSelect',
			toolbar: 'kitchensink'
		});

		editor.on('instanceReady', function(e){
			var btn = jQuery('.'+editor.id+' .cke_button__colorselect'),
				icon = jQuery('.cke_button__colorselect_icon', btn);

			// Dropdown arrow
			btn.append('<span class="cke_combo_open"><span class="cke_combo_arrow"></span></span>');
			btn.addClass('cke_boxshadow');

			// Embed SVG to allow the color of fill to be set via JS.
			if(jQuery(document.documentElement).hasClass('svg')){
				var svg = 
					'<svg version="1.1" id="font-color-indicator" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" \
						 x="0px" y="0px" width="34px" height="34px" viewBox="33 33 34 34" enable-background="new 33 33 34 34" xml:space="preserve"> \
					<path fill="#231F20" d="M54.541,51.157c0.992,2.528,1.393,2.593,2.098,2.688c0.176,0.032,0.256,0.177,0.256,0.337 \
						c0,0.159-0.08,0.305-0.24,0.305H51.74c-0.129,0-0.209-0.146-0.209-0.305c0-0.16,0.08-0.32,0.24-0.337 \
						c0.656-0.048,0.896-0.224,0.896-0.624c0-0.256-0.146-0.544-0.306-0.96l-0.526-1.327h-3.954l-0.769,2.225 \
						c-0.048,0.127-0.064,0.224-0.064,0.304c0,0.304,0.32,0.304,0.96,0.384c0.145,0.018,0.24,0.176,0.24,0.336s-0.096,0.305-0.32,0.305 \
						H44.39c-0.24,0-0.352-0.176-0.352-0.336c0-0.145,0.08-0.271,0.24-0.305c0.704-0.128,1.312-0.24,2-2.049l2.85-7.555l-0.496-1.088 \
						c-0.049-0.112-0.08-0.192-0.08-0.288c0-0.144,0.128-0.24,0.271-0.24h2.338L54.541,51.157z M48.234,49.94h3.217l-1.696-4.386 \
						L48.234,49.94z"/> \
					</svg>';

				icon.html(svg);
			}

		});
	}
});



/**
 * Note: Taken from the standard 'colorbutton' plugin.
 * Stores the style definition that applies the text foreground color.
 *
 *		// This is actually the default value.
 *		config.colorButton_foreStyle = {
 *			element: 'span',
 *			styles: { color: '#(color)' }
 *		};
 *
 * @cfg [colorButton_foreStyle=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.colorSelect_foreStyle = {
	element: 'span',
	styles: { 'color': '#(color)' },
	overrides: [ {
		element: 'font', attributes: { 'color': null }
	}]
};
CKEDITOR.on('instanceReady', function (e) {
	colorselect.setEditor( e.editor ); 
});