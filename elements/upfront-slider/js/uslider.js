
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
	startingTpl: _.template($(editorTpl).find('#startingTpl').html()),

	initialize: function(options){
		var me = this;
		console.log('Uslider');
		if(! (this.model instanceof USliderModel)){
			this.model = new USliderModel({properties: this.model.get('properties')});
		}

		console.log('Uslider');

		this.constructor.__super__.initialize.call(this, [options]);

		this.events = _.extend({}, this.events, {
			'click .upfront-image-select': 'firstImageSelection',
			'click .upfront-icon-next': 'nextSlide',
			'click .upfront-icon-prev': 'prevSlide',
			'click .uslider-starting-options': 'checkStartingInputClick'
		});

		var slides = this.property('slides');
		this.slides = new Uslider_Slides(slides);

		this.listenTo(this.slides, 'add remove reset change', this.slidesChange);

		this.listenTo(this.model, 'addRequest', this.openImageSelector);

		this.lastStyle = this.property('primaryStyle');
		this.listenTo(this.model.get('properties'), 'change', this.checkStyles);

		this.listenTo(this.model, 'background', function(rgba){
			me.slides.each(function(slide){
				slide.set('captionBackground', rgba);
			});
		});

		this.listenTo(Upfront.Events, 'command:layout:save', this.saveResizing);
		this.listenTo(Upfront.Events, 'command:layout:save_as', this.saveResizing);

		//Temporary props for image resizing and cropping
		this.imageProps = {};
		this.cropHeight =  false;
		this.cropTimer =  false;
		this.cropTimeAfterResize =  10000;

		//Current Slide index
		this.currentSlide =  0;
	},

	on_edit: function(){
		return false;
	},

	get_content_markup: function() {
		var me = this,
			props = this.extract_properties(),
			rendered = {}
		;


		if(!this.slides.length){
			this.startingHeight = this.startingHeight || 225;
			return this.startingTpl({startingHeight: this.startingHeight});
		}

		//Stop autorotate
		props.rotate = false;

		props.dots = _.indexOf(['dots', 'both'], props.controls) != -1;
		props.arrows = _.indexOf(['arrows', 'both'], props.controls) != -1;

		this.slides = new Uslider_Slides(this.property('slides'));
		props.slides = this.slides.toJSON();

		props.slidesLength = props.slides.length;

		props.imageWidth = props.primaryStyle == 'side' ?  Math.round(props.rightImageWidth / props.rightWidth * 100) + '%' : '100%';
		props.textWidth =  props.primaryStyle == 'side' ? Math.round((props.rightWidth - props.rightImageWidth) / props.rightWidth * 100) + '%' : '100%';

		props.imageHeight = '100%';
		if(props.slides.length){
			var imageProps = me.imageProps[props.slides[0].id];
			if(imageProps)
				props.imageHeight = imageProps.size.height;
			else
				props.imageHeight = props.slides[0].cropSize.height
		}

		props.production = false;
		props.startingSlide = this.currentSlide;

		rendered = this.tpl(props);

		var $rendered = $('<div></div>').append(rendered);

		this.slides.each(function(slide){
			if(!me.imageProps[slide.id]){
				me.imageProps[slide.id] = {
					size: slide.get('size'),
					cropOffset: slide.get('cropOffset')
				};
			}

			var props = me.imageProps[slide.id],
				img = $rendered.find('.uslide[rel=' + slide.id + ']').height(props.size.height).find('img')
			;

			img.attr('src', slide.get('srcFull'))
				.css({
					position: 'absolute',
					width: props.size.width,
					height: props.size.height,
					top: 0-props.cropOffset.top,
					left: 0-props.cropOffset.left,
					'max-width': 'none',
					'max-height': 'none'
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

		this.controls = controls;

		me.$('.uslide').css({height: 'auto'});


		//Enable text editors
		me.$('.uslide-editable-text').ueditor({
				autostart: false,
				upfrontMedia: false,
				upfrontImages: false
			})
			.on('start', function(){
				var $this = $(this),
					id = $this.closest('.uslide').attr('rel'),
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

		if(me.property('primaryStyle') == 'side'){
			me.setImageResizable();
		}

		//Adapt slider height to the image crop
		var textHeight = this.property('primaryStyle') == 'below' ? this.$('.uslide-caption').outerHeight() : 0;
		me.$('.uslides').height(wrapper.height() + textHeight);
	},

	updateControls: function(){
		var controls = this.createControls();

		this.controls.remove();

		controls = this.createControls();
		controls.render();

		this.$('.uimage-controls').append(controls.$el);

		this.controls = controls;
	},

	get_buttons: function(){
		return this.property('slides').length ? '<a href="#" class="upfront-icon-button upfront-icon-button-nav upfront-icon-next"></a><a href="#" class="upfront-icon-button upfront-icon-button-nav upfront-icon-prev"></a>' : '';
	},

	nextSlide: function(e){
		e.preventDefault();
		this.$('.uslides').upfront_default_slider('next');
	},

	prevSlide: function(e){
		e.preventDefault();
		this.$('.uslides').upfront_default_slider('prev');
	},

	checkStyles: function() {
		var me = this,
			primary = this.property('primaryStyle'),
			defaults = {
				below: 'below',
				over: 'bottomOver',
				side: 'right'
			}
		;

		if(primary != this.lastStyle){
			this.slides.each(function(slide){
				var style = slide.get('style');
				if(primary == 'below' && _.indexOf(['below', 'above'], style) == -1 ||
					primary == 'over' && _.indexOf(['topOver', 'bottomOver', 'topCover', 'middleCover', 'bottomCover'], style) == -1 ||
					primary == 'side' && _.indexOf(['right', 'left'], style) == -1)
						slide.set('style', defaults[primary]);

				if(primary == 'side' || me.lastStyle == 'side'){
					var wrap = me.$('.uslide[rel=' + slide.id + ']').find('.uslide-image');
					me.imageProps[slide.id] = me.calculateImageResize({width: wrap.width(), height:wrap.height()}, slide);
				}
			});
			if(primary == 'side' || this.lastStyle == 'side')
				this.setTimer();
			this.lastStyle = primary;
			this.slidesChange();
		}

	},
	checkStartingInputClick: function(e){
		//Hack to make the radio buttons work in the starting layout
		e.stopPropagation(); //This is not a good practice
	},
	firstImageSelection: function(e){
		e.preventDefault();
		var primaryStyle = this.$el.find('input:checked').val(),
			style = 'nocaption'
		;
		if(primaryStyle == 'over')
			style = 'bottomOver';
		else if(primaryStyle == 'below')
			style = 'below';
		else if(primaryStyle == 'side')
			style = 'right';

		this.property('primaryStyle', primaryStyle);
		this.property('style', style);

		return this.openImageSelector();
	},

	setImageResizable: function(){
		var me = this,
			current = this.$('.upfront-default-slider-item-current'),
			$slide = current.find('.uslide-image'),
			elementWidth = me.$('.upfront-object').outerWidth(),
			elementCols, colWidth,
			text = current.find('.uslide-caption'),
			id = current.attr('rel'),
			slide = this.slides.get(id),
			height = false,
			style = slide.get('style')
		;

		//Stop any other resizable slide
		this.$('.ui-resizable').resizable('destroy');

		$slide.resizable({
			handles: slide.get('style') == 'right' ? 'e' : 'w',
			helper: 'uslider-resize-handler',
			start: function(e, ui){
				if(!ui.element.hasClass('uslide-image'))
					return;
				elementWidth = me.$('.upfront-object').outerWidth();
				elementCols = me.get_element_columns();
				colWidth = me.get_element_max_columns_px() / me.get_element_max_columns();
				height = $slide.height();

				ui.element.parent().closest('.ui-resizable').resizable('disable');

				$slide.resizable('option', {
					minWidth: colWidth * 3,
					maxWidth: (elementCols - 3) * colWidth,
					grid: [colWidth, 100], //Second number is never used (fixed height)
					handles: style == 'right' ? 'e' : 'w',
					helper: 'uslider-resize-handler',
					minHeigth: height,
					maxHeight: height
				});
			},
			resize: function(e, ui){
				if(!ui.element.hasClass('uslide-image'))
					return;
				var imageWidth = ui.helper.width(),
					textWidth = elementWidth - imageWidth - 30,
					textCss = {width: textWidth},
					imgCss = {width: imageWidth}
				;
				me.calculateImageResize({width: imageWidth, height: ui.element.height()}, slide);

				if(style == 'right')
					textCss['margin-left'] = imageWidth;
				else
					imgCss['margin-left'] = textWidth;

				text.css(textCss);
				$slide.css(imgCss);
			},
			stop: function(e, ui){
				if(!ui.element.hasClass('uslide-image'))
					return;
				var imageWidth = ui.helper.width(),
					imageCols = Math.round((imageWidth - (colWidth - 15))/ colWidth) + 1,
					percentage = Math.floor(imageCols / elementCols * 100)
				;

				$slide.css({width: percentage + '%'});

				me.slides.each(function(slide){
					me.imageProps[slide.id] = me.calculateImageResize({width: $slide.width(), height: ui.element.height()}, slide);
				});

				me.cropHeight = ui.element.height();

				me.property('rightImageWidth', imageCols, false);

				me.setTimer();
				me.parent_module_view.$el.children('.upfront-module').resizable('enable');
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
				me.currentSlide = index;
				me.updateControls();
				me.$('.uimage-controls').attr('rel', slide.attr('rel'));
				if(me.property('primaryStyle') == 'side')
					me.setImageResizable();
			}
		});
	},

	createControls: function() {
		var me = this,
			panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
			multiBelow = {
				above: ['above', 'Above the image'],
				below: ['below', 'Below the image'],
				nocaption: ['nocaption', 'No text']
			},
			multiOver = {
				topOver: ['topOver', 'Over image, top'],
				bottomOver: ['bottomOver', 'Over image, bottom'],
				topCover: ['topCover', 'Covers image, top'],
				middleCover: ['middleCover', 'Covers image, middle'],
				bottomCover: ['bottomCover', 'Covers image, bottom'],
				nocaption: ['nocaption', 'No text']
			},
			multiSide = {
				right: ['right', 'At the right'],
				left: ['left', 'At the left'],
				nocaption: ['nocaption', 'No text']
			},
			primaryStyle = this.property('primaryStyle'),
			multiControls = {},
			multi = new Upfront.Views.Editor.InlinePanels.MultiControl(),
			panelItems = [],
			slide = this.slides.at(this.currentSlide)
		;

		multi.sub_items = {};
		if(primaryStyle == 'below')
			multiControls = multiBelow;
		else if(primaryStyle == 'over')
			multiControls = multiOver;
		else if(primaryStyle == 'side')
			multiControls = multiSide;
		else
			multiControls = false;
		if(multiControls){
			_.each(multiControls, function(opts, key){
				multi.sub_items[key] = me.createControl(opts[0], opts[1]);
			});

			multi.icon = 'caption';
			multi.tooltip = 'Caption position';
			multi.selected = multiControls[slide.get('style')] ? slide.get('style') : 'nocaption';
			multi.on('select', function(item){
				slide.set('style', item, false);
			});
		}

		panelItems.push(this.createControl('crop', 'Edit image', 'imageEditMask'));
		panelItems.push(this.createControl('link', 'Link slide', 'slideEditLink'));

		if(_.indexOf(['notext', 'onlytext'], primaryStyle) == -1)
			panelItems.push(multi);
		panelItems.push(this.createControl('remove', 'Remove slide', 'removeSlide'));

		panel.items = _(panelItems);

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

	openImageSelector: function(e, replaceId){
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
			me.addSlides(images, replaceId);
			Upfront.Views.Editor.ImageSelector.close();
		});
	},

	addSlides: function(images, replaceId){
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

		if(replaceId){
			this.slides.get(replaceId).set(slides[0]);
		}
		else
			this.slides.add(slides);
	},

	onElementResizeStart: function(e, ui){
		if(ui.element.hasClass('uslide-image') || this.$('.upfront-image-starting-select').length)
			return;

		var style = this.property('style'),
			me = this
		;

		this.calculateColumnWidth();

		if(_.indexOf(['nocaption', 'below', 'above', 'right', 'left'], style) == -1)
			this.$('.uslider-caption').fadeOut('fast');
		else if(style == 'right' || style == 'left'){
			ui.element.resizable('option', {
				minWidth: me.colWidth * 6
			});
			this.$('.uslide').css({height: '100%'});
		}
	},

	calculateColumnWidth: function(){
		return (this.colWidth = this.get_element_max_columns_px() / this.get_element_max_columns());
	},

	onElementResize: function(e, ui){
		if(ui.element.hasClass('uslide-image'))
			return;

		var starting = this.$('.upfront-image-starting-select');
		if(starting.length){
			this.startingHeight = $('.upfront-resize').height() - 30;
			return;
		}

		var me = this,
			mask = this.$('.upfront-default-slider-item-current').find('.uslide-image'),
			style = this.property('primaryStyle'),
			resizer = $('.upfront-resize'),
			text = this.property('primaryStyle') == 'below' ? this.$('.uslide-caption') : [],
			textHeight = text.length ? text.outerHeight() : 0,
			newElementSize = {width: style == 'side' ? mask.width() : resizer.outerWidth() - 30, height: resizer.outerHeight() - 30 - textHeight}
		;

		this.slides.each(function(slide){
			me.imageProps[slide.id] = me.calculateImageResize(newElementSize, slide);
		});

		me.cropHeight = newElementSize.height;

		if(style == 'side')
			this.property('rightImageWidth', Math.max(3, Math.round(newElementSize.width / this.colWidth)));
		this.property('rightWidth', this.get_element_columns());

		me.setTimer();
	},

	onElementResizing: function(e, ui){
		if(ui.element.hasClass('uslide-image'))
			return;

		var starting = this.$('.upfront-image-starting-select');
		if(starting.length)
			return starting.outerHeight($('.upfront-resize').height() - 30);

		var resizer = $('.upfront-resize'),
			current = this.$('.upfront-default-slider-item-current'),
			text = this.property('primaryStyle') == 'below' ? current.find('.uslide-caption') : [],
			textHeight = text.length ? text.outerHeight() : 0,
			newElementSize = {width: resizer.outerWidth() - 30, height: resizer.outerHeight() - 30 - textHeight},
			id = current.attr('rel'),
			slide = this.slides.get(id),
			imageWrapper= current.find('.uslide-image'),
			style = this.property('primaryStyle'),
			wrapperSize = {width: style == 'side' ? imageWrapper.width() : newElementSize.width, height: newElementSize.height},
			wrapperCss = {height: wrapperSize.height}
		;

		if(style == 'side')
			current.find('.uslide-caption').height(newElementSize.height);
		else
			wrapperCss.width = wrapperSize.width;

		//newElementSize.width = current.width();
		imageWrapper.css(wrapperCss)
			.closest('.uslide').height(newElementSize.height)
			.closest('.uslides').height(newElementSize.height)
		;

		this.calculateImageResize(wrapperSize, slide);
	},

	calculateImageResize: function(wrapperSize, slide){
		var img = this.$('.uslide[rel=' + slide.id + ']').find('img'),
			currentPosition = img.position(),
			imgSize = slide.get('size'),
			imgMargins = slide.get('cropOffset'),
			imgPosition = {top: - imgMargins.top, left: - imgMargins.left},
			imgRatio = imgSize.width / imgSize.height,
			wrapperRatio = wrapperSize.width / wrapperSize.height,
			pivot = imgSize.width / imgSize.height > wrapperSize.width / wrapperSize.height ? 'height' : 'width',
			other = pivot == 'height' ? 'width' : 'height'
		;

		if(pivot == 'height' && wrapperSize.height > imgSize.height)
			img.css({width: 'auto', height: '100%', top: 0, left: Math.min(0, Math.max(imgPosition.left, wrapperSize.width - imgSize.width))});
		else if(pivot == 'width' && wrapperSize.width > imgSize.width)
			img.css({width: '100%',	height: 'auto',	left: 0, top: Math.min(0, Math.max(imgPosition.top, wrapperSize.height - imgSize.height))});
		else
			img.css({
				height: imgSize.height,
				width: imgSize.width,
				top: Math.max(imgPosition.top, wrapperSize.height - imgSize.height),
				left: Math.max(imgPosition.left, wrapperSize.width - imgSize.width)
			});

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
					rotation: result.rotation,
					id: result.imageId
				});
				me.imageProps[slide.id] = {
					cropOffset: result.imageOffset,
					size: result.imageSize
				};
				me.render();
			})
			.fail(function(data){
				if(data && data.reason == 'changeImage')
					me.openImageSelector(null, data.id);
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
			rotation: image.get('rotation')
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

	cleanup: function(){
		this.controls.remove();
		this.controls = false;
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

		this.listenTo(this.slides, 'add remove sort reset', this.updateSlides);
		this.listenTo(this.model, 'slidesChanged', this.slidesChanged);
	},

	updateSlides: function(){
		this.model.set_property('slides', this.slides.toJSON());
	},

	slidesChanged: function(){
		this.slides = new Uslider_Slides(this.model.get_property_value_by_name('slides'));

		this.listenTo(this.slides, 'add remove sort reset', this.updateSlides);
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
	className: 'upfront-settings_panel_wrap uslider-settings',
	initialize: function() {
		var me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
		;
		this.settings = _([
			new SettingsItem({
				title: 'Slider styles',
				className: 'uslider-style-setting',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'primaryStyle',
						layout: 'horizontal-inline',
						values: [
							{ label: "no txt", value: 'notext', icon: 'nocaption' },
							{ label: "txt below", value: 'below', icon: 'below' },
							{ label: "txt over", value: 'over', icon: 'bottomOver' },
							{ label: "txt on side", value: 'side', icon: 'right' }/*,
							{ label: "txt / widget only", value: 'onlytext', icon: 'textonly' }*/
						]
					})
				]
			}),
			new ColorPickerField({
				title: 'Caption Background',
				fields: [
					new Fields.Radios({
						model: this.model,
						property: 'captionUseBackground',
						layout: "horizontal-inline",
						values: [
							{value: '0', label: 'None'},
							{value: '1', label: 'Pick color'}
						]
					}),
				]
			}),
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
				className: 'uslider-transition-setting',
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

		this.on('rendered', function(){
			me.toggleColorSetting();
			var spectrum = false,
				currentColor = me.model.get_property_value_by_name('captionBackground'),
				input = $('<input type="text" value="' + currentColor + '">'),
				setting = me.$('.ugallery-colorpicker-setting')
			;

			setting.find('.upfront-field-wrap').append(input);
			setting.find('input[name="captionUseBackground"]').on('change', function(){
				me.toggleColorPicker();
			});

			input.spectrum({
				showAlpha: true,
				showPalette: true,
				palette: ['fff', '000', '0f0'],
				maxSelectionSize: 9,
				localStorageKey: "spectrum.recent_bgs",
				preferredFormat: "hex",
				chooseText: "Ok",
				showInput: true,
			    allowEmpty:true,
			    show: function(){
					spectrum = $('.sp-container:visible');
			    },
				change: function(color) {
					var rgba = color.toRgbString();
					me.model.set_property('captionBackground', rgba, true);
					currentColor = rgba;
					me.model.trigger('background', rgba);
				},
				move: function(color) {
					var rgba = color.toRgbString();
					spectrum.find('.sp-dragger').css('border-top-color', rgba);
					spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
					me.parent_view.for_view.$el.find('.uslide-caption').css('background-color', rgba);
				},
				hide: function(){
					me.parent_view.for_view.$el.find('.uslide-caption').css('background-color', currentColor);
				}
			});
			setting.find('.sp-replacer').css('display', 'inline-block');
			me.toggleColorPicker();
		});

		this.$el.on('change', 'input[name="primaryStyle"]', function(e){
			me.toggleColorSetting();
		});
	},

	toggleColorSetting: function(){
		var style = this.$('.uslider-style-setting').find('input:checked').val();
		if(style == 'notext')
			this.$('.ugallery-colorpicker-setting').hide();
		else
			this.$('.ugallery-colorpicker-setting').show();
	},

	toggleColorPicker: function(){
		var setting = this.$('.ugallery-colorpicker-setting'),
			color = setting.find('input:checked').val(),
			picker = setting.find('.sp-replacer')
		;
		if(color == "1"){
			picker.show();
		}
		else{
			picker.hide();
		}
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


var ColorPickerField = Upfront.Views.Editor.Settings.Item.extend({
	className: 'ugallery-colorpicker-setting'
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
