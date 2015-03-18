(function ($) {
define(['text!upfront/templates/objects/plain_text/plain_text.html'], function(template) {

var l10n = Upfront.Settings.l10n.text_element;

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
	initialize: function() {
		this.constructor.__super__.initialize.apply(this, arguments);

		if(! (this.model instanceof PlainTxtModel)){
			this.model = new PlainTxtModel({properties: this.model.get('properties')});
		}

		/**
		 * Commenting the following because it caused the ueditor to restore draggablity while it was still editable
		 */
		//this.on('deactivated', function() {
		//	console.log('deactivating the text element editor');
		//	Upfront.Events.trigger('upfront:element:edit:stop');
		//}, this);
		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
	},
	get_content_markup: function () {
		var content = this.model.get_content(),
			$content;

		// Fix tagless content causes WSOD
		try {
		  $content = $(content);
		} catch (error) {
			$content = $('<p>' + content + '</p>');
		}

		if($content.hasClass('plaintxt_padding')) {
			content = $content.html();
		}

		var data = {
			"content" : content,
			"background_color" : this.model.get_property_value_by_name("background_color"),
			"border" : this.model.get_property_value_by_name("border")
		};
		var rendered = '';
		rendered = _.template(template, data);
		return rendered + ( !this.is_edited() || $.trim(content) == '' ? '<div class="upfront-quick-swap"><p>' + l10n.dbl_click + '</p></div>' : '');
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
				//airButtons : ["upfrontFormatting"],
				autostart: false,
				paragraphize: false,
				focus: false
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
				var ed = me.$el.find('.upfront-object-content').data("ueditor"),
					text = ''
				;

				try { text = ed.getValue(true); } catch (e) { text = ''; }
				if (text) me.model.set_content(text, {silent: true}); // Something in inserts is destroying the sidebar
				Upfront.Events.trigger('upfront:element:edit:stop');
				ed.redactor.events.trigger('cleanUpListeners');
				me.render();
			})
			.on('syncAfter', function(){
				var text = $.trim($(this).html());
				if (text) me.model.set_content($(text).html(), {silent: true});
			})
		;
/*
		if( this.$el.find(".plaintxt_padding").length && this.$el.find(".plaintxt_padding").attr("style").split("#ufc").length > 1){
			var splits = this.$el.find(".plaintxt_padding").attr("style").split("#ufc"),
				theme_color_index = splits[1].split(";")[0];
			this.$el.find(".plaintxt_padding").css("backgroundColor", "#ufc" + theme_color_index);
		}
*/
		// Yank this first, before applying
		setTimeout(function () {
			me.update_colors();
		}, 0);
	},
	update_colors: function () {
		var me = this;

		var bg = me.model.get_property_value_by_name("background_color");
		if (bg && Upfront.Util.colors.is_theme_color(bg)) {
			bg = Upfront.Util.colors.get_color(bg);
			me.$el.find(".plaintxt_padding").css("backgroundColor", bg);

			me.model.set_property("bg_color", bg);
		}

		var border = me.model.get_property_value_by_name("border"),
			matches = border ? border.match(/#ufc\d+/) : false
		;
		if (border && matches && matches.length) {
			var color = Upfront.Util.colors.get_color(matches[0]);
			border = border.replace(new RegExp(matches[0]), color);
			me.$el.find(".plaintxt_padding").css("border", border);

			me.model.set_property("border_color", color);
		}

	}
});


var PlainTxtElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 10,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-text');
		this.$el.html(l10n.element_name);
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
  initialize: function (opts) {
		this.options = opts;
		var render_all,
		me = this;

		render_all = function(){
			this.settings.invoke('render');
		};

		_.bindAll(this, 'onBgColor', 'onBorderColor');

		this.settings = _([
			new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.appearance,
				fields: [
					new Upfront.Views.Editor.Field.Radios({
						className: 'inline-radios  plaintext-settings',
						model: this.model,
						property: 'border_style',
						label: l10n.border,
						default_value: "none",
						values: [
							{ label: l10n.none, value: 'none' },
							{ label: l10n.solid, value: 'solid' },
							{ label: l10n.dashed, value: 'dashed' },
							{ label: l10n.dotted, value: 'dotted' }
						]
					}),
					new Upfront.Views.Editor.Field.Number({
						className: 'inline-number plaintext-settings',
						model: this.model,
						min: 1,
						property: 'border_width',
						label: l10n.width,
						default_value: 1,
						values: [
							{ label: "", value: '1' }
						]
					}),
					new Upfront.Views.Editor.Field.Color({
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color border-color',
						blank_alpha : 0,
						model: this.model,
						property: 'border_color',
						label: l10n.color,
						autoHide: false,
						spectrum: {
							preferredFormat: "hex",
							move: this.onBorderColor
						}
					}),
					new Upfront.Views.Editor.Field.Color({
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color',
						blank_alpha : 0,
						model: this.model,
						property: 'bg_color',
						label_style: 'inline',
						label: l10n.bg_color,
						autoHide: false,
						spectrum: {
							preferredFormat: "hex",
							move: this.onBgColor
						}
					})
				]
			})
		]);

		this.$el.on('change', 'input[name=border_style]', function(e){
		  me.onBorderStyle(e);
		});
		this.$el.on('change', 'input[name=border_width]', function(e){
		  me.onBorderWidth(e);
		});

	},
	onBgColor: function(color) {
		var c = color.get_is_theme_color() !== false ? color.theme_color : color.toRgbString();
		this.property('bg_color', c, false);
		this.processBg();
	},
	onBorderWidth: function(event) {
		this.property('border_width', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	onBorderColor: function(color) {
		if( !color ) return;
		var c = color.get_is_theme_color() !== false ? color.theme_color : color.toRgbString();

		this.property('border_color',  c, true);
		this.processBorder();
	},
	onBorderStyle: function(event) {
		this.property('border_style', $(event.currentTarget).val(), false);
		this.processBorder();
	},
	processBg: function() {
	if(this.property('bg_color') == 'rgba(0, 0, 0, 0)')
	  this.property('background_color', '', false);
	else
	  this.property('background_color', this.property('bg_color'), false);
	},
	processBorder: function() {
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
	  // Show border width if needed
	  if(this.property('border_style') != 'none') {
		this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'inline-block');
	  }
	  else {
		this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'none');
	  }
			// Remove panel tabs
			this.$el.find('.upfront-settings_label').remove();
			this.$el.find('.upfront-settings_panel').css('left', 0);

		  //this.$(".sp-choose").on("click", function ( e ) {
			//  me.onBgColor(me.bgColor);
			//  me.onBorderColor(me.borderColor);
		  //});
	  }
});


 var PlainTxtSettings = Upfront.Views.Editor.Settings.Settings.extend({
   initialize: function (opts) {
	 this.has_tabs = false;
	 this.options = opts;
	 this.panels = _([
	   new AppearancePanel({model: this.model})
	 ]);
   },

   get_title: function () {
	 return l10n.appearance;
   }
 });


var PlainTxtMenuList = Upfront.Views.ContextMenuList.extend({
	initialize: function() {
		var me = this;
		this.menuitems = _([
		  new Upfront.Views.ContextMenuItem({
			  get_label: function() {
				  return l10n.edit_text;
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
	"ContextMenu": PlainTxtMenu,
	cssSelectors: {
		'.upfront-plain_txt': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.upfront-plain_txt p': {label: l10n.css.p_label, info: l10n.css.p_info},
	},
	cssSelectorsId: 'PlainTxtModel'
});
Upfront.Models.PlainTxtModel = PlainTxtModel;
Upfront.Views.PlainTxtView = PlainTxtView;

});
})(jQuery);
