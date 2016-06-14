(function ($) {
define([
	'text!elements/upfront-login/css/edit.css',
	'text!elements/upfront-login/css/public.css',
	'elements/upfront-login/js/preset-settings',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/element-settings/advanced-settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-login/tpl/preset-style.html'
], function (editor_style, public_style, LoginPresetSettings, ElementSettings, RootSettingsPanel, AdvancedSettings, Util, styleTpl) {

	$("head").append("<style>" + editor_style + "</style>");
	$("head").append("<style>" + public_style + "</style>");

	var l10n = Upfront.Settings.l10n.login_element;

	var LoginModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.upfront_login.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
			this.init_properties(properties);
		}
	});

	var LoginView = Upfront.Views.ObjectView.extend({
		markup: false,

		initialize: function () {
			if(! (this.model instanceof LoginModel)){
				this.model = new LoginModel({properties: this.model.get('properties')});
			}
			Upfront.Views.ObjectView.prototype.initialize.call(this);
			var me = this;
			this.model.get("properties").on("change", function (model) {
				if (!model || !model.get) return true;
				if ("row" != model.get("name")) {
					me.markup = false;
					me.render();
				}
			});
			this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
		},

		render: function () {
			if (!this.markup) {
				var me = this,
					options = Upfront.Util.model_to_json(this.model)
				;
				Upfront.Util.post({
					"action": "upfront-login_element-get_markup",
					properties: options.properties
				}).done(function (response) {
					me.markup = response.data;
					Upfront.Views.ObjectView.prototype.render.call(me);

					Upfront.Events.trigger('entity:object:refresh', me);
				});
			}
			Upfront.Views.ObjectView.prototype.render.call(this);
		},
		get_content_markup: function () {

			return !!this.markup ? this.markup : l10n.hold_on;
		}
	});

	var Login_Fields_FieldAppearance_Icon_Image = Upfront.Views.Editor.Field.Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-appearance-icon-image',
		get_field_html: function () {
			return '<div class="upfront_login-icon">' +
					'<img src="' + Upfront.data.upfront_login.root_url + 'img/icon.png" />' +
					Upfront.Views.Editor.Field.Text.prototype.get_field_html.call(this) +
				'</div>'
			;
		},
		get_saved_value: function () {
			var prop = this.property ? this.property.get('value') : (this.model ? this.model.get(this.name) : '');
			return 'icon' === prop ? '' : prop;
		},
		get_value: function () {
			return this.$el.find("input").val() || 'icon';
		}
	});

	var Login_SettingsItem_ComplexItem = Upfront.Views.Editor.Settings.Item.extend({
		save_fields: function () {
			var model = this.model;
			this.fields.each(function (field) {
				var data = field.get_value();
				if (!_.isObject(data)) return;
				_(data).each(function (val, idx) {
					if ('appearance' == idx && !val) return true;
					model.set_property(idx, val);
				});
			});
		}
	});

	var Login_Fields_Complex_BooleanField = Backbone.View.extend({
		className: "upfront_login-fields-complex_boolean clearfix",
		initialize: function (opts) {
			this.options = opts;
			var model = opts.model,
				boolean_values = opts.boolean_field.values || []
			;
			if (!boolean_values.length) {
				boolean_values.push({label: "", value: "1"});
			}

			this.options.field = new Upfront.Views.Editor.Field.Radios(_.extend(
				opts.boolean_field, {
					model: model,
					mutiple: false,
					values: boolean_values
			}));
		},
		render: function () {
			this.$el.empty();

			this.options.subfield.render();
			this.options.field.render();

			this.$el.append(this.options.field.$el);
			this.$el.append(this.options.subfield.$el);

			if (this.options.additional_class) this.$el.addClass(this.options.additional_class);
		},
		get_value: function () {
			var data = {};
			data[this.options.field.get_name()] = this.options.field.get_value();
			data[this.options.subfield.get_name()] = this.options.subfield.get_value();
			return data;
		}
	});

	var LoginSettings_Panel = RootSettingsPanel.extend({
		title: l10n.general_settings,
		initialize: function (opts) {
			this.options = opts;
			var appearance = new LoginSettings_Field_DisplayAppearance({model: this.model}),
				behavior = new LoginSettings_Field_DisplayBehavior({model: this.model}),
				// trigger = new LoginSettings_Field_DisplayTrigger({model: this.model}),
				me = this,
				preview_check = this.preview_field()
			;
			
			this.preview_check_field = new preview_check({
				model: this.model,
				className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes float-right',
				property: 'logged_in_preview',
				label: "",
				multiple: false,
				values: [
					{ label: l10n.preview, value: 'yes' }
				],
				change: function() {
					this.property.set({'value': this.get_value()}, {'silent': false});
				}
			});
			
			this.settings = _([
				appearance,
				behavior,
				// trigger,
				new Upfront.Views.Editor.Settings.Item({
					model: this.model,
					title: l10n.logged_in_preview,
					className: 'upfront-settings-item relative',
					fields: [
						this.preview_check_field,
						new Upfront.Views.Editor.Field.Radios({
							className: "upfront_login-logout_style upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios clear-after",
							model: this.model,
							property: "logout_style",
							layout: 'horizontal-inline',
							values: [
								{label: l10n.nothing, value: "nothing"},
								{label: l10n.log_out_link, value: "link"}
							],
							change: function() {
								this.property.set({'value': this.get_value()}, {'silent': false});
							}
						})
					]

				})/*,
				new Upfront.Views.Editor.Settings.Settings_CSS({model: this.model })*/ // We no longer use custom element CSS
			]);
			appearance.on("login:appearance:changed", behavior.update, behavior);
			// appearance.on("login:appearance:changed", trigger.update, trigger);
			appearance.on("login:appearance:changed", function () {
				me.trigger("upfront:settings:panel:refresh", me);
			});
		},
		render: function () {
			RootSettingsPanel.prototype.render.call(this);
			this.$el.addClass("upfront_login-settings-panel");
			this.settings.each(function (setting) {
				if (setting.update) setting.update();
			});
		},
		get_label: function () {
			return l10n.display;
		},
		get_title: function () {
			return l10n.display;
		},
		preview_field: function () {
			var previewField = Upfront.Views.Editor.Field.Checkboxes.extend({
				get_value_html: function (value, index) {
					var id = this.get_field_id() + '-' + index;
					var classes = "upfront-field-multiple";
					var attr = {
						'type': this.type,
						'id': id,
						'name': this.get_field_name(),
						'value': value.value,
						'class': 'upfront_toggle_checkbox upfront-field-' + this.type
					};
					var saved_value = this.get_saved_value();
					var icon_class = this.options.icon_class ? this.options.icon_class : null;
					if ( this.options.layout ) classes += ' upfront-field-multiple-'+this.options.layout;
					if ( value.disabled ) {
						attr.disabled = 'disabled';
						classes += ' upfront-field-multiple-disabled';
					}
					if ( this.multiple && _.contains(saved_value, value.value) ) {
						attr.checked = 'checked';
					} else if ( ! this.multiple && saved_value == value.value ) {
						attr.checked = 'checked';
					}
					if (value.checked) attr.checked = 'checked';
					if ( attr.checked ) {
						classes += ' upfront-field-multiple-selected';
					}
					return '<div class="' + classes + ' upfront_toggle"><span class="upfront-field-label-text">' + value.label + '</span><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '" class="upfront_toggle_label"><span class="upfront_toggle_switch"></span></label></div>';
				}
			});
			return previewField;
		}
	});
	
	var LoginSettings = ElementSettings.extend({
		className: 'login-element-settings',
		events: _.extend({},ElementSettings.prototype.events, this.events, {
			'change input[name="partStyle"]': 'toggle_part_style',
    }),
		panels: {
			General: LoginSettings_Panel,
			Appearance: LoginPresetSettings
		},

		title: l10n.settings,

		get_title: function () {
			return l10n.settings;
		},
		render: function () {
			ElementSettings.prototype.render.call(this);
			
			var me = this,
				part_style = me.get_preset_property("partStyle")
			;
			setTimeout(function(){
				if ( part_style === 'element_wrapper' ) {
					me.default_view();
				} else {
					me.toggle_view(part_style);
				}
			},100);
		},
		toggle_part_style: function (e) {
			var selected = $(e.target).val();
			if ( selected === 'element_wrapper' ) {
				this.default_view();
			} else {
				this.toggle_view(selected);
			}
		},
		default_view: function () {
			this.$el.find('.state_settings_button_wrapper').hide();
			this.$el.find('.state_modules.state_settings').hide();
			this.$el.find('[class^="element_wrapper_settings"]').closest('.settings_module').show();
		},
		toggle_view: function (selected) {
			var me = this;
			this.$el.find('.settings_module').not(':first').hide();
			this.$el.find('.state_settings_button_wrapper').show();
			this.$el.find('[class^="'+ selected +'_settings"]').closest('.settings_module').show();
			setTimeout(function(){
				me.$el.find('.state_settings_button.state_settings_button_static').click();
			}, 100);
			
		},
		get_preset_property: function(prop_name) {
			var preset = this.model.get_property_value_by_name("preset"),
				props = Util.getPresetProperties('login', preset) || {};

			return ( typeof props[prop_name] !== 'undefined' )
				? props[prop_name]
				: false
			;
		},
	});

	var LoginSettings_Field_DisplayBehavior = Upfront.Views.Editor.Settings.Item.extend({
		className: 'display_behavior',
		events: function () {
			return _.extend({},
				Upfront.Views.Editor.Settings.Item.prototype.events,
				{"click": "register_change"}
			);
		},
		initialize: function () {
			var style = this.model.get_property_value_by_name("style");
			var hover_disabled = !style || "popup" == style;
			var behaviors = [
				{label: l10n.show_on_hover, value: "hover", disabled: hover_disabled},
				{label: l10n.show_on_click, value: "click"}
			];
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "behavior",
					values: behaviors,
					layout: 'horizontal-inline'
				}),
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					property: "top_offset",
					className: 'upfront-field-wrap upfront-field-wrap-number offset',
					label: l10n.top_offset,
					default_value: 0
				}),
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					property: "left_offset",
					className: 'upfront-field-wrap upfront-field-wrap-number offset',
					label: l10n.left_offset,
					default_value: 0
				})
			]);
		},
		render: function () {
			Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
			this.$el
				.addClass("upfront_login-item-display_behavior")
				.find(".upfront-settings-item-content").addClass("clearfix").end()
				.hide()
			;
			// appending px
			this.$el.find('.upfront-field-wrap.offset').each(function(){
				$(this).append('<span>'+ l10n.px +'</span>');
			});
		},
		get_title: function () {
			return l10n.show_form_label;
		},
		register_change: function () {
			this.fields.each(function (field) {
				field.property.set({'value': field.get_value()}, {'silent': false});
			});
			this.trigger("login:behavior:changed");
		},
		update: function () {
			var style = this.model.get_property_value_by_name("style");
			this.initialize();
			this.$el.empty();
			this.render();
			if ("form" != style) this.$el.show();
		}
	});

	var LoginSettings_Field_DisplayAppearance = Login_SettingsItem_ComplexItem.extend({
		initialize: function () {
			var me = this;
			var styles = [
				{label: l10n.on_page, value: "form"},
				{label: l10n.dropdown, value: "dropdown"}
			];
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "style",
					layout: 'horizontal-inline',
					values: styles,
					change: function() { me.register_change(me); }
				})
				// new Upfront.Views.Editor.Field.Text({
					// model: this.model,
					// property: 'label_text',
					// label: l10n.log_in_button,
					// change: function() { me.register_change(me); }
				// })
			]);
		},
		render: function () {
			Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
			this.$el.find(".upfront-settings-item-content").addClass("clearfix");
			// append description
			this.$el.find(".upfront-settings-item").prepend('<div class="login-general-settings-description clear-after">'+ l10n.general_settings_description +'</div>');
		},
		get_title: function () {
			return l10n.appearance;
		},
		register_change: function () {

			this.fields.each(function (field) {
				field.property.set({'value': field.get_value()}, {'silent': false});
			});
			this.trigger("login:appearance:changed");
		}
	});

	var LoginSettings_Field_DisplayTrigger = Login_SettingsItem_ComplexItem.extend({
		className: 'upfront_login-item-display_trigger',
		initialize: function () {
			var me = this;
			this.fields = _([
				new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'trigger_text',
					label: l10n.log_in_trigger,
					change: function() { me.register_change(me); }
				})
			]);
		},
		register_change: function () {
			this.fields.each(function (field) {
				field.property.set({'value': field.get_value()}, {'silent': false});
			});
			//this.trigger("login:behavior:changed");
		},
		update: function () {
			var style = this.model.get_property_value_by_name("style");
			this.initialize();
			this.$el.empty();
			this.render();
			if ("form" != style) this.$el.show();
		},
		render: function () {
			Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
			this.$el
				.find(".upfront-settings-item-content").addClass("clearfix").end()
				.hide()
			;
			this.$el.find('.upfront-settings-item-title').remove();
		},
		get_title: function () {
			return "";
		}
	});


	var LoginElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 160,

		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-login');
			this.$el.html(l10n.element_name);
		},

		add_element: function () {

			var object = new LoginModel(),
				module = new Upfront.Models.Module({
					name: "",
					properties: [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c24 upfront-login_element-module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(210)}
					],
					objects: [object]
				})
			;
			this.add_module(module);
		}
	});
	
	// Generate presets styles to page
	Util.generatePresetsToPage('login', styleTpl);
	
	Upfront.Application.LayoutEditor.add_object("Login", {
		"Model": LoginModel,
		"View": LoginView,
		"Element": LoginElement,
		"Settings": LoginSettings,
		cssSelectors: {
			'.upfront_login-form p': {label: l10n.css.containers, info: l10n.css.containers_info},
			'.upfront_login-form form label': {label: l10n.css.labels, info: l10n.css.labels_info},
			'.upfront_login-form form input:not([type=submit]):not([type=checkbox])': {label: l10n.css.inputs, info: l10n.css.inputs_info},
			'.upfront_login-form form  input[type=submit]': {label: l10n.css.button, info: l10n.css.button_info},
			'.upfront_login-form form  input[type=checkbox]': {label: l10n.css.remember, info: l10n.css.remember_info},
			'.login-lostpassword': {label: l10n.css.pwd_wrap, info: l10n.css.pwd_wrap_info},
			'.upfront_login-form p .login-lostpassword-link': {label: l10n.css.pwd_link, info: l10n.css.pwd_link_info},
			'.upfront_login-trigger': {label: l10n.css.close, info: l10n.css.close_info}
		},
		cssSelectorsId: Upfront.data.upfront_login.defaults.type
	});
	Upfront.Models.LoginModel = LoginModel;
	Upfront.Views.LoginView = LoginView;

});
})(jQuery);
