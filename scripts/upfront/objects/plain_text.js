(function ($) {

define(['text!elements/upfront-text/tpl/utext.html'], function(template) {

var PlainTxtModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "PlainTxtModel");
		this.init_property("view_class", "PlainTxtView");
		this.init_property("element_id", Upfront.Util.get_unique_id("text-object"));
		this.init_property("class", "c24 upfront-plain_txt");
		this.init_property("has_settings", 1);
		this.init_property("id_slug", "plain_text");
	}
});


var PlainTxtView = Upfront.Views.ObjectView.extend({
	className: 'upfront-plain_txt',
	cssSelectors: {
		'.upfront-plain_txt': {label: 'Text container', info: 'The layer that contains all the text of the element.'}
	},
	initialize: function() {
		this.constructor.__super__.initialize.apply(this, arguments);

		if(! (this.model instanceof PlainTxtModel)){
			this.model = new PlainTxtModel({properties: this.model.get('properties')});
		}

		this.on('deactivated', function() {
			Upfront.Events.trigger('upfront:element:edit:stop');
		}, this);
	},
	get_content_markup: function () {
		var content = this.model.get_content();

		if($(content).hasClass('plaintxt_padding')) {
			content = $(content).html();
		}

		$(content).find('div.plaintxt_padding');
		var data = {
			"content" : content,
			"background_color" : this.model.get_property_value_by_name("background_color"),
			"border" : this.model.get_property_value_by_name("border")
		};
		var rendered = '';
		rendered = _.template(template, data);
		return rendered;

	},
	is_edited: function () {
		var is_edited = this.model.get_property_value_by_name('is_edited');
		return is_edited ? true : false;
	},
	on_render: function() {
		var me = this,
		blurTimeout = false;

		this.$el.find('.upfront-object-content')
			.addClass('upfront-plain_txt')
			.ueditor({
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
					{"name": "row", "value": Upfront.Util.height_to_row(75)},
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
				title: "Textbox Appearance",
				fields: [
				  /*new Upfront.Views.Editor.Field.Checkboxes({
					className: 'inline-checkboxes plaintext-settings bg-color-enabled',
					model: this.model,
					property: 'bg_color_enabled',
					label: "",
					values: [
					  { label: "Background Color:", value: 'yes' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Checkboxes({
					className: 'inline-checkboxes plaintext-settings border-enabled',
					model: this.model,
					property: 'border_enabled',
					label: "",
					values: [
					  { label: "Border", value: 'yes' }
					]
				  }),*/
				  new Upfront.Views.Editor.Field.Radios({
					className: 'inline-radios  plaintext-settings',
					model: this.model,
					property: 'border_style',
					label: "Border",
					default_value: "solid",
					values: [
					  { label: "None", value: 'none' },
					  { label: "Solid", value: 'solid' },
					  { label: "Dashed", value: 'dashed' },
					  { label: "Dotted", value: 'dotted' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Number({
					className: 'inline-number plaintext-settings',
					model: this.model,
					min: 1,
					property: 'border_width',
					label: "Width",
					default_value: "1",
					values: [
					  { label: "", value: '1' }
					]
				  }),
				  new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color border-color',
					model: this.model,
					property: 'border_color',
					label: 'Color',
					spectrum: {
					  preferredFormat: "hex",
					  change: this.onBorderColor,
					  move: this.onBorderColor
					}
				  }),


				  new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color',
					model: this.model,
					property: 'bg_color',
					label: 'Background Color',
					spectrum: {
					  preferredFormat: "hex",
					  change: this.onBgColor,
					  move: this.onBgColor
					}
				  })
				]
			  })
			]);

/*
        this.$el.on('change', 'input[name=bg_color_enabled]', function(e){
          me.onBgColorEnabled(e);
        });
        this.$el.on('change', 'input[name=border_enabled]', function(e){
          me.onBorderEnabled(e);
        });
		*/
        this.$el.on('change', 'input[name=border_style]', function(e){
          me.onBorderStyle(e);
        });
        this.$el.on('change', 'input[name=border_width]', function(e){
          me.onBorderWidth(e);
        });
	},
	/*
	onBgColorEnabled: function(event) {
        this.property('bg_color_enabled', $(event.currentTarget).prop('checked'), false);
		this.processBg();
	},*/
	onBgColor: function(color) {
        this.property('bg_color', color.toRgbString(), false);
		this.processBg();
	},/*,
	onBorderEnabled: function(event) {
        this.property('border_enabled', $(event.currentTarget).prop('checked'), false);
		this.processBorder();
	}*/
	onBorderWidth: function(event) {
        this.property('border_width', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	onBorderColor: function(color) {
        this.property('border_color',  color.toRgbString(), false);
		this.processBorder();
	},
	onBorderStyle: function(event) {
        this.property('border_style', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	processBg: function() {
		//if(this.property('bg_color_enabled')) {
			if(this.property('bg_color') == 'rgba(0, 0, 0, 0)')
				this.property('background_color', '', false);
			else
				this.property('background_color', this.property('bg_color'), false);
		/*}
		else {
			this.property('background_color', '', false);
		}*/
	},
	processBorder: function() {
		//if(this.property('border_enabled')) {
		if(this.property('border_style') != 'none') {
			this.property('border', this.property('border_width')+'px '+this.property('border_color')+' '+this.property('border_style'), false);
			this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'inline-block');
		}
		else {
			this.property('border', '', false);
			this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'none');
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
	  },
	  render: function() {
			// Render as usual
			this.constructor.__super__.render.apply(this, arguments);
			// Remove panel tabs
			var me = this;

			if(this.property('border_style') != 'none') {

						this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'inline-block');
					}
					else {

						this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'none');
					}

/*
			if(this.property('bg_color_enabled') === true) {
				this.$el.find('.bg-color-enabled input').attr('checked', true);
			}
			else
				this.$el.find('.bg-color-enabled input').removeAttr('checked');

			if(this.property('border_enabled') === true)
				this.$el.find('.border-enabled input').attr('checked', true);
			else
				this.$el.find('.border-enabled input').removeAttr('checked');

			if(!this.$el.find('.border-enabled input').prop('checked'))
				me.$el.find('.upfront-field-number').prop('disabled', true);

			this.$el.find('.border-enabled input').bind('change', function() {
				if($(this).prop('checked'))
					me.$el.find('.upfront-field-number').prop('disabled', false);
				else
					me.$el.find('.upfront-field-number').prop('disabled', true);
			});
*/
			this.$el.find('.upfront-settings_label').remove();
			this.$el.find('.upfront-settings_panel').css('left', 0);
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


var PlainTxtMenuList = Upfront.Views.ContextMenuList.extend({
	initialize: function() {
		var me = this;
		this.menuitems = _([
          new Upfront.Views.ContextMenuItem({
			  get_label: function() {
				  return 'Edit Text';
			  },
			  action: function() {
				  	var editor = me.for_view.$el.find('div.upfront-object-content').data('ueditor');
					if(!me.for_view.$el.find('div.upfront-object-content').data('redactor')){
						editor.start();
						$(document).on('click', function(e){
							//Check if the click has been inner, or inthe popup, or the context menu, otherwise stop the editor
							if(!editor.options.autostart && editor.redactor){
								var $target = $(e.target);
								if(!editor.disableStop && !$target.closest('li').length && !$target.closest('.redactor_air').length && !$target.closest('.ueditable').length){
									editor.stop();
								}
							}
						});
					}
			  }
		  })
        ]);
	}
});

var PlainTxtMenu = Upfront.Views.ContextMenu.extend({
	initialize: function() {
		this.menulists = _([
          new PlainTxtMenuList()
        ]);
	}
});


Upfront.Application.LayoutEditor.add_object("PlainTxt", {
	"Model": PlainTxtModel,
	"View": PlainTxtView,
	"Element": PlainTxtElement,
	"Settings": PlainTxtSettings,
	"ContextMenu": PlainTxtMenu
});
Upfront.Models.PlainTxtModel = PlainTxtModel;
Upfront.Views.PlainTxtView = PlainTxtView;

});
})(jQuery);
