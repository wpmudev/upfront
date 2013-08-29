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
		sizes: {},
		size: {width: 0, height: 0},
		position: {top: 0, left: 0},
		rotation: 0,
		link: false
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
	images: [],
	sortMode: false,

	reopenSettings: false,

	initialize: function(options){
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
			'click .ugallery_sort_toggle': 'activateSortable',
			'click .ugallery_order_ok': 'sortOk'
		});

		this.images = new UgalleryImages(this.property('images'));
		this.images.on('add remove reset change', this.imagesChanged, this);

		this.on('deactivated', this.sortCancel, this);
	},

	get_content_markup: function () {
		var props = this.extract_properties();
			rendered = {}
		;

		props.imagesLength = props.images.length;
		props.editing = true;

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
			return '<a href="#" class="upfront-icon-button ugallery_sort_toggle"></a>';
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
		var images = imageData.images,
			newImages = []
		;
		_.each(images, function(image, id){
			newImages.push({
				id: id,
				sizes: image,
				size: {width: image.thumbnail[1], height: image.thumbnail[2]},
				src: image.thumbnail[0]
			})
		});

		this.images.add(newImages);

		if(imageData.given != imageData.returned)
			Upfront.Views.Editor.notify("Not all images could be added.", "warning");	
		this.render();
	},

	imageEditDetails: function(e) {
		e.preventDefault();
		console.log('Edit image details');
	},

	imageEditRemove: function(e) {
		e.preventDefault();
		$(e.target).closest('.ugallery_item').addClass('ugallery_item_removing');
	},

	imageEditLink: function(e) {
		e.preventDefault();
		console.log('Edit image link');
	},

	imageEditMask: function(e) {
		var me = this;
		e.preventDefault();
		Upfront.Views.Editor.ImageEditor.open($(e.target).closest('.ugallery_item').find('.ugallery-image-wrapper'), {})
			.done(function(result){
				Upfront.Views.Editor.notify('Image edition not available yet for galleries.', 'error');
			})
			.fail(function(result){
				me.render();
			})
		;
	},

	imagesChanged: function() {
		this.property('images', this.images.toJSON());
		this.render();
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
		var parent = this.parent_module_view.$('.upfront-editable_entity:first');

		this.$('.ugallery').sortable({
			items: 'div.ugallery_item:not(.ugallery_addmore)'
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
	property: function(name, value) {
		if(typeof value != "undefined")
			return this.model.set_property(name, value);
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
		this.panels = _([
			new LayoutPanel({model: this.model}),
			new ThumbnailsPanel({model: this.model}),
			new LargeImagePanel({model: this.model})
		]);
	},
	get_title: function () {
		return "Gallery settings";
	}
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
				.after('<div class="ugallery-proportional' + locked + '"></div>')
			;

			me.setEvents([
				['click', '.ugallery-proportional', 'lockProportions'],
				['change', 'input[type=number]', 'onThumbChangeSize'],
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

	onThumbChangeSize: function(e){
		var proportions = this.property('lockThumbProportions');
		if(proportions){
			var dimensions = this.$('input[type=number]');
			if(e.target == dimensions.get(0))
				$(dimensions.get(1)).val(Math.round($(e.target).val() / proportions));
			else
				$(dimensions.get(0)).val(Math.round($(e.target).val() * proportions));
		}
	},

	onThumbChangeProportions: function() {
		console.log('Gallery thumbs proportions not implemented yet');
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
						value: '1_1',
						icon: 'gallery-crop-1_1'
					},
					{
						label: '2:3',
						value: '2_3',
						icon: 'gallery-crop-2_3'
					},
					{
						label: '4:3',
						value: '4_3',
						icon: 'gallery-crop-4_3'
					}
				]
			}),
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