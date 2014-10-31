/*global ugalleries */
/* @ TODO: need to add [+] button and make sure it triggers the appropriate event..

//Adding [+] control
var $upfrontObjectContent = this.$el.find('.upfront-object-content');
if(this.$el.find('a.add-gallery-item').length < 1) {
	$('<b class="upfront-entity_meta add_item upfront-ui"><a href="#" class="upfront-icon-button a.add-gallery-item add-item"></a></b>').insertBefore($upfrontObjectContent);
}

*/

(function ($) {
define([
	'text!elements/upfront-gallery/tpl/ugallery.html', // Front
	'text!elements/upfront-gallery/tpl/ugallery_editor.html',
	'elements/upfront-gallery/js/settings',
	'elements/upfront-gallery/js/model',
	'elements/upfront-gallery/js/element'
], function(galleryTpl, editorTpl, UgallerySettings, UgalleryModel, UgalleryElement) {

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
	//linkTpl: _.template($(editorTpl).find('#link-tpl').html()),
	labelsTpl: _.template($(editorTpl).find('#labels-tpl').html()),
	labelSelectorTpl: _.template($(editorTpl).find('#labels-selection-tpl').html()),
	magnificLabelTpl: _.template($(editorTpl).find('#magnific-labels-tpl').html()),
	sortMode: false,
	lastThumbnailSize: false,
	imageLabels: {},

	cssSelectors: {
		'.ugallery': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.ugallery_item': {label: l10n.css.elements_label, info: l10n.css.elements_info},
		'img.ugallery-image': {label: l10n.css.images_label, info: l10n.css.images_info},
		'.ugallery-thumb-title': {label: l10n.css.captions_label, info: l10n.css.captions_info},
		'.ugallery_labels': {label: l10n.css.lblcnt_label, info: l10n.css.lblcnt_info},
		'.ugallery_label_filter': {label: l10n.css.labels_label, info: l10n.css.labels_info}

	},

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
			'click .ugallery_op_link': 'imageEditLink',
			'click .ugallery_op_mask': 'imageEditMask',
			'click .remove-image': 'removeImage',
			'click .ugallery-image-wrapper': 'selectItem',
			'click .upfront-quick-swap': 'openImageSelector',
			'click .ugallery-nolabels-alert': 'openLightboxLabels',
			'click': 'preventNavigation'
		});
		images = this.property('images');

		this.images = new UgalleryImages(images);
		this.listenTo(this.images, 'add remove reset change', this.imagesChanged);
		this.property('images', this.images.toJSON()); // Hack to add image defaults;

		$('body').on('click', this.closeTooltip);

		this.listenTo(Upfront.Events, 'entity:settings:activate', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:activated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:deactivated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'entity:region:activated', this.closeTooltip);
		this.listenTo(Upfront.Events, 'upfront:layout_size:change_breakpoint', this.calculateMargins);
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

		this.listenTo(this.model, 'thumbChange', function(){
			me.$('.ugallery-image-wrapper').css('overflow', 'hidden')
				.find('img').css({
					'min-width': '100%',
					'min-height': '100%',
					'margin': '0'
				});
		});

		this.listenTo(this.model, 'change:no_padding', function() {
			me.updatePadding();
		});

		this.listenTo(this.model, 'change:labelFilters', function() {
			me.updateShowFilters();
		});

		this.listenTo(this.model, 'change:captionWhen', function() {
			me.updateCaptionWhen();
		});

		this.listenTo(this.model, 'change:captionPosition', function() {
			me.updateCaptionPosition();
		});

		if (this.property('status') !== 'ok' || !this.images.length) {
			this.property('has_settings', 0);
		}
	},

	/****************************************************/
	/*          Settings change live callbacks          */
	/****************************************************/
	updateCaptionPosition: function() {
		this.$el.find('.ugallery-thumb-title')
			.removeClass('ugallery-caption-over ugallery-caption-below')
			.addClass('ugallery-caption-' + this.property('captionPosition'));
	},

	updateCaptionWhen: function() {
		var classes = 'ugallery_caption_never ugallery_caption_always ugallery_caption_hover ugallery-caption-never ugallery-caption-always ugallery-caption-hover';

		this.$el.find('.ugallery_item, .ugallery-thumb-title').removeClass(classes);

		this.$el.find('.ugallery_item').addClass('ugallery_caption_' + this.property('captionWhen'));
		this.$el.find('.ugallery-thumb-title').addClass('ugallery-caption-' + this.property('captionWhen'));
	},

	updatePadding: function() {
		this.calculateMargins();
		if (this.property('no_padding')[0] === 'true') {
			this.$el.addClass('no_padding');
		} else {
			this.$el.removeClass('no_padding');
		}
	},

	updateShowFilters: function() {
		if (this.property('labelFilters')[0] === 'true') {
			this.$el.find('.ugallery_labels').show();
			Upfront.frontFunctions.galleryBindShuffle();
		} else {
			this.$el.find('.ugallery_labels').hide();
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

		var linkControl = this.property('linkTo') === 'url' ? this.createLinkControl(image) : this.createControl('fullscreen', l10n.ctrl.show_image, 'openLightbox');
		panel.items = _([
			this.createControl('crop', l10n.ctrl.edit_image, 'imageEditMask'),
			linkControl,
			this.createControl('edit-labels', l10n.ctrl.edit_labels, 'openLightboxLabels')
		]);

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


	createLinkControl: function(image){
		var me = this,
			control = new Upfront.Views.Editor.InlinePanels.DialogControl();

		control.view = new Upfront.Views.Editor.LinkPanel({
			model: new Backbone.Model({
				type: image.get('urlType'),
				url: image.get('url')
			}),
			linkTypes: {image:true}
		});

		control.image = image;

		me.listenTo(control, 'panel:ok', function() {
			//call the panel linkOk method to let it parse the link,
			// later the link:ok event will be emitted and we will use it to
			// save the link.
			control.view.linkOk();
		});

		me.listenTo(control.view, 'link:ok', function(){
			me.updateLink(control);
		});

		me.listenTo(control, 'panel:open', function(){
			control.$el
				.closest('.ugallery-controls')
					.addClass('upfront-control-visible').end()
				.closest('.ugallery_link')
					.removeAttr('href') //Deactivate link when the panel is open
			;

			me.$el.closest('.ui-draggable').draggable('disable');
			me.$('.ugallery').sortable('disable');
		});

		me.listenTo(control, 'panel:close', function(){
			control.$el
				.closest('.ugallery-controls')
					.removeClass('upfront-control-visible').end()
				.closest('.ugallery_link')
					.attr('href', control.image.get('url'))
			;

			me.$el.closest('.ui-draggable').draggable('enable');
			me.$('.ugallery').sortable('enable');

			//Roll back the view, ready for reopen.
			control.view.render();
		});

		me.listenTo(control.view, 'link:postselected', function(linkData){
			control.image.set({
				urlType: linkData.type,
				ur: linkData.url
			});

			control.view.model.set(linkData);
			control.view.render();
			control.open();
		});

		control.icon = 'link';
		control.tooltip = l10n.ctrl.image_link;
		control.id = 'link';

		return control;
	},

	updateLink: function(control){
		var data = control.view.getCurrentValue();

		if(!data){
			return;
		}

		if (data.type === 'image') {
			data.url = control.image.get('srcFull');
		}

		control.image.set({
			urlType: data.type,
			url: data.url
		});

		control.view.model.set(data);
		control.render().close();
	},

	openLightbox: function(e, labels) {
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
					var title = $(this.container).find('.mfp-title'),
						wrapper = $(this.container).find('figure'),
						labelsTpl = $.trim(me.labelsTpl({labels: me.extractImageLabels(image.id), l10n: l10n.template}))
					;
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

					wrapper.addClass('gallery-labels-figure');
					wrapper.prepend(me.magnificLabelTpl({labels: labelsTpl, imageId: image.id, l10n: l10n.template}));

					var panel = wrapper.find('.ugallery-magnific-panel'),
						reveal = function(){
							panel.removeClass('closed');
							setTimeout(function(){
								panel.css('overflow', 'visible');
							}, 500);
						}
					;

					if(labels) {
						setTimeout(function(){
							reveal();
						}, 300);
					}

					wrapper
						.on('click', '.ugallery-magnific-toggle', function(){
							var panel = wrapper.find('.ugallery-magnific-panel');
							if(panel.hasClass('closed')){
								reveal();
							}
							else{
								panel.css('overflow', 'hidden').addClass('closed');
							}
						})
						.on('click', '.ugallery-magnific-addbutton', function(){
							wrapper.find('.ugallery-magnific-addbutton').hide();
							wrapper.find('.ugallery-magnific-addform').show()
								.find('#ugallery-addlabels').focus()
							;
						})
					;

					me.createLabelSelector(wrapper);
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

	openLightboxLabels: function(e){
		this.openLightbox(e, true);
	},

	getPropertiesForTemplate: function() {
		var props = this.extract_properties();

		props.imagesLength = props.images.length;
		props.editing = true;

		props.labels = this.labels;
		props.labels_length = this.labels.length;
		props.image_labels = this.imageLabels;

		props.l10n = l10n.template;
		props.in_editor = true;
		if (!props.no_padding) {
			props.no_padding = ['false'];
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
		if (!me.parent_module_view.$el.data('resizeHandling')) {
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
					.find('.ugallery-image-wrapper').append('<p class="ugallery-image-loading">' + l10n.loading + '</p>');
			}
		});

		if(_.indexOf(['ok', 'starting'], me.property('status')) === -1) {
			me.$('.upfront-gallery').append('<div class="upfront-quick-swap"><p>' + l10n.personalize + '</p></div>');
		}

		if (this.images && this.images.length) {
			var $upfrontObjectContent = this.$el.find('.upfront-object-content');
			if (this.$el.find('a.add-item').length < 1) {
				$('<b class="upfront-entity_meta upfront-ui add_item"><a href="" class="upfront-icon-button add-item"></a></b>').insertBefore($upfrontObjectContent);
			}
		}

		//Calculate margins now if it is possible
		if (me.$el.closest('body').length) {
			me.calculateMargins();
		}

		setTimeout(function() {
			//And now too
			me.calculateMargins();

			var items = me.$('.ugallery_item');
			_.each(items, function(i) {
				var item = $(i),
					image = me.images.get(item.attr('rel')),
					controls = me.createControls(image),
					title = item.find('.ugallery-thumb-title');


				controls.setWidth(item.width());
				controls.render();
				item.find('.ugallery-image-wrapper').append($('<div class="ugallery-controls upfront-ui"></div>').append(controls.$el));

				if (me.property('captionPosition') !== 'nocaption' && !title.data('ueditor')) {
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
							me.$el.removeClass('upfront-editing');
						})
						.on('syncAfter', function() {
							image.set('title', title.html());
						})
					;
				}

				if (me.showNoLabelsAlert(image.id)) {
					item.find('.ugallery-image-wrapper').append('<div class="ugallery-nolabels-alert" title="' + l10n.no_labels + '"></div>');
				}

				if(image.controls) {
					image.controls.remove();
				}
				image.controls = controls;
			});


		}, 300);

		this.activateSortable();
	},

	showNoLabelsAlert: function(imageId) {
		return this.imageLabels[imageId] &&
			this.property('labelFilters').length &&
			this.imageLabels[imageId].split(',').length < 2;
	},

	onElementResizing: function(){
		this.$('.ugallery_items').width($('html').find('.upfront-resize').width() - 30);
		this.calculateMargins();
	},

	onElementResizeStop: function(){
		this.render();
	},

	calculateMargins: function() {
		var container = this.$('.ugallery_items').width(),
			items = this.$('.ugallery_item'),
			itemWidth = items.outerWidth(),
			minMargin = 30,
			columns = Math.floor(container / itemWidth),
			margin, totalMargin, remaining
		;

		if (this.property('no_padding')[0] === 'true') {
			_.each(items, function(item){
				$(item).css('margin-right', 0);
			});
			return;
		}

		if(columns * itemWidth + (columns - 1 ) * minMargin > container) {
			columns--;
		}

		totalMargin = container - (columns * itemWidth);
		margin = Math.floor(totalMargin / (columns-1));
		remaining = container - (columns * itemWidth + margin * (columns-1));

		_.each(items, function(item, idx){
			var safetyPixel = idx % columns === 0 ? 1 : 0, //This pixel asure we are not exceding container width
				extra = columns - (idx % columns) < remaining ? 1 : 0
			;
			$(item).css('margin-right', (idx + 1) % (columns+1) ? margin + extra - safetyPixel : 0);
		});

		return 1;
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
		var ids = !_.isUndefined( this.imageLabels[imageId] ) ?  this.imageLabels[imageId].match(/-?\d+/g) : false ,
			labels = []
		;

		if(ids){
			_.each(this.labels, function(label){
				if(ids.indexOf(label.id.toString()) !== -1 && label.id !== 0) {
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
			selectType = false,
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
					element_id: element_id
				})
			);
		});

		if (me.property('status') !== 'ok') {
			me.property('status', 'ok');
			me.property('has_settings', 1);
			me.images.reset(models);
			selectType = true;
		} else if (replaceId) {
			var item = me.images.get(replaceId),
				idx = me.images.indexOf(item);

			me.images.remove(replaceId);
			me.images.add(models, {at: idx});
		} else {
			me.images.add(models);
		}

		me.render();
		if (selectType) {
			this.selectOnClick();
		}
	},

	selectOnClick: function(){
		var me = this,
			selector = $('<div class="upfront-ui ugallery-onclick"><div class="ugallery-onclick-dialog"><span>' + l10n.thumbnail_clicked +
				'</span><div class="ugallery-onclick-options"><a href="#" class="ugallery-lager_image" rel="image">' + l10n.show_larger +
				'</a><a href="#" class="ugallery-linked_page" rel="url">' + l10n.go_to_linked + '</a></div></div></div>')
		;

		selector.on('click', 'a', function(e){
			e.preventDefault();
			var value = $(e.target).attr('rel');
			me.property('linkTo', value, false);
			setTimeout(function(){
				selector.fadeOut('fast', function(){
					selector.remove();
					me.render();
				});
			}, 100);
		});

		this.$('.ugallery').append(selector.hide());
		selector.fadeIn();
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

			Upfront.Util.post(editOptions).done(function(response){

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
			editorOpts = this.getEditorOptions(image)
		;
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
			})
		;
	},

	getEditorOptions: function(image){
		var mask = this.$('.ugallery_item[rel=' + image.id + ']').find('.ugallery-image-wrapper'),
			full = image.get('sizes').full
		;
		return {
			id: image.id,
			maskSize: {width: mask.width(), height: mask.height()},
			maskOffset: mask.offset(),
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
		//this.render();
		this.calculateMargins();
	},

	createLabelSelector: function(contents){
		var me = this,
			imageId = contents.find('#ugallery-image-id').val()
		;
		contents.on('keyup', 'input[name="ugallery-image-labels"]', function(e){
			if([9, 13, 38, 40].indexOf(e.which) !== -1) {
				return;
			}

			var val = $(e.target).val(),
				allLabels = _.keys(Upfront.data.ugallery.label_names),
				labels = []
			;

			if(val.length < 2) {
				return $('.labels_list').html('');
			}

			_.each(allLabels, function(label){
				if(label.indexOf(val) !== -1){
					var lab = Upfront.data.ugallery.label_names[label],
						imageLabels = me.imageLabels[imageId]
					;
					if(imageLabels.indexOf('"label_' + lab.id + '"') === -1){
						labels.push({
							id: lab.id,
							text: lab.text.replace(val, '<span class="selection">' + val + '</span>')
						});
					}
				}
			});

			return $('.labels_list').html(me.labelSelectorTpl({labels: labels, l10n: l10n.template}));
		});

		contents
			.on('keydown', 'input[name="ugallery-image-labels"]', function(e){
				var goDown = function(labelsLi){
					var selected = labelsLi.find('label.selected'),
						currentIdx = -1,
						idx = 0;

					if(selected.length){
						selected.removeClass('selected');
					}

					while(idx < labelsLi.length && currentIdx === -1){
						currentIdx = labelsLi[idx] === selected.parent()[0] ? idx : -1;
						idx++;
					}

					if(currentIdx === -1) {
						$(labelsLi[0]).find('label').addClass('selected');
					} else if(currentIdx < labelsLi.length - 1) {
						$(labelsLi[currentIdx + 1]).find('label').addClass('selected');
					}
				};

				var goUp = function(labelsLi){
					var selected = labelsLi.find('label.selected'),
						currentIdx = -1,
						idx = 0;

					if(selected.length){
						selected.removeClass('selected');
					}

					while(idx < labelsLi.length && currentIdx === -1){
						currentIdx = labelsLi[idx] === selected.parent()[0] ? idx : -1;
						idx++;
					}

					if(currentIdx === -1) {
						$(labelsLi[labelsLi.length -1]).find('label').addClass('selected');
					} else if(currentIdx > 0) {
						$(labelsLi[currentIdx - 1]).find('label').addClass('selected');
					}
				};

				var label, labelsLi;
				if(e.which === 13){ // Enter
					e.preventDefault();
					var selected = contents.find('.labels_list label.selected');
					if(selected.length){
						var labelId = selected.attr('rel');
						label = Upfront.data.ugallery.label_ids[labelId];

						$(e.target).val('').siblings('.labels_list').html('');
						me.addLabel(label.text, imageId);
					} else{
						label = $.trim($(e.target).val());
						if(label.length){
							$(e.target).val('').siblings('.labels_list').html('');
							me.addLabel(label, imageId);
						}
					}
				} else if(e.which === 9 || e.which === 40){ // Tab or down
					labelsLi = contents.find('.labels_list li');
					if(labelsLi.length){
						e.preventDefault();
						goDown(labelsLi);
					}
				} else if(e.which === 38){ // Up
					labelsLi = contents.find('.labels_list li');
					if(labelsLi.length){
						e.preventDefault();
						goUp(labelsLi);
					}
				} else if(e.which === 27){ //Esc
					e.preventDefault();
					$(e.target).siblings('.labels_list').html('');
				}
			})
			.on('click', 'label', function(e){
				var labelId = $(e.target).attr('rel');
				if(labelId){
					var label = Upfront.data.ugallery.label_ids[labelId];
					me.addLabel(label.text, imageId);
					contents.find('input[name="ugallery-image-labels"]').val('').siblings('.labels_list').html('');
				}
			})
			.on('click', '.existing_labels a', function(e){
				e.preventDefault();
				var link = $(e.target),
					labelId = link.data('idx'),
					imageLabels = me.imageLabels[imageId].split(', '),
					data = {
						action: 'upfront-media-disassociate_label',
						'term': labelId,
						'post_id': imageId
					}
				;
				Upfront.Util.post(data);

				for(var idx in imageLabels){
					if(imageLabels[idx] && imageLabels[idx] === '"label_' + labelId + '"' ) {
						imageLabels.splice(idx, 1);
					}
				}

				me.imageLabels[imageId] = imageLabels.join(', ');

				me.deleteLabel(labelId, imageId);

				$(e.target).fadeOut('fast', function(){
					$(this).remove();
					me.render();
				});
			});

		return contents;
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
			data;

		if(label){
			var labelInGallery = false,
				i = 0,
				newImageLabel = false
			;
			while(i<this.labels.length && !labelInGallery){
				labelInGallery = this.labels[i].id === label.id;
				i++;
			}

			if(!labelInGallery){
				this.labels.push({
					id: label.id,
					text: label.text
				});

				this.imageLabels[imageId] = this.imageLabels[imageId] ? this.imageLabels[imageId] + ', "label_' + label.id + '"' : '"label_' + label.id + '"';
				newImageLabel = true;
			} else if(this.imageLabels[imageId].indexOf('label_' + label.id) === -1){
					this.imageLabels[imageId] += ', "label_' + label.id + '"';
					newImageLabel = true;
			}

			if(newImageLabel){
				data = {
					'action': 'upfront-media-associate_label',
					'term': label.id,
					'post_id': imageId
				};
				Upfront.Util.post(data);
			}
		} else {
			//Push a label with a temp id
			var me = this,
				tempId = - parseInt(Math.random() * 100, 10);

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

					Upfront.data.ugallery.label_names[text] = newLabel;
					Upfront.data.ugallery.label_ids[newLabel.id] = newLabel;
					delete(Upfront.data.ugallery.label_ids[tempId]);

					me.imageLabels[imageId] = imageLabels;

					_.each(me.labels, function(label){
						if(label.text === text) {
							label.id = newLabel.id;
						}
					});
				});

			this.renderLightboxLabels(imageId);
		}

		this.renderLightboxLabels(imageId);
		this.render();

	},

	renderLightboxLabels: function(imageId) {
		var lightboxLabels = $('.ugallery-magnific-wrapper');
		if(lightboxLabels.length){
			lightboxLabels.find('a').remove();
			lightboxLabels.prepend($.trim(this.labelsTpl({labels: this.extractImageLabels(imageId), l10n: l10n.template})));
		}
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
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
});

//Make the element parts available
Upfront.Application.LayoutEditor.add_object('Ugallery', {
	'Model': UgalleryModel,
	'View': UgalleryView,
	'Element': UgalleryElement,
	'Settings': UgallerySettings
});

Upfront.Models.UgalleryModel = UgalleryModel;
Upfront.Views.UgalleryView = UgalleryView;

}); //End require


})(jQuery);
