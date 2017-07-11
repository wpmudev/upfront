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
				this.fetch_content_markup();
			}
			Upfront.Views.ObjectView.prototype.render.call(this);
		},
		on_render: function () {
			if (Upfront.Application.user_can_modify_layout()) {
				var me = this;

				// Username
				$username = this.$el.find('label[for="user_login"]');
				$username_input_label = $('<input type="text" class="upfront-input-labels" value="'+ $username.text() +'"/>');
				$username_input_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('username_label', text, true);
				});
				$username.replaceWith($username_input_label);

				// Password
				$password = this.$el.find('label[for="user_pass"]');
				$password_input_label = $('<input type="text" class="upfront-input-labels" value="'+ $password.text() +'"/>');
				$password_input_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('password_label', text, true);
				});
				$password.replaceWith($password_input_label);

				// Remember
				$remember = this.$el.find('.login-remember > label');
				$remember_checkbox = $remember.find('input');
				$remember_input_label = $('<input type="text" class="upfront-input-labels" value="'+ $remember.text() +'"/>');
				$remember.html($remember_checkbox);
				$remember_input_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('remember_label', text, true);
				});
				$remember.append($remember_input_label);

				// Login button
				$login_button = this.$el.find('.login-submit input.button-primary');
				$login_button_label = $('<input type="text" class="upfront-input-labels" value="'+ $login_button.val() +'"/>');
				$login_button_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('login_button_label', text, true);
				});
				$login_button.replaceWith($login_button_label);

				// Lost Password Text
				$lost_password_text = this.$el.find('span.login-lostpassword-label');
				$lost_password_text_input_label = $('<input type="text" class="upfront-input-labels" value="'+ $lost_password_text.text() +'"/>');
				$lost_password_text_input_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('lost_password_text', text, true);
				});
				$lost_password_text.replaceWith($lost_password_text_input_label);

				// Lost Password Link
				$lost_password_link = this.$el.find('a.login-lostpassword-link');
				$lost_password_link_input_label = $('<input type="text" class="upfront-input-labels lostpassword-link" value="'+ $lost_password_link.text() +'"/>');
				$lost_password_link_input_label.on('change', function(){
					var text = $(this).val();
					if (text) me.model.set_property('lost_password_link', text, true);
				});
				$lost_password_link.replaceWith($lost_password_link_input_label);

				// Login Link
				$login_link = this.$el.find('span.upfront_login-label');
				$login_link.ueditor({
					linebreaks: true,
					disableLineBreak: true,
					airButtons: ['upfrontIcons'],
					autostart: false
				})
				.on('stop', function(){
					var ed = me.$el.find('span.upfront_login-label').data("ueditor"),
						text = ed.getValue(true)
					;
					if (text) me.model.set_property('trigger_text', text, true);
					me.redraw_layout();
				});

				// Logout Link
				$logout_link = this.$el.find('a.logout_link');
				$logout_link.ueditor({
					linebreaks: true,
					disableLineBreak: true,
					airButtons: ['upfrontIcons'],
					autostart: false
				})
				.on('stop', function(){
					var ed = me.$el.find('a.logout_link').data("ueditor"),
						text = ed.getValue(true)
					;
					if (text) me.model.set_property('logout_link', text, true);
					me.redraw_layout();
				});
				
				// tweaking z-index for triggered forms
				var current_style = me.model.get_property_value_by_name("style");
				if ( current_style && current_style !== 'form' ) {
					me.$el.closest('.upfront-objects_container').css('z-index',3000);
				}
			}

			this.events = _.extend({}, this.events, {
				'click label' : 'disable_default',
				'click a' : 'disable_default',
				'click .upfront_login.upfront_login-click .upfront_login-trigger' : 'trigger_login_click'
			});
			this.delegateEvents();

		},
		trigger_login_click: function (e) {
			if (Upfront.Application.user_can_modify_layout()) {
				var $root = $(e.target).closest(".upfront_login-click");
				$root
					.addClass("active")
					.one("click", function () {
						$root.removeClass("active");
						return false;
					})
					.find(".upfront_login-form").on("click", function (e) {
						e.preventDefault();
						e.stopPropagation();
					})
				;
				return false;
			}
		},
		get_content_markup: function () {
			return !!this.markup ? this.markup : l10n.hold_on;
		},
		fetch_content_markup: function () {
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
		},
		redraw_layout: function () {
			this.markup = false;
			Upfront.Views.ObjectView.prototype.render.call(this);
			this.fetch_content_markup();
		},
		disable_default: function (e) {
			if (Upfront.Application.user_can_modify_layout()) {
				e.preventDefault();
				e.stopPropagation();
			}
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
				me = this
			;

			this.preview_check_field = new Upfront.Views.Editor.Field.Toggle({
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
					className: 'upfront-settings-item general_settings_item relative',
					fields: [
						this.preview_check_field,
						new Upfront.Views.Editor.Field.Radios_Inline({
							className: "upfront_login-logout_style upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios-inline upfront-field-padding-top clear-after",
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
		}
	});

	var LoginSettings = ElementSettings.extend({
		className: 'login-element-settings',
		events: _.extend({},ElementSettings.prototype.events, this.events, {
			'change input[name="part_style"]': 'toggle_part_style'
    }),
		panels: {
			General: LoginSettings_Panel,
			Appearance: LoginPresetSettings
		},

		title: l10n.settings,

		get_title: function () {
			return l10n.settings;
		},
		initialize: function () {
			ElementSettings.prototype.initialize.call(this);
			this.stopListening(Upfront.Events, 'element:preset:updated');
			this.listenTo(Upfront.Events, 'element:preset:updated', this.preset_changed);
		},
		render: function () {
			ElementSettings.prototype.render.call(this);
			var me = this;
			setTimeout(function (){
				var part_style = me.get_preset_property("part_style");
				me.change_view(part_style);
			},100);
		},
		toggle_part_style: function (e) {
			var selected = $(e.target).val();
			this.change_view(selected);
		},
		default_view: function () {
			this.$el.find('.state_settings_button_wrapper').hide();
			this.$el.find('.state_modules.state_settings').hide();
			this.$el.find('[class^="form_wrapper_settings"]').closest('.settings_module').show();
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
		change_view: function (part_style) {
			if ( !part_style || part_style === 'form_wrapper' ) {
				this.default_view();
			} else {
				this.toggle_view(part_style);
			}
		},
		preset_changed: function () {
			var me = this;
			setTimeout(function() {
				var part_style = me.get_preset_property("part_style");
				me.change_view(part_style);
			}, 500);
		},
		get_preset_property: function(prop_name) {
			var preset = this.model.get_property_value_by_name("preset"),
				props = Util.getPresetProperties('login', preset) || {};

			return ( typeof props[prop_name] !== 'undefined' )
				? props[prop_name]
				: false
			;
		}
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
		className: 'general_settings_item',
		initialize: function () {
			var me = this;
			var styles = [
				{label: l10n.on_page, value: "form"},
				{label: l10n.dropdown, value: "dropdown"}
			];
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios_Inline({
					model: this.model,
					property: "style",
					layout: 'horizontal-inline',
					className: 'upfront-field-padding-top',
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
			'.upfront_login-form:not(.triggered)': {label: l10n.css.form_wrapper, info: l10n.css.form_wrapper_info},
			'.upfront_login-form.triggered': {label: l10n.css.form_wrapper_triggered, info: l10n.css.form_wrapper_triggered_info},
			'.upfront_login-form p:not(.login-lostpassword)': {label: l10n.css.containers, info: l10n.css.containers_info},
			'.upfront_login-form form#loginform label, .upfront_login-form form#loginform p:not(.login-submit):not(.login-remember) input.upfront-input-labels': {label: l10n.css.labels, info: l10n.css.labels_info},
			'.upfront_login-form form#loginform input:not([type=submit]):not([type=checkbox]):not(.upfront-input-labels)': {label: l10n.css.inputs, info: l10n.css.inputs_info},
			'.upfront_login-form form#loginform input[type=submit], .upfront_login-form form#loginform p.login-submit input.upfront-input-labels': {label: l10n.css.button, info: l10n.css.button_info},
			'.upfront_login-form form#loginform input[type=checkbox]': {label: l10n.css.remember, info: l10n.css.remember_info},
			'.upfront_login-form p.login-lostpassword': {label: l10n.css.pwd_wrap, info: l10n.css.pwd_wrap_info},
			'.upfront_login-form p .login-lostpassword-link, .upfront_login-form p .upfront-input-labels.lostpassword-link': {label: l10n.css.pwd_link, info: l10n.css.pwd_link_info},
			'.upfront_login-trigger': {label: l10n.css.login_trigger, info: l10n.css.login_trigger_info}
		},
		cssSelectorsId: Upfront.data.upfront_login.defaults.type
	});
	Upfront.Models.LoginModel = LoginModel;
	Upfront.Views.LoginView = LoginView;

});
})(jQuery);
