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
	imageInfo : false,

	
	initialize: function(){
		var me = this;
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

		$('body').on('dragover', function(e){
				e.preventDefault();
			 	me.handleDragEnter(e);
			})
			.on('dragenter', function(e){
			 	me.handleDragEnter(e);
		 		console.log('enter '  + me.property('element_id'));
			})
		 	.on('dragleave', function(e){
		 		me.handleDragLeave(e);
		 	})
		 	.on('drop', function(e){
		 		console.log('drop body');
		 	})
	 	;

		// Set the full size current size if we don't have attachment id
		if(!this.property('image_id'))
			this.property('srcFull', this.property('src'));

		this.model.get("properties").bind("change", this.render, this);
		this.model.get("properties").bind("add", this.render, this);
		this.model.get("properties").bind("remove", this.render, this);
	},

	setImageInfo: function() {
		var maskSize, maskOffset,
			starting = this.$('.upfront-image-starting-select'),
			size = this.property('size'),
			position = this.property('position'),
			elementSize = this.property('element_size'),
			stretch = this.property('stretch'),
			img = this.$('img')
		;

		if(starting.length){
			maskSize = {
				width: starting.outerWidth(),
				height: starting.outerHeight()
			};
			maskOffset = starting.offset();
			position = false;
		}
		else {
			starting = this.$('.upfront-image')
			maskSize = {
				width: starting.width(),
				height: starting.height()
			};
			maskOffset = {
				top: starting.offset().top,
				left: starting.offset().left + 15,
			};
		}

		var ratio = elementSize.width / img.width();
		elementSize = {
			width: Math.round(elementSize.width * ratio),
			height: Math.round(elementSize.height * ratio)
		};
		size = {
			width: Math.round(size.width * ratio),
			height: Math.round(size.height * ratio)
		};
		if(position){
			position = {
				left: Math.round(position.left * ratio) - img.offset().left + maskOffset.left,
				top: Math.round(position.top * ratio) - img.offset().top + maskOffset.top
			}
		}

		//Fix for responsive images
		var img = this.$('img');
		if(stretch && img.length && img.width() != elementSize.width){
			var ratio = elementSize.width / img.width();
			size = {
				width: Math.round(size.width / ratio),
				height: Math.round(size.height / ratio)
			};
			position = {
				top: Math.round(position.top / ratio),
				left: Math.round(position.left / ratio)
			};
		}

		this.imageInfo = {
			id: this.property('image_id'),
			src: this.property('src'),
			srcFull: this.property('srcFull'),
			srcOriginal: this.property('srcOriginal'),
			size: size,
			position: position,
			rotation: this.property('rotation'),
			fullSize: this.property('fullSize'),
			align: this.property('align'),
			maskSize: maskSize,
			maskOffset: maskOffset
		}
	},

	get_content_markup: function () {
		var props = this.extract_properties(),
			onclick = this.property('when_clicked')
		;
		if(this.property('element_size').width == 0)
			this.setElementSize();

		props.url = onclick == 'do_nothing' ? false : 
			onclick == 'open_link' ? this.property('image_link') : this.property('srcFull');
			/*
		if($.isNumeric(props.size.width))
			props.size.width += '%';
		if($.isNumeric(props.size.height))
			props.size.height += '%';
*/
		//Fake wrapper_id only used in php
		props.wrapper_id = 'hello_up';
		if(props.stretch)
			props.imgWidth = '100%';
		else
			props.imgWidth = props.element_size.width + 'px';

		var rendered = this.imageTpl(props);
		console.log('Image element');

		if(this.property('image_status') == 'starting'){
			rendered += '<div class="upfront-image-starting-select" style="min-height:' + this.elementSize.height + 'px">' +
					'<span class="upfront-image-resizethiselement">Resize this element & Select an Image</span>'+
					'<div class="upfront-image-resizing-icons"><span class="upfront-image-resize-icon"></span><a class="upfront-image-select-button button" href="#"></a></div>'+
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

	handleDragEnter: function(e){
		var me = this;
		if(!this.$('.uimage-drop-hint').length){
			var dropOverlay = $('<div class="uimage-drop-hint">Drop the image here<form </div>')
				.on('drop', function(e){
					e.preventDefault();
					e.stopPropagation();
					me.openImageSelector();
					$('.uimage-drop-hint').remove();
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
				.on('dragenter', function(e){
					e.preventDefault();
					e.stopPropagation();
					$(this).addClass('uimage-dragenter');
				})
				.on('dragleave', function(e){
					e.preventDefault();
					e.stopPropagation();
					$(this).removeClass('uimage-dragenter');					
				})
			;
			this.$('.upfront-image').append(dropOverlay);
		}
		if(this.dragTimer){
			clearTimeout(this.dragTimer);
			this.dragTimer = false;
		}
	},

	handleDragLeave: function(e){
		var me = this;
		this.dragTimer = setTimeout(function(){
				me.$('.uimage-drop-hint').remove();
				this.dragTimer = false;
			}, 200);
		;
	},

	onElementResize: function(view, model, ui){
		if(this.parent_module_view != view)
			return;

		var resizer = $('.upfront-resize'),
			img = this.$('img'),
			elementSize = this.property('element_size'),
			imgSize = this.property('size'),
			position = this.property('position'),
			heightLimit = resizer.height() - 30,
			ratio = 1
		;
		/*
		if(this.parent_module_view == view)
			this.setElementSize(ui);
*/

		if(heightLimit < img.height())
			ratio = heightLimit / elementSize.height;
		else if(img.width() != elementSize.width)
			ratio = img.width() / elementSize.width;

		if(ratio != 1){
			elementSize = {
				width: Math.round(elementSize.width * ratio),
				height: heightLimit
			};
			imgSize = {
				width: Math.round(imgSize.width * ratio),
				height: Math.round(imgSize.height * ratio)
			};
			position = {
				left: Math.round(position.left * ratio),
				top: Math.round(position.top * ratio)
			};
			this.property('element_size', elementSize, true);
			this.property('size', imgSize, true);
			this.property('position', position, true);
			this.property('stretch', false, true);
		}

		this.elementSize = {height: resizer.height() - 30};
	},
	setElementSize: function(ui){
		var me = this,
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			resizer = ui ? $('.upfront-resize') : parent
		;

		me.elementSize = {
			width: resizer.width() - 32,
			height: resizer.height() - 30 
		};

		if(this.property('caption_position') == 'below_image')
			this.elementSize.height -= parent.find('.wp-caption').outerHeight();

		if(this.property('image_status') == 'starting'){
			this.$('.upfront-object-content').height(me.elementSize.height);
		}

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
		this.property('srcFull', result.srcFull, true);
		this.property('srcOriginal', result.srcOriginal, true);
		this.property('size', result.imageSize, true);
		this.property('position', result.imageOffset, true);
		this.property('rotation', result.rotation, true);
		this.property('fullSize', result.fullSize, true);
		this.property('element_size', result.cropSize, true);
		this.property('align', result.align, true);
		this.property('stretch', result.stretch, true);
		if(result.imageId)
			this.property('image_id', result.imageId, true);
		this.render();
	},

	editRequest: function () {
		var me = this;
		if(this.property('image_status') == 'ok' && this.property('image_id'))
			return this.openEditor();
		
		Upfront.Views.Editor.notify('Image editing it is only suitable for images uploaded to WordPress', 'error');
	},

	openEditor: function(newImage, imageInfo){
		var me = this,
			options = {
				setImageSize: newImage,
				extraButtons: [
					{
						id: 'image-edit-button-swap',
						text: 'Swap Image',
						callback: function(e, editor){
							editor.cancel();
							me.openImageSelector();
						}
					}
				]
			}
		;

		this.setImageInfo();

		if(imageInfo)
			_.extend(options, this.imageInfo, imageInfo);
		else
			_.extend(options, this.imageInfo);

		Upfront.Views.Editor.ImageEditor.open(options)
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
				Upfront.Views.Editor.ImageEditor.getImageData(me.imageId)
					.done(function(response){
						var sizes = response.data.images[me.imageId],
							imageInfo = {
								src: sizes.medium ? sizes.medium[0] : sizes.full[0],
								srcFull: sizes.full[0],
								srcOriginal: sizes.full[0],
								fullSize: {width: sizes.full[1], height: sizes.full[2]},
								size: sizes.medium ? {width: sizes.medium[1], height: sizes.medium[2]} : {width: sizes.full[1], height: sizes.full[2]},
								position: false,
								rotation: 0,
								id: me.imageId
							}
						;
						$('<img>').attr('src', imageInfo.srcFull).load(function(){
							me.closeOverlay();
							me.openEditor(true, imageInfo);					
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
				Upfront.Views.Editor.ImageEditor.getImageData(me.imageId)
					.done(function(response){
						var sizes = response.data.images[me.imageId],
							imageInfo = {
								src: sizes.medium ? sizes.medium[0] : sizes.full[0],
								srcFull: sizes.full[0],
								srcOriginal: sizes.full[0],
								fullSize: {width: sizes.full[1], height: sizes.full[2]},
								size: sizes.medium ? {width: sizes.medium[1], height: sizes.medium[2]} : {width: sizes.full[1], height: sizes.full[2]},
								position: false,
								rotation: 0,
								id: me.imageId
							}
						;
						$('<img src="' + imageInfo.srcFull + '">').load(function(){		
							me.closeOverlay();
							me.openEditor(true, imageInfo);						
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
				className: 'optional-field align-center',
				title: 'Caption Settings',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'caption_position',
						layout: "vertical",
						className: 'field-caption_position upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{
								label: 'below image',
								value: 'below_image',
								icon: 'image-caption-below'
							},
							{
								label: 'over image',
								value: 'over_image',
								icon: 'image-caption-over-bottom'
							}
						]
					}),
					new Fields.Radios({
						className: 'field-caption_alignment upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
						model: this.model,
						property: 'caption_alignment',
						layout: "vertical",
						values: [
							{
								label: 'Top',
								value: 'top',
								icon: 'image-caption-over-top'
							},
							{
								label: 'Bottom',
								value: 'bottom',
								icon: 'image-caption-over-bottom'
							},
							{
								label: 'Fill',
								value: 'fill',
								icon: 'image-caption-over-fill'
							}
						]
					}),
					new Fields.Radios({
						className: 'field-caption_trigger upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
						model: this.model,
						property: 'caption_trigger',
						layout: "vertical",
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

/**
 * The image editor needs the image to be uploaded as an attachment to WP in order to work.
 * The open method must receive the following options in an array:
 * {
 * 		id: The image attachment id. It is mandatory for the edition in the server side.
 * 		maskOffset: and array with the offset of the mask element relative to the top left of the page
 * 	 	maskSize: an array with the size of the mask
 * 	 	position: (optional:[{top:0, left:0}]) if the image is cropped is the offset of the crop relative to the original size of the image
 * 	 	size: the size of the image as shown in the page
 * 	 	fullSize: the size of the image if it wasn't cropped
 * 	 	originalSrc: the source url of the original image (the best to edit)
 * 	 	src: the source url of the image in the page
 * 	 	rotation: (optional:[0]) The angle of rotation of the image on the page relative to the original
 * 	 	align: (optional:['left']) alignment of the image (used if the image is smaller than the mask)
 * 	 	setImageSize: (optional:[false]) Boolean to tell the editor to calculates an initial size for the image. Default false.
 * 	 	buttons: (optional:[[]]) An array with extra buttons for the editor. Every button is an object with 
 * 	 		'id': HTML id for the button
 * 	 		'text': Tooltip text for the button
 * 	 		'callback': A function to be called when clicked.
 * }
 * @return Promise When edition is successful an response object is return as parameter for the promise with the following attributes:
 * {
 * 		imageId: The attachment id
 * 		imageSize: The result image size without cropping
 * 		imageOffset: The offset of the crop relative to the top-left of the image.
 * 		maskSize: The size of the mask
 * 		cropSize: The size of the crop
 * 		src: The source url of the crop
 * 		srcFull: The source url of the full version. It may be a rotated version of the original.
 * 		rotation: Angle of rotation relative to the original image
 * 		fullSize: the size of the original image
 * 		align: alignment for the image
 * 		stretch: Whether the image is wider than the mask. If the image is narrower should be aligned instead of stretched when resizing.
 * }
 */
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
	sizes: false,

	events: {
		'click #image-edit-button-ok': 'imageOk',
		'click #image-edit-button-reset': 'resetImage',
		'click #image-edit-button-fit': 'fitImage',
		'click #image-edit-button-align': 'selectAlign',
		'click .image-edit-rotate': 'rotate',
		'mouseover a.image-edit-button': 'showTooltip',
		'mouseout a.image-edit-button': 'hideTooltip'
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
			{id: 'image-edit-button-ok', text: 'Done'},
			{id: 'image-edit-button-reset', text: 'Reset Image'},
			{id: 'image-edit-button-fit', text: 'Fit to Element'}
		];
		this.sizes = false;
		this.promise = false;
		this.align = 'left';
	},

	centerImageOffset: function(imageSize, maskSize){
		return {
			top: (imageSize.height - maskSize.height) / 2,
			left: (imageSize.width - maskSize.width) / 2
		}
	},

	open: function(options){
		this.resetDefaults();
		this.src = options.src;
		this.setOptions(options);

		var halfBorder = this.bordersWidth /2;


		maskOffset = {
			top: options.maskOffset.top - halfBorder,
			left: options.maskOffset.left - halfBorder
		};
		maskSize = {
			width: options.maskSize.width + this.bordersWidth,
			height: options.maskSize.height + this.bordersWidth			
		};

		if(!options.position)
			options.position = this.centerImageOffset(options.size, maskSize);

		canvasOffset = {
			top: maskOffset.top - options.position.top,
			left: maskOffset.left - options.position.left
		};
		canvasSize = {
			width: options.size.width + this.bordersWidth,
			height: options.size.height + this.bordersWidth
		};
		this.imageId = options.id;
		this.src = options.srcOriginal;

		this.fullSize = options.fullSize;
		if(options.align)
			this.align = options.align;


		if(this.setImageInitialSize){
			canvasSize = this.initialImageSize(200, false, maskSize);
			canvasSize.width += this.bordersWidth;
			canvasSize.height += this.bordersWidth;
		}
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

		//this.setAlign(this.align);
		var alignButton = this.$('#image-edit-button-align').addClass('align-' + this.align);

		if(this.setImageInitialSize){
			this.resetImage(false, false);
		}

		return this.response.promise();		
	},

	setOptions: function(options) {
		var me = this;
		if(typeof options.rotation != 'undefined')
			this.setRotation(options.rotation);
		else
			this.setRotation(0);

		if(options.setImageSize)
			this.setImageInitialSize = true;

		if(options.extraButtons && options.extraButtons.length){
			_.each(options.extraButtons, function(button){
				me.buttons.push({id: button.id, text: button.text});
				me.$el
					.off('click', '#' + button.id)
					.on('click', '#' + button.id, function(e){
						button.callback(e, me);
					})
				;
			});
		}
	},

	imageOk: function() {
		var results = this.getEditorResults(),
			me = this
		;
		if(results.imageId){
			this.saveImageEdition(
				results.imageId, 
				results.rotation, 
				results.imageSize, 
				{
					top: results.imageOffset.top,
					left: results.imageOffset.left,
					width: results.maskSize.width,
					height: results.maskSize.height
				}
			)
			.done(function(result){
				var imageData = result.data.images[results.imageId];

				if(imageData.error){
					console.error(imageData.msg);
					return;
				}

				results.src = imageData.url,
				results.srcFull = imageData.urlOriginal,
				results.cropSize = imageData.crop,
				me.response.resolve(results);
				me.close();
			})
			.error(function(result){
				console.log(result);
			})
		}
	},

	close: function() {
		var me = this;
		this.$('div').fadeOut(200, function(){
			me.$el.detach();
		});
		me.response.reject();
	},

	cancel: function(reason){
		this.response.reject({reason: reason});
		this.close();
	},

	getEditorResults: function() {
		var canvas = this.$('#uimage-canvas'),
			img = canvas.find('img'),
			mask = this.$('#uimage-mask'),
			src = img.attr('src')
		;

		return {
			imageSize: {width: Math.round(this.invert ? img.height() : img.width()), height: Math.round(this.invert ? img.width() : img.height())},
			imageOffset: {
				top: mask.offset().top - canvas.offset().top,
				left: mask.offset().left - canvas.offset().left
			},
			maskSize: {
				width: mask.width(),
				height: mask.height()
			},
			rotation: this.rotation,
			imageId: this.imageId,
			fullSize: this.fullSize,
			srcOriginal: src,
			align: this.align,
			stretch : this.mode == 'big' || this.mode == 'horizontal'
		}
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
			//$('#uimage-drag-handle').resizable('option', 'aspectRatio', size.height / size.width);
		}
		else{
			canvas.css(size);		
			handler.css(size);
			img.css({
				height: '100%',
				width: '100%'
			});
			//$('#uimage-drag-handle').resizable('option', 'aspectRatio', size.width / size.height);
		}

		img.css(this.imgOffset({width: img.width(), height: img.height()}));

		this.selectMode({width: canvas.width(), height: canvas.height()});

		this.centerImage(true);

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
				aspectRatio: true, //(me.fullSize.width + me.bordersWidth) / (me.fullSize.height + me.bordersWidth),
				start: function() {
				},
				resize: function(e, ui){
					canvas.css(ui.size);
					me.setImageSize(ui.size);
				},
				stop: function(e, ui){
					e.preventDefault();
					//Recalculate dimensions from the original size
					var imageSize = {
							width: (me.invert ? ui.size.height : ui.size.width) - me.bordersWidth,
							height: (me.invert ? ui.size.width : ui.size.height) - me.bordersWidth
						},
						factor = me.fullSize.width / Math.floor(imageSize.width),
						canvasSize
					;

					imageSize = {
						width: Math.floor(imageSize.width),
						height: Math.round(me.fullSize.height / factor)
					}

					canvasSize = {
						width: (me.invert ? imageSize.height : imageSize.width) + me.bordersWidth,
						height: (me.invert ? imageSize.width : imageSize.height) + me.bordersWidth
					}

					canvas.css(canvasSize);
					me.selectMode(canvasSize, true);
					me.setImageSize(canvasSize);
					if(me.mode == 'small' || me.mode == 'vertical')
						me.centerImage(false);

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
			mask = this.$('#uimage-mask'),
			maskSize = {
				width: mask.width(),
				height: mask.height()
			}
		;

		if(size.width >= maskSize.width){
			if(size.height >= maskSize.height)
				mode = 'big';
			else
				mode = 'horizontal';
		}
		else if(size.height > maskSize.height)
				mode = 'vertical';

		this.setMode(mode, constraints);
		console.log(this.mode);
	},

	setMode: function(mode, constraints){
		var editor = $('#uimage-drag-handle'),
			centerImage = (mode == 'small' || mode == 'vertical') && mode != this.mode
		;
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

		if(centerImage){
			this.centerImage(false);
		}
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
		if(this.mode == 'horizontal')
			return [
				initPoint.left - canvas.width() + mask.width(),
				initPoint.top,
				initPoint.left,
				initPoint.top
			];

		var left = this.align == 'left' ? initPoint.left : (this.align == 'right' ? initPoint.left + mask.width() - canvas.width() : initPoint.left + (mask.width() - canvas.width()) / 2);

		if(this.mode == 'vertical')
			return [
				left,
				initPoint.top - canvas.height() + mask.height(),
				left,
				initPoint.top
			];

		return [
			left,
			canvas.offset().top,
			left,
			canvas.offset().top
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

	resetImage: function(e, alert){
		if(e){
			e.preventDefault();
			e.stopPropagation();
		}
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
		this.centerImage(true);

		this.selectMode(size, true);
	
		this.setResizingLimits();
		$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
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

		//this.fullSize = this.getImageFullSize();

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
		}

		canvas.css(size);
		handle.css(size);

		img.css({
			height: '100%',
			width: '100%'
		});

		this.centerImage(true);

		this.selectMode(size, true);

		this.setResizingLimits();
		$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
	},

	centerImage: function(vertical) {
		var canvas = this.$('#uimage-canvas'),
			mask = this.$('#uimage-mask'),
			handle = this.$('#uimage-drag-handle'),
			position = {
				top: vertical ? canvas.height() < mask.height() ? mask.offset().top : mask.offset().top - ((canvas.height() - mask.height()) / 2) : canvas.offset().top,
			}
		;

		if((this.mode != 'vertical' && this.mode != 'small') || this.align == 'center')
			position.left = mask.offset().left - ((canvas.width() -  mask.width()) / 2);
		else if(this.align == 'left')
			position.left = mask.offset().left;
		else
			position.left = mask.offset().left + mask.width() - canvas.width();

		canvas.css(position);
		handle.css(position);
	},

	initialImageSize: function(overflow, stretch, maskDimensions) {
		var mask = this.$('#uimage-mask'),
			size = {
				width: 0,
				height: 0
			},
			maskSize = maskDimensions ? maskDimensions : {
				width: mask.width(),
				height: mask.height()
			},
			overflow = overflow ? overflow : 0,
			pivot, factor, invertPivot,
			stretchImage = !!stretch
		;
		
		//this.fullSize = this.getImageFullSize();

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

	getImageData: function(imageId) {
		var me = this;
		return Upfront.Util.post({
				action: 'upfront-media-image_sizes',
				item_id: JSON.stringify([imageId])
			})
		;
	},

	saveImageEdition: function(imageId, rotate, resize, crop){
		var me = this,
			opts = {
				action: 'upfront-media-image-create-size',
				images: [{
					id: imageId,
					rotate: rotate,
					resize: resize,
					crop: crop
				}]
			}
		;

		return Upfront.Util.post(opts);
	},
	/*
	selectBestImage: function(){
		var img = this.$('img.uimage-img'),
			proportions = Math.round(100 * img.width() / img.height()) / 100,
			selected = 'full',
			selectedWidth = this.sizes.full[1]
		;

		_.each(this.sizes, function(size, key){
			if(key != 'full' && Math.round(size[1] / size[2] * 100) / 100 == proportions){
				if(size[1] < selectedWidth && size[1] >= img.width()){
					selected = key;
					selectedWidth = size[1];
				}
			}
		});

		return this.sizes[selected][0];
	},
	*/
	selectAlign: function(){
		if(this.align == 'left')
			this.setAlign('center');

		else if(this.align == 'center')
			this.setAlign('right');

		else if(this.align == 'right')
			this.setAlign('left');
	},

	setAlign: function(direction){
		var mask = this.$('#uimage-mask'),
			canvas = this.$('#uimage-canvas'),
			handle = this.$('#uimage-drag-handle'),
			position = canvas.position()
		;

		this.$('#image-edit-button-align').removeClass('align-left align-right align-center').addClass('align-' + direction);
		
		if(direction != 'left' && direction != 'center' && direction != 'right')
			return false;
		this.align = direction;

		if(this.align == 'center')
			position.left = mask.offset().left - ((canvas.width() -  mask.width()) / 2);
		else if(this.align == 'left')
			position.left = mask.offset().left;
		else
			position.left = mask.offset().left + mask.width() - canvas.width();

		canvas.css(position);
		handle.css(position);

		this.$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
	},

	showTooltip: function(e){
		var button = $(e.target);
		this.$('#uimage-tooltip')
			.text(button.attr('data-tooltip'))
			.css({
				top: button.offset().top - 40,
				left: button.offset().left - 33
			})
			.show()
		;
	},

	hideTooltip: function(e) {
		this.$('#uimage-tooltip').hide();
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