/*
	Replacing these identifiers in the following order for yours should make the element work.

	dir: upfront-gallery
	model: UgalleryModel
	view: UgalleryView
	element: UgalleryElement
	settings: UgallerySettings

	domain: ugallery
	uppercase: Gallery
	name: gallery
*/

(function ($) {

var templates = [
		'text!' + Upfront.data.ugallery.template, // Front
		'text!../elements/upfront-gallery/tpl/ugallery_editor.html'
	]
;

require(templates, function(galleryTpl, editorTpl) {
var UgalleryImage = Backbone.Model.extend({
	defaults: Upfront.data.ugallery.imageDefaults
});

var UgalleryImages = Backbone.Collection.extend({
	model: UgalleryImage
});

/* Model */
var UgalleryModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.ugallery.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);
	}
});


/* View */
var UgalleryView = Upfront.Views.ObjectView.extend(_.extend({}, /*Upfront.Mixins.FixedObjectInAnonymousModule,*/ {
	model: UgalleryModel,
	tpl: Upfront.Util.template(galleryTpl), //PHP compatible templates
	selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
	progressTpl: _.template($(editorTpl).find('#progress-tpl').html()),
	editorTpl: _.template($(editorTpl).find('#editor-tpl').html()),
	formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
	detailsTpl: _.template($(editorTpl).find('#details-tpl').html()),
	linkTpl: _.template($(editorTpl).find('#link-tpl').html()),
	labelsTpl: _.template($(editorTpl).find('#labels-tpl').html()),
	labelSelectorTpl: _.template($(editorTpl).find('#labels-selection-tpl').html()),
	magnificLabelTpl: _.template($(editorTpl).find('#magnific-labels-tpl').html()),
	images: [],
	sortMode: false,
	lastThumbnailSize: false,
	labels: [],
	imageLabels: {},

	reopenSettings: false,

	initialize: function(options){
		var me = this,
			elementId = this.property('element_id')
		;
		console.log('Gallery Element');

		if(! (this.model instanceof UgalleryModel)){
			this.model = new UgalleryModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
		//Upfront.Events.on('command:layout:save_success', this.checkDeleteElement, this);
		this.events = _.extend({}, this.events, {
			'click a.ugallery-select-images': 'openImageSelector',
			'click .ugallery_addmore_wrapper': 'openImageSelector',
			'click .ugallery_op_link': 'imageEditLink',
			'click .ugallery_op_mask': 'imageEditMask',
			'click .ugallery_item_rm_yes': 'removeImage',
			'click .ugallery-image-wrapper': 'selectItem',
			'click .upfront-quick-swap': 'openImageSelector',
			'click .ugallery-nolabels-alert': 'openLightboxLabels'
		});
		var images = this.property('images');

		this.images = new UgalleryImages(images);
		this.images.on('add remove reset change', this.imagesChanged, this);
		this.property('images', this.images.toJSON()); // Hack to add image defaults;

		$('body').on('click', this.closeTooltip);

		Upfront.Events.on("entity:settings:activate", this.closeTooltip);
		Upfront.Events.on("entity:activated", this.closeTooltip);
		Upfront.Events.on("entity:deactivated", this.closeTooltip);		
		Upfront.Events.on("entity:region:activated", this.closeTooltip);

		this.lastThumbnailSize = {width: this.property('thumbWidth'), height: this.property('thumbHeight')};

		if(typeof ugalleries != 'undefined' && ugalleries[elementId]){
			if(ugalleries[elementId].labels)
				this.labels = ugalleries[elementId].labels;
			if(ugalleries[elementId].image_labels)
				this.imageLabels = ugalleries[elementId].image_labels;
		}

		this.on('deactivated', this.sortCancel, this);
		this.model.on('settings:closed', function(e){
			me.checkRegenerateThumbs(e);
		});

		this.model.on('thumbChange', function(e){
			me.$('.ugallery-image-wrapper').css('overflow', 'hidden')
				.find('img').css({
					'min-width': '100%',
					'min-height': '100%',
					'margin': '0'
				});
		});

		this.createControls();

		$('body').on('click', function(e){
			var gallery = $('#' + me.property('element_id'));
			if(!e.gallerySelected && gallery.length)
				gallery.find('.ugallery_selected').removeClass('ugallery_selected');
		});

		if(!this.images.length)
			this.property('has_settings', 0);
	},

	selectItem: function(e){
		var item = $(e.target).hasClass('gallery_item') ? $(e.target) : $(e.target).closest('.ugallery_item');
		item.siblings().removeClass('ugallery_selected');
		if(!$(e.target).closest('.ugallery-controls').length)
			item.toggleClass('ugallery_selected');
		e.gallerySelected = true;
	},

	createControls: function(image){
		var me = this,		
			panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
			multi = new Upfront.Views.Editor.InlinePanels.MultiControl()
		;
		multi.sub_items = {
			over: this.createControl('over', 'Over image, bottom'),
			below: this.createControl('below', 'Below the image'),
			nocaption: this.createControl('nocaption', 'No caption')
		};

		multi.icon = 'caption';
		multi.tooltip = 'Caption position';
		multi.selected = this.property('captionPosition');
		multi.on('select', function(item){
			me.property('captionPosition', item, false);
		});

		var linkControl = this.property('linkTo') == 'url' ? this.createControl('link', 'Link image', 'imageEditLink') : this.createControl('fullscreen', 'Show image', 'openLightbox');
		panel.items = _([
			this.createControl('crop', 'Edit image', 'imageEditMask'),
			linkControl,
			multi,
			this.createControl('remove', 'Remove image', 'removeImage')
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

	openLightbox: function(e, labels){
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = me.images.get(item.attr('rel')),
			editor = false
		;

		$.magnificPopup.open({
			items: {
				src: item.find('.ugallery_link').attr('href')
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
						labelsTpl = $.trim(me.labelsTpl({labels: me.extractImageLabels(image.id)}))
						//labelsTpl = me.getLabelSelector(image.id)
					;
					if(title.length){
						editor = Upfront.Content.editors.add({
							type: Upfront.Content.TYPES.SIMPLE,
							editor_id: 'caption-' + image.get('id'),
							element: title
						});
						title.on('dblclick', function(e){
							editor.start();
						});

						wrapper.append(me.magnificLabelTpl({labels: labelsTpl, imageId: image.id}));

						var panel = wrapper.find('.ugallery-magnific-panel'),
							reveal = function(){
								panel.removeClass('closed');
								setTimeout(function(){
									panel.css('overflow', 'visible');
								}, 500);								
							}
						;

						if(labels)
							setTimeout(function(){
								reveal();
							}, 300);

						wrapper
							.on('click', '.ugallery-magnific-toggle', function(e){
								var panel = wrapper.find('.ugallery-magnific-panel');
								if(panel.hasClass('closed')){
									reveal();
								}
								else{
									panel.css('overflow', 'hidden').addClass('closed');
								}
							})
							.on('click', '.ugallery-magnific-addbutton', function(e){
								wrapper.find('.ugallery-magnific-addbutton').hide();
								wrapper.find('.ugallery-magnific-addform').show()
									.find('#ugallery-addlabels').focus()
								;
							})
						;

						me.createLabelSelector(wrapper);
					}
				},
				beforeClose: function() {
					console.log('Magnific closed');
					if(editor){
						var caption = image.get('caption'),
							newCaption = editor.getContents()
						;
						if(caption != newCaption){
							image.set('caption', newCaption);
							Upfront.Views.Editor.notify("Image description has been successfully updated.");
						}
					}
				}
			}
		});
	},

	openLightboxLabels: function(e){
		this.openLightbox(e, true);
	},

	get_content_markup: function () {
		var props = this.extract_properties();
			rendered = {}
		;

		props.imagesLength = props.images.length;
		props.editing = true;

		props.labels = this.labels;
		props.labels_length = this.labels.length;
		props.image_labels = this.imageLabels;

		rendered = this.tpl(props);

		return rendered;
	},

	on_render: function(){
		var me = this,
			skipMargin = me.$el.closest('body').length ? this.calculateMargins() : false
		;


		setTimeout(function(){
			var items = me.$('.ugallery_item');
			_.each(items, function(i){
				var item = $(i),
					image = me.images.get(item.attr('rel')),
					controls = me.createControls(image),
					title = item.find('.ugallery-thumb-title')
				;

				if(!skipMargin)
					me.calculateMargins();

				controls.setWidth(item.width());
				controls.render();
				item.find('.ugallery-image-wrapper').append($('<div class="ugallery-controls upfront-ui"></div>').append(controls.$el));
		
				if(me.property('captionPosition') != 'nocaption'){
					var editor = Upfront.Content.editors.add({
							type: Upfront.Content.TYPES.SIMPLE,
							editor_id: 'title-' + image.get('id'),
							element: title
						}),
						panels = me.$('.ugallery-thumb-title')
					;


					editor.on('change', function(content){
						image.set('title', content);
					});
					editor.on('blur', function(){
						editor.stop();
					});

					editor.on('textcolor:change', function(color){
						var value = color.toRgbString();
						me.property('captionColor', value);
						this.editor.textColor = value;
						panels.css('color', value);
					});

					editor.on('panelcolor:change', function(color){
						var value = color.toRgbString();
						me.property('captionBackground', value);
						this.editor.panelColor = value;
						panels.css('background-color', value);
					});

					title.on('dblclick', function(e){	
						editor.textColor = me.property('captionColor');
						editor.panelColor = me.property('captionBackground');			
						editor.start();
					});
				}

				if(
					me.imageLabels[image.id] &&
					me.property('labelFilters').length && 
					me.imageLabels[image.id].split(',').length < 2
				){
					item.find('.ugallery-image-wrapper').append('<div class="ugallery-nolabels-alert" title="This image has no labels"></div>');
				}

			});

			if(me.property('status') != 'ok')
				me.$('.upfront-gallery').append('<div class="upfront-quick-swap"><p>Click to personalize this gallery</p></div>');
		}, 300);

		this.activateSortable();		
	},

	calculateMargins: function() {
		var container = this.$('.ugallery_items').width(),
			items = this.$('.ugallery_item'),
			itemWidth = items.outerWidth(),
			minMargin = 30,
			columns = Math.floor(container / itemWidth)
		;

		if(columns * itemWidth + (columns - 1 ) * minMargin > container)
			columns--;

		var margin = Math.floor( (container - (columns * itemWidth)) / (columns - 1) ) - 2 * columns;

		_.each(items, function(it, idx){
			$(it).css('margin-right', (idx + 1) % columns ? margin : 0);
		});

		return 1;
	},

	getLabelSelector: function(imageId){
		var tpl = $($.trim(this.labelsTpl({labels: this.extractImageLabels(imageId)})));
		return tpl;
	},

	extractImageLabels: function(imageId){
		var ids = this.imageLabels[imageId].match(/-?\d+/g),
			labels = []
		;

		if(ids){
			_.each(this.labels, function(label){
				if(ids.indexOf(label.id.toString()) != -1 && label.id != 0)
					labels.push(label);
			});
		}

		return labels;
	},

	openImageSelector: function(e, replaceId){
		var me = this,
			selectorOptions = {
				multiple: true,
				preparingText: 'Preparing images'
			}
		;

		if(e)
			e.preventDefault();

		Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){			
			me.addImages(images, replaceId);

			if(response.given != response.returned)
				Upfront.Views.Editor.notify("Not all images could be added.", "warning");

			Upfront.Views.Editor.ImageSelector.close();
		});

	},

	addImages: function(images, replaceId){
		var me = this,
			thumbSize = {width: this.property('thumbWidth'), height: this.property('thumbHeight')},
			thumbRatio = thumbSize.width / thumbSize.height,
			imageData = [],
			editOptions = {action: 'upfront-media-image-create-size'},
			models = []
		;

		this.getNewLabels(_.keys(images));

		_.each(images, function(image, id){
			var full = {width: image.full[1], height: image.full[2]},
				cropSize = {width: Math.min(thumbSize.width, full.width), height: Math.min(thumbSize.height, full.height)},
				needsResizing = thumbSize.width < full.width && thumbSize.height < full.height,
				imageRatio = full.width / full.height,
				pivot = imageRatio > thumbRatio ? 'height' : 'width',
				factor = thumbSize[pivot] / full[pivot],
				resize = needsResizing ? {width: Math.round(full.width * factor), height: Math.round(full.height * factor)} : false,
				editorOpts = {
					id: id,
					rotate: 0,
					resize: resize,
					crop: {
						top: resize ? Math.floor((resize.height - cropSize.height) / 2) : (cropSize.height > thumbSize.height ? Math.floor(cropSize.height - thumbSize.height / 2) : 0),
						left: resize ? Math.floor((resize.width - cropSize.width) / 2) : (cropSize.width > thumbSize.width ? Math.floor(cropSize.width - thumbSize.width / 2) : 0),
						width: cropSize.width,
						height: cropSize.height
					}
				}
			;
			models.push(new UgalleryImage({
				id: id,
				srcFull: full[0],
				sizes: image,
				size: resize || cropSize,
				cropSize: cropSize,
				cropOffset: {left: editorOpts.crop.left, top: editorOpts.crop.top},
				src: '#',
				loading: true
			}));
			imageData.push(editorOpts);
		});

		editOptions.images = imageData;
		if(me.property('status') != 'ok'){
			me.images.set(models);
			me.property('status', 'ok');
		}
		else if(replaceId){
			var item = me.images.get(replaceId),
				idx = me.images.indexOf(item);

			me.images.remove(replaceId);
			me.images.add(models, {at: idx});
		}
		else{
			me.images.add(models);
		}
		me.render();

		_.each(models, function(image){
			me.$('.ugallery_item[rel="' + image.id  + '"]')
				.find('.ugallery-image-wrapper').append('<p class="ugallery-image-loading">Loading...</p>');
		});

		Upfront.Util.post(editOptions).done(function(response){
			var newImages = me.handleResizing(models, response);

			_.each(newImages, function(image){
				me.$('.ugallery_item[rel="' + image.id  + '"]').find('img').attr('src', image.get('src')).show().siblings('p').remove();
			});

			me.images.set(newImages, {remove: false, silent: true});
			me.imagesChanged();

			me.$('.ugallery-image-wrapper').css('overflow', '');
		});

		me.selectOnClick();
	},

	handleResizing: function(models, response){
		var images = response.data.images;

		_.each(models, function(model){
			var id = model.get('id'),
				changes = images[id]
			;

			if(changes && !changes.error){
				model.set({
					src: changes.url,
					srcFull: changes.urlOriginal,
					status: 'ok',
					loading: false
				}, {silent: true});
			}
		});

		return models;
	},

	selectOnClick: function(){
		var me = this,
			selector = $('<div class="upfront-ui ugallery-onclick"><div class="ugallery-onclick-dialog"><span>When a gallery thumbnail is clicked</span><div class="ugallery-onclick-options"><a href="#" class="ugallery-lager_image" rel="image">show larger image</a><a href="#" class="ugallery-linked_page" rel="url">go to linked page</a></div></div></div>')
		;

		selector.on('click', 'a', function(e){
			var value = $(e.target).attr('rel');
			me.property('linkTo', value, false);
			setTimeout(function(){
				selector.fadeOut('fast', function(){
					selector.remove();
				});
			}, 100);
		});

		$('#' + this.property('element_id')).append(selector.hide());
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
			console.log(images);
			_.each(images, function(labels, imageId){
				var imageLabels = [];

				_.each(labels, function(label){
					var globals = Upfront.data.ugallery,
						newLabel = {id: label.term_id, text: label.name}
					;

					if(!globals.label_names[label.name])
						globals.label_names[label.name] = newLabel;

					if(!globals.label_ids[label.term_id])
						globals.label_ids[label.term_id] = newLabel;


					var labelInGallery = false,
						i = 0
					;
					while(i<me.labels.length && !labelInGallery){
						labelInGallery = me.labels[i].id == label.term_id;
						i++;
					}
					if(!labelInGallery)
						me.labels.push(newLabel);

					imageLabels.push('"label_' + label.term_id + '"');
				});

				me.imageLabels[imageId] = imageLabels.join(', ');
			});
		});

		this.render();
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
		if(imageIds || this.lastThumbnailSize.width != this.property('thumbWidth') || this.lastThumbnailSize.height != this.property('thumbHeight')){
			
			var editOptions = {
					images: this.getRegenerateData(imageIds),
					action: 'upfront-media-image-create-size'
				}
				loading = new Upfront.Views.Editor.Loading({
					loading: "Regenerating images...",
					done: "Wow, those are cool!",
					fixed: false
				})
			;
			console.log('sent');
			console.log(editOptions.images);
			loading.render();
			this.parent_module_view.$el.append(loading.$el);

			Upfront.Util.post(editOptions).done(function(response){

				loading.done();
				var images = response.data.images,
					models = []
				;

				console.log('received');
				console.log(images);
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
			size = {width: this.property('size').width * factor, height: this.property('size').height * factor},
			imageData = [],
			images = this.images
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
					}
				}
			;
			imageData.push(editorOpts);
		});

		return imageData;
	},

	imageEditLink: function(e) {
		e.preventDefault();
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			tplOptions = image.toJSON(),
			contents = '',
			labels = this.getLabelSelector(item.attr('rel'))
		;
		tplOptions.checked = 'checked="checked"';

		contents = $(this.linkTpl(tplOptions))
			.on('change', 'input[name=ugallery-image-link]', function(e){
				me.imageLinkChanged(e);
			})
			.on('click', 'button.upfront-save_settings', function(e){
				me.saveImageLink(e);
			})
			.on('click', '.ugallery-change-link-post', function(e){
				me.imageLinkChanged(e);				
			})
		;

		contents.find('.existing_labels').html(labels);
		contents = this.createLabelSelector(contents);

		this.openTooltip(contents, $(e.target));
	},

	imageEditMask: function(e) {
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			editorOpts = this.getEditorOptions(image)
		;

		if(image.get('status') != 'ok'){
			var selectorOptions = {
				multiple: false,
				preparingText: 'Preparing images'
			};
			return Upfront.Views.Editor.ImageSelector.open(selectorOptions).done(function(images, response){			
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
			}).fail(function(result){
				me.render();
			})
		;
	},

	getEditorOptions: function(image){
		var me = this,
			mask = this.$('.ugallery_item[rel=' + image.id + ']').find('.ugallery-image-wrapper'),
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

	imagesChanged: function() {
		this.property('images', this.images.toJSON());
		//this.render();
		this.calculateMargins();
	},

	imageLinkChanged: function(e){
		var val = $('#ugallery-tooltip').find('input[name=ugallery-image-link]:checked').val(),
			imageId = $('#ugallery-tooltip').find('#ugallery-image-id').val() 
		;

		if(val == 'external'){
			$('#ugallery-image-link-url').show();
		}
		else{
			$('#ugallery-image-link-url').hide();
			if(val == 'post' || e.type != 'change'){
				var me = this,
					selectorOptions = {
						postTypes: this.postTypes()
					}
				;
				this.closeTooltip();

				Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
					var image = me.images.get(imageId);
					image.set({
						link: 'post',
						url: post.get('permalink')
					});
					var tplOptions = image.toJSON();
					tplOptions.checked = 'checked="checked"';
					setTimeout(function(){
						e.target = me.$('[rel=' + imageId + ']');
						me.imageEditLink(e);
					}, 200);
					//console.log(post);
				});
			}
		}
	},

	createLabelSelector: function(contents){
		var me = this,
			imageId = contents.find('#ugallery-image-id').val()
		;
		contents.on('keyup', 'input[name="ugallery-image-labels"]', function(e){
			if([9, 13, 38, 40].indexOf(e.which) != -1)
				return;

			var val = $(e.target).val(),
				allLabels = _.keys(Upfront.data.ugallery.label_names),
				labels = []
			;

			if(val.length < 2)
				return $('.labels_list').html('');

			_.each(allLabels, function(label){
				var idx = label.indexOf(val);
				if(idx != -1){
					var lab = Upfront.data.ugallery.label_names[label],
						imageLabels = me.imageLabels[imageId]
					;
					if(imageLabels.indexOf('"label_' + lab.id + '"') == -1){
						labels.push({
							id: lab.id,
							text: lab.text.replace(val, '<span class="selection">' + val + '</span>')
						});
					}
				}
			});

			return $('.labels_list').html(me.labelSelectorTpl({labels: labels}));
		});
		contents.on('keydown', 'input[name="ugallery-image-labels"]', function(e){

			var goDown = function(labelsLi){
				var selected = labelsLi.find('label.selected');
				if(selected.length){
					selected.removeClass('selected');
				}
				var currentIdx = -1,
					idx = 0
				;
				while(idx < labelsLi.length && currentIdx == -1){
					currentIdx = labelsLi[idx] == selected.parent()[0] ? idx : -1;
					idx++;
				}

				if(currentIdx == -1)
					$(labelsLi[0]).find('label').addClass('selected');
				else if(currentIdx < labelsLi.length - 1)
					$(labelsLi[currentIdx + 1]).find('label').addClass('selected');

			};

			var goUp = function(labelsLi){
				var selected = labelsLi.find('label.selected');
				if(selected.length){
					selected.removeClass('selected');
				}
				var currentIdx = -1,
					idx = 0
				;
				while(idx < labelsLi.length && currentIdx == -1){
					currentIdx = labelsLi[idx] == selected.parent()[0] ? idx : -1;
					idx++;
				}

				if(currentIdx == -1)
					$(labelsLi[labelsLi.length -1]).find('label').addClass('selected');
				else if(currentIdx > 0)
					$(labelsLi[currentIdx - 1]).find('label').addClass('selected');

			};

			if(e.which == 13){ // Enter
				e.preventDefault();
				var selected = contents.find('.labels_list label.selected');
				if(selected.length){
					var labelId = selected.attr('rel'),
						label = Upfront.data.ugallery.label_ids[labelId]
					;

					$(e.target).val('').siblings('.labels_list').html('');
					me.addLabel(label.text, imageId);
				}
				else{
					var label = $.trim($(e.target).val());
					if(label.length){
						$(e.target).val('').siblings('.labels_list').html('');
						me.addLabel(label, imageId);
					}
				}
			}
			else if(e.which == 9 || e.which == 40){ // Tab or down
				var labelsLi = contents.find('.labels_list li');
				if(labelsLi.length){
					e.preventDefault();
					goDown(labelsLi);
				}
			}
			else if(e.which == 38){ // Up 
				var labelsLi = contents.find('.labels_list li');
				if(labelsLi.length){
					e.preventDefault();
					goUp(labelsLi);
				}
			}
			else if(e.which == 27){ //Esc
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
				deleteLabel = true,
				data = {
					action: 'upfront-media-disassociate_label',
					"term": labelId,
					"post_id": imageId
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					console.log(response);
				})
			;

			for(var idx in imageLabels){
				if(imageLabels[idx] && imageLabels[idx] == '"label_' + labelId + '"' )
					imageLabels.splice(idx, 1);
			}

			me.imageLabels[imageId] = imageLabels.join(', ');

			me.images.each(function(image){
				if(image.id != imageId && me.imageLabels[imageId].indexOf('"label_' + labelId + '"') != -1){
					deleteLabel = false;
				}
			});

			if(deleteLabel){
				for(var idx in me.labels){
					if(me.labels[idx] && me.labels[idx].id == labelId)
						me.labels.splice(idx, 1);
				}
			}

			$(e.target).fadeOut('fast', function(){
				$(this).remove();
				me.render();
			});
		});

		return contents;
	},

	addLabel: function(text, imageId){
		var label = Upfront.data.ugallery.label_names[text];
		if(label){
			var labelInGallery = false,
				i = 0,
				newImageLabel = false
			;
			while(i<this.labels.length && !labelInGallery){
				labelInGallery = this.labels[i].id == label.id;
				i++;
			}

			if(!labelInGallery){
				this.labels.push({
					id: label.id,
					text: label.text
				});

				this.imageLabels[imageId] = this.imageLabels[imageId] ? this.imageLabels[imageId] + ', "label_' + label.id + '"' : '"label_' + label.id + '"';
				newImageLabel = true;
			}
			else if(this.imageLabels[imageId].indexOf('label_' + label.id) == -1){
					this.imageLabels[imageId] += ', "label_' + label.id + '"';
					newImageLabel = true;
			}

			if(newImageLabel){
				this.renderLabels(imageId);
				var data = {
					"action": "upfront-media-associate_label",
					"term": label.id,
					"post_id": imageId
				}
				Upfront.Util.post(data)
					.success(function (response) {
						console.log(response);
					})
				;
			}
		}
		else{
			//Push a label with a temp id
			var me = this,
				tempId = - parseInt(Math.random() * 100, 10),
				label = {
					id: tempId,
					term_id: tempId,
					text: text
				},
				data = {
					"action": "upfront-media-add_label",
					"term": text,
					"post_id": imageId
				}
			;
			Upfront.data.ugallery.label_names[text] = label;
			Upfront.data.ugallery.label_ids[tempId] = label;

			this.labels.push(label);
			this.imageLabels[imageId] = this.imageLabels[imageId] ? this.imageLabels[imageId] + ', "label_' + tempId + '"' : '"label_' + tempId + '"';

			$('#ugallery-tooltip').find('.existing_labels').html(this.labelsTpl({labels: this.extractImageLabels(imageId)}));

			Upfront.Util.post(data)
				.success(function (response) {
					console.log(response);

					//Replace the temp label
					var thisLabels = response.data[imageId],
						imageLabels = [],
						newId = 0,
						newLabel = {}
					;

					_.each(thisLabels, function(label){
						imageLabels.push('"label_' + label + '"');
						if(!Upfront.data.ugallery.label_ids[label])
							newId = label;
					});

					imageLabels = imageLabels.join(', ');
					newLabel = {
						id: newId,
						text: text
					}

					Upfront.data.ugallery.label_names[text] = newLabel;
					Upfront.data.ugallery.label_ids[newLabel.id] = newLabel;
					delete(Upfront.data.ugallery.label_ids[tempId]);

					me.imageLabels[imageId] = imageLabels;

					_.each(me.labels, function(label){
						if(label.text == text)
							label.id = newLabel.id;
					});
				});

				this.renderLightboxLabels(imageId);
			;
		}

		this.renderLightboxLabels(imageId);
		this.render();

	},

	renderLabels: function(imageId){
		$('#ugallery-tooltip').find('.existing_labels').html(this.labelsTpl({labels: this.extractImageLabels(imageId)}));
	},

	renderLightboxLabels: function(imageId) {
		var lightboxLabels = $('.ugallery-magnific-wrapper');
		if(lightboxLabels.length){
			lightboxLabels.find('a').remove();
			lightboxLabels.prepend($.trim(this.labelsTpl({labels: this.extractImageLabels(imageId)})));
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

	saveImageLink: function(e){
		var tooltip = $('#ugallery-tooltip'),
			linkVal = tooltip.find('input[name=ugallery-image-link]:checked').val(),
			imageId = tooltip.find('#ugallery-image-id').val(),
			urlVal = tooltip.find('#ugallery-image-link-url').val()
		;
		if(linkVal == 'external' || linkVal == 'post')
			this.images.get(imageId).set({'link': linkVal, 'url': urlVal});
		else
			this.images.get(imageId).set({link: 'original', url: ''});

		this.closeTooltip();
		return this.render();
		
	},

	getItemElement: function(e){
		return $(e.target).closest('.ugallery_item');
	},

	removeImage: function(e){
		var me = this,
			item = this.getItemElement(e);
		e.preventDefault();
		item.fadeOut('fast', function(){
			me.images.remove(item.attr('rel'));
			me.imagesChanged();
			me.render();
		});
	},

	activateSortable: function(){
		var me = this;

		this.$('.ugallery').sortable({
			items: 'div.ugallery_item:not(.ugallery_addmore)',
			//placeholder: "ugallery-sortable-placeholder",
			start: function(e, ui){
				console.log('draggin');
				me.$el.addClass('ugallery_sorting');
			},
			stop: function (e, ui){
				me.$el.removeClass('ugallery_sorting');
			},
			update: function() {
				me.sortOk();
			},
			change: function(e, ui){
			},
			delay: 500,
			cancel: ".ugallery-thumb-title"
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
			if(id)
				newOrder.push(me.images.get(id));
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
		;

		Upfront.Events.trigger("entity:settings:deactivate");	
	},

	closeTooltip: function(){
		$('#ugallery-tooltip').remove();
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
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
}));

/* Element */
var UgalleryElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 30,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-gallery');
		this.$el.html('Gallery');
	},
	add_element: function () {
		var object = new UgalleryModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c22 upfront-ugallery_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 16}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});

var UgallerySettings = Upfront.Views.Editor.Settings.Settings.extend({
	initialize: function () {
		var me = this;

		this.panels = _([
			new LayoutPanel({model: this.model}),
			new ThumbnailsPanel({model: this.model})
		]);

		this.on('closed', function(){
			me.model.trigger('settings:closed');
		});
	},
	get_title: function () {
		return "Gallery settings";
	},


});

var LayoutPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var me = this,
			fields = Upfront.Views.Editor.Field
		;

		this.settings = _([
			new Upfront.Views.Editor.Settings.Item({
				title: 'Show Caption',
				fields: [
					new fields.Radios({
						model: this.model,
						property: 'captionWhen',
						values: [
							{value: 'always', label: 'Always'},
							{value: 'hover', label: 'On hover'}
						]
					})
				]
			}),
			new Upfront.Views.Editor.Settings.Item({
				group: false,
				fields: [
					new fields.Checkboxes({
						model: this.model,
						property: 'labelFilters',
						values: [
							{
								value: 'true',
								label: 'Enable label sorting'
							}
						]
					})
				]
			}),
			new Upfront.Views.Editor.Settings.Item({
				group: false,
				fields: [
					new Field_Button({
						model: this.model,
						info: 'Reset gallery settings to the default theme',
						label: 'Reset',
						on_click: function(e){
							me.resetSettings(e);
						}
					})
				]
			})
		]);
	},

	resetSettings: function(e) {
		e.preventDefault();

		if(confirm('Are you sure that you want to reset this gallery to the theme\'s default settings?')){
			var me = this,
				defaults = Upfront.data.ugallery.defaults,
				themeDefaults = Upfront.data.ugallery.themeDefaults,
				settings = _.extend({}, defaults, themeDefaults),
				images = me.model.get_property_value_by_name('images')
			;

			_.each(settings, function(value, key){
				me.model.set_property(key, value, true);
			});

			me.model.set_property('images', images, true);
			me.model.set_property('status', 'ok');

			Upfront.Events.trigger("entity:settings:deactivate");
		}
	},

	get_label: function () {
		return 'Layout';
	},
	get_title: function () {
		return false;
	}
});


var ThumbnailsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var me = this,
			fields = Upfront.Views.Editor.Field
		;
		this.settings = _([
			new ThumbnailFields({model: this.model})
		]);

		this.on('rendered', function(){
			$(me.$('.ugallery-thumbnail-fields')
				.find('.upfront-field-wrap-number')
				.get(0))
				.after('<div class="ugallery-proportional"></div>')
			;

			me.setEvents([
				//['click', '.ugallery-proportional', 'lockProportions'],
				['change', 'input[name=thumbWidth]', 'onThumbChangeSize'],
				['change', 'input[name=thumbProportions]', 'onThumbChangeProportions']
			]);

		});
	},

	get_label: function () {
		return 'Thumbnails';
	},
	get_title: function () {
		return false;
	},

	setEvents: function(events){
		var me = this;
		_.each(events, function(event){
			me.$el.on(event[0], event[1], function(e){
				me[event[2]](e);
			});
		});
	},

	onThumbChangeSize: function(e){
		var me = this,
			factor = this.property('thumbProportions'),
			width = $(e.target).val(),
			height = Math.round($(e.target).val() / factor)
		;
		if(factor == 'theme')
			factor = 1;
		this.$('input[name=thumbHeight]').val(height);

		this.property('thumbWidth', width);
		this.property('thumbHeight', height, false);

		this.model.trigger('thumbChange');

		return height;
	},

	onThumbChangeProportions: function(e) {
		var me = this,
			factor = $(e.target).val(),
			input = this.$('input[name=thumbWidth]'),
			width = input.val()
		;

		if(factor == 'theme')
			factor = 1;

		this.property('thumbProportions', factor);
		var height = this.onThumbChangeSize({target: input[0]});
		
		this.$('input[name=thumbWidth]')
			.siblings('.upfront-field-slider-value')
				.text('(' + width +'px x ' + height + 'px)')
		;

		this.model.trigger('thumbChange');
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

var Field_Button = Upfront.Views.Editor.Field.Field.extend({
	init: function() {
		console.log('Button!!');
	},
	events: {
		'click button': 'buttonClicked'
	},
	render: function() {
		this.$el.html(this.get_field_html());
	},
	get_field_html: function() {
		return '<p class="upfront-field-button-info">' + this.options.info + '</p><button class="upfront-field-button ugallery-reset-button">' + this.options.label + '</button>';
	},
	buttonClicked: function(e) {
		if(this.options.on_click)
			this.options.on_click(e);
	},
	isProperty: false
});

var ThumbnailFields = Upfront.Views.Editor.Settings.Item.extend({
	className: 'align-center ugallery-thumbnail-fields',
	initialize: function(){
		var me = this,
			fields = Upfront.Views.Editor.Field
		;

		this.fields = _([
			new fields.Radios({
				model: this.model,
				property: 'thumbProportions',
				label: 'Crop',
				layout: 'vertical',
				values: [
					{
						label: 'Theme',
						value: 'theme',
						icon: 'gallery-crop-theme'
					},
					{
						label: '1:1',
						value: '1',
						icon: 'gallery-crop-1_1'
					},
					{
						label: '2:3',
						value: '0.66',
						icon: 'gallery-crop-2_3'
					},
					{
						label: '4:3',
						value: '1.33',
						icon: 'gallery-crop-4_3'
					}
				]
			}), 

			new fields.Slider({
				model: this.model,
				property: 'thumbWidth',
				min: 100,
				max: 250,
				step: 5,
				label: 'Size',
				info: 'Slide to resize the thumbnails.',
				valueTextFilter: function(value){
					return '(' + value + 'px x ' + me.model.get_property_value_by_name('thumbHeight') + 'px)';
				}
			}),
			new fields.Hidden({
				model: this.model,
				property: 'thumbHeight'
			})
		]);
	},
	get_title: function(){
		return "Thumbnails Settings";
	}
});

//Make the element parts available
Upfront.Application.LayoutEditor.add_object("Ugallery", {
	"Model": UgalleryModel, 
	"View": UgalleryView,
	"Element": UgalleryElement,
	"Settings": UgallerySettings
});

Upfront.Models.UgalleryModel = UgalleryModel;
Upfront.Views.UgalleryView = UgalleryView;

}); //End require


})(jQuery);