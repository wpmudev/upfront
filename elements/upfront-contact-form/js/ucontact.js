(function($) {

var UcontactModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "UcontactModel");
		this.init_property("view_class", "UcontactView");

		this.init_property("element_id", Upfront.Util.get_unique_id("ucontact-object"));
		this.init_property("class", "c34 upfront-contact-form");
		this.init_property("has_settings", 1);

		this.init_property("form_add_title", false);
		this.init_property("form_name_label", 'Your name:');
		this.init_property("form_email_label", 'Your email:');
		this.init_property("show_subject", false);
		this.init_property("form_subject", 'form_default_subject');
		this.init_property("form_subject_label", 'Your subject:');
		this.init_property("form_default_subject", 'Sent from the website');
		this.init_property("form_message_label", 'Your message:');
		this.init_property("form_button_text", 'Send');
		this.init_property("form_email_to", 'admin@' + location.host);

		this.init_property("form_label_position", 'above');
		this.init_property("form_style", 1);
		this.init_property("form_use_icons", 1);
	}
});

var UcontactView = Upfront.Views.ObjectView.extend({
	get_content_markup: function() {
		var markup = this.property_value('form_add_title') ? '<div class="upfront-contact-form-title">' + this.property_value('form_add_title') + '</div>' : '',
			fieldClasses = this.getFieldStyleClass()
		;
		
		//Set the subject depending on the model value
		this.set_subject_property();

		

		//Set for
		
		markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="name">' + this.property_value('form_name_label') + '</label>' +
			'<input type="text" class="text-field" name="name" ' + this.getPlaceholder('form_name_label') + ' />' +
		'</div>' +
		'<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="email">' + this.property_value('form_email_label') + '</label>' +
			'<input type="email" class="email-field" name="email" ' + this.getPlaceholder('form_email_label') + ' />' +
		'</div>';
		if(this.property_value('show_subject'))
			markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="subject">' + this.property_value('form_subject_label') + '</label>' +
			'<input type="text" class="text-field" name="subject" ' + this.getPlaceholder('form_subject_label') + ' />' +
		'</div>';

		markup += '<div class="upfront-field-container ' + fieldClasses + '">' +
			'<label for="message">' + this.property_value('form_message_label') + '</label>' +
			'<textarea class="textarea-field" name="message" ' + this.getPlaceholder('form_message_label') + '></textarea>' +
		'</div>' +
		'<div class="upfront-field-container upfront-submit-container ' + fieldClasses + '">' +
			'<input type="submit" name="send" value="' + this.property_value('form_button_text') + '" class="button submit-field">' +
		'</div>';

		return markup;
	},

	property_value: function(property){
		return this.model.get_property_value_by_name(property);
	},

	set_subject_property: function(){
		var subject = this.property_value('form_subject'),
			showSubject = false,
			subjectParts = [];
		if(subject){
			subjectParts = subject.split('::');
			if(subjectParts.length == 2){
				if(subjectParts[0] == 'form_subject_label'){
					this.model.set_property('show_subject', true);
					this.model.set_property('form_subject_label', subjectParts[1]);
				}
				else
					this.model.set_property('show_subject', false);
			}
		}
		else
			this.model.set_property('show_subject', false);
	},

	getFieldStyleClass: function () {
		var style = this.property_value('form_style'),
			classes = 'ucontact-label-' + this.property_value('form_label_position');

		//Field style
		classes = style ? classes + ' ucontact-field_style-' + style : classes;

		//With icons
		return this.property_value('form_use_icons') ? classes + ' ucontact-field-icons' : classes;
	},

	getPlaceholder: function (field) {
		if(this.property_value('form_label_position') == 'over')
			return 'placeholder="' + this.property_value(field)  + '"';
		return '';
	}
});

var UcontactElement = Upfront.Views.Editor.Sidebar.Element.extend({
	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-contact');
		this.$el.html('Contact Form');
	},

	add_element: function() {
		var object = new UcontactModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-contact_form_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our contact form object model
				]
			})
		;
		this.add_module(module);
	}
});


var UcontactFieldSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		this.settings = _([
			new UcontactField_Optional({
				model: this.model,
				field_title: 'Form fields setup',
				field_name: 'form_add_title',
				field:	new UcontactField_Text({
					model: this.model,
					field_name: 'form_title',
					field_label: 'Contact form title:',
					field_value: this.model.get_property_value_by_name('form_add_title')
				}) 
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_name_label',
				field_label: 'Name Field Text:',
				field_value: this.model.get_property_value_by_name('form_name_label')
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_email_label',
				field_label: 'Email Field Text:',
				field_value: this.model.get_property_value_by_name('form_email_label')
			}),
			new UcontactField_Radio({
				model: this.model,
				field_label: false,
				field_name: 'form_subject',
				field_options: [
					new UcontactField_Text({
						model: this.model,
						field_name: 'form_subject_label',
						field_label: 'Subject Field Text:',
						field_value: this.model.get_property_value_by_name('form_subject_label')
					}),
					new UcontactField_Text({
						model: this.model,
						field_name: 'form_default_subject',
						field_label: 'Default subject to:',
						field_value: this.model.get_property_value_by_name('form_default_subject')
					})
				]
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_message_label',
				field_label: 'Message Field Text:',
				field_value: this.model.get_property_value_by_name('form_message_label')
			}),
			new UcontactField_Text({
				model: this.model,
				field_name: 'form_button_text',
				field_label: 'Send Button Text:',
				field_value: this.model.get_property_value_by_name('form_button_text')
			}),
			new UcontactField_Text({
				model: this.model,
				field_title: 'Form Actions',
				field_name: 'form_email_to',
				field_label: 'Send results to:',
				field_value: 'admin@' + location.host
			}),
			new UcontactField_Radio({
				model: this.model,
				field_name: 'form_validate_when',
				field_label: 'Validate form when:',
				field_options: [
					{label: 'Each field is filled out', value: 'field'},
					{label: 'Once send field button is clicked', value: 'submit'}
				]
			})
		]);
	},

	/**
	 * Label for the settings tab
	 * @return {String} The desired text for that tab.
	 */
	get_label: function () {
		return "Form fields";
	},

	/**
	 * Title for the field settings panel.
	 * @return {String} The title for the panel
	 */
	get_title: function () {
		return "Contact form fields"
	}
});

var UcontactAppearanceSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		this.settings = _([
			new UcontactField_Radio({
				model: this.model,
				field_name: 'form_label_position',
				field_title: 'Field label position:',
				field_options: [
					{label: 'Above field', value: 'above'},
					{label: 'Over the field', value: 'over'},
					{label: 'Inline with field', value: 'inline'}
				]
			}),
			new UcontactField_Select({
				model: this.model,
				field_name: 'form_style',
				field_title: 'Form field style:',
				field_options: [
					{label: 'Theme style 01', value: '1'},
					{label: 'Theme style 02', value: '2'},
					{label: 'Theme style 03', value: '3'}
				]
			}),
			new UcontactField_Optional({
				model: this.model,
				field_name: 'form_use_icons',
				field: 'Use icons'
			})
		]);
	},

	get_label: function () {
		return "Appearance";
	},

	get_title: function () {
		return "Contact form appearance";
	}
});
var UcontactField_Text = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function(attrs){
		this.options = attrs;
	},
	render: function () {
		if(this.options.field_title)
			this.wrap({
				title: this.options.field_title,
				markup: this.get_markup()
			});
		else
			this.$el.append(this.get_markup());
	},

	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.options.field_name) || this.options.field_value;
		value = value || '';
		return '<label for="' + this.options.field_name + '">' + this.options.field_label + '</label>' +
			'<input type="text" name="' + this.options.field_name + '" value="' + value + '" />';
	},

	get_name: function() {
		return this.options.field_name;
	},

	get_value: function() {
		return this.$el.find('input[name="' + this.options.field_name + '"]').val();
	},
	get_label: function() {
		return this.options.field_label;
	}
});

var UcontactField_Radio = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function (attrs) {
		this.options = attrs.field_options ? attrs.field_options : false;
		this.field_title = attrs.field_title ? attrs.field_title : false;
		this.field_name = attrs.field_name;
		this.field_label = attrs.field_label;
	},
	render: function () {
		if(this.field_title)
			this.wrap({
				title: this.field_title,
				markup: this.get_markup()
			});
		else
			this.$el.append(this.get_markup());
	},
	get_markup: function (attrs) {
		var markup = this.field_label ? '<label for="' + this.field_name + '">' + this.field_label + '</label>' : '',
			option = false
		;

		this.parse_value();
		
		for (var i = 0; i < this.options.length; i++) {
			var radioData = {extra: '', checked: ''},
				option = this.options[i]
			;
			if(option instanceof UcontactField_Text){
				radioData.label = option.get_label();
				radioData.extra = '<div class="upfront-radio-innerinput">' + option.get_markup() + '</div>';
				radioData.value = option.get_name();
			}
			else {
				radioData.label = option.label,
				radioData.value = option.value ? option.value : i;
			}
			if(radioData.value == this.field_value || i == 0 && !this.field_value)
				radioData.checked = 'checked="checked"';

			markup += '<input type="radio" name="' + this.field_name + '" value="' + radioData.value  +'" '+ radioData.checked +' />' + radioData.label + radioData.extra;
		};

		return markup;
	},

	get_name: function() {
		return this.field_name;
	},

	get_value: function() {
		var radioChecked = this.$el.find('input[type=radio]:checked'),
			value = radioChecked.length ? radioChecked.val() : false,
			subfield = false
		;

		if(!value)
			return false;

		subfield = radioChecked.siblings('.upfront-radio-innerinput');

		if(subfield.length)
			return value + '::' + subfield.find('input').val();

		return value;
	},

	parse_value: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			valueParts = []
		;
		if(value){
			valueParts = value.split('::');
			if(valueParts.length == 2){
				this.field_value = valueParts[0];
				this.field_subfield_value = valueParts[1];
			}
			else
				this.field_value = value;
		}
	}
})

var UcontactField_Optional = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function (attrs) {
		this.field_name = attrs.field_name;
		this.field_title = attrs.field_title;
		this.optional_field = attrs.field;
	},
	render: function () {
		if(this.field_title)
			this.wrap({
				title: this.field_title,
				markup: this.get_markup()
			});
		else
			this.$el.append(this.get_markup());
	},
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			checked = value ? 'checked="checked"' : '',
			markup = '<input type="checkbox" value="1" name="' + this.field_name + '" ' + checked + ' />'
		;
		//If all the fields extended the same parent view, we could use any kind of field
		//to be optional, for now, only text fields are allowed
		if(this.optional_field instanceof UcontactField_Text)
			return markup + this.optional_field.get_markup();

		//If not a actual field, we use the string as a label for the checkbox
		return markup + '<label for="' + this.field_name  + '">' + this.optional_field + '</label>';
	},
	get_name: function() {
		return this.field_name;
	},
	get_value: function(){
		var checkbox = this.$el.find('input[name=' + this.field_name + ']');
		if(!checkbox.length || !checkbox.is(':checked'))
			return 0; // Not checked;
		if(this.optional_field instanceof UcontactField_Text)
			return this.$el.find('input[name=' + this.optional_field.get_name() + ']').val();
		return 1; 
	}
});

var UcontactField_Select = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function (attrs) {
		this.field_name = attrs.field_name;
		this.field_title = attrs.field_title;
		this.field_options = attrs.field_options;
	},
	render: function () {
		if(this.field_title)
			this.wrap({
				title: this.field_title,
				markup: this.get_markup()
			});
		else
			this.$el.append(this.get_markup());
	},
	get_markup: function () {
		var value = this.model.get_property_value_by_name(this.field_name),
			markup = this.field_label ? '<label for="' + this.field_name + '">' + this.field_label + '</label>' : ''
		;

		markup += '<select name="' + this.field_name + '">';

		for (var i = 0; i < this.field_options.length; i++) {
			var option = this.field_options[i],
				selected = value == option.value ? 'selected="selected"' : false;

			markup += '<option value="' + option.value + '" ' + selected + '>' + option.label + '</option>';

		};

		return markup + '</select>';
	},
	get_name: function() {
		return this.field_name;
	},
	get_value: function(){
		return this.$el.find('select').val();
	}
});


var UcontactSettings = Upfront.Views.Editor.Settings.Settings.extend({
	initialize: function() {
		this.panels = _([
			new UcontactFieldSettingsPanel({model: this.model}),
			new UcontactAppearanceSettingsPanel({model: this.model})
		]);
	},

	get_title: function () {
		return "Contact form settings";
	}
});


// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("Ucontact", {
	"Model": UcontactModel, 
	"View": UcontactView,
	"Element": UcontactElement,
	"Settings": UcontactSettings
});

Upfront.Models.UcontactModel = UcontactModel;
Upfront.Views.UcontactView = UcontactView;


})(jQuery);