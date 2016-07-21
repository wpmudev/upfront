(function ($) {

define(function() {
var SettingExampleModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "SettingExampleModel");
		this.init_property("view_class", "SettingExampleView");

		this.init_property("element_id", Upfront.Util.get_unique_id("settingexample-object"));
		this.init_property("class", "c24");
		this.init_property("has_settings", 1);
	}
});

var SettingExampleView = Upfront.Views.ObjectView.extend({

	get_content_markup: function () {
		return 'Setting example here :)';
	}

});

var SettingExampleElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: true,
	render: function () {
		this.$el.html('Setting Example');
	},

	add_element: function () {
		var object = new SettingExampleModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-settingexample_module"},
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


var SettingExampleSettings = Upfront.Views.Editor.Settings.Settings.extend({

	initialize: function () {
		this.panels = _([

			// Text and textarea
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Texts",
				title: "Text and textarea settings",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example group of texts",
						fields: [
							new Upfront.Views.Editor.Field.Text({
								model: this.model,
								property: 'field_text',
								label: "Example text input",
								placeholder: "Some text...",
								default_value: "Default"
							}),
							new Upfront.Views.Editor.Field.Text({
								model: this.model,
								property: 'field_text2',
								label: "Example text input",
								compact: true
							}),
							new Upfront.Views.Editor.Field.Textarea({
								model: this.model,
								property: 'field_textarea',
								label: "Example textarea"
							}),
							new Upfront.Views.Editor.Field.Textarea({
								model: this.model,
								property: 'field_textarea2',
								label: "Example textarea",
								compact: true
							})
						]
					})
				]
			}),

			// Selects
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Selects",
				title: "Select settings",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example group selects",
						fields: [
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select',
								label: "Example select",
								values: [
									{ label: "Options 1", value: 'options1' },
									{ label: "Options 2 Options 2", value: 'options2' },
									{ label: "Options 3", value: 'options3' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							}),
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select2',
								label: "Example multiple select",
								select_label: "Choose options",
								multiple: true,
								values: [
									{ label: "Options 1", value: 'options1' },
									{ label: "Options 2 Options 2", value: 'options2' },
									{ label: "Options 3", value: 'options3' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example group selects (icon)",
						fields: [
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select3',
								label: "Example select",
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2 Options 2", value: 'options2', icon: 'contact-over-field' },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							}),
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select4',
								label: "Example multiple select",
								select_label: "Choose options",
								multiple: true,
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2 Options 2", value: 'options2', icon: 'contact-over-field' },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example group selects (zebra)",
						fields: [
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select5',
								label: "Example select",
								style: 'zebra',
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2 Options 2 Options 2 Options 2", value: 'options2', icon: 'contact-over-field' },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							}),
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'field_select6',
								label: "Example multiple select",
								select_label: "Choose options",
								style: 'zebra',
								multiple: true,
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2 Options 2", value: 'options2', icon: 'contact-over-field' },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' },
									{ label: "Options 4", value: 'options4', disabled: true },
									{ label: "Options 5", value: 'options5' }
								]
							})
						]
					})
				]
			}),

			// Radio and checkbox 1
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Multiple 1",
				title: "Radio and checkbox settings",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example radios group",
						fields: [
							new Upfront.Views.Editor.Field.Radios({
								model: this.model,
								property: 'field_radios',
								label: "",
								values: [
									{ label: "Options 1", value: 'options1' },
									{ label: "Options 2", value: 'options2', disabled: true },
									{ label: "Options 3", value: 'options3' }
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example checkboxes group",
						fields: [
							new Upfront.Views.Editor.Field.Checkboxes({
								model: this.model,
								property: 'field_checkboxes',
								label: "",
								values: [
									{ label: "Options 1", value: 'options1' },
									{ label: "Options 2", value: 'options2', disabled: true },
									{ label: "Options 3", value: 'options3' },
									{ label: "Options 4 Options 4 Options 4 Options 4", value: 'options4' }
								]
							})
						]
					})
				]
			}),

			// Radio and checkbox 2
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Multiple 2",
				title: "Radio and checkbox settings 2",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example radios group (icon)",
						fields: [
							new Upfront.Views.Editor.Field.Radios({
								model: this.model,
								property: 'field_radios2',
								label: "",
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example checkboxes group (icon)",
						fields: [
							new Upfront.Views.Editor.Field.Checkboxes({
								model: this.model,
								property: 'field_checkboxes2',
								label: "",
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' },
									{ label: "Options 4 Options 4 Options 4 Options 4", value: 'options4' }
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example radios group (vertical)",
						fields: [
							new Upfront.Views.Editor.Field.Radios({
							model: this.model,
							property: 'field_radios3',
							label: "",
							layout: "vertical",
							values: [
								{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
								{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
								{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
							]
						})
						]
					}),
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example checkboxes group (vertical)",
						fields: [
							new Upfront.Views.Editor.Field.Checkboxes({
								model: this.model,
								property: 'field_checkboxes3',
								label: "",
								layout: "vertical",
								values: [
									{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
									{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
									{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
								]
							}),
							new Upfront.Views.Editor.Field.Checkboxes({
								model: this.model,
								property: 'field_checkboxes4',
								label: "",
								values: [
									{ label: "Single options", value: 'options1' }
								]
							})
						]
					})
				]
			}),

			// Number
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Number",
				title: "Number settings",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example number",
						fields: [
							new Upfront.Views.Editor.Field.Number({
								model: this.model,
								property: 'field_number',
								label: "Example number",
								label_style: 'inline',
								suffix: "sec",
								min: 5,
								max: 60,
								step: 5,
								default_value: 30
							})
						]
					})
				]
			}),

			// Suggest list
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Suggest",
				title: "Input with suggestion",
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Example suggest",
						fields: [
							new Upfront.Views.Editor.Field.Multiple_Suggest({
								model: this.model,
								property: 'field_suggest',
								label: "Example Suggest Field",
								placeholder: "Type here...",
								source: [
									"Busses and Transport",
									"Business",
									"Online Business",
									"e-business",
									"Marketplace",
									"Transportation",
									"Train"
								]
							})
						]
					})
				]
			}),

			// Tabbed
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Tabbed",
				title: "Tabbed settings",
				tabbed: true,
				settings: [
					new Upfront.Views.Editor.Settings.ItemTabbed({
						model: this.model,
						title: "Example tab",
						settings: [
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Text({
										model: this.model,
										property: 'field_text5',
										label: "Example text input"
									}),
									new Upfront.Views.Editor.Field.Select({
										model: this.model,
										property: 'field_select7',
										label: "Example select",
										values: [
											{ label: "Options 1", value: 'options1' },
											{ label: "Options 2 Options 2", value: 'options2' },
											{ label: "Options 3", value: 'options3' },
											{ label: "Options 4", value: 'options4', disabled: true },
											{ label: "Options 5", value: 'options5' }
										]
									})
								]
							}),
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Number({
										model: this.model,
										property: 'field_number2',
										label: "Example number",
										label_style: 'inline',
										suffix: "sec",
										min: 5,
										max: 60,
										step: 5,
										default_value: 30
									}),
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'field_radios4_1',
										label: "",
										layout: "vertical",
										values: [
											{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
											{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
											{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
										]
									})
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.ItemTabbed({
						model: this.model,
						title: "Example tab 2",
						settings: [
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'field_radios4',
										label: "",
										layout: "vertical",
										values: [
											{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
											{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
											{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
										]
									})
								]
							})
						]
					})
				]
			}),

			// Radio tab with icon
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Radio tab",
				title: "Radio tabbed settings",
				tabbed: true,
				settings: [
					new Upfront.Views.Editor.Settings.ItemTabbed({
						model: this.model,
						title: "Example radio tab",
						radio: true,
						icon: "contact-above-field",
						property: 'radio_tabbed', // property value must be the same between radio tab
						value: 'options1', // value means the value stored to property when this tab is selected
						is_default: true, // set this tab as default (required)
						settings: [
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'field_radios5_1',
										label: "",
										layout: "horizontal-inline",
										values: [
											{ label: "", value: 'options1', icon: 'social-count-horizontal' },
											{ label: "", value: 'options2', icon: 'social-count-vertical' }
										]
									})
								]
							}),
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'field_radios5',
										label: "",
										values: [
											{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
											{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
											{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
										]
									})
								]
							})
						]
					}),
					new Upfront.Views.Editor.Settings.ItemTabbed({
						model: this.model,
						title: "Example radio tab 2",
						radio: true,
						icon: "contact-over-field",
						property: 'radio_tabbed',
						value: 'options2',
						settings: [
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: "Example group",
								fields: [
									new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'field_checkboxes5',
										label: "",
										values: [
											{ label: "Options 1", value: 'options1', icon: 'contact-above-field' },
											{ label: "Options 2", value: 'options2', icon: 'contact-over-field', disabled: true },
											{ label: "Options 3", value: 'options3', icon: 'contact-inline-field' }
										]
									})
								]
							})
						]
					})
				]
			})

			// end Panels array
		]);
	},


	get_title: function () {
		return "Example settings";
	}
});



Upfront.Application.LayoutEditor.add_object("SettingExample", {
	"Model": SettingExampleModel,
	"View": SettingExampleView,
	"Element": SettingExampleElement,
	"Settings": SettingExampleSettings
});
Upfront.Models.SettingExampleModel = SettingExampleModel;
Upfront.Views.SettingExampleView = SettingExampleView;


});
})(jQuery);
