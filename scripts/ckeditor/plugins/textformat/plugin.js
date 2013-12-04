(function($){
CKEDITOR.plugins.add('textformat', {
	init: function(editor){
		editor.addCommand('openTextformat', {
			exec: function(e){
				console.log('created modal');
				var modal = $('.' + editor.id + ' .uckeditor-textformat');

				if(!modal.is(':visible')){
					var button = $('.' + editor.id).find('.cke_button__textformat');
					modal.show();
					button.addClass('textformat-open');
					setTimeout(function(){
						$('body').one('click', function(e){
							modal.hide();
							button.removeClass('textformat-open');
						});
					}, 100);
				}
			}
		});

		editor.ui.addButton('Textformat', {
			label: 'Text Format',
			command: 'openTextformat'
		});
	}
});

CKEDITOR.on('instanceReady', function(e){
	var editorEl = $("." + e.editor.id),
		buttonEl = editorEl.find('.cke_button__textformat_icon'),
		modal = $('<div class="uckeditor-textformat"></div>'),
		select = $('<div class="uckeditor-textformat-selector"><span class="uckeditor-color_label">Text format:</span> <span><a class="uckeditor-select">Normal</a></span></div>'),
		options = [
			{ value: 'p', name: 'Normal'},
			{ value: 'h1', name: 'Heading 1'},
			{ value: 'h2', name: 'Heading 2'},
			{ value: 'h3', name: 'Heading 3'},
			{ value: 'h4', name: 'Heading 4'},
			{ value: 'h5', name: 'Heading 5'},
			{ value: 'pre', name: 'Preformatted'}
		],
		styles = {},
		textColor = e.editor.ueditor && e.editor.ueditor.textColor ? e.editor.ueditor.textColor : '#ffffff',
		panelColor = e.editor.ueditor && e.editor.ueditor.panelColor ? e.editor.ueditor.panelColor: '#1fcd8f',
		selectOptions = new Upfront.Content.microselect({options: options}),
		cp = [
			{id:'textcolor', label: 'Text Color', textValue: textColor, value: textColor},
			{id: 'panelcolor', label: 'Panel Color', textValue: panelColor, value: panelColor}
		],
		cssKeys = {
			textcolor: 'color',
			panelcolor: 'background-color'
		},
		spectrumOptions = {
			clickoutFiresChange: true,
			chooseText: 'OK',
			showPalette: true,
			showSelectionPalette: true,
			move: function(color){
				var rgb = color.toHexString(),
					ev = $(this).data('ev')
				;
				$('.sp-dragger').css({
					'border-top-color': rgb,
					'border-right-color': rgb
				});

				e.editor.ueditor.trigger(ev + ':change', color);
				buttonEl.css(cssKeys[ev], color.toRgbString());
			},
			show: function(color){
				var rgb = color.toHexString();
				$('.sp-dragger').css({
					'border-color': rgb
				});

			},
			change: function(color){
				var ev = $(this).data('ev');
				e.editor.ueditor.trigger(ev + ':change', color);
				buttonEl.css(cssKeys[ev], color.toRgbString());
			},
			hide: function(color) {
				var ev = $(this).data('ev');
				e.editor.ueditor.trigger(ev + ':change', color);
				buttonEl.css(cssKeys[ev], color.toRgbString());			
			}
		},
		getLabel = function(tag){
			var label = '';
			_.each(options, function(op){
				if(op.value == tag)
					label = op.name;
			});
			return label;
		}
	;

	_.each(options, function(op){
		styles[op.value] = new CKEDITOR.style( e.editor.config['format_' + op.value]);
	});


	e.editor.on( 'selectionChange', function( ev ) {
		if(!ev.data.selection.getSelectedText()){
			$('.' + editor.id).find('.cke_button__textformat').removeClass('textformat-open');
			return modal.hide();
		}

		var currentTag = selectOptions.$('input').val(),
			elementPath = ev.data.path,
			isEnabled = !editor.readOnly && elementPath.isContextFor( 'p' );

		if ( isEnabled ) {
			for ( var tag in styles ) {
				if ( styles[ tag ].checkActive( elementPath ) ) {
					if ( tag != currentTag ){
						selectOptions.$('input').val(tag);
						modal.find('.uckeditor-select').text(getLabel(tag)).append(selectOptions.$el);	
						selectOptions.delegateEvents();					
					}
					return;
				}
			}
		}
	});

	buttonEl.css({
		color: textColor,
		'background-color': panelColor
	});

	select.on('click', function(ev){
		if($(ev.target).hasClass('uckeditor-select')){
			selectOptions.open();
			e.editor.focus();		
		}
	});

	selectOptions
		.on('select', function(value){
			var ed = e.editor,
				style = styles[value],
				path = ed.elementPath()
				label = false
			;

			ed.focus();
			ed.fire('saveSnapshot');

			ed[ style.checkActive( path ) ? 'removeStyle' : 'applyStyle' ]( style );

			label = getLabel(value);

			console.log('something selected: ' + value);
			modal.find('.uckeditor-select').text(label).append(selectOptions.$el.hide());
			selectOptions.delegateEvents();
		})
		.render();

	modal.append(select);
	select.find('a').append(selectOptions.$el);

	modal.on('click', function(e){
		e.stopPropagation();
	});
	modal.on('rightclick', function(e){
		e.stopPropagation();
	});

	_.each(cp, function(item){
		modal.append('<div class="uckeditor-color uckeditor-' + item.id +'">' + 
			'<span class="uckeditor-color_label">' + item.label + ':</span> ' + 
			'<input class="uckeditor-spectrum" type="text" value="' + item.value + '" data-ev="' + item.id + '">'
		);
	});

	modal.find('.uckeditor-textcolor input').spectrum(spectrumOptions);

	spectrumOptions.showAlpha = true;
	modal.find('.uckeditor-panelcolor input').spectrum(spectrumOptions);

	editorEl.append(modal);
});

})(jQuery);