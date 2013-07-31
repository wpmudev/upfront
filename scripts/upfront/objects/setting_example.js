(function ($) {

var SettingExampleModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "SettingExampleModel");
		this.init_property("view_class", "SettingExampleView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("settingexample-object"));
		this.init_property("class", "c22");
		this.init_property("has_settings", 1);
	}
});

var SettingExampleView = Upfront.Views.ObjectView.extend({
	
	get_content_markup: function () {
		return '<p>Example element to showcase settings</p>';
	}
	
});

var SettingExampleElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
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

// Settings - load widget list first before adding object


var SettingExampleSetting_Item1 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
			new Upfront.Views.Editor.Field.Text({
				model: this.model,
				property: 'field_text',
				label: "Example text input",
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
		]);
	},
	
	get_title: function () {
		return "Example group of texts";
	}
	
});
		
var SettingExampleSettingsPanel1 = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new SettingExampleSetting_Item1({model: this.model}),
		]);
	},

	get_label: function () {
		return "Texts";
	},

	get_title: function () {
		return "Text and textarea settings";
	}
});

var SettingExampleSetting_Item2 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
			new Upfront.Views.Editor.Field.Select({
				model: this.model,
				property: 'field_select',
				label: "Example select",
				values: [
					{ label: "Options 1", value: 'options1' },
					{ label: "Options 2", value: 'options2' },
					{ label: "Options 3", value: 'options3' },
					{ label: "Options 4", value: 'options4', disabled: true },
					{ label: "Options 5", value: 'options5' }
				]
			}),
			new Upfront.Views.Editor.Field.Select({
				model: this.model,
				property: 'field_select2',
				label: "Example multiple select",
				multiple: true,
				values: [
					{ label: "Options 1", value: 'options1' },
					{ label: "Options 2", value: 'options2' },
					{ label: "Options 3", value: 'options3' },
					{ label: "Options 4", value: 'options4', disabled: true },
					{ label: "Options 5", value: 'options5' }
				]
			})
		]);
	},
	
	get_title: function () {
		return "Example group selects";
	}
	
});
		
var SettingExampleSettingsPanel2 = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new SettingExampleSetting_Item2({model: this.model}),
		]);
	},

	get_label: function () {
		return "Selects";
	},

	get_title: function () {
		return "Select settings";
	}
});

var SettingExampleSetting_Item3 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
		]);
	},
	
	get_title: function () {
		return "Example radios group";
	}
	
});

var SettingExampleSetting_Item3_2 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
		]);
	},
	
	get_title: function () {
		return "Example checkboxes group";
	}
	
});
		
var SettingExampleSettingsPanel3 = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new SettingExampleSetting_Item3({model: this.model}),
			new SettingExampleSetting_Item3_2({model: this.model}),
		]);
	},

	get_label: function () {
		return "Multiple 1";
	},

	get_title: function () {
		return "Radio and checkbox settings";
	}
});


var SettingExampleSetting_Item4 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
		]);
	},
	
	get_title: function () {
		return "Example radios group";
	}
	
});

var SettingExampleSetting_Item4_2 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
		]);
	},
	
	get_title: function () {
		return "Example checkboxes group";
	}
	
});

var SettingExampleSetting_Item4_3 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
		]);
	},
	
	get_title: function () {
		return "Example radios group";
	}
	
});

var SettingExampleSetting_Item4_4 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
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
			})
		]);
	},
	
	get_title: function () {
		return "Example checkboxes group";
	}
	
});
		
var SettingExampleSettingsPanel4 = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new SettingExampleSetting_Item4({model: this.model}),
			new SettingExampleSetting_Item4_2({model: this.model}),
			new SettingExampleSetting_Item4_3({model: this.model}),
			new SettingExampleSetting_Item4_4({model: this.model}),
		]);
	},

	get_label: function () {
		return "Multiple 2";
	},

	get_title: function () {
		return "Radio and checkbox settings 2";
	}
});


var SettingExampleSetting_Item5 = Upfront.Views.Editor.Settings.Item.extend({
	
	initialize: function (){
		this.fields = _([
			new Upfront.Views.Editor.Field.Number({
				model: this.model,
				property: 'field_number',
				label: "Example number",
				suffix: "sec",
				min: 5,
				max: 60,
				step: 5,
				default_value: 30
			})
		]);
	},
	
	get_title: function () {
		return "Example number";
	}
	
});
		
var SettingExampleSettingsPanel5 = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new SettingExampleSetting_Item5({model: this.model}),
		]);
	},

	get_label: function () {
		return "Number";
	},

	get_title: function () {
		return "Number settings";
	}
});

var SettingExampleSettings = Upfront.Views.Editor.Settings.Settings.extend({
	
	initialize: function () {
		this.panels = _([
			new SettingExampleSettingsPanel1({model: this.model}),
			new SettingExampleSettingsPanel2({model: this.model}),
			new SettingExampleSettingsPanel3({model: this.model}),
			new SettingExampleSettingsPanel4({model: this.model}),
			new SettingExampleSettingsPanel5({model: this.model}),
		]);
	},


	get_title: function () {
		return "Widget settings";
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


})(jQuery);