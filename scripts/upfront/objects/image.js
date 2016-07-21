(function ($) {
define(function() {
var ImageModel = Upfront.Models.ObjectModel.extend({
	init: function () {

		this.init_property("type", "ImageModel");
		this.init_property("view_class", "ImageView");
		this.init_property("element_id", Upfront.Util.get_unique_id("image-object"));
		this.init_property("class", "c24");
		this.init_property("has_settings", 1);
	}
});

var ImageView = Upfront.Views.ObjectView.extend(_.extend({}, /*Upfront.Mixins.FixedObjectInAnonymousModule,*/ {
	model: ImageModel,
	get_buttons: function () {
		return '<a href="#" class="upfront-icon-button upfront-icon-button-crop"></a>';
	},
	get_content_markup: function () {
		var that = this;
		require(['text!upfront/templates/objects/image/image.html'],function(template) {
					var data = {
					  	"src" : that.model.get_content(),
					  	"image_title" : that.model.get_property_value_by_name("image_title"),
					  	"alternative_text" : that.model.get_property_value_by_name("alternative_text"),
					  	"when_clicked" : that.model.get_property_value_by_name("when_clicked"),
					  	"image_link" : that.model.get_property_value_by_name("image_link"),
					  	"include_image_caption": that.model.get_property_value_by_name("include_image_caption"),
					  	"image_caption": that.model.get_property_value_by_name("image_caption"),
					  	"caption_position":that.model.get_property_value_by_name("caption_position"),
					  	"caption_alignment":that.model.get_property_value_by_name("caption_alignment"),
					  	"caption_trigger":that.model.get_property_value_by_name("caption_trigger")
					};
					//console.log(data);
					var rendered = '';
					rendered = _.template(template, data);
					that.$el.find('.upfront-object-content').html(rendered);
		});
	}
}));

var ImageElement = Upfront.Views.Editor.Sidebar.Element.extend({
	draggable: false,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-image');
		this.$el.html('Image (old)');
	},
	add_element: function () {
		var object = new ImageModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "http://wpsalad.com/wp-content/uploads/2012/11/wpmudev.png"}
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
		};
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
				events: {
					'click #include_image_caption': 'do'
				},
				"do": function () {
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
		};
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
				events: {
					'click input:radio[name=when_clicked]': 'do'
				},
				"do": function () {
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
		this['do'] = data['do'];
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
		   	value: value
		};
		var template = '<div id="field_{{name}}">{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}<input type="text" name="{{name}}" value="{{value}}" /></div>';
		var render =  _.template(template, data);
		return render;
	}
});
var Field_Textarea = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name) || this.value;
		value = value || '';
		var data = {
		   	label:this.label,
		   	name:this.name,
		   	value: value,
		   	icon : this.icon
		};
		var template = '<div id="field_{{name}}">{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}<textarea name="{{name}}">{{value}}</textarea></div>';
		var render =  _.template(template, data);
		return render;
	}
});
var Field_Checkbox = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name) ? this.model.get_property_value_by_name(this.name) : 'no';
		value = value || '';
		var data = {
		   	label:this.label,
		   	name:this.name,
		   	value: 'yes',
		   	checked: value == 'yes' ? 'checked' : ''
		};
		var template = '<div id="field_{{name}}"><input id="{{name}}" type="checkbox" name="{{name}}" value="1" {{checked}} />{[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}</div>';
		var render =  _.template(template, data);
		return render;
	},
	get_value: function() {
		var value = this.$el.find('input[name="'+this.name+'"]').is(':checked') ? 'yes' : 'no';
		return value;

	}
});
var Field_Radio = Field.extend({
	get_markup: function() {
		var value = this.model.get_property_value_by_name(this.name);
		var render = '<div id="field_'+this.name+'">';
		var template = '<input type="radio" name="{{name}}" id="{{name}}" value="{{value}}" {[ if(typeof selected != "undefined" && selected) { ]} checked  {[ } ]}> <span class="radio-button-label">{{icon}} {[ if (label) { ]}<label for="{{name}}">{{label}}</label> {[ } ]}</span>';

		_.each(this.options, function (item) {
			if(!this.value && item['default'] == 'true'){ item.selected = true; }
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
		return value !== '' ? value : '';
	}
});


Upfront.Application.LayoutEditor.add_object("Image", {
	"Model": ImageModel,
	"View": ImageView,
	"Element": ImageElement,
	"Settings": ImageSettings
});
Upfront.Models.ImageModel = ImageModel;
Upfront.Views.ImageView = ImageView;




});
})(jQuery);
