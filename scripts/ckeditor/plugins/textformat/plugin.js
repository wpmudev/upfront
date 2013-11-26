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
		}
	;

	buttonEl.css({
		color: textColor,
		'background-color': panelColor
	});

	select.on('click', function(){
		selectOptions.open();
	});

	selectOptions
		.on('select', function(value){
			console.log('something selected: ' + value);
			modal.find('.uckeditor-select').text(value);
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