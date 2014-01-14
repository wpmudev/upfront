
(function ($) {

define([
	'text!elements/upfront-slider/tpls/uslider.html',
	'text!elements/upfront-slider/tpls/backend.html'
], function(sliderTpl, editorTpl){

//Slide Model
var Uslider_Slide = Backbone.Model.extend({
	//See library to know the defaults
	defaults: Upfront.data.uslider.slideDefaults
});

//Slide Collection
var Uslider_Slides = Backbone.Collection.extend({
	model: Uslider_Slide
});

/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var USliderModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.uslider.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);
	}
});

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var USliderView = Upfront.Views.ObjectView.extend({
	self: {},
	module_settings: {},
	tpl: Upfront.Util.template(sliderTpl),
	linkTpl: _.template($(editorTpl).find('#link-tpl').html()),

	//Temporary props for image resizing and cropping
	imageProps: {},
	cropHeight: false,
	cropTimer: false,
	cropTimeAfterResize: 10000,

	//Current Slide index
	currentSlide: 0,

	initialize: function(options){
		console.log('Uslider');
		if(! (this.model instanceof USliderModel)){
			this.model = new USliderModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);

		this.events = _.extend({}, this.events, {
			'click .upfront-image-select-button': 'openImageSelector',
			'click .upfront-icon-next': 'nextSlide',
			'click .upfront-icon-prev': 'prevSlide'
		});

		var slides = this.property('slides');
		this.slides = new Uslider_Slides(slides);

		this.slides.on('add remove reset change', this.slidesChange, this);

		this.model.on('addRequest', this.openImageSelector, this);

		Upfront.Events.on('command:layout:save', this.saveResizing, this);
		Upfront.Events.on('command:layout:save_as', this.saveResizing, this);
	},

	on_edit: function(e){
		return false;
	},

	get_content_markup: function() {
		var me = this,
			props = this.extract_properties(),
			rendered = {}
		;


		if(!this.slides.length){
			this.startingHeight = this.startingHeight || 225;
			return '<div class="upfront-image-starting-select" style="min-height:' + this.startingHeight + 'px">' +
					'<span class="upfront-image-resizethiselement">Resize the slider & add images</span>'+
					'<div class="upfront-image-resizing-icons"><span class="upfront-image-resize-icon"></span><a class="upfront-image-select-button button" href="#"></a></div>'+
			'</div>';
		}

		//Stop autorotate
		props.rotate = false;

		props.dots = _.indexOf(['dots', 'both'], props.controls) != -1;
		props.arrows = _.indexOf(['arrows', 'both'], props.controls) != -1;

		props.slides = this.slides.toJSON();

		props.slidesLength = props.slides.length;

		props.imageWidth = props.style == 'right' ?  Math.floor(props.rightImageWidth / props.rightWidth * 100) + '%' : '';
		props.textWidth = props.style == 'right' ? Math.floor((props.rightWidth - props.rightImageWidth) / props.rightWidth * 100) + '%' : '';

		props.production = false;
		props.startingSlide = this.currentSlide;

		rendered = this.tpl(props);

		$rendered = $('<div></div>').append(rendered);

		this.slides.each(function(slide){
			if(!me.imageProps[slide.id]){
				me.imageProps[slide.id] = {
					size: slide.get('size'),
					cropOffset: slide.get('cropOffset')
				};
			}

			var img = $rendered.find('.uslide[rel=' + slide.id + ']').find('img'),
				props = me.imageProps[slide.id]
			;
			img.attr('src', slide.get('srcFull'))
				.css({
					position: 'absolute',
					width: props.size.width,
					height: props.size.height,
					top: 0-props.cropOffset.top,
					left: 0-props.cropOffset.left,
					'max-width': 'none',
					'max-height': 'none',
					margin: 'inherit',
					bottom: 'inherit',
					right: 'inherit'
				})
				.parent().css({
					position: 'relative',
					height: me.cropHeight || slide.get('cropSize').height,
					overflow: 'hidden'
				})
			;
		});

		return $rendered.html();
	},

	on_render: function() {
		var me = this;

		//Bind resizing events
		if(!me.parent_module_view.$el.data('resizeHandling')){
			me.parent_module_view.$el
				.on('resizestart', $.proxy(me.onElementResizeStart, me))
				.on('resize', $.proxy(me.onElementResizing, me))
				.on('resizestop', $.proxy(me.onElementResize, me))
				.data('resizeHandling', true)
			;
		}

		if(!this.slides.length)
			return;

		if(this.$el.parent().length)
			me.prepareSlider();
		else{
			setTimeout(function(){
				me.on_render();
			}, 100);
		}
	},

	prepareSlider: function(){
		var me = this,
			wrapper = me.$('.uslide-image'),
			controls = me.createControls(),
			text = me.$('.uslide-editable-text')
		;

		controls.setWidth(wrapper.width());
		controls.render();

		me.$('.uslides').append(
			$('<div class="uimage-controls upfront-ui" rel="' + me.slides.at(0).id + '"></div>').append(controls.$el)
		);
		me.bindSlidesText();

		if(text.length && !text.data('ueditor')){
			me.$('.uslide-editable-text').ueditor({
					autostart: false,
					upfrontMedia: false,
					upfrontImages: false
				})
				.on('start', function(){
					var $this = $(this),
						id = $this.closest('.uslide-text').attr('rel'),
						slide = me.slides.get(id)
					;

					me.$el.addClass('upfront-editing');

					$this.on('syncAfter', function(){
							slide.set('text', $this.html(), {silent: true});
						})
						.on('stop', function(){
							slide.set('text', $this.html());
							me.property('slides', me.slides.toJSON());
							me.$el.removeClass('upfront-editing');
						})
					;
				})
			;
		}

		//me.property('rightWidth', me.getElementColumns());

		if(me.property('style') == 'right'){
			me.setImageResizable();
		}

		//Adapt slider height to the image crop
		var textHeight = 0; //_.indexOf(['above', 'below'], me.property('style')) != -1 ? me.$('.uslider-texts').outerHeight() : 0;
		me.$('.uslides').height(wrapper.height() + textHeight);

		me.showCaption();
	},

	get_buttons: function(){
		return this.property('slides').length ? '<a href="" class="upfront-icon-button upfront-icon-button-nav upfront-icon-next"></a><a href="" class="upfront-icon-button upfront-icon-button-nav upfront-icon-prev"></a>' : '';
	},

	nextSlide: function(){
		this.$('.uslides').upfront_default_slider('next');
	},

	prevSlide: function(){
		this.$('.uslides').upfront_default_slider('prev');
	},

	setImageResizable: function(){
		var me = this,
			slides = this.$('.uslides'),
			elementWidth = me.$('.upfront-object').outerWidth(),
			elementCols = me.property('rightWidth'),
			colWidth = Math.floor(elementWidth / elementCols),
			text = me.$('.uslider-texts'),
			current = this.$('.upfront-default-slider-item-current'),
			id = current.attr('rel'),
			slide = this.slides.get(id),
			height = false
		;

		slides.resizable({
			start: function(e, ui){
				if(!ui.element.hasClass('uslides'))
					return;
				elementWidth = me.$('.upfront-object').outerWidth();
				elementCols = me.property('rightWidth');
				colWidth = Math.floor(elementWidth / elementCols);
				height = slides.height();
				text = me.$('.uslider-texts');

				slides.resizable('option', {
					minWidth: colWidth * 3,
					maxWidth: (elementCols - 3) * colWidth,
					grid: [colWidth, 100], //Second number is never used (fixed height)
					handles: 'e',
					helper: '.uslider-resize-handler',
					minHeigth: height,
					maxHeight: height
				});
			},
			resize: function(e, ui){
				if(!ui.element.hasClass('uslides'))
					return;
				var imageWidth = ui.element.width(),
					textWidth = elementWidth - imageWidth
				;
				me.calculateImageResize({width: imageWidth, height: ui.element.height()}, slide);
				text.css({
					width: textWidth + 'px',
					'margin-left': imageWidth + 'px'
				});
			},
			stop: function(e, ui){
				if(!ui.element.hasClass('uslides'))
					return;
				var imageWidth = ui.element.width(),
					imageCols = Math.round((imageWidth - (colWidth - 15))/ colWidth) + 1,
					percentage = Math.floor(imageCols / elementCols * 100)
				;

				slides.css({width: percentage + '%'});

				me.slides.each(function(slide){
					me.imageProps[slide.id] = me.calculateImageResize({width: slides.width(), height: ui.element.height()}, slide);
				});

				me.cropHeight = ui.element.height();

				me.property('rightImageWidth', imageCols, false);

				me.setTimer();
			}
		});
	},

	setTimer: function(){
		var me = this;
		if(me.cropTimer){
			clearTimeout(me.cropTimer);
			me.cropTimer = false;
		}
		me.cropTimer = setTimeout(function(){
			me.saveTemporaryResizing();
			console.log('resizingTimer');
		}, me.cropTimeAfterResize);
	},

	bindSlidesText: function(){
		var me = this;
		this.$('.uslides').on('slidein', function(e, slide, index){
			if(slide){
				var slider = $(slide).closest('.uslider'),
					id = $(slide).attr('rel')
				;
				me.currentSlide = index;
				if(!slider.hasClass('uslider-nocaption')){
					var text = slider.find('.uslide-text[rel="' + id + '"]');
					text.addClass('uslide-text-current');
					if(_.indexOf(['bottomCover', 'middleCover', 'topCover'], me.property('style')) == -1)
						text.closest('.uslider-texts').css('height', 'auto');
				}
				me.$('.uimage-controls').attr('rel', id);
			}
		});
		this.$('.uslides').on('slideout', function(e, slide){
			if(slide){
				var slider = $(slide).closest('.uslider'),
					id = $(slide).attr('rel')
				;
				if(!slider.hasClass('uslider-nocaption')){
					var text = slider.find('.uslide-text[rel="' + id + '"]');
					if(_.indexOf(['bottomCover', 'middleCover', 'topCover'], me.property('style')) == -1)
						text.closest('.uslider-texts').height(text.height());
					text.removeClass('uslide-text-current');
				}
			}
		});
	},

	showCaption: function(){
		var id = this.$('.upfront-default-slider-item-current').attr('rel');

		if(id){
			this.$('.uslide-text[rel=' + id + ']').addClass('uslide-text-current');
		}
	},

	createControls: function() {
		var me = this,
			panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
			multi = new Upfront.Views.Editor.InlinePanels.MultiControl()
		;
		multi.sub_items = {
			topOver: this.createControl('topOver', 'Over image, top'),
			bottomOver: this.createControl('bottomOver', 'Over image, bottom'),
			topCover: this.createControl('topCover', 'Covers image, top'),
			middleCover: this.createControl('middleCover', 'Covers image, middle'),
			bottomCover: this.createControl('bottomCover', 'Covers image, bottom'),
			above: this.createControl('above', 'Above the image'),
			below: this.createControl('below', 'Below the image'),
			right: this.createControl('right', 'At the right'),
			nocaption: this.createControl('nocaption', 'No text')
		};

		multi.icon = 'caption';
		multi.tooltip = 'Caption position';
		multi.selected = this.property('style');
		multi.on('select', function(item){
			var previous = me.property('style'),
				slider = me.$('.uslides'),
				maskSize = {width: me.$('.upfront-uslider').width(), height: slider.height()}
			;
			if(item == 'right' && me.getElementColumns() < 6){
				var controls = this.createControls(),
					wrapper = me.$('.uslide-image')
				;

				controls.setWidth(wrapper.width());
				controls.render();

				me.$('.uimage-controls').html(controls.$el);

				Upfront.Views.Editor.notify("The slider needs to be wider to have the text at the right.", "error");
			}

			if(item == 'right'){ //Resize the mask
				var imagePercentWidth = me.property('rightImageWidth') / me.property('rightWidth');
				maskSize.width = Math.floor(maskSize.width * imagePercentWidth);
			}

			me.slides.each(function(slide){
				me.imageProps[slide.id] = me.calculateImageResize(maskSize, slide);
			});

			me.setTimer();
			me.property('style', item, false);
		});

		panel.items = _([
			this.createControl('crop', 'Edit image', 'imageEditMask'),
			this.createControl('link', 'Link slide', 'slideEditLink'),
			multi,
			this.createControl('remove', 'Remove slide', 'removeSlide')
		]);

		return panel;
	},

	createControl: function(icon, tooltip, click){
		var me = this,
			item = new Upfront.Views.Editor.InlinePanels.Control();
		item.icon = icon;
		item.tooltip = tooltip;
		if(click){
			item.on('click', function(e){
				me[click](e);
			});
		}

		return item;
	},

	getElementColumns: function(){
		var module = this.$el.closest('.upfront-module'),
			classes,
			found = false
		;

		if(!module.length)
			return -1;

		classes = module.attr('class').split(' ');

		_.each(classes, function(c){
			if(c.match(/^c\d+$/))
				found = c.replace('c', '');
		});
		return found || -1;
	},

	slidesChange: function(){
		this.property('slides', this.slides.toJSON(), false);
		this.model.trigger('slidesChanged');
	},

	openImageSelector: function(e){
		var me = this,
			sizer = this.slides.length ? this.$('.uslider') : this.$('.upfront-object-content'),
			selectorOptions = {
				multiple: true,
				preparingText: 'Preparing images',
				customImageSize: {
					width: sizer.width(),
					height: sizer.height()
				}
			}
		;

		if(e)
			e.preventDefault();

		Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){
			me.addSlides(images);
			Upfront.Views.Editor.ImageSelector.close();
		});
	},

	addSlides: function(images){
		var slides = [];
		console.log(images);
		_.each(images, function(image, id){
			var data = {sizes: image, id: id, srcFull: image.full[0], status: 'ok'};
			if(image.custom && !image.custom.error){
				data.src = image.custom.url;
				data.size = image.custom.editdata.resize;
				data.cropSize = image.custom.crop;
				data.cropOffset = image.custom.editdata.crop;
			}
			else{
				data.src = image.full[0];
				data.size = {width: image.full[1], height: image.full[2]};
			}
			slides.push(data);
		});

		this.slides.add(slides);
	},

	onElementResizeStart: function(e, ui){
		if(ui.element.hasClass('uslides') || this.$('.upfront-image-starting-select').length)
			return;
		var style = this.property('style');
		this.calculateColumnWidth();
		if(_.indexOf(['nocaption', 'below', 'above', 'right'], style) == -1)
			this.$('.uslider-texts').fadeOut('fast');
		else if(style == 'right'){
			this.$('.uslides').width(this.$('.uslides').width());
		}
	},

	calculateColumnWidth: function(){
		var columns = this.getElementColumns(),
			elementWidth = this.$('.upfront-object').outerWidth()
		;

		this.colWidth = Math.floor(elementWidth / columns);
	},

	onElementResize: function(e, ui){
		if(ui.element.hasClass('uslides'))
			return;

		var starting = this.$('.upfront-image-starting-select');
		if(starting.length){
			this.startingHeight = $('.upfront-resize').height() - 30;
			return;
		}

		var me = this,
			mask = this.$('.upfront-default-slider-item-current').find('.uslide-image'),
			cropSize = {width: mask.width(), height: mask.height()}
		;

		this.slides.each(function(slide){
			me.imageProps[slide.id] = me.calculateImageResize(cropSize, slide);
		});

		me.cropHeight = cropSize.height;

		this.property('rightWidth', Math.round($('.upfront-resize').width() / this.colWidth));

		me.setTimer();
	},

	onElementResizing: function(e, ui){
		if(ui.element.hasClass('uslides'))
			return;

		var starting = this.$('.upfront-image-starting-select');
		if(starting.length)
			return starting.outerHeight($('.upfront-resize').height() - 30);

		var style = this.property('style');

		var resizer = $('.upfront-resize'),
			text = _.indexOf(['below', 'above'], this.property('style'))  != -1 ? this.$('.uslider-texts') : [],
			textHeight = text.length ? text.outerHeight() : 0,
			newElementSize = {width: resizer.outerWidth() - 30, height: resizer.outerHeight() - 30 - textHeight},
			current = this.$('.upfront-default-slider-item-current'),
			id = current.attr('rel'),
			slide = this.slides.get(id)
		;

		if(style == 'right')
			newElementSize.width = current.width();

		this.calculateImageResize(newElementSize, slide);
	},

	calculateImageResize: function(wrapperSize, slide){
		var img = this.$('.uslide[rel=' + slide.id + ']').find('img'),
			imgSize = slide.get('size'),
			position = slide.get('cropOffset')
		;

		if(wrapperSize.width > imgSize.width || wrapperSize.height > imgSize.height){
			var imgRatio = imgSize.width / imgSize.height,
				elementRatio = wrapperSize.width / wrapperSize.height
			;
			if(imgRatio < elementRatio)
				img.css({'width': wrapperSize.width, 'height': 'auto'}); // Changed
			else
				img.css({'height': wrapperSize.height, 'width': 'auto'});

		}
		else{
			img.css({height: imgSize.height, width: imgSize.width});
		}

		if(wrapperSize.width > imgSize.width - position.left)
			img.css({left:'auto', right: 0});
		else
			img.css({left: 0 - position.left, right: 'auto'});

		if(wrapperSize.height > imgSize.height - position.top)
			img.css({top:'auto', bottom: 0});
		else
			img.css({top: 0 - position.top, bottom: 'auto'});

		img.closest('.uslide-image').css(wrapperSize)
			.closest('.uslides').height(wrapperSize.height);

		return {
			size: {width: img.width(), height: img.height()},
			cropOffset: {left: 0-img.position().left, top: 0-img.position().top}
		};
	},

	saveTemporaryResizing: function(){
		var me = this,
			imagesData = [],
			mask = this.$('.uslide-image'),
			cropSize = {width: mask.width(), height: mask.height()},
			editOptions = {action: 'upfront-media-image-create-size'},
			sentData = {}
		;
		this.slides.each(function(slide){
			var crop = me.imageProps[slide.id].cropOffset, data;
			crop.width = cropSize.width;
			crop.height = cropSize.height;
			data = {
				id: slide.id,
				rotate: slide.get('rotation'),
				resize: me.imageProps[slide.id].size,
				crop: crop
			};
			imagesData.push(data);
			sentData[slide.id] = data;
		});

		editOptions.images = imagesData;

		return Upfront.Util.post(editOptions).done(function(response){
			var images = response.data.images;
			console.log(images);
			_.each(images, function(data, id){
				var slide = me.slides.get(id),
					imageData = sentData[id]
				;
				slide.set({
					src: data.url,
					srcFull: data.urlOriginal,
					size: imageData.resize,
					cropSize: {width: imageData.crop.width, height: imageData.crop.height},
					cropOffset: {left: imageData.crop.left, top: imageData.crop.top}
				}, {silent: true});
			});
			me.imageProps = {};
			me.slidesChange();
		});
	},

	saveResizing: function(){
		var me = this;
		if(this.cropTimer){
			clearTimeout(this.cropTimer);
			this.cropTimer = false;

			this.saveTemporaryResizing().done(function(){
				var saveData = {
					element: JSON.stringify(Upfront.Util.model_to_json(me.model)),
					action: 'upfront_update_layout_element'
				};
				Upfront.Util.post(saveData).done(function(response){
					console.log('Ok');
				});
			});
		}
	},

	removeSlide: function(e) {
		var item = $(e.target).closest('.uimage-controls');
		this.startingHeight = this.$('.upfront-slider').height();
		if(confirm('Are you sure to delete this slide?'))
			this.slides.remove(item.attr('rel'));
	},

	imageEditMask: function(e) {
		var me = this,
			item = $(e.target).closest('.uimage-controls'),
			slide = this.slides.get(item.attr('rel')),
			editorOpts = this.getEditorOptions(slide)
		;

		if(slide.get('status') != 'ok'){
			var selectorOptions = {
				multiple: false,
				preparingText: 'Preparing slides'
			};
			return Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){
				me.addSlides(images);

				var index = me.slides.indexOf(slide);
				me.slides.remove(slide, {silent:true});

				var newSlide = me.slides.at(me.slides.length -1);
				me.slides.remove(newSlide, {silent:true});
				me.slides.add(newSlide, {at: index});

				Upfront.Views.Editor.ImageSelector.close();
			});
		}

		e.preventDefault();
		Upfront.Views.Editor.ImageEditor.open(editorOpts)
			.done(function(result){
				slide.set({
					src: result.src,
					srcFull: result.srcFull,
					cropSize: result.cropSize,
					size: result.imageSize,
					cropOffset: result.imageOffset,
					margin: {left: Math.max(0-result.imageOffset.left, 0), top: Math.max(0-result.imageOffset.top, 0)},
					rotation: result.rotation
				});
				me.imageProps[slide.id] = {
					cropOffset: result.imageOffset,
					size: result.imageSize
				};
				me.render();
			})
		;
	},

	getEditorOptions: function(image){
		var me = this,
			mask = this.$('.uslide[rel=' + image.id + ']').find('.uslide-image'),
			img = mask.find('img'),
			full = image.get('sizes').full,
			size = {width: img.width(), height: img.height()},
			position = {left: 0 - img.position().left, top: 0 - img.position().top}
		;

		return {
			id: image.id,
			maskSize: {width: mask.width(), height: mask.height()},
			maskOffset: mask.offset(),
			position: position,
			size: size,
			fullSize: {width: full[1], height: full[2]},
			src: image.get('src'),
			srcOriginal: full[0],
			rotation: image.get('rotation'),
			extraButtons: [
				{
					id: 'image-edit-button-swap',
					text: 'Replace Image',
					callback: function(e, editor){
						editor.cancel();
						me.openImageSelector(null, image.id);
					}
				}
			]
		};
	},

	slideEditLink: function(e) {
		e.preventDefault();
		if(this.$el.hasClass('tooltip-open'))
			return this.closeTooltip();
		var me = this,
			item = $(e.target).closest('.uimage-controls'),
			slide = this.slides.get(item.attr('rel')),
			tplOptions = slide.toJSON(),
			contents = ''
		;
		tplOptions.checked = 'checked="checked"';

		contents = $(this.linkTpl(tplOptions))
			.on('change', 'input[name=ugallery-image-link]', function(ev){
				me.slideLinkChanged(e);
			})
			.on('click', 'button.upfront-save_settings', function(e){
				me.saveSlideLink(e);
			})
			.on('click', '.ugallery-change-link-post', function(ev){
				me.slideLinkChanged(e);
			})
		;

		this.openTooltip(contents, $(e.target));
	},

	slideLinkChanged: function(e){
		var me = this,
			val = $('#ugallery-tooltip').find('input[name=ugallery-image-link]:checked').val(),
			slideId = $('#ugallery-tooltip').find('#uslider-slide-id').val()
		;

		if(val == 'external'){
			$('#ugallery-image-link-url').show();
		}
		else{
			$('#ugallery-image-link-url').hide();
			if(val == 'post' || e.type != 'change'){
				var selectorOptions = {
						postTypes: this.postTypes()
					}
				;
				this.closeTooltip();

				Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
					var slide = me.slides.get(slideId);
					slide.set({
						urlType: 'post',
						url: post.get('permalink')
					});
				});
			}
		}
	},

	postTypes: function(){
		var types = [];
		_.each(Upfront.data.ugallery.postTypes, function(type){
			if(type.name != 'attachment')
				types.push({name: type.name, label: type.label});
		});
		return types;
	},

	saveSlideLink: function(e){
		var tooltip = $('#ugallery-tooltip'),
			linkVal = tooltip.find('input[name=ugallery-image-link]:checked').val(),
			slideId = tooltip.find('#uslider-slide-id').val(),
			urlVal = tooltip.find('#ugallery-image-link-url').val()
		;
		if((linkVal == 'external' || linkVal == 'post') && urlVal)
			this.slides.get(slideId).set({urlType: linkVal, url: urlVal});
		else
			this.slides.get(slideId).set({urlType: 'original', url: ''});

		this.closeTooltip();
		return this.render();
	},

	openTooltip: function(content, element){
		var tooltip = $('#ugallery-tooltip'),
			elementPosition = element.offset(),
			tooltipPosition = {
				top: elementPosition.top + element.outerHeight(),
				left: elementPosition.left - 125 + Math.floor(element.outerWidth() / 2)
			},
			tooltipClass = 'ugallery-tooltip-bottom',
			me = this
		;
		if(!tooltip.length){
			tooltip = $('<div id="ugallery-tooltip" class="upfront-ui"></div>');
			$('body').append(tooltip);
		}
		tooltip.hide().html(content);
		elementPosition.right = elementPosition.left + element.width();
		if(elementPosition.left - 280 < 0){
			tooltipPosition.left = elementPosition.left + element.width() + 20;
			tooltipClass = 'ugallery-tooltip-bottom';
		}
		tooltip
			.css(tooltipPosition)
			.addClass(tooltipClass)
			.show()
			.on('click', function(e){
				e.stopPropagation();
			})
			.on('blur', function(e){
				me.closeTooltip();
			})
			.on('closed', function(e){
				me.$el.removeClass('tooltip-open');
			})
		;

		this.$el.addClass('tooltip-open');

		Upfront.Events.trigger("entity:settings:deactivate");
	},

	closeTooltip: function(){
		var tooltip = $('#ugallery-tooltip');
		tooltip.hide().trigger('closed');
		setTimeout(function(){
			tooltip.remove();
		}, 100);
	},


	/*
	Returns an object with the properties of the model in the form {name:value}
	*/
	extract_properties: function() {
		var model = this.model.get('properties').toJSON(),
			props = {}
		;
		_.each(model, function(prop){
			props[prop.name] = prop.value;
		});
		return props;
	},

	/*
	Shorcut to set and get model's properties.
	*/
	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
});


var SlidesField = Upfront.Views.Editor.Field.Field.extend({
	template: _.template($(editorTpl).find('#slides-setting-tpl').html()),
	events: {
		'click .uslider-add' : 'addSlides',
	},
	initialize: function(){
		this.slides = new Uslider_Slides(this.model.get_property_value_by_name('slides'));

		this.slides.on('add remove sort reset', this.updateSlides, this);

		this.model.on('slidesChanged', this.slidesChanged, this);
	},

	updateSlides: function(){
		this.model.set_property('slides', this.slides.toJSON());
	},

	slidesChanged: function(){
		this.slides = new Uslider_Slides(this.model.get_property_value_by_name('slides'));
		this.slides.on('add remove sort reset', this.updateSlides, this);
		this.render();
		setTimeout(function(){
			var settings = $('#settings');
			settings.height(settings.find('.upfront-settings_panel:visible').outerHeight());
		},100);
	},

	render: function() {
		var me = this;
		this.$el.html(this.template({slides: this.slides}));

		//Make the thumbs sortable
		this.$('.uslider-slides-setting').sortable({
			items: '.uslider_content_imgslide',
			start: function(event, ui) {
				ui.item.addClass('uslider-is-dragged');
			},
			stop: function(event, ui) {
				// When the drag stops we record the list of IDs into our array for use later.
				var slideId = ui.item.attr('rel'),
					newPosition = me.getSlidePosition(slideId),
					slide = false,
					slides = me.slides;
				if(newPosition != -1){
					slide = slides.get(slideId);
					slides.remove(slideId, {silent:true});
					me.slides.add(slide, {at: newPosition});
				}
			}
		});
	},

	addSlides: function(){
		this.model.trigger('addRequest');
	},
	getSlidePosition: function(slideId){
		var i = 0,
			found = false;
		this.$('div.uslider_content_slide').each(function(item){
			if($(this).attr('rel') == slideId)
				found = i;
			i++;
		});
		if(found !== false)
			return found;
		return -1;
	},
	get_name: function() {
		return 'slides';
	},
	get_value: function() {
		return this.slides.toJSON();
	}
});



/***********************************************************************************************************************************************
* Add Slider Menu Option
/**********************************************************************************************************************************************/

/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var USliderElement = Upfront.Views.Editor.Sidebar.Element.extend({
	draggable: true,
	/**
	 * Set up command appearance.
	 */
	render: function () {
		//this.$el.html(uslider_i18n['menu-add-slider']);
		this.$el.addClass('upfront-icon-element upfront-icon-element-slider');
		this.$el.html('Slider');
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with slider entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new USliderModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c10 upfront-slider_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 17}
				],
				"objects": [
					object
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

var USliderSettings = Upfront.Views.Editor.Settings.Settings.extend({
	/**
	 * Bootstrap the object - populate the internal
	 * panels array with the panel instances we'll be showing.
	 */
	initialize: function () {
		this.panels = _([
			new LayoutPanel({model: this.model}),
			new SlidesPanel({model: this.model})
		]);
	},
	/**
	 * Get the title (goes into settings title area)
	 * @return {string} Title
	 */
	get_title: function () {
		//return "Slider Module Settings";
		return 'Settings';
	}
});

var LayoutPanel =  Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function() {
		var me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;
		this.settings = _([
			new SettingsItem({
				title: '',
				group: false,
				className: 'uslider-rotate-settings',
				fields: [
					new Fields.Checkboxes({
						model: this.model,
						property: 'rotate',
						layout: 'horizontal-inline',
						multiple: true,
						values: [ { label: "Rotate every ", value: 'true' } ]
					}),
					new Fields.Number({
						model: this.model,
						property: 'rotateTime',
						min: 1,
						max: 60,
						step: 1,
						suffix: 'sec.'
					})
				]
			}),
			new SettingsItem({
				title: 'Transitions',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'transition',
						layout: 'horizontal-inline',
						icon_class: 'upfront-region-field-icon',
						className: 'uslider-transition-setting upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{ label: "Slide Down", value: 'slide-down', icon: 'bg-slider-slide-down' },
							{ label: "Slide Up", value: 'slide-up', icon: 'bg-slider-slide-up' },
							{ label: "Slide Right", value: 'slide-right', icon: 'bg-slider-slide-right' },
							{ label: "Slide Left", value: 'slide-left', icon: 'bg-slider-slide-left' },
							{ label: "Crossfade", value: 'crossfade', icon: 'bg-slider-crossfade' }
						]
					})
				]
			}),
			new SettingsItem({
				title: 'Slider Controls',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'controlsWhen',
						layout: 'horizontal-inline',
						className: 'uslider-controlswhen-setting upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
						values: [
							{ label: "show on hover", value: 'hover' },
							{ label: "always show", value: 'always' }
						]
					}),
					new Fields.Select({
						model: this.model,
						property: 'controls',
						values: [
							{label: 'Dots', value: 'dots'},
							{label: 'Arrows', value: 'arrows'},
							{label: 'Both', value: 'both'}
						]
					})
				]
			})
		]);
	},

	get_label: function(){
		return 'General';
	},

	get_title: function(){
		return false;
	}
});


var SlidesPanel =  Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function() {
		var me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;

		this.settings = _([
			new SettingsItem({
				title: 'Slides order',
				fields: [
					new SlidesField({
						model: this.model
					})
				]
			})
		]);
	},

	get_label: function(){
		return 'Slides';
	},

	get_title: function(){
		return false;
	}
});



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("USlider", {
	"Model": USliderModel,
	"View": USliderView,
	"Element": USliderElement,
	"Settings": USliderSettings
});
Upfront.Models.USliderModel = USliderModel;
Upfront.Views.USliderView = USliderView;

}); //End require

})(jQuery);
