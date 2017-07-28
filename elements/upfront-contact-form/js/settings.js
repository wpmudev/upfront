define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-contact-form/templates/preset-style.html'
], function(ElementSettings, RootSettingsPanel, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.contact_element;

	var GeneralPanel = RootSettingsPanel.extend({
		label: 'Empty label',
		title: l10n.general.label,
		settings: [
			{
				type: 'SettingsItem',
				title: l10n.contact_details,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Email',
						property: 'form_email_to',
						label: l10n.general.send_to
					}
				]
			},
			{
				type: 'SettingsItem',
				title: l10n.fields.label,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Toggle',
						property: 'show_subject',
						relatedField: 'form_subject_label',
						className: 'field-grid-half upfront-field-padding-top',
						change : function(value, parent){
							parent.model.set_property("show_subject", value);
						},
						values: [
							{
								label: l10n.fields.show_subject,
								value: 'true'
							}
						]
					},
					{
						type: 'Toggle',
						property: 'show_captcha',
						className: 'field-grid-half field-grid-half-last upfront-field-padding-top',
						relatedField: 'form_captcha_label',
						change : function(value, parent){
							parent.model.set_property("show_captcha", value);
						},
						values: [
							{
								label: l10n.fields.show_captcha,
								value: 'true'
							}
						]
					},
					{
						type: 'Select',
						className: 'contact_label_position',
						layout: "vertical",
						label: l10n.fields.label_localtion,
						change : function(value, parent){
							parent.model.set_property("form_label_position", value);
						},
						property: 'form_label_position',
						values: [
							{
								label: l10n.apr.above,
								value: 'above',
							},
							{
								label: l10n.apr.over,
								value: 'over',
							},
							{
								label: l10n.apr.inline,
								value: 'inline',
							}
						]
					}
				]
			},
			{
				type: 'SettingsItem',
				title: l10n.validation.label,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Radios_Inline',
						className: 'inline-radios upfront-field-padding-top upfront-field-wrap-radios-inline',
						property: 'form_validate_when',
						values: [
							{
								label: l10n.validation.on_field,
								value: 'field'
							},
							{
								label: l10n.validation.on_submit,
								value: 'submit'
							}
						]
					}
				]
			}
		]
	});
	
	var PasswordField = Upfront.Views.Editor.Field.Text.extend({
		get_field_html: function () {
				var attr = {
					'type': 'password',
					'class': 'upfront-field upfront-field-text',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_saved_value()
				};
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			}
	});

	var SMTPAuthenticationSettings = Upfront.Views.Editor.Settings.Item.extend({
		className: 'no-title smtp_settings_item smtp-authentication',
		initialize: function(opts) {
			//var showsettings = this.model.get_property_value_by_name('smtp_authentication');
			this.update_fields();
			//this.update_fields(showsettings === 'yes'?'yes':'no');
			this.constructor.__super__.initialize.call(this, opts);
		},
		get_title: function() {
			return '';
		},
		update_fields: function(show) {
			var me = this;
			this.fields=_([]);
			
			if(typeof(show) !== 'undefined' && ((show.length > 0 && show[0] === 'yes') || show === 'yes')) {
				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_username',
					className: 'upfront-field-wrap upfront-field-wrap-text smtp_username',
					label: l10n.smtp.username,
					label_style: 'inline'
				});

				this.fields._wrapped[this.fields._wrapped.length] = new PasswordField({
					model: this.model,
					property: 'smtp_password',
					label: l10n.smtp.password,
					label_style: 'inline'
				});
			}

			if(typeof(show) !== 'undefined') {
				me.$el.html('');
				me.render();
			}
		}
	});

	var SMTPSpecificSettings = Upfront.Views.Editor.Settings.Item.extend({
		className: 'no-title smtp-configuration smtp_settings_item',
		initialize: function(opts) {
			
			this.authentication = opts.authentication;

			//var showsettings = this.model.get_property_value_by_name('smtp_enable');

			//this.update_fields(showsettings === 'yes'?'yes':'no');
			this.update_fields();
			this.constructor.__super__.initialize.call(this, opts);
		},
		get_title: function() {
			return l10n.smtp.configuration;
		},
		update_fields: function(show) {
			var me = this;
			this.fields=_([]);
			this.$el.addClass('no-title');
			if(typeof(show) !== 'undefined' && show === 'yes') {
				this.$el.removeClass('no-title');
				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Email({
					model: this.model,
					className: 'upfront-field-wrap-text',
					property: 'smtp_from_email',
					label: l10n.smtp.from_email
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_from_name',
					label: l10n.smtp.from_name
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_host',
					label: l10n.smtp.host
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_port',
					label: l10n.smtp.port
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios_Inline({
					model: this.model,
					className: 'inline-radios smtp-secure upfront-field-wrap-radios-inline upfront-field-wrap upfront-field-padding-top',
					property: 'smtp_secure',
					label: l10n.smtp.secure,
					label_style: 'inline',
					default_value: 'none',
					values: [
						{
							label: l10n.smtp.none,
							value: 'none'
						},
						{
							label: l10n.smtp.ssl,
							value: 'ssl'
						},
						{
							label: l10n.smtp.tls,
							value: 'tls'
						}
					]
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Toggle({
					model: this.model,
					className: 'inline-checkbox plaintext-settings upfront-field-wrap enable-authentication upfront-field-padding-top',
					property: 'smtp_authentication',
					default_value: 'no',
					values: [
						{
							label: l10n.smtp.authentication,
							value: 'yes'
						}
					],
					change: function(value) {
						me.authentication.update_fields(value === 'yes' || (value.length > 0 && value[0] === 'yes')?'yes':'no');
					}
				});
			}

			if(typeof(show) !== 'undefined') {
				me.$el.html('');
				me.render();
			}
		}
	});

	var ContactFormSettings = ElementSettings.extend({
		panels: {
			General: GeneralPanel,
			Appearance: {
				mainDataCollection: 'contactPresets',
				styleElementPrefix: 'contact-preset',
				ajaxActionSlug: 'contact',
				panelTitle: l10n.settings,
				presetDefaults: Upfront.mainData.presetDefaults.contact,
				styleTpl: styleTpl,
				stateModules: {
					Static: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'static-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'static-button-bg',
										label: l10n.button_bg_label
									}
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.typography_label,
								state: 'static',
								toggle: false,
								fields: {
									typeface: 'static-font-family',
									fontstyle: 'static-font-style',
									weight: 'static-weight',
									style: 'static-style',
									size: 'static-font-size',
									line_height: 'static-line-height',
									color: 'static-font-color'
								},
								default_element: "field-labels",
								elements: [
									{ label: l10n.field_labels_label, value: "field-labels" },
									{ label: l10n.field_values_label, value: "field-values" },
									{ label: l10n.button_label, value: "button" }
								]
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'static-fields',
								title: '',
								label: 'Fields Border',
								fields: {
									use: 'static-fields-useborder',
									width: 'static-fields-borderwidth',
									type: 'static-fields-bordertype',
									color: 'static-fields-bordercolor'
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'static-button',
								title: '',
								label: 'Button Border',
								fields: {
									use: 'static-button-useborder',
									width: 'static-button-borderwidth',
									type: 'static-button-bordertype',
									color: 'static-button-bordercolor'
								}
							}
						}
					],

					Hover: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-use-color'
								},
								single: true,
								abccolors: [
									{
										name: 'hover-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'hover-button-bg',
										label: l10n.button_bg_label
									}
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.typography_label,
								state: 'hover',
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-use-typography',
									typeface: 'hover-font-family',
									fontstyle: 'hover-font-style',
									weight: 'hover-weight',
									style: 'hover-style',
									size: 'hover-font-size',
									line_height: 'hover-line-height',
									color: 'hover-font-color'
								},
								default_element: "field-labels",
								elements: [
									{ label: l10n.field_labels_label, value: "field-labels" },
									{ label: l10n.field_values_label, value: "field-values" },
									{ label: l10n.button_label, value: "button" }
								]
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover-fields',
								title: '',
								label: 'Fields Border',
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-fields-useborder',
									width: 'hover-fields-borderwidth',
									type: 'hover-fields-bordertype',
									color: 'hover-fields-bordercolor'
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover-button',
								title: '',
								label: 'Button Border',
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-button-useborder',
									width: 'hover-button-borderwidth',
									type: 'hover-button-bordertype',
									color: 'hover-button-bordercolor'
								}
							}
						},
						{
							moduleType: 'HovAnimation',
							options: {
								state: 'hover',
								title: '',
								toggle: true,
								fields: {
									use: 'hover-use-transition',
									duration: 'hover-transition-duration',
									easing: 'hover-transition-easing'
								}
							}
						}
					],

					Focus: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								toggle: true,
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-use-color'
								},
								abccolors: [
									{
										name: 'focus-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'focus-button-bg',
										label: l10n.button_bg_label
									}
								]
							}
						},
				
						{
							moduleType: 'Border',
							options: {
								state: 'focus-button',
								title: '',
								label: 'Button Border',
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-button-useborder',
									width: 'focus-button-borderwidth',
									type: 'focus-button-bordertype',
									color: 'focus-button-bordercolor',
								},
							}
						}
					]
				}
			}
		},
		initialize: function (opts) {
			var me = this;
			// Call the super constructor here, so that the appearance panel is instantiated
			this.constructor.__super__.initialize.call(this, opts);

			var panel = new RootSettingsPanel({
				model: this.model,
				title: l10n.smtp.label
			});
			
			var smtp_authentication = new SMTPAuthenticationSettings({model: this.model});
			
			var smtp_configuration = new SMTPSpecificSettings({model: this.model, authentication: smtp_authentication});

			var smtp_enable = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.smtp.enable,
				className: 'general_smtp_settings smtp_settings_item',
				fields: [
					new Upfront.Views.Editor.Field.Toggle({
						model: this.model,
						property: 'smtp_enable',
						className: 'inline-radios plaintext-settings',
						default_value: 'no',
						values: [
							{
								label: l10n.smtp.yes,
								value: 'yes'
							}
						],
						change: function(value) {
							smtp_configuration.update_fields(value);
							
							var show_authentication = this.model.get_property_value_by_name('smtp_authentication');
							smtp_authentication.update_fields((show_authentication.length > 0 && show_authentication[0] === 'yes' && value ==='yes') ?'yes':'no');
						}

					}),
				]
			});



			var show_smtp = this.model.get_property_value_by_name('smtp_enable');
			var show_authentication = this.model.get_property_value_by_name('smtp_authentication');
			
			setTimeout(function() {
				smtp_configuration.update_fields(show_smtp === 'yes'?'yes':'no');
				smtp_authentication.update_fields((show_smtp === 'yes' && (show_authentication === 'yes' || (show_authentication.length > 0 && show_authentication[0] === 'yes')))?'yes':'no');
			}, 200);
			

			panel.settings = _([smtp_enable, smtp_configuration, smtp_authentication]);

			this.panels = {General: this.panels.General, SMTPPanel: panel , Appearance: this.panels.Appearance, Advanced: this.panels.Advanced};
			//this.panels = _.extend({SMTPPanel: panel}, this.panels);

		},
		migrateDefaultStyle: function(styles) {
				//replace image wrapper class
				styles = styles.replace(/(div)?\.upfront-contact-form\s/g, '');
				styles = styles.replace(/(div)?\.upfront-object\s/g, '');

				return styles;
		},
		title: 'Contact Element'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('contact', styleTpl);

	return ContactFormSettings;
});
