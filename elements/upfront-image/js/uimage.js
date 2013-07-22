(function ($) {

var utemplate = function(markup){
	var oldSettings = _.templateSettings,
		tpl = false;

	_.templateSettings = {
	    interpolate : /<\?php echo (.+?) \?>/g,
	    evaluate: /<\?php (.+?) \?>/g		
	};

	tpl = _.template(markup);

	_.templateSettings = oldSettings;

	return function(data){
		_.each(data, function(value, key){
			data['$' + key] = value;
		})

		return tpl(data);
	}
};

var	tplPath = 'text!../elements/upfront-image/tpl/';

var	templates = [
		tplPath + 'image.html', 
		tplPath + 'image_editor.html'
	]
;
require(templates, function(imageTpl, editorTpl) {
var UimageModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_properties({
			type: 'UimageModel',
			view_class: 'UimageView',
			element_id: Upfront.Util.get_unique_id("image-object"),
			has_settings: 1,
			'class':  'c34 upfront-image',

			src: 'http://imgsrc.hubblesite.org/hu/db/images/hs-2010-22-a-web.jpg',
			srcFull: 'http://imgsrc.hubblesite.org/hu/db/images/hs-2010-22-a-web.jpg',
			image_title: '',
			alternative_text: '',
			when_clicked: 'do_nothing',
			image_link: false,
			include_image_caption: false,
			image_caption: '',
			caption_position: 'below_image',
			caption_alignment: 'top',
			caption_trigger: 'always_show',
			image_status: 'starting',
			size: {width: 1000, height: 1000},
			position: {top: 0, left: 0},
			element_size: {width: 250, height: 250},
			rotation: 0,
			color: '#ffffff',
			background: '#000000',
			background_transparency: 0
		});
	}
});

var UimageView = Upfront.Views.ObjectView.extend(_.extend({}, /*Upfront.Mixins.FixedObjectInAnonymousModule,*/ {
	model: UimageModel,
	imageTpl: utemplate(imageTpl),
	selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
	progressTpl: _.template($(editorTpl).find('#progress-tpl').html()),
	editorTpl: _.template($(editorTpl).find('#editor-tpl2').html()),
	formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
	sizes: {},
	elementSize: {width: 0, height: 0},
	image: 'http://dorsvenabili.com/wp-content/uploads/wordpress_helpsheet.jpg',
	imageId: 0,
	imageSize: {width: 0, height: 0},
	imageOffset: {top: 0, left: 0},
	maskOffset: {top: 0, left: 0},
	rotation: 0,
	invert: false,
	bordersWidth: 10,
	onScrollFunction: false,
	justUploaded: false,
	
	initialize: function(){
		 this.events = _.extend({}, this.events, {
			'click a.upfront-image-select-button': 'openImageSelector',
		 });
		 this.delegateEvents();
		 Upfront.Events.on('entity:pre_resize_stop', this.onElementResize, this);
		 //this.on('upfront:entity:resize', this.setElementSize, this);
		 this.model.on('uimage:edit', this.editRequest, this);

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

		props.background = this.hexToRGBA(props.background);

		var rendered = this.imageTpl(props);
		console.log('Image element');

		this.addImageEditingButton();

		return rendered;
	},
	addImageEditingButton: function(){
		var me = this;
		if(this.property('image_status') != 'ok' || this.$('a.uimage-edit_trigger').length)
			return;
		this.parent_module_view.$('b.upfront-entity_meta').after('<b class="upfront-entity_meta uimage-edit-entity_meta"><a href="#" class="uimage-edit_trigger"><i class="icon-crop"></i></a></b>')
		this.parent_module_view.$el.on('click', 'a.uimage-edit_trigger', function(){
			me.editRequest();
		});
	},
	hexToRGBA: function (hex){
		if(this.property('background_transparency') == 0)
			return hex;
		var opacity = (100 - this.property('background_transparency')) / 100,
			r = parseInt(hex.substring(1,3),16),
			g = parseInt(hex.substring(3,5),16),
			b = parseInt(hex.substring(5,7),16)
		;
		return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
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
			width: resizer.width() - 30,
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
	openEditor: function(e){
		var me = this,
			src = false,
			size = this.imageSize
		;

		if(e)
			e.preventDefault();

		if(this.justUploaded){
			src = this.sizes.full[0];
			this.imageSize = this.initialImageSize();
			this.initialMaskOffset();
			this.justUploaded = false;
		}
		else
			src = this.property('srcFull');

		var tplOptions = {
			size: size,
			offset: this.imageOffset,
			rotation: 'rotate_' + this.rotation,
			src: src
		}

		this.openOverlaySection(this.editorTpl, tplOptions, function(overlay){
			me.resizeOverlay();
			me.positionEditorElements();
			me.setContainerPosition();
			me.startEditorUI();
			me.iLikeThatPosition();
		});
	},

	positionEditorElements: function() {
		var container = $('#uimage-canvas-container'),
			canvas = container.find('#uimage-canvas'),
			img = canvas.find('.uimage-img'),
			mask = canvas.find('.image-edit-mask'),
			canvasWidth = this.canvasWidth(),
			canvasHeight = this.canvasHeight(),
			imageOffset = this.imgOffset()
		;

		container
			.width(canvasWidth)
			.height(canvasHeight)
		;

		canvas
			.width(canvasWidth)
			.height(canvasHeight)
		;

		this.imageOffset = imageOffset;
		img
			.width(this.imageSize.width)
			.height(this.imageSize.height)
			.css({
				top: imageOffset.top + 'px',
				left: imageOffset.left + 'px'
			})
		;

		mask.css({
			top: this.maskOffset.top + 'px',
			left: this.maskOffset.left + 'px',
			width: this.elementSize.width + 'px',
			height: this.elementSize.height + 'px'
		});
	},
	imgOffset: function() {
		if(! this.invert)
			return {top: 0, left: 0};
		return {
			top: Math.floor((this.imageSize.width - this.imageSize.height) / 2),
			left: Math.floor((this.imageSize.height - this.imageSize.width) / 2)
		}
	},
	canvasWidth: function(){
		if(this.invert)
			return this.imageSize.height;
		return this.imageSize.width;
	},
	canvasHeight: function(){
		if(this.invert)
			return this.imageSize.width;
		return this.imageSize.height;
	},
	startEditorUI: function() {
		var me = this;
		$('#uimage-canvas-container')
			.resizable({
				handles: {se: '.image-edit-resize i'},
				autoHide: 0,
				aspectRatio: true,
				start: function() {
					$('.image-edit-save-container').fadeOut('fast');
				},
				resize: function(e, ui){
					e.preventDefault();
					e.stopPropagation();
					me.setImageSize(ui.size);
					me.positionEditorElements();
					$('.image-edit-save-container').fadeOut('fast');
				},
				stop: function(e, ui){
					e.preventDefault();
					e.stopPropagation();
					me.setImageSize(ui.size);
					me.positionEditorElements();
					me.iLikeThatPosition();
					$('#uimage-canvas-container')
						.draggable('option', 'containment', me.getContainment())
						.height($('.image-edit-outer-mask').height())
					;
					$('.image-edit-save-container').fadeIn('fast');
				},
				minWidth: this.elementSize.width + this.maskOffset.left,
				minHeight: this.elementSize.height + this.maskOffset.top
			})
			.draggable({
				opacity:1,
				start: function(e, ui){
					$('.image-edit-save-container').fadeOut('fast');
				},
				drag: function(e, ui){
					me.moveMask(ui.position);
				},
				stop: function(e, ui){
					//me.imageOffset = ui.position;
					me.moveMask(ui.position);
					me.iLikeThatPosition();
					me.setResizingLimits();
					$('.image-edit-save-container').fadeIn('fast');
				},
				containment: me.getContainment()
			})
		;
	},
	setImageSize: function(uiSize){
		if(this.invert)			
			this.imageSize = {
				width: Math.floor(uiSize.height),
				height: Math.floor(uiSize.width)
			};
		else
			this.imageSize = {
				width: Math.floor(uiSize.width),
				height: Math.floor(uiSize.height)
			};
	},

	initialMaskOffset: function() {
		this.maskOffset = {
			top: (this.imageSize.height - this.elementSize.height) / 2,
			left: (this.imageSize.width - this.elementSize.width) / 2
		}
	},
	moveMask: function(position){
		this.maskOffset.top = this.initPoint.top - position.top;
		this.maskOffset.left = this.initPoint.left - position.left;
		$('#uimage-mask').css({
			top: this.maskOffset.top  + 'px',
			left: this.maskOffset.left + 'px'
		});
	},

	setContainerPosition: function(){
		var $win = $('#upfront-image-overlay'),
			mask = $('#uimage-mask'),

			/*
			centered = {
				top: $win.height() / 2 - mask.height() / 2,
				left: $win.width() / 2 - mask.width() / 2
			}, */
			centered = {
				top: this.$el.offset().top - $(window).scrollTop() - this.bordersWidth / 2,
				left: this.$('.upfront-object-content').offset().left - $(window).scrollLeft() - $('#sidebar-ui').width() - this.bordersWidth / 2
			},
			position = {
				top: centered.top - this.maskOffset.top,
				left: centered.left - this.maskOffset.left
			}
		;
		$('#uimage-canvas-container').css({
			top: position.top + 'px',
			left: position.left + 'px'
		});

		this.initPoint = centered;
	},

	iLikeThatPosition: function(){
		var container = $('#uimage-canvas-container'),
			left = container.offset().left + container.width() + 200 > $(window).width() - $(window).scrollLeft() ? 
				container.position().left - 200 + 'px' : 
				container.position().left + container.width() + this.bordersWidth + 'px',
		 	top = container.offset().top < $(window).scrollTop() ? 
		 		container.position().top + container.height() - 150 + 'px' :
		 		container.position().top + 50 + 'px'
 		;

 		$('.image-edit-save-container').css({
 			top: top,
 			left: left
 		});
	},

	initialImageSize: function() {
		var overlay = $('#upfront-image-overlay'),
			size = {
				width: this.sizes.full[1],
				height: this.sizes.full[2]
			},

			pivot, factor
		;

		if(size.width < this.elementSize.width || size.height < this.elementSize.height){
			this.elementSize = size;
		}

		pivot = this.elementSize.width - size.width > this.elementSize.height - size.height ? 'width' : 'height';
		factor = size[pivot] / this.elementSize[pivot];

		size = {
			width: Math.ceil(size.width / factor),
			height: Math.ceil(size.height / factor)
		};

		return size;
	},

	setResizingLimits: function() {
		$('#uimage-canvas-container').resizable('option', {
			minWidth: this.elementSize.width + this.maskOffset.left,
			minHeight: this.elementSize.height + this.maskOffset.top
		});
	},

	getContainment: function() {
		var sbwidth = $('#sidebar-ui').width(),
			scrollTop = $(window).scrollTop(),
			scrollLeft = $(window).scrollLeft()
		;
		return [
			this.initPoint.left + sbwidth - this.canvasWidth() + this.elementSize.width + scrollLeft,
			this.initPoint.top - this.canvasHeight() + this.elementSize.height + scrollTop,
			this.initPoint.left + sbwidth + scrollLeft,
			this.initPoint.top + scrollTop
		];
	},

	iLikeThat: function(e){
		e.preventDefault();
		//Select the best image
		var me = this,
			image = false,
			width = 0,
			height = 0
		;

		_.each(this.sizes, function(data){
			//No cropping
			if(Math.floor(me.imageSize.width / data[1] * 100) / 100 == Math.floor(me.imageSize.height / data[2] * 100) / 100){
				var sizeWidth = parseInt(data[1], 10),
					sizeHeight = parseInt(data[2], 10)
				;
				if(sizeWidth > me.imageSize.width && sizeHeight > me.imageSize.height && (!width || sizeHeight + sizeWidth < height + width)) {
					image = data[0];
					width = data[1];
					height = data[2];
				}				
			}			
		});

		//If no Image, we come from the layout editor. Already set
		if(image || typeof this.sizes.full != 'undefined'){
			this.property('src', image ? image : this.sizes.full[0]);
			this.property('srcFull', this.sizes.full[0]);
		}

		this.property('size', this.imageSize);
		this.property('position', {left: - this.maskOffset.left + this.imageOffset.left, top: - this.maskOffset.top + this.imageOffset.top});
		this.property('rotation', this.rotation);
		this.property('image_status', 'ok');
		this.property('element_size', this.elementSize);

		this.closeOverlay();
	},


	editRequest: function () {
		if(this.property('image_status') == 'ok'){
			if(! $('#upfront-image-overlay').length){
				var imageOffset = this.property('position');
				//Set editor properties
				this.imageSize = this.property('size');
				this.setRotation(this.property('rotation'));
				this.imageOffset = this.imgOffset();
				this.maskOffset = {
					top: this.imageOffset.top - imageOffset.top,
					left: this.imageOffset.left - imageOffset.left
				};
				this.elementSize = this.property('element_size');

				this.openEditor();
			}
		}
		else
			this.openImageSelector();
	},

	rotate: function(){
		var rotation = this.rotation,
			img = $('.uimage-img'),
			rotationClass = '',
			size = {width: img.width(), height: img.height()},
			position = {x: 0, y: 0}
		;

		rotation = rotation == 270 ? 0 : rotation + 90;
		if(rotation)
			rotationClass = 'rotate_' + rotation;

		img.removeClass()
			.addClass('uimage-img ' + rotationClass);

		this.setRotation(rotation);
		this.positionEditorElements();

		this.iLikeThatPosition();

		this.setResizingLimits();
		$('#uimage-canvas-container').draggable('option', 'containment', this.getContainment());
	},
	setRotation: function(rotation){
		this.rotation = rotation;
		this.invert = [90,270].indexOf(rotation) != -1;
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
		;


		this.setOverlayEvents();

		overlay.fadeIn('fast');
		this.resizeOverlay();

		$(window)
			.on('resize', function(e){
				if(e.target == window){
					me.resizeOverlay();
					me.positionEditorElements();
					$('#image-edit-container').draggable('option', 'containment', me.getContainment());
				}
			})
		;
		$(document)
			.on('scroll', function(){
				me.onScrollFunction = arguments.callee;
				me.onScroll();
			});
		;	

		if(settings.is(':visible')){
			settings.fadeOut();
			this.reopenSettings = true;
		}

		if(callback)
			callback(overlay);

		//$('#upfront-image-overlay').fadeIn('fast');
	},

	onScroll: function(){
		this.setResizingLimits();
		$('#uimage-canvas-container').draggable('option', 'containment', this.getContainment());
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
			.on('click', '.image-edit-rotate', function(e){
				me.rotate(e);
			})
			.on('click', '.image-edit-save', function(e){
				me.iLikeThat(e);
			})
			.on('click', 'a.image-edit-change', function(e){
				me.openImageSelector(e);
			})
			.on('click', 'a.open-media-gallery', function(e){
				me.openMediaGallery(e);
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
			wifth: 'auto'
		});

		if(this.onScrollFunction){
			$(document).off('scroll', this.onScrollFunction);
			this.onScrollFunction = false;
		}

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
		Upfront.Media.Manager.open().done(function(popup, result){
			if(result && result.length > 0){
				var image = result.at(0);
				me.imageId = image.get('ID');
				me.getImageData()
					.done(function(){
						me.justUploaded = true;
						me.openEditor();
					})
				;

				me.openProgress(function(){
					$('#upfront-image-uploading h2').html('Preparing Image');
				});
			}
		});
	},
	openFileBrowser: function(e){
	    console.log('clicking');
		$('#upfront-image-file-input').click();
	},
	checkFileUpdate: function(e){
	     console.log('here we are');
	     return true;
	},

	uploadImage: function(e){
		var me = this,
			progress = $('#upfront-progress')
		;

		$('#upfront-upload-image').ajaxSubmit({
			beforeSend: function() {
				progress.css('width', '0');
			},
			uploadProgress: function(e, position, total, percent) {
				progress.css('width', percent + '%');
			},
			complete: function() {
				$('#upfront-image-uploading h2').html('Preparing Image');
			},
			success: function(response){
				progress.css('width', '100%');
				console.log(response);
				me.imageId = response.data;
				me.getImageData()
					.done(function(){
						me.justUploaded = true;
						me.openEditor();
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
				item_id: me.imageId
			})
			.done(function(response){
				me.sizes = response.data;
			})	
		;
	},

	property: function(name, value) {
		if(typeof value != "undefined")
			return this.model.set_property(name, value);
		return this.model.get_property_value_by_name(name);
	}	    
}));

var ImageElement = Upfront.Views.Editor.Sidebar.Element.extend({
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
			render_all = function(){
				this.settings.invoke('render');
			}
		;
		this.settings = _([
			new Field_Input({
				model: this.model,
				name: 'image_title',
				label: 'Image Title',
				value: this.model.get_property_value_by_name('image_title')
			}),
			new Field_Input({
				model: this.model,
				name: 'alternative_text',
				label: 'Alternative text',
				value: this.model.get_property_value_by_name('alternative_text')
			}),
			new Field_Checkbox({
				model: this.model,
				name: 'include_image_caption',
				label: 'Include image caption',
				value: this.model.get_property_value_by_name('include_image_caption')
			}),
			new Field_Textarea({
				model: this.model,
				name: 'image_caption',
				label: 'Image Caption',
				value: this.model.get_property_value_by_name('image_caption'),
				trigger_name: 'include_image_caption',
				trigger_value: 'yes'
			})
		]);
		this.$el.on('change', '#include_image_caption', function(){
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
		if(this.$('#include_image_caption').is(':checked')){
			this.$('#usetting-image_caption').show();
			$('#usetting-caption_position').show();
			$('#usetting-caption_trigger').show();
			$('#usetting-caption_alignment').show();
		}
		else{
			this.$('#usetting-image_caption').hide();
			$('#usetting-caption_position').hide();
			$('#usetting-caption_trigger').hide();
			$('#usetting-caption_alignment').hide();			
		}
		$('#settings').height(this.$('.upfront-settings_panel').outerHeight() - 2);	
	}
});

var BehaviorPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var render_all = function(){
				this.settings.invoke('render');
			},
			me = this
		;
		this.model.on('doit', render_all, this);
		this.settings = _([
			new Field_Radio({
				model: this.model,
				title: 'When Clicked',
				name: 'when_clicked',
				label: 'when_clicked',
				value: this.model.get_property_value_by_name('when_clicked') ? this.model.get_property_value_by_name('when_clicked') : false,
				options: [
					{
					  'name': 'when_clicked',
					  'value': 'do_nothing',
					  'label': 'do nothing',
					  'icon': '',
					  'default': 'true'
					},{
					  'name': 'when_clicked',
					  'value':'open_link',
					  'label': 'open link',
					  'icon': '',
					  'default': 'false'
					},{
					  'name': 'when_clicked',
					  'value':'show_larger_image',
					  'label': 'show larger image',
					  'icon': '',
					  'default': 'false'
					}
				]
			}),
			new Field_Input({
				model: this.model,
				name: 'image_link',
				label: 'Image link',
				value: this.model.get_property_value_by_name('image_link')
			}),
			new Field_Radio({
				model: this.model,
				name: 'caption_position',
				title: 'Caption Settings',
				label: 'caption_position',
				value: this.model.get_property_value_by_name('caption_position') ? this.model.get_property_value_by_name('caption_position') : false,
				options: [
					{ 'name': 'caption_position',
					  'value': 'below_image',
					  'label': 'below image',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'true'
					},{
					    'name': 'caption_position',
					    'value': 'over_image',
					    'label': 'over image',
					    'icon': '<i class="icon-th-large"></i>'
					}]
			}),
			new Field_Radio({
				model: this.model,
				name: 'caption_trigger',
				label: 'caption_trigger',
				value: this.model.get_property_value_by_name('caption_trigger') ? this.model.get_property_value_by_name('caption_trigger') : false,
				options: [
					{
					  'name': 'caption_trigger',
					  'value': 'always_show',
					  'label': 'Always show',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'true'
					},{
					  'name': 'caption_trigger',
					  'value': 'hover_show',
					  'label': 'Show on hover',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'false'
					}]
			}),
			new Field_Radio({
				model: this.model,
				name: 'caption_alignment',
				label: 'caption_alignment',
				value: this.model.get_property_value_by_name('caption_alignment') ? this.model.get_property_value_by_name('caption_alignment') : false,
				options: [
					{
					  'name': 'caption_alignment',
					  'value': 'top',
					  'label': 'Top',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'true'
					},{
					  'name': 'caption_alignment',
					  'value': 'bottom',
					  'label': 'Bottom',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'false'
					},{
					  'name': 'caption_alignment',
					  'value': 'fill',
					  'label': 'Fill',
					  'icon': '<i class="icon-th-large"></i>',
					  'default': 'false'
					}]
				
			}),
			new Field_Color({
				model: this.model,
				name: 'color',
				label: 'Color',
				title: 'Caption Style:',
				value: this.model.get_property_value_by_name('color')
			}),
			new Field_Color({
				model: this.model,
				name: 'background',
				label: 'Background',
				value: this.model.get_property_value_by_name('background')
			}),
			new Field_Number({
				model: this.model,
				name: 'background_transparency',
				label: '% Background transparency',
				value: this.model.get_property_value_by_name('background_transparency'),
				get_value: function(){
					var val = this.$('[name="' + this.name + '"]').val(),
						intval = parseInt(val, 10);
					return  intval >= 0 && intval < 101 ? intval : 0;
				}
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
			this.$('#field_image_link').show();
		}
		else{
			this.$('#field_image_link').hide();
		}
		$('#settings').height(this.$('.upfront-settings_panel').outerHeight() - 2);		
	},
	toggleCaptionSettings: function(){
		if(this.$('input[name=caption_position]:checked').val() == 'over_image'){
			this.$('#usetting-caption_trigger').show();
			this.$('#usetting-caption_alignment').show();
		}
		else{
			this.$('#usetting-caption_trigger').hide();
			this.$('#usetting-caption_alignment').hide();
		}
		$('#settings').height(this.$('.upfront-settings_panel').outerHeight() - 2);	
	},
	setFieldEvents: function() {
		this.toggleLink();
		this.toggleCaptionSettings();
	}
});

var Field = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function (data) {
		_.extend(this, data);
	},
	render: function (){
		this.$el.empty();
		if(this.trigger_name)
			if(this.model.get_property_value_by_name(this.trigger_name) != this.trigger_value)				
				return false;
		if(this.title){
			this.wrap({
				title: this.title,
				markup: this.get_markup()
			});
		}
		else{
			this.$el.append('<div id="usetting-' + this.name + '" ><div class="upfront-settings-item"><div class="'+this.name+'-field">' + this.get_markup() + '</div></div></div>');
		}
		if(this.afterRender)
			this.afterRender();
	},
	get_name: function() {
		return this.name;
	},
	get_value: function() {
		return this.$el.find('[name="' + this.name + '"]').val();
	}
});
var Field_Input = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name) || this.value;
		value = value || '';
		var data = {
		   	label:this.label,
		   	name:this.name,
		   	value: value,
		}
		var template = '<div id="field_{{name}}">{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}<input type="text" name="{{name}}" value="{{value}}" /></div>';
		var render =  _.template(template, data);	
		return render;
	}
})
var Field_Textarea = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name) || this.value;
		value = value || '';
		var data = {
		   	label:this.label,
		   	name:this.name,
		   	value: value,
		   	icon : this.icon,
		}
		var template = '<div id="field_{{name}}">{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}<textarea name="{{name}}">{{value}}</textarea></div>';
		var render =  _.template(template, data);	
		return render;
	}
})
var Field_Checkbox = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name) ? this.model.get_property_value_by_name(this.name) : 'no';
		value = value || '';
		var data = {
		   	label:this.label,
		   	name:this.name,
		   	value: 'yes',
		   	checked: value == 'yes' ? 'checked' : ''
		}
		var template = '<div id="field_{{name}}"><input id="{{name}}" type="checkbox" name="{{name}}" value="1" {{checked}} />{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}</div>';
		var render =  _.template(template, data);
		return render;
	},
	get_value: function() {
		var value = this.$el.find('input[name="'+this.name+'"]').is(':checked') ? 'yes' : 'no';
		return value;
	
	}
})
var Field_Radio = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name);
		var render = '<div id="field_'+this.name+'">';
		var template = '<div class="upfront-radio-item"><input type="radio" name="{{name}}" id="{{name}}" value="{{value}}" {[ if(typeof selected != "undefined" && selected) { ]} checked  {[ } ]}> <span class="radio-button-label">{{icon}} {[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}</span></div>';
		
		_.each(this.options, function (item) {
			if(!this.value && item.default == 'true'){ item.selected = true; }
			else if (value == item.value){ item.selected = true; }
		
			render += _.template(template, item);
		});
		render += "</div>";
		return render;
	},
	get_value: function() {
		var value = this.$el.find('input:radio[name='+this.name+']:checked').val();
		return value != '' ? value : '';
	}
})

var Field_Color = Field.extend({
	get_markup: function(){
		return '<div id="field_' + this.name + '">' + 
			'<span>' + this.label + ':</span> <a class="color-pick color-' + this.name + '" href="#"><span class="color-value">' + this.value + '</span> <span class="color-tip" style="background:' + this.value + '"></span></a>' +
			'<input type="hidden" name="' + this.name + '" id="' + this.name + '" value="' + this.value + '">' +
			'</div>'
		;
	},
	afterRender: function(){
		var me = this;
		this.$('#' + this.name).wpColorPicker({
			change: function(e, ui) {
				var color = me.$('#' + me.name).val();
				me.$('.color-value').text(color);
				me.$('.color-tip').css('background', color);
			}
		});
		this.$el
			.on('click', '.color-pick', function(e){
				e.preventDefault();
				$(this).siblings('.wp-picker-container').find('.iris-picker').toggle();
				$('#settings').height($(this).parents('.upfront-settings_panel').outerHeight() - 2);	
				//me.$('#' + me.name).click();
			})
		;
	}
})

var Field_Number = Field.extend({
	min: 0,
	max: 100,
	get_markup: function(){
		return '<div id="field_' + this.name + '">' + 
			'<span>' + this.label + ':</span> ' +
			'<input type="number" min="' + this.min + '" max="' + this.max  + '"name="' + this.name + '" id="' + this.name + '" value="' + this.value + '">' +
			'</div>'
		;
	},
});


Upfront.Application.LayoutEditor.add_object("Uimage", {
	"Model": UimageModel, 
	"View": UimageView,
	"Element": ImageElement,
	"Settings": ImageSettings
});

Upfront.Models.UimageModel = UimageModel;
Upfront.Views.UimageView = UimageView;
/*
Upfront.Models.ImageModel = UimageModel;
Upfront.Views.ImageView = UimageView;
*/

}); //End require

})(jQuery);