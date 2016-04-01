(function ($) {

define([
	'text!elements/upfront-slider/tpl/uslider.html',
	'text!elements/upfront-slider/tpl/backend.html',
	'elements/upfront-slider/js/settings',
	'scripts/upfront/preset-settings/util',
	"scripts/upfront/link-model",
	'text!elements/upfront-slider/tpl/preset-style.html',
], function(sliderTpl, editorTpl, SliderSettings, PresetUtil, LinkModel, settingsStyleTpl){

var l10n = Upfront.Settings.l10n.slider_element;

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
	startingTpl: _.template($(editorTpl).find('#startingTpl').html()),

	initialize: function(options){
		var me = this;
		if(! (this.model instanceof USliderModel)){
			this.model = new USliderModel({properties: this.model.get('properties')});
		}

		this.model.view = this;

		this.constructor.__super__.initialize.call(this, [options]);

		this.events = _.extend({}, this.events, {
			'click .upfront-image-select': 'firstImageSelection',
			'click .upfront-icon-next': 'nextSlide',
			'click .upfront-icon-prev': 'prevSlide',
			'click .uslider-starting-options': 'checkStartingInputClick'
		});
		
		//Update slide defaults to match preset settings
		this.updateSlideDefaults();

		this.model.slideCollection = new Uslider_Slides(this.property('slides'));

		this.listenTo(this.model.slideCollection, 'add remove reset change', this.onSlidesCollectionChange);
		this.listenTo(this.model, 'change', this.onModelChange);

		this.listenTo(this.model, 'addRequest', this.openImageSelector);

		this.lastStyle = this.get_preset_properties().primaryStyle;

		this.listenTo(this.model, 'background', function(rgba){
			me.model.slideCollection.each(function(slide){
				slide.set('captionBackground', rgba);
			});
		});

		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
		this.listenTo(Upfront.Events, "preset:slider:updated", this.caption_updated, this);

		this.listenTo(this.model, "preset:updated", this.preset_updated);

		this.listenTo(Upfront.Events, 'command:layout:save', this.saveResizing);
		this.listenTo(Upfront.Events, 'command:layout:save_as', this.saveResizing);

		//Temporary props for image resizing and cropping
		this.imageProps = {};
		this.cropHeight =  false;
		this.cropTimer =  false;
		this.cropTimeAfterResize = 500;

		//Current Slide index
		this.setCurrentSlide(0);
	},
	
	updateSlideDefaults: function() {
		primary = this.get_preset_properties().primaryStyle,
			defaults = {
				below: 'below',
				over: 'bottomOver',
				side: 'right'
			}
		;

		Upfront.data.uslider.slideDefaults.style = defaults[primary];
	},

	get_preset_properties: function() {
		var preset = this.model.get_property_value_by_name("preset"),
			props = PresetUtil.getPresetProperties('slider', preset) || {};

		return props;
	},

	/**
	 * Returns preset propery value
	 * @param key
	 * @returns {boolean}
     */
	get_preset_property: function(key){
		var preset_props = this.get_preset_properties();
		return preset_props[key] ? preset_props[key] : false;
	},

	preset_updated: function(preset) {
		this.render();
		Upfront.Events.trigger('preset:slider:updated', preset);
	},
	
	caption_updated: function(preset) {
		var currentPreset = this.model.get_property_value_by_name("preset");

		//If element use updated preset re-render
		if(currentPreset === preset) this.render();
	},

	update_colors: function () {

		var props = this.get_preset_properties();

		if (_.size(props) <= 0) return false; // No properties, carry on

		PresetUtil.updatePresetStyle('slider', props, settingsStyleTpl);

	},

	on_edit: function(){
		return false;
	},

	get_content_markup: function() {
		var me = this,
			props,
			rendered = {};

		this.checkStyles();

		props = this.extract_properties();

		if(!this.model.slideCollection.length){
			this.startingHeight = this.startingHeight || 225;
			return this.startingTpl({startingHeight: this.startingHeight, l10n: l10n});
		}

		props.properties = this.get_preset_properties();

		// Overwrite properties with preset properties
		if (this.property('usingNewAppearance')) {
			if (props.properties.primaryStyle) {
				props.primaryStyle = props.properties.primaryStyle;
			}
			if (props.properties.captionBackground) {
				props.captionBackground = props.properties.captionBackground;
			}
		}

		//Stop autorotate
		props.rotate = false;

		props.dots = _.indexOf(['dots', 'both'], props.controls) != -1;
		props.arrows = _.indexOf(['arrows', 'both'], props.controls) != -1;

		props.slides = this.model.slideCollection.toJSON();

		props.slidesLength = props.slides.length;

		props.imageWidth = props.primaryStyle == 'side' ?  Math.round(props.rightImageWidth / props.rightWidth * 100) + '%' : '100%';
		props.textWidth =  props.primaryStyle == 'side' ? Math.round((props.rightWidth - props.rightImageWidth) / props.rightWidth * 100) + '%' : '100%';

		props.imageHeight = '100%';
		if (props.slides.length) {
			var imageProps = me.imageProps[props.slides[0].id];
			if (imageProps) {
				props.imageHeight = imageProps.cropSize.height;
			} else {
				props.imageHeight = props.slides[0].cropSize.height;
			}
		}

		props.production = false;
		props.startingSlide = this.getCurrentSlide();

		props.l10 = l10n;

		props.usingNewAppearance = props.usingNewAppearance || false;

		rendered = this.tpl(props);

		var $rendered = $('<div></div>').append(rendered);

		this.model.slideCollection.each(function(slide){
			if(!me.imageProps[slide.id]){
				me.imageProps[slide.id] = {
					size: slide.get('size'),
					cropOffset: slide.get('cropOffset'),
					cropSize: slide.get('cropSize')
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

		setTimeout( function() {
			var slider = me.$el.find('.upfront-output-uslider'),
			options = slider.find('.uslider').data();

			slider.find('.uslides').on('rendered', function(){
				Upfront.Events.trigger('entity:object:refresh', me);
			});
			slider.find('.uslides').upfront_default_slider(options);

			slider.find('.uslide-above').each(function(){
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide);
			});
			slider.find('.uslide-left').each(function(){
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide);
			});
			slider.find('.uslide-bottomOver, .uslide-middleCover, .uslide-bottomCover, .uslide-topCover').each(function() {
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide.find('.uslide-image'));
			});
			me.prepareSlider();
		}, 100);

		if(!me.parent_module_view)
			return;

		//Bind resizing events
		if(!me.parent_module_view.$el.data('resizeHandling')){
			me.parent_module_view.$el
				.on('resizestart', $.proxy(me.onElementResizeStart, me))
				.on('resize', $.proxy(me.onElementResizing, me))
				.on('resizestop', $.proxy(me.onElementResize, me))
				.data('resizeHandling', true)
			;
		}

		if(!this.model.slideCollection.length)
			return;

		if(!this.$el.parent().length) {
			setTimeout(function(){
				me.on_render();
			}, 100);
		}


		this.update_caption_controls();
	},

	update_caption_controls: function(){
		if (!Upfront.Application.user_can_modify_layout()) return false;
		
		var me = this,
			panel = new Upfront.Views.Editor.InlinePanels.Panel()
			;

		panel.items = this.getControlItems();
		panel.render();
		_.delay( function(){
			me.controls.$el.html( panel.$el );
			me.controls.$el.css("width", "auto");
			me.updateSlideControls();
		}, 400);
	},
	hideSliderNavigation: function(){
		this.$('.upfront-default-slider-nav').hide();
		this.$('.upfront-default-slider-nav-prev').hide();
		this.$('.upfront-default-slider-nav-next').hide();

		this
			.listenTo(Upfront.Events, 'csseditor:open', function(elementId){
				if(elementId == this.property('element_id')){
					this.$('.upfront-default-slider-nav').show();
					this.$('.upfront-default-slider-nav-prev').show();
					this.$('.upfront-default-slider-nav-next').show();
				}
			})
			.listenTo(Upfront.Events, 'csseditor:closed', function(elementId){
				if(elementId == this.property('element_id')){
					this.$('.upfront-default-slider-nav').hide();
					this.$('.upfront-default-slider-nav-prev').hide();
					this.$('.upfront-default-slider-nav-next').hide();
				}
			})
		;
	},

	prepareSlider: function(){
		var me = this,
			wrapper = me.$('.uslide-image'),
			//controls = me.createSlideControls(),
			text = me.$('.uslide-editable-text'),
			currentSlide = this.model.slideCollection.at(this.getCurrentSlide())
		;

		// controls.setWidth(wrapper.width());
		// controls.render();
		// if(typeof(currentSlide) != 'undefined') {
		// 	me.$('.uslides').append(
		// 		$('<div class="uimage-controls upfront-ui" rel="' + currentSlide.id + '"></div>').append(controls.$el)
		// 	);
		// }
		me.onSlideShow();

		// this.controls = controls;

		me.$('.uslide').css({height: 'auto'});

		//Enable text editors
		text.each(function () {
			var text = $(this); // Re-bind to local
			if (text.data('ueditor')) return true; // If ueditor is already up, carry on

			text.ueditor({
					autostart: false,
					upfrontMedia: false,
					upfrontImages: false,
					placeholder: l10n.slide_desc,
					linebreaks: false,
					inserts: []
				})
				.on('start', function() {
					var id = $(this).closest('.uslide').attr('rel'),
						slide = me.model.slideCollection.get(id)
					;

					me.$el.addClass('upfront-editing');
					Upfront.Events.trigger('upfront:element:edit:start', 'text');

					$(this).on('syncAfter', function(){
						slide.set('text', $(this).html(), {silent: true});
					})
					.on('stop', function(){
						slide.set('text', $(this).html());
						me.property('slides', me.model.slideCollection.toJSON());
						me.$el.removeClass('upfront-editing');

						Upfront.Events.trigger('upfront:element:edit:stop');

						// Trigger cleanup if possible
						var ed = $(this).data('ueditor');
						if (ed.redactor) ed.redactor.events.trigger('cleanUpListeners');

						me.render();
					});
				})
			;
		});

		if(me.get_preset_properties().primaryStyle == 'side'){
			me.setImageResizable();
		}

		//Adapt slider height to the image crop
		if(typeof(currentSlide) != 'undefined') {
			var textHeight = this.get_preset_properties().primaryStyle == 'below' ? this.$('.uslide[rel=' + currentSlide.id + ']').find('.uslide-caption').outerHeight() : 0;
			me.$('.uslides').css({ 'padding-top' : wrapper.height() + textHeight});
		}
	},

	updateSlideControls: function(){
		// if(typeof(this.controls) !== 'undefined') {
		// 	this.controls.remove();
		// }

		// var controls = this.createSlideControls();
		// controls.render();

		// this.$('.uimage-controls').append(controls.$el);

		// if(typeof(this.model.slideCollection.at(this.getCurrentSlide())) !== 'undefined') {
		// 	this.$('.uimage-controls').attr('rel', this.model.slideCollection.at(this.getCurrentSlide()).id);
		// }

		// this.controls = controls;

		if(typeof(this.$control_el) !== 'undefined') {
			this.$control_el.find('.upfront-element-controls').remove();
		}

		if(typeof(this.controls) !== 'undefined') {
			this.controls = undefined;
		}
		
		this.updateControls();
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
			primary = this.get_preset_properties().primaryStyle,
			defaults = {
				below: 'below',
				over: 'bottomOver',
				side: 'right'
			}
		;

		if(primary != this.lastStyle){
			this.model.slideCollection.each(function(slide){
				var style = slide.get('style');
				if(primary == 'below' && _.indexOf(['below', 'above'], style) == -1 ||
					primary == 'over' && _.indexOf(['topOver', 'bottomOver', 'topCover', 'middleCover', 'bottomCover'], style) == -1 ||
					primary == 'side' && _.indexOf(['right', 'left'], style) == -1)
						slide.set('style', defaults[primary]);

					var wrap = me.$('.uslide[rel=' + slide.id + ']').find('.uslide-image');
					me.imageProps[slide.id] = me.calculateImageResize({width: wrap.width(), height:wrap.height()}, slide);
			});

			this.setTimer();
			this.lastStyle = primary;
			this.onSlidesCollectionChange();
		}
	},
	checkStartingInputClick: function(e){
		//Hack to make the radio buttons work in the starting layout
		e.stopPropagation(); //This is not a good practice
	},
	firstImageSelection: function(e){
		e.preventDefault();
		var primaryStyle = this.get_preset_properties().primaryStyle,
			style = 'nocaption'
		;
		if(primaryStyle == 'over')
			style = 'bottomOver';
		else if(primaryStyle == 'below')
			style = 'below';
		else if(primaryStyle == 'side')
			style = 'right';

		this.property('style', style);

		return this.openImageSelector();
	},

	setImageResizable: function(){
		if(!this.model.slideCollection.length) return;

		var me = this,
			current = this.$('.upfront-default-slider-item-current'),
			$slide = current.find('.uslide-image'),
			elementWidth = me.$('.upfront-object').outerWidth(),
			elementCols, colWidth,
			text = current.find('.uslide-caption'),
			id = current.attr('rel'),
			slide = this.model.slideCollection.get(id) || this.model.slideCollection.at(this.getCurrentSlide()),
			height = false,
			style = slide.get('style')
		;

		//Stop any other resizable slide
		this.$('.ui-resizable').resizable('destroy');

		if(style == 'nocaption')
			return;

		$slide.resizable({
			handles: style == 'right' ? 'e' : 'w',
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
				var helperWidth = ui.helper.width(),
					imageWidth = helperWidth > (elementCols - 3) * colWidth ? (elementCols - 3) * colWidth : (helperWidth < 3 * colWidth ? 3 * colWidth : helperWidth),
					imageCols = Math.round((imageWidth - (colWidth - 15))/ colWidth) + 1,
					percentage = Math.floor(imageCols / elementCols * 100)
				;

				$slide.css({width: percentage + '%'});

				me.model.slideCollection.each(function(slide){
					if(slide.get('style') != 'nocaption')
						me.imageProps[slide.id] = me.calculateImageResize({width: $slide.width(), height: ui.element.height()}, slide);
				});

				me.cropHeight = ui.element.height();

				me.property('rightWidth', elementCols, true);
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
		me.cropTimer = setTimeout(function() {
			var slide = me.model.slideCollection.at(me.getCurrentSlide()),
				editor = me.$('.uslide[rel=' + slide.id + ']').find('.uslide-editable-text');

			if (editor.length && editor.data('redactor')) {
				editor.on('stop', function(){
					me.saveTemporaryResizing();
				});
			} else {
				me.saveTemporaryResizing();
			}
		}, me.cropTimeAfterResize);
	},

	onSlideShow: function(){
		var me = this;
		this.$('.uslides').on('slidein', function(e, slide, index){
			if(slide){
				me.setCurrentSlide(index);
				me.updateSlideControls();
				me.$('.uimage-controls').attr('rel', slide.attr('rel'));
				if(me.get_preset_properties().primaryStyle == 'side')
					me.setImageResizable();

				if(me.get_preset_properties().primaryStyle == 'below'){
					//Adapt the height to take care of the caption
					me.$('.uslides').css({ 'padding-top' : slide.find('.uslide-image').outerHeight() + slide.find('.uslide-caption').outerHeight()});
				}
			}
		});
	},

	// createSlideControls: function() {
	// 	var me = this,
	// 		panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
	// 		multiBelow = {
	// 			above: ['above', l10n.above_img],
	// 			below: ['below', l10n.below_img],
	// 			nocaption: ['nocaption', l10n.no_text]
	// 		},
	// 		multiOver = {
	// 			topOver: ['topOver', l10n.over_top],
	// 			bottomOver: ['bottomOver', l10n.over_bottom],
	// 			topCover: ['topCover', l10n.cover_top],
	// 			middleCover: ['middleCover', l10n.cover_mid],
	// 			bottomCover: ['bottomCover', l10n.cover_bottom],
	// 			nocaption: ['nocaption', l10n.no_text]
	// 		},
	// 		multiSide = {
	// 			right: ['right', l10n.at_right],
	// 			left: ['left', l10n.at_left],
	// 			nocaption: ['nocaption', l10n.no_text]
	// 		},
	// 		primaryStyle = this.get_preset_properties().primaryStyle,
	// 		multiControls = {},
	// 		captionControl = new Upfront.Views.Editor.InlinePanels.TooltipControl(),
	// 		panelItems = [],
	// 		slide = this.model.slideCollection.at(this.getCurrentSlide())
	// 	;

	// 	captionControl.sub_items = {};
	// 	if(primaryStyle == 'below')
	// 		multiControls = multiBelow;
	// 	else if(primaryStyle == 'over')
	// 		multiControls = multiOver;
	// 	else if(primaryStyle == 'side')
	// 		multiControls = multiSide;
	// 	else
	// 		multiControls = false;
	// 	if(multiControls){
	// 		_.each(multiControls, function(opts, key){
	// 			captionControl.sub_items[key] = me.createControl(opts[0], opts[1]);
	// 		});

	// 		captionControl.icon = 'caption';
	// 		captionControl.tooltip = l10n.cap_position;
	// 		captionControl.selected = multiControls[slide.get('style')] ? slide.get('style') : 'nocaption';
	// 		this.listenTo(captionControl, 'select', function(item){
	// 			var previousStyle = slide.get('style');
	// 			slide.set('style', item);
	// 			me.onSlidesCollectionChange();
	// 			if(primaryStyle == 'side' && previousStyle == 'nocaption' || item == 'nocaption'){
	// 				//give time to the element to render
	// 				setTimeout(function(){
	// 					var wrap = me.$('.upfront-default-slider-item-current').find('.uslide-image');
	// 					me.imageProps[slide.id] = me.calculateImageResize({width: wrap.width(), height: wrap.height()}, slide);
	// 					me.setTimer();
	// 				}, 100);
	// 			}
	// 		});
	// 	}

	// 	panelItems.push(this.createControl('crop', l10n.edit_img, 'imageEditMask'));

 	//    	// panelItems.push(this.createLinkControl(slide));

	// 	panelItems.push(this.createControl('remove', l10n.remove_slide, 'onRemoveSlide'));

	// 	panel.items = _(panelItems);

	// 	return panel;
	// },

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

	createLinkControl: function() {
		var me = this,
			slide = this.model.slideCollection.at(this.getCurrentSlide()),
			control = new Upfront.Views.Editor.InlinePanels.DialogControl(),
			link;

		if (this.currentSlideLink) {
			this.stopListening(this.currentSlideLink);
		}

		if (typeof(slide) !== 'undefined' && typeof(slide.get('link')) !== 'undefined') {
			link = new LinkModel(slide.get('link'));
		} else {
			link = new LinkModel({
				type: slide?slide.get('urlType'):'',
				url: slide?slide.get('url'):'',
				target: slide?slide.get('linkTarget'):''
			});
		}
		control.view = linkPanel = new Upfront.Views.Editor.LinkPanel({
			model: link,
			linkTypes: { image: true },
			imageUrl: slide?slide.get('srcFull'):''
		});

		this.listenTo(control, 'panel:ok', function(){
			control.close();
		});

		me.listenTo(control, 'panel:open', function(){
			control.$el
				.closest('.uimage-controls')
					.addClass('upfront-control-visible').end()
				.closest('.uslider-link')
					.removeAttr('href') //Deactivate link when the panel is open
			;

			me.$el.closest('.ui-draggable').draggable('disable');
			me.$('.uimage').sortable('disable');
		});

		me.listenTo(control, 'panel:close', function(){
			control.$el
				.closest('.uimage-controls')
					.removeClass('upfront-control-visible').end()
				.closest('.uslider-link')
					.attr('href', typeof(slide) !== 'undefined' ? slide.get('url') : '')
			;

			me.$el.closest('.ui-draggable').draggable('enable');
		});

		me.listenTo(link, 'change', function(data) {
			slide.set({link: data.toJSON()}, {silent:true});
			// Rather than changing template rendering set properties that tempalte uses also
			slide.set({
				urlType: data.get('type'),
				url: data.get('url'),
				linkTarget: data.get('target')
			}, {silent:true});

			me.property('slides', me.model.slideCollection.toJSON(), true);
		});

		me.listenTo(link, 'change:target', function(data) {
			slide.set({link: data.toJSON()}, {silent:true});
			// Rather than changing template rendering set properties that tempalte uses also
			slide.set({
				urlType: data.get('type'),
				url: data.get('url'),
				linkTarget: data.get('target')
			}, {silent:true});

			me.property('slides', me.model.slideCollection.toJSON(), true);

			me.$el.find('.upfront-default-slider-item-current a')
				.attr('target', data.get('target'));
		});
		this.currentSlideLink = link;

		control.icon = 'link';
		control.tooltip = l10n.img_link;
		control.id = 'link';


		return control;
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

	onSlidesCollectionChange: function(){
		this.property('slides', this.model.slideCollection.toJSON(), false);
	},

	onModelChange: function() {
		if (this.stopListeningTo) {
			this.stopListeningTo(this.model.slideCollection);
			this.model.slideCollection = new Uslider_Slides(this.property('slides'));
			this.listenTo(this.model.slideCollection, 'add remove reset change', this.onSlidesCollectionChange);
		}
		this.render();
	},

	openImageSelector: function(e, replaceId){
		var me = this,
			sizer = this.model.slideCollection.length ? this.$('.upfront-default-slider-item-current').find('.uslide-image') : this.$('.upfront-object-content'),
			selectorOptions = {
				multiple: true,
				preparingText: l10n.preparing_img,
				element_id: this.model.get_property_value_by_name("element_id"),
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
			this.model.slideCollection.get(replaceId).set(slides[0]);
			this.onSlidesCollectionChange();
		}
		else
			this.model.slideCollection.add(slides);
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
		return (this.colWidth = Upfront.Behaviors.GridEditor.col_size);
	},

	onElementResize: function(e, ui){
		if (ui.element.hasClass('uslide-image')) return;

		var starting = this.$('.upfront-image-starting-select');
		if (starting.length) {
			this.startingHeight = $('.upfront-resize').height() - 30;
			return;
		}

		var me = this,
			mask = this.$('.upfront-default-slider-item-current').find('.uslide-image'),
			currentSlide = this.model.slideCollection.at(this.getCurrentSlide()),
			style = this.get_preset_properties().primaryStyle,
			resizer = $('.upfront-resize'),
			text = style == 'below' ? this.$('.uslide-caption') : [],
			textHeight = text.length ? text.outerHeight() : 0,
			newElementSize = {width: resizer.outerWidth() - 30, height: resizer.outerHeight() - 30 - textHeight},
			elementColumns = Upfront.Util.width_to_col(resizer.outerWidth()),
			imageColumns = Math.max(3, Math.round(this.property('rightImageWidth') * elementColumns / this.property('rightWidth'))),
			sideImageWidth = imageColumns * this.calculateColumnWidth()
		;

		this.model.slideCollection.each(function (slide) {
			var imageSize = {height: newElementSize.height};
			imageSize.width = style == 'side' && slide.get('style') != 'nocaption' ? sideImageWidth : newElementSize.width;
			me.imageProps[slide.id] = me.calculateImageResize(imageSize, slide);
		});

		me.cropHeight = newElementSize.height;

		if (style == 'side') {
			this.property('rightImageWidth', imageColumns);
		}
		this.property('rightWidth', elementColumns);

		me.setTimer();
	},

	onElementResizing: function(e, ui){
		if (ui.element.hasClass('uslide-image')) return;

		var starting = this.$('.upfront-image-starting-select');
		if (starting.length) return starting.outerHeight($('.upfront-resize').height() - 30);

		var resizer = $('.upfront-resize'),
			current = this.$('.upfront-default-slider-item-current'),
			text = this.get_preset_properties().primaryStyle == 'below' ? current.find('.uslide-caption') : [],
			textHeight = text.length ? text.outerHeight() : 0,
			newElementSize = {width: resizer.outerWidth() - 30, height: resizer.outerHeight() - 30 - textHeight},
			id = current.attr('rel'),
			slide = this.model.slideCollection.get(id),
			imageWrapper= current.find('.uslide-image'),
			style = this.get_preset_properties().primaryStyle,
			wrapperSize = {width: style == 'side' ? imageWrapper.width() : newElementSize.width, height: newElementSize.height},
			wrapperCss = {height: wrapperSize.height}
		;

		if (style == 'side') {
			current.find('.uslide-caption').height(newElementSize.height);
		} else {
			wrapperCss.width = wrapperSize.width;
		}

		//newElementSize.width = current.width();
		imageWrapper.css(wrapperCss)
			.closest('.uslide').height(newElementSize.height)
			.closest('.uslides').css({'padding-top' : newElementSize.height})
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

		if (pivot == 'height' && wrapperSize.height > imgSize.height) {
// Old style, using CSS
//img.css({width: 'auto', height: '100%', top: 0, left: Math.min(0, Math.max(imgPosition.left, wrapperSize.width - imgSize.width))});
			var final_width = wrapperSize.height / imgSize.height * imgSize.width;
			img.css({width: final_width, height: wrapperSize.height, top: 0, left: Math.min(0, Math.max(imgPosition.left, wrapperSize.width - imgSize.width))});
		} else if (pivot == 'width' && wrapperSize.width > imgSize.width) {
// Old style, using CSS
//img.css({width: '100%',	height: 'auto',	left: 0, top: Math.min(0, Math.max(imgPosition.top, wrapperSize.height - imgSize.height))});
			var final_height = wrapperSize.width / imgSize.width * imgSize.height;
			img.css({width: wrapperSize.width,	height: final_height,	left: 0, top: Math.min(0, Math.max(imgPosition.top, wrapperSize.height - imgSize.height))});
		} else {
			img.css({
				height: imgSize.height,
				width: imgSize.width,
				top: Math.max(imgPosition.top, wrapperSize.height - imgSize.height),
				left: Math.max(imgPosition.left, wrapperSize.width - imgSize.width)
			});
		}

		// Re-adjust wrappers! They're only being adjusted for the currently active slide
		img.closest(".uslide-image")
			.width(Math.min(img.width(), wrapperSize.width))
			.height(Math.min(img.height(), wrapperSize.height))
		;

		return {
			size: {width: img.width(), height: img.height()},
			cropOffset: {left: 0-img.position().left, top: 0-img.position().top},
			cropSize: wrapperSize
		};
	},

	saveTemporaryResizing: function(){
		var me = this,
			imagesData = [],
			editOptions = {action: 'upfront-media-image-create-size'},
			sentData = {},
			element_id = this.model.get_property_value_by_name("element_id")
		;
		this.model.slideCollection.each(function(slide){
			var imageProps =  me.imageProps[slide.id],
				crop = imageProps.cropOffset,
				data
			;
			crop.width = imageProps.cropSize.width;
			crop.height = imageProps.cropSize.height;

			data = {
				id: slide.id,
				element_id: element_id,
				rotate: slide.get('rotation'),
				resize: imageProps.size,
				crop: crop
			};
			imagesData.push(data);
			sentData[slide.id] = data;
		});

		editOptions.images = imagesData;

		return Upfront.Util.post(editOptions).done(function(response){
			var images = response.data.images;
			_.each(images, function(data, id){
				var slide = me.model.slideCollection.get(id),
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

			//Clear the timeout
			clearTimeout(me.cropTimer);
			me.cropTimer = false;

			me.imageProps = {};
			me.onSlidesCollectionChange();
		});
	},

	saveResizing: function(){
		var me = this;
		if (this.cropTimer) {
			this.saveTemporaryResizing().done(function(){
				var saveData = {
					element: JSON.stringify(Upfront.Util.model_to_json(me.model)),
					action: 'upfront_update_layout_element'
				};
				Upfront.Util.post(saveData).done();
			});
		}
	},

	onRemoveSlide: function(e) {
		// var item = $(e.target).closest('.uimage-controls');
		this.removeSlide(/*item*/);
	},

	// removeSlide: function(item) {
	removeSlide: function() {
		this.startingHeight = this.$('.upfront-slider').height();

		if (confirm(l10n.delete_slide_confirm)) {
			// It's very important that next line goes before removing slide from collection
			var currentSlide = this.getCurrentSlide();
			this.setCurrentSlide( currentSlide > 0 ? currentSlide - 1 : 0 );
			this.model.slideCollection.remove(this.model.slideCollection.at(currentSlide).id);
		}
	},

	getCurrentSlide: function() {
		return this.currentSlide;
	},

	setCurrentSlide: function(number) {
		this.currentSlide = number;
	},

	imageEditMask: function(e) {
		var me = this,
			item = $(e.target).closest('.uimage-controls'),
			currentSlide = this.model.slideCollection.at(this.getCurrentSlide()),
			slide = this.model.slideCollection.get(currentSlide.id),
			editorOpts = this.getEditorOptions(slide)
		;
		
		if (!Upfront.Application.user_can("RESIZE")) return false;	

		if(slide.get('status') != 'ok'){
			var selectorOptions = {
				multiple: false,
				preparingText: l10n.preparing_slides,
				element_id: me.model.get_property_value_by_name("element_id")
			};
			return Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){
				me.addSlides(images);

				var index = me.model.slideCollection.indexOf(slide);
				me.model.slideCollection.remove(slide, {silent:true});

				var newSlide = me.model.slideCollection.at(me.model.slideCollection.length -1);
				me.model.slideCollection.remove(newSlide, {silent:true});
				me.model.slideCollection.add(newSlide, {at: index});

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
					size: result.imageSize,
					cropSize: result.cropSize
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
			position = {left: 0 - img.position().left, top: 0 - img.position().top},
			element_id = this.model.get_property_value_by_name("element_id")
		;

		return {
			id: image.id,
			element_id: element_id,
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

	postTypes: function(){
		var types = [];
		_.each(Upfront.data.ugallery.postTypes, function(type){
			if(type.name != 'attachment')
				types.push({name: type.name, label: type.label});
		});
		return types;
	},

	cleanup: function(){
		if(this.controls){
			this.controls.remove();
			this.controls = false;
		}
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

		props.preset = props.preset || 'default';

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
	},

	getControlItems: function(){
		if( !this.model.slideCollection.length ) return _([]); // We need no controls when there is no slide
		var me = this,
			captionControl = new Upfront.Views.Editor.InlinePanels.TooltipControl(),
			slideCollection = this.model.slideCollection;
			multiBelow = {
				above: ['above', l10n.above_img],
				below: ['below', l10n.below_img],
				nocaption: ['nocaption', l10n.no_text]
			},
				multiOver = {
					topOver: ['topOver', l10n.over_top],
					bottomOver: ['bottomOver', l10n.over_bottom],
					topCover: ['topCover', l10n.cover_top],
					middleCover: ['middleCover', l10n.cover_mid],
					bottomCover: ['bottomCover', l10n.cover_bottom],
					nocaption: ['nocaption', l10n.no_text]
				},
				multiSide = {
					right: ['right', l10n.at_right],
					left: ['left', l10n.at_left],
					nocaption: ['nocaption', l10n.no_text]
				},
				primaryStyle = this.get_preset_property('primaryStyle'),
				multiControls = {},
				captionControl = new Upfront.Views.Editor.InlinePanels.TooltipControl(),
				slide = slideCollection.at(this.getCurrentSlide())
			;


		captionControl.sub_items = {};
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
				captionControl.sub_items[key] = me.createControl(opts[0], opts[1]);
			});

			captionControl.icon = 'caption';
			captionControl.tooltip = l10n.cap_position;
			captionControl.selected = multiControls[slide.get('style')] ? slide.get('style') : 'nocaption';
			this.listenTo(captionControl, 'select', function(item){
				var previousStyle = slide.get('style');
				slide.set('style', item);
				me.onSlidesCollectionChange();
				if(primaryStyle == 'side' && previousStyle == 'nocaption' || item == 'nocaption'){
					//give time to the element to render
					setTimeout(function(){
						var wrap = me.$('.upfront-default-slider-item-current').find('.uslide-image');
						me.imageProps[slide.id] = me.calculateImageResize({width: wrap.width(), height: wrap.height()}, slide);
						me.setTimer();
					}, 100);
				}
			});
		}

		var controls = _([
			//this.createControl('next', l10n.css.next_label, 'nextSlide'),
			//this.createControl('prev', l10n.css.prev_label, 'prevSlide'),
			this.createLinkControl(),
			
			captionControl,
			this.createPaddingControl(),
			this.createControl('settings', l10n.settings, 'on_settings_click')
		]);
		
		if (Upfront.Application.user_can("RESIZE")) {
			controls.splice(0, 0, this.createControl('add', l10n.add_slide, 'openImageSelector'));
			controls.splice(1, 0, this.createControl('crop', l10n.edit_img, 'imageEditMask'));
			controls.splice(3, 0, this.createControl('remove', l10n.remove_slide, 'onRemoveSlide'));
		}

		if( !multiControls ){
			controls = _( controls.without( captionControl ) );
		}

		return controls;
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
	priority: 40,
	draggable: true,
	/**
	 * Set up command appearance.
	 */
	render: function () {
		//this.$el.html(uslider_i18n['menu-add-slider']);
		this.$el.addClass('upfront-icon-element upfront-icon-element-slider');
		this.$el.html(l10n.element_name);
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
					{"name": "row", "value": Upfront.Util.height_to_row(255)}
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

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("USlider", {
	"Model": USliderModel,
	"View": USliderView,
	"Element": USliderElement,
	"Settings": SliderSettings,
	cssSelectors: {
		'.uslide-image img': {label: l10n.css.images_label, info: l10n.css.images_info},
		'.uslide-image': {label: l10n.css.img_containers_label, info: l10n.css.img_containers_info},
		'.uslide-caption': {label: l10n.css.captions_label, info: l10n.css.captions_info},
		'.wp-caption': {label: l10n.css.caption_label, info: l10n.css.caption_info},
		'.upfront-default-slider-nav': {label: l10n.css.dots_wrapper_label, info: l10n.css.dots_wrapper_info},
		'.upfront-default-slider-nav-item': {label: l10n.css.dots_label, info: l10n.css.dots_info},
		'.uslider-dotnav-current': {label: l10n.css.dot_current_label, info: l10n.css.dot_current_info},
		'.upfront-default-slider-nav-prev': {label: l10n.css.prev_label, info: l10n.css.prev_info},
		'.upfront-default-slider-nav-next': {label: l10n.css.next_label, info: l10n.css.next_info},
	},
	cssSelectorsId: Upfront.data.uslider.defaults.type
});
Upfront.Models.USliderModel = USliderModel;
Upfront.Views.USliderView = USliderView;

}); //End require

})(jQuery);
