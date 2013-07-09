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

			src: 'http://imgsrc.hubblesite.org/hu/db/images/hs-2010-22-a-web.jpg',
			imageId: 0,
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
			size: {width: 0, height: 0},
			imageSize: {width: 0, height:0},
			position: {top: 0, left: 0},
			rotation: 0
		});
	}
});

var UimageView = Upfront.Views.ObjectView.extend(_.extend({}, /*Upfront.Mixins.FixedObjectInAnonymousModule,*/ {
	model: UimageModel,
	imageTpl: utemplate(imageTpl),
	selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
	formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
	sizes: {},
	image: 'http://dorsvenabili.com/wp-content/uploads/wordpress_helpsheet.jpg',
	imageId: 0,
	imageSize: {width: 0, height: 0},
	events: {
		'click a.upfront-image-select-button': 'openImageSelector',
		'click a.select-files' : 'openFileBrowser',
		//'click a.select-files' : 'openEditor',
		'click #upfront-image-file-input': 'checkFileUpdate',
		'click .image-edit-rotate': 'rotate'
	},
	//Unbinds the properties original events
	initialize: function(){

	},
	get_content_markup: function () {
		
		var rendered = this.imageTpl(this.extract_properties());
		console.log('Image element');
		return rendered;
		
		
		//return "<b>Image Here</b>";
	},
	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		return props;
	},
	openImageSelector: function(e){
		if(e)
			e.preventDefault();
		this.openOverlaySection('#upront-image-placeholder');
	},
	closeImageSelector: function(e){
		$('#upfront-image-overlay').fadeOut('fast', function(){
			$(this).remove();
			$('#upfront-upload-image').remove();
		});

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
	openFileBrowser: function(e){
	    console.log('clicking');
		$('#upfront-image-file-input').click();
	},
	checkFileUpdate: function(e){
	     console.log('here we are');
	     return true;
	},
	openEditor: function(e){
		if(e)
			e.preventDefault();

		if(this.sizes.full){
			this.$('.image-edit-canvas')
				.attr('src', this.sizes.full[0])
			;
			this.imageSize = {
				width: this.sizes.full[1],
				height: this.sizes.full[2]
			}
		}

		this.openOverlaySection('#upfront-image-edit');
		this.resizeImageEditor();
	},

	openProgress: function(){
		this.openOverlaySection('#upfront-image-uploading');
		this.resizeImageEditor();
	},
	openOverlaySection: function(selector){
		var me = this,
			overlay = this.$('#upfront-image-overlay'),
			parent = this.parent_module_view.$('.upfront-editable_entity:first')
		;
		if(overlay.length){
			this.$('.upfront-image-section').fadeOut('fast', function(){
				me.$(selector).fadeIn('fast');
			});
			return;
		}

		//Stop draggable
		if (parent.is(".ui-draggable"))
			parent.draggable('disable');


		overlay = $(this.selectorTpl({})).hide();
		overlay.find('.upfront-image-section').hide();
		overlay.find(selector).show();

		this.$el.append(overlay);
		$('body').append(this.formTpl({url: Upfront.Settings.ajax_url}));
		$('#upfront-image-file-input').on('change', function(e){
			me.openProgress();
			me.uploadImage(e);
		});

		//this.$('#upfront-image-overlay').fadeIn('fast');
		overlay.fadeIn('fast');

		this.resizeOverlay();
		$(window).on('resize', this.resizeOverlay);
		$(window).on('resize', function(){
			me.resizeImageEditor()
		});

		this.$('.image-edit-outer-mask').resizable({
			handles: {se: '.image-edit-resize i'},
			autoHide: 0,
			aspectRatio: true,
			resize: function(e, ui){
				me.resizeImage(e, ui);
			},
			stop: function(e, ui){
				me.resizeImage(e, ui);
			}
		}).draggable({
			opacity:1
		});
	},

	uploadImage: function(e){
		var me = this,
			progress = this.$('#upfront-progress')
		;

		$('#upfront-upload-image').ajaxSubmit({
			beforeSend: function() {
				progress.css('width', '0');
			},
			uploadProgress: function(e, position, total, percent) {
				progress.css('width', percent + '%');
			},
			complete: function() {
				me.$('#upfront-image-uploading h2').html('Preparing Image');
			},
			success: function(response){
				progress.css('width', '100%');
				console.log(response);
				Upfront.Views.Editor.notify("File Uploaded.");
				me.imageId = response.data;
				me.getImageData().done(function(){
					me.openEditor();
				});
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
			.error(function(response){
				Upfront.Views.Editor.notify(response);
			})
		;
	},

	resizeImage: function(e, ui) {
		if([90,270].indexOf(this.property('rotation')) == -1)
			this.$('.image-edit-canvas')
				.height(ui.size.height)
				.width(ui.size.width)
			;
		else{
			this.$('.image-edit-canvas')
				.width(ui.size.height)
				.height(ui.size.width)
				.css({
					width: ui.size.height + 'px',
					height: ui.size.width + 'px',
					top: ((ui.size.height - ui.size.width) / 2) + 'px',
					left: ((ui.size.width - ui.size.height) / 2) + 'px'
				})
			;

		}
		ui.element
			.width(ui.size.width)
			.height(ui.size.height)
		;
	},

	resizeImageEditor: function(){
		var overlay = $('#upfront-image-overlay'),
			invert = [90,270].indexOf(this.property('rotation')) != -1,
			mask = this.$('.image-edit-mask'),
			container = this.$('.image-edit-canvas-container'),
			max = {
				width: overlay.width() - 300,
				height: overlay.height() - 150
			},
			image = $('img.image-edit-canvas').css({width:'auto', height:'auto'}),
			fullSize = {
				width: invert ? image.height() : image.width(),
				height: invert ? image.width() : image.height()
			},
			diff = {
				width: max.width - fullSize.width,
				height: max.height - fullSize.height 
			},
			size = {},
			pivot = diff.width > diff.height ? 'height' : 'width',
			resized = {
				width: false,
				height: false
			}
		;

		if(this.imageSize.width){
			if(invert)
				fullSize = {width: this.imageSize.height, height: this.imageSize.width};
			else
				fullSize = this.imageSize;
		}

		if(diff[pivot] >= 0)
			resized = fullSize;
		else {
			var factor = fullSize[pivot] / max[pivot];
			resized = {
				width: Math.floor(fullSize.width / factor),
				height: Math.floor(fullSize.height / factor)
			}
		}

		size = {
			width: (invert ? resized.height : resized.width) + 'px',
			height: (invert ? resized.width : resized.height) + 'px'			
		}
		image.css(size);

		$('#image-edit-container').css({
				width: (max.width + 206) + 'px'
			})
			.find('.image-edit-canvas-container').css({
				width: (max.width + 6) + 'px',
				height: (max.height + 6) + 'px'
			}).end()
			.find('.image-edit-outer-mask').css(size)
		;

		mask.css({
			top: (container.height() / 2 - mask.height() / 2) + 'px',
			left: (container.width() / 2 - mask.width() / 2) + 'px'
		});
	},
	rotate: function(){
		var rotation = this.property('rotation'),
			img = this.$('.image-edit-canvas'),
			rotationClass = '',
			invert = [90,270].indexOf(this.property('rotation')) != -1,
			size = {width: img.width(), height: img.height()},
			position = {x: 0, y: 0}
		;

		rotation = rotation == 270 ? 0 : rotation + 90;
		if(rotation)
			rotationClass = 'rotate_' + rotation;

		img.removeClass()
			.addClass('image-edit-canvas ' + rotationClass);

		if(!invert){
			this.$('.image-edit-outer-mask')
				.height(size.width)
				.width(size.height)
			;
			position = {
				x: (size.height / 2 - size.width / 2) + 'px',
				y: (size.width /2 - size.height / 2) + 'px'
			};
		}
		else
			this.$('.image-edit-outer-mask')
				.height(size.height)
				.width(size.width)
			;

		img.css({
			top: position.y,
			left: position.x
		});

		this.property('rotation', rotation);
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
		var object = new UimageModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "http://wpsalad.com/wp-content/uploads/2012/11/wpmudev.png"},
				]
			}),
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
		var render_all = function(){
			this.settings.invoke('render');
		}
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
				value: this.model.get_property_value_by_name('include_image_caption'),
				events:
					{ 
					  'click #include_image_caption': 'do',
					}
				,
				do: function () { 
					var value = this.$el.find('#include_image_caption').is(':checked') ? 'yes' : 'no';
					if(value == 'yes'){
						$('#field_image_caption').show();
						$('#field_caption_position').show();
						$('#field_caption_position').parent().show();
						$('#field_caption_trigger').show();
						$('#field_caption_alignment').show();
					}else{
						$('#field_image_caption').hide();
						$('#field_caption_position').hide();
						$('#field_caption_trigger').hide();
						$('#field_caption_alignment').hide();
					}
				}
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
	},
	get_label: function () {
		return 'Description';
	},
	get_title: function () {
		return false;
	}
});

var BehaviorPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		var render_all = function(){
			this.settings.invoke('render');
		}
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
				],
				events:
					{ 
					  'click input:radio[name=when_clicked]': 'do',
					}
				,
				do: function () { 
					var value = this.$el.find('input:radio[name=when_clicked]:checked').val();
					//console.log(value);
					if(value == 'open_link'){
						$('#field_image_link').show();
					}else{
						$('#field_image_link').hide();
					}
				}
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
				
			})
		]);
	},
	get_label: function () {
		return 'Behavior';
	},
	get_title: function () {
		return false;
	}
});





var Field = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function (data) {
		this.title = data.title ? data.title : false;
		this.name = data.name;
		this.label = data.label ? data.label : false;
		this.value = data.value;
		this.icon = data.icon ? data.icon : false;
		this.type = data.type ? data.type : false;
		this.options = data.options ? data.options : false;
		this.events = data.events ? data.events : '';
		this.do = data.do;
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
			this.$el.append('<div class="upfront-settings-item"><div class="'+this.name+'-field">' + this.get_markup() + '</div></div>');
		}
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
		var template = '<input type="radio" name="{{name}}" id="{{name}}" value="{{value}}" {[ if(typeof selected != "undefined" && selected) { ]} checked  {[ } ]}> <span class="radio-button-label">{{icon}} {[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}</span>';
		
		_.each(this.options, function (item) {
			if(!this.value && item.default == 'true'){ item.selected = true; }
			else if (value == item.value){ item.selected = true; }
		
			render += _.template(template, item);
		});
		render += "</div>";
		return render;
	},
	get_name:function(){
		return this.name;
	},
	get_value: function() {
		var value = this.$el.find('input:radio[name='+this.name+']:checked').val();
		return value != '' ? value : '';
	}
})


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