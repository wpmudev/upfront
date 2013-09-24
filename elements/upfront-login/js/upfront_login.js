(function ($) {
require(['text!' + Upfront.data.upfront_login.root_url + 'css/edit.css', 'text!' + Upfront.data.upfront_login.root_url + 'css/public.css'], function (editor_style, public_style) {

	$("head").append("<style>" + editor_style + "</style>");
	$("head").append("<style>" + public_style + "</style>");

	var LoginModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			this.init_property("type", "LoginModel");
			this.init_property("view_class", "LoginView");
			
			this.init_property("element_id", Upfront.Util.get_unique_id("upfront-login_element-object"));
			this.init_property("class", "c22 upfront-login_element-object");
			this.init_property("has_settings", 1);
		}
	});

	var LoginView = Upfront.Views.ObjectView.extend({
		markup: false,

		initialize: function () {
			Upfront.Views.ObjectView.prototype.initialize.call(this);
			var me = this;
			this.model.get("properties").on("change", function (model) {
				if (!model || !model.get) return true;
				if ("row" != model.get("name")) {
					me.markup = false;
					me.render();
				}
			});
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
				});
			}
			Upfront.Views.ObjectView.prototype.render.call(this);
		},
		get_content_markup: function () {
			return !!this.markup ? this.markup : 'Please, hold on';
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
		}
	});

	var Login_SettingsItem_ComplexItem = Upfront.Views.Editor.Settings.Item.extend({
		save_fields: function () {
			var model = this.model;
			this.fields.each(function (field) {
				var data = field.get_value();
				_(data).each(function (val, idx) {
					if ('appearance' == idx && !val) return true;
					model.set_property(idx, val);
				});
			});
		}
	});

	var Login_Fields_Complex_BooleanField = Backbone.View.extend({
		className: "upfront_login-fields-complex_boolean clearfix",
		initialize: function () {
			var model = this.options.model,
				boolean_values = this.options.boolean_field.values || []
			;
			if (!boolean_values.length) {
				boolean_values.push({label: "", value: "1"});
			}

			this.options.field = new Upfront.Views.Editor.Field.Radios(_.extend(
				this.options.boolean_field, {
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


	var LoginSettings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function () {
			this.panels = _([
				new LoginSettings_Panel({model: this.model})
			]);
		},
		get_title: function () {
			return "Login settings";
		}
	});
		var LoginSettings_Panel = Upfront.Views.Editor.Settings.Panel.extend({
			initialize: function () {
				var appearance = new LoginSettings_Field_DisplayAppearance({model: this.model}),
					behavior = new LoginSettings_Field_DisplayBehavior({model: this.model}),
					trigger = new LoginSettings_Field_DisplayTrigger({model: this.model})
				;
				this.settings = _([
					appearance,
					behavior,
					trigger
				]);
				appearance.on("login:appearance:changed", behavior.update, behavior);
				appearance.on("login:appearance:changed", trigger.update, trigger);
			},
			render: function () {
				Upfront.Views.Editor.Settings.Panel.prototype.render.call(this);
				this.$el.addClass("upfront_login-settings-panel");
			},
			get_label: function () {
				return "Display";
			},
			get_title: function () {
				return "Display";
			}
		});
			var LoginSettings_Field_DisplayBehavior = Upfront.Views.Editor.Settings.Item.extend({
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
						{label: "Show on hover", value: "hover", disabled: hover_disabled},
						{label: "Show on click", value: "click"},
					];
					this.fields = _([
						new Upfront.Views.Editor.Field.Radios({
							model: this.model,
							property: "behavior",
							values: behaviors
						}),
					]);
				},
				render: function () {
					Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
					this.$el
						.addClass("upfront_login-item-display_behavior")
						.find(".upfront-settings-item-content").addClass("clearfix").end()
						.hide()
					;
				},
				get_title: function () {
					return "Display behavior";
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
				events: function () {
					return _.extend({},
						Upfront.Views.Editor.Settings.Item.prototype.events,
						{"click": "register_change"}
					);
				},
				initialize: function () {
					var styles = [
						{label: "Form on page", value: "form"},
						{label: "Drop down form", value: "dropdown"},
						{label: "Form in lightbox", value: "popup"},
					];
					this.fields = _([
						new Upfront.Views.Editor.Field.Radios({
							model: this.model,
							property: "style",
							layout: "vertical",
							values: styles
						})
					]);
				},
				render: function () {
					Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
					this.$el.find(".upfront-settings-item-content").addClass("clearfix");
				},
				get_title: function () {
					return "Display Appearance";
				},
				register_change: function () {
					this.fields.each(function (field) {
						field.property.set({'value': field.get_value()}, {'silent': false});
					});
					this.trigger("login:appearance:changed");
				}
			});
			var LoginSettings_Field_DisplayTrigger = Login_SettingsItem_ComplexItem.extend({
				initialize: function () {
					this.fields = _([
						new Login_Fields_Complex_BooleanField({
							model: this.model,
							additional_class: "upfront_login-appearance-icon",
							boolean_field: {
								property: 'appearance',
								values: [{label: '', value: 'icon'}]
							},
							subfield: new Login_Fields_FieldAppearance_Icon_Image({model: this.model, property: 'label_image'})
						}),
						new Login_Fields_Complex_BooleanField({
							model: this.model,
							additional_class: "upfront_login-appearance-label",
							boolean_field: {
								property: 'appearance',
								values: [{label: '', value: 'label'}]
							},
							subfield: new Upfront.Views.Editor.Field.Text({
								model: this.model,
								property: 'label_text'
							})
						}),
					]);
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
				},
				get_title: function () {
					return "Trigger";
				}
			});


	var LoginElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 110,

		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-login');
			this.$el.html('Login');
		},

		add_element: function () {
			var object = new LoginModel(),
				module = new Upfront.Models.Module({ 
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c22 upfront-login_element-module"},
						{"name": "has_settings", "value": 0}
					],
					"objects": [object]
				})
			;
			this.add_module(module);
		}
	});
	Upfront.Application.LayoutEditor.add_object("Login", {
		"Model": LoginModel,
		"View": LoginView,
		"Element": LoginElement,
		"Settings": LoginSettings
	});
	Upfront.Models.LoginModel = LoginModel;
	Upfront.Views.LoginView = LoginView;

});
})(jQuery);