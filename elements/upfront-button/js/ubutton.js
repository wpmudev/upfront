(function ($) {
define(['text!elements/upfront-button/tpl/ubutton.html'], function(template) {

var l10n = Upfront.Settings.l10n.text_element;

var ButtonModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "ButtonModel");
		this.init_property("view_class", "ButtonView");
		this.init_property("element_id", Upfront.Util.get_unique_id("button-object"));
		this.init_property("class", "c24 upfront-button");
		this.init_property("has_settings", 1);
		this.init_property("id_slug", "button");
	}
});


var ButtonView = Upfront.Views.ObjectView.extend({
	className: 'upfront-button',
	cssSelectors: {
		'.upfront-button': {label: l10n.css.container_label, info: l10n.css.container_info}
	},
	initialize: function() {
		this.constructor.__super__.initialize.apply(this, arguments);

		if(! (this.model instanceof ButtonModel)){
			this.model = new ButtonModel({properties: this.model.get('properties')});
		}

		this.on('deactivated', function() {
			Upfront.Events.trigger('upfront:element:edit:stop');
		}, this);
	
		Upfront.Events.on("entity:settings:deactivate", this.revert_preset, this);	
	},
	revert_preset: function() {
		this.render();
	},
	get_content_markup: function () {
		var content = this.model.get_content(), style_static = '', style_hover = '';

		if(this.model.get_property_value_by_name("currentpreset") && Upfront.Views.Editor.Button.Presets.get(this.model.get_property_value_by_name("currentpreset"))) {
			
			var preset = Upfront.Views.Editor.Button.Presets.get(this.model.get_property_value_by_name("currentpreset")).attributes;
			style_static = "border: "+preset.borderwidth+"px "+preset.bordertype+" "+preset.bordercolor+"; "+
					"border-radius: "+preset.borderradius1+"px "+preset.borderradius2+"px "+preset.borderradius4+"px "+preset.borderradius3+"px; "+
					"background-color: "+preset.bgcolor+"; "+
					"font-size: "+preset.fontsize+"px; "+
					"font-family: "+preset.fontface+"; "+
					"color: "+preset.color+"; "
	
			style_hover = "border: "+preset.hov_borderwidth+"px "+preset.hov_bordertype+" "+preset.hov_bordercolor+"; "+
					"border-radius: "+preset.hov_borderradius1+"px "+preset.hov_borderradius2+"px "+preset.hov_borderradius4+"px "+preset.hov_borderradius3+"px; "+
					"background-color: "+preset.hov_bgcolor+"; "+
					"font-size: "+preset.hov_fontsize+"px; "+
					"font-family: "+preset.hov_fontface+"; "+
					"color: "+preset.hov_color+"; "
		}

		var data = {
			"id" : this.model.get_property_value_by_name('element_id'),
			"content" : content,
			"style_static" : style_static,
			"style_hover" : style_hover,
		};

		var rendered = '';
		
		rendered = _.template(template, data);
		
		return rendered;// + ( !this.is_edited() || $.trim(content) == '' ? '<div class="upfront-quick-swap"><p>' + l10n.dbl_click + '</p></div>' : '');

	},
	is_edited: function () {
		var is_edited = this.model.get_property_value_by_name('is_edited');
		return is_edited ? true : false;
	},
	on_render: function() {
		var me = this,
		blurTimeout = false;

		this.$el.find('.upfront-object-content')
			.addClass('upfront-button')
			.ueditor({
				linebreaks: false,
				inserts: {},
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
				var ed = me.$el.find('.upfront-object-content').data("ueditor"),
					text = ''
				;
				try { text = ed.getValue(true); } catch (e) { text = ''; }
				if (text) me.model.set_content(text, {silent: true}); // Something in inserts is destroying the sidebar
				Upfront.Events.trigger('upfront:element:edit:stop');
				me.render();
			})
			.on('syncAfter', function(){
				var text = $.trim($(this).html());
				if (text) me.model.set_content($(text).html(), {silent: true});
			})
		;

	},
});


var ButtonElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 10,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-text');
		this.$el.html('Button');
	},
	add_element: function () {
		var object = new ButtonModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "Click here"}
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c4"},
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


var Settings_ButtonPresets_Field = Upfront.Views.Editor.Field.Select.extend({
	render: function() {
		Upfront.Views.Editor.Field.Select.prototype.render.call(this);
		var html = ['<a href="#" title="Edit preset" class="upfront-buttonpreset-edit"></a>'];
		this.$el.append(html.join(''));
		return this;
	},
	remove: function(){
		Upfront.Views.Editor.Field.Field.prototype.remove.call(this);
	}
});

var Settings_ButtonPresets = Upfront.Views.Editor.Settings.Item.extend({

	initialize: function (opts) {
		this.options = opts;
		var presets = this.get_presets()
		var me = this;
		this.presetsfield = new Settings_ButtonPresets_Field({
				model: this.model, property: 'currentpreset',
				values: presets,
				className: 'button_preset',
				change: function() { me.$el.trigger('itemselected');}
			});

		this.options.fields = _([
			me.presetsfield
		]);
		
		Upfront.Views.Editor.Settings.Item.prototype.initialize.call(this, this.options);
	},
	get_presets: function () {
		var buttonpresets = [];

		_(Upfront.Views.Editor.Button.Presets.models).each(function(preset) {
			if (preset.id.indexOf('_default') > -1) return;
			buttonpresets.push({label: preset.id, value: preset.id});
		});
		
		return buttonpresets;
	},
	load_presets: function() {
		this.presetsfield.values = this.get_presets();
		this.presetsfield.render();
	},
	get_values: function () {
        return this.fields._wrapped[0].get_value();
    }
});


var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
  className: 'button-settings-panel',
  
    
	get_fonts: function () {
		var typefaces_list = [];
		_.each(Upfront.Views.Editor.Fonts.System.get_fonts().models, function(font)	{
			typefaces_list.push({ label: font.get('family'), value: font.get('family') });
		});
		_.each(Upfront.Views.Editor.Fonts.Google.get_fonts().models, function(font) {
			typefaces_list.push({ label: font.get('family'), value: font.get('family') });
		});
		return typefaces_list;
	},
	initialize: function (opts) {
		this.options = opts;
		var render_all,
		me = this;

		render_all = function(){
			this.settings.invoke('render');
		};

		this.events = _.extend({}, this.events, {
			'click a.upfront-buttonpreset-edit': 'editPreset',

		});

		//_.bindAll(this, 'onBgColor', 'onBorderColor');
	   	var newpresetname = new Upfront.Views.Editor.Field.Text({
						model: this.model,
						compact: true
					});
					
		me.borderType = new Upfront.Views.Editor.Field.Radios({
			className: 'inline-radios plaintext-settings static',
			model: this.model,
			//property: 'border_style',
			label: l10n.border,
			default_value: "none",
			values: [
				{ label: l10n.none, value: 'none' },
				{ label: l10n.solid, value: 'solid' },
				{ label: l10n.dashed, value: 'dashed' },
				{ label: l10n.dotted, value: 'dotted' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.borderWidth= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 1,
			//property: 'border_width',
			label: l10n.width,
			default_value: 1,
			values: [
				{ label: "", value: '1' }
			],
			change: function() { me.updatelivecss(me);}
		}), 
		me.borderColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintext-settings inline-color border-color static',
			blank_alpha : 0,
			model: this.model,
			//property: 'border_color',
			label: l10n.color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me);},
				move: function() { me.updatelivecss(me);}
			}
		}),
		me.borderRadius1= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.borderRadius2= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.borderRadius4= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.borderRadius3= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}), 
		me.bgColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color static',
			blank_alpha : 0,
			model: this.model,
			//property: 'bg_color',
			label_style: 'inline',
			label: l10n.bg_color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me);},
				move: function() { me.updatelivecss(me);},
			}
		}),
		me.fontSize= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings static',
			model: this.model,
			min: 8,
			//property: 'border_width',
			label: '',
			default_value: 12,
			values: [
				{ label: "", value: '12' }
			],
			change: function() { me.updatelivecss(me);}
		}),			
		me.fontFace = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				values: me.get_fonts(),
				className: 'static',
				change: function() { me.updatelivecss(me);}
		}),
		me.color= new Upfront.Views.Editor.Field.Color({
				className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color static',
				blank_alpha : 0,
				model: this.model,
				//property: 'bg_color',
				label_style: 'inline',
				label: '',
				spectrum: {
					preferredFormat: "hex",
					change: function() { me.updatelivecss(me);},
					move: function() { me.updatelivecss(me);},
				}
		});

		// Similar settings for hover state

		me.hov_borderType = new Upfront.Views.Editor.Field.Radios({
			className: 'inline-radios  plaintext-settings hover',
			model: this.model,
			//property: 'border_style',
			label: l10n.border,
			default_value: "none",
			values: [
				{ label: l10n.none, value: 'none' },
				{ label: l10n.solid, value: 'solid' },
				{ label: l10n.dashed, value: 'dashed' },
				{ label: l10n.dotted, value: 'dotted' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.hov_borderWidth= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 1,
			//property: 'border_width',
			label: l10n.width,
			default_value: 1,
			values: [
				{ label: "", value: '1' }
			],
			change: function() { me.updatelivecss(me);}
		}), 
		me.hov_borderColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color border-color hover',
			blank_alpha : 0,
			model: this.model,
			//property: 'border_color',
			label: l10n.color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me);},
				move: function() { me.updatelivecss(me);}
			}
		}),
		me.hov_borderRadius1= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.hov_borderRadius2= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.hov_borderRadius4= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}),
		me.hov_borderRadius3= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() { me.updatelivecss(me);}
		}), 
		me.hov_bgColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintext-settings inline-color bg-color hover',
			blank_alpha : 0,
			model: this.model,
			//property: 'bg_color',
			label_style: 'inline',
			label: l10n.bg_color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me);},
				move: function() { me.updatelivecss(me);},
			}
		}),
		me.hov_fontSize= new Upfront.Views.Editor.Field.Number({
			className: 'inline-number plaintext-settings hover',
			model: this.model,
			min: 8,
			//property: 'border_width',
			label: '',
			default_value: 12,
			values: [
				{ label: "", value: '12' }
			],
			change: function() { me.updatelivecss(me);}
		}),			
		me.hov_fontFace = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				values: me.get_fonts(),
				className: 'hover',
				change: function() { me.updatelivecss(me);}
		});

		me.hov_color= new Upfront.Views.Editor.Field.Color({
				className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color hover',
				blank_alpha : 0,
				model: this.model,
				//property: 'bg_color',
				label_style: 'inline',
				label: '',
				spectrum: {
					preferredFormat: "hex",
					change: function() { me.updatelivecss(me);},
					move: function() { me.updatelivecss(me);},
				}
		});
		me.static_button_preset = new Upfront.Views.Editor.Field.Button({
			model: me.model,
			label: 'Static',
			className: "static_button_preset active",
			compact: true,
			on_click: function() {
				this.$el.siblings('.hover_button_preset').removeClass('active');
				this.$el.addClass('active');
				this.$el.siblings('div.hover').hide();
				this.$el.siblings('div.static').show();
				me.updatelivecss(me);
			},
		});
		me.presetspecific = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: '',
				fields: [
					new Upfront.Views.Editor.Field.Button({
						model: me.model,
						label: 'Delete Preset',
						className: "delete_button_preset",
						compact: true,
						on_click: function() {
							me.delete_preset(me.property('currentpreset'));
						},
					}),
					me.static_button_preset,
					new Upfront.Views.Editor.Field.Button({
						model: me.model,
						label: 'Hover',
						className: "hover_button_preset",
						compact: true,
						on_click: function() {
							this.$el.siblings('.static_button_preset').removeClass('active');
							this.$el.addClass('active');
							this.$el.siblings('div.static').hide();
							this.$el.siblings('div.hover').show();
							me.updatelivecss(me);
						},
					}),
					me.borderType,
					me.borderWidth,
					me.borderColor,
					me.borderRadius1,
					me.borderRadius2,
					me.borderRadius4,
					me.borderRadius3,
					me.bgColor,
					me.fontSize,
					me.fontFace,
					me.color,
					me.hov_borderType,
					me.hov_borderWidth,
					me.hov_borderColor,
					me.hov_borderRadius1,
					me.hov_borderRadius2,
					me.hov_borderRadius4,
					me.hov_borderRadius3,
					me.hov_bgColor,
					me.hov_fontSize,
					me.hov_fontFace,
					me.hov_color
				]
			});
		me.buttonpresets = new Settings_ButtonPresets({
			model: this.model,
			title: 'Select Button Preset'
		});
		me.newpresets = new Upfront.Views.Editor.Settings.Item({
			model: this.model,
			title: 'Or',
			fields: [
				newpresetname,
				new Upfront.Views.Editor.Field.Button({
					model: me.model,
					label: 'New Preset',
					className: "new_menu_button",
					compact: true,
					on_click: function() {
						me.property('currentpreset',  newpresetname.$el.find('input').val(), true);
						me.ready_preset();
					},
				})
			]
		});
		this.settings = _([
			me.buttonpresets,
			me.newpresets,
			me.presetspecific
		]);
		me.presetspecific.$el.hide();
		
		me.buttonpresets.$el.on('itemselected', function() { 
			var selectedpreset = me.$el.find('div.button_preset li.upfront-field-select-option-selected input').val();
			if(selectedpreset == 'undefined')
				return;
			me.load_preset(selectedpreset);
			me.updatelivecss(me);
		});
		
		
	},
	updatelivecss: function(me) {
		if(typeof(me) == 'undefined')
			return;

			var style_static = "border: "+me.borderWidth.get_value()+"px "+me.borderType.get_value()+" "+me.borderColor.get_value()+"; "+
					"border-radius: "+me.borderRadius1.get_value()+"px "+me.borderRadius2.get_value()+"px "+me.borderRadius4.get_value()+"px "+me.borderRadius3.get_value()+"px; "+
					"background-color: "+me.bgColor.get_value()+"; "+
					"font-size: "+me.fontSize.get_value()+"px; "+
					"font-family: "+me.fontFace.get_value()+"; "+
					"color: "+me.color.get_value()+"; ";
		
			var style_hover = "border: "+me.hov_borderWidth.get_value()+"px "+me.hov_borderType.get_value()+" "+me.hov_borderColor.get_value()+"; "+
					"border-radius: "+me.hov_borderRadius1.get_value()+"px "+me.hov_borderRadius2.get_value()+"px "+me.hov_borderRadius4.get_value()+"px "+me.hov_borderRadius3.get_value()+"px; "+
					"background-color: "+me.hov_bgColor.get_value()+"; "+
					"font-size: "+me.hov_fontSize.get_value()+"px; "+
					"font-family: "+me.hov_fontFace.get_value()+"; "+
					"color: "+me.hov_color.get_value()+"; ";
		
			var style ='div#'+me.property('element_id')+' a.upfront_cta {'+(me.static_button_preset.$el.hasClass('active')?style_static:style_hover)+"}\n"+
						'div#'+me.property('element_id')+' a.upfront_cta:hover {'+style_hover+"}\n";


		$('style#style'+me.property('element_id')).html(style);
	},
	on_save: function() {
		var currentpreset = this.property('currentpreset');
		if(this.buttonpresets.$el.css('display') == 'none')
			this.save_preset(this.property('currentpreset'));
		this.is_changed = true;
		this.constructor.__super__.on_save.apply(this, arguments);
	},
	editPreset: function(e){
		e.preventDefault();
		var selectedpreset = this.$el.find('div.button_preset li.upfront-field-select-option-selected input').val();
		if(selectedpreset == 'undefined')
			return;
		this.property('currentpreset', selectedpreset, true);
		this.ready_preset();
		this.load_preset(selectedpreset);
		
	},
	ready_preset: function() {
		this.buttonpresets.$el.hide(),
		this.newpresets.$el.hide(),
		this.static_button_preset.$el.trigger('click');
		this.presetspecific.$el.show();
		//logic to hide preset selection and show preset fields
	},
	delete_preset: function(presetname) {
		Upfront.Views.Editor.Button.Presets.remove(presetname);
		Upfront.Events.trigger("entity:settings:deactivate");
//		this.presetspecific.$el.hide();
//		this.buttonpresets.$el.show();
//		this.newpresets.$el.show();	
	},

	load_preset: function(presetname) {

			this.borderType.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.bordertype);

			this.borderWidth.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.borderwidth);

			this.borderColor.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.bordercolor);	

			this.borderRadius1.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.borderradius1);	

			this.borderRadius2.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.borderradius2);

			this.borderRadius4.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.borderradius4);	

			this.borderRadius3.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.borderradius3);	

			this.bgColor.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.bgcolor);				

			this.fontSize.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.fontsize);				

			this.fontFace.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.fontface);

			this.color.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.color);

			this.hov_borderType.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_bordertype);

			this.hov_borderWidth.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_borderwidth);

			this.hov_borderColor.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_bordercolor);	

			this.hov_borderRadius1.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_borderradius1);	

			this.hov_borderRadius2.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_borderradius2);

			this.hov_borderRadius4.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_borderradius4);	

			this.hov_borderRadius3.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_borderradius3);	

			this.hov_bgColor.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_bgcolor);				

			this.hov_fontSize.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_fontsize);				

			this.hov_fontFace.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_fontface);

			this.hov_color.set_value(Upfront.Views.Editor.Button.Presets.get(presetname).attributes.hov_color);	
		
			
	},
	save_preset: function(presetname) {
		
		var preset = Upfront.Views.Editor.Button.Presets.get(presetname);
		if(preset) {
			preset.attributes.bordertype = this.borderType.get_value();
			preset.attributes.borderwidth = this.borderWidth.get_value();
			preset.attributes.bordercolor = this.borderColor.get_value();
			preset.attributes.borderradius1 = this.borderRadius1.get_value();
			preset.attributes.borderradius2 = this.borderRadius2.get_value();
			preset.attributes.borderradius4 = this.borderRadius4.get_value();
			preset.attributes.borderradius3 = this.borderRadius3.get_value();
			preset.attributes.bgcolor = this.bgColor.get_value();
			preset.attributes.fontsize = this.fontSize.get_value();
			preset.attributes.fontface = this.fontFace.get_value();
			preset.attributes.color = this.color.get_value();
				
			preset.attributes.hov_bordertype = this.hov_borderType.get_value();
			preset.attributes.hov_borderwidth = this.hov_borderWidth.get_value();
			preset.attributes.hov_bordercolor = this.hov_borderColor.get_value();
			preset.attributes.hov_borderradius1 = this.hov_borderRadius1.get_value();
			preset.attributes.hov_borderradius2 = this.hov_borderRadius2.get_value();
			preset.attributes.hov_borderradius4 = this.hov_borderRadius4.get_value();
			preset.attributes.hov_borderradius3 = this.hov_borderRadius3.get_value();
			preset.attributes.hov_bgcolor = this.hov_bgColor.get_value();
			preset.attributes.hov_fontsize = this.hov_fontSize.get_value();
			preset.attributes.hov_fontface = this.hov_fontFace.get_value();
			preset.attributes.hov_color = this.hov_color.get_value();			
			
			Upfront.Views.Editor.Button.Presets.trigger('edit');		
		}
		else
			Upfront.Views.Editor.Button.Presets.add({
				id : presetname,
				bordertype : this.borderType.get_value(),
				borderwidth : this.borderWidth.get_value(),
				bordercolor : this.borderColor.get_value(),
				borderradius1 : this.borderRadius1.get_value(),
				borderradius2 : this.borderRadius2.get_value(),
				borderradius4 : this.borderRadius4.get_value(),
				borderradius3 : this.borderRadius3.get_value(),
				bgcolor : this.bgColor.get_value(),
				fontsize : this.fontSize.get_value(),
				fontface : this.fontFace.get_value(),
				color : this.color.get_value(),
						
				hov_bordertype : this.hov_borderType.get_value(),
				hov_borderwidth : this.hov_borderWidth.get_value(),
				hov_bordercolor : this.hov_borderColor.get_value(),
				hov_borderradius1 : this.hov_borderRadius1.get_value(),
				hov_borderradius2 : this.hov_borderRadius2.get_value(),
				hov_borderradius4 : this.hov_borderRadius4.get_value(),
				hov_borderradius3 : this.hov_borderRadius3.get_value(),
				hov_bgcolor : this.hov_bgColor.get_value(),
				hov_fontsize : this.hov_fontSize.get_value(),
				hov_fontface : this.hov_fontFace.get_value(),
				hov_color : this.hov_color.get_value()
			});
			
		if(this.buttonpresets.$el.find('input[value='+presetname+']').length > 0)
			this.buttonpresets.$el.find('input[value='+presetname+']').trigger('click');
		else
			this.buttonpresets.$el.find('input[type=radio]:checked').val(presetname);
//		this.buttonpresets.$el.find('input[value='+presetname+']').prop('checked', true);
		
		/*	
		Upfront.Views.Editor.Button.Presets[presetname]['bordertype']=this.borderType.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['borderwidth']=this.borderWidth.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['bordercolor']=this.borderColor.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['borderradius1']=this.borderRadius1.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['borderradius2']=this.borderRadius2.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['borderradius4']=this.borderRadius4.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['borderradius3']=this.borderRadius3.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['bgcolor']=this.bgColor.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['fontsize']=this.fontSize.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['fontface']=this.fontFace.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['color']=this.color.get_value();
		
		Upfront.Views.Editor.Button.Presets[presetname]['hov_bordertype']=this.hov_borderType.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_borderwidth']=this.hov_borderWidth.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_bordercolor']=this.hov_borderColor.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_borderradius1']=this.hov_borderRadius1.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_borderradius2']=this.hov_borderRadius2.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_borderradius4']=this.hov_borderRadius4.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_borderradius3']=this.hov_borderRadius3.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_bgcolor']=this.hov_bgColor.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_fontsize']=this.hov_fontSize.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_fontface']=this.hov_fontFace.get_value();
		Upfront.Views.Editor.Button.Presets[presetname]['hov_color']=this.hov_color.get_value();
		*/
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
	  }
});


 var ButtonSettings = Upfront.Views.Editor.Settings.Settings.extend({
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

/*
var ButtonMenuList = Upfront.Views.ContextMenuList.extend({
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

var ButtonMenu = Upfront.Views.ContextMenu.extend({
	initialize: function() {
		this.menulists = _([
		  new ButtonMenuList()
		]);
	}
});

*/
Upfront.Application.LayoutEditor.add_object("Button", {
	"Model": ButtonModel,
	"View": ButtonView,
	"Element": ButtonElement,
	"Settings": ButtonSettings,
	//"ContextMenu": ButtonMenu
});
Upfront.Models.ButtonModel = ButtonModel;
Upfront.Views.ButtonView = ButtonView;

});
})(jQuery);
