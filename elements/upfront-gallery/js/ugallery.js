/*global ugalleries */
(function ($) {
define([
	'text!elements/upfront-gallery/tpl/ugallery.html', // Front
	'text!elements/upfront-gallery/tpl/sorting-style.html',
	'text!elements/upfront-gallery/tpl/ugallery_editor.html',
	'elements/upfront-gallery/js/settings',
	'elements/upfront-gallery/js/model',
	'elements/upfront-gallery/js/label-editor',
	'elements/upfront-gallery/js/element',
	'text!elements/upfront-gallery/tpl/preset-style.html',
	'scripts/upfront/preset-settings/util',
], function(galleryTpl, sortingStyleTpl, editorTpl, UgallerySettings, UgalleryModel, LabelEditor, UgalleryElement, settingsStyleTpl, PresetUtil) {

var l10n = Upfront.Settings.l10n.gallery_element;

var UgalleryImage = Backbone.Model.extend({
	defaults: Upfront.data.ugallery.imageDefaults
});

var UgalleryImages = Backbone.Collection.extend({
	model: UgalleryImage
});


/* View */
var UgalleryView = Upfront.Views.ObjectView.extend({
	model: UgalleryModel,
	tpl: Upfront.Util.template(galleryTpl), //PHP compatible templates
	selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
	progressTpl: _.template($(editorTpl).find('#progress-tpl').html()),
	editorTpl: _.template($(editorTpl).find('#editor-tpl').html()),
	formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
	detailsTpl: _.template($(editorTpl).find('#details-tpl').html()),
	sortMode: false,
	lastThumbnailSize: false,
	imageLabels: {},

	reopenSettings: false,

	initialize: function(options){
		var me = this,
			elementId = this.property('element_id'),
			raw_labels,
			images;

		if(! (this.model instanceof UgalleryModel)){
			this.model = new UgalleryModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
		this.events = _.extend({}, this.events, {
			'click a.upfront-image-select': 'openImageSelector',
			'click .add-item': 'openImageSelector',
			'click .toggle-sorting': 'toggleSorting',
			'click .ugallery_op_link': 'imageEditLink',
			'click .ugallery_op_mask': 'imageEditMask',
			'click .remove-image': 'removeImage',
			'click .ugallery_item': 'selectItem',
			'click .upfront-quick-swap': 'openImageSelector',
			'click': 'preventNavigation',
			'dblclick .ugallery-thumb-title': 'startCaptionEditor'
		});

		images = this.property('images');

		this.images = new UgalleryImages(images);
		this.listenTo(this.images, 'add remove reset change', this.imagesChanged);
		this.property('images', this.images.toJSON()); // Hack to add image defaults;

		if (typeof this.property('thumbPadding') === 'undefined') {
			this.property('thumbPadding', 15);
		}

		$('body').on('click', this.closeTooltip);

		this.listenTo(Upfront.Events, 'entity:settings:activate', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:activated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:deactivated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:region:activated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'upfront:layout_size:change_breakpoint', this.rebindShuffle);

		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
		
		this.listenTo(Upfront.Events, "preset:updated", this.preset_updated);

		this.lastThumbnailSize = {width: this.property('thumbWidth'), height: this.property('thumbHeight')};

		if (typeof ugalleries !== 'undefined' && ugalleries[elementId]) {
			if(ugalleries[elementId].labels) {
				this.labels = ugalleries[elementId].labels;
			}
			if(ugalleries[elementId].image_labels) {
				this.imageLabels = ugalleries[elementId].image_labels;
			}
		} else {
			if ('undefined' === typeof ugalleries || !ugalleries) {
				ugalleries = {};
			}

			ugalleries[elementId] = {};

			raw_labels = ['All'];
			_.each(this.images.models, function(image) {
				raw_labels = _.union(raw_labels, image.get('tags'));
			});
			this.labels = [];
			_.each(raw_labels, function(label, index) {
				this.labels[index] = {
					id: index,
					text: label
				};
			}, this);
			this.imageLabels = {};
			_.each(this.images.models, function(image) {
				var imageLabels = [];
				_.each(this.labels, function(label) {
					if (_.indexOf(image.get('tags'), label.text) > -1) {
						imageLabels.push('label_' + label.id);
					}
				});
				this.imageLabels[image.get('id')] = 'label_0,' + imageLabels.join(',');
			}, this);

			ugalleries[elementId].labels = this.labels;
			ugalleries[elementId].imageLabels = this.imageLabels;
		}


		this.on('deactivated', this.sortCancel, this);

		this.listenTo(this.model, 'settings:closed', function(e){
			me.checkRegenerateThumbs(e);
			if (this.property('labelFilters').length) {
				Upfront.frontFunctions.galleryBindShuffle();
			}
		});

		this.listenTo(this.model, 'change:thumbPadding', function() {
			me.updateThumbPadding();
		});
		this.listenTo(this.model, 'change:even_padding', function() {
			me.updateEvenPadding();
		});

		this.listenTo(this.model, 'change:labelFilters', function() {
			me.updateShowFilters();
		});

		this.listenTo(this.model, 'change:showCaptionOnHover', function() {
			me.updateShowCaptionOnHover();
		});

		this.listenTo(this.model, 'change:captionType', function() {
			me.updateCaptionType();
		});

		this.listenTo(this.model, 'change:fitThumbCaptions', function() {
			me.updateFitThumbCaptions();
		});

		this.listenTo(this.model, 'change:thumbCaptionsHeight', function() {
			me.updateThumbCaptionsHeight();
		});

		if (this.property('status') !== 'ok' || !this.images.length) {
			this.property('has_settings', 0);
		}

		Upfront.Events.on('upfront:layout_size:change_breakpoint', function() {
			setTimeout(function() {
				me.render();
			}, 100);
		});
		this. debouncedRender = _.debounce(this.render, 300);
	},
	
	get_preset_properties: function() {
		var preset = this.model.get_property_value_by_name("preset"),
			props = PresetUtil.getPresetProperties('gallery', preset) || {};
			
		return props;	
	},
	
	preset_updated: function() {
		this.debouncedRender();
	},
	
	update_colors: function () {
		
		var props = this.get_preset_properties();
		
		if (_.size(props) <= 0) return false; // No properties, carry on

		PresetUtil.updatePresetStyle('gallery', props, settingsStyleTpl);

	},

	// Remove default dblclick behavior because it messes up things
	on_edit: function() {},

	/****************************************************/
	/*          Settings change live callbacks          */
	/****************************************************/
	updateThumbPadding: function() {
		this.$el.find('.ugallery').data('thumb-padding', this.property('thumbPadding'));
		this.debouncedRender();
	},
	updateCaptionType: function() {
		var classes,
			suffix;

		this.$el.find('.ugallery-thumb-title')
			.removeClass('ugallery-caption-over ugallery-caption-below ugallery-caption-none')
			.addClass('ugallery-caption-' + this.property('captionType'));

		if (this.property('captionType') !== 'over') {
			classes = 'ugallery_caption_on_hover_1 ugallery_caption_on_hover_0 ugallery-caption-on-hover-1 ugallery-caption-on-hover-0';
			this.$el.find('.ugallery_item, .ugallery-thumb-title').removeClass(classes);
		} else {
			suffix = this.property('showCaptionOnHover').length;
			this.$el.find('.ugallery_item').addClass('ugallery_caption_on_hover_' + suffix);
			this.$el.find('.ugallery-thumb-title').addClass('ugallery-caption-on-hover-' + suffix);
		}
	},

	updateFitThumbCaptions: function() {
		this.debouncedRender();
	},

	updateThumbCaptionsHeight: function() {
		this.debouncedRender();
	},

	updateShowCaptionOnHover: function() {
		var classes = 'ugallery_caption_on_hover_1 ugallery_caption_on_hover_0 ugallery-caption-on-hover-1 ugallery-caption-on-hover-0',
			suffix = this.property('showCaptionOnHover').length;

		this.$el.find('.ugallery_item, .ugallery-thumb-title').removeClass(classes);

		this.$el.find('.ugallery_item').addClass('ugallery_caption_on_hover_' + suffix);
		this.$el.find('.ugallery-thumb-title').addClass('ugallery-caption-on-hover-' + suffix);
	},

	updateEvenPadding: function() {
		this.render();
	},

	updateShowFilters: function() {
		if (this.property('labelFilters')[0] === 'true') {
			this.$el.find('.ugallery_labels').show();
			this.$el.find('.ugallery-magnific-labels').parents('.upfront-inline-panel-item').show();
			Upfront.frontFunctions.galleryBindShuffle();
		} else {
			this.$el.find('.ugallery_labels').hide();
			this.$el.find('.ugallery-magnific-labels').parents('.upfront-inline-panel-item').hide();
		}

	},
	/****************************************************/
	/*        End settings change live callbacks        */
	/****************************************************/

	selectItem: function(e) {
		var item = $(e.target).hasClass('gallery_item') ? $(e.target) : $(e.target).closest('.ugallery_item');
		item.siblings().removeClass('ugallery_selected');
		if (!$(e.target).closest('.ugallery-controls').length) {
			item.toggleClass('ugallery_selected');
		}
		e.gallerySelected = true;
	},

	createControls: function(image) {
		var panel = new Upfront.Views.Editor.InlinePanels.ControlPanel();

		panel.items = _([
			this.createControl('crop', l10n.ctrl.edit_image, 'imageEditMask'),
			this.createLinkControl(image)
		]);

		panel.items.push(this.createLabelControl(image));

		if (image.get('urlType') === 'image') {
			panel.items.push(this.createControl('fullscreen', l10n.ctrl.show_image, 'openLightbox'));
		}

		return panel;
	},

	createControl: function(icon, tooltip, click_callback) {
		var me = this,
			item = new Upfront.Views.Editor.InlinePanels.Control();

		item.icon = icon;
		item.tooltip = tooltip;
		if(click_callback) {
			this.listenTo(item, 'click', function(e){
				me[click_callback](e);
			});
		}

		return item;
	},

	createLabelControl: function(image){
		var control = new Upfront.Views.Editor.InlinePanels.DialogControl(),
			me = this;

		control.hideOkButton = true;
		control.hideOnClick = false;

		control.view = this.createLabelEditor(image);

		control.image = image;

		if (control.view.options.labels.length) {
			control.icon = 'edit-labels';
		} else {
			control.icon = 'edit-labels-no-labels';
		}
		control.tooltip = l10n.ctrl.edit_labels;
		control.id = 'edit_labels';

		me.listenTo(control, 'panel:open', function(){
			control.$el
				.closest('.ugallery-controls')
					.addClass('upfront-control-visible');
		});

		me.listenTo(control, 'panel:close', function(){
			control.$el
				.closest('.ugallery-controls')
					.removeClass('upfront-control-visible');
		});


		return control;
	},

	createLinkControl: function(image){
		var me = this,
			linkControl = new Upfront.Views.Editor.InlinePanels.DialogControl();

		linkControl.view = linkPanel = new Upfront.Views.Editor.LinkPanel({
			linkType: image.get('urlType'),
			linkUrl: image.get('url'),
			linkTarget: image.get('linkTarget'),
			linkTypes: { image: true },
			imageUrl: image.get('srcFull')
		});

		me.listenTo(linkPanel, 'change change:target', function(data){
			image.set({
				urlType: data.type,
				url: data.url,
				linkTarget: data.target
			});
		});

		this.listenTo(linkControl, 'panel:ok', function(){
			linkControl.close();
		});

		me.listenTo(linkControl, 'panel:open', function(){
			linkControl.$el
				.parents('.ugallery_item')
					.addClass('upfront-control-visible').end()
				.closest('.ugallery_link')
					.removeAttr('href') //Deactivate link when the panel is open
			;

			me.$el.closest('.ui-draggable').draggable('disable');
		});

		me.listenTo(linkControl, 'panel:close', function(){
			linkControl.$el
				.parents('.ugallery_item')
					.removeClass('upfront-control-visible').end()
				.closest('.ugallery_link')
					.attr('href', image.get('url'))
			;

			me.$el.closest('.ui-draggable').draggable('enable');
		});

		linkControl.icon = 'link';
		linkControl.tooltip = l10n.ctrl.image_link;
		linkControl.id = 'link';

		return linkControl;
	},

	openLightbox: function(e) {
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = me.images.get(item.attr('rel')),
			titleUpdated = false,
			resizeWithText = function() {
				var caption = this.content.find('figcaption'),
					maxHeight = this.wH - 120 - caption.outerHeight(),
					maxWidth = $(window).width() - 200
				;

				this.content.find('img').css({
					'max-width': maxWidth,
					'max-height': maxHeight
				});
			}
		;

		$.magnificPopup.open({
			items: {
				src: item.find('.ugallery_link').attr('href') || item.find('.ugallery-image').attr('src')
			},
			type: 'image',
			image: {
				titleSrc: function(){
					return image.get('caption');
				},
				markup: Upfront.data.ugallery.lightboxTpl
			},
			callbacks: {
				imageLoadComplete: function() {
					var title = $(this.container).find('.mfp-title');

					if(title.length){
						title.ueditor({
								linebreaks: false,
								autostart: false,
								upfrontMedia: false,
								upfrontImages: false
							})
							.on('start', function(){
								titleUpdated = true;
							})
							.on('syncAfter', function(){
								image.set('caption', title.html());
							})
						;
					}

				},
				beforeClose: function() {
					if (titleUpdated) {
						Upfront.Views.Editor.notify(l10n.desc_update_success);
					}
				},
				resize: resizeWithText,
				afterChange: resizeWithText
			}
		});
	},

	createLabelEditor: function(image) {
		var labelEditor = new LabelEditor({
			gallery: this,
			labels: this.extractImageLabels(image.id),
			imageId: image.id
		});

		return labelEditor;
	},

	openLightboxLabels: function(e){
		this.openLightbox(e, true);
	},

	getPropertiesForTemplate: function() {
		var props = this.extract_properties();
		
		props.properties = this.get_preset_properties();
		
		props.imagesLength = props.images.length;
		props.editing = true;

		props.labels = this.labels;
		props.labels_length = this.labels.length;
		props.image_labels = this.imageLabels;

		props.l10n = l10n.template;
		props.in_editor = true;
		if (!props.even_padding) {
			props.even_padding = ['false'];
		}

		return props;
	},

	get_content_markup: function() {
		return this.tpl(this.getPropertiesForTemplate());
	},

	on_render: function() {
		var me = this,
			resizingFunction;

		//Bind resizing events
		if (me.parent_module_view && !me.parent_module_view.$el.data('resizeHandling')) {
			resizingFunction = $.proxy(me.onElementResizing, me);
			me.parent_module_view.$el
				.on('resize', resizingFunction)
				.on('resizestop', $.proxy(me.onElementResizeStop, me))
				.data('resizeHandling', true)
			;
		}

		this.images.each(function(image) {
			if(image.get('loading')){
				me.$('.ugallery_item[rel="' + image.id  + '"]')
					.append('<p class="ugallery-image-loading">' + l10n.loading + '</p>');
			}
		});

		if(_.indexOf(['ok', 'starting'], me.property('status')) === -1) {
			me.$('.upfront-gallery').append('<div class="upfront-quick-swap"><p>' + l10n.personalize + '</p></div>');
		}

		if (this.images && this.images.length) {
			var $upfrontObjectContent = this.$el.find('.upfront-object-content');
			if (this.$el.find('a.toggle-sorting').length < 1) {
				$('<b class="upfront-entity_meta upfront-ui toggle_sorting" title="Toggle drag\'n\'drop sorting of images"><a href="" class="upfront-icon-button toggle-sorting"></a></b>').insertBefore($upfrontObjectContent);
			}
			if (this.$el.find('a.add-item').length < 1) {
				$('<b class="upfront-entity_meta upfront-ui add_item"><a href="" class="upfront-icon-button add-item"></a></b>').insertBefore($upfrontObjectContent);
			}
		}

		setTimeout(function() {
			me.rebindShuffle();
			var items = me.$('.ugallery_item');
			_.each(items, function(item) {
				var $item = $(item),
					image = me.images.get($item.attr('rel')),
					controls = me.createControls(image),
					title = $item.find('.ugallery-thumb-title');

				controls.setWidth($item.width());
				controls.render();
				$item.append($('<div class="ugallery-controls upfront-ui"></div>').append(controls.$el));

				me.ensureCaptionEditorExists(title, image);

				if(image.controls) {
					image.controls.remove();
				}
				image.controls = controls;
			});
			if (me.property('labelFilters')[0] === 'true') {
				me.$el.find('.ugallery-magnific-labels').parents('.upfront-inline-panel-item').show();
			} else {
				me.$el.find('.ugallery-magnific-labels').parents('.upfront-inline-panel-item').hide();
			}

		}, 300);

		if (this.isSortingActive === true) {
			this.activateSortable();
		} else {
			this.cleanupSortable();
		}
	},

	ensureCaptionEditorExists: function(title, image) {
		var me = this;

		if (!title.data('ueditor')) {
			title.ueditor({
				linebreaks: false,
				autostart: false,
				upfrontMedia: false,
				upfrontImages: false
			})
			.on('start', function() {
				me.$el.addClass('upfront-editing');
			})
			.on('stop', function() {
				setTimeout(function() {
					// Prevent on hover caption shows constantly
					title.removeAttr('style');
				}, 10);

				me.$el.removeClass('upfront-editing');
			})
			.on('syncAfter', function() {
				image.set('title', title.html());
				image.set('caption', title.html());
			})
			;
		}
	},

	onElementResizing: function(){
		this.$('.ugallery_items').width($('html').find('.upfront-resize').width() - 30);
	},

	onElementResizeStop: function(){
		// Not gonna do this because render will be triggered by parent class model changing
		// 'row' property on resize.
		// this.render(); <-- this is redundant and creates misscalculation of padding
	},

	toggleSorting: function(event) {
		if (event) {
			event.preventDefault();
		}
		this.isSortingActive = !this.isSortingActive;
		this.itemsInRow = this.$el.find('.ugallery_item').filter(function(){ return $(this).css('top') === '0px'; }).length;
		this.render();
	},

	rebindShuffle: function() {
		if (!this.isSortingActive) {
			Upfront.frontFunctions.galleryBindShuffle(this.$el.find('.ugallery_grid'), true);
		}
	},

	preventNavigation: function(e){
		if(e.target.tagName.toUpperCase() === 'INPUT') {
			return;
		}

		if(e.target.tagName.toUpperCase() === 'A' || $(e.target).closest('a').length) {
			e.preventDefault();
		}
	},

	getLabelSelector: function(imageId){
		var tpl = $($.trim(this.labelsTpl({labels: this.extractImageLabels(imageId), l10n: l10n.template})));
		return tpl;
	},

	extractImageLabels: function(imageId){
		var ids = !_.isUndefined( this.imageLabels[imageId] ) ?  this.imageLabels[imageId].match(/-?\d+/g) : false,
			labels = []
		;

		if(ids){
			_.each(this.labels, function(label){
				if(ids.indexOf(label.id.toString()) !== -1 && label.id !== '0') {
					labels.push(label);
				}
			});
		}

		return labels;
	},

	openImageSelector: function(event, replaceId){
		var me = this,
			selectorOptions = {
				multiple: true,
				preparingText: l10n.preparing,
				customImageSize: {width: this.property('thumbWidth'), height: this.property('thumbHeight')},
				element_id: this.model.get_property_value_by_name('element_id')
			}
		;

		if (event) {
			event.preventDefault();
		}

		Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){
			me.addImages(images, replaceId);
			if (response.given !== response.returned) {
				Upfront.Views.Editor.notify(l10n.not_all_added, 'warning');
			}

			Upfront.Views.Editor.ImageSelector.close();
		});

	},
	addImages: function(images, replaceId){
		var me = this,
			models = [],
			element_id = this.model.get_property_value_by_name('element_id');

		this.getNewLabels(_.keys(images));

		_.each(images, function(image, id) {
			models.push(
				new UgalleryImage({
					id: id,
					srcFull: image.full[0],
					sizes: image,
					size: image.custom.editdata.resize,
					cropSize: image.custom.crop,
					cropOffset: image.custom.editdata.crop,
					src: image.custom.url,
					loading: false,
					status: 'ok',
					element_id: element_id,
					urlType: 'image',
					url: image.full[0]
				})
			);
		});

		if (me.property('status') !== 'ok') {
			me.property('status', 'ok');
			me.property('has_settings', 1);
			me.images.reset(models);
		} else if (replaceId) {
			var item = me.images.get(replaceId),
				idx = me.images.indexOf(item);

			me.images.remove(replaceId);
			me.images.add(models, {at: idx});
		} else {
			me.images.add(models);
		}

		me.render();
	},

	getNewLabels: function(ids){
		var data = {
				action: 'upfront-media_get_image_labels',
				post_ids: ids
			},
			me = this
		;
		Upfront.Util.post(data).done(function(results){
			var images = results.data;
			_.each(images, function(labels, imageId){
				var imageLabels = [];

				imageLabels.push('"label_0"');

				_.each(labels, function(label){
					var globals = Upfront.data.ugallery,
						newLabel = {id: label.term_id, text: label.name}
					;

					if(!globals.label_names[label.name]) {
						globals.label_names[label.name] = newLabel;
					}

					if(!globals.label_ids[label.term_id]) {
						globals.label_ids[label.term_id] = newLabel;
					}

					if(!me.isLabelInGallery(newLabel)) {
						me.labels.push(newLabel);
					}

					imageLabels.push('"label_' + label.term_id + '"');
				});

				me.imageLabels[imageId] = imageLabels.join(', ');
			});
		});
	},

	isLabelInGallery: function(label){
		var me = this,
			labelInGallery = false,
			i = 0
		;
		while(i<me.labels.length && !labelInGallery){
			labelInGallery = me.labels[i].id === label.id;
			i++;
		}

		return labelInGallery;
	},

	getCropOffset: function(size, fullSize){
		var pivot = fullSize.width / size.width > fullSize.height / size.height ? 'height' : 'width',
			factor = fullSize[pivot] / size[pivot],
			reducedSize, offset
		;

		if(factor > 0){
			reducedSize = {width: Math.floor(fullSize.width / factor), height: Math.floor(fullSize.height / factor)};
			offset = {left: (reducedSize.width - size.width) / 2, top: (reducedSize.height - size.height) / 2};
		}
		else{
			reducedSize = size;
			offset = {left:0, top:0};
		}

		return {size: reducedSize, offset: offset};
	},

	centeredPosition: function(imgSize){
		var wrapperSize = {
			width: this.property('thumbWidth'),
			height: this.property('thumbHeight')
		};

		return {
			top: ((wrapperSize.height - imgSize.height) / 2) / wrapperSize.height * 100,
			left: ((wrapperSize.width - imgSize.width) / 2) / wrapperSize.width * 100
		};
	},

	checkRegenerateThumbs: function(e, imageIds){
		var me = this;
		if(imageIds || this.lastThumbnailSize.width !== this.property('thumbWidth') || this.lastThumbnailSize.height !== this.property('thumbHeight')){

			var editOptions = {
					images: this.getRegenerateData(imageIds),
					action: 'upfront-media-image-create-size'
				},
				loading = new Upfront.Views.Editor.Loading({
					loading: l10n.regenerating,
					done: l10n.regenerating_done,
					fixed: false
				})
			;
			loading.render();
			this.parent_module_view.$el.append(loading.$el);

			Upfront.Util.post(editOptions).done(function(response) {
				loading.done();
				var images = response.data.images,
					models = []
				;

				_.each(editOptions.images, function(image){
					var model = me.images.get(image.id),
						changes = images[image.id]
					;

					if(!changes.error){
						model.set({
							src: changes.url,
							srcFull: changes.urlOriginal,
							size: image.resize,
							cropPosition: {top: image.crop.top, left: image.crop.left}
						}, {silent: true});
					}
					models.push(model);
				});

				me.images.set(models, {remove: false});
				me.imagesChanged();
				me.render();
				me.lastThumbnailSize = {width: me.property('thumbWidth'), height: me.property('thumbHeight')};
			});
		}
	},

	getRegenerateData: function(imageIds){
		var me = this,
			widthFactor = this.property('thumbWidth') / this.lastThumbnailSize.width,
			heightFactor = this.property('thumbHeight') / this.lastThumbnailSize.height,
			factor = widthFactor > heightFactor ? widthFactor : heightFactor,
			imageData = [],
			images = this.images,
			element_id = this.model.get_property_value_by_name('element_id')
		;

		if(imageIds){
			images = [];
			_.each(imageIds, function(id){
				images.push(me.images.get(id));
			});

			images = new UgalleryImages(images);
		}

		images.each(function(image){
			var size = image.get('size'),
				offset = image.get('cropOffset'),
				editorOpts = {
					id: image.id,
					rotate:image.get('rotation'),
					resize: {width: size.width * factor, height: size.height * factor},
					crop: {
						top: Math.round(offset.top * factor),
						left: Math.round(offset.left * factor),
						width: me.property('thumbWidth'),
						height: me.property('thumbHeight')
					},
					element_id: element_id
				}
			;
			imageData.push(editorOpts);
		});

		return imageData;
	},

	imageEditMask: function(e) {
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			editorOpts;

		if(image.get('status') !== 'ok'){
			var selectorOptions = {
				multiple: false,
				preparingText: l10n.preparing,
				element_id: this.model.get_property_value_by_name('element_id')
			};
			return Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images){
				me.addImages(images);

				var index = me.images.indexOf(image);

				me.images.remove(image, {silent:true});

				var newImage = me.images.at(me.images.length -1);

				me.images.remove(newImage, {silent:true});

				me.images.add(newImage, {at: index});

				Upfront.Views.Editor.ImageSelector.close();
			});
		}

		editorOpts = this.getEditorOptions(image);
		e.preventDefault();
		Upfront.Views.Editor.ImageEditor.open(editorOpts)
			.done(function(result){
				image.set({
					src: result.src,
					srcFull: result.src,
					cropSize: result.cropSize,
					size: result.imageSize,
					cropOffset: result.imageOffset,
					margin: {left: Math.max(0-result.imageOffset.left, 0), top: Math.max(0-result.imageOffset.top, 0)},
					rotation: result.rotation
				});
				me.render();
			}).fail(function(data){
				if(data && data.reason === 'changeImage') {
					me.openImageSelector(false, data.id);
				} else {
					me.render();
				}
			});
	},

	getEditorOptions: function(image){
		var $img = this.$('.ugallery_item[rel=' + image.id + '] img'),
			full = image.get('sizes').full;

		return {
			id: image.id,
			maskSize: {width: $img.width(), height: $img.height()},
			maskOffset: $img.offset(),
			position: image.get('cropOffset'),
			size: image.get('size'),
			fullSize: {width: full[1], height: full[2]},
			src: image.get('src'),
			srcOriginal: full[0],
			rotation: image.get('rotation'),
			element_id: this.model.get_property_value_by_name('element_id')
		};
	},

	imagesChanged: function() {
		this.property('images', this.images.toJSON());
		this.rebindShuffle();
	},

	/**
	 * Delete a label from the gallery if no other image has the label
	 * @param  {int} labelId Label id
	 * @param  {int} imageId Image id
	 * @return {null}
	 */
	deleteLabel: function(labelId, imageId) {
		var me = this,
			deleteLabel = true;

		me.images.each(function(image){
			if(image.id !== imageId && me.imageLabels[image.id].indexOf('"label_' + labelId + '"') !== -1){
				deleteLabel = false;
			}
		});

		if(deleteLabel){
			for(var idx in me.labels){
				if(me.labels[idx] && me.labels[idx].id === labelId) {
					me.labels.splice(idx, 1);
				}
			}
		}
	},

	addLabel: function(text, imageId){
		var label = Upfront.data.ugallery.label_names[text],
			labelId;

		if (!label) {
			return this.createLabel(text, imageId);
		}

		labelId = '"label_' + label.id + '"';

		this.addToGalleryLabels(label);

		this.associateLabelWithImage(imageId, labelId, label);

		return label;
	},

	associateLabelWithImage: function(imageId, labelId, label) {
		var data;

		if (!this.imageLabels[imageId]) {
			this.imageLabels[imageId] = labelId;
		}

		if (this.imageLabels[imageId].indexOf(labelId) === -1) {
			this.imageLabels[imageId] += ', ' + labelId;
		}

		data = {
			'action': 'upfront-media-associate_label',
			'term': label.id,
			'post_id': imageId
		};
		Upfront.Util.post(data);
	},

	addToGalleryLabels: function(label) {
		var labelInGallery = false,
			i = 0;

		while (i < this.labels.length && !labelInGallery) {
			labelInGallery = this.labels[i].id === label.id;
			i++;
		}

		if (!labelInGallery) {
			this.labels.push({
				id: label.id,
				text: label.text
			});
		}
	},

	createLabel: function(text, imageId) {
		//Push a label with a temp id
		var me = this,
			tempId = -parseInt(Math.random() * 100, 10),
			label,
			data;

		label = {
			id: tempId,
			term_id: tempId,
			text: text
		};

		data = {
			'action': 'upfront-media-add_label',
			'term': text,
			'post_id': imageId
		};

		Upfront.data.ugallery.label_names[text] = label;
		Upfront.data.ugallery.label_ids[tempId] = label;

		this.labels.push(label);
		this.imageLabels[imageId] = this.imageLabels[imageId] ? this.imageLabels[imageId] + ', "label_' + tempId + '"' : '"label_' + tempId + '"';

		var deferred = $.Deferred();
		Upfront.Util.post(data)
		.success(function (response) {
			//Replace the temp label
			var thisLabels = response.data[imageId],
			imageLabels = [],
			newId = 0,
			newLabel = {}
			;

			_.each(thisLabels, function(label){
				imageLabels.push('"label_' + label + '"');
				if(!Upfront.data.ugallery.label_ids[label]) {
					newId = label;
				}
			});

			imageLabels = imageLabels.join(', ');
			newLabel = {
				id: newId,
				text: text
			};

			deferred.resolve(newLabel);

			Upfront.data.ugallery.label_names[text] = newLabel;
			Upfront.data.ugallery.label_ids[newLabel.id] = newLabel;
			delete(Upfront.data.ugallery.label_ids[tempId]);

			me.imageLabels[imageId] = imageLabels;

			_.each(me.labels, function(label){
				if(label.text === text) {
					label.id = newLabel.id;
				}
			});

			me.render();
		});

		return deferred.promise();
	},

	postTypes: function(){
		var types = [];
		_.each(Upfront.data.ugallery.postTypes, function(type){
			if(type.name !== 'attachment') {
				types.push({name: type.name, label: type.label});
			}
		});
		return types;
	},

	getItemElement: function(e){
		return $(e.target).closest('.ugallery_item');
	},

	removeImage: function(e){
		var me = this,
			item = this.getItemElement(e);
		e.preventDefault();
		item.fadeOut('fast', function() {
			var imageId = item.attr('rel');
			me.images.remove(imageId);
			me.imagesChanged();
			if (!me.images.length) {
				me.property('has_settings', 0);
				me.property('status', 'starting');
			}

			//Remove labels
			var labels = me.imageLabels[imageId].split(',');
			_.each(labels, function(label){
				var labelId = $.trim(label.replace('"label_', '').replace('"', ''));
				me.deleteLabel(labelId, imageId);
			});
			me.imageLabels[imageId] = '';

			me.render();
		});
	},

	activateSortable: function(){
		var me = this;

		this.$('.ugallery').sortable({
			items: 'div.ugallery_item:not(.ugallery_addmore)',
			start: function(){
				me.$el.addClass('ugallery_sorting');
			},
			stop: function (){
				me.$el.removeClass('ugallery_sorting');
			},
			update: function() {
				me.sortOk();
			},
			change: function(){
			},
			delay: 500,
			cancel: '.ugallery-thumb-title'
		});

		this.$('.ugallery_item_removing').removeClass('ugallery_item_removing');

		this.$el.addClass('image-sorting-active');
		this.$el.find('.toggle_sorting').addClass('sorting-active');
		$('body').append(_.template(sortingStyleTpl, {
			element_id: this.model.get_property_value_by_name('element_id'),
			thumbPadding: this.model.get_property_value_by_name('thumbPadding'),
			even_padding: this.model.get_property_value_by_name('even_padding'),
			itemsInRow: this.itemsInRow
		}));
	},

	cleanupSortable: function() {
		this.$el.removeClass('image-sorting-active');
		this.$el.find('.toggle_sorting').removeClass('sorting-active');
		if ($('#sorting-style').length > 0) {
			$('#sorting-style').remove();
		}
	},

	sortOk: function() {
		var items = this.$('.ugallery_item'),
			newOrder = [],
			me = this
		;
		_.each(items, function(item){
			var id = $(item).attr('rel');
			if(id) {
				newOrder.push(me.images.get(id));
			}
		});

		this.images.reset(newOrder);
	},

	activateLightbox: function(){
		var items = [];
		this.$('.ugallery_item').each(function(i, item){
			items.push({
				el: $(item),
				src: $(item).find('a.ugallery_link').attr('href')
			});
			$(item).find('.upfront-icon-region-fullscreen').attr('href', $(item).find('a.ugallery_link').attr('href'));
		});

		this.$('.ugallery').magnificPopup({
			gallery: {enabled: true},
			type: 'image',
			delegate: '.upfront-icon-region-fullscreen',
			items: items
		});
	},

	startCaptionEditor: function(event) {
		var $target = $(event.target),
			$caption = $target.hasClass('ugallery-thumb-title') ? $target : $target.closest('.ugallery-thumb-title'),
			image;

		if (!$caption.length) {
			return;
		}

		if ($caption.data('ueditor') && !$caption.data('ueditor').active ) {
			$caption.data('ueditor').start();
		} else {
			image = this.images.get($caption.closest('.ugallery_item').attr('rel'));
			this.ensureCaptionEditorExists($caption, image);
            if( !$caption.data('ueditor').active )
			    $caption.data('ueditor').start();
		}
	},

	cleanup: function(){
		this.images.each(function(image){
			if(image.controls) {
				image.controls.remove();
			}
		});
		$('body').off('click', this.closeTooltip);
	},

	/*
	Returns an object with the properties of the model in the form {name:value}
	*/
	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		props.preset = props.preset || 'default';
		return props;
	},

	/*
	Shorcut to set and get model's properties.
	*/
	property: function(name, value, silent) {
		if(typeof value !== 'undefined'){
			if(typeof silent === 'undefined') {
				silent = true;
			}
			this.model.set_property(name, value, silent);
			return;
		}
		return this.model.get_property_value_by_name(name);
	}
});

//Make the element parts available
Upfront.Application.LayoutEditor.add_object('Ugallery', {
	'Model': UgalleryModel,
	'View': UgalleryView,
	'Element': UgalleryElement,
	'Settings': UgallerySettings,
	cssSelectors: {
		'.ugallery': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.ugallery_item': {label: l10n.css.elements_label, info: l10n.css.elements_info},
		'img.ugallery-image': {label: l10n.css.images_label, info: l10n.css.images_info},
		'.ugallery-thumb-title': {label: l10n.css.captions_label, info: l10n.css.captions_info},
		'.ugallery_labels': {label: l10n.css.lblcnt_label, info: l10n.css.lblcnt_info},
		'.ugallery_label_filter': {label: l10n.css.labels_label, info: l10n.css.labels_info}
	},
	cssSelectorsId: Upfront.data.ugallery.defaults.type
});

Upfront.Models.UgalleryModel = UgalleryModel;
Upfront.Views.UgalleryView = UgalleryView;

}); //End require


})(jQuery);
