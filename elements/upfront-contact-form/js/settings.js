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
				className: 'general_settings_item multiple_radio_no_padding',
				fields: [
					{
						type: 'Optional',
						property: 'show_subject',
						relatedField: 'form_subject_label',
						values: [
							{
								label: l10n.fields.show_subject,
								value: 'true'
							}
						]
					},
					{
						type: 'Optional',
						property: 'show_captcha',
						relatedField: 'form_captcha_label',
						values: [
							{
								label: l10n.fields.show_captcha,
								value: 'true'
							}
						],
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
								icon: 'contact-above-field'
							},
							{
								label: l10n.apr.over,
								value: 'over',
								icon: 'contact-over-field'
							},
							{
								label: l10n.apr.inline,
								value: 'inline',
								icon: 'contact-inline-field'
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
						type: 'Radios',
						className: 'inline-radios plaintext-settings',
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

	

	var smtp_secure = {
		type: 'SettingsItem',
		title: l10n.smtp.secure,
		className: 'general_settings_item',
		fields: [
			{
				type: 'Radios',
				className: 'inline-radios plaintext-settings',
				property: 'smtp_secure',
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
			}
		]
	};

	var smtp_authentication = {
		type: 'SettingsItem',
		title: l10n.smtp.authentication,
		className: 'general_settings_item',
		fields: [
			{
				type: 'Radios',
				className: 'inline-radios plaintext-settings',
				property: 'smtp_authentication',
				values: [
					{
						label: l10n.smtp.no,
						value: 'no'
					},
					{
						label: l10n.smtp.yes,
						value: 'yes'
					}
				]
			},
			{
				type: 'Text',
				property: 'smtp_username',
				label: l10n.smtp.username
			},
			{
				type: 'Text',
				property: 'smtp_password',
				label: l10n.smtp.password
			}
		]
	};

	var AppearancePanel = {
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
						single: false,
						abccolors: [
							{
								name: 'static-field-bg',
								label: l10n.field_bg_label
							},
							{
								name: 'static-button-bg',
								label: l10n.button_bg_label
							},
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
							color: 'static-font-color',
						},
						default_element: "field-labels",
						elements: [
							{ label: l10n.field_labels_label, value: "field-labels" },
							{ label: l10n.field_values_label, value: "field-values" },
							{ label: l10n.button_label, value: "button" },
						],
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
							color: 'static-fields-bordercolor',
						},
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
							color: 'static-button-bordercolor',
						},
					}
				}
			],

			Hover: [
				{
					moduleType: 'Colors',
					options: {
						title: l10n.colors_label,
						multiple: false,
						single: false,
						toggle: true,
						prepend: 'hover-',
						prefix: 'static',
						fields: {
							use: 'hover-use-color',
						},
						abccolors: [
							{
								name: 'hover-field-bg',
								label: l10n.field_bg_label
							},
							{
								name: 'hover-button-bg',
								label: l10n.button_bg_label
							},
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
							color: 'hover-font-color',
						},
						default_element: "field-labels",
						elements: [
							{ label: l10n.field_labels_label, value: "field-labels" },
							{ label: l10n.field_values_label, value: "field-values" },
							{ label: l10n.button_label, value: "button" },
						],
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
							color: 'hover-fields-bordercolor',
						},
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
							color: 'hover-button-bordercolor',
						},
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
							easing: 'hover-transition-easing',
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
						single: false,
						toggle: true,
						prepend: 'focus-',
						prefix: 'static',
						fields: {
							use: 'focus-use-color',
						},
						abccolors: [
							{
								name: 'focus-field-bg',
								label: l10n.field_bg_label
							},
							{
								name: 'focus-button-bg',
								label: l10n.button_bg_label
							},
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						title: l10n.typography_label,
						state: 'focus',
						prepend: 'focus-',
						prefix: 'static',
						toggle: true,
						fields: {
							use: 'focus-use-typography',
							typeface: 'focus-font-family',
							fontstyle: 'focus-font-style',
							weight: 'focus-weight',
							style: 'focus-style',
							size: 'focus-font-size',
							line_height: 'focus-line-height',
							color: 'focus-font-color',
						},
						default_element: "field-labels",
						elements: [
							{ label: l10n.field_values_label, value: "field-values" },
							{ label: l10n.button_label, value: "button" },
						],
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'focus-fields',
						title: '',
						label: 'Fields Border',
						prepend: 'focus-',
						prefix: 'static',
						fields: {
							use: 'focus-fields-useborder',
							width: 'focus-fields-borderwidth',
							type: 'focus-fields-bordertype',
							color: 'focus-fields-bordercolor',
						},
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
	};

	var SMTPAuthenticationSettings = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function(opts) {
			
			this.update_fields();
			//this.constructor.__super__.initialize.call(this, opts);
		},
		get_title: function() {
			return '';
		},
		update_fields: function(show) {
			
			var me = this;
			this.fields=_([]);
			
			if(typeof(show) !== 'undefined' && show === 'yes') {
				

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_username',
					label: l10n.smtp.username
				});

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: 'smtp_password',
					label: l10n.smtp.password
				});

	
			}

			if(typeof(show) !== 'undefined') {
				me.$el.html('');
				me.render();
			}
		}
	});



	var SMTPSpecificSettings = Upfront.Views.Editor.Settings.Item.extend({

		initialize: function(opts) {
			console.log('initializing');
			this.authentication = opts.authentication;
			this.update_fields();

			//this.constructor.__super__.initialize.call(this, opts);
		},
		get_title: function() {
			return '';
		},
		update_fields: function(show) {
			console.log('update fields');
			var me = this;
			this.fields=_([]);
			
			if(typeof(show) !== 'undefined' && show === 'yes') {
				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Email({
					model: this.model,
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

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					className: 'inline-radios plaintext-settings',
					property: 'smtp_secure',
					label: l10n.smtp.secure,
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

				this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					className: 'inline-radios plaintext-settings',
					property: 'smtp_authentication',
					label: l10n.smtp.authentication,
					values: [
						{
							label: l10n.smtp.no,
							value: 'no'
						},
						{
							label: l10n.smtp.yes,
							value: 'yes'
						}
					],
					change: function(value) {
						me.authentication.update_fields(value);
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
			Appearance: AppearancePanel
		},
		initialize: function (opts) {
			var me = this;
			// Call the super constructor here, so that the appearance panel is instantiated
			this.constructor.__super__.initialize.call(this, opts);

			var panel = new RootSettingsPanel({
				model: this.model,
				label: 'Empty label',
				title: l10n.smtp.label,
			});

			/*var smtp_configuration = new SMTPSpecificSettings({
				model: this.model,
				title: l10n.smtp.configuration,
				className: 'general_settings_item',
				fields: [
					new Upfront.Views.Editor.Field.Email({
						model: this.model,
						property: 'smtp_from_email',
						label: l10n.smtp.from_email
					}),
					new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: 'smtp_from_name',
						label: l10n.smtp.from_name
					}),
					new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: 'smtp_host',
						label: l10n.smtp.host
					}),
					new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: 'smtp_port',
						label: l10n.smtp.port
					})
				]
			});
			*/
			
			
			var smtp_authentication = new SMTPAuthenticationSettings({model: this.model});
			var smtp_configuration = new SMTPSpecificSettings({model: this.model, authentication: smtp_authentication});


			var smtp_enable = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.smtp.enable,
				className: 'general_settings_item',
				fields: [
					new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'smtp_enable',
						className: 'inline-radios plaintext-settings',
						values: [
							{
								label: l10n.smtp.no,
								value: 'no'
							},
							{
								label: l10n.smtp.yes,
								value: 'yes'
							}
						],
						change: function(value) {
							smtp_configuration.update_fields(value);
						}

					}),
				]
			});

			panel.settings = _([smtp_enable, smtp_configuration, smtp_authentication]);

			console.log('adding to the panels');
			this.panels = _.extend({SMTPPanel: panel}, this.panels);

			/*if(this.model.get_property_value_by_name('smtp_enable') === 'yes') {
				panel.settings.push(smtp_configuration);

			}
			
			this.panels = _.extend({SMTPPanel: panel}, this.panels);
			*/
			//smtp_enable

			/*this.panels.SMTP.prototype.settings = [smtp_enable];

			if(this.model.get_property_value_by_name('smtp_enable') === 'yes') {
				this.panels.SMTP.prototype.settings.push(smtp_configuration);
				this.panels.SMTP.prototype.settings.push(smtp_secure);
				this.panels.SMTP.prototype.settings.push(smtp_authentication);
			}

			console.log(this.panels.SMTP.prototype.settings);
			*/
			
		},
		title: 'Contact Element'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('contact', styleTpl);

	return ContactFormSettings;
});
