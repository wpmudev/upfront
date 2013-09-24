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
	defaults: {
		id: 0,
		src: 'http://imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
		srcFull: 'http://imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
		sizes: {},
		size: {width: 0, height: 0},
		cropSize: {width: 0, height: 0},
		cropOffset: {top: 0, left: 0},
		rotation: 0,
		link: 'original',
		url: '',
		title: '',
		caption: '',
		alt: '',
		tags: []
	}
});

var UgalleryImages = Backbone.Collection.extend({
	model: UgalleryImage
});

/* Model */
var UgalleryModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.ugallery.defaults);
		properties.element_id = Upfront.Util.get_unique_id("ugallery-object");
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
	images: [],
	sortMode: false,
	lastThumbnailSize: false,
	labels: [],
	imageLabels: {},

	reopenSettings: false,

	initialize: function(options){
		var me = this;
		console.log('Gallery Element');

		if(! (this.model instanceof UgalleryModel)){
			this.model = new UgalleryModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
		//Upfront.Events.on('command:layout:save_success', this.checkDeleteElement, this);
		this.events = _.extend({}, this.events, {
			'click a.ugallery-select-images': 'openImageSelector',
			'click .ugallery_addmore': 'openImageSelector',
			'click .ugallery_op_details': 'imageEditDetails',
			'click .ugallery_op_remove': 'imageEditRemove',
			'click .ugallery_op_link': 'imageEditLink',
			'click .ugallery_op_mask': 'imageEditMask',
			'click .ugallery_item_rm_yes': 'removeImage',
			'click .ugallery_item_rm_no': 'cancelRemoving',
			'click .ugallery_sort_toggle': 'activateSortable'
		});

		this.images = new UgalleryImages(this.property('images'));
		this.images.on('add remove reset change', this.imagesChanged, this);

		$('body').on('click', this.closeTooltip);

		Upfront.Events.on("entity:settings:activate", this.closeTooltip);
		Upfront.Events.on("entity:activated", this.closeTooltip);
		Upfront.Events.on("entity:deactivated", this.closeTooltip);		
		Upfront.Events.on("region:activated", this.closeTooltip);

		this.lastThumbnailSize = {width: this.property('thumbWidth'), height: this.property('thumbHeight')};
/*
		if(ugalleries && ugalleries[this.property('element_id')]){
			if(ugalleries[this.property('element_id')].grid['labels'])
				this.labels = ugalleries[this.property('element_id')].grid['labels'];
			if(ugalleries[this.property('element_id')].grid['image_labels'])
			this.imageLabels = ugalleries[this.property('element_id')].grid['image_labels'];
		}
*/
		this.on('deactivated', this.sortCancel, this);
		this.model.on('settings:closed', function(e){
			me.checkRegenerateThumbs(e);
		});
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

	get_buttons: function(){
		if(this.images && this.images.length > 1)
			return '<a href="#" class="upfront-icon-button ugallery_sort_toggle" title="Sort Gallery"></a>';
		return '';
	},

	openOverlaySection: function(tpl, tplOptions, callback){
		var me = this,
			settings = $('#settings'),
			overlay = $('#upfront-image-overlay'),
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			bodyOverlay = $('#' + me.property('element_id'))
		;

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

		overlay = $('<div id="upfront-image-overlay" class="ugallery-overlay"></div>').append(tpl(tplOptions)).hide();

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
				}
			})
		;
		$(document)
			.on('scroll', function(){
			});
		;	

		if(settings.is(':visible')){
			settings.fadeOut();
			this.reopenSettings = true;
		}

		if(callback)
			callback(overlay);
	},

	setOverlayEvents: function() {
		var me = this;
		$('#upfront-image-overlay')
			.on('click', function(e){
				me.closeOverlay(e);
			})
			.on('click', 'a.select-files', function(e){
				me.openFileBrowser(e);
			})
			.on('click', 'a.image-edit-change', function(e){
				me.openImageSelector(e);
			})
			.on('click', 'a.open-media-gallery', function(e){
				me.openMediaGallery(e);
			})
			.on('click', '.upfront-image-section', function(e){
				e.stopPropagation();
			})
		;

	},


	openFileBrowser: function(e){
	    console.log('clicking');
		$('#upfront-image-file-input').click();
	},

	openMediaGallery: function(e) {
		var me = this;
		e.preventDefault();
		Upfront.Media.Manager.open({
			media_type:['images']
		}).done(function(popup, result){
			if(result && result.length > 0){
				var ids = [];
				result.each(function(image){
					ids.push(image.get('ID'));
				});
				me.getImageData(ids)
					.done(function(sizes){
						me.addImages(sizes.data);
						me.closeOverlay();
					})
				;

				me.openProgress(function(){
					$('#upfront-image-uploading h2').html('Preparing Images');
				});
			}
		});
	},

	getImageData: function(ids) {
		var me = this;
		return Upfront.Util.post({
				action: 'upfront-media-image_sizes',
				item_id: JSON.stringify(ids)
			})
			.done(function(response){
				me.sizes = response.data.images[me.imageId];
			})	
		;
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

	openImageSelector: function(e){
		var me = this;

		if(e)
			e.preventDefault();

		this.openOverlaySection(this.selectorTpl, {}, function(overlay){
			if(! $('#upfront-upload-image').length){
				$('body').append(me.formTpl({url: Upfront.Settings.ajax_url}));

				$('#upfront-image-file-input').on('change', function(e){
					me.openProgress(function(){
						me.uploadImages();
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

	openProgress: function(callback){
		var me = this;
		this.openOverlaySection(this.progressTpl, {}, function(){
            me.resizeOverlay();
            callback();
		});
	},

	uploadImages: function(e){
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
				$('#upfront-image-uploading h2').html('Preparing Images');
			},
			success: function(response){
				progress.css('width', '100%');
				console.log(response);
				me.getImageData(response.data)
					.done(function(sizes){
						me.addImages(sizes.data);
						me.closeOverlay();
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

	addImages: function(imageData){
		var me = this,
			images = imageData.images,
			newImages = []
		;
		_.each(images, function(image, id){
			var data = image.thumbnail ? image.thumbnail : image.full,
				cropSize = {width: data[1], height: data[2]},
				ratio = Math.round((cropSize.width / cropSize.height) * 100) / 100,
				fullRatio = Math.round((image.full[1] / image.full[2]) * 100) / 100,
				cropOffset = {top: 0, left: 0},
				size = cropSize
			;

			if(ratio != fullRatio){
				var crop = me.getCropOffset(size, {width: image.full[1], height: image.full[2]});
				size = crop.size;
				cropOffset = crop.offset;
			}
			
			newImages.push({
				id: id,
				sizes: image,
				size: size,
				cropSize: cropSize,
				cropOffset: cropOffset,
				src: data[0],
				srcFull: image.full[0],
				position: me.centeredPosition({width: size[1], height: size[2]})
			})
		});

		this.images.add(newImages);

		if(imageData.given != imageData.returned)
			Upfront.Views.Editor.notify("Not all images could be added.", "warning");	
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
		}

		return {
			top: ((wrapperSize.height - imgSize.height) / 2) / wrapperSize.height * 100,
			left: ((wrapperSize.width - imgSize.width) / 2) / wrapperSize.width * 100
		}
	},

	checkRegenerateThumbs: function(e){
		var me = this;
		if(this.lastThumbnailSize.width != this.property('thumbWidth') || this.lastThumbnailSize.height != this.property('thumbHeight')){
			
			var editOptions = {
					images: this.getRegenerateData(),
					action: 'upfront-media-image-create-size'
				},
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

				me.images.set(models);
				me.imagesChanged();
				me.lastThumbnailSize = {width: me.property('thumbWidth'), height: me.property('thumbHeight')};
			});

			
			console.log('thumbnail regeneration not implemented');
			
		}
	},

	getRegenerateData: function(){
		var me = this,
			widthFactor = this.property('thumbWidth') / this.lastThumbnailSize.width,
			heightFactor = this.property('thumbHeight') / this.lastThumbnailSize.height,
			factor = widthFactor > heightFactor ? widthFactor : heightFactor,
			size = {width: this.property('size').width * factor, height: this.property('size').height * factor},
			imageData = []
		;

		this.images.each(function(image){
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

	imageEditDetails: function(e) {
		e.preventDefault();
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			contents = $(this.detailsTpl(image.toJSON()))
				.on('click', '.upfront-save_settings', function(e){
					me.saveImageDetails(e);
				})
		;
		this.openTooltip(contents, item);
	},

	imageEditRemove: function(e) {
		e.preventDefault();
		$(e.target).closest('.ugallery_item').addClass('ugallery_item_removing');
	},

	imageEditLink: function(e) {
		e.preventDefault();
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			tplOptions = image.toJSON(),
			contents = ''
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
		this.openTooltip(contents, item);
	},

	imageEditMask: function(e) {
		var me = this,
			item = $(e.target).closest('.ugallery_item'),
			image = this.images.get(item.attr('rel')),
			editorOpts = this.getEditorOptions(image)
		;
		e.preventDefault();
		Upfront.Views.Editor.ImageEditor.open(editorOpts)
			.done(function(result){
				image.set({
					src: result.src,
					srcFull: result.src,
					cropSize: result.cropSize,
					size: result.imageSize,
					cropOffset: result.imageOffset,
					rotation: result.rotation
				})
			})
			.fail(function(result){
				me.render();
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
			rotation: image.get('rotation')
		}
	},

	imagesChanged: function() {
		this.property('images', this.images.toJSON());
		this.render();
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
						e.target = me.$('[rel=' + imageId + ']')
						me.imageEditLink(e);
					}, 200);
					//console.log(post);
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

	saveImageDetails: function(e){
		var tooltip = $('#ugallery-tooltip'),
			imageId = tooltip.find('#ugallery-image-id').val()
		;

		this.images.get(imageId).set({
			title: tooltip.find('input[name=ugallery-image-title]').val(),
			caption: tooltip.find('input[name=ugallery-image-caption]').val(),
			alt: tooltip.find('input[name=ugallery-image-alt]').val()
		});
		this.closeTooltip();
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

		return this.closeTooltip();
		
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
		})
	},

	cancelRemoving: function(e){
		e.preventDefault();
		this.getItemElement(e).removeClass('ugallery_item_removing');
	},

	activateSortable: function(){
		var me = this,
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			info = ''

		;
		if(!parent.find('.ugallery-sort-info').length)
			info = $('<div class="ugallery-sort-info"><a class="ugallery_order_ok" href="#">I like this</a>Drag the images to sort the gallery</div>')
					.on('click', '.ugallery_order_ok', function(e){
						e.preventDefault();
						me.sortOk();
					})
			;

		this.$('.ugallery').sortable({
			items: 'div.ugallery_item:not(.ugallery_addmore)',
			//placeholder: "ugallery-sortable-placeholder",
			start: function(e, ui){
				console.log('draggin');
			}
		});
		this.$el.addClass('ugallery_sorting');

		this.$('.ugallery_item_removing').removeClass('ugallery_item_removing');

		//Stop element draggable
		if (parent.is(".ui-draggable"))
			parent.draggable('disable');

		this.parent_module_view.$('.upfront-icon-button').css({
			opacity: '.3'
		});
		this.$('.ugallery_sort_toggle').css({
			opacity: '.9'
		});

		parent.append(info);
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
		this.sortCancel();
	},

	sortCancel: function() {
		var parent = this.parent_module_view.$('.upfront-editable_entity:first');

		this.$el.removeClass('ugallery_sorting');

		try {
			this.$('.ugallery').sortable('destroy');
		}
		catch(e) {
			//Nothing here
		}

		//Restart element draggable
		parent.draggable('enable');
		this.render();


		this.parent_module_view.$('.upfront-icon-button').css({
			opacity: '.9'
		});
		this.parent_module_view.$('.ugallery-sort-info').remove();
	},

	openTooltip: function(content, element){
		var tooltip = $('#ugallery-tooltip'),
			elementPosition = element.offset(),
			tooltipPosition = {
				top: elementPosition.top,
				left: elementPosition.left - 280
			}
			tooltipClass = 'ugallery-tooltip-left',
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
			tooltipClass = 'ugallery-tooltip-right';
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
			});
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
					{"name": "class", "value": "c6 upfront-ugallery_module"},
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

var UgallerySettings = Upfront.Views.Editor.Settings.Settings.extend({
	initialize: function () {
		var me = this;

		this.panels = _([
			new LayoutPanel({model: this.model}),
			new ThumbnailsPanel({model: this.model}),
			new LargeImagePanel({model: this.model})
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
		this.settings = _([
			new GalleryConfigFields({model: this.model}),
			new Upfront.Views.Editor.Settings.Item({
				group: false,
				fields: [
					new Field_Button({
						model: this.model,
						info: 'Reset gallery settings to the default theme',
						label: 'Reset',
						on_click: function(){
							alert('Button clicked');
						}
					})
				]
			})
		]);
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
			new ThumbnailFields({model: this.model}),
			new Upfront.Views.Editor.Settings.Item({
				group: false,
				fields: [
					new fields.Checkboxes({
						model: this.model,
						property: 'showTitle',
						values: [
							{
								value: 'true',
								label: 'Show Image Title'
							}
						]
					}),
					new fields.Checkboxes({
						model: this.model,
						property: 'showDescription',
						values: [
							{
								value: 'true',
								label: 'Show Image Description'
							}
						]
					})
				]
			})
		]);

		this.on('rendered', function(){
			var locked = me.property('lockThumbProportions') ? '' : 'ugallery-proportional-free';

			$(me.$('.ugallery-thumbnail-fields')
				.find('.upfront-field-wrap-number')
				.get(0))
				.after('<div class="ugallery-proportional ' + locked + '"></div>')
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
	/*
	lockProportions: function(e){
		var proportions = this.property('lockThumbProportions');
		if(proportions)
			this.property('lockThumbProportions', false, true);
		else{
			var dimensions = this.$('input[type=number]'),
				width = $(dimensions.get(0)).val(),
				height = $(dimensions.get(1)).val()
			;
			this.property('lockThumbProportions', width / height, true);
		}
		this.$('.ugallery-proportional').toggleClass('ugallery-proportional-free');
	},
	*/

	onThumbChangeSize: function(e){
		var me = this,
			factor = this.property('thumbProportions')
			width = $(e.target).val(),
			height = Math.round($(e.target).val() / factor)
		;
		if(factor == 'theme')
			factor = 1;
		this.$('input[name=thumbHeight]').val(height);

		this.property('thumbWidth', width);
		this.property('thumbHeight', height, false);

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


var LargeImagePanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var me = this,
			render_all = function(){
				this.settings.invoke('render');
			}
		;
		this.settings = _([
			new LightboxFields({model: this.model})
		]);
	},

	get_label: function () {
		return 'Large Image';
	},
	get_title: function () {
		return false;
	}
});

var GalleryConfigFields = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function(){
		var me = this,
			fields = Upfront.Views.Editor.Field
		;

		this.fields = _([
			new fields.Checkboxes({
				model: this.model,
				property: 'labelFilters',
				values: [
					{
						label: 'Show Label Filters',
						value: 'true'
					}
				]
			}),
			new fields.Checkboxes({
				model: this.model,
				property: 'urlIcon',
				values: [
					{
						label: 'Show URL icon on RollOver',
						value: 'true'
					}
				]
			}),
			new fields.Checkboxes({
				model: this.model,
				property: 'disableLightbox',
				values: [
					{
						label: 'Disable lightbox',
						value: 'true'
					}
				]
			})
		]);
	},
	get_title: function(){
		return "Gallery Configuration";
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
		return '<p class="upfront-field-button-info">' + this.options.info + '</p><button class="upfront-field-button">' + this.options.label + '</button>';
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
			}), /*
			new fields.Number({
				model: this.model,
				property: 'thumbWidth',
				min: 50,
				max: 400,
				step: 1,
				label: 'width'
			}),
			new fields.Number({
				model: this.model,
				property: 'thumbHeight',
				min: 50,
				max: 400,
				step: 1,
				label: 'height'
			}), */
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

var LightboxFields = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function(){
		var me = this,
			fields = Upfront.Views.Editor.Field
		;

		this.fields = _([
			new fields.Checkboxes({
				model: this.model,
				property: 'lbTitle',
				values: [
					{
						label: 'Show Image Title',
						value: 'true'
					}
				]
			}),
			new fields.Checkboxes({
				model: this.model,
				property: 'lbDescription',
				values: [
					{
						label: 'Show Image Description',
						value: 'true'
					}
				]
			}),
			new fields.Checkboxes({
				model: this.model,
				property: 'lbLoop',
				values: [
					{
						label: 'Loop Images When Viewing',
						value: 'true'
					}
				]
			})
		]);
	},
	get_title: function(){
		return "Lightbox Image Settings";
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