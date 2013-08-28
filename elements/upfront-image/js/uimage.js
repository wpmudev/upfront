(function ($) {

var	templates = [
		'text!' + Upfront.data.uimage.template, 
		'text!../elements/upfront-image/tpl/image_editor.html'
	]
;

require(templates, function(imageTpl, editorTpl) {
var UimageModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.uimage.defaults);
		properties.element_id = Upfront.Util.get_unique_id("image-object");
		this.init_properties(properties);
	}
});

var UimageView = Upfront.Views.ObjectView.extend(_.extend({}, /*Upfront.Mixins.FixedObjectInAnonymousModule,*/ {
	model: UimageModel,
	imageTpl: Upfront.Util.template(imageTpl),
	selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
	progressTpl: _.template($(editorTpl).find('#progress-tpl').html()),
	formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
	sizes: false,
	elementSize: {width: 0, height: 0},
	imageId: 0,
	imageSize: {width: 0, height: 0},
	imageOffset: {top: 0, left: 0},
	maskOffset: {top: 0, left: 0},
	
	initialize: function(){
		if(! (this.model instanceof UimageModel)){
			this.model = new UimageModel({properties: this.model.get('properties')});
		}
		 this.events = _.extend({}, this.events, {
			'click a.upfront-image-select-button': 'openImageSelector',
			'click a.uimage_edit_toggle': 'editRequest'
		 });
		 this.delegateEvents();
		 Upfront.Events.on('entity:pre_resize_stop', this.onElementResize, this);
		 this.model.on('uimage:edit', this.editRequest, this);

		// Set the full size current size if we don't have attachment id
		if(!this.property('imageId'))
			this.property('srcFull', this.property('src'));

		this.model.get("properties").bind("change", this.render, this);
		this.model.get("properties").bind("add", this.render, this);
		this.model.get("properties").bind("remove", this.render, this);
	},

	get_content_markup: function () {
		var props = this.extract_properties(),
			onclick = this.property('when_clicked')
		;
		if(this.property('element_size').width == 0)
			this.setElementSize();

		props.url = onclick == 'do_nothing' ? false : 
			onclick == 'open_link' ? this.property('image_link') : this.property('srcFull');

		if($.isNumeric(props.size.width))
			props.size.width += '%';
		if($.isNumeric(props.size.height))
			props.size.height += '%';

		//Fake wrapper_id only used in php
		props.wrapper_id = 'hello_up';

		var rendered = this.imageTpl(props);
		console.log('Image element');

		if(this.property('image_status') == 'starting'){
			rendered += '<div class="upfront-image-starting-select">' +
		'<div>'+
			'<span class="upfront-image-resizethiselement">Resize this element & Select an Image</span>'+
			'<div class="upfront-image-resizing-icons"><span class="upfront-image-resize-icon"></span><a class="upfront-image-select-button button" href="#"></a></div>'+
		'</div>'+
	'</div>';
		}

		return rendered;
	},

	get_buttons: function() {
		var buttons = '';
		if(this.property('image_status') == 'ok'){
			buttons = '<a href="#" class="upfront-icon-button uimage_edit_toggle"></a>';
		}
		return buttons;
	},

	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		return props;
	},

	onElementResize: function(view, model, ui){
		var resizer = $('.upfront-resize'),
			imageSize = this.property('size'),
			imageOffset = this.property('position')
		;
		if(this.parent_module_view == view)
			this.setElementSize(ui);

		if(resizer.width() > imageSize.width + imageOffset.left){
			if(resizer.width() >= imageSize.width)
				imageOffset.left = 0;
			else
				imageOffset.left =  resizer.width() - imageSize.width;
		}

		if(resizer.height() > imageSize.height + imageOffset.top){
			if(resizer.height() >= imageSize.height)
				imageOffset.top = 0;
			else
				imageOffset.top =  resizer.height() - imageSize.height;
		}
		this.property('position', imageOffset);
	},
	setElementSize: function(ui){
		var me = this,
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			resizer = ui ? $('.upfront-resize') : parent
		;

		me.elementSize = {
			width: resizer.width() - 32,
			height: resizer.height()
		};

		if(this.property('caption_position') == 'below_image')
			this.elementSize.height -= parent.find('.wp-caption').outerHeight();

		me.property('element_size', me.elementSize);
	},
	openImageSelector: function(e){
		var me = this;

		if(e)
			e.preventDefault();

		this.openOverlaySection(this.selectorTpl, {}, function(overlay){
			if(! $('#upfront-upload-image').length){
				$('body').append(me.formTpl({url: Upfront.Settings.ajax_url}));

				$('#upfront-image-file-input').on('change', function(e){
					me.openProgress(function(){
						me.uploadImage();
					});
				});
			}

            $('#upront-image-placeholder')
                .on('dragenter', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                })
                .on('dragleave', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).css('border-color', '#C3DCF1');
                    $(this).css('background', 'none');
                })
                .on('dragover', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).css('border-color', '#1fcd8f');
                    $(this).css('background', 'rgba(255,255,255,.1)');
                    $(this).find()
                })
                .on('drop', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    if(e.originalEvent.dataTransfer){
                    	var files = e.originalEvent.dataTransfer.files,
                    		input = $('#upfront-image-file-input')
                		;
	                    // Only call the handler if 1 or more files was dropped.
	                    if (files.length && input.length){
	                    	input[0].files = files;
	                    }
                    }
                    
                })
            ;
            me.resizeOverlay();
		});
	},

	handleEditorResult: function(result){
		this.property('image_status', 'ok', true);
		this.property('src', result.src, true);
		this.property('srcFull', result.src, true);
		this.property('size', result.imageSize, true);
		this.property('position', result.imageOffset, true);
		this.property('rotation', result.rotation, true);
		this.render();
	},

	initialImageSize: function(overflow) {
		var overlay = $('#upfront-image-overlay'),
			size = {
				width: this.sizes.full[1],
				height: this.sizes.full[2]
			},
			overflow = overflow ? overflow : 0,
			pivot, factor, invertPivot
		;

		pivot = this.elementSize.width / this.elementSize.height > size.width / size.height ? 'width' : 'height';
		invertPivot = this.invert ? (pivot == 'width' ? 'height' : 'width') : pivot;
		factor = size[pivot] / (this.elementSize[invertPivot] + overflow);

		size = {
			width: Math.ceil(size.width / factor),
			height: Math.ceil(size.height / factor)
		};

		return size;
	},

	setResizingLimits: function() {
		var limits = {
			minWidth: 0,
			minHeight:0			
		};
		if(this.mode == 'big'){
			limits = {
				minWidth: this.elementSize.width + this.maskOffset.left - this.bordersWidth / 2,
				minHeight: this.elementSize.height + this.maskOffset.top - this.bordersWidth / 2
			}
		}
		$('#upfront-image-edit').resizable('option', limits);
	},

	editRequest: function () {
		var me = this;
		if(this.property('image_status') == 'ok')
			this.openEditor();
		else
			this.openImageSelector();
	},
	openEditor: function(newImage){
		var me = this,
			options = {
				rotation: this.property('rotation'),
				setImageSize: newImage,
				extraButtons: [{
					id: 'image-edit-button-swap',
					callback: function(e, editor){
						editor.cancel();
						me.openImageSelector();
					}
				}]
			}
		;

		Upfront.Views.Editor.ImageEditor.open(this.$('.uimage-wrapper'), options)
			.done(function(result){
				me.handleEditorResult(result);
			})
			.fail(function(result){
				me.render();
			})
		;
	},

	openProgress: function(callback){
		var me = this;
		this.openOverlaySection(this.progressTpl, {}, function(){
            me.resizeOverlay();
            callback();
		});
	},

	openOverlaySection: function(tpl, tplOptions, callback){
		var me = this,
			settings = $('#settings'),
			overlay = $('#upfront-image-overlay'),
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			bodyOverlay = $('#' + me.property('element_id'))
		;

		if(!this.elementSize.width)
			this.setElementSize();

		if(overlay.length){
			$('.upfront-image-section').fadeOut('fast', function(){
				var content = $(tpl(tplOptions)).hide();
				overlay.append(content);
				content.fadeIn('fast');
				$(this).remove();
				if(callback){
					callback(overlay);
				}
			});
			return;
		}

		this.bodyOverflow = $('html').css('overflow');
		$('html')
			.css({
				overflow: 'hidden',
				width: $(window).width() + 'px',
				height: $(window).height() + 'px'
			})
		;

		//Stop draggable
		if (parent.is(".ui-draggable"))
			parent.draggable('disable');

		overlay = $('<div id="upfront-image-overlay"></div>').append(tpl(tplOptions)).hide();

		$('body')
			.append(overlay)
			.addClass('upfront-image-upload-open')
		;


		this.setOverlayEvents();

		overlay.fadeIn('fast');
		this.resizeOverlay();

		$(window)
			.on('resize', function(e){
				if(e.target == window){
					me.resizeOverlay();
					$('#upfront-image-edit').draggable('option', 'containment', me.getContainment());
				}
			})
		;

		if(settings.is(':visible')){
			settings.fadeOut();
			this.reopenSettings = true;
		}

		if(callback)
			callback(overlay);

		//$('#upfront-image-overlay').fadeIn('fast');
	},

	setOverlayEvents: function() {
		var me = this;
		$('#upfront-image-overlay')
			.on('click', function(e){
				me.cancelOverlay(e);
			})
			.on('click', 'a.select-files', function(e){
				me.openFileBrowser(e);
			})
			.on('click', '#upfront-image-file-input', function(e){
				me.checkFileUpdate(e);
			})
			.on('click', 'a.image-edit-change', function(e){
				me.openImageSelector(e);
			})
			.on('click', 'a.open-media-gallery', function(e){
				me.openMediaGallery(e);
			})
		/*;
		$(window)*/
			.on('keydown', 'a.image-fit-element', function(e){
				me.keyMove(e);
			})
		;
	},

	fitElementSize: function(e) {
		e.preventDefault();
		this.imageSize = this.initialImageSize(0);
		this.centerImage();
		this.selectMode(this.imageSize, true);
		this.positionEditorElements();
		this.iLikeThatPosition();
		this.setResizingLimits();
		$('#upfront-image-edit').draggable('option', 'containment', this.getContainment());		
	},


	cancelOverlay: function(e) {
		if(e.target == e.currentTarget)
			this.closeOverlay(e);
	},
	closeOverlay: function(e){
		var me = this;
		$('#upfront-image-overlay')
			.off('click')
			.fadeOut('fast', function(){
				$(this).remove();
				$('#upfront-image-overlay').remove();
				$('#upfront-upload-image').remove();
				$('#upfront-image-overlay').remove();
			})
		;
			
		$('html').css({
			overflow: this.bodyOverflow ? this.bodyOverflow : 'auto',
			height: 'auto',
			width: 'auto'
		});
		
		$('body').removeClass('upfront-image-upload-open');

		if(this.reopenSettings){
			$('#settings').fadeIn();
			this.reopenSettings = false;
		}

		//Restart draggable
		this.parent_module_view.$('.upfront-editable_entity:first').draggable('enable');

		$(window).off('resize', this.resizeOverlay);
	},
	resizeOverlay: function(){
		var overlay = $('#upfront-image-overlay');
		if(!overlay.length)
			return;
		var placeholder = $('#upront-image-placeholder'),
			uploading = $('#upfront-image-uploading'),
			phcss = {},
			left = $('#sidebar-ui').width(),
			style = {
				left: left,
				width: $(window).width() - left,
				height: $(window).height()
			},
			ptop = (style.height / 2 - 220)
		;

		if(ptop > 0){
			overlay.removeClass('small_placeholder');
			ptop += 'px';
		}
		else {
			overlay.addClass('small_placeholder');
			ptop = (style.height / 2 - 140) + 'px';
		}

		overlay.css(style);
		phcss = {
			height: style.height - 100,
			'padding-top':  ptop,
		};

		placeholder.css(phcss);
		uploading.css(phcss);
	},

	openMediaGallery: function(e) {
		var me = this;
		e.preventDefault();
		Upfront.Media.Manager.open({
			multiple_selection: false,
			media_type:['images']
		}).done(function(popup, result){
			if(result && result.length > 0){
				var image = result.at(0);
				me.imageId = image.get('ID');
				me.getImageData()
					.done(function(){
						me.$('img').attr('src', me.sizes.full[0]).load(function(){		
							me.closeOverlay();
							me.openEditor(true);						
						});
					})
				;

				me.openProgress(function(){
					$('#upfront-image-uploading h2').html('Preparing Image');
				});
			}
		});
	},
	openFileBrowser: function(e){
		e.preventDefault();
	    console.log('clicking');
		$('#upfront-image-file-input').click();
	},
	checkFileUpdate: function(e){
	     console.log('here we are');
	     return true;
	},

	uploadImage: function(e){
		if(e)
			e.preventDefault();

		var me = this,
			progress = $('#upfront-progress')
		;

		$('#upfront-upload-image').ajaxSubmit({
			beforeSend: function() {
				progress.css('width', '0');
			},
			uploadProgress: function(e, position, total, percent) {
				progress.css('width', percent + '%');
				console.log(percent);
			},
			complete: function() {
				$('#upfront-image-uploading h2').html('Preparing Image');
			},
			success: function(response){
				progress.css('width', '100%');
				console.log(response);
				me.imageId = response.data[0];
				me.getImageData()
					.done(function(){		
						me.$('img').attr('src', me.sizes.full[0]).load(function(){		
							me.closeOverlay();
							me.openEditor(true);							
						});
					})
					.error(function(){
						Upfront.Views.Editor.notify("There was an error uploading the file. Please try again.", 'error');
						me.openImageSelector();
					})
				;
			},
			dataType: 'json'
		});
	},

	getImageData: function() {
		var me = this;
		return Upfront.Util.post({
				action: 'upfront-media-image_sizes',
				item_id: JSON.stringify([me.imageId])
			})
			.done(function(response){
				me.sizes = response.data.images[me.imageId];
			})	
		;
	},

	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}	    
}));

var ImageElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 20,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-image');
		this.$el.html('Image');
	},
	add_element: function () {
		var object = new UimageModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-image_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});
var ImageSettings = Upfront.Views.Editor.Settings.Settings.extend({
	initialize: function () {
		this.panels = _([
			new DescriptionPanel({model: this.model}),
			new BehaviorPanel({model: this.model})
		]);
	},
	get_title: function () {
		return "Image settings";
	}
});

var DescriptionPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;

		this.settings = _([
			new SettingsItem({
				title: 'Image info',
				fields: [
					new Fields.Text({
						model: this.model,
						property: 'image_title',
						label: 'Image Title'
					}),
					new Fields.Text({
						model: this.model,
						property: 'alternative_text',
						label: 'Alternative text'						
					}),
					new Fields.Checkboxes({
						model: this.model,
						property: 'include_image_caption',
						values: [
							{
								label: 'Include image caption',
								value: 'true'
							}
						]
					}),
					new Fields.Text({
						model: this.model,
						property: 'image_caption',
						label: 'Image Caption',
						className: 'upfront-field-wrap upfront-field-wrap-text optional-field'					
					})
				]
			})
		]);

		this.$el.on('change', 'input[name=include_image_caption]', function(){
			me.toggleCaption();
		})
		this.on('concealed', this.toggleCaption, this);
	},
	get_label: function () {
		return 'Description';
	},
	get_title: function () {
		return false;
	},
	toggleCaption: function (){
		var include = this.$
		if(this.$('input[name=include_image_caption]').is(':checked')){
			$('#settings').find('.optional-field').show();
		}
		else{
			$('#settings').find('.optional-field').hide();		
		}
		$('#settings').height(this.$('.upfront-settings_panel').outerHeight());	
	}
});

var BehaviorPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var render_all = function(){
				this.settings.invoke('render');
			},
			me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field		
		;
		this.model.on('doit', render_all, this);
		this.settings = _([
			new SettingsItem({
				title: 'When Clicked',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'when_clicked',
						className: 'field-when_clicked upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{
								label: 'Do nothing', 
								value: 'do_nothing'
							},
							{
								label: 'Open link', 
								value: 'open_link'
							},
							{
								label: 'Show larger image', 
								value: 'show_larger_image'
							}
						]
					}),
					new Fields.Text({
						model: this.model,
						property: 'image_link',
						label: 'Image link URL',
						className: 'upfront-field-wrap upfront-field-wrap-text image-link-field'	
					}),

				]
			}),
			new SettingsItem({
				className: 'optional-field',
				title: 'Caption Settings',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'caption_position',
						className: 'field-caption_position upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{
								label: 'below image',
								value: 'below_image'
							},
							{
								label: 'over image',
								value: 'over_image'
							}
						]
					}),
					new Fields.Radios({
						className: 'field-caption_trigger upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
						model: this.model,
						property: 'caption_trigger',
						values: [
							{
								label: 'Always show',
								value: 'always_show'
							},
							{
								label: 'Show on hover',
								value: 'hover_show'
							}
						]
					}),
					new Fields.Radios({
						className: 'field-caption_alignment upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
						model: this.model,
						property: 'caption_alignment',
						values: [
							{
								label: 'Top',
								value: 'top'
							},
							{
								label: 'Bottom',
								value: 'bottom'
							},
							{
								label: 'Fill',
								value: 'fill'
							}
						]
					})
				]
			}),
			new SettingsItem({
				className: 'optional-field',
				title: 'Caption Style',
				fields: [
					new Fields.Color({
						model: this.model,
						property: 'color',
						label: 'Color:'
					}),
					new Fields.Color({
						model: this.model,
						property: 'background',
						label: 'Background:',
						spectrum: {
							showAlpha: true
						}
					})
				]
			})
		]);

		this.$el
			.on('change', 'input[name=when_clicked]', function(e){
				me.toggleLink();
			})
			.on('change', 'input[name=caption_position]', function(e){
				me.toggleCaptionSettings();
			})
		;
		this.on('concealed', this.setFieldEvents, this);
	},
	get_label: function () {
		return 'Behavior';
	},
	get_title: function () {
		return false;
	},
	toggleLink: function(){
		if(this.$('input[name=when_clicked]:checked').val() == 'open_link'){
			this.$('.image-link-field').show();
		}
		else{
			this.$('.image-link-field').hide();
		}
		$('#settings').height(this.$('.upfront-settings_panel').outerHeight() - 2);		
	},
	toggleCaptionSettings: function(){
		if(this.$('input[name=caption_position]:checked').val() == 'over_image')
			this.$('.over_image_field').show();
		else
			this.$('.over_image_field').hide();

		$('#settings').height(this.$('.upfront-settings_panel').outerHeight() - 2);	
	},
	setFieldEvents: function() {
		this.toggleLink();
		this.toggleCaptionSettings();
	}
});

var ImageEditor = Backbone.View.extend({
	id: 'upfront-image-edit',
	rotation: 0,
	mode: 'big', // big | small | vertical | horizontal
	invert: false,
	tpl: _.template($(editorTpl).find('#editor-tpl').html()),
	src: '#',
	bordersWidth: 10,
	response: false,
	fullSize: {width: 0, height:0},
	buttons: [],

	events: {
		'click #image-edit-button-ok': 'imageOk',
		'click #image-edit-button-reset': 'resetImage',
		'click #image-edit-button-fit': 'fitImage',
		'click .image-edit-rotate': 'rotate'
	},

	initialize: function(){
		var me = this;
		this.$el.on('click', function(e){
			if(e.target == e.currentTarget)
				me.cancel();
		})
	},

	resetDefaults: function(){
		this.rotation = 0;
		this.mode = 'big';
		this.invert = false;
		this.src = '#';
		this.response = false;
		this.fullSize = {width: 0, height:0};
		this.setImageInitialSize = false;
		this.buttons = [
			{id: 'image-edit-button-fit'},
			{id: 'image-edit-button-reset'},
			{id: 'image-edit-button-ok'}
		];
	},

	open: function($wrapper, options){
		var img = $wrapper.find('img'),
			halfBorder = this.bordersWidth /2,
			maskOffset = {
				top: $wrapper.offset().top - halfBorder,
				left: $wrapper.offset().left - halfBorder
			},
			canvasOffset = {
				top: $wrapper.offset().top + img.position().top - halfBorder,
				left: $wrapper.offset().left + img.position().left - halfBorder
			},
			canvasSize = {
				width: (this.invert ? img.height() : img.width()) + this.bordersWidth,
				height: (this.invert ? img.width() : img.height()) + this.bordersWidth
			},
			maskSize = {
				width: $wrapper.width() + this.bordersWidth,
				height: $wrapper.height() + this.bordersWidth
			}
		;

		this.resetDefaults();
		this.setOptions(options);

		if(this.setImageInitialSize){
			this.fullSize = this.getImageFullSize(img);
			canvasSize = this.initialImageSize(200);
			canvasSize.width += this.bordersWidth;
			canvasSize.height += this.bordersWidth;
		}

		this.src = img.attr('src');

		this.response = $.Deferred();

		var tplOptions = {
			size: canvasSize,
			offset: canvasOffset,
			maskOffset: maskOffset,
			rotation: 'rotate_' + this.rotation,
			src: this.src,
			maskSize: maskSize,
			buttons: this.buttons
		}

		this.$el.html(this.tpl(tplOptions)).find('div').hide();

		$('body').append(this.$el);

		this.$el.css({
			height: $(document).height(),
			width: $(document).width()
		}).find('div').fadeIn(200);

		this.selectMode(canvasSize);
		this.startEditorUI();
		this.selectMode(canvasSize, true);

		this.setImageSize(canvasSize);

		return this.response.promise();		
	},

	setOptions: function(options) {
		var me = this;
		if(typeof options.rotation != 'undefined')
			this.setRotation(options.rotation);
		else
			this.setRotation(0);

		if(typeof options.id == 'undefined'){
			var img = $('<img href="' + this.src + '">');
			this.fullSize = {
				width: img.width(),
				height: img.height()
			}
		}

		if(options.setImageSize)
			this.setImageInitialSize = true;

		if(options.extraButtons && options.extraButtons.length){
			_.each(options.extraButtons, function(button){
				me.buttons.unshift({id: button.id});
				me.$el.on('click', '#' + button.id, function(e){
					button.callback(e, me);
				});
			});
		}
	},

	imageOk: function() {
		this.response.resolve(this.getEditorResults());
		this.close();
	},

	close: function() {
		var me = this;
		this.$('div').fadeOut(200, function(){
			me.$el.detach();
		})
	},

	cancel: function(reason){
		this.response.reject({reason: reason});
		this.close();
	},

	getEditorResults: function() {
		var canvas = this.$('#uimage-canvas'),
			img = canvas.find('img'),
			mask = this.$('#uimage-mask'),
			offset = this.imgOffset({width: img.width(), height: img.height()})
		;
		/*
		return {
			imageSize: {width: img.width(), height: img.height()},
			imageOffset: {
				top: - mask.offset().top + canvas.offset().top + offset.top,
				left: - mask.offset().left + canvas.offset().left + offset.left
			},
			rotation: this.rotation,
			src: img.attr('src')
		}
		*/
		
		//Percentage
		return {
			imageSize: {width: this.toPercent(img.width(), 'width'), height: this.toPercent(img.height(), 'height')},
			imageOffset: {
				top: this.toPercent( - mask.offset().top + canvas.offset().top + offset.top, 'height'),
				left: this.toPercent( - mask.offset().left + canvas.offset().left + offset.left, 'width')
			},
			rotation: this.rotation,
			src: img.attr('src')
		}

	},

	toPercent: function(px, dimension){
		var mask = this.$('#uimage-mask'),
			maskSize = dimension == 'width' ? mask.width() : mask.height()
		;
		return px / maskSize * 100;
	},

	rotate: function(e){
		var rotation = this.rotation,
			img = this.$('.uimage-img'),
			rotationClass = '',
			size = {width: img.width() + this.bordersWidth, height: img.height() + this.bordersWidth},		
			canvas = this.$('#uimage-canvas'),
			handler = this.$('#uimage-drag-handle')
		;

		if(e){
			e.preventDefault();
			e.stopPropagation();
		}

		rotation = rotation == 270 ? 0 : rotation + 90;

		if(rotation)
			rotationClass = 'rotate_' + rotation;

		img.removeClass()
			.addClass('uimage-img ' + rotationClass);

		this.setRotation(rotation);

		if(this.invert){			
			canvas.css({
				height: size.width,
				width: size.height
			});		
			handler.css({
				height: size.width,
				width: size.height
			});
			img.css({
				height: size.height - this.bordersWidth,
				width: size.width - this.bordersWidth
			});
		}
		else{
			canvas.css(size);		
			handler.css(size);
			img.css({
				height: '100%',
				width: '100%'
			})
		}

		img.css(this.imgOffset({width: img.width(), height: img.height()}));

		$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
		this.setResizingLimits();
	},

	setRotation: function(rotation){
		this.rotation = rotation;
		this.invert = [90,270].indexOf(rotation) != -1;
	},

	imgOffset: function(size) {
		if(! this.invert)
			return {top: 0, left: 0};
		return {
			top: Math.floor((size.width - size.height) / 2),
			left: Math.floor((size.height - size.width) / 2)
		}
	},

	startEditorUI: function() {
		var me = this,
			canvas = this.$('#uimage-canvas')
		;
		$('#uimage-drag-handle')
			.resizable({
				handles: {se: $('.image-edit-resize i')},
				autoHide: 0,
				aspectRatio: true,
				start: function() {
				},
				resize: function(e, ui){
					canvas.css(ui.size);
					me.setImageSize(ui.size);
				},
				stop: function(e, ui){
					e.preventDefault();
					canvas.css(ui.size);
					me.selectMode(ui.size, true);
					me.setImageSize(ui.size);
					$('#uimage-drag-handle').draggable('option', 'containment', me.getContainment());
				}
			})
			.draggable({
				opacity:1,
				start: function(e, ui){
				},
				drag: function(e, ui){
					canvas.css({
						top: ui.position.top,
						left: ui.position.left
					});
				},
				stop: function(e, ui){
					canvas.css({
						top: ui.position.top,
						left: ui.position.left
					});
					me.setResizingLimits();
				},
				containment: me.getContainment()
			})
		;
		me.setResizingLimits();

	},
	selectMode: function(size, constraints) {
		var mode = 'small',
			invertSize = this.invert ? {width: size.height, height: size.width} : size,
			mask = this.$('#uimage-mask'),
			maskSize = {
				width: mask.width(),
				height: mask.height()
			}
		;

		if(invertSize.width >= maskSize.width){
			if(invertSize.height >= maskSize.height)
				mode = 'big';
			else
				mode = 'horizontal';
		}
		else if(invertSize.height > maskSize.height)
				mode = 'vertical';

		this.setMode(mode, constraints);
		console.log(this.mode);
	},

	setMode: function(mode, constraints){
		var editor = $('#uimage-drag-handle');
		this.$el
			.removeClass('uimage-mode-big uimage-mode-small uimage-mode-vertical uimage-mode-horizontal')
			.addClass('uimage-mode-' + mode)
		;
		if(false){//constraints){
			if(mode == 'small'){
				editor.resizable('disable');
				editor.draggable('disable');
			}
			else {
				editor.resizable('enable');
				editor.draggable('enable');
			}
		}
		this.mode = mode;
	},

	setImageSize: function(size){
		if(this.invert){
			var invertSize = {
				width: size.height - this.bordersWidth,
				height: size.width - this.bordersWidth
			};

			this.$('.uimage-img')
				.css(invertSize)
				.css(this.imgOffset(invertSize))
			;
		}
	},

	getContainment: function(){
		var canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			initPoint = mask.offset()
		;

		if(this.mode == 'big')
			return [
				initPoint.left - canvas.width() + mask.width(),
				initPoint.top - canvas.height() + mask.height(),
				initPoint.left,
				initPoint.top
			];
		if(this.mode == 'vertical')
			return [
				initPoint.left,
				initPoint.top - canvas.height() + mask.height(),
				initPoint.left + mask.width() - canvas.width(),
				initPoint.top
			];

		if(this.mode == 'horizontal')
			return [
				initPoint.left - canvas.width() + mask.width(),
				initPoint.top,
				initPoint.left,
				initPoint.top - canvas.height() + mask.height()
			];

		return [
			initPoint.left,
			initPoint.top,
			initPoint.left + mask.width() - canvas.width(),
			initPoint.top - canvas.height() + mask.height()
		];
	},

	setResizingLimits: function() {
		var canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			initPoint = mask.offset(),
			limits = {
				minWidth: 0,
				minHeight: 0			
			}
		;
		if(this.mode == 'big'){
			limits = {
				minWidth: mask.width() + initPoint.left - canvas.offset().left + this.bordersWidth,
				minHeight: mask.height() + initPoint.top - canvas.offset().top + this.bordersWidth
			}
		}

		$('#uimage-drag-handle').resizable('option', limits);
	},

	resetImage: function(e){
		e.preventDefault();
		e.stopPropagation();
		this.setRotation(270);
		this.rotate(); //Set rotation to 0
		this.setImageFullSize(e, alert);
	},

	fitImage: function(e){
		e.preventDefault();
		e.stopPropagation();
		var size = this.initialImageSize(0, true),
			canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			handler = this.$('#uimage-drag-handle')
		;

		if(this.invert){
			size = {
				width: size.height  + this.bordersWidth,
				height: size.width + this.bordersWidth
			}
		}
		else {
			size.height += this.bordersWidth;
			size.width += this.bordersWidth;			
		}

		canvas.css(size);
		handler.css(size);

		this.setImageSize(size);
		this.centerImage();

		this.selectMode(size, true);
	
		this.setResizingLimits();
		$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
	},

	getImageFullSize: function($img){
		var img = $img ? $img : this.$('.uimage-img'),
			initialSize = this.invert ? {width: img.css('width'), height: img.css('height')} : {width: '100%', height: '100%'},
			full
		;

		if(!img || !img.length)
			return this.fullSize;

		img.css({height: 'auto', width: 'auto'});
		full = {height: img.height(), width: img.width()};

		img.css(initialSize);
		return full.width ? full : this.fullSize;
	},

	setImageFullSize: function(e, alert) {
		if(e)
			e.preventDefault();

		var img = this.$('.uimage-img'),
			mask = this.$('#uimage-mask'),
			canvas = this.$('#uimage-canvas'),
			handle = this.$('#uimage-drag-handle'),
			size = false
		;

		this.fullSize = this.getImageFullSize();

		if(this.fullSize.width < mask.width() + 200 && this.fullSize.height < mask.height() + 200){
			size = {
				height: this.fullSize.height + this.bordersWidth,
				width: this.fullSize.width + this.bordersWidth
			}
		}
		else{
			if(alert)
				Upfront.Views.Editor.notify('The image is too big to show it full size.', 'warning');

			size = this.initialImageSize(200);
			size = {
				height: size.height + this.bordersWidth,
				width: size.width + this.bordersWidth
			}

			this.centerImage();
		}

		canvas.css(size);
		handle.css(size);

		img.css({
			height: '100%',
			width: '100%'
		});

		this.selectMode(size, true);

		this.setResizingLimits();
		$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
	},

	centerImage: function() {
		var canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			handle = this.$('#uimage-drag-handle')
			position = {
				top: mask.offset().top - ((canvas.height() - mask.height()) / 2),
				left: mask.offset().left - ((canvas.width() -  mask.width()) / 2)
			}
		;
		canvas.css(position);
		handle.css(position);
	},

	initialImageSize: function(overflow, stretch) {
		var canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			size = {
				width: 0,
				height: 0
			},
			maskSize = {
				width: mask.width(),
				height: mask.height()
			},
			overflow = overflow ? overflow : 0,
			pivot, factor, invertPivot,
			stretchImage = !!stretch
		;
		
		this.fullSize = this.getImageFullSize();

		pivot = maskSize.width / maskSize.height < this.fullSize.width / this.fullSize.height ? 'width' : 'height';
		invertPivot = this.invert ? (pivot == 'width' ? 'height' : 'width') : pivot;

		factor = this.fullSize[pivot] / (maskSize[invertPivot] + overflow);

		if(!stretchImage && factor < 1)
			size = this.fullSize;
		else
			size = {
				width: Math.ceil(this.fullSize.width / factor),
				height: Math.ceil(this.fullSize.height / factor)
			};

		return size;
	},

	keyMove: function(e) {
		switch(e.which){
			case 40: //down
				this.maskOffset.top--;
				this.positionEditorElements();
				break;
			case 39: //right
				this.maskOffset.left--;
				this.positionEditorElements();
				break;
			case 37: //left
				this.maskOffset.left++;
				this.positionEditorElements();
				break;
			case 38: //up
				this.maskOffset.top++;
				this.positionEditorElements();
		}
	},
});

Upfront.Application.LayoutEditor.add_object("Uimage", {
	"Model": UimageModel, 
	"View": UimageView,
	"Element": ImageElement,
	"Settings": ImageSettings
});

Upfront.Views.Editor.ImageEditor = new ImageEditor();
Upfront.Models.UimageModel = UimageModel;
Upfront.Views.UimageView = UimageView;

}); //End require

})(jQuery);