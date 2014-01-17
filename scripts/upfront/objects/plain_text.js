(function ($) {

define(function() {

var PlainTxtModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "PlainTxtModel");
		this.init_property("view_class", "PlainTxtView");
		this.init_property("element_id", Upfront.Util.get_unique_id("text-object"));
		this.init_property("class", "c22 upfront-plain_txt");
		this.init_property("has_settings", 1);
	}
});

var PlainTxtView = Upfront.Views.ObjectView.extend({

	get_content_markup: function () {
		var content = this.model.get_content();
		return content + ( !this.is_edited() || $.trim(content) == '' ? '<div class="upfront-quick-swap"><p>Double click to edit text</p></div>' : '');
	},

	is_edited: function () {
		var is_edited = this.model.get_property_value_by_name('is_edited');
		return is_edited ? true : false;
	},

	on_render: function() {
		var me = this,
			blurTimeout = false;

		this.$el.find('.upfront-object-content').ueditor({
				linebreaks: false,
				autostart: false
			})
			.on('start', function(){
				var $swap = $(this).find('.upfront-quick-swap');
				if ( $swap.length ){
					$swap.remove();
				}
				me.model.set_property('is_edited', true, true);
				Upfront.Events.trigger('upfront:element:edit:start', 'text');
			})
			.on('stop', function(){
				Upfront.Events.trigger('upfront:element:edit:stop');
			})
			.on('syncAfter', function(){
				me.model.set_content($(this).html(), {silent: true});
			})
		;
	}
});


var PlainTxtElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 10,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-text');
		this.$el.html('Text');
	},
	add_element: function () {
		var object = new PlainTxtModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "<p>My awesome stub content goes here</p>"}
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c11"},
					{"name": "row", "value": "5"},
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

var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
  className: 'plaintxt-settings-panel',
  initialize: function () {
	var render_all,
	  me = this;

	  render_all = function(){
	  	this.settings.invoke('render');
	  };

        _.bindAll(this, 'onBgColor', 'onBorderColor');

		this.settings = _([
			  new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: "Display style",
				fields: [
				  new Upfront.Views.Editor.Field.Checkboxes({
					className: 'inline-checkboxes',
					model: this.model,
					property: 'bg_color_enabled',
					label: "",
					values: [
					  { label: "Background Color:", value: 'yes' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintxt-bg-color',
					model: this.model,
					property: 'bg_color',
					label: '',
					spectrum: {
					  preferredFormat: "hex",
					  change: this.onBgColor
					}
				  }),
				  new Upfront.Views.Editor.Field.Checkboxes({
					className: 'inline-checkboxes',
					model: this.model,
					property: 'border_enabled',
					label: "",
					values: [
					  { label: "Border", value: 'yes' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Number({
					className: 'inline-number',
					model: this.model,
					property: 'border_width',
					label: "",
					values: [
					  { label: "", value: '1' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintxt-border-color',
					model: this.model,
					property: 'border_color',
					label: '',
					spectrum: {
					  preferredFormat: "hex",
					  change: this.onBorderColor
					}
				  }),
				  new Upfront.Views.Editor.Field.Radios({
					className: 'inline-radios',
					model: this.model,
					property: 'border_style',
					label: "",
					values: [
					  { label: "Solid", value: 'solid' },
					  { label: "Dashed", value: 'dashed' },
					  { label: "Dotted", value: 'dotted' }
					]
				  })
				]
			  })
			]);
			

        this.$el .on('change', 'input[name=bg_color_enabled]', function(e){
          me.onBgColorEnabled(e);
        });
        this.$el .on('change', 'input[name=border_enabled]', function(e){
          me.onBorderEnabled(e);
        });
        this.$el .on('change', 'input[name=border_style]', function(e){
          me.onBorderStyle(e);
        });
        this.$el .on('change', 'input[name=border_width]', function(e){
          me.onBorderWidth(e);
        });
	},
	onBgColorEnabled: function(event) {
        this.property('bg_color_enabled', $(event.currentTarget).val(), false);	
		this.processBg();	
	},
	onBgColor: function(event) {
        this.property('bg_color', event.toHslString(), false);
		this.processBg();	
	},
	onBorderEnabled: function(event) {
        this.property('border_enabled', $(event.currentTarget).val(), false);
		this.processBorder();		
	},
	onBorderWidth: function(event) {
        this.property('border_width', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	onBorderColor: function(event) {
        this.property('border_color',  event.toHslString(), false);
		this.processBorder();
	},
	onBorderStyle: function(event) {
        this.property('border_style', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	processBg: function() {
		if(this.property('bg_enabled') == 'yes') {
			this.property('background_color', this.property('bg_color'), false);
		}
		else {
			this.property('background_color', '', false);	
		}
	},
	processBorder: function() {
		if(this.property('border_enabled') == 'yes') {
			this.property('border', this.property('border_width')+'px '+this.property('border_color')+' '+this.property('border_style'), false);
		}
		else {
			this.property('border', '', false);	
		}
		
	},
	property: function(name, value, silent) {
		if(typeof value != "undefined"){
		  if(typeof silent == "undefined")
			silent = true;
		  return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	  },
	  get_label: function () {
		return 'Appearance';
	  }
});


 var PlainTxtSettings = Upfront.Views.Editor.Settings.Settings.extend({
      initialize: function () {
        this.panels = _([
          new AppearancePanel({model: this.model})
        ]);
      },

      get_title: function () {
        return "Textbox Appearance";
      }
    });

Upfront.Application.LayoutEditor.add_object("PlainTxt", {
	"Model": PlainTxtModel,
	"View": PlainTxtView,
	"Element": PlainTxtElement,
	"Settings": PlainTxtSettings,
});
Upfront.Models.PlainTxtModel = PlainTxtModel;
Upfront.Views.PlainTxtView = PlainTxtView;

});
})(jQuery);
