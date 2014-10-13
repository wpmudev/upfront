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

var singleclickcount = 0;
var ButtonView = Upfront.Views.ObjectView.extend({
	className: 'upfront-button',
	cssSelectors: {
		'.upfront-button': {label: l10n.css.container_label, info: l10n.css.container_info}
	},
	initialize: function() {
		var me = this;
		this.constructor.__super__.initialize.apply(this, arguments);

		if(! (this.model instanceof ButtonModel)){
			this.model = new ButtonModel({properties: this.model.get('properties')});
		}


		this.events = _.extend({}, this.events, {
			'click a.upfront_cta' : 'processClick'
		});

		this.on('deactivated', function() {
			
			Upfront.Events.trigger('upfront:element:edit:stop');
		}, this);
//		Upfront.Events.on("entity:deactivated", this.stopEdit, this);
/*		this.on('deactivated', function(e) {
			console.log(e);
			me.stopEdit();
		}, this);
*/
		//Upfront.Events.on("entity:settings:deactivate", this.revert_preset, this);	
		
		//Upfront.Events.on("entity:resize_stop", this.onResizeStop, this);

		Upfront.Events.on("upfront:themestyle:saved", function(theme_style) {
			var preset = Upfront.Views.Editor.Button.Presets.get(me.model.get_property_value_by_name("currentpreset"));
			if(preset) {
				preset.attributes.theme_style = theme_style;
				Upfront.Views.Editor.Button.Presets.trigger('edit');
			}

			me.model.set_property('theme_style', '', true);
		}, this);

		
		/*if ( objects && objects.length == 1 ){
			objects.each(function(object){
				object.set_property('row', rsz_row);
			});
		}*/

	},
	/*onResizeStop: function(view, model, ui) {
		this.conformSize();
	},
	conformSize: function() {
		this.$el.find('.upfront-output-button').css('height', this.$el.find('.upfront-object.upfront-button').height());
	},*/
	
	processClick: function(e) {
		e.stopPropagation();
		var me = this
		singleclickcount++;
		if(singleclickcount == 1) {
			setTimeout(function(){
				if(singleclickcount == 1) {
					if(!$(e.target).hasClass('redactor_editor'))
						me.visitLink(e);
				}
			singleclickcount = 0;
			}, 400);
		}
		//else
		//	me.editLink(e);
	},
	visitLink: function(e) {
		e.preventDefault();
		var me = this;
		console.log('visit the link');
		return;
		var link = $(e.target).attr('href');


		if(link.indexOf('#') > -1 && me.getCleanurl(link) == me.getCleanurl()) {
			if(link.indexOf('#ltb-') > -1)	 {
				var regions = Upfront.Application.layout.get('regions');
				region = regions ? regions.get_by_name(me.getUrlanchor(link)) : false;
				if(region){
					//hide other lightboxes
					_.each(regions.models, function(model) {
						if(model.attributes.sub == 'lightbox')
							Upfront.data.region_views[model.cid].hide();
					});
					var regionview = Upfront.data.region_views[region.cid];
					regionview.show();
				}
			} else {
				var anchors = me.get_anchors();
				$('html,body').animate({scrollTop: $('#'+me.getUrlanchor(link)).offset().top},'slow');
			}
		} else if(link == '') {
			window.location.href = link;
		} else window.open(link);
		
	},
	getCleanurl: function(url) {
		//this one removes any existing # anchor postfix from the url
		var urlParts;
		if(!url){
			url = location.href;
		}

		if(url.indexOf('?dev=true') != -1) url = url.replace('?dev=true', '');

		if(url.indexOf('#') == -1) return url;

		urlParts = url.split('#');

		if(urlParts[0].trim() != '')
			return urlParts[0];
		else
			return location.href.replace('?dev=true', '');
	},
	getUrlanchor: function(url) {
		// this does almost the opposite of the above function

		if(typeof(url) == 'undefined') var url = $(location).attr('href');

		if(url.indexOf('#') >=0) {
			var tempurl = url.split('#');
			return tempurl[1];
		} else return false;
	},
	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [];
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				module.get("objects").each(function (object) {
					var anchor = object.get_property_value_by_name("anchor");
					if (anchor && anchor.length) anchors[anchor] = object;
				});
			});
		});
		return anchors;
	},
	/*editLink: function(e) {
		e.preventDefault();
		var editor = $(e.target).data('ueditor');
		
		if(editor) {
			editor.start();
		}
	},*/
	get_content_markup: function () {
		var content = this.model.get_content(), style_static = '', style_hover = '';

		if(this.model.get_property_value_by_name("currentpreset") && Upfront.Views.Editor.Button.Presets.get(this.model.get_property_value_by_name("currentpreset"))) {

			var preset = Upfront.Views.Editor.Button.Presets.get(this.model.get_property_value_by_name("currentpreset")).attributes;
			style_static = "border: "+preset.borderwidth+"px "+preset.bordertype+" "+preset.bordercolor+"; "+
					"border-radius: "+preset.borderradius1+"px "+preset.borderradius2+"px "+preset.borderradius4+"px "+preset.borderradius3+"px; "+
					"background-color: "+preset.bgcolor+"; "+
					"font-size: "+preset.fontsize+"px; "+
					"font-family: "+preset.fontface+"; "+
					"color: "+preset.color+"; "+
					"transition: all "+preset.hov_duration+"s "+preset.hov_transition+"; ";

			style_hover  =  '';
			if(preset.hov_borderwidth)
				style_hover = style_hover+'border-width: '+preset.hov_borderwidth+'px; ';
			if(preset.hov_bordertype)
				style_hover = style_hover+'border-style: '+preset.hov_bordertype+'; ';
			if(preset.hov_bordercolor)
				style_hover = style_hover+'border-color: '+preset.hov_bordercolor+'; ';
			if(preset.hov_borderradius1)
				style_hover = style_hover+'border-top-left-radius: '+preset.hov_borderradius1+'px; ';
			if(preset.hov_borderradius2)
				style_hover = style_hover+'border-top-right-radius: '+preset.hov_borderradius2+'px; ';
			if(preset.hov_borderradius3)
				style_hover = style_hover+'border-bottom-right-radius: '+preset.hov_borderradius3+'px; ';
			if(preset.hov_borderradius4)
				style_hover = style_hover+'border-bottom-left-radius: '+preset.hov_borderradius4+'px; ';
			if(preset.hov_bgcolor)
				style_hover = style_hover+'background-color: '+preset.hov_bgcolor+'; ';
			if(preset.hov_fontsize)
				style_hover = style_hover+'font-size: '+preset.hov_fontsize+'px; ';
			if(preset.hov_fontface)
				style_hover = style_hover+'font-family: '+preset.hov_fontsize+'; ';
			if(preset.hov_color)
				style_hover = style_hover+'color: '+preset.hov_color+'; ';


		}

		var data = {
			"id" : this.model.get_property_value_by_name('element_id'),
			"content" : content,
			"href" : this.model.get_property_value_by_name('href'),
			"align" : this.model.get_property_value_by_name('align'),
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
		var $target = this.$el.find('.upfront-object-content a.upfront_cta');
		$target.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				//focus: true,
				
				airButtons: ['upfrontLink', 'stateAlignCTA', 'upfrontIcons'],
				
				placeholder: 'Click here',
				autostart: false
			})
			.on('start', function(){
				me.$el.find('div.upfront-output-button').addClass('being_edited');
				me.model.set_property('is_edited', true, true);
				Upfront.Events.trigger('upfront:element:edit:start', 'text');
			})
			.on('stop', function(){
				var ed = $target.data("ueditor"),
					text = ''
				;

				try { text = ed.getValue(true); } catch (e) { text = ''; }
								
				if (text) me.model.set_content(text, {silent: true}); // Something in inserts is destroying the sidebar
				me.property('href', $target.attr('href'), true);

				me.property('align', $target.css('text-align'), true);
				me.$el.find('div.being_edited').removeClass('being_edited');
				Upfront.Events.trigger('upfront:element:edit:stop');
				me.render();
			})
			.on('syncAfter', function(){
				var ed = $target.data("ueditor"),
					text = ''
				;

				try { text = ed.getValue(true); } catch (e) { text = ''; }
								
				if (text) me.model.set_content(text, {silent: true});
			})
		/*.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				//focus: true,

				airButtons: ['upfrontLinkCTA', 'stateAlignCTA'],
				placeholder: 'Click here',
			}).on('start', function(e) {
				Upfront.Events.trigger('upfront:element:edit:start', 'text');
				$(this).focus();
			 }).on("stop", function () {
				me.property('content', $target.text(), true);
				me.property('href', $target.attr('href'), true);
				console.log($target.text());
				me.property('align', $target.css('text-align'), true);
				//Upfront.Events.trigger('upfront:element:edit:stop');
			 }).on("blur", function(){
				$target.data('ueditor').stop();
			 });

			$target.data('ueditor').stop();
			*/
/*			setTimeout(function() {
				me.conformSize();
			}, 100);
			*/
		//this.$el.children('.upfront-object').css('min-height', this.$el.closest('.upfront-module').css('min-height'));
		this.property('row', this.parent_module_view.model.get('properties').get('row').attributes.value);
	},
	stopEdit: function() {
			var $target = this.$el.find('.upfront-object-content a.upfront_cta');
			$target.trigger('blur');

	},
	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
});


var ButtonElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 260,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-button');
		this.$el.html('Button');
	},
	add_element: function () {
		var object = new ButtonModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "Click here"},
					{"name": "href", "value": "#"},
					{"name": "align", "value": "center"},
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
		var html = ['<a href="#" title="Edit preset" class="upfront-buttonpreset-edit">edit preset</a>'];
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
			if (!preset.id || preset.id.indexOf('_default') > -1) return;
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
  hide_common_anchors: true,

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
						compact: true,
						className: 'new_preset_name',
					});

		me.borderType = new Upfront.Views.Editor.Field.Radios({
			className: 'inline-radios plaintext-settings static',
			model: this.model,
			//property: 'border_style',
			label: 'Border:',
			default_value: "none",
			values: [
				{ label: l10n.none, value: 'none' },
				{ label: l10n.solid, value: 'solid' },
				{ label: l10n.dashed, value: 'dashed' },
				{ label: l10n.dotted, value: 'dotted' }
			],
			change: function() { me.updatelivecss(me, this);}
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
			change: function() { me.updatelivecss(me, this);}
		}),
		me.borderColor = new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintext-settings inline-color border-color static',
			blank_alpha : 0,
			model: this.model,
			//property: 'border_color',
			default_value: '#000',
			label: l10n.color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me, me.borderColor);},
				move: function() { me.updatelivecss(me, me.borderColor, true);}
			}
		});
		me.borderRadiusLock = new Upfront.Views.Editor.Field.Checkboxes({
			className: 'border_radius_lock static',
			model: this.model,
			label: "",
			values: [
				{ label: '', value: 'yes' }
			],
			change: function() {
				if(typeof(me.borderRadiusLock.get_value()) == 'object' && me.borderRadiusLock.get_value().length > 0) {
					me.borderRadius2.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius2);
					me.borderRadius3.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius3);
					me.borderRadius4.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius4);

				}
				me.updatelivecss(me, this);
			}
		});
		me.borderRadius1= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius1 static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: 'Rounded Corners:',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.borderRadiusLock.get_value()) == 'object' && me.borderRadiusLock.get_value().length > 0) {
					me.borderRadius2.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius2);
					me.borderRadius3.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius3);
					me.borderRadius4.set_value(me.borderRadius1.get_value());
					me.updatelivecss(me, me.borderRadius4);

				}
				me.updatelivecss(me, this);
			}
		}),
		me.borderRadius2= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius2 static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.borderRadiusLock.get_value()) == 'object' && me.borderRadiusLock.get_value().length > 0) {
					me.borderRadius1.set_value(me.borderRadius2.get_value());
					me.updatelivecss(me, me.borderRadius1);
					me.borderRadius3.set_value(me.borderRadius2.get_value());
					me.updatelivecss(me, me.borderRadius3);
					me.borderRadius4.set_value(me.borderRadius2.get_value());
					me.updatelivecss(me, me.borderRadius4);

				}
				me.updatelivecss(me, this);}
		}),
		me.borderRadius4= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius4 static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.borderRadiusLock.get_value()) == 'object' && me.borderRadiusLock.get_value().length > 0) {
					me.borderRadius1.set_value(me.borderRadius4.get_value());
					me.updatelivecss(me, me.borderRadius1);
					me.borderRadius2.set_value(me.borderRadius4.get_value());
					me.updatelivecss(me, me.borderRadius2);
					me.borderRadius3.set_value(me.borderRadius4.get_value());
					me.updatelivecss(me, me.borderRadius3);

				}
				me.updatelivecss(me, this);}
		}),
		me.borderRadius3= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius3 static',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.borderRadiusLock.get_value()) == 'object' && me.borderRadiusLock.get_value().length > 0) {
					me.borderRadius1.set_value(me.borderRadius3.get_value());
					me.updatelivecss(me, me.borderRadius1);
					me.borderRadius2.set_value(me.borderRadius3.get_value());
					me.updatelivecss(me, me.borderRadius2);
					me.borderRadius4.set_value(me.borderRadius3.get_value());
					me.updatelivecss(me, me.borderRadius4);

				}

				me.updatelivecss(me, this);}
		}),
		me.bgColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  bg-color static',
			blank_alpha : 0,
			model: this.model,
			//property: 'bg_color',
			default_value: '#ccc',
			//label_style: 'inline',
			label: 'BG Color:',
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me, me.bgColor);},
				move: function() { me.updatelivecss(me, me.bgColor, true);},
			}
		}),
		me.fontSize= new Upfront.Views.Editor.Field.Number({
			className: 'font static',
			model: this.model,
			min: 8,
			//property: 'border_width',
			label: 'Font: ',
			default_value: 12,
			values: [
				{ label: "", value: '12' }
			],
			change: function() { me.updatelivecss(me, this);}
		}),
		me.fontFace = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
				label: 'px',
				label_style: 'inline',
				className: 'font_face static',
				change: function() { me.updatelivecss(me, this);}
		}),
		me.color= new Upfront.Views.Editor.Field.Color({
				className: 'upfront-field-wrap upfront-field-wrap-color sp-cf font_color bg-color static',
				blank_alpha : 0,
				model: this.model,
				//property: 'bg_color',
				default_value: '#000',
				label_style: 'inline',
				label: '',
				spectrum: {
					preferredFormat: "hex",
					change: function() { me.updatelivecss(me, me.color);},
					move: function() { me.updatelivecss(me, me.color, true);},
				}
		});

		// Similar settings for hover state

		me.hov_borderType = new Upfront.Views.Editor.Field.Radios({
			className: 'inline-radios  plaintext-settings hover',
			model: this.model,
			//property: 'border_style',
			label: "Border:",
			default_value: "none",
			values: [
				{ label: l10n.none, value: 'none' },
				{ label: l10n.solid, value: 'solid' },
				{ label: l10n.dashed, value: 'dashed' },
				{ label: l10n.dotted, value: 'dotted' }
			],
			change: function() { me.updatelivecss(me, this);}
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
			change: function() { me.updatelivecss(me, this);}
		}),
		me.hov_borderColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color border-color hover',
			blank_alpha : 0,
			model: this.model,
			//property: 'border_color',
			default_value: '#000',
			label: l10n.color,
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me, me.hov_borderColor);},
				move: function() { me.updatelivecss(me, me.hov_borderColor);}
			}
		}),
		me.hov_borderRadiusLock = new Upfront.Views.Editor.Field.Checkboxes({
			className: 'border_radius_lock hover',
			model: this.model,
			label: "",
			values: [
				{ label: '', value: 'yes' }
			],
			change: function() {
				if(typeof(me.hov_borderRadiusLock.get_value()) == 'object' && me.hov_borderRadiusLock.get_value().length > 0) {
					me.hov_borderRadius2.set_value(me.hov_borderRadius1.get_value());

					me.hov_borderRadius3.set_value(me.hov_borderRadius1.get_value());

					me.hov_borderRadius4.set_value(me.hov_borderRadius1.get_value());


				}
				me.updatelivecss(me, this);
			}
		}),
		me.hov_borderRadius1= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius1 hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: 'Rounded Corners: ',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.hov_borderRadiusLock.get_value()) == 'object' && me.hov_borderRadiusLock.get_value().length > 0) {
					me.hov_borderRadius2.set_value(me.hov_borderRadius1.get_value());
					me.hov_borderRadius3.set_value(me.hov_borderRadius1.get_value());
					me.hov_borderRadius4.set_value(me.hov_borderRadius1.get_value());

				}

				me.updatelivecss(me, this);}
		}),
		me.hov_borderRadius2= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius2 hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.hov_borderRadiusLock.get_value()) == 'object' && me.hov_borderRadiusLock.get_value().length > 0) {
					me.hov_borderRadius1.set_value(me.hov_borderRadius2.get_value());
					me.hov_borderRadius3.set_value(me.hov_borderRadius2.get_value());
					me.hov_borderRadius4.set_value(me.hov_borderRadius2.get_value());

				}
				me.updatelivecss(me, this);}
		}),
		me.hov_borderRadius4= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius4 hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.hov_borderRadiusLock.get_value()) == 'object' && me.hov_borderRadiusLock.get_value().length > 0) {
					me.hov_borderRadius1.set_value(me.hov_borderRadius4.get_value());
					me.hov_borderRadius2.set_value(me.hov_borderRadius4.get_value());
					me.hov_borderRadius3.set_value(me.hov_borderRadius4.get_value());

				}
				me.updatelivecss(me, this);}
		}),
		me.hov_borderRadius3= new Upfront.Views.Editor.Field.Number({
			className: 'border_radius border_radius3 hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: '',
			default_value: 0,
			values: [
				{ label: "", value: '0' }
			],
			change: function() {
				if(typeof(me.hov_borderRadiusLock.get_value()) == 'object' && me.hov_borderRadiusLock.get_value().length > 0) {
					me.hov_borderRadius1.set_value(me.hov_borderRadius3.get_value());
					me.hov_borderRadius2.set_value(me.hov_borderRadius3.get_value());
					me.hov_borderRadius4.set_value(me.hov_borderRadius3.get_value());

				}
				me.updatelivecss(me, this);}
		}),
		me.hov_bgColor= new Upfront.Views.Editor.Field.Color({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf bg-color hover',
			blank_alpha : 0,
			model: this.model,
			//property: 'bg_color',
			default_value: '#ccc',
			label: 'BG Color:',
			spectrum: {
				preferredFormat: "hex",
				change: function() { me.updatelivecss(me, me.hov_bgColor);},
				move: function() { me.updatelivecss(me, me.hov_bgColor);},
			}
		}),
		me.hov_fontSize= new Upfront.Views.Editor.Field.Number({
			className: 'font hover',
			model: this.model,
			min: 8,
			//property: 'border_width',
			label: 'Font:',
			default_value: 12,
			values: [
				{ label: "", value: '12' }
			],
			change: function() { me.updatelivecss(me, this);}
		}),
		me.hov_fontFace = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
				className: 'font_face hover',
				label: 'px',
				label_style: 'inline',
				change: function() { me.updatelivecss(me, this);}
		});

		me.hov_color= new Upfront.Views.Editor.Field.Color({
				className: 'upfront-field-wrap upfront-field-wrap-color sp-cf font_color bg-color hover',
				blank_alpha : 0,
				model: this.model,
				//property: 'bg_color',
				label_style: 'inline',
				label: '',
				default_value: '#000',
				spectrum: {
					preferredFormat: "hex",
					change: function() { me.updatelivecss(me, me.hov_color);},
					move: function() { me.updatelivecss(me, me.hov_color);},
				}
		});
		me.hov_duration= new Upfront.Views.Editor.Field.Number({
			className: 'duration hover',
			model: this.model,
			min: 0,
			//property: 'border_width',
			label: 'Animate Hover Changes:',
			default_value: 0.25,
			step: 0.25,
			values: [
				{ label: "", value: '12' }
			],
			change: function() { me.updatelivecss(me, this);}
		});
		me.hov_transition = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				label: 'sec',
				label_style: 'inline',
				values: [{ label: 'ease', value: 'ease' },
				{ label: 'linear', value: 'linear' },
				{ label: 'ease-in', value: 'ease-in' },
				{ label: 'ease-out', value: 'ease-out' },
				{ label: 'ease-in-out', value: 'ease-in-out' }
				],
				className: 'transition hover',
				change: function() { me.updatelivecss(me, this);}
		}),
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
				me.updatelivecss(me, this);
			},
		});
		me.presetspecific = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				className: 'preset_specific',
				title: 'Edit '+me.property('currentpreset'),
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
							me.updatelivecss(me, this);
						},
					}),
					me.borderType,
					me.borderWidth,
					me.borderColor,
					me.borderRadius1,
					me.borderRadius2,
					me.bgColor,
					me.borderRadiusLock,
					me.borderRadius4,
					me.borderRadius3,

					me.fontSize,
					me.fontFace,
					me.color,
					me.hov_borderType,
					me.hov_borderWidth,
					me.hov_borderColor,
					me.hov_borderRadius1,
					me.hov_borderRadius2,
					me.hov_bgColor,
					me.hov_borderRadiusLock,
					me.hov_borderRadius4,
					me.hov_borderRadius3,

					me.hov_fontSize,
					me.hov_fontFace,
					me.hov_color,
					me.hov_duration,
					me.hov_transition,
				]
			});
		me.buttonpresets = new Settings_ButtonPresets({
			model: this.model,
			title: 'Select Button Preset'
		});
		me.newpresets = new Upfront.Views.Editor.Settings.Item({
			model: this.model,
			title: 'Or',
			className: 'or_divider',
			fields: [
				newpresetname,
				new Upfront.Views.Editor.Field.Button({
					model: me.model,
					label: 'New Preset',
					className: "new_button_preset",
					compact: true,
					on_click: function() {
						if(newpresetname.$el.find('input').val().trim() != '') {
							me.property('currentpreset',  newpresetname.$el.find('input').val(), true);
							me.ready_preset();
						}
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
			me.updatelivecss(me, this);
		});



		if(!me.property('currentpreset')) {
			setTimeout(function() {
				var selectedpreset = me.buttonpresets.$el.find('input[type=radio]').first().val();
				me.load_preset(selectedpreset);
				me.updatelivecss(me, this);
			}, 100);
		}
		setTimeout(function() {
			me.$el.find('div.upfront-settings-common_panel').css('display', 'none');
		}, 100);

		Upfront.Events.on("entity:settings:beforedeactivate", this.on_save, this);
		Upfront.Events.once("entity:settings:deactivate", this.revert_preset, this);
		me.is_saving = false;
		me.original_style = $('style#style'+me.property('element_id')).html();

	},
	updatelivecss: function(me, invoker, ignorehover) {

		if(typeof(ignorehover) == 'undefined')
			ignorehover = false;

		if(typeof(me) == 'undefined')
			return;

			//var preset = Upfront.Views.Editor.Button.Presets.get(me.property('currentpreset'));
			//if(!preset) {
			if(typeof(invoker) != 'undefined' && typeof(invoker.$el) != 'undefined' && !ignorehover) {
				invoker.$el.addClass('touched');
				switch(invoker) {
					case me.borderType:
						if(!me.hov_borderType.$el.hasClass('touched')) {
							me.hov_borderType.invoked = true;
							me.hov_borderType.set_value(invoker.get_value());
						}
					break;
					case me.hov_borderType:
						if(me.hov_borderType.invoked) {
							invoker.$el.removeClass('touched');
							invoker.invoked = false;
						}
					break;
					case me.borderWidth:
						if(!me.hov_borderWidth.$el.hasClass('touched'))
							me.hov_borderWidth.set_value(invoker.get_value());
					break;
					case me.borderColor:
						if(!me.hov_borderColor.$el.hasClass('touched'))
							me.hov_borderColor.set_value(invoker.get_value());
					break;
					case me.borderRadiusLock:
						if(!me.hov_borderRadiusLock.$el.hasClass('touched')) {
							me.hov_borderRadiusLock.invoked = true;
							if(typeof(invoker.get_value()) == 'object' && invoker.get_value().length > 0){
								me.hov_borderRadiusLock.set_value(invoker.get_value());
							}
							else {
								me.hov_borderRadiusLock.$el.find(':checkbox').prop('checked', false);
							}
						}
					break;
					case me.hov_borderRadiusLock:
						if(me.hov_borderRadiusLock.invoked) {
							invoker.$el.removeClass('touched');
							invoker.invoked = false;
						}
					break;
					case me.borderRadius1:
						if(!me.hov_borderRadius1.$el.hasClass('touched'))
							me.hov_borderRadius1.set_value(invoker.get_value());
					break;
					case me.borderRadius2:
						if(!me.hov_borderRadius2.$el.hasClass('touched'))
							me.hov_borderRadius2.set_value(invoker.get_value());
					break;
					case me.borderRadius3:
						if(!me.hov_borderRadius3.$el.hasClass('touched'))
							me.hov_borderRadius3.set_value(invoker.get_value());
					break;
					case me.borderRadius4:
						if(!me.hov_borderRadius4.$el.hasClass('touched'))
							me.hov_borderRadius4.set_value(invoker.get_value());
					break;

					case me.bgColor:
						if(!me.hov_bgColor.$el.hasClass('touched'))
							me.hov_bgColor.set_value(invoker.get_value());
					break;
					case me.fontSize:
						if(!me.hov_fontSize.$el.hasClass('touched'))
							me.hov_fontSize.set_value(invoker.get_value());
					break;
					case me.fontFace:
						if(!me.hov_fontFace.$el.hasClass('touched')) {
							me.hov_fontFace.invoked = true;
							me.hov_fontFace.set_value(invoker.get_value());
						}
					break;
					case me.hov_fontFace:
						if(me.hov_fontFace.invoked) {
							invoker.$el.removeClass('touched');
							invoker.invoked = false;
						}
					break;
					case me.color:
						if(!me.hov_color.$el.hasClass('touched'))
							me.hov_color.set_value(invoker.get_value());
					break;
				}
			}
			//}

			var style_static = "border: "+me.borderWidth.get_value()+"px "+me.borderType.get_value()+" "+me.borderColor.get_value()+"; "+
					"border-radius: "+me.borderRadius1.get_value()+"px "+me.borderRadius2.get_value()+"px "+me.borderRadius4.get_value()+"px "+me.borderRadius3.get_value()+"px; "+
					"background-color: "+me.bgColor.get_value()+"; "+
					"font-size: "+me.fontSize.get_value()+"px; "+
					"font-family: "+me.fontFace.get_value()+"; "+
					"color: "+me.color.get_value()+"; "+
					"transition: all "+me.hov_duration.get_value()+"s "+me.hov_transition.get_value()+"; "

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
		
		this.is_saving = true;
		var currentpreset = this.property('currentpreset');
		if(this.buttonpresets.$el.css('display') == 'none')
			this.save_preset(this.property('currentpreset'));
		this.is_changed = true;
		this.constructor.__super__.on_save.apply(this, arguments);
	},
	revert_preset: function(e) {
		var me = this;
		
		setTimeout(function() {
			if(me.is_saving)
				return;
			
			$('style#style'+me.property('element_id')).html(me.original_style);
		}, 200);
	},
	editPreset: function(e){
		e.preventDefault();
		var selectedpreset = this.$el.find('div.button_preset li.upfront-field-select-option-selected input').val();
		if(!selectedpreset || selectedpreset == 'undefined')
			return;
		this.property('currentpreset', selectedpreset, true);
		this.ready_preset();
		this.load_preset(selectedpreset);
		this.updatelivecss(this);
	},
	ready_preset: function() {
		this.presetspecific.$el.find('.upfront-settings-item-title span').html('Edit ' + this.property('currentpreset'));
		this.buttonpresets.$el.hide(),
		this.$el.find('div.upfront-settings-common_panel').show();
		this.newpresets.$el.hide(),
		this.static_button_preset.$el.trigger('click');
		this.presetspecific.$el.show();
		//logic to hide preset selection and show preset fields
	},
	delete_preset: function(presetname) {
		Upfront.Views.Editor.Button.Presets.remove(presetname);
		Upfront.Events.trigger("entity:settings:deactivate");

	},

	load_preset: function(presetname) {
			if(Upfront.Views.Editor.Button.Presets.get(presetname)) {
				var preset = Upfront.Views.Editor.Button.Presets.get(presetname).attributes;

				this.borderType.set_value(preset.bordertype);

				this.borderWidth.set_value(preset.borderwidth);

				this.borderColor.set_value(preset.bordercolor);

				this.borderRadiusLock.set_value(preset.borderradiuslock);

				this.borderRadius1.set_value(preset.borderradius1);

				this.borderRadius2.set_value(preset.borderradius2);

				this.borderRadius4.set_value(preset.borderradius4);

				this.borderRadius3.set_value(preset.borderradius3);

				this.bgColor.set_value(preset.bgcolor);

				this.fontSize.set_value(preset.fontsize);

				this.fontFace.set_value(preset.fontface);

				this.color.set_value(preset.color);

				this.hov_duration.set_value(preset.hov_duration);

				this.hov_transition.set_value(preset.hov_transition);

				if(preset.hov_bordertype) {

					this.hov_borderType.set_value(preset.hov_bordertype);
					this.hov_borderType.$el.addClass('touched');
				}
				else
					this.hov_borderType.set_value(preset.bordertype);


				if(preset.hov_borderwidth) {

					this.hov_borderWidth.set_value(preset.hov_borderwidth);
					this.hov_borderWidth.$el.addClass('touched');
				}
				else
					this.hov_borderWidth.set_value(preset.borderwidth);

				if(preset.hov_bordercolor) {

					this.hov_borderColor.set_value(preset.hov_bordercolor);
					this.hov_borderColor.$el.addClass('touched');
				}
				else
					this.hov_borderColor.set_value(preset.bordercolor);


				if(preset.hov_borderradiuslock) {
					this.hov_borderRadiusLock.set_value(preset.hov_borderradiuslock);
					this.hov_borderRadiusLock.$el.addClass('touched');
				}
				else
					this.hov_borderRadiusLock.set_value(preset.borderradiuslock);



				if(preset.hov_borderradius1) {
					this.hov_borderRadius1.set_value(preset.hov_borderradius1);
					this.hov_borderRadius1.$el.addClass('touched');
				}
				else
					this.hov_borderRadius1.set_value(preset.borderradius1);

				if(preset.hov_borderradius2) {
					this.hov_borderRadius2.set_value(preset.hov_borderradius2);
					this.hov_borderRadius2.$el.addClass('touched');
				}
				else
					this.hov_borderRadius2.set_value(preset.borderradius2);

				if(preset.hov_borderradius4) {
					this.hov_borderRadius4.set_value(preset.hov_borderradius4);
					this.hov_borderRadius4.$el.addClass('touched');
				}
				else
					this.hov_borderRadius4.set_value(preset.borderradius4);

				if(preset.hov_borderradius3) {
					this.hov_borderRadius3.set_value(preset.hov_borderradius3);
					this.hov_borderRadius3.$el.addClass('touched');
				}
				else
					this.hov_borderRadius3.set_value(preset.borderradius3);

				if(preset.hov_bgcolor) {
					this.hov_bgColor.set_value(preset.hov_bgcolor);
					this.hov_bgColor.$el.addClass('touched');
				}
				else
					this.hov_bgColor.set_value(preset.bgcolor);

				if(preset.hov_fontsize) {
					this.hov_fontSize.set_value(preset.hov_fontsize);
					this.hov_fontSize.$el.addClass('touched');
				}
				else
					this.hov_fontSize.set_value(preset.fontsize);

				if(preset.hov_fontface) {
					this.hov_fontFace.set_value(preset.hov_fontface);
					this.hov_fontFace.$el.addClass('touched');
				}
				else
					this.hov_fontFace.set_value(preset.fontface);

				if(preset.hov_color) {
					this.hov_color.set_value(preset.hov_color);
					this.hov_color.$el.addClass('touched');
				}
				else
					this.hov_color.set_value(preset.color);

				this.$el.find('div.upfront-settings-css input[value="'+preset.theme_style+'"]').trigger('click');
			}
	},
	save_preset: function(presetname) {
		var preset = Upfront.Views.Editor.Button.Presets.get(presetname);
		if(preset) {
			preset.attributes.bordertype = this.borderType.get_value();
			preset.attributes.borderwidth = this.borderWidth.get_value();
			preset.attributes.bordercolor = this.borderColor.get_value();
			preset.attributes.borderradiuslock = this.borderRadiusLock.get_value();
			preset.attributes.borderradius1 = this.borderRadius1.get_value();
			preset.attributes.borderradius2 = this.borderRadius2.get_value();
			preset.attributes.borderradius4 = this.borderRadius4.get_value();
			preset.attributes.borderradius3 = this.borderRadius3.get_value();
			preset.attributes.bgcolor = this.bgColor.get_value();
			preset.attributes.fontsize = this.fontSize.get_value();
			preset.attributes.fontface = this.fontFace.get_value();
			preset.attributes.color = this.color.get_value();
			preset.attributes.hov_duration = this.hov_duration.get_value();
			preset.attributes.hov_transition = this.hov_transition.get_value();

			if(this.hov_borderType.$el.hasClass('touched'))
				preset.attributes.hov_bordertype = this.hov_borderType.get_value();


			if(this.hov_borderWidth.$el.hasClass('touched'))
				preset.attributes.hov_borderwidth = this.hov_borderWidth.get_value();

			if(this.hov_borderColor.$el.hasClass('touched'))
				preset.attributes.hov_bordercolor = this.hov_borderColor.get_value();

			if(this.hov_borderRadiusLock.$el.hasClass('touched'))
				preset.attributes.hov_borderradiuslock = this.hov_borderRadiusLock.get_value();

			if(this.hov_borderRadius1.$el.hasClass('touched'))
				preset.attributes.hov_borderradius1 = this.hov_borderRadius1.get_value();

			if(this.hov_borderRadius2.$el.hasClass('touched'))
				preset.attributes.hov_borderradius2 = this.hov_borderRadius2.get_value();

			if(this.hov_borderRadius4.$el.hasClass('touched'))
				preset.attributes.hov_borderradius4 = this.hov_borderRadius4.get_value();

			if(this.hov_borderRadius3.$el.hasClass('touched'))
				preset.attributes.hov_borderradius3 = this.hov_borderRadius3.get_value();

			if(this.hov_bgColor.$el.hasClass('touched'))
				preset.attributes.hov_bgcolor = this.hov_bgColor.get_value();

			if(this.hov_fontSize.$el.hasClass('touched'))
				preset.attributes.hov_fontsize = this.hov_fontSize.get_value();

			if(this.hov_fontFace.$el.hasClass('touched'))
				preset.attributes.hov_fontface = this.hov_fontFace.get_value();

			if(this.hov_color.$el.hasClass('touched'))
				preset.attributes.hov_color = this.hov_color.get_value();


			preset.attributes.theme_style = this.$el.find('div.upfront-settings-css li.upfront-field-select-option-selected input').val();

			Upfront.Views.Editor.Button.Presets.trigger('edit');
		}
		else {
			var newpreset = {};
			newpreset.id = presetname;
			newpreset.bordertype = this.borderType.get_value();
			newpreset.borderwidth = this.borderWidth.get_value();
			newpreset.bordercolor = this.borderColor.get_value();
			newpreset.borderradiuslock = this.borderRadiusLock.get_value();
			newpreset.borderradius1 = this.borderRadius1.get_value();
			newpreset.borderradius2 = this.borderRadius2.get_value();
			newpreset.borderradius4 = this.borderRadius4.get_value();
			newpreset.borderradius3 = this.borderRadius3.get_value();
			newpreset.bgcolor = this.bgColor.get_value();
			newpreset.fontsize = this.fontSize.get_value();
			newpreset.fontface = this.fontFace.get_value();
			newpreset.color = this.color.get_value();
			newpreset.fontface = this.fontFace.get_value();
			newpreset.color = this.color.get_value();
			newpreset.hov_duration = this.hov_duration.get_value();
			newpreset.hov_transition = this.hov_transition.get_value();

			if(this.hov_borderType.$el.hasClass('touched'))
				newpreset.hov_bordertype = this.hov_borderType.get_value();
			if(this.hov_borderWidth.$el.hasClass('touched'))
				newpreset.hov_borderwidth = this.hov_borderWidth.get_value();
			if(this.hov_borderColor.$el.hasClass('touched'))
				newpreset.hov_bordercolor = this.hov_borderColor.get_value();
			if(this.hov_borderRadiusLock.$el.hasClass('touched'))
				newpreset.hov_borderradiuslock = this.hov_borderRadiusLock.get_value();
			if(this.hov_borderRadius1.$el.hasClass('touched'))
				newpreset.hov_borderradius1 = this.hov_borderRadius1.get_value();
			if(this.hov_borderRadius2.$el.hasClass('touched'))
				newpreset.hov_borderradius2 = this.hov_borderRadius2.get_value();
			if(this.hov_borderRadius4.$el.hasClass('touched'))
				newpreset.hov_borderradius4 = this.hov_borderRadius4.get_value();
			if(this.hov_borderRadius3.$el.hasClass('touched'))
				newpreset.hov_borderradius3 = this.hov_borderRadius3.get_value();
			if(this.hov_bgColor.$el.hasClass('touched'))
				newpreset.hov_bgcolor = this.hov_bgColor.get_value();
			if(this.hov_fontSize.$el.hasClass('touched'))
				newpreset.hov_fontsize = this.hov_fontSize.get_value();
			if(this.hov_fontFace.$el.hasClass('touched'))
				newpreset.hov_fontface = this.hov_fontFace.get_value();
			if(this.hov_color.$el.hasClass('touched'))
				newpreset.hov_color = this.hov_color.get_value();


			newpresettheme_style = this.$el.find('div.upfront-settings-css li.upfront-field-select-option-selected input').val();

			Upfront.Views.Editor.Button.Presets.add(newpreset);

		}

		if(this.buttonpresets.$el.find('input[value="'+presetname+'"]').length > 0)
			this.buttonpresets.$el.find('input[value="'+presetname+'"]').trigger('click');
		else if(this.buttonpresets.$el.find('input[type=radio]:checked').length > 0)
			this.buttonpresets.$el.find('input[type=radio]:checked').val(presetname);
		else if(this.buttonpresets.$el.find('input[type=radio]').length > 0)
			this.buttonpresets.$el.find('input[type=radio]').first().val(presetname).prop('checked', true);
		else {

			this.buttonpresets.$el.find('ul.upfront-field-select-options').append($('<li>').append($('<input>').attr('type', 'radio').attr('name', 'currentpreset').val(presetname).prop('checked', true)));
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
